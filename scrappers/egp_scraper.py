"""Scraper for the eGP Kenya portal.

Source: https://egpkenya.go.ke/
Uses Playwright to load the Angular SPA, intercepts the JSON API response
(dashboard-tender-details), then paginates through all pages to collect
every ACTIVE (non-expired) tender.
"""

import logging
import re
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

from config import EGP_URL

log = logging.getLogger(__name__)

SOURCE = "EGP"
BASE_URL = "https://egpkenya.go.ke"
LOAD_TIMEOUT = 60_000
PAGE_WAIT = 6000
MAX_RETRIES = 3


def _parse_datetime(text: str) -> datetime | None:
    """Parse eGP date strings like '01/04/2026 18:00:00'."""
    text = text.strip()
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _is_expired(end_date: datetime | None) -> bool:
    if end_date is None:
        return False
    return end_date < datetime.now()


def _clean_entity(raw: str) -> str:
    return re.sub(r"\s+", " ", raw.replace("\xa0", " ")).strip()


def _build_tender_dict(item: dict) -> dict:
    """Map a single eGP API tender item to our standard dict."""
    tender_id = item.get("tenderdetailid")
    title = (item.get("tendertitle") or "").strip()
    ref_no = (item.get("tenderrefno") or "").strip()
    entity = _clean_entity(item.get("procuringEntity") or "")
    category = (item.get("procurementCategory") or "").strip()
    method = (item.get("procurementMethod") or "").strip()
    start_str = (item.get("bidsubmissionstartdate") or "").strip()
    end_str = (item.get("bidsubmissionenddate") or "").strip()

    start_date = _parse_datetime(start_str) if start_str else None
    end_date = _parse_datetime(end_str) if end_str else None

    sub_map = {
        "works": "Works", "goods": "Goods", "services": "Services",
        "consultancy services": "Consultancy", "consultancy": "Consultancy",
    }
    sub_category = sub_map.get(category.lower(), category) if category else None

    tender_notice_url = (
        f"{BASE_URL}/tender/view-tender-notice/{tender_id}"
        if tender_id else BASE_URL
    )

    return {
        "source": SOURCE,
        "external_id": str(tender_id) if tender_id else None,
        "title": title,
        "tender_number": ref_no or None,
        "procuring_entity": entity or None,
        "deadline": end_date,
        "category": "Government",
        "sub_category": sub_category,
        "summary": title,
        "description": None,
        "document_url": None,
        "tender_notice_url": tender_notice_url,
        "bid_bond_required": False,
        "bid_bond_amount": 0,
        "document_release_date": None,
        "procurement_method": method or None,
        "start_date": start_date,
        "end_date": end_date,
    }


def scrape_egp() -> list[dict]:
    """Scrape all active (non-expired) tenders from eGP Kenya by intercepting the API."""
    log.info("Scraping eGP Kenya tenders from %s (Playwright + API intercept)", EGP_URL)

    all_tenders: list[dict] = []
    seen_ids: set[int] = set()
    expired_count = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ))
        pw_page = ctx.new_page()

        api_responses: list[dict] = []

        def on_response(resp):
            if "dashboard-tender-details" in resp.url and resp.status == 200:
                try:
                    api_responses.append(resp.json())
                except Exception:
                    pass

        pw_page.on("response", on_response)

        try:
            pw_page.goto(EGP_URL, wait_until="domcontentloaded", timeout=LOAD_TIMEOUT)
            pw_page.wait_for_timeout(PAGE_WAIT)
        except PwTimeout:
            log.error("Timed out loading eGP Kenya homepage.")
            browser.close()
            return all_tenders

        if not api_responses:
            log.error("No API response intercepted on page load.")
            browser.close()
            return all_tenders

        first_resp = api_responses[0].get("respData", {})
        total_active = first_resp.get("totalCountActive", 0)
        page1_tenders = first_resp.get("tenderDetails", [])

        for item in page1_tenders:
            tid = item.get("tenderdetailid")
            if tid and tid not in seen_ids:
                seen_ids.add(tid)
                td = _build_tender_dict(item)
                if _is_expired(td["end_date"]):
                    expired_count += 1
                    continue
                all_tenders.append(td)

        log.info("eGP page 1: %d tenders (total active: %d)", len(page1_tenders), total_active)

        per_page = len(page1_tenders) or 5
        total_pages = (total_active + per_page - 1) // per_page
        log.info("eGP: need to paginate through %d pages", total_pages)

        current_page = 1
        consecutive_empty = 0

        while current_page < total_pages:
            current_page += 1
            api_responses.clear()

            page_ok = False
            for attempt in range(MAX_RETRIES):
                try:
                    next_btn = pw_page.locator(
                        "li.page-item:not(.disabled) a.page-link:has-text('»')"
                    ).first
                    next_btn.wait_for(state="visible", timeout=10_000)
                    next_btn.click()
                    pw_page.wait_for_timeout(PAGE_WAIT)
                    page_ok = True
                    break
                except Exception as e:
                    if attempt < MAX_RETRIES - 1:
                        log.warning(
                            "eGP: page %d click failed (attempt %d/%d): %s – retrying",
                            current_page, attempt + 1, MAX_RETRIES, str(e)[:80],
                        )
                        pw_page.wait_for_timeout(3000)
                        api_responses.clear()
                    else:
                        log.warning(
                            "eGP: page %d – all %d click attempts failed: %s",
                            current_page, MAX_RETRIES, str(e)[:80],
                        )

            if not page_ok:
                disabled = pw_page.locator(
                    "li.page-item.disabled a.page-link:has-text('»')"
                ).count()
                if disabled:
                    log.info("eGP: Reached last page (%d).", current_page - 1)
                else:
                    log.warning("eGP: Pagination stopped unexpectedly at page %d.", current_page - 1)
                break

            if api_responses:
                page_data = api_responses[-1].get("respData", {})
                page_tenders = page_data.get("tenderDetails", [])

                if not page_tenders:
                    consecutive_empty += 1
                    if consecutive_empty >= 3:
                        log.info("eGP: 3 consecutive empty pages, stopping.")
                        break
                    continue

                consecutive_empty = 0
                for item in page_tenders:
                    tid = item.get("tenderdetailid")
                    if tid and tid not in seen_ids:
                        seen_ids.add(tid)
                        td = _build_tender_dict(item)
                        if _is_expired(td["end_date"]):
                            expired_count += 1
                            continue
                        all_tenders.append(td)

                if current_page % 20 == 0:
                    log.info(
                        "eGP page %d/%d: collected %d open tenders",
                        current_page, total_pages, len(all_tenders),
                    )
            else:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    break

        browser.close()

    log.info(
        "eGP: scraped %d open tenders total (%d expired skipped) across %d pages.",
        len(all_tenders), expired_count, current_page,
    )
    return all_tenders
