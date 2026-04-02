"""Deep inspection of eGP Kenya page structure using Playwright."""
import json
from playwright.sync_api import sync_playwright

EGP_URL = "https://egpkenya.go.ke/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA)
    page = ctx.new_page()

    print("=== Loading eGP homepage ===")
    page.goto(EGP_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(10000)

    # 1. Check what URLs the page navigates / fetches (look for API calls)
    print("\n=== Current URL ===")
    print(page.url)

    # 2. Look for the tender listing structure
    print("\n=== Tender items on page ===")
    # From the screenshot each tender is in a card-like block with fields
    # Let's find the outer container
    items = page.query_selector_all("app-active-tender, .tender-item, .card, .tender-card")
    print(f"app-active-tender / .tender-item / .card count: {len(items)}")

    # Try broader selectors
    all_divs = page.query_selector_all("div")
    tender_divs = []
    for d in all_divs:
        text = (d.inner_text() or "").strip()
        if "Tender ID" in text and "Tender Title" in text and len(text) < 2000:
            tender_divs.append(d)
    print(f"Divs containing 'Tender ID' + 'Tender Title' (< 2000 chars): {len(tender_divs)}")

    if tender_divs:
        # Print the first one fully
        first = tender_divs[0]
        print("\n=== First tender div text ===")
        print(first.inner_text())
        print("\n=== First tender div HTML (outer) ===")
        html = first.evaluate("el => el.outerHTML")
        # Print just the first 3000 chars
        print(html[:3000])

    # 3. Check pagination
    print("\n=== Pagination ===")
    pag_items = page.query_selector_all("li.page-item, .pagination a, .pagination button, a.page-link")
    print(f"Pagination items found: {len(pag_items)}")
    for pi in pag_items[:10]:
        text = (pi.inner_text() or "").strip()
        href = pi.get_attribute("href") or ""
        cls = pi.get_attribute("class") or ""
        print(f"  [{text}] class={cls} href={href}")

    # 4. Check "View Tender Notice" and "Download Document" links
    print("\n=== View Tender Notice links ===")
    view_links = page.query_selector_all("a")
    for link in view_links:
        text = (link.inner_text() or "").strip()
        if "View Tender Notice" in text:
            href = link.get_attribute("href") or ""
            onclick = link.get_attribute("onclick") or ""
            print(f"  text='{text}' href='{href}' onclick='{onclick}'")

    print("\n=== Download Document links ===")
    for link in view_links:
        text = (link.inner_text() or "").strip()
        if "Download Document" in text:
            href = link.get_attribute("href") or ""
            onclick = link.get_attribute("onclick") or ""
            print(f"  text='{text}' href='{href}' onclick='{onclick}'")

    # 5. Try intercepting network requests to find API endpoints
    print("\n=== Checking for XHR/API calls ===")
    api_urls = []
    page.on("response", lambda resp: api_urls.append(resp.url) if "api" in resp.url.lower() or "tender" in resp.url.lower() else None)
    page.reload(wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(8000)
    print(f"API/tender URLs captured: {len(api_urls)}")
    for url in api_urls[:20]:
        print(f"  {url}")

    # 6. Check total pages from pagination text
    pag_text = page.query_selector("text='1 - 169'")
    if pag_text:
        print(f"\nPagination label: {pag_text.inner_text()}")
    else:
        # Try finding the "Go to page" or page count text
        spans = page.query_selector_all("span, div, p")
        for s in spans:
            t = (s.inner_text() or "").strip()
            if "169" in t and len(t) < 50:
                print(f"  Page info: '{t}'")

    browser.close()
    print("\nDone.")
