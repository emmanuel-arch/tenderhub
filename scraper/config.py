import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from scraper directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

DB_SERVER = os.getenv("DB_SERVER", "45.150.188.26,4420")
DB_NAME = os.getenv("DB_NAME", "TenderHub")
DB_USER = os.getenv("DB_USER", "tester")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Ngong123@")

SCRAPE_INTERVAL_HOURS = int(os.getenv("SCRAPE_INTERVAL_HOURS", "24"))

# Source URLs
AFA_URL = "https://www.afa.go.ke/tenders/"
KRA_URL = "https://kra.go.ke/tenders"
EGP_URL = "https://egpkenya.go.ke/"

# Request settings
REQUEST_TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

