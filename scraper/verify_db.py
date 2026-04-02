"""Verify scraped tenders in the database."""
from db import get_connection

conn = get_connection()
cur = conn.cursor()

cur.execute("SELECT Source, COUNT(*) as cnt FROM ScrapedTenders GROUP BY Source")
print("=== Tenders in DB by Source ===")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} tenders")

cur.execute("SELECT COUNT(*) FROM ScrapedTenders")
total = cur.fetchone()[0]
print(f"  TOTAL: {total} tenders")

print("\n=== Sample tenders (3 most recent) ===")
cur.execute(
    "SELECT TOP 3 Source, Title, Deadline, DocumentUrl "
    "FROM ScrapedTenders ORDER BY CreatedAt DESC"
)
for row in cur.fetchall():
    doc = row[3] or "N/A"
    print(f"  [{row[0]}] {row[1][:70]}")
    print(f"    Deadline: {row[2]}  |  Doc: {doc[:70]}")

conn.close()
