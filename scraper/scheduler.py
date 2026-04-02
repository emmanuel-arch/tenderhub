"""Scheduled runner – executes the scraper every N hours.

Usage:
    python scheduler.py          # runs forever, scraping every SCRAPE_INTERVAL_HOURS
"""

import logging
import time

import schedule
from config import SCRAPE_INTERVAL_HOURS
from main import run

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("scheduler")


def job():
    log.info("Scheduled scrape triggered.")
    try:
        run()
    except Exception:
        log.exception("Scheduled scrape failed.")


if __name__ == "__main__":
    log.info("Scheduler started – scraping every %d hour(s).", SCRAPE_INTERVAL_HOURS)

    # Run immediately on start, then on schedule
    job()

    schedule.every(SCRAPE_INTERVAL_HOURS).hours.do(job)

    while True:
        schedule.run_pending()
        time.sleep(60)
