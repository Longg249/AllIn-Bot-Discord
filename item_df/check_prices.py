import requests, json

item_id = "019c1d04-249f-751b-a344-de024c6499d2"
page_token = None
total = 0
page = 0

while True:
    body = {"auctionItemId": item_id, "pageSize": 100}
    if page_token:
        body["pageToken"] = page_token
    
    resp = requests.post(
        "https://api.deltaforceapi.com/deltaforceapi.gateway.v1.ApiService/GetAuctionItemPrices",
        headers={"Connect-Protocol-Version": "1", "Content-Type": "application/json"},
        json=body
    )
    data = resp.json()
    prices = data.get("prices", [])
    total += len(prices)
    page += 1
    print(f"Page {page}: {len(prices)} records (total: {total})")
    
    next_token = data.get("nextPageToken")
    if not next_token:
        break
    page_token = next_token

print(f"\nTotal price records for one item: {total}")
