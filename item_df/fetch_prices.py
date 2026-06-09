import requests
import sqlite3
import time
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://api.deltaforceapi.com"
HEADERS = {"Connect-Protocol-Version": "1", "Content-Type": "application/json"}

conn = sqlite3.connect("auction_items.db")
cur = conn.cursor()

cur.execute("SELECT id, name FROM auction_items WHERE price IS NULL")
pending = cur.fetchall()
total = len(pending)
print(f"Remaining items to fetch prices: {total}")

def fetch_price(item_id):
    try:
        resp = requests.post(
            f"{BASE_URL}/deltaforceapi.gateway.v1.ApiService/GetAuctionItemPrice",
            headers=HEADERS, json={"auctionItemId": item_id}, timeout=10
        )
        data = resp.json()
        p = data.get("price")
        if p:
            return item_id, p.get("price"), p.get("referencePrice"), p.get("createdAt")
    except Exception as e:
        pass
    return item_id, None, None, None

done = 0
with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(fetch_price, item_id): item_id for item_id, name in pending}
    for f in as_completed(futures):
        item_id, price, ref_price, price_ts = f.result()
        if price is not None:
            cur.execute("""
                UPDATE auction_items SET price=?, reference_price=?, price_updated_at=?
                WHERE id=?
            """, (price, ref_price, price_ts, item_id))
            conn.commit()
        done += 1
        if done % 100 == 0:
            print(f"  Progress: {done}/{total}")

cur.execute("SELECT COUNT(*) FROM auction_items WHERE price IS NOT NULL")
priced = cur.fetchone()[0]
print(f"\nDone! {priced} items have prices.")

cur.execute("SELECT name, price FROM auction_items WHERE price IS NOT NULL ORDER BY price DESC LIMIT 10")
print("\nTop 10 most expensive items:")
for name, price in cur.fetchall():
    print(f"  {name}: {price:,}")
conn.close()
