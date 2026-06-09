import requests, json

with open('github_keys.txt', 'w', encoding='utf-8') as f:
    for url, label in [
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json', 'collection'),
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json', 'key'),
    ]:
        resp = requests.get(url, timeout=15)
        raw = resp.json()
        jData = raw.get('jData')
        data = jData.get('data', {})
        inner_data = data.get('data', {})
        items = inner_data.get('list', [])
        if items:
            f.write(f'=== {label} ===\n')
            f.write(f'Fields/keys in item: {list(items[0].keys())}\n')
            # Print all field names and sample values for first item
            for k, v in items[0].items():
                f.write(f'  {k}: {repr(v)[:200]}\n')
            f.write('\n')
print('Done')
