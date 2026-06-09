import requests, json

with open('github_structure2.txt', 'w', encoding='utf-8') as f:
    for url, label in [
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json', 'collection'),
        ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json', 'key'),
    ]:
        resp = requests.get(url, timeout=15)
        raw = resp.json()
        f.write(f'=== {label} ===\n')
        jData = raw.get('jData')
        if jData:
            data = jData.get('data', {})
            f.write(f'jData.data type: {type(data).__name__}\n')
            f.write(f'jData.data keys: {list(data.keys())[:10]}\n')
            # check each value type
            for k, v in list(data.items())[:3]:
                if isinstance(v, list):
                    f.write(f'  key "{k}" -> list of {len(v)} items\n')
                    if v:
                        f.write(json.dumps(v[0], indent=2, ensure_ascii=False)[:2000] + '\n')
                else:
                    f.write(f'  key "{k}" -> {type(v).__name__}: {str(v)[:100]}\n')
        f.write('\n\n')

print('Done')
