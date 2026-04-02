"""Inspect the eGP dashboard-tender-details API directly."""
import json
import warnings
import requests

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
API_URL = "https://egpkenya.go.ke/api/xcommon/dashboard-tender-details"

# Try GET first
print("=== GET request ===")
resp = requests.get(API_URL, headers={"User-Agent": UA}, timeout=30, verify=False)
print(f"Status: {resp.status_code}")
data = resp.json()
print(f"Keys: {list(data.keys())}")
resp_data = data.get("respData", {})
print(f"totalCountActive: {resp_data.get('totalCountActive')}")
print(f"totalCount: {resp_data.get('totalCount')}")

tenders = resp_data.get("tenderDetails", [])
print(f"Tenders returned: {len(tenders)}")

if tenders:
    print("\n=== First tender (full JSON) ===")
    print(json.dumps(tenders[0], indent=2, default=str))
    
    print("\n=== Second tender (full JSON) ===")
    if len(tenders) > 1:
        print(json.dumps(tenders[1], indent=2, default=str))

    print(f"\n=== All keys in a tender ===")
    print(list(tenders[0].keys()))

    # Check the last tender
    print(f"\n=== Last tender ===")
    print(json.dumps(tenders[-1], indent=2, default=str))

# Try POST with pagination params
print("\n\n=== Trying POST with pagination ===")
for payload in [
    {"pageNo": 1, "pageSize": 5},
    {"page": 2, "size": 5},
    {"pageNumber": 2, "recordPerPage": 5},
]:
    try:
        resp2 = requests.post(API_URL, json=payload, headers={"User-Agent": UA, "Content-Type": "application/json"}, timeout=30, verify=False)
        print(f"POST {payload} -> status={resp2.status_code}")
        if resp2.status_code == 200:
            d2 = resp2.json()
            t2 = d2.get("respData", {}).get("tenderDetails", [])
            print(f"  Tenders returned: {len(t2)}")
    except Exception as e:
        print(f"POST {payload} -> error: {e}")

# Try GET with query params
print("\n=== Trying GET with query params ===")
for params in [
    {"page": 2, "size": 5},
    {"pageNo": 2, "pageSize": 5},
    {"start": 5, "limit": 5},
]:
    resp3 = requests.get(API_URL, params=params, headers={"User-Agent": UA}, timeout=30, verify=False)
    d3 = resp3.json()
    t3 = d3.get("respData", {}).get("tenderDetails", [])
    print(f"GET {params} -> status={resp3.status_code}, tenders={len(t3)}")
    if t3 and t3[0].get("tenderdetailid") != tenders[0].get("tenderdetailid"):
        print(f"  First tender ID: {t3[0].get('tenderdetailid')} (different from page 1!)")
    elif t3:
        print(f"  First tender ID: {t3[0].get('tenderdetailid')} (same as page 1)")
