"""Scraper for the eGP Kenya portal (Angular SPA) using Playwright.

Source: https://egpkenya.go.ke/
Extracts tender details including Tender ID, Reference No, Title,
Procuring Entity, Category, Dates, and Bid Security amounts.
"""

import logging
import re
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

from config import EGP_URL

log = logging.getLogger(__name__)

SOURCE = "EGP"

# Max number of pagination pages to scrape (safety limit)
MAX_PAGES = 20

# Timeout for waiting on Angular content (ms)
LOAD_TIMEOUT = 30_000


def _parse_datetime(text: str):
    """Parse eGP date strings like '01/04/2026 18:00:00' or '01/04/2026 18:00'."""
    text = text.strip()
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _extract_field(page, label: str) -> str:
    """Extract the value text next to a given label on an eGP detail page."""
    try:
        label_el = page.locator(f"text='{label}'").first
        # The value is typically in the next sibling element or adjacent cell
        parent = label_el.locator("..")
        value_el = parent.locator("+ *").first
        if value_el.count():
            return value_el.inner_text().strip()
        # Fallback: get all text from parent row and split after label
        full = parent.inner_text().strip()
        if label in full:
            return full.split(label)[-1].strip().strip(":")
    except Exception:
        pass
    return ""


def _scrape_detail(page) -> dict:
    """Scrape the tender detail / notice page that is currently open."""
    detail = {}

    # Try to read key fields from the detail view
    selectors = {
        "title": "Tender Title",
        "procuring_entity": "Procuring Entity",
        "sub_category": "Procurement Category",
        "procurement_method": "Procurement Method",
    }

    for key, label in selectors.items():
        try:
            # Look for label text and grab sibling value
            elements = page.query_selector_all("td, th, dt, dd, span, div, label, p")
            for i, el in enumerate(elements):
                if label.lower() in (el.inner_text() or "").lower():
                    # Get the next sibling element's text
                    if i + 1 < len(elements):
                        val = elements[i + 1].inner_text().strip()
                        if val and val.lower() != label.lower():
                            detail[key] = val
                            break
        except Exception:
            pass

    # Bid security
    try:
        elements = page.query_selector_all("td, th, dt, dd, span, div, label, p")
        for i, el in enumerate(elements):
            text = (el.inner_text() or "").strip()
            if "Tender Security Amount" in text:
                if i + 1 < len(elements):
                    amt_text = elements[i + 1].inner_text().strip()
                    amount = re.sub(r"[^\d.]", "", amt_text)
                    if amount:
                        detail["bid_bond_amount"] = float(amount)
                        detail["bid_bond_required"] = True
                break
    except Exception:
        pass

    return detail


def scrape_egp() -> list[dict]:
    """Return a list of tender dicts from eGP Kenya."""
    log.info("Scraping eGP Kenya tenders from %s (Playwright)", EGP_URL)

    tenders: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()

        try:
            page.goto(EGP_URL, wait_until="networkidle", timeout=LOAD_TIMEOUT)
            # Give Angular time to render
            page.wait_for_timeout(5000)
        except PwTimeout:
            log.error("Timed out loading eGP Kenya homepage.")
            browser.close()
            return tenders

        # The eGP portal may show tenders on the homepage or behind a menu.
        # Try clicking a "Tenders" or "Active Tenders" navigation item if present.
        for nav_text in ["Active Tenders", "Tenders", "Published Tenders"]:
            try:
                nav = page.locator(f"text='{nav_text}'").first
                if nav.is_visible(timeout=3000):
                    nav.click()
                    page.wait_for_timeout(3000)
                    break
            except Exception:
                continue

        pages_scraped = 0

        while pages_scraped < MAX_PAGES:
            pages_scraped += 1
            page.wait_for_timeout(3000)

            # Collect tender cards/rows from the current page
            # eGP renders tenders in a list; each item typically has
            # Tender ID, Reference, Title, Entity, Category, Dates
            items = page.query_selector_all(
                "table tbody tr, .tender-item, .tender-card, "
                "app-tender-list .row, .list-group-item"
            )

            if not items:
                # Fallback: try generic selectors
                items = page.query_selector_all("div.card, div.panel, div.tender")

            if not items:
                log.warning("eGP: no tender items found on page %d.", pages_scraped)
                break

            for item in items:
                try:
                    text = item.inner_text() or ""
                except Exception:
                    continue

                if not text.strip() or len(text.strip()) < 20:
                    continue

                # Parse fields from the row text
                tender_id = None
                ref_no = None
                title = None
                entity = None
                category = None
                start_date = None
                end_date = None

                lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

                for line in lines:
                    if "Tender ID" in line:
                        match = re.search(r"Tender ID\s*[:\s]*(\d+)", line)
                        if match:
                            tender_id = match.group(1)
                    if "Tender Reference" in line or "Reference No" in line:
                        match = re.search(r"(?:Reference\s*No|Tender Reference)[.:\s]*(.+)", line)
                        if match:
                            ref_no = match.group(1).strip()
                    if "Tender Title" in line:
                        match = re.search(r"Tender Title\s*[:\s]*(.+)", line)
                        if match:
                            title = match.group(1).strip()
                    if "Procuring Entity" in line:
                        match = re.search(r"Procuring Entity\s*[:\s]*(.+)", line)
                        if match:
                            entity = match.group(1).strip()
                    if "Procurement Category" in line:
                        match = re.search(r"Procurement Category\s*[:\s]*(.+)", line)
                        if match:
                            category = match.group(1).strip()
                    if "Start Date" in line:
                        match = re.search(r"Start Date.*?(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)", line)
                        if match:
                            start_date = _parse_datetime(match.group(1))
                    if "End Date" in line:
                        match = re.search(r"End Date.*?(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)", line)
                        if match:
                            end_date = _parse_datetime(match.group(1))

                # If we couldn't parse a title, try using the first long line
                if not title:
                    candidates = [l for l in lines if len(l) > 30
                                  and "Tender ID" not in l
                                  and "Procuring" not in l
                                  and "Procurement" not in l]
                    if candidates:
                        title = candidates[0]

                if not title:
                    continue

                # Try to click "View Tender Notice" for extra details
                detail = {}
                try:
                    view_btn = item.query_selector("a[title='View'], a:has-text('View Tender Notice')")
                    if view_btn:
                        view_btn.click()
                        page.wait_for_timeout(3000)
                        detail = _scrape_detail(page)
                        # Go back
                        page.go_back(wait_until="networkidle", timeout=LOAD_TIMEOUT)
                        page.wait_for_timeout(3000)
                except Exception as exc:
                    log.debug("Could not fetch eGP detail: %s", exc)

                sub_category = detail.get("sub_category") or category
                valid_categories = {
                    "works": "Works",
                    "goods": "Goods",
                    "services": "Services",
                    "consultancy": "Consultancy",
                }
                if sub_category:
                    mapped = valid_categories.get(sub_category.strip().lower())
                    sub_category = mapped if mapped else None

                tenders.append(
                    {
                        "source": SOURCE,
                        "external_id": tender_id,
                        "title": title,
                        "tender_number": ref_no,
                        "procuring_entity": detail.get("procuring_entity") or entity,
                        "deadline": end_date,
                        "category": "Government",
                        "sub_category": sub_category,
                        "summary": title,
                        "description": None,
                        "document_url": None,
                        "tender_notice_url": EGP_URL,
                        "bid_bond_required": detail.get("bid_bond_required", False),
                        "bid_bond_amount": detail.get("bid_bond_amount", 0),
                        "document_release_date": None,
                        "procurement_method": detail.get("procurement_method"),
                        "start_date": start_date,
                        "end_date": end_date,
                    }
                )

            # Try pagination – click "Next" if available
            try:
                next_btn = page.locator(
                    "button:has-text('Next'), a:has-text('Next'), "
                    "li.next a, .pagination .next, button:has-text('»')"
                ).first
                if next_btn.is_visible(timeout=2000) and next_btn.is_enabled():
                    next_btn.click()
                    page.wait_for_timeout(3000)
                else:
                    break
            except Exception:
                break

        browser.close()

    log.info("eGP: found %d tenders.", len(tenders))
    return tenders
