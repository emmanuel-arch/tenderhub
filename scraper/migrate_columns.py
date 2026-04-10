"""Add new columns to ScrapedTenders table."""
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=45.150.188.26,4420;'
    'DATABASE=TenderHub;'
    'UID=tester;PWD=Ngong123@;'
    'TrustServerCertificate=yes'
)
cursor = conn.cursor()

# Check which columns already exist
cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ScrapedTenders'")
existing = {row[0] for row in cursor.fetchall()}
print('Existing columns:', sorted(existing))

new_cols = {
    'SubmissionMethodName': 'NVARCHAR(200) NULL',
    'BidValidityDays': 'INT NULL',
    'Venue': 'NVARCHAR(500) NULL',
    'PeEmail': 'NVARCHAR(200) NULL',
    'PePhone': 'NVARCHAR(100) NULL',
    'PeAddress': 'NVARCHAR(500) NULL',
    'TenderFee': 'DECIMAL(18,2) NOT NULL DEFAULT 0',
}

for col, defn in new_cols.items():
    if col not in existing:
        sql = f'ALTER TABLE ScrapedTenders ADD {col} {defn}'
        print(f'Adding: {col}')
        cursor.execute(sql)
    else:
        print(f'Already exists: {col}')

conn.commit()
conn.close()
print('Done!')
