"""Find the filterTenders JS function and its AJAX endpoint."""
import requests
import re
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

resp = requests.get("https://kra.go.ke/tenders", headers=headers, timeout=30, verify=False)
soup = BeautifulSoup(resp.text, "lxml")

# Get all JS file URLs
js_files = []
for script in soup.find_all("script", src=True):
    src = script["src"]
    if not src.startswith("http"):
        src = f"https://kra.go.ke{src}"
    js_files.append(src)

print(f"Found {len(js_files)} JS files")
for f in js_files:
    print(f"  {f}")

# Search each JS file for filterTenders
print("\n=== Searching JS files for filterTenders ===")
for js_url in js_files:
    try:
        r = requests.get(js_url, headers=headers, timeout=15, verify=False)
        if "filterTenders" in r.text:
            print(f"\nFOUND in: {js_url}")
            # Extract the function and surrounding context
            idx = r.text.index("filterTenders")
            start = max(0, idx - 200)
            end = min(len(r.text), idx + 2000)
            print(r.text[start:end])
    except Exception as e:
        print(f"  Error fetching {js_url}: {e}")

# Also check if there's an inline script we missed
print("\n=== Inline scripts with 'filter' or 'ajax' ===")
for script in soup.find_all("script"):
    text = script.string or ""
    if ("filter" in text.lower() or "ajax" in text.lower()) and len(text) > 50:
        print(f"  Script ({len(text)} chars): {text[:500]}")
        print("---")

# Check if the page already has ALL tenders rendered but just hidden
all_wrappers = soup.select("div.doc-wrapper")
print(f"\n=== Total doc-wrapper divs on page: {len(all_wrappers)} ===")

# Check for multiple doc-container sections
containers = soup.select("div.doc-container")
print(f"Total doc-container divs: {len(containers)}")
for i, c in enumerate(containers):
    wrappers = c.select("div.doc-wrapper")
    print(f"  Container {i+1}: {len(wrappers)} tenders, id={c.get('id')}, class={c.get('class')}")
