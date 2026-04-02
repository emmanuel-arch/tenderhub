"""Scraper for Kenya Revenue Authority (KRA) tenders.

Source: https://kra.go.ke/tenders
Paginates via ?offset=0,10,20,... (10 tenders per page, ~61 pages).
Extracts tender titles, release dates, EOI deadlines, and PDF download links.
"""

import logging
import re
import time
import warnings
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from config import KRA_URL, REQUEST_TIMEOUT, USER_AGENT

# KRA's SSL certificate has a hostname mismatch (visible as "Not secure" in browsers).
# We must skip verification for this specific site.
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

log = logging.getLogger(__name__)

SOURCE = "KRA"
PROCURING_ENTITY = "Kenya Revenue Authority (KRA)"
BASE = "https://kra.go.ke"
PAGE_SIZE = 10
MAX_PAGES = 70  # safety limit


def _parse_date(text: str):
    """Parse dates like '2026-04-01' or '2026-03-30'."""
    text = text.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _scrape_tender_detail(url: str) -> str | None:
    """Visit a KRA tender detail page and return the Download Tender Notice URL."""
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT, verify=False)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.warning("Failed to fetch KRA detail page %s: %s", url, exc)
        return None

    soup = BeautifulSoup(resp.text, "lxml")
    link = soup.find("a", class_="tender-btn")
    if link and link.get("href"):
        return urljoin(BASE, link["href"])
    return None


def _parse_page(html: str) -> list[dict]:
    """Parse a single KRA tenders page and return a list of tender dicts."""
    soup = BeautifulSoup(html, "lxml")
    tenders: list[dict] = []

    # KRA page structure:
    #   div.doc-container > div.doc-wrapper > div.row
    #     col: div.doc-title > p.subtitle "Tender Title" + p (actual title)
    #     col: div.doc-title > p.subtitle "Document Release Date" + p (date)
    #     col: div.doc-title > p.subtitle "Last Date for ..." + p (date)
    #     col: div.doc-btn > a "View Tender" (href=/component/kra_tenders/tender/{id})

    rows = soup.select("div.doc-wrapper")

    for row in rows:
        title = None
        release_date = None
        deadline = None
        view_url = None
        external_id = None

        doc_titles = row.select("div.doc-title")
        for dt in doc_titles:
            label_el = dt.select_one("p.subtitle")
            if not label_el:
                continue
            label = label_el.get_text(strip=True)

            if "Tender Title" in label:
                title_el = dt.select_one("h4, h3, h2")
                if title_el:
                    title = title_el.get_text(strip=True)
                else:
                    ps = [p for p in dt.select("p")
                          if "subtitle" not in " ".join(p.get("class", []))]
                    if ps:
                        title = ps[0].get_text(strip=True)

            elif "Document Release Date" in label:
                val = label_el.find_next_sibling()
                if val:
                    release_date = _parse_date(val.get_text(strip=True))

            elif "Last Date" in label:
                val = label_el.find_next_sibling()
                if val:
                    deadline = _parse_date(val.get_text(strip=True))

        # Extract "View Tender" link and external ID
        view_link = row.select_one("div.doc-btn a")
        if view_link and view_link.get("href"):
            href = view_link["href"]
            view_url = urljoin(BASE, href)
            # Extract ID from /component/kra_tenders/tender/691
            match = re.search(r"/tender/(\d+)", href)
            if match:
                external_id = match.group(1)

        if not title:
            continue

        # Fetch the PDF download link from the detail page
        doc_url = None
        if view_url:
            doc_url = _scrape_tender_detail(view_url)

        tenders.append(
            {
                "source": SOURCE,
                "external_id": external_id,
                "title": title,
                "tender_number": None,
                "procuring_entity": PROCURING_ENTITY,
                "deadline": deadline,
                "category": "Government",
                "sub_category": None,
                "summary": title,
                "description": None,
                "document_url": doc_url,
                "tender_notice_url": view_url or KRA_URL,
                "bid_bond_required": False,
                "bid_bond_amount": 0,
                "document_release_date": release_date,
                "procurement_method": None,
                "start_date": None,
                "end_date": None,
            }
        )

    return tenders


def _detect_total_pages(html: str) -> int:
    """Read the pagination links to find the max page number."""
    soup = BeautifulSoup(html, "lxml")
    max_page = 1
    for link in soup.select("ul.pagination a.pagactive"):
        match = re.search(r"filterTenders\(\d+,\d+,(\d+)\)", link.get("onclick", ""))
        if match:
            page_num = int(match.group(1))
            if page_num > max_page:
                max_page = page_num
    return max_page


def scrape_kra() -> list[dict]:
    """Scrape all pages of KRA tenders."""
    log.info("Scraping KRA tenders from %s", KRA_URL)

    headers = {"User-Agent": USER_AGENT}

    # Fetch page 1 to determine total pages
    resp = requests.get(KRA_URL, headers=headers, timeout=REQUEST_TIMEOUT, verify=False)
    resp.raise_for_status()

    total_pages = _detect_total_pages(resp.text)
    total_pages = min(total_pages, MAX_PAGES)
    log.info("KRA: detected %d pages.", total_pages)

    all_tenders: list[dict] = _parse_page(resp.text)
    log.info("KRA page 1: %d tenders.", len(all_tenders))

    # Paginate through remaining pages
    for page in range(2, total_pages + 1):
        offset = (page - 1) * PAGE_SIZE
        url = f"{KRA_URL}?offset={offset}"
        try:
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT, verify=False)
            resp.raise_for_status()
            page_tenders = _parse_page(resp.text)
            all_tenders.extend(page_tenders)
            log.info("KRA page %d (offset %d): %d tenders.", page, offset, len(page_tenders))

            if not page_tenders:
                log.info("KRA: empty page %d, stopping.", page)
                break

            # Be polite — small delay between requests
            time.sleep(0.5)
        except requests.RequestException as exc:
            log.warning("KRA page %d failed: %s", page, exc)
            continue

    log.info("KRA: found %d total tenders across %d pages.", len(all_tenders), total_pages)
    return all_tenders
