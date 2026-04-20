"""Quick analytics script to understand the tender distribution
so we can design the categorization & visual experience properly."""
from collections import Counter
from db import get_connection


def fetchall(sql, params=()):
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, *params) if params else cur.execute(sql)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def hr(label):
    print("\n" + "=" * 78)
    print(label)
    print("=" * 78)


def show_counter(rows, key, top=25):
    c = Counter()
    for r in rows:
        v = r.get(key)
        if v is None:
            v = "(null)"
        v = str(v).strip() or "(empty)"
        c[v] += 1
    for k, n in c.most_common(top):
        print(f"  {n:>5}  {k}")
    print(f"  --- total distinct: {len(c)}")


def main():
    hr("TOTAL TENDERS")
    rows = fetchall("SELECT * FROM ScrapedTenders")
    print(f"  {len(rows):>5}  total rows")

    hr("BY SOURCE")
    show_counter(rows, "Source", top=50)

    hr("BY CATEGORY")
    show_counter(rows, "Category", top=50)

    hr("BY SUB-CATEGORY")
    show_counter(rows, "SubCategory", top=50)

    hr("BY PROCUREMENT METHOD")
    show_counter(rows, "ProcurementMethod", top=50)

    hr("TOP 30 PROCURING ENTITIES")
    show_counter(rows, "ProcuringEntity", top=30)

    hr("BID BOND AMOUNT BUCKETS (from ScrapedTenders.BidBondAmount > 0)")
    buckets = Counter()
    nonzero = []
    for r in rows:
        amt = float(r.get("BidBondAmount") or 0)
        if amt <= 0:
            buckets["0 / unknown"] += 1
            continue
        nonzero.append(amt)
        if amt < 50_000:
            buckets["< 50K"] += 1
        elif amt < 200_000:
            buckets["50K – 200K"] += 1
        elif amt < 500_000:
            buckets["200K – 500K"] += 1
        elif amt < 1_000_000:
            buckets["500K – 1M"] += 1
        elif amt < 5_000_000:
            buckets["1M – 5M"] += 1
        elif amt < 20_000_000:
            buckets["5M – 20M"] += 1
        else:
            buckets["20M+"] += 1
    for k, n in buckets.most_common():
        print(f"  {n:>5}  {k}")
    if nonzero:
        nonzero.sort()
        n = len(nonzero)
        print(f"  min={min(nonzero):,.0f}  median={nonzero[n//2]:,.0f}  max={max(nonzero):,.0f}")

    hr("DOCUMENT-DETAILS COVERAGE")
    drows = fetchall("SELECT * FROM TenderDocumentDetails")
    print(f"  {len(drows):>5}  TenderDocumentDetails rows")

    hr("BY SUBMISSION METHOD (TenderDocumentDetails.SubmissionMethod)")
    show_counter(drows, "SubmissionMethod", top=30)

    hr("BY BID VALIDITY PERIOD")
    show_counter(drows, "BidValidityPeriod", top=30)

    hr("PRE-BID MEETING DATE PRESENT?")
    yes = sum(1 for r in drows if r.get("PreBidMeetingDate"))
    print(f"  {yes:>5}  with pre-bid meeting date")
    print(f"  {len(drows) - yes:>5}  without")

    hr("KEYWORDS IN TITLES (rough sector clustering)")
    keywords = {
        "construction": ["construction", "civil works", "rehabilitation", "refurbishment", "renovation", "building"],
        "roads": ["road", "highway", "drainage", "bridge", "pavement"],
        "ict": ["ict", "software", "computer", "laptop", "system", "license", "license", "digital", "cyber"],
        "medical": ["medical", "hospital", "drugs", "pharmaceutical", "lab", "ppe", "equipment", "surgical", "health"],
        "agriculture": ["agric", "farm", "fertilizer", "seed", "irrigation", "livestock"],
        "energy": ["solar", "energy", "power", "electric", "transformer", "generator", "kengen"],
        "water": ["water", "borehole", "sanitation", "sewer"],
        "transport": ["vehicle", "motor", "bus", "truck", "fleet", "maintenance"],
        "security": ["security", "firefight", "fire-fight", "alarm", "cctv", "surveillance"],
        "education": ["school", "education", "training", "university", "college", "tvet"],
        "supply": ["supply", "delivery", "procurement of"],
        "consultancy": ["consultancy", "consultant", "advisory", "study", "research"],
        "uniforms": ["uniform", "clothing", "garment", "boots"],
        "stationery": ["stationery", "printing", "branded", "office supplies"],
        "food": ["food", "ration", "catering", "groceries", "produce"],
        "insurance": ["insurance", "indemnity"],
    }
    text_cnt = Counter()
    for r in rows:
        title = (r.get("Title") or "").lower()
        desc = (r.get("Description") or "").lower()[:600]
        body = title + " " + desc
        matched = False
        for k, kws in keywords.items():
            if any(kw in body for kw in kws):
                text_cnt[k] += 1
                matched = True
        if not matched:
            text_cnt["(uncategorized)"] += 1
    for k, n in text_cnt.most_common():
        print(f"  {n:>5}  {k}")

    hr("LOCATION HINTS (PeAddress / Title) — Kenyan counties")
    counties = [
        "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta",
        "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
        "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
        "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
        "Samburu", "Trans-Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi",
        "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
        "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu",
        "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
    ]
    cc = Counter()
    for r in rows:
        # PeAddress isn't a column; we approximate using Title + ProcuringEntity
        body = ((r.get("Title") or "") + " " + (r.get("ProcuringEntity") or "")).lower()
        hits = [c for c in counties if c.lower() in body]
        if hits:
            for c in hits:
                cc[c] += 1
        else:
            cc["(no county detected)"] += 1
    for k, n in cc.most_common():
        print(f"  {n:>5}  {k}")


if __name__ == "__main__":
    main()
