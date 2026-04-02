"""Quick test of KRA scraper pagination (first 3 pages only)."""
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

from scrapers.kra_scraper import _parse_page, _detect_total_pages
import requests

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

# Page 1
resp = requests.get("https://kra.go.ke/tenders", headers=headers, timeout=30, verify=False)
total_pages = _detect_total_pages(resp.text)
print(f"Total pages detected: {total_pages}")

tenders = _parse_page(resp.text)
print(f"Page 1: {len(tenders)} tenders")
for t in tenders[:2]:
    print(f"  - [{t['external_id']}] {t['title'][:60]}")
    print(f"    Deadline: {t['deadline']}")
    print(f"    Notice: {t['tender_notice_url']}")
    print(f"    Doc: {t['document_url']}")

# Page 2
resp2 = requests.get("https://kra.go.ke/tenders?offset=10", headers=headers, timeout=30, verify=False)
page2 = _parse_page(resp2.text)
print(f"\nPage 2: {len(page2)} tenders")
for t in page2[:2]:
    print(f"  - [{t['external_id']}] {t['title'][:60]}")

# Page 3
resp3 = requests.get("https://kra.go.ke/tenders?offset=20", headers=headers, timeout=30, verify=False)
page3 = _parse_page(resp3.text)
print(f"\nPage 3: {len(page3)} tenders")
for t in page3[:2]:
    print(f"  - [{t['external_id']}] {t['title'][:60]}")

# Check for duplicates between pages
titles_1 = {t["title"] for t in tenders}
titles_2 = {t["title"] for t in page2}
titles_3 = {t["title"] for t in page3}
overlap_12 = titles_1 & titles_2
overlap_23 = titles_2 & titles_3
print(f"\nOverlap page1-2: {len(overlap_12)}")
print(f"Overlap page2-3: {len(overlap_23)}")
