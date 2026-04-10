"""Deep inspection of a specific tender document to find all parseable fields."""
import io
import sys
import re
import json
import warnings
import requests
import pdfplumber

warnings.filterwarnings("ignore", message="Unverified HTTPS request")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = "https://tenders.go.ke/storage/Documents/1775571539252-blank-tender-document.pdf"

print(f"Downloading {URL}...")
resp = requests.get(URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=120, verify=False)
print(f"Status: {resp.status_code}, Size: {len(resp.content)} bytes")

text_parts = []
with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
    print(f"Pages: {len(pdf.pages)}")
    for page in pdf.pages:
        try:
            t = page.extract_text() or ""
            text_parts.append(t)
        except:
            text_parts.append("")

full_text = "\n".join(text_parts)
print(f"Total characters: {len(full_text)}")

# Save full text for inspection
with open("_inspect_full_text.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
print("Full text saved to _inspect_full_text.txt")

# Now search for specific patterns
print("\n" + "="*80)
print("SEARCHING FOR KEY FIELDS")
print("="*80)

lines = full_text.split("\n")

# 1. Bid bond / tender security
print("\n--- BID BOND / TENDER SECURITY ---")
for i, line in enumerate(lines):
    low = line.lower()
    if any(k in low for k in ["tender security", "bid security", "bid bond"]):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:150]}")

# 2. Submission deadline / closing date
print("\n--- SUBMISSION DEADLINE / CLOSING DATE ---")
for i, line in enumerate(lines):
    low = line.lower()
    if any(k in low for k in ["closing date", "submission deadline", "delivered to", "on or before"]):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 3. Bid validity
print("\n--- BID VALIDITY ---")
for i, line in enumerate(lines):
    low = line.lower()
    if "validity" in low and ("bid" in low or "tender" in low or "period" in low or "day" in low):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 4. Pre-bid meeting / site visit
print("\n--- PRE-BID / SITE VISIT ---")
for i, line in enumerate(lines):
    low = line.lower()
    if any(k in low for k in ["pre-bid", "prebid", "pre bid", "site visit", "site inspection"]):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 5. Financial / turnover
print("\n--- FINANCIAL / TURNOVER ---")
for i, line in enumerate(lines):
    low = line.lower()
    if any(k in low for k in ["annual turnover", "liquid assets", "cash flow", "audited", "financial capability", "single contract"]):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 6. Key personnel section
print("\n--- KEY PERSONNEL SECTION ---")
in_personnel = False
personnel_count = 0
for i, line in enumerate(lines):
    low = line.lower().strip()
    if "key personnel" in low or "contractor's representative" in low:
        in_personnel = True
        personnel_count = 0
        print(f"  L{i}: {line.strip()[:200]}")
        continue
    if in_personnel:
        if personnel_count > 25:
            in_personnel = False
            continue
        if low.startswith("section") or "key equipment" in low or "plant and equipment" in low:
            in_personnel = False
            print(f"  [END at L{i}]")
            continue
        if line.strip():
            print(f"  L{i}: {line.strip()[:200]}")
            personnel_count += 1

# 7. Key equipment section
print("\n--- KEY EQUIPMENT SECTION ---")
in_equip = False
equip_count = 0
for i, line in enumerate(lines):
    low = line.lower().strip()
    if "key equipment" in low or ("contractor" in low and "equipment" in low and ("list" in low or "table" in low)):
        in_equip = True
        equip_count = 0
        print(f"  L{i}: {line.strip()[:200]}")
        continue
    if in_equip:
        if equip_count > 25:
            in_equip = False
            continue
        if low.startswith("section") or "key personnel" in low or "nb:" in low:
            in_equip = False
            print(f"  [END at L{i}]")
            continue
        if line.strip():
            print(f"  L{i}: {line.strip()[:200]}")
            equip_count += 1

# 8. NCA registration
print("\n--- NCA / REGISTRATION ---")
for i, line in enumerate(lines):
    low = line.lower()
    if "nca" in low and ("class" in low or "category" in low or "registered" in low):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 9. Submission method
print("\n--- SUBMISSION METHOD ---")
for i, line in enumerate(lines):
    low = line.lower()
    if "submission" in low and ("electronic" in low or "physical" in low or "tender box" in low):
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 10. Number of copies
print("\n--- COPIES ---")
for i, line in enumerate(lines):
    low = line.lower()
    if "copies" in low or "original" in low:
        if len(line.strip()) > 10 and ("copies" in low or "one original" in low):
            print(f"  L{i}: {line.strip()[:200]}")

# 11. Clarification deadline
print("\n--- CLARIFICATION ---")
for i, line in enumerate(lines):
    low = line.lower()
    if "clarification" in low:
        if len(line.strip()) > 10:
            print(f"  L{i}: {line.strip()[:200]}")

# 12. Tender Data Sheet (TDS) - often has the concrete values
print("\n--- TENDER DATA SHEET ---")
in_tds = False
tds_count = 0
for i, line in enumerate(lines):
    low = line.lower().strip()
    if "tender data sheet" in low or "appendix to instruction" in low:
        in_tds = True
        tds_count = 0
        print(f"  L{i}: {line.strip()[:200]}")
        continue
    if in_tds:
        if tds_count > 60:
            in_tds = False
            continue
        if low.startswith("section ii") or low.startswith("section iii"):
            in_tds = False
            print(f"  [END at L{i}]")
            continue
        if line.strip():
            print(f"  L{i}: {line.strip()[:200]}")
            tds_count += 1

# 13. Evaluation criteria section 
print("\n--- EVALUATION / QUALIFICATION CRITERIA ---")
in_eval = False
eval_count = 0
for i, line in enumerate(lines):
    low = line.lower().strip()
    if "evaluation and qualification criteria" in low or "evaluation criteria" in low:
        in_eval = True
        eval_count = 0
        print(f"  L{i}: {line.strip()[:200]}")
        continue
    if in_eval:
        if eval_count > 80:
            in_eval = False
            continue
        if "section iii" in low or "bidding forms" in low or "tendering forms" in low:
            in_eval = False
            print(f"  [END at L{i}]")
            continue
        if line.strip():
            print(f"  L{i}: {line.strip()[:200]}")
            eval_count += 1
