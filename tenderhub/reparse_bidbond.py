"""reparse_bidbond.py – Targeted re-parse for TenderDocumentDetails rows
whose BidBondAmount is invalid (NULL, tiny, date fragment, bare integer,
"Tender security Not Found", etc.).

What it does
────────────
1. Reads TenderDocumentDetails + ScrapedTenders for the target TenderIds.
2. Re-downloads and re-parses each document using the new document_parser.
3. Updates ONLY the fields that the new parser can fill — it never
   overwrites a valid value with NULL.
4. Prints a before/after summary at the end.

Usage
─────
    # Dry-run (no DB writes, just prints what would change):
    python reparse_bidbond.py --dry-run

    # Live run — processes all 408 bad rows:
    python reparse_bidbond.py

    # Limit to N rows (useful for testing):
    python reparse_bidbond.py --limit 20

    # Re-run only a specific TenderId:
    python reparse_bidbond.py --tender-id <UUID>

    # Parallel workers for speed:
    python reparse_bidbond.py --workers 4
"""

import argparse
import json
import logging
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("reparse_bidbond")


# ── Valid-amount classifier (mirrors what we used to build the reparse list) ─

def _is_valid_bid_bond(val) -> bool:
    """Return True if val is already a sensible bid-bond amount."""
    if val is None:
        return False
    s = str(val).strip()
    if not s or s.upper() == "NULL":
        return False
    if s == "Tender Security Not Required":
        return True
    if re.search(r"\d+(\.\d+)?%\s*of\s*Tender\s*Sum", s, re.IGNORECASE):
        return True
    if "not found" in s.lower():
        return False
    if re.match(r"^,?20\d{2}$", s):      # bare year
        return False
    if re.match(r"^\d+$", s):             # bare integer
        return False
    if re.match(r"^,20\d{2}", s) or re.match(r"^20\d{2},", s):  # date fragment
        return False
    if s.startswith("KES "):
        num_str = re.sub(r"[,\s]", "", s[4:])
        try:
            return float(num_str) >= 1_000
        except ValueError:
            return False
    return False


# ── DB helpers ────────────────────────────────────────────────────────────────

def _get_reparse_targets(limit: int | None, specific_id: str | None) -> list[dict]:
    """Fetch rows that need reparsing from the DB."""
    from db import get_connection

    if specific_id:
        sql = """
        SELECT d.TenderId, s.DocumentUrl, s.Title, s.Source,
               d.BidBondAmount
        FROM TenderDocumentDetails d
        JOIN ScrapedTenders s ON s.Id = d.TenderId
        WHERE d.TenderId = ?
        """
        params = [specific_id]
    else:
        # All rows whose BidBondAmount is not a valid value
        # We pull everything and filter in Python (DB has ~712 rows, fast)
        sql = """
        SELECT d.TenderId, s.DocumentUrl, s.Title, s.Source,
               d.BidBondAmount
        FROM TenderDocumentDetails d
        JOIN ScrapedTenders s ON s.Id = d.TenderId
        WHERE s.DocumentUrl IS NOT NULL
          AND s.DocumentUrl <> ''
        ORDER BY
            CASE
                WHEN d.BidBondAmount IS NULL THEN 4
                WHEN ISNUMERIC(d.BidBondAmount) = 1 THEN 1 -- Bare number
                WHEN d.BidBondAmount LIKE 'KES %'
                    AND TRY_CAST(REPLACE(REPLACE(REPLACE(SUBSTRING(d.BidBondAmount,5,50),' ',''),',',''),'.00','') AS BIGINT) < 1000
                THEN 2 -- KES too small/malformed
                WHEN d.BidBondAmount LIKE ',20%' OR d.BidBondAmount IN ('2022','2023','2024','2025','2026') THEN 3 -- Date fragment
                ELSE 5
            END,
            d.UpdatedAt ASC
        """
        params = []

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params)
        rows = cur.fetchall()

    targets = []
    for row in rows:
        tender_id, doc_url, title, source, bid_bond_amount = row
        if specific_id or not _is_valid_bid_bond(bid_bond_amount):
            targets.append({
                "tender_id": str(tender_id),
                "document_url": doc_url,
                "title": (title or "")[:80],
                "source": source,
                "old_bid_bond": bid_bond_amount,
            })

    if limit:
        targets = targets[:limit]

    return targets


def _update_doc_details(tender_id: str, parsed: dict, dry_run: bool) -> tuple[str, str]:
    """Update TenderDocumentDetails with fresh parsed values.

    Only overwrites fields when the new value is non-None.
    Returns (old_bid_bond, new_bid_bond).
    """
    import json as _json
    from db import get_connection

    # Read current bid_bond_amount before update
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT BidBondAmount FROM TenderDocumentDetails WHERE TenderId = ?",
            tender_id,
        )
        row = cur.fetchone()
    old_val = str(row[0]) if row and row[0] is not None else "NULL"
    new_val = parsed.get("bid_bond_amount")

    if dry_run:
        return old_val, str(new_val) if new_val is not None else "NULL"

    # Build UPDATE — only set fields that the parser returned a value for
    set_clauses: list[str] = []
    set_params: list = []

    field_map = [
        ("BidBondAmount",           "bid_bond_amount"),
        ("BidBondForm",             "bid_bond_form"),
        ("BidBondValidity",         "bid_bond_validity"),
        ("BidValidityPeriod",       "bid_validity_period"),
        ("SubmissionDeadline",      "submission_deadline"),
        ("SubmissionMethod",        "submission_method"),
        ("PreBidMeetingDate",       "pre_bid_meeting_date"),
        ("PreBidMeetingLink",       "pre_bid_meeting_link"),
        ("ClarificationDeadline",   "clarification_deadline"),
        ("MandatorySiteVisit",      "mandatory_site_visit"),
        ("NumberOfBidCopies",       "number_of_bid_copies"),
        ("MinAnnualTurnover",       "min_annual_turnover"),
        ("MinLiquidAssets",         "min_liquid_assets"),
        ("MinSingleContractValue",  "min_single_contract_value"),
        ("MinCombinedContractValue","min_combined_contract_value"),
        ("CashFlowRequirement",     "cash_flow_requirement"),
        ("AuditedFinancialsYears",  "audited_financials_years"),
        ("DocumentParsed",          "document_parsed"),
        ("ParsedDocumentUrl",       "parsed_document_url"),
        ("ParseError",              "parse_error"),
    ]

    for col, key in field_map:
        v = parsed.get(key)
        if v is not None:
            set_clauses.append(f"{col} = ?")
            set_params.append(v)

    # Always update JSON list fields if present
    for json_col, json_key in [("KeyPersonnel", "key_personnel"),
                                ("KeyEquipment", "key_equipment")]:
        lst = parsed.get(json_key)
        if lst is not None:
            set_clauses.append(f"{json_col} = ?")
            set_params.append(_json.dumps(lst, default=str))

    # Raw sections
    for raw_col, raw_key in [
        ("KeyRequirementsRaw",          "key_requirements_raw"),
        ("FinancialQualificationsRaw",  "financial_qualifications_raw"),
        ("KeyPersonnelRaw",             "key_personnel_raw"),
        ("KeyEquipmentRaw",             "key_equipment_raw"),
    ]:
        v = parsed.get(raw_key)
        if v is not None:
            set_clauses.append(f"{raw_col} = ?")
            set_params.append(v)

    set_clauses.append("UpdatedAt = GETUTCDATE()")

    if not set_clauses:
        return old_val, old_val   # nothing to update

    sql = (
        f"UPDATE TenderDocumentDetails SET {', '.join(set_clauses)} "
        f"WHERE TenderId = ?"
    )
    set_params.append(tender_id)

    with get_connection() as conn:
        conn.execute(sql, *set_params)
        conn.commit()

    return old_val, str(new_val) if new_val is not None else "NULL"


# ── Per-tender worker ─────────────────────────────────────────────────────────

def _reparse_one(target: dict, dry_run: bool,
                 idx: int, total: int,
                 lock: threading.Lock, counters: dict) -> None:
    from document_parser import parse_tender_document

    tender_id = target["tender_id"]
    url = target["document_url"]
    title = target["title"]

    log.info("[%d/%d] %s  |  %s", idx, total, title, repr(target["old_bid_bond"]))

    try:
        parsed = parse_tender_document(url)
        old_val, new_val = _update_doc_details(tender_id, parsed, dry_run)

        improved = _is_valid_bid_bond(new_val) and not _is_valid_bid_bond(old_val)
        still_bad = not _is_valid_bid_bond(new_val)

        status = "✓ FIXED" if improved else ("~ SAME" if still_bad else "✓ OK")
        log.info(
            "  %s  bid_bond: %s  →  %s",
            status, repr(old_val), repr(new_val),
        )

        with lock:
            counters["done"] += 1
            if improved:
                counters["fixed"] += 1
            elif still_bad:
                counters["still_bad"] += 1
            else:
                counters["unchanged"] += 1

    except Exception as exc:
        log.error("  ERROR for %s: %s", tender_id, exc)
        with lock:
            counters["errors"] += 1
            counters["done"] += 1


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true",
                    help="Print what would change without touching the DB")
    ap.add_argument("--limit", type=int, default=None,
                    help="Process at most N rows (for testing)")
    ap.add_argument("--tender-id", default=None,
                    help="Re-parse a single TenderId")
    ap.add_argument("--workers", type=int, default=1,
                    help="Parallel download workers (default: 1)")
    args = ap.parse_args()

    log.info("Loading reparse targets from DB…")
    targets = _get_reparse_targets(args.limit, args.tender_id)

    if not targets:
        log.info("No targets found — nothing to do.")
        return

    log.info(
        "Found %d rows to reparse%s%s",
        len(targets),
        f" (limited to {args.limit})" if args.limit else "",
        " [DRY RUN – no DB writes]" if args.dry_run else "",
    )

    start = time.time()
    lock = threading.Lock()
    counters = {"done": 0, "fixed": 0, "still_bad": 0, "unchanged": 0, "errors": 0}

    if args.workers <= 1:
        for i, t in enumerate(targets, 1):
            _reparse_one(t, args.dry_run, i, len(targets), lock, counters)
            time.sleep(0.3)   # polite gap between downloads
    else:
        log.info("Running with %d workers", args.workers)
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futures = [
                ex.submit(_reparse_one, t, args.dry_run, i, len(targets), lock, counters)
                for i, t in enumerate(targets, 1)
            ]
            for f in as_completed(futures):
                try:
                    f.result()
                except Exception:
                    pass

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"  REPARSE COMPLETE  ({elapsed:.1f}s)")
    print("=" * 60)
    print(f"  Total processed : {counters['done']}")
    print(f"  ✓ BidBond FIXED : {counters['fixed']}")
    print(f"  ~ Still missing : {counters['still_bad']}  (document may have no bond info)")
    print(f"  = Already valid  : {counters['unchanged']}")
    print(f"  ✗ Errors        : {counters['errors']}")
    if args.dry_run:
        print("\n  [DRY RUN — no changes were written to the DB]")
    print("=" * 60)


if __name__ == "__main__":
    main()
