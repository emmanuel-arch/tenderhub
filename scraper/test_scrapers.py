"""Quick test – scrape AFA and KRA, print results (no DB needed)."""
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

from scrapers import scrape_afa, scrape_kra

print("=" * 60)
print("Testing AFA scraper...")
print("=" * 60)
afa = scrape_afa()
print(f"AFA: {len(afa)} tenders found")
for t in afa[:5]:
    title = t["title"][:80]
    doc = t["document_url"] or "N/A"
    print(f"  - {title}")
    print(f"    Download: {doc[:80]}")

print()
print("=" * 60)
print("Testing KRA scraper...")
print("=" * 60)
kra = scrape_kra()
print(f"KRA: {len(kra)} tenders found")
for t in kra[:5]:
    title = t["title"][:80]
    deadline = t["deadline"] or "N/A"
    doc = t["document_url"] or "N/A"
    print(f"  - {title}")
    print(f"    Deadline: {deadline}  |  Download: {doc[:80]}")
