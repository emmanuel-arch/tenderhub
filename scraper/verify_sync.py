"""Verify the new fields populated by the tenders.go.ke sync."""
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=45.150.188.26,4420;'
    'DATABASE=TenderHub;'
    'UID=tester;PWD=Ngong123@;'
    'TrustServerCertificate=yes'
)
cursor = conn.cursor()

# Count totals
cursor.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source = 'tenders.go.ke'")
total = cursor.fetchone()[0]
print(f"Total tenders.go.ke tenders: {total}")

# Check fill rates for new columns
cols = [
    'SubmissionMethodName', 'BidValidityDays', 'Venue',
    'PeEmail', 'PePhone', 'PeAddress', 'TenderFee',
    'DocumentUrl', 'TenderNoticeUrl', 'BidBondAmount',
    'ProcurementMethod', 'SubCategory'
]

print(f"\n{'Column':<25} {'Non-Null':>10} {'Fill %':>8}")
print("-" * 45)
for col in cols:
    if col in ('TenderFee', 'BidBondAmount'):
        cursor.execute(f"SELECT COUNT(*) FROM ScrapedTenders WHERE Source = 'tenders.go.ke' AND {col} > 0")
    else:
        cursor.execute(f"SELECT COUNT(*) FROM ScrapedTenders WHERE Source = 'tenders.go.ke' AND {col} IS NOT NULL AND {col} != ''")
    filled = cursor.fetchone()[0]
    pct = (filled / total * 100) if total > 0 else 0
    print(f"{col:<25} {filled:>10} {pct:>7.1f}%")

# Sample a few records
print("\n\nSample records (first 3):")
cursor.execute("""
    SELECT TOP 3 Title, SubmissionMethodName, BidValidityDays, Venue, 
           PeEmail, PePhone, PeAddress, TenderFee, BidBondAmount
    FROM ScrapedTenders 
    WHERE Source = 'tenders.go.ke' AND SubmissionMethodName IS NOT NULL
""")
for row in cursor.fetchall():
    print(f"\n  Title: {row[0][:80]}...")
    print(f"  SubmissionMethod: {row[1]}")
    print(f"  BidValidityDays: {row[2]}")
    print(f"  Venue: {row[3]}")
    print(f"  PeEmail: {row[4]}")
    print(f"  PePhone: {row[5]}")
    print(f"  PeAddress: {row[6][:80] if row[6] else None}...")
    print(f"  TenderFee: {row[7]}")
    print(f"  BidBondAmount: {row[8]}")

conn.close()
