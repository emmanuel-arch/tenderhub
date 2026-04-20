-- ============================================================
-- verify_bidbond.sql
-- Run BEFORE and AFTER reparse_bidbond.py to compare results.
-- ============================================================

-- 1. Summary: count by quality bucket
SELECT
    CASE
        WHEN BidBondAmount IS NULL
            THEN 'NULL'
        WHEN BidBondAmount = 'Tender Security Not Required'
            THEN 'VALID – Not Required'
        WHEN BidBondAmount LIKE '%% of Tender Sum'
            THEN 'VALID – Percentage'
        WHEN BidBondAmount LIKE 'KES %'
             AND TRY_CAST(
                 REPLACE(REPLACE(REPLACE(SUBSTRING(BidBondAmount,5,50),' ',''),',',''),'.00','')
                 AS BIGINT) >= 1000
            THEN 'VALID – KES Amount'
        WHEN BidBondAmount LIKE 'KES %'
            THEN 'BAD – KES too small / malformed'
        WHEN BidBondAmount = 'Tender security Not Found'
            THEN 'BAD – Old parser label'
        WHEN BidBondAmount LIKE ',20%'
          OR BidBondAmount LIKE '20__,%%'
          OR BidBondAmount IN ('2022','2023','2024','2025','2026')
            THEN 'BAD – Date fragment'
        WHEN ISNUMERIC(BidBondAmount) = 1
            THEN 'BAD – Bare number'
        ELSE 'OTHER'
    END AS Bucket,
    COUNT(*) AS Records
FROM TenderDocumentDetails
GROUP BY
    CASE
        WHEN BidBondAmount IS NULL
            THEN 'NULL'
        WHEN BidBondAmount = 'Tender Security Not Required'
            THEN 'VALID – Not Required'
        WHEN BidBondAmount LIKE '%% of Tender Sum'
            THEN 'VALID – Percentage'
        WHEN BidBondAmount LIKE 'KES %'
             AND TRY_CAST(
                 REPLACE(REPLACE(REPLACE(SUBSTRING(BidBondAmount,5,50),' ',''),',',''),'.00','')
                 AS BIGINT) >= 1000
            THEN 'VALID – KES Amount'
        WHEN BidBondAmount LIKE 'KES %'
            THEN 'BAD – KES too small / malformed'
        WHEN BidBondAmount = 'Tender security Not Found'
            THEN 'BAD – Old parser label'
        WHEN BidBondAmount LIKE ',20%'
          OR BidBondAmount LIKE '20__,%%'
          OR BidBondAmount IN ('2022','2023','2024','2025','2026')
            THEN 'BAD – Date fragment'
        WHEN ISNUMERIC(BidBondAmount) = 1
            THEN 'BAD – Bare number'
        ELSE 'OTHER'
    END
ORDER BY Records DESC;


-- 2. All rows still needing attention after the reparse
SELECT
    d.TenderId,
    s.Source,
    s.Title,
    d.BidBondAmount,
    d.ParseError,
    d.UpdatedAt
FROM TenderDocumentDetails d
JOIN ScrapedTenders s ON s.Id = d.TenderId
WHERE
    d.BidBondAmount IS NULL
    OR d.BidBondAmount = 'Tender security Not Found'
    OR d.BidBondAmount LIKE ',20%'
    OR d.BidBondAmount IN ('2022','2023','2024','2025','2026')
    OR (
        d.BidBondAmount LIKE 'KES %'
        AND TRY_CAST(
            REPLACE(REPLACE(REPLACE(SUBSTRING(d.BidBondAmount,5,50),' ',''),',',''),'.00','')
            AS BIGINT) < 1000
    )
    OR (
        ISNUMERIC(d.BidBondAmount) = 1
        AND TRY_CAST(d.BidBondAmount AS BIGINT) IS NOT NULL
    )
ORDER BY s.Source, d.UpdatedAt DESC;


-- 3. Quick count: how many still bad after reparse?
SELECT COUNT(*) AS StillNeedingAttention
FROM TenderDocumentDetails d
WHERE
    d.BidBondAmount IS NULL
    OR d.BidBondAmount = 'Tender security Not Found'
    OR d.BidBondAmount LIKE ',20%'
    OR (
        d.BidBondAmount LIKE 'KES %'
        AND TRY_CAST(
            REPLACE(REPLACE(REPLACE(SUBSTRING(d.BidBondAmount,5,50),' ',''),',',''),'.00','')
            AS BIGINT) < 1000
    )
    OR (
        ISNUMERIC(d.BidBondAmount) = 1
        AND TRY_CAST(d.BidBondAmount AS BIGINT) IS NOT NULL
    );
