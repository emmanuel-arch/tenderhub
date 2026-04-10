"""Check KRA document URLs."""
from db import get_connection

with get_connection() as conn:
    cur = conn.cursor()
    cur.execute("""
        SELECT TOP 10 Id, Title, DocumentUrl
        FROM ScrapedTenders
        WHERE Source = 'KRA'
          AND DocumentUrl IS NOT NULL AND DocumentUrl <> ''
        ORDER BY CreatedAt DESC
    """)
    rows = cur.fetchall()
    print(f"KRA tenders with DocumentUrl: {len(rows)} shown")
    for r in rows:
        print(f"\n  ID: {r[0]}")
        print(f"  Title: {r[1][:80]}")
        print(f"  URL:   {r[2][:120]}")
