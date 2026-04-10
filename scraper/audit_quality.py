"""Audit TenderDocumentDetails quality — null field counts and quality scores."""
from db import get_connection

conn = get_connection()
cur = conn.cursor()

# Total document details
cur.execute('SELECT COUNT(*) FROM TenderDocumentDetails')
total = cur.fetchone()[0]
print(f'Total TenderDocumentDetails rows: {total}')

cur.execute('SELECT COUNT(*) FROM TenderDocumentDetails WHERE DocumentParsed=1')
parsed_ok = cur.fetchone()[0]
print(f'Parsed OK: {parsed_ok}')

cur.execute('SELECT COUNT(*) FROM TenderDocumentDetails WHERE DocumentParsed=0')
failed = cur.fetchone()[0]
print(f'Failed: {failed}')

print()
print('=== NULL FIELD COUNTS (out of parsed OK rows) ===')
fields = [
    'BidBondAmount', 'BidBondForm', 'BidBondValidity', 'BidValidityPeriod',
    'SubmissionDeadline', 'SubmissionMethod', 'PreBidMeetingDate', 'PreBidMeetingLink',
    'ClarificationDeadline', 'MandatorySiteVisit', 'NumberOfBidCopies',
    'MinAnnualTurnover', 'MinLiquidAssets', 'MinSingleContractValue',
    'MinCombinedContractValue', 'CashFlowRequirement', 'AuditedFinancialsYears',
    'KeyPersonnel', 'KeyEquipment'
]
for f in fields:
    cur.execute(f"SELECT COUNT(*) FROM TenderDocumentDetails WHERE DocumentParsed=1 AND ({f} IS NULL OR {f} = '')")
    null_count = cur.fetchone()[0]
    pct = (null_count / parsed_ok * 100) if parsed_ok else 0
    print(f'  {f}: {null_count}/{parsed_ok} null ({pct:.0f}%)')

print()
print('=== QUALITY SCORE: How many of 13 key fields are filled per tender? ===')
# 13 key fields the client wants
key13 = ['BidBondAmount', 'BidBondForm', 'BidValidityPeriod', 'SubmissionDeadline',
         'SubmissionMethod', 'PreBidMeetingDate', 'PreBidMeetingLink',
         'MinAnnualTurnover', 'MinLiquidAssets', 'AuditedFinancialsYears',
         'KeyPersonnel', 'KeyEquipment', 'NumberOfBidCopies']
case_parts = ' + '.join([f"CASE WHEN {f} IS NOT NULL AND {f} != '' THEN 1 ELSE 0 END" for f in key13])
sql = f"SELECT ({case_parts}) as filled_count, COUNT(*) as cnt FROM TenderDocumentDetails WHERE DocumentParsed=1 GROUP BY ({case_parts}) ORDER BY ({case_parts})"
cur.execute(sql)
for row in cur.fetchall():
    print(f'  {row[0]}/13 fields filled: {row[1]} tenders')

print()
print('=== SAMPLE: What does a typical low-quality row look like? ===')
cur.execute(f"""
SELECT TOP 3 t.Title, t.DocumentUrl, d.BidBondAmount, d.SubmissionDeadline, d.SubmissionMethod,
       d.MinAnnualTurnover, d.KeyPersonnel, d.KeyEquipment,
       ({case_parts}) as quality_score
FROM TenderDocumentDetails d
JOIN ScrapedTenders t ON t.Id = d.TenderId
WHERE d.DocumentParsed = 1
ORDER BY ({case_parts}) ASC
""")
for row in cur.fetchall():
    print(f'  Title: {row[0][:60]}')
    print(f'  DocUrl: {row[1]}')
    print(f'  BidBond={row[2]}, Deadline={row[3]}, Method={row[4]}')
    print(f'  Turnover={row[5]}, Personnel={str(row[6])[:50]}, Equipment={str(row[7])[:50]}')
    print(f'  Quality: {row[8]}/13')
    print()

print('=== SAMPLE: What does a high-quality row look like? ===')
cur.execute(f"""
SELECT TOP 3 t.Title, t.DocumentUrl, d.BidBondAmount, d.SubmissionDeadline, d.SubmissionMethod,
       d.MinAnnualTurnover, d.KeyPersonnel, d.KeyEquipment,
       ({case_parts}) as quality_score
FROM TenderDocumentDetails d
JOIN ScrapedTenders t ON t.Id = d.TenderId
WHERE d.DocumentParsed = 1
ORDER BY ({case_parts}) DESC
""")
for row in cur.fetchall():
    print(f'  Title: {row[0][:60]}')
    print(f'  DocUrl: {row[1]}')
    print(f'  BidBond={row[2]}, Deadline={row[3]}, Method={row[4]}')
    print(f'  Turnover={row[5]}, Personnel={str(row[6])[:50]}, Equipment={str(row[7])[:50]}')
    print(f'  Quality: {row[8]}/13')
    print()

# Also check: how many ScrapedTenders from tenders.go.ke have URLs?
cur.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke'")
total_tgo = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM ScrapedTenders WHERE Source='tenders.go.ke' AND DocumentUrl IS NOT NULL AND DocumentUrl != ''")
with_url = cur.fetchone()[0]
print(f'=== tenders.go.ke: {total_tgo} total, {with_url} with DocumentUrl ===')

conn.close()
