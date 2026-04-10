"""Reset TenderDocumentDetails so they get re-parsed after re-sync."""
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=45.150.188.26,4420;'
    'DATABASE=TenderHub;'
    'UID=tester;PWD=Ngong123@;'
    'TrustServerCertificate=yes'
)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM TenderDocumentDetails")
count = cursor.fetchone()[0]
print(f"TenderDocumentDetails rows before: {count}")

if count > 0:
    cursor.execute("DELETE FROM TenderDocumentDetails")
    conn.commit()
    print(f"Deleted {count} rows")

# Check current DocumentUrl vs TenderNoticeUrl situation
cursor.execute("""
    SELECT COUNT(*) FROM ScrapedTenders 
    WHERE Source='tenders.go.ke' 
    AND DocumentUrl = TenderNoticeUrl 
    AND DocumentUrl IS NOT NULL
""")
same = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke'")
total = cursor.fetchone()[0]
print(f"\nTenders where DocumentUrl == TenderNoticeUrl: {same}/{total}")

conn.close()
