"""Inspect eGP API calls for tender listing, view notice, and download."""
import json
from playwright.sync_api import sync_playwright

EGP_URL = "https://egpkenya.go.ke/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA)
    page = ctx.new_page()

    # Capture ALL network requests/responses
    captured = []

    def on_response(resp):
        url = resp.url
        if "egpkenya.go.ke/api" in url:
            try:
                body = resp.json()
            except Exception:
                body = None
            captured.append({"url": url, "status": resp.status, "body": body})

    page.on("response", on_response)

    page.goto(EGP_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(10000)

    print("=== API calls during page load ===")
    for c in captured:
        print(f"\n  URL: {c['url']}")
        print(f"  Status: {c['status']}")
        if c["body"]:
            body_str = json.dumps(c["body"], indent=2, default=str)
            # Only show first 500 chars of response
            print(f"  Body: {body_str[:500]}")

    # Now try clicking "View Tender Notice" on the first tender
    captured.clear()
    print("\n\n=== Clicking 'View Tender Notice' on first tender ===")
    view_btns = page.query_selector_all("a")
    first_view = None
    for btn in view_btns:
        if "View Tender Notice" in (btn.inner_text() or ""):
            first_view = btn
            break

    if first_view:
        first_view.click()
        page.wait_for_timeout(5000)
        print(f"Current URL after click: {page.url}")

        for c in captured:
            print(f"\n  URL: {c['url']}")
            print(f"  Status: {c['status']}")
            if c["body"]:
                body_str = json.dumps(c["body"], indent=2, default=str)
                print(f"  Body: {body_str[:1500]}")

        # Go back
        page.go_back(wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)

    # Now try clicking "Download Document" on the first tender
    captured.clear()
    print("\n\n=== Clicking 'Download Document' on first tender ===")
    dl_btns = page.query_selector_all("a")
    first_dl = None
    for btn in dl_btns:
        if "Download Document" in (btn.inner_text() or ""):
            first_dl = btn
            break

    if first_dl:
        # Set up download handler
        with page.expect_download(timeout=30000) as dl_info:
            first_dl.click()
        download = dl_info.value
        print(f"Download URL: {download.url}")
        print(f"Download suggested filename: {download.suggested_filename}")
        download.cancel()

        for c in captured:
            print(f"\n  URL: {c['url']}")
            print(f"  Status: {c['status']}")

    # Now check pagination - click page 2
    captured.clear()
    print("\n\n=== Clicking page 2 ===")
    page2_links = page.query_selector_all("li.page-item")
    for li in page2_links:
        text = (li.inner_text() or "").strip()
        if text == "2":
            li.query_selector("a.page-link").click()
            page.wait_for_timeout(5000)
            break

    print(f"URL after page 2 click: {page.url}")
    for c in captured:
        print(f"\n  URL: {c['url']}")
        print(f"  Status: {c['status']}")
        if c["body"]:
            body_str = json.dumps(c["body"], indent=2, default=str)
            print(f"  Body: {body_str[:1500]}")

    # Count tenders on page 2
    items2 = page.query_selector_all("div.card.custom-card")
    print(f"\nTenders on page 2: {len(items2)}")
    if items2:
        print(f"First tender on page 2: {items2[0].inner_text()[:200]}")

    browser.close()
    print("\nDone.")
