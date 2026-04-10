"""Verify parsed document details in the database."""
from db import get_connection
import json

conn = get_connection()
cur = conn.cursor()

cur.execute("""
    SELECT d.TenderId, t.Title, d.BidBondAmount, d.BidBondForm, d.BidValidityPeriod,
           d.SubmissionDeadline, d.SubmissionMethod, d.PreBidMeetingDate,
           d.MandatorySiteVisit, d.MinAnnualTurnover, d.MinLiquidAssets,
           d.KeyPersonnel, d.KeyEquipment, d.DocumentParsed, d.ParseError
    FROM TenderDocumentDetails d
    JOIN ScrapedTenders t ON t.Id = d.TenderId
    ORDER BY d.CreatedAt DESC
""")

rows = cur.fetchall()
print(f"=== {len(rows)} parsed documents in DB ===\n")

for row in rows:
    print(f"Tender: {row[1][:70]}")
    print(f"  Bid Bond Amount: {row[2] or 'N/A'}")
    print(f"  Bid Bond Form: {row[3] or 'N/A'}")
    print(f"  Bid Validity: {row[4] or 'N/A'}")
    print(f"  Submission Deadline: {row[5] or 'N/A'}")
    print(f"  Submission Method: {row[6] or 'N/A'}")
    print(f"  Pre-bid Meeting: {row[7] or 'N/A'}")
    print(f"  Site Visit: {row[8]}")
    print(f"  Min Turnover: {row[9] or 'N/A'}")
    print(f"  Min Liquid: {row[10] or 'N/A'}")
    
    personnel = json.loads(row[11]) if row[11] else []
    equipment = json.loads(row[12]) if row[12] else []
    print(f"  Key Personnel: {len(personnel)} entries")
    for p in personnel[:3]:
        print(f"    - {p}")
    print(f"  Key Equipment: {len(equipment)} entries")
    for e in equipment[:3]:
        print(f"    - {e}")
    print(f"  Parsed: {row[13]}, Error: {row[14] or 'None'}")
    print()

conn.close()
