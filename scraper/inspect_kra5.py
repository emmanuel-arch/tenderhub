"""Verify KRA pagination and count total pages."""
import requests
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0"}

offsets = [0, 10, 20, 590, 600, 610]
for offset in offsets:
    url = f"https://kra.go.ke/tenders?offset={offset}"
    resp = requests.get(url, headers=headers, timeout=15, verify=False)
    soup = BeautifulSoup(resp.text, "lxml")
    wrappers = soup.select("div.doc-wrapper")
    
    titles = []
    for w in wrappers:
        dt = w.select_one("div.doc-title")
        if dt:
            # Get the non-subtitle text
            ps = [p for p in dt.select("p") if "subtitle" not in " ".join(p.get("class", []))]
            if ps:
                titles.append(ps[0].get_text(strip=True)[:60])
    
    print(f"offset={offset}: {len(wrappers)} tenders")
    for t in titles[:2]:
        print(f"  - {t}")
