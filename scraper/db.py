"""Database helper – connects to SQL Server and inserts scraped tenders."""
from __future__ import annotations

import json
import logging
import pyodbc
from config import DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD

log = logging.getLogger(__name__)

_CONN_STR = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    "Encrypt=yes;TrustServerCertificate=yes;"
)

# ---------- schema bootstrap ---------------------------------------------------

_CREATE_TABLE_SQL = """
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'ScrapedTenders'
)
BEGIN
    CREATE TABLE ScrapedTenders (
        Id              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        Source          NVARCHAR(50)     NOT NULL,
        ExternalId      NVARCHAR(200),
        Title           NVARCHAR(500)    NOT NULL,
        TenderNumber    NVARCHAR(200),
        ProcuringEntity NVARCHAR(300),
        Deadline        DATETIME2,
        Category        NVARCHAR(50)     DEFAULT 'Government',
        SubCategory     NVARCHAR(50),
        Summary         NVARCHAR(MAX),
        Description     NVARCHAR(MAX),
        DocumentUrl     NVARCHAR(MAX),
        TenderNoticeUrl NVARCHAR(MAX),
        BidBondRequired BIT              DEFAULT 0,
        BidBondAmount   DECIMAL(18,2)    DEFAULT 0,
        DocumentReleaseDate DATETIME2,
        ProcurementMethod   NVARCHAR(100),
        StartDate       DATETIME2,
        EndDate         DATETIME2,
        CreatedAt       DATETIME2        DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2        DEFAULT GETUTCDATE()
    );

    CREATE UNIQUE INDEX UQ_ScrapedTenders_Source_Title
        ON ScrapedTenders (Source, Title);
END
"""


def get_connection() -> pyodbc.Connection:
    return pyodbc.connect(_CONN_STR, timeout=30)


def ensure_table():
    """Create the ScrapedTenders table if it does not yet exist."""
    with get_connection() as conn:
        conn.execute(_CREATE_TABLE_SQL)
        conn.commit()
    log.info("ScrapedTenders table ready.")


# ---------- insert helpers ------------------------------------------------------

_INSERT_SQL = """
INSERT INTO ScrapedTenders (
    Source, ExternalId, Title, TenderNumber, ProcuringEntity,
    Deadline, Category, SubCategory, Summary, Description,
    DocumentUrl, TenderNoticeUrl, BidBondRequired, BidBondAmount,
    DocumentReleaseDate, ProcurementMethod, StartDate, EndDate
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

_EXISTS_SQL = """
SELECT 1 FROM ScrapedTenders WHERE Source = ? AND Title = ?
"""


def tender_exists(cursor, source: str, title: str) -> bool:
    cursor.execute(_EXISTS_SQL, source, title)
    return cursor.fetchone() is not None


# Max column widths to prevent truncation errors
_MAX_LENGTHS = {
    "source": 50, "external_id": 200, "title": 500, "tender_number": 200,
    "procuring_entity": 300, "category": 50, "sub_category": 50,
    "procurement_method": 100,
}


def _truncate(tender: dict) -> dict:
    """Truncate string values that exceed column widths."""
    for key, max_len in _MAX_LENGTHS.items():
        val = tender.get(key)
        if isinstance(val, str) and len(val) > max_len:
            tender[key] = val[:max_len]
    return tender


def insert_tender(cursor, tender: dict):
    """Insert a single tender dict. Caller must commit."""
    tender = _truncate(tender)
    cursor.execute(
        _INSERT_SQL,
        tender.get("source"),
        tender.get("external_id"),
        tender.get("title"),
        tender.get("tender_number"),
        tender.get("procuring_entity"),
        tender.get("deadline"),
        tender.get("category", "Government"),
        tender.get("sub_category"),
        tender.get("summary"),
        tender.get("description"),
        tender.get("document_url"),
        tender.get("tender_notice_url"),
        tender.get("bid_bond_required", False),
        tender.get("bid_bond_amount", 0),
        tender.get("document_release_date"),
        tender.get("procurement_method"),
        tender.get("start_date"),
        tender.get("end_date"),
    )


def save_tenders(tenders: list[dict]) -> int:
    """Save a batch of tender dicts, skipping duplicates. Returns count of new rows."""
    if not tenders:
        return 0

    inserted = 0
    with get_connection() as conn:
        cur = conn.cursor()
        for t in tenders:
            if tender_exists(cur, t["source"], t["title"]):
                log.debug("Skipping duplicate: %s – %s", t["source"], t["title"])
                continue
            try:
                insert_tender(cur, t)
                inserted += 1
            except pyodbc.IntegrityError:
                log.debug("Integrity error (duplicate): %s", t["title"])
        conn.commit()

    log.info("Inserted %d / %d tenders.", inserted, len(tenders))
    return inserted


# ── TenderDocumentDetails table ─────────────────────────────────────────────

_CREATE_DOC_DETAILS_TABLE = """
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'TenderDocumentDetails'
)
BEGIN
    CREATE TABLE TenderDocumentDetails (
        Id                       UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        TenderId                 UNIQUEIDENTIFIER NOT NULL,

        -- Section 1: Key Requirements
        BidBondAmount            NVARCHAR(200),
        BidBondForm              NVARCHAR(200),
        BidBondValidity          NVARCHAR(100),
        BidValidityPeriod        NVARCHAR(100),
        SubmissionDeadline       NVARCHAR(200),
        SubmissionMethod         NVARCHAR(100),
        PreBidMeetingDate        NVARCHAR(200),
        PreBidMeetingLink        NVARCHAR(500),
        ClarificationDeadline    NVARCHAR(200),
        MandatorySiteVisit       BIT              DEFAULT 0,
        NumberOfBidCopies        NVARCHAR(50),

        -- Section 2: Financial Qualification Thresholds
        MinAnnualTurnover        NVARCHAR(200),
        MinLiquidAssets          NVARCHAR(200),
        MinSingleContractValue   NVARCHAR(200),
        MinCombinedContractValue NVARCHAR(200),
        CashFlowRequirement      NVARCHAR(200),
        AuditedFinancialsYears   NVARCHAR(100),

        -- Section 3: Key Personnel (JSON array)
        KeyPersonnel             NVARCHAR(MAX),

        -- Section 4: Key Equipment (JSON array)
        KeyEquipment             NVARCHAR(MAX),

        -- Raw extracted text for each section
        KeyRequirementsRaw       NVARCHAR(MAX),
        FinancialQualificationsRaw NVARCHAR(MAX),
        KeyPersonnelRaw          NVARCHAR(MAX),
        KeyEquipmentRaw          NVARCHAR(MAX),

        -- Metadata
        DocumentParsed           BIT              DEFAULT 0,
        ParsedDocumentUrl        NVARCHAR(MAX),
        ParseError               NVARCHAR(MAX),
        CreatedAt                DATETIME2        DEFAULT GETUTCDATE(),
        UpdatedAt                DATETIME2        DEFAULT GETUTCDATE(),

        CONSTRAINT FK_TenderDocDetails_ScrapedTenders
            FOREIGN KEY (TenderId) REFERENCES ScrapedTenders(Id)
    );

    CREATE UNIQUE INDEX UQ_TenderDocDetails_TenderId
        ON TenderDocumentDetails (TenderId);
END
"""


def ensure_doc_details_table():
    """Create the TenderDocumentDetails table if it does not yet exist."""
    with get_connection() as conn:
        conn.execute(_CREATE_DOC_DETAILS_TABLE)
        conn.commit()
    log.info("TenderDocumentDetails table ready.")


_INSERT_DOC_DETAIL = """
INSERT INTO TenderDocumentDetails (
    TenderId,
    BidBondAmount, BidBondForm, BidBondValidity, BidValidityPeriod,
    SubmissionDeadline, SubmissionMethod, PreBidMeetingDate, PreBidMeetingLink,
    ClarificationDeadline, MandatorySiteVisit, NumberOfBidCopies,
    MinAnnualTurnover, MinLiquidAssets, MinSingleContractValue,
    MinCombinedContractValue, CashFlowRequirement, AuditedFinancialsYears,
    KeyPersonnel, KeyEquipment,
    KeyRequirementsRaw, FinancialQualificationsRaw,
    KeyPersonnelRaw, KeyEquipmentRaw,
    DocumentParsed, ParsedDocumentUrl, ParseError
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

_UPDATE_DOC_DETAIL = """
UPDATE TenderDocumentDetails SET
    BidBondAmount = ?, BidBondForm = ?, BidBondValidity = ?, BidValidityPeriod = ?,
    SubmissionDeadline = ?, SubmissionMethod = ?, PreBidMeetingDate = ?, PreBidMeetingLink = ?,
    ClarificationDeadline = ?, MandatorySiteVisit = ?, NumberOfBidCopies = ?,
    MinAnnualTurnover = ?, MinLiquidAssets = ?, MinSingleContractValue = ?,
    MinCombinedContractValue = ?, CashFlowRequirement = ?, AuditedFinancialsYears = ?,
    KeyPersonnel = ?, KeyEquipment = ?,
    KeyRequirementsRaw = ?, FinancialQualificationsRaw = ?,
    KeyPersonnelRaw = ?, KeyEquipmentRaw = ?,
    DocumentParsed = ?, ParsedDocumentUrl = ?, ParseError = ?,
    UpdatedAt = GETUTCDATE()
WHERE TenderId = ?
"""


def _doc_detail_exists(cursor, tender_id: str) -> bool:
    cursor.execute(
        "SELECT 1 FROM TenderDocumentDetails WHERE TenderId = ?", tender_id
    )
    return cursor.fetchone() is not None


def _trunc(val, max_len):
    """Truncate a string to max_len if needed."""
    if isinstance(val, str) and len(val) > max_len:
        return val[:max_len]
    return val


def save_document_details(tender_id: str, parsed: dict) -> bool:
    """Save parsed document details for a tender. Returns True if saved/updated."""
    personnel_json = json.dumps(parsed.get("key_personnel", []), default=str)
    equipment_json = json.dumps(parsed.get("key_equipment", []), default=str)

    params = (
        _trunc(parsed.get("bid_bond_amount"), 200),
        _trunc(parsed.get("bid_bond_form"), 200),
        _trunc(parsed.get("bid_bond_validity"), 100),
        _trunc(parsed.get("bid_validity_period"), 100),
        _trunc(parsed.get("submission_deadline"), 200),
        _trunc(parsed.get("submission_method"), 100),
        _trunc(parsed.get("pre_bid_meeting_date"), 200),
        _trunc(parsed.get("pre_bid_meeting_link"), 500),
        _trunc(parsed.get("clarification_deadline"), 200),
        parsed.get("mandatory_site_visit", False),
        _trunc(parsed.get("number_of_bid_copies"), 50),
        _trunc(parsed.get("min_annual_turnover"), 200),
        _trunc(parsed.get("min_liquid_assets"), 200),
        _trunc(parsed.get("min_single_contract_value"), 200),
        _trunc(parsed.get("min_combined_contract_value"), 200),
        _trunc(parsed.get("cash_flow_requirement"), 200),
        _trunc(parsed.get("audited_financials_years"), 100),
        personnel_json,
        equipment_json,
        parsed.get("key_requirements_raw"),
        parsed.get("financial_qualifications_raw"),
        parsed.get("key_personnel_raw"),
        parsed.get("key_equipment_raw"),
        parsed.get("document_parsed", False),
        parsed.get("parsed_document_url"),
        _trunc(parsed.get("parse_error"), 2000),
    )

    try:
        with get_connection() as conn:
            cur = conn.cursor()
            if _doc_detail_exists(cur, tender_id):
                cur.execute(_UPDATE_DOC_DETAIL, *params, tender_id)
            else:
                cur.execute(_INSERT_DOC_DETAIL, tender_id, *params)
            conn.commit()
        return True
    except Exception:
        log.exception("Failed to save document details for tender %s", tender_id)
        return False


def get_tenders_needing_parsing(limit: int = 50, source: str | None = None) -> list[dict]:
    """Return tenders that have a DocumentUrl but no parsed document details yet.
    
    Skips tenders that already have a TenderDocumentDetails row (even if parsing failed),
    so failed parses are not retried automatically. Use --tender-id to retry a specific one.
    """
    sql = """
    SELECT TOP (?) t.Id, t.Source, t.Title, t.DocumentUrl
    FROM ScrapedTenders t
    LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
    WHERE t.DocumentUrl IS NOT NULL
      AND t.DocumentUrl <> ''
      AND d.Id IS NULL
      AND (t.Deadline IS NULL OR t.Deadline >= GETUTCDATE())
    """
    params = [limit]
    if source:
        sql += "      AND t.Source = ?\n"
        params.append(source)
    sql += "    ORDER BY t.CreatedAt DESC\n"
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params)
        rows = cur.fetchall()
    return [
        {"id": str(row[0]), "source": row[1], "title": row[2], "document_url": row[3]}
        for row in rows
    ]


def reset_sparse_parses(source: str | None = None, min_fields: int = 3) -> int:
    """Delete TenderDocumentDetails rows that are too sparse to be useful.

    A row is considered sparse when BidBondAmount is effectively missing
    (NULL, blank, zero-ish, or N/A) and fewer than `min_fields` other key
    fields have a value. Only active tenders (deadline in the future or no
    deadline) are considered so we don't waste cycles on expired tenders.
    """
    sql = f"""
    DELETE d FROM TenderDocumentDetails d
    JOIN ScrapedTenders t ON t.Id = d.TenderId
    WHERE (t.Deadline IS NULL OR t.Deadline >= GETUTCDATE())
      AND (
            d.BidBondAmount IS NULL OR
            LTRIM(RTRIM(d.BidBondAmount)) = '' OR
            UPPER(LTRIM(RTRIM(d.BidBondAmount))) IN ('0', '0.0', '0.00', 'N/A', 'NA', 'NONE', 'NULL', 'KES 0', 'KES 0.0', 'KES 0.00')
          )
      AND (
            (CASE WHEN d.BidBondForm            IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.BidBondValidity         IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.BidValidityPeriod       IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.SubmissionDeadline      IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.SubmissionMethod        IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.PreBidMeetingDate       IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.MinAnnualTurnover       IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.MinLiquidAssets         IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.MinSingleContractValue  IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.MinCombinedContractValue IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.CashFlowRequirement     IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN d.AuditedFinancialsYears  IS NULL THEN 0 ELSE 1 END)
          ) < {min_fields}
    """
    params = []
    if source:
        sql += " AND t.Source = ?"
        params.append(source)
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params)
        deleted = cur.rowcount
        conn.commit()
    log.info("Deleted %d sparse parse records (min_fields=%d).", deleted, min_fields)
    return deleted


def reset_zero_bidbond_parses(source: str | None = None) -> int:
    """Delete TenderDocumentDetails rows where BidBondAmount is missing or zero,
    regardless of how many other fields are populated, so they get re-parsed."""
    sql = """
    DELETE d FROM TenderDocumentDetails d
    JOIN ScrapedTenders t ON t.Id = d.TenderId
    WHERE (t.Deadline IS NULL OR t.Deadline >= GETUTCDATE())
      AND (
            d.BidBondAmount IS NULL OR
            LTRIM(RTRIM(d.BidBondAmount)) = '' OR
            UPPER(LTRIM(RTRIM(d.BidBondAmount))) IN ('0', '0.0', '0.00', 'N/A', 'NA', 'NONE', 'NULL', 'KES 0', 'KES 0.0', 'KES 0.00')
          )
    """
    params = []
    if source:
        sql += " AND t.Source = ?"
        params.append(source)
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params)
        deleted = cur.rowcount
        conn.commit()
    log.info("Deleted %d zero-bidbond parse records.", deleted)
    return deleted


def reset_failed_parses(source: str | None = None) -> int:
    """Delete TenderDocumentDetails rows where DocumentParsed = 0 so they can be retried."""
    sql = """
    DELETE d FROM TenderDocumentDetails d
    JOIN ScrapedTenders t ON t.Id = d.TenderId
    WHERE d.DocumentParsed = 0
    """
    params = []
    if source:
        sql += " AND t.Source = ?"
        params.append(source)
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params)
        deleted = cur.rowcount
        conn.commit()
    log.info("Deleted %d failed parse records.", deleted)
    return deleted
