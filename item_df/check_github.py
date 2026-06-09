import requests, json

# Check a couple files to find the actual structure
for url, label in [
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json', 'collection'),
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json', 'key'),
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/armor.json', 'armor'),
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/gun/gunRifle.json', 'gunRifle'),
]:
    resp = requests.get(url, timeout=15)
    raw = resp.json()
    print(f'=== {label} ===')
    list_items = raw.get('data', {}).get('list', [])
    if list_items:
        item = list_items[0]
        print(json.dumps(item, indent=2, ensure_ascii=False)[:1000])
    else:
        print('No list found, top keys:', list(raw.keys()))
    print()
