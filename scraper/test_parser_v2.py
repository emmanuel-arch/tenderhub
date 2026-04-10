"""Test the rewritten parser on the 138-page Judiciary tender."""
import json
from document_parser import parse_tender_document

URL = "https://tenders.go.ke/storage/Documents/1775571539252-blank-tender-document.pdf"
result = parse_tender_document(URL)

print("=== KEY REQUIREMENTS ===")
for k in ["bid_bond_amount", "bid_bond_form", "bid_bond_validity", "bid_validity_period",
           "submission_deadline", "submission_method", "pre_bid_meeting_date", "pre_bid_meeting_link",
           "clarification_deadline", "mandatory_site_visit", "number_of_bid_copies"]:
    val = result.get(k, "NOT FOUND")
    print(f"  {k}: {val}")

print()
print("=== FINANCIAL QUALIFICATIONS ===")
for k in ["min_annual_turnover", "min_liquid_assets", "min_single_contract_value",
           "min_combined_contract_value", "cash_flow_requirement", "audited_financials_years"]:
    val = result.get(k, "NOT FOUND")
    print(f"  {k}: {val}")

print()
print("=== KEY PERSONNEL ===")
for p in result.get("key_personnel", []):
    print(f"  - {json.dumps(p)}")
if not result.get("key_personnel"):
    print("  (none found)")

print()
print("=== KEY EQUIPMENT ===")
for e in result.get("key_equipment", []):
    print(f"  - {json.dumps(e)}")
if not result.get("key_equipment"):
    print("  (none found)")

print()
print(f"document_parsed: {result.get('document_parsed')}")
print(f"parse_error: {result.get('parse_error')}")
