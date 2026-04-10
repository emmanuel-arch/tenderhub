"""Quick inspection of a sample KRA tender PDF to understand document structure."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import pdfplumber

pdf_path = "sample_kra.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    full_text = ""
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        full_text += text + "\n"
        if i < 3:
            print(f"\n=== PAGE {i+1} ===")
            print(text[:1500])

    # Search for key sections
    import re
    keywords = [
        "bid bond", "bid security", "tender security", "bid validity",
        "submission deadline", "pre-bid", "site visit", "clarification",
        "annual turnover", "financial", "liquid assets", "line of credit",
        "single contract", "audited", "cash flow",
        "key personnel", "personnel required", "qualification",
        "equipment", "plant and equipment",
        "bid copies", "number of copies",
    ]
    
    print("\n\n=== KEYWORD SEARCH ===")
    lines = full_text.split("\n")
    for kw in keywords:
        matches = [(i, line.strip()) for i, line in enumerate(lines) 
                   if kw.lower() in line.lower()]
        if matches:
            print(f"\n'{kw}' found {len(matches)} times:")
            for line_no, line in matches[:3]:
                print(f"  L{line_no}: {line[:150]}")
