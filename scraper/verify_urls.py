"""Verify DocumentUrl vs TenderNoticeUrl after fix."""
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=45.150.188.26,4420;'
    'DATABASE=TenderHub;'
    'UID=tester;PWD=Ngong123@;'
    'TrustServerCertificate=yes'
)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke'")
total = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(*) FROM ScrapedTenders 
    WHERE Source='tenders.go.ke' 
    AND DocumentUrl = TenderNoticeUrl 
    AND DocumentUrl IS NOT NULL
""")
same = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(*) FROM ScrapedTenders 
    WHERE Source='tenders.go.ke' 
    AND DocumentUrl <> TenderNoticeUrl 
    AND DocumentUrl IS NOT NULL
    AND TenderNoticeUrl IS NOT NULL
""")
different = cursor.fetchone()[0]

print(f"Total tenders.go.ke: {total}")
print(f"DocumentUrl == TenderNoticeUrl: {same} ({same*100//total}%)")
print(f"DocumentUrl != TenderNoticeUrl: {different} ({different*100//total}%)")

# Check the KRA tender specifically
print("\n--- KRA Kisii Tender (285792) ---")
cursor.execute("""
    SELECT ExternalId, DocumentUrl, TenderNoticeUrl 
    FROM ScrapedTenders 
    WHERE ExternalId = '285792'
""")
row = cursor.fetchone()
if row:
    print(f"  ExternalId: {row[0]}")
    print(f"  DocumentUrl: {row[1]}")
    print(f"  TenderNoticeUrl: {row[2]}")
else:
    print("  Not found")

# Show some examples where they differ
print("\n--- Examples where DocumentUrl != TenderNoticeUrl ---")
cursor.execute("""
    SELECT TOP 5 Title, DocumentUrl, TenderNoticeUrl 
    FROM ScrapedTenders 
    WHERE Source='tenders.go.ke' 
    AND DocumentUrl <> TenderNoticeUrl 
    AND DocumentUrl IS NOT NULL
    AND TenderNoticeUrl IS NOT NULL
""")
for r in cursor.fetchall():
    print(f"\n  Title: {r[0][:70]}...")
    print(f"  DocUrl:    {r[1][:100]}")
    print(f"  NoticeUrl: {r[2][:100]}")

conn.close()
