"""Quick check for bid bonds and document details."""
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=45.150.188.26,4420;'
    'DATABASE=TenderHub;'
    'UID=tester;PWD=Ngong123@;'
    'TrustServerCertificate=yes'
)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke' AND BidBondAmount > 0")
print(f"Tenders with BidBondAmount > 0: {cursor.fetchone()[0]}")

cursor.execute("SELECT TOP 5 Title, BidBondAmount FROM ScrapedTenders WHERE Source='tenders.go.ke' AND BidBondAmount > 0")
for r in cursor.fetchall():
    print(f"  {r[0][:70]}... = {r[1]}")

cursor.execute("SELECT COUNT(*) FROM TenderDocumentDetails")
print(f"\nTenderDocumentDetails rows: {cursor.fetchone()[0]}")

# Check how many tenders have documents to parse
cursor.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke' AND DocumentUrl IS NOT NULL AND DocumentUrl != ''")
print(f"Tenders with DocumentUrl: {cursor.fetchone()[0]}")

conn.close()
