"""Check parsing quality and coverage after batch run."""
from db import get_connection

with get_connection() as conn:
    cur = conn.cursor()

    # Overall stats
    cur.execute("SELECT COUNT(*) FROM TenderDocumentDetails")
    total_parsed = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM TenderDocumentDetails WHERE DocumentParsed = 1")
    ok = cur.fetchone()[0]

    print(f"Total TenderDocumentDetails rows: {total_parsed}")
    print(f"Successfully parsed: {ok}")

    # Fields filled stats
    cur.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN BidBondAmount IS NOT NULL AND BidBondAmount <> 'N/A' THEN 1 ELSE 0 END) as has_bid_bond,
            SUM(CASE WHEN SubmissionDeadline IS NOT NULL AND SubmissionDeadline <> 'N/A' THEN 1 ELSE 0 END) as has_deadline,
            SUM(CASE WHEN SubmissionMethod IS NOT NULL AND SubmissionMethod <> 'N/A' THEN 1 ELSE 0 END) as has_method,
            SUM(CASE WHEN BidBondForm IS NOT NULL AND BidBondForm <> 'N/A' THEN 1 ELSE 0 END) as has_bond_form,
            SUM(CASE WHEN BidValidityPeriod IS NOT NULL AND BidValidityPeriod <> 'N/A' THEN 1 ELSE 0 END) as has_validity,
            SUM(CASE WHEN MinAnnualTurnover IS NOT NULL AND MinAnnualTurnover <> 'N/A' THEN 1 ELSE 0 END) as has_turnover,
            SUM(CASE WHEN KeyPersonnel IS NOT NULL AND KeyPersonnel <> '[]' THEN 1 ELSE 0 END) as has_personnel,
            SUM(CASE WHEN KeyEquipment IS NOT NULL AND KeyEquipment <> '[]' THEN 1 ELSE 0 END) as has_equipment
        FROM TenderDocumentDetails
        WHERE DocumentParsed = 1
    """)
    r = cur.fetchone()
    print(f"\nField coverage (out of {r[0]} parsed):")
    print(f"  Bid Bond Amount:     {r[1]}")
    print(f"  Submission Deadline: {r[2]}")
    print(f"  Submission Method:   {r[3]}")
    print(f"  Bid Bond Form:       {r[4]}")
    print(f"  Bid Validity:        {r[5]}")
    print(f"  Min Annual Turnover: {r[6]}")
    print(f"  Key Personnel:       {r[7]}")
    print(f"  Key Equipment:       {r[8]}")

    # By source
    cur.execute("""
        SELECT s.Source, COUNT(*) as cnt,
            SUM(CASE WHEN d.DocumentParsed = 1 THEN 1 ELSE 0 END) as parsed_ok
        FROM TenderDocumentDetails d
        JOIN ScrapedTenders s ON s.Id = d.TenderId
        GROUP BY s.Source
    """)
    print(f"\nBy source:")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]} total, {r[2]} parsed OK")

    # Remaining unparsed
    cur.execute("""
        SELECT s.Source, COUNT(*) as cnt
        FROM ScrapedTenders s
        LEFT JOIN TenderDocumentDetails d ON d.TenderId = s.Id
        WHERE s.DocumentUrl IS NOT NULL AND s.DocumentUrl <> ''
          AND (d.Id IS NULL OR d.DocumentParsed = 0)
        GROUP BY s.Source
    """)
    print(f"\nStill needing parsing:")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")

    # Check document sizes (raw text)
    cur.execute("""
        SELECT TOP 5 s.Title, LEN(d.KeyRequirementsRaw) as req_len, LEN(d.FinancialQualificationsRaw) as fin_len
        FROM TenderDocumentDetails d
        JOIN ScrapedTenders s ON s.Id = d.TenderId
        WHERE d.DocumentParsed = 1
          AND d.KeyRequirementsRaw IS NOT NULL
        ORDER BY LEN(d.KeyRequirementsRaw) DESC
    """)
    print(f"\nTop 5 by key_requirements raw text length:")
    for r in cur.fetchall():
        print(f"  {r[0][:50]}... req={r[1] or 0} chars, fin={r[2] or 0} chars")
