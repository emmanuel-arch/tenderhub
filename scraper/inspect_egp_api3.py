"""Get the full tender list from eGP by intercepting the API response in Playwright."""
import json
from playwright.sync_api import sync_playwright

EGP_URL = "https://egpkenya.go.ke/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA)
    page = ctx.new_page()

    tender_api_responses = []

    def capture_response(resp):
        if "dashboard-tender-details" in resp.url and resp.status == 200:
            try:
                tender_api_responses.append(resp.json())
            except Exception:
                pass

    page.on("response", capture_response)

    page.goto(EGP_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(10000)

    tender_api_response = tender_api_responses[0] if tender_api_responses else None

    if tender_api_response:
        resp_data = tender_api_response.get("respData", {})
        tenders = resp_data.get("tenderDetails", [])
        print(f"Total active: {resp_data.get('totalCountActive')}")
        print(f"Total count: {resp_data.get('totalCount')}")
        print(f"Tenders in this response: {len(tenders)}")

        if tenders:
            print("\n=== FULL STRUCTURE of first tender ===")
            print(json.dumps(tenders[0], indent=2, default=str))

            print(f"\n=== All keys ===")
            print(sorted(tenders[0].keys()))

            print(f"\n=== First 3 tender IDs and titles ===")
            for t in tenders[:3]:
                print(f"  ID: {t.get('tenderdetailid')}")
                print(f"  Title: {t.get('tenderTitle', t.get('tendertitle', 'N/A'))}")
                print(f"  Ref: {t.get('tenderReferenceNo', t.get('tenderreferenceno', 'N/A'))}")
                print(f"  Entity: {t.get('procuringEntity', t.get('procuringentity', 'N/A'))}")
                print(f"  Category: {t.get('procurementCategory', t.get('procurementcategory', 'N/A'))}")
                print(f"  Start: {t.get('bidsubmissionstartdate', 'N/A')}")
                print(f"  End: {t.get('bidsubmissionenddate', 'N/A')}")
                print(f"  Tender Security: {t.get('tenderSecurityAmount', t.get('tendersecurityamount', 'N/A'))}")
                print()

            print(f"\n=== Last tender ===")
            last = tenders[-1]
            print(f"  ID: {last.get('tenderdetailid')}")
            print(f"  Title: {last.get('tenderTitle', last.get('tendertitle', 'N/A'))}")

        # Check if the API returns ALL tenders or just page 1
        if len(tenders) < resp_data.get("totalCountActive", 0):
            print(f"\n*** API returns only {len(tenders)} of {resp_data.get('totalCountActive')} active tenders ***")
            print("Need to figure out pagination...")
        else:
            print(f"\n*** API returns ALL {len(tenders)} tenders at once! ***")

    else:
        print("No API response captured!")

    # Now try clicking page 2 and see if a new API call is made
    print("\n\n=== Testing pagination ===")
    prev_count = len(tender_api_responses)
    
    page2_links = page.query_selector_all("a.page-link")
    for link in page2_links:
        text = (link.inner_text() or "").strip()
        if text == "2":
            print("Clicking page 2...")
            link.click()
            page.wait_for_timeout(5000)
            break

    if len(tender_api_responses) > prev_count:
        resp_data2 = tender_api_responses[-1].get("respData", {})
        tenders2 = resp_data2.get("tenderDetails", [])
        print(f"Page 2 tenders: {len(tenders2)}")
        if tenders2:
            print(f"First on page 2 ID: {tenders2[0].get('tenderdetailid')}")
    else:
        print("No new API call was made for page 2 - pagination is client-side!")
        # Count items visible
        cards = page.query_selector_all("div.card.custom-card")
        print(f"Cards visible on page 2: {len(cards)}")
        if cards:
            text = cards[0].inner_text()[:200]
            print(f"First card: {text}")

    browser.close()
    print("\nDone.")
