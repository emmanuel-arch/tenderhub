"""Try different URL patterns to get paginated KRA tenders."""
import requests
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

# Try various pagination URL patterns
patterns = [
    "https://kra.go.ke/tenders?start=10",
    "https://kra.go.ke/tenders?limitstart=10",
    "https://kra.go.ke/tenders?page=2",
    "https://kra.go.ke/tenders/2",
    "https://kra.go.ke/tenders?offset=10",
    # Joomla-style
    "https://kra.go.ke/component/kra_tenders/?start=10",
    "https://kra.go.ke/component/kra_tenders/?limitstart=10",
    # Try AJAX-style
    "https://kra.go.ke/index.php?option=com_kra_tenders&task=filter&start=10",
]

for url in patterns:
    try:
        resp = requests.get(url, headers=headers, timeout=15, verify=False)
        soup = BeautifulSoup(resp.text, "lxml")
        wrappers = soup.select("div.doc-wrapper")
        
        # Get first tender title to check if it's different from page 1
        first_title = ""
        if wrappers:
            dt = wrappers[0].select_one("div.doc-title p:not(.subtitle)")
            if dt:
                first_title = dt.get_text(strip=True)[:60]
        
        print(f"  {url}")
        print(f"    Status: {resp.status_code}, Tenders: {len(wrappers)}, First: {first_title}")
    except Exception as e:
        print(f"  {url} -> ERROR: {e}")

# Also try POST requests (common for Joomla AJAX)
print("\n=== POST attempts ===")
post_patterns = [
    ("https://kra.go.ke/tenders", {"start": 10}),
    ("https://kra.go.ke/tenders", {"limitstart": 10, "filter_category": 0}),
    ("https://kra.go.ke/index.php", {"option": "com_kra_tenders", "task": "filterTenders", "cat": 0, "start": 10, "page": 2}),
]

for url, data in post_patterns:
    try:
        resp = requests.post(url, data=data, headers=headers, timeout=15, verify=False)
        soup = BeautifulSoup(resp.text, "lxml")
        wrappers = soup.select("div.doc-wrapper")
        print(f"  POST {url} data={data}")
        print(f"    Status: {resp.status_code}, Tenders: {len(wrappers)}, Size: {len(resp.text)}")
        if len(resp.text) < 5000 and wrappers:
            print(f"    Body preview: {resp.text[:300]}")
    except Exception as e:
        print(f"  POST {url} -> ERROR: {e}")

# The filterTenders(0, offset, page) pattern - maybe it's an AJAX call
# Let's check if there's a separate endpoint that returns just the tender list HTML
print("\n=== AJAX fragment attempts ===")
ajax_urls = [
    "https://kra.go.ke/tenders?format=raw&start=10",
    "https://kra.go.ke/tenders?tmpl=component&start=10",
    "https://kra.go.ke/index.php?option=com_kra_tenders&view=tenders&format=json",
    "https://kra.go.ke/index.php?option=com_kra_tenders&view=tenders&tmpl=component&start=10",
]

for url in ajax_urls:
    try:
        resp = requests.get(url, headers=headers, timeout=15, verify=False)
        soup = BeautifulSoup(resp.text, "lxml")
        wrappers = soup.select("div.doc-wrapper")
        print(f"  {url}")
        print(f"    Status: {resp.status_code}, Tenders: {len(wrappers)}, Size: {len(resp.text)}")
    except Exception as e:
        print(f"  {url} -> ERROR: {e}")
