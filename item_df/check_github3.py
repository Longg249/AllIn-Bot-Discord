import requests, json, sys

with open('github_structure.txt', 'w', encoding='utf-8') as f:
    for url, label in [
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json', 'collection'),
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json', 'key'),
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/armor.json', 'armor'),
    ]:
        resp = requests.get(url, timeout=15)
        raw = resp.json()
        f.write(f'=== {label} ===\n')
        jData = raw.get('jData')
        if jData:
            data = jData.get('data', [])
            f.write(f'data type: {type(data).__name__}, len: {len(data) if isinstance(data, list) else "N/A"}\n')
            if isinstance(data, list) and data:
                item0 = data[0]
                f.write(json.dumps(item0, indent=2, ensure_ascii=False)[:2000] + '\n')
        f.write('\n')

print('Done - wrote github_structure.txt')
