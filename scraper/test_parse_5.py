"""Parse 5 tenders from tenders.go.ke as a test run."""
import json
import logging
import time
from db import get_connection, ensure_table, ensure_doc_details_table, save_document_details
from document_parser import parse_tender_document

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-8s %(message)s")
log = logging.getLogger("test_parse_5")

ensure_table()
ensure_doc_details_table()

# Get 5 tenders.go.ke tenders that haven't been parsed yet
with get_connection() as conn:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM TenderDocumentDetails")
    print(f"TenderDocumentDetails rows: {cur.fetchone()[0]}")

    cur.execute("""
        SELECT TOP 5 t.Id, t.Title, t.DocumentUrl
        FROM ScrapedTenders t
        LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
        WHERE t.Source = 'tenders.go.ke'
          AND t.DocumentUrl IS NOT NULL
          AND t.DocumentUrl <> ''
          AND d.Id IS NULL
        ORDER BY t.CreatedAt DESC
    """)
    tenders = [(str(r[0]), r[1], r[2]) for r in cur.fetchall()]

print(f"\nFound {len(tenders)} tenders to parse\n")

for i, (tid, title, url) in enumerate(tenders, 1):
    print(f"\n{'='*80}")
    print(f"[{i}/5] {title[:80]}")
    print(f"  URL: {url[:100]}")
    print(f"  ID:  {tid}")

    parsed = parse_tender_document(url)

    # Show results
    print(f"\n  Document parsed: {parsed.get('document_parsed', False)}")
    if parsed.get('parse_error'):
        print(f"  Parse error: {parsed['parse_error']}")

    fields = [
        'bid_bond_amount', 'bid_bond_form', 'bid_bond_validity',
        'bid_validity_period', 'submission_deadline', 'submission_method',
        'pre_bid_meeting_date', 'pre_bid_meeting_link',
        'clarification_deadline', 'mandatory_site_visit', 'number_of_bid_copies',
        'min_annual_turnover', 'min_liquid_assets',
        'min_single_contract_value', 'min_combined_contract_value',
        'cash_flow_requirement', 'audited_financials_years',
    ]
    filled = 0
    for f in fields:
        val = parsed.get(f)
        if val is not None:
            print(f"  {f}: {val}")
            filled += 1

    personnel = parsed.get('key_personnel', [])
    equipment = parsed.get('key_equipment', [])
    if personnel:
        filled += 1
        print(f"  key_personnel: {json.dumps(personnel, default=str)[:200]}")
    if equipment:
        filled += 1
        print(f"  key_equipment: {json.dumps(equipment, default=str)[:200]}")

    print(f"\n  Fields filled: {filled}/19")

    # Save to DB
    save_document_details(tid, parsed)
    print(f"  Saved to DB.")

    time.sleep(1)

print(f"\n{'='*80}")
print("Done! Check the results above and confirm if quality is acceptable.")
