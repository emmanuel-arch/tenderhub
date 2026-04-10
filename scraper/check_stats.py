"""Quick DB stats check."""
from db import get_connection

with get_connection() as conn:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM ScrapedTenders")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE DocumentUrl IS NOT NULL AND DocumentUrl <> ''")
    with_url = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM TenderDocumentDetails")
    parsed = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM TenderDocumentDetails WHERE DocumentParsed = 1")
    parsed_ok = cur.fetchone()[0]

    cur.execute("SELECT Source, COUNT(*) as cnt FROM ScrapedTenders GROUP BY Source")
    sources = cur.fetchall()

    cur.execute("SELECT s.Source, COUNT(*) as cnt FROM ScrapedTenders s WHERE s.DocumentUrl IS NOT NULL AND s.DocumentUrl <> '' GROUP BY s.Source")
    sources_with_url = cur.fetchall()

    cur.execute("SELECT s.Source, COUNT(*) as cnt FROM ScrapedTenders s INNER JOIN TenderDocumentDetails d ON d.TenderId = s.Id GROUP BY s.Source")
    sources_parsed = cur.fetchall()

    # Check unparsed with URL
    cur.execute("""
        SELECT TOP 5 s.Source, s.Title, s.DocumentUrl
        FROM ScrapedTenders s
        LEFT JOIN TenderDocumentDetails d ON d.TenderId = s.Id
        WHERE s.DocumentUrl IS NOT NULL AND s.DocumentUrl <> ''
          AND d.Id IS NULL
        ORDER BY s.CreatedAt DESC
    """)
    unparsed_samples = cur.fetchall()

print(f"Total tenders: {total}")
print(f"With DocumentUrl: {with_url}")
print(f"TenderDocumentDetails rows: {parsed}")
print(f"Successfully parsed (DocumentParsed=1): {parsed_ok}")
print(f"\nBy source (total):")
for r in sources:
    print(f"  {r[0]}: {r[1]}")
print(f"\nBy source (with URL):")
for r in sources_with_url:
    print(f"  {r[0]}: {r[1]}")
print(f"\nBy source (already parsed):")
for r in sources_parsed:
    print(f"  {r[0]}: {r[1]}")
print(f"\nSample unparsed tenders with URLs:")
for r in unparsed_samples:
    print(f"  [{r[0]}] {r[1][:60]}... -> {r[2][:80]}...")
