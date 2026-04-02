"""Database helper – connects to SQL Server and inserts scraped tenders."""

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
