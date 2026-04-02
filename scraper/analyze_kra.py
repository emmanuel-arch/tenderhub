"""Analyze KRA page HTML structure."""
from bs4 import BeautifulSoup

html = open("kra_debug.html", "r", encoding="utf-8").read()
soup = BeautifulSoup(html, "lxml")

# Find the text "Tender Title" and examine its parent structure
labels = soup.find_all(string=lambda s: s and "Tender Title" in s)
print(f"Found {len(labels)} instances of 'Tender Title'")

for i, label in enumerate(labels[:3]):
    parent = label.find_parent()
    print(f"\n--- Instance {i+1} ---")
    print(f"  Direct parent: <{parent.name} class={parent.get('class', [])}>")
    
    # Walk up to find the container
    p2 = parent.parent if parent else None
    if p2:
        print(f"  Grandparent: <{p2.name} class={p2.get('class', [])}>")
    p3 = p2.parent if p2 else None
    if p3:
        print(f"  Great-grandparent: <{p3.name} class={p3.get('class', [])}>")

# Look for "View Tender" links
view_links = soup.find_all("a", string=lambda s: s and "View Tender" in s)
print(f"\nFound {len(view_links)} 'View Tender' links")
for i, link in enumerate(view_links[:3]):
    print(f"  Link {i+1}: href={link.get('href')}")
    parent = link.parent
    print(f"  Parent: <{parent.name} class={parent.get('class', [])}>")
    # Walk up
    row = parent
    for _ in range(5):
        row = row.parent
        if row:
            print(f"    up: <{row.name} class={row.get('class', [])}>")

# Show a sample of the first tender block
print("\n\n=== Sample raw HTML around first View Tender link ===")
if view_links:
    # Get the nearest container block
    container = view_links[0]
    for _ in range(4):
        container = container.parent
    # Print just the text to see the data structure
    text = container.get_text("\n", strip=True)
    for line in text.split("\n")[:15]:
        print(f"  {line}")
