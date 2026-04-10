"""Quick DB test — creates the table and queries for tenders needing parsing."""
from db import ensure_table, ensure_doc_details_table, get_tenders_needing_parsing

ensure_table()
ensure_doc_details_table()

tenders = get_tenders_needing_parsing(5)
print(f"Found {len(tenders)} tenders needing parsing")
for t in tenders[:5]:
    print(f"  [{t['source']}] {t['title'][:60]}")
    print(f"    URL: {t['document_url'][:80] if t['document_url'] else 'N/A'}")
