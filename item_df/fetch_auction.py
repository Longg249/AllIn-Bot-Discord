import requests
import sqlite3
import json
import time
from datetime import datetime, timezone

BASE_URL = "https://api.deltaforceapi.com"
HEADERS = {
    "Connect-Protocol-Version": "1",
    "Content-Type": "application/json"
}

conn = sqlite3.connect("auction_items.db")
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS auction_items (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        icon_url TEXT,
        created_at TEXT,
        updated_at TEXT,
        price INTEGER,
        reference_price INTEGER,
        price_updated_at TEXT,
        fetched_at TEXT
    )
""")
conn.commit()

def fetch_all_items():
    items = []
    page_token = None
    page = 0

    while True:
        body = {"pageSize": 100}
        if page_token:
            body["pageToken"] = page_token

        resp = requests.post(
            f"{BASE_URL}/deltaforceapi.gateway.v1.ApiService/ListAuctionItems",
            headers=HEADERS, json=body
        )
        data = resp.json()
        batch = data.get("items", [])
        items.extend(batch)
        page += 1
        print(f"  Page {page}: {len(batch)} items (total: {len(items)})")

        next_token = data.get("nextPageToken")
        if not next_token:
            break
        page_token = next_token
        time.sleep(0.2)

    return items

def fetch_price(item_id):
    try:
        resp = requests.post(
            f"{BASE_URL}/deltaforceapi.gateway.v1.ApiService/GetAuctionItemPrice",
            headers=HEADERS,
            json={"auctionItemId": item_id}
        )
        data = resp.json()
        p = data.get("price")
        if p:
            return p.get("price"), p.get("referencePrice"), p.get("createdAt")
    except Exception as e:
        print(f"    Error: {e}")
    return None, None, None

def ts_to_str(ts):
    if isinstance(ts, str):
        return ts
    return None

print("=== Phase 1: Fetching all auction items ===")
all_items = fetch_all_items()
print(f"\nTotal items: {len(all_items)}")

print("\n=== Phase 2: Saving items to DB ===")
for item in all_items:
    cur.execute("""
        INSERT OR REPLACE INTO auction_items
        (id, name, description, icon_url, created_at, updated_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        item.get("id"),
        item.get("name"),
        item.get("description"),
        item.get("iconUrl"),
        ts_to_str(item.get("createdAt")),
        ts_to_str(item.get("updatedAt")),
        datetime.now(timezone.utc).isoformat()
    ))
conn.commit()
print("Items saved.")

print("\n=== Phase 3: Fetching prices ===")
cur.execute("SELECT id, name FROM auction_items WHERE price IS NULL")
pending = cur.fetchall()
print(f"Items needing prices: {len(pending)}")

for idx, (item_id, name) in enumerate(pending, 1):
    price, ref_price, price_ts = fetch_price(item_id)
    if price is not None:
        cur.execute("""
            UPDATE auction_items
            SET price = ?, reference_price = ?, price_updated_at = ?
            WHERE id = ?
        """, (price, ref_price, price_ts, item_id))
        conn.commit()

    if idx % 50 == 0:
        print(f"  Progress: {idx}/{len(pending)}")
    time.sleep(0.15)

cur.execute("SELECT COUNT(*) FROM auction_items WHERE price IS NOT NULL")
priced = cur.fetchone()[0]
print(f"\nDone! {priced}/{len(all_items)} items have prices.")

cur.execute("SELECT name, price, reference_price FROM auction_items WHERE price IS NOT NULL ORDER BY price DESC LIMIT 10")
print("\nTop 10 most expensive items:")
for name, price, ref in cur.fetchall():
    print(f"  {name}: {price:,} (ref: {ref:,})" if ref else f"  {name}: {price:,}")

conn.close()
