"""Quick test of the new eGP scraper."""
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

from scrapers import scrape_egp

tenders = scrape_egp()
print(f"\nTotal tenders scraped: {len(tenders)}")

if tenders:
    t = tenders[0]
    print(f"\n=== First tender ===")
    print(f"  ID:       {t['external_id']}")
    print(f"  Title:    {t['title'][:80]}")
    print(f"  Ref:      {t['tender_number']}")
    print(f"  Entity:   {(t['procuring_entity'] or '')[:60]}")
    print(f"  Category: {t['sub_category']}")
    print(f"  Method:   {t['procurement_method']}")
    print(f"  Deadline: {t['deadline']}")
    print(f"  Notice:   {t['tender_notice_url']}")

    t2 = tenders[-1]
    print(f"\n=== Last tender ===")
    print(f"  ID:       {t2['external_id']}")
    print(f"  Title:    {t2['title'][:80]}")
    print(f"  Deadline: {t2['deadline']}")
