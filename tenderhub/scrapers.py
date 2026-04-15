"""scrapers package – re-exports all source scrapers for use in main.py."""

from afa_scraper import scrape_afa
from kra_scraper import scrape_kra
from egp_scraper import scrape_egp
from scrape_kengen_playwright import scrape_kengen_playwright as scrape_kengen
from scrape_redcross import scrape_redcross

__all__ = ["scrape_afa", "scrape_kra", "scrape_egp", "scrape_kengen", "scrape_redcross"]
