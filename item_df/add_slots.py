import requests, json, sqlite3, re

categories = [
    ('accBackGrip', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accBackGrip.json'),
    ('accBarrel',   'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accBarrel.json'),
    ('accForeGrip', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accForeGrip.json'),
    ('accFunctional', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accFunctional.json'),
    ('accHandGuard', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accHandGuard.json'),
    ('accMagazine', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accMagazine.json'),
    ('accMuzzle',  'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accMuzzle.json'),
    ('accScope',   'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accScope.json'),
    ('accStock',   'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/acc/accStock.json'),
    ('gunRifle',   'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/gun/gunRifle.json'),
    ('mandel',     'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/mandel.json'),
    ('collection', 'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/collection.json'),
    ('consume',    'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/consume.json'),
    ('key',        'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/props/key.json'),
    ('armor',      'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/armor.json'),
    ('bag',        'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/bag.json'),
    ('chest',      'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/chest.json'),
    ('helmet',     'https://raw.githubusercontent.com/jiansenc/DeltaForceData/main/public/json/protect/helmet.json'),
]

id_to_size = {}
for label, url in categories:
    try:
        resp = requests.get(url, timeout=15)
        raw = resp.json()
        items = raw.get('jData', {}).get('data', {}).get('data', {}).get('list', [])
        for item in items:
            oid = item.get('objectID')
            if oid:
                id_to_size[oid] = {
                    'length': item.get('length'),
                    'width': item.get('width'),
                    'weight': item.get('weight'),
                }
    except Exception as e:
        print(f'{label}: ERROR - {e}')

print(f'Loaded {len(id_to_size)} items with size info')

conn = sqlite3.connect('auction_items.db')
cur = conn.cursor()

def add_col(table, col, typ):
    cur.execute(f'PRAGMA table_info({table})')
    existing = [r[1] for r in cur.fetchall()]
    if col not in existing:
        cur.execute(f'ALTER TABLE {table} ADD COLUMN {col} {typ}')

add_col('auction_items', 'length', 'INTEGER')
add_col('auction_items', 'width', 'INTEGER')
add_col('auction_items', 'slots', 'INTEGER')
add_col('auction_items', 'weight', 'TEXT')

matched = 0
cur.execute('SELECT id, icon_url, object_id FROM auction_items')
for row in cur.fetchall():
    aid, icon_url, obj_id = row
    # Use object_id if already matched, else extract from icon_url
    oid = None
    if obj_id:
        oid = int(obj_id)
    else:
        m = re.search(r'auction-item/(\d+)/', icon_url or '')
        if m:
            oid = int(m.group(1))
    if oid and oid in id_to_size:
        sz = id_to_size[oid]
        length = sz['length']
        width = sz['width']
        slots = (length or 0) * (width or 0)
        cur.execute('UPDATE auction_items SET length=?, width=?, slots=?, weight=? WHERE id=?',
                   (length, width, slots, sz.get('weight'), aid))
        matched += 1

conn.commit()

cur.execute('SELECT COUNT(*) FROM auction_items WHERE slots IS NOT NULL')
with_slots = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM auction_items WHERE slots IS NULL')
no_slots = cur.fetchone()[0]
print(f'Updated with slots: {with_slots}, without: {no_slots}')

# Show slot size distribution
cur.execute('SELECT slots, COUNT(*) FROM auction_items WHERE slots IS NOT NULL GROUP BY slots ORDER BY slots')
print('\nSlots distribution:')
for s, c in cur.fetchall():
    print(f'  {s} ô: {c} items')

# Top items by price per slot
cur.execute("""
    SELECT name, grade, price, slots, ROUND(CAST(price AS REAL) / slots) AS price_per_slot
    FROM auction_items 
    WHERE price IS NOT NULL AND slots IS NOT NULL AND slots > 0 AND grade IS NOT NULL
    ORDER BY price_per_slot DESC
    LIMIT 20
""")
print('\nTop 20 items by giá trị / ô (items có grade):')
for r in cur.fetchall():
    print(f'  {r[0]} | grade {r[1]} | {r[2]:,} / {r[3]} ô = {r[4]:,}/ô')

conn.close()
