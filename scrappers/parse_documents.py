"""Parse tender document PDFs/ZIPs and save extracted details to the DB.

Usage:
    python parse_documents.py              # process up to 50 unprocessed tenders
    python parse_documents.py 100          # process up to 100
    python parse_documents.py --source kengen 200
    python parse_documents.py --workers 4 200
    python parse_documents.py --url URL    # parse a single URL (no DB, prints result)
    python parse_documents.py --tender-id ID
"""

import json
import logging
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from db import (ensure_table, ensure_doc_details_table,
                get_tenders_needing_parsing, save_document_details)
from document_parser import parse_tender_document

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("parse_documents")


def _print_parsed(parsed: dict):
    """Pretty-print parsed document details."""
    print("\n── KEY REQUIREMENTS ──")
    for k in ["bid_bond_amount", "bid_bond_form", "bid_bond_validity",
              "bid_validity_period", "submission_deadline", "submission_method",
              "pre_bid_meeting_date", "pre_bid_meeting_link",
              "clarification_deadline", "mandatory_site_visit",
              "number_of_bid_copies"]:
        val = parsed.get(k)
        if val is not None:
            print(f"  {k}: {val}")

    print("\n── FINANCIAL QUALIFICATIONS ──")
    for k in ["min_annual_turnover", "min_liquid_assets",
              "min_single_contract_value", "min_combined_contract_value",
              "cash_flow_requirement", "audited_financials_years"]:
        val = parsed.get(k)
        if val is not None:
            print(f"  {k}: {val}")

    print("\n── KEY PERSONNEL ──")
    for p in parsed.get("key_personnel", []):
        print(f"  - {json.dumps(p, default=str)}")

    print("\n── KEY EQUIPMENT ──")
    for e in parsed.get("key_equipment", []):
        print(f"  - {json.dumps(e, default=str)}")

    if parsed.get("parse_error"):
        print(f"\n⚠ Parse error: {parsed['parse_error']}")
    print(f"\nDocument parsed: {parsed.get('document_parsed', False)}")


def run_single_url(url: str):
    log.info("Parsing single URL: %s", url)
    parsed = parse_tender_document(url)
    _print_parsed(parsed)


def run_single_tender(tender_id: str):
    from db import get_connection
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT DocumentUrl, Title FROM ScrapedTenders WHERE Id = ?", tender_id)
        row = cur.fetchone()
    if not row:
        log.error("Tender %s not found.", tender_id)
        return
    url, title = row
    if not url:
        log.error("Tender %s has no DocumentUrl.", tender_id)
        return
    log.info("Parsing document for: %s", title)
    parsed = parse_tender_document(url)
    _print_parsed(parsed)
    save_document_details(tender_id, parsed)
    log.info("Saved to DB.")


def _parse_one(tender: dict, index: int, total: int,
               counter_lock: threading.Lock, counters: dict):
    tender_id = tender["id"]
    url = tender["document_url"]
    title = tender["title"][:60]
    log.info("[%d/%d] Parsing: %s", index, total, title)
    try:
        parsed = parse_tender_document(url)
        saved = save_document_details(tender_id, parsed)
        with counter_lock:
            if saved and parsed.get("document_parsed"):
                counters["success"] += 1
            else:
                counters["failed"] += 1
            counters["done"] += 1
            if counters["done"] % 25 == 0:
                log.info("Progress: %d/%d done (%d ok, %d failed)",
                         counters["done"], total,
                         counters["success"], counters["failed"])
    except Exception:
        log.exception("Error parsing tender %s", tender_id)
        with counter_lock:
            counters["failed"] += 1
            counters["done"] += 1


def run_batch(limit: int = 50, source: str | None = None, workers: int = 1):
    """Process a batch of tenders that need document parsing."""
    ensure_table()
    ensure_doc_details_table()

    tenders = get_tenders_needing_parsing(limit, source=source)
    if source:
        log.info("Filtering by source: %s", source)
    log.info("Found %d tenders needing document parsing.", len(tenders))

    if not tenders:
        log.info("Nothing to process.")
        return

    start = time.time()

    if workers <= 1:
        success = 0
        failed = 0
        for i, t in enumerate(tenders, 1):
            tender_id = t["id"]
            url = t["document_url"]
            title = t["title"][:60]
            log.info("[%d/%d] Parsing: %s", i, len(tenders), title)
            parsed = parse_tender_document(url)
            if save_document_details(tender_id, parsed):
                if parsed.get("document_parsed"):
                    success += 1
                else:
                    failed += 1
            else:
                failed += 1
            time.sleep(0.5)
    else:
        log.info("Using %d parallel workers.", workers)
        counter_lock = threading.Lock()
        counters = {"success": 0, "failed": 0, "done": 0}
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [
                executor.submit(_parse_one, t, i, len(tenders), counter_lock, counters)
                for i, t in enumerate(tenders, 1)
            ]
            for f in as_completed(futures):
                try:
                    f.result()
                except Exception:
                    pass
        success = counters["success"]
        failed = counters["failed"]

    elapsed = time.time() - start
    log.info("Done. %d successful, %d failed out of %d (%.1fs).",
             success, failed, len(tenders), elapsed)


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--url" in args:
        idx = args.index("--url")
        run_single_url(args[idx + 1]) if idx + 1 < len(args) else print("Usage: --url <URL>")
    elif "--tender-id" in args:
        idx = args.index("--tender-id")
        run_single_tender(args[idx + 1]) if idx + 1 < len(args) else print("Usage: --tender-id <ID>")
    else:
        source = None
        workers = 1
        if "--source" in args:
            idx = args.index("--source")
            source = args.pop(idx + 1)
            args.pop(idx)
        if "--workers" in args:
            idx = args.index("--workers")
            workers = int(args.pop(idx + 1))
            args.pop(idx)
        limit = int(args[0]) if args else 50
        run_batch(limit, source=source, workers=workers)
