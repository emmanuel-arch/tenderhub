"""Inspect KRA pagination structure."""
import requests
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

# Fetch page 1
resp = requests.get("https://kra.go.ke/tenders", headers=headers, timeout=30, verify=False)
soup = BeautifulSoup(resp.text, "lxml")

# Look for pagination elements
print("=== Pagination Elements ===")
# Common pagination patterns
for sel in [".pagination", "nav.pagination", ".paging", ".page-numbers",
            "ul.pagination", ".doc-pagination", ".page-navigation"]:
    els = soup.select(sel)
    if els:
        print(f"Found: {sel} ({len(els)} matches)")
        for el in els:
            print(f"  HTML: {str(el)[:500]}")

# Look for any links with "page" in href
print("\n=== Links with 'page' in href ===")
page_links = soup.find_all("a", href=lambda h: h and "page" in h.lower())
for link in page_links[:10]:
    print(f"  {link.get('href')} -> {link.get_text(strip=True)}")

# Look for links with limitstart or start params (Joomla)
print("\n=== Links with 'start' or 'limit' in href ===")
start_links = soup.find_all("a", href=lambda h: h and ("start" in h.lower() or "limit" in h.lower()))
for link in start_links[:10]:
    print(f"  {link.get('href')} -> {link.get_text(strip=True)}")

# Look for any numbered navigation links
print("\n=== Any links with just numbers as text ===")
num_links = soup.find_all("a", string=lambda s: s and s.strip().isdigit())
for link in num_links[:10]:
    print(f"  {link.get('href')} -> {link.get_text(strip=True)}")

# Look for Next/Prev links
print("\n=== Next/Previous links ===")
for text in ["Next", "next", "»", "›", "Previous", "prev", "«", "‹"]:
    links = soup.find_all("a", string=lambda s: s and text in s)
    for link in links:
        print(f"  '{text}': {link.get('href')} -> {link.get_text(strip=True)}")

# Count tenders on page 1
rows = soup.select("div.doc-wrapper")
print(f"\n=== Tenders on page 1: {len(rows)} ===")

# Check if there is a "show all" or total count anywhere
print("\n=== Looking for total count text ===")
for text_el in soup.find_all(string=lambda s: s and ("total" in s.lower() or "showing" in s.lower() or "of " in s.lower())):
    clean = text_el.strip()
    if clean and len(clean) < 100:
        print(f"  {clean}")
