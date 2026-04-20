"""KenGen Procurement Portal scraper.

Source: https://tenders.kengen.co.ke/all-tenders
Uses Playwright to navigate the React/Next.js SPA, switches to the
"Open Tenders" tab, then paginates through ALL pages collecting every
open (non-expired) tender.

Run standalone:
    python scrape_kengen_playwright.py
"""

import logging
import sys
from datetime import datetime

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

log = logging.getLogger(__name__)

SOURCE = "kengen"
PROCURING_ENTITY = "KenGen"
TENDER_URL = "https://tenders.kengen.co.ke/all-tenders"

# Playwright timing (ms)
LOAD_TIMEOUT = 60_000
PAGE_WAIT_MS = 3_500   # wait after each navigation/click
ROW_WAIT_MS = 10_000   # wait for rows selector

# Pagination button selectors to try in priority order
_NEXT_BTN_SELECTORS = [
    'button[aria-label="Go to next page"]',
    'button[aria-label="Next page"]',
    'button[aria-label="next"]',
    '[data-slot="pagination-next"]',
    'button[data-testid="pagination-next"]',
    # shadcn/ui uses ChevronRight icon inside the last pagination button
    'nav[aria-label="pagination"] li:last-child button',
    'nav[aria-label="pagination"] button:last-of-type',
    # Generic fallback
    'button:has-text("Next")',
    'button:has-text("›")',
    'a:has-text("Next")',
]

ROW_SELECTOR = 'tr[data-slot="table-row"]'


# ── Date helpers ──────────────────────────────────────────────────────────────

def _parse_dt(dtstr: str) -> datetime | None:
    """Parse KenGen date-time strings.
    Examples: '27/04/2026 2:00 pm', '27/04/2026 14:00', '27/04/2026'
    """
    if not dtstr:
        return None
    dtstr = dtstr.strip()
    for fmt in (
        "%d/%m/%Y %I:%M %p",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ):
        try:
            return datetime.strptime(dtstr, fmt)
        except ValueError:
            continue
    return None


def _is_expired(close_dt: datetime | None) -> bool:
    if close_dt is None:
        return False   # unknown → include
    return close_dt < datetime.now()


# ── Row parser ────────────────────────────────────────────────────────────────

def _parse_row(row, seen_ids: set) -> dict | None:
    """Extract a tender dict from a single table row element."""
    cols = row.query_selector_all('td[data-slot="table-cell"]')
    if len(cols) < 5:
        return None

    tender_no = cols[0].inner_text().strip()
    if not tender_no:
        return None

    # De-duplicate by tender number
    if tender_no in seen_ids:
        return None
    seen_ids.add(tender_no)

    # Title
    title_a = cols[1].query_selector("a")
    if title_a:
        title = (title_a.get_attribute("title") or title_a.inner_text()).strip()
    else:
        title = cols[1].inner_text().strip()

    # Category (col 2)
    category = cols[2].inner_text().strip() if len(cols) > 2 else ""

    # Open date (col 3)
    open_str = cols[3].inner_text().strip() if len(cols) > 3 else ""
    # Close date (col 4)
    close_str = cols[4].inner_text().strip() if len(cols) > 4 else ""

    open_dt = _parse_dt(open_str)
    close_dt = _parse_dt(close_str)

    if _is_expired(close_dt):
        return None   # caller will log if needed

    # Document / PDF link (col 5)
    doc_link = None
    if len(cols) > 5:
        for a_el in cols[5].query_selector_all("a"):
            href = (a_el.get_attribute("href") or "").strip()
            if not href:
                continue
            # Prefer PDF or Firebase storage links
            if ".pdf" in href.lower() or "storage" in href.lower() or "firebasestorage" in href:
                doc_link = href
                break
        if not doc_link:
            # Fallback: any link in col 5
            a_el = cols[5].query_selector("a")
            if a_el:
                doc_link = (a_el.get_attribute("href") or "").strip() or None

    if not title:
        return None

    return {
        "source": SOURCE,
        "external_id": tender_no,
        "title": title,
        "tender_number": tender_no,
        "procuring_entity": PROCURING_ENTITY,
        "deadline": close_dt,
        "category": category or "Government",
        "sub_category": None,
        "summary": title,
        "description": None,
        "document_url": doc_link,
        "tender_notice_url": TENDER_URL,
        "bid_bond_required": False,
        "bid_bond_amount": 0,
        "document_release_date": open_dt,
        "procurement_method": None,
        "start_date": open_dt,
        "end_date": close_dt,
    }


# ── Next-page navigator ───────────────────────────────────────────────────────

def _click_next(page) -> bool:
    """Try every known next-page selector. Return True if successfully clicked."""
    for selector in _NEXT_BTN_SELECTORS:
        try:
            btn = page.locator(selector).first
            if btn.count() == 0:
                continue
            if not btn.is_visible(timeout=2_000):
                continue
            if btn.is_disabled():
                return False   # Found but disabled → last page
            btn.click()
            return True
        except Exception:
            continue

    # Last-resort: look for any button containing a right-chevron SVG
    try:
        btns = page.locator("button").all()
        for btn in reversed(btns):  # pagination next is usually the last button
            try:
                if btn.is_disabled():
                    continue
                aria = btn.get_attribute("aria-label") or ""
                if "prev" in aria.lower() or "previous" in aria.lower():
                    continue
                inner = btn.inner_text().strip()
                if inner in (">", "›", "»", "Next", "next"):
                    btn.click()
                    return True
            except Exception:
                continue
    except Exception:
        pass

    return False


# ── Main scraper ──────────────────────────────────────────────────────────────

def scrape_kengen_playwright() -> list[dict]:
    """Return all open KenGen tenders across all pages."""
    log.info("Scraping KenGen tenders from %s (Playwright, full pagination)", TENDER_URL)
    tenders: list[dict] = []
    seen_ids: set = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = ctx.new_page()

        # ── Initial load ──────────────────────────────────────────────────
        try:
            page.goto(TENDER_URL, wait_until="domcontentloaded", timeout=LOAD_TIMEOUT)
            page.wait_for_timeout(PAGE_WAIT_MS)
        except PwTimeout:
            log.error("Timed out loading KenGen page")
            browser.close()
            return tenders

        # ── Ensure we are on the "Open Tenders" tab ──────────────────────
        open_tab_selectors = [
            'button:has-text("Open Tenders")',
            '[role="tab"]:has-text("Open Tenders")',
            'a:has-text("Open Tenders")',
        ]
        for sel in open_tab_selectors:
            try:
                tab = page.locator(sel).first
                if tab.count() > 0 and tab.is_visible(timeout=2_000):
                    tab.click()
                    page.wait_for_timeout(PAGE_WAIT_MS)
                    break
            except Exception:
                continue

        # ── Wait for the first table rows to appear ───────────────────────
        try:
            page.wait_for_selector(ROW_SELECTOR, timeout=ROW_WAIT_MS)
        except PwTimeout:
            log.warning("KenGen: no table rows found after initial load")
            browser.close()
            return tenders

        # ── Paginate ──────────────────────────────────────────────────────
        page_num = 1
        consecutive_same = 0   # guard against infinite loops

        while True:
            page.wait_for_timeout(500)   # let DOM settle
            rows = page.query_selector_all(ROW_SELECTOR)
            if not rows:
                log.warning("KenGen: page %d has no rows, stopping", page_num)
                break

            prev_count = len(tenders)
            expired_this_page = 0

            for row in rows:
                td = _parse_row(row, seen_ids)
                if td is None:
                    # Could be expired or duplicate
                    expired_this_page += 1
                    continue
                tenders.append(td)

            new_this_page = len(tenders) - prev_count
            log.info(
                "KenGen page %d: %d new open tenders (%d skipped/expired)",
                page_num, new_this_page, expired_this_page,
            )

            # Check for no new tenders (de-dup stall)
            if new_this_page == 0:
                consecutive_same += 1
                if consecutive_same >= 2:
                    log.info("KenGen: no new tenders for 2 consecutive pages, stopping")
                    break
            else:
                consecutive_same = 0

            # Try to advance to next page
            clicked = _click_next(page)
            if not clicked:
                log.info("KenGen: reached last page after %d pages", page_num)
                break

            try:
                page.wait_for_timeout(PAGE_WAIT_MS)
                page.wait_for_selector(ROW_SELECTOR, timeout=ROW_WAIT_MS)
            except PwTimeout:
                log.warning("KenGen: rows did not appear on page %d", page_num + 1)
                break

            page_num += 1

        browser.close()

    log.info("KenGen: total %d open tenders across %d pages", len(tenders), page_num)
    return tenders


# ── Standalone runner ─────────────────────────────────────────────────────────

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    )
    from db import save_tenders

    tenders = scrape_kengen_playwright()
    print(f"\nFound {len(tenders)} open KenGen tenders")
    for t in tenders[:5]:
        print(f"  [{t['tender_number']}] {t['title'][:70]}")
        print(f"    Closes: {t['deadline']}  Doc: {(t['document_url'] or '')[:80]}")

    inserted = save_tenders(tenders)
    print(f"\nInserted {inserted} new tenders into ScrapedTenders.")


if __name__ == "__main__":
    main()
