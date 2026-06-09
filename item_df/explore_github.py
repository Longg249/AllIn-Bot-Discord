import requests, json

base = 'https://api.github.com/repos/jiansenc/DeltaForceData/contents/public/json'
resp = requests.get(base, timeout=15)
for d in resp.json():
    print(f'{d["name"]}/')
    if d['type'] == 'dir':
        sub = requests.get(d['url'], timeout=15).json()
        for f in sub:
            print(f'  {f["name"]}')
