"""TenderHub Kenya – Scraper entry point.

Usage:
    python main.py              # scrape all sources
    python main.py afa          # scrape AFA only
    python main.py kra          # scrape KRA only
    python main.py egp          # scrape eGP Kenya only
    python main.py afa kra      # scrape AFA and KRA
"""

import logging
import sys
import time

from db import ensure_table, ensure_doc_details_table, save_tenders
from scrapers import scrape_afa, scrape_kra, scrape_egp
from parse_documents import run_batch as parse_batch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("main")

SCRAPERS = {
    "afa": ("AFA – Agriculture & Food Authority", scrape_afa),
    "kra": ("KRA – Kenya Revenue Authority", scrape_kra),
    "egp": ("eGP – e-Government Procurement Kenya", scrape_egp),
}


def run(sources: list[str] | None = None):
    """Run the specified scrapers (or all if none given)."""
    targets = sources or list(SCRAPERS)
    log.info("Starting scrape run for: %s", ", ".join(targets))
    start = time.time()

    ensure_table()
    ensure_doc_details_table()

    total_inserted = 0
    for key in targets:
        if key not in SCRAPERS:
            log.warning("Unknown source '%s' – skipping.", key)
            continue
        label, scraper_fn = SCRAPERS[key]
        log.info("── %s ──", label)
        try:
            tenders = scraper_fn()
            inserted = save_tenders(tenders)
            total_inserted += inserted
            log.info("%s: %d new tenders saved.", key.upper(), inserted)
        except Exception:
            log.exception("Error scraping %s.", label)

    elapsed = time.time() - start
    log.info("Scrape run complete. %d new tenders total (%.1fs).", total_inserted, elapsed)

    # ── Parse document PDFs for any tenders that still need it ──
    log.info("── Document Parsing ──")
    try:
        parse_batch(limit=200)
    except Exception:
        log.exception("Document parsing failed.")

    return total_inserted


if __name__ == "__main__":
    sources = [s.lower() for s in sys.argv[1:]] or None
    run(sources)
