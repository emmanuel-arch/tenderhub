"""Kenya Red Cross Society (KRCS) tenders scraper.

Source: https://redcross.or.ke/tenders/
Uses Playwright to bypass 403 blocks and render the WordPress page.
Extracts tender number, title, posted/closing dates and document links.
SharePoint/OneDrive viewer URLs are converted to direct-download URLs.
Only open (non-expired) tenders are returned.

Run standalone:
    python scrape_redcross.py
"""

import logging
import re
from datetime import datetime
from urllib.parse import urlparse, parse_qs, quote, unquote

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

log = logging.getLogger(__name__)

SOURCE = "redcross"
PROCURING_ENTITY = "Kenya Red Cross Society (KRCS)"
REDCROSS_URL = "https://redcross.or.ke/tenders/"

LOAD_TIMEOUT = 60_000
PAGE_WAIT_MS = 5_000


# ── Date helpers ──────────────────────────────────────────────────────────────

def _parse_date(text: str) -> datetime | None:
    if not text:
        return None
    text = text.strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d %B %Y",
                "%B %d, %Y", "%d %b %Y", "%d/%m/%y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _is_expired(close_dt: datetime | None) -> bool:
    if close_dt is None:
        return False
    return close_dt < datetime.now()


# ── URL converter ─────────────────────────────────────────────────────────────

def convert_to_direct_download(url: str) -> str:
    """Convert SharePoint/OneDrive/Google Drive viewer URLs to direct download URLs.

    SharePoint personal-OneDrive viewer format:
        https://TENANT-my.sharepoint.com/personal/USER/_layouts/15/onedrive.aspx
            ?id=%2Fpersonal%2FUSER%2FDocuments%2FTenders%2FFILE.pdf&...

    Direct download format:
        https://TENANT-my.sharepoint.com/personal/USER/_layouts/15/download.aspx
            ?SourceUrl=%2Fpersonal%2FUSER%2FDocuments%2FTenders%2FFILE.pdf
    """
    if not url:
        return url

    # Already a direct PDF download
    low = url.lower()
    if low.endswith(".pdf") and "sharepoint.com" not in low and "onedrive" not in low:
        return url

    # ── Google Drive ──────────────────────────────────────────────────────────
    gd = re.search(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)", url)
    if gd:
        return f"https://drive.google.com/uc?export=download&id={gd.group(1)}&confirm=t"

    # ── SharePoint personal OneDrive viewer ───────────────────────────────────
    if "sharepoint.com" in url and "onedrive.aspx" in url:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        file_path = (params.get("id") or [None])[0]
        if file_path:
            # Decode then re-encode safely
            decoded_path = unquote(file_path)
            encoded_path = quote(decoded_path, safe="/")
            base = f"{parsed.scheme}://{parsed.netloc}"
            return f"{base}/_layouts/15/download.aspx?SourceUrl={encoded_path}"

    # ── SharePoint file URL (not viewer) ─────────────────────────────────────
    if "sharepoint.com" in url and "download.aspx" not in url:
        sep = "&" if "?" in url else "?"
        return url + sep + "download=1"

    # ── OneDrive live.com share links ─────────────────────────────────────────
    if "onedrive.live.com" in url:
        # Replace /view with /download
        return url.replace("/view?", "/download?").replace("/view", "/download")

    return url


# ── Scraper ───────────────────────────────────────────────────────────────────

def _extract_tenders_from_html(html: str) -> list[dict]:
    """Parse the rendered Red Cross page HTML and extract tender records."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    tenders: list[dict] = []
    seen: set[str] = set()

    # ------------------------------------------------------------------
    # Red Cross tenders page structure (WordPress + Elementor):
    #
    # Each tender is typically in a widget/section block that contains:
    #   - A heading with "TENDER NO: XXXX"  (sometimes in a <p> or <h3>)
    #   - "Posted: DD/MM/YYYY"
    #   - "Closing: DD/MM/YYYY"
    #   - A Download <a> button whose href is a SharePoint link
    #
    # We scan all <a> tags whose text includes "Download", then walk up
    # the DOM to find the tender block and extract its metadata.
    # ------------------------------------------------------------------

    for a_tag in soup.find_all("a", href=True):
        link_text = a_tag.get_text(strip=True)
        if "download" not in link_text.lower():
            continue

        href = a_tag.get("href", "").strip()
        if not href:
            continue

        # Walk up to find the enclosing block (up to 8 levels)
        block = a_tag
        block_text = ""
        for _ in range(8):
            if block.parent is None:
                break
            block = block.parent
            candidate = block.get_text(" ", strip=True)
            # Stop when we have enough text to find tender metadata
            if len(candidate) > 80 and (
                "tender" in candidate.lower()
                or "closing" in candidate.lower()
                or "posted" in candidate.lower()
            ):
                block_text = candidate
                break

        # ── Extract tender number ──────────────────────────────────────
        tender_no_m = re.search(
            r"TENDER\s+NO[.:\s]+([A-Z0-9/_\-\.]+)",
            block_text, re.IGNORECASE
        )
        tender_no = tender_no_m.group(1).strip().rstrip(".") if tender_no_m else None

        # ── Extract title from nearest heading ─────────────────────────
        # Look inside the block for <h2/h3/h4>
        heading = None
        for tag in ["h2", "h3", "h4", "h5"]:
            found = block.find(tag)
            if found:
                heading = found.get_text(strip=True)
                break
        title = heading or tender_no or link_text

        if not title or title in seen:
            continue

        # ── Extract dates ──────────────────────────────────────────────
        close_m = re.search(
            r"[Cc]los(?:ing|ed)[:\s]+(\d{1,2}/\d{1,2}/\d{4})",
            block_text
        )
        close_dt = _parse_date(close_m.group(1)) if close_m else None

        # Skip expired
        if _is_expired(close_dt):
            log.debug("RedCross: skipping expired tender: %s (%s)",
                      title[:60], close_m.group(1) if close_m else "no date")
            continue

        posted_m = re.search(
            r"[Pp]osted[:\s]+(\d{1,2}/\d{1,2}/\d{4})",
            block_text
        )
        posted_dt = _parse_date(posted_m.group(1)) if posted_m else None

        # ── Convert document URL ───────────────────────────────────────
        doc_url = convert_to_direct_download(href)

        seen.add(title)
        tenders.append({
            "source": SOURCE,
            "external_id": tender_no,
            "title": title,
            "tender_number": tender_no,
            "procuring_entity": PROCURING_ENTITY,
            "deadline": close_dt,
            "category": "NGO",
            "sub_category": None,
            "summary": title,
            "description": None,
            "document_url": doc_url,
            "tender_notice_url": REDCROSS_URL,
            "bid_bond_required": False,
            "bid_bond_amount": 0,
            "document_release_date": posted_dt,
            "procurement_method": None,
            "start_date": posted_dt,
            "end_date": close_dt,
        })

    return tenders


def scrape_redcross() -> list[dict]:
    """Scrape open tenders from Kenya Red Cross website using Playwright."""
    log.info("Scraping Red Cross tenders from %s (Playwright)", REDCROSS_URL)
    tenders: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            extra_http_headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://redcross.or.ke/",
            },
        )
        page = ctx.new_page()

        try:
            page.goto(REDCROSS_URL, wait_until="networkidle", timeout=LOAD_TIMEOUT)
            page.wait_for_timeout(PAGE_WAIT_MS)
        except PwTimeout:
            log.warning("Red Cross: networkidle timed out, trying domcontentloaded")
            try:
                page.goto(REDCROSS_URL, wait_until="domcontentloaded", timeout=LOAD_TIMEOUT)
                page.wait_for_timeout(PAGE_WAIT_MS)
            except PwTimeout:
                log.error("Timed out loading Red Cross tenders page")
                browser.close()
                return tenders

        html = page.content()
        browser.close()

    tenders = _extract_tenders_from_html(html)
    log.info("RedCross: found %d open tenders", len(tenders))
    return tenders


# ── Standalone runner ─────────────────────────────────────────────────────────

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    )
    from db import save_tenders, get_tenders_needing_parsing, save_document_details
    from document_parser import parse_tender_document

    tenders = scrape_redcross()
    print(f"\nFound {len(tenders)} open Red Cross tenders")
    for t in tenders:
        print(f"  [{t.get('tender_number', 'N/A')}] {t['title'][:70]}")
        print(f"    Closes: {t['deadline']}")
        print(f"    Doc URL: {(t['document_url'] or '')[:100]}")

    inserted = save_tenders(tenders)
    print(f"\nInserted {inserted} new tenders into ScrapedTenders.")

    # Auto-parse documents for newly inserted tenders
    to_parse = get_tenders_needing_parsing(inserted or len(tenders), source=SOURCE)
    print(f"\nParsing documents for {len(to_parse)} tenders...")
    for t in to_parse:
        print(f"  Parsing: {t['title'][:60]}")
        parsed = parse_tender_document(t["document_url"])
        save_document_details(t["id"], parsed)
    print("Done.")


if __name__ == "__main__":
    main()
