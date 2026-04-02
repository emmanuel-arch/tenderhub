"""Inspect KRA filterTenders JS function and find the AJAX endpoint."""
import requests
from bs4 import BeautifulSoup
import re

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

resp = requests.get("https://kra.go.ke/tenders", headers=headers, timeout=30, verify=False)

# Search for filterTenders function definition
matches = re.findall(r'function\s+filterTenders[^}]+\}', resp.text, re.DOTALL)
for m in matches:
    print("=== filterTenders function ===")
    print(m[:1000])

# Also search for any AJAX/fetch/XMLHttpRequest calls related to tenders
print("\n=== AJAX/fetch calls ===")
ajax_patterns = re.findall(r'(?:ajax|fetch|XMLHttpRequest|\.get|\.post)\s*\([^)]*tender[^)]*\)', resp.text, re.IGNORECASE)
for p in ajax_patterns[:5]:
    print(f"  {p[:200]}")

# Search for filterTenders more broadly
print("\n=== filterTenders references ===")
for match in re.finditer(r'filterTenders[^\n]{0,200}', resp.text):
    line = match.group().strip()
    if len(line) > 10:
        print(f"  {line[:200]}")

# Look for any URL patterns with tenders
print("\n=== URL patterns with 'tender' ===")
url_matches = re.findall(r'["\']([^"\']*tender[^"\']*)["\']', resp.text, re.IGNORECASE)
for u in set(url_matches):
    if 'http' in u or '/' in u:
        print(f"  {u[:150]}")

# Get all script tags and look for the filterTenders definition
print("\n=== Script blocks containing filterTenders ===")
soup = BeautifulSoup(resp.text, "lxml")
for script in soup.find_all("script"):
    text = script.string or ""
    if "filterTenders" in text:
        # Print relevant section
        idx = text.index("filterTenders")
        start = max(0, idx - 100)
        end = min(len(text), idx + 1500)
        print(text[start:end])
        print("---")
