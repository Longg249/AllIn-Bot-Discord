import requests, json

for url, label in [
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json', 'collection'),
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json', 'key'),
    ('https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/armor.json', 'armor'),
]:
    resp = requests.get(url, timeout=15)
    raw = resp.json()
    print(f'=== {label} ===')
    jData = raw.get('jData')
    if jData:
        # jData might be a dict or list
        print(f'jData type: {type(jData).__name__}')
        if isinstance(jData, list):
            print(f'list length: {len(jData)}')
            if jData:
                item = jData[0]
                print(json.dumps(item, indent=2, ensure_ascii=False)[:1500])
        elif isinstance(jData, dict):
            # check if there's a list inside
            for k, v in jData.items():
                if isinstance(v, list):
                    print(f'  key "{k}" -> list of {len(v)}')
                    if v:
                        print(json.dumps(v[0], indent=2, ensure_ascii=False)[:1500])
                        break
                else:
                    print(f'  key "{k}" -> {type(v).__name__}')
            else:
                # no list found, print first few keys
                print('dict keys:', list(jData.keys())[:10])
                vals = list(jData.values())
                if vals:
                    print('first value type:', type(vals[0]).__name__)
                    if isinstance(vals[0], (dict, list)):
                        print(json.dumps(vals[0], indent=2, ensure_ascii=False)[:500])
    else:
        print('No jData found')
    print()
