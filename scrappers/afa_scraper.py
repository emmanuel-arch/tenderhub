"""Scraper for Agriculture & Food Authority (AFA) tenders.

Source: https://www.afa.go.ke/tenders/
Extracts *current* tender titles and their PDF download URLs.
Only current (non-expired) tenders are returned.
"""

import logging
import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from config import AFA_URL, REQUEST_TIMEOUT, USER_AGENT

log = logging.getLogger(__name__)

SOURCE = "AFA"
PROCURING_ENTITY = "Agriculture & Food Authority (AFA)"


def _parse_date(text: str) -> datetime | None:
    """Try common date formats."""
    if not text:
        return None
    text = text.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d",
                "%d %B %Y", "%B %d, %Y", "%d %b %Y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _is_expired(deadline: datetime | None) -> bool:
    if deadline is None:
        return False   # unknown deadline → include
    return deadline < datetime.now()


def scrape_afa() -> list[dict]:
    """Return a list of open tender dicts from the AFA current tenders page."""
    log.info("Scraping AFA tenders from %s", AFA_URL)

    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(AFA_URL, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    tenders: list[dict] = []

    # The page has "CURRENT TENDERS" and "PAST TENDERS" sections.
    # We only want current tenders.  Each section is wrapped in an
    # accordion / tab whose heading contains the section title.
    # Strategy: find every download link, but stop once we hit "PAST TENDERS".
    in_current = False
    past_reached = False

    for element in soup.find_all(["h2", "h3", "h4", "a", "p"]):
        # ── Detect section boundaries ──────────────────────────────────────
        if element.name in ("h2", "h3", "h4"):
            text = element.get_text(strip=True).upper()
            if "CURRENT TENDERS" in text:
                in_current = True
                past_reached = False
                continue
            if "PAST TENDERS" in text or "CLOSED TENDERS" in text:
                in_current = False
                past_reached = True
                continue

        if past_reached and not in_current:
            if tenders:
                break

        if not in_current:
            continue

        # ── Collect download links ─────────────────────────────────────────
        if element.name == "a" and "default-btn-shortcode" in (
            " ".join(element.get("class", []))
        ):
            title = (element.get("title") or "").strip()
            href = (element.get("href") or "").strip()
            if not title or not href:
                continue

            # Try to find a deadline in the surrounding text
            deadline = None
            parent = element.parent
            if parent:
                parent_text = parent.get_text(" ", strip=True)
                # Look for patterns like "Deadline: 30/04/2026" or "Closing Date: ..."
                date_m = re.search(
                    r'(?:deadline|closing\s+date|closes?)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
                    parent_text, re.IGNORECASE
                )
                if date_m:
                    deadline = _parse_date(date_m.group(1))

            if _is_expired(deadline):
                log.debug("AFA: skipping expired tender: %s", title[:60])
                continue

            tenders.append(
                {
                    "source": SOURCE,
                    "external_id": None,
                    "title": title,
                    "tender_number": None,
                    "procuring_entity": PROCURING_ENTITY,
                    "deadline": deadline,
                    "category": "Government",
                    "sub_category": None,
                    "summary": title,
                    "description": None,
                    "document_url": href,
                    "tender_notice_url": AFA_URL,
                    "bid_bond_required": False,
                    "bid_bond_amount": 0,
                    "document_release_date": None,
                    "procurement_method": None,
                    "start_date": None,
                    "end_date": deadline,
                }
            )

    log.info("AFA: found %d open current tenders.", len(tenders))
    return tenders
