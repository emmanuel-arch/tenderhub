"""Parse tender document PDFs/ZIPs and save extracted details to the DB.

Usage:
    python parse_documents.py                          # process up to 50 unprocessed tenders
    python parse_documents.py 100                      # process up to 100
    python parse_documents.py --source KRA 200         # only parse tenders from a specific source
    python parse_documents.py --reparse-failed         # retry previously failed parses
    python parse_documents.py --reparse-empty          # retry parses with missing bid bond + sparse fields
    python parse_documents.py --workers 8 --source KRA 200  # parallel workers
    python parse_documents.py --url URL                # parse a single URL (no DB save, prints result)
    python parse_documents.py --tender-id ID           # parse document for a specific tender by DB id
"""
from __future__ import annotations

import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from db import ensure_table, ensure_doc_details_table, get_tenders_needing_parsing, save_document_details, reset_failed_parses, reset_sparse_parses, reset_zero_bidbond_parses
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
    """Parse a single document URL and print results (no DB)."""
    log.info("Parsing single URL: %s", url)
    parsed = parse_tender_document(url)
    _print_parsed(parsed)


def run_single_tender(tender_id: str):
    """Parse document for a specific tender ID."""
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


def _process_one(t: dict, idx: int, total: int) -> bool:
    """Parse and save a single tender. Returns True if document_parsed."""
    tender_id = t["id"]
    url = t["document_url"]
    title = t["title"][:60]
    log.info("[%d/%d] Parsing: %s", idx, total, title)
    parsed = parse_tender_document(url)
    saved = save_document_details(tender_id, parsed)
    return saved and bool(parsed.get("document_parsed"))


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

    success = 0
    failed = 0
    start = time.time()
    total = len(tenders)

    if workers > 1:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {
                pool.submit(_process_one, t, i, total): t
                for i, t in enumerate(tenders, 1)
            }
            for future in as_completed(futures):
                if future.result():
                    success += 1
                else:
                    failed += 1
    else:
        for i, t in enumerate(tenders, 1):
            if _process_one(t, i, total):
                success += 1
            else:
                failed += 1
            time.sleep(1)

    elapsed = time.time() - start
    log.info(
        "Done. %d successful, %d failed out of %d (%.1fs).",
        success, failed, total, elapsed,
    )


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--url" in args:
        idx = args.index("--url")
        if idx + 1 < len(args):
            run_single_url(args[idx + 1])
        else:
            print("Usage: python parse_documents.py --url <URL>")
    elif "--tender-id" in args:
        idx = args.index("--tender-id")
        if idx + 1 < len(args):
            run_single_tender(args[idx + 1])
        else:
            print("Usage: python parse_documents.py --tender-id <ID>")
    else:
        source = None
        workers = 1
        reparse_failed = False
        reparse_empty = False
        reparse_zero_bidbond = False

        if "--reparse-failed" in args:
            reparse_failed = True
            args.remove("--reparse-failed")

        if "--reparse-empty" in args:
            reparse_empty = True
            args.remove("--reparse-empty")

        if "--reparse-zero-bidbond" in args:
            reparse_zero_bidbond = True
            args.remove("--reparse-zero-bidbond")

        if "--source" in args:
            idx = args.index("--source")
            if idx + 1 < len(args):
                source = args.pop(idx + 1)
                args.pop(idx)
            else:
                print("Usage: python parse_documents.py --source <SOURCE> [limit]")
                sys.exit(1)

        if "--workers" in args:
            idx = args.index("--workers")
            if idx + 1 < len(args):
                workers = int(args.pop(idx + 1))
                args.pop(idx)
            else:
                print("Usage: python parse_documents.py --workers <N>")
                sys.exit(1)

        if reparse_failed:
            reset_failed_parses(source=source)

        if reparse_empty:
            reset_sparse_parses(source=source)

        if reparse_zero_bidbond:
            reset_zero_bidbond_parses(source=source)

        limit = int(args[0]) if args else 50
        run_batch(limit, source=source, workers=workers)
