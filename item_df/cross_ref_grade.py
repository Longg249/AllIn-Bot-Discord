import requests, json, sqlite3, re

# All categories from GitHub
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

# Build objectID -> {grade, secondClass, secondClassCN, objectName}
id_to_info = {}
total_items = 0

for label, url in categories:
    try:
        resp = requests.get(url, timeout=15)
        raw = resp.json()
        items = raw.get('jData', {}).get('data', {}).get('data', {}).get('list', [])
        for item in items:
            oid = item.get('objectID')
            if oid:
                id_to_info[oid] = {
                    'grade': item.get('grade'),
                    'objectName': item.get('objectName'),
                    'secondClass': item.get('secondClass'),
                    'secondClassCN': item.get('secondClassCN'),
                    'primaryClass': item.get('primaryClass'),
                    'propsDetail': item.get('propsDetail'),
                }
                total_items += 1
    except Exception as e:
        print(f'{label}: ERROR - {e}')

print(f'Total items from GitHub: {total_items}')
print(f'Unique objectIDs: {len(id_to_info)}')

# Show grade distribution
from collections import Counter
grade_counts = Counter(v['grade'] for v in id_to_info.values() if v['grade'] is not None)
print(f'\nGrade distribution:')
for g in sorted(grade_counts.keys()):
    print(f'  Grade {g}: {grade_counts[g]} items')

# Show main categories
cat_counts = Counter(v.get('secondClass', 'unknown') for v in id_to_info.values())
print(f'\nCategory distribution:')
for c, cnt in cat_counts.most_common(15):
    print(f'  {c}: {cnt}')

# Cross-reference with auction DB
conn = sqlite3.connect('auction_items.db')
cur = conn.cursor()

def add_column_if_not_exists(table, column, col_type):
    cur.execute(f"PRAGMA table_info({table})")
    existing = [row[1] for row in cur.fetchall()]
    if column not in existing:
        cur.execute(f'ALTER TABLE {table} ADD COLUMN {column} {col_type}')

add_column_if_not_exists('auction_items', 'grade', 'INTEGER')
add_column_if_not_exists('auction_items', 'item_type', 'TEXT')
add_column_if_not_exists('auction_items', 'object_id', 'TEXT')
add_column_if_not_exists('auction_items', 'object_name_cn', 'TEXT')

matched = 0
cur.execute('SELECT id, icon_url FROM auction_items')
for row in cur.fetchall():
    aid, icon_url = row
    m = re.search(r'auction-item/(\d+)/', icon_url or '')
    if m:
        oid = int(m.group(1))
        info = id_to_info.get(oid)
        if info:
            cur.execute('UPDATE auction_items SET grade=?, object_id=?, item_type=?, object_name_cn=? WHERE id=?',
                       (info['grade'], str(oid), info.get('secondClass'), info.get('objectName'), aid))
            matched += 1
        # else: no match, but row exists in GitHub but not as auction item

conn.commit()

cur.execute('SELECT COUNT(*) FROM auction_items WHERE grade IS NOT NULL')
with_grade = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM auction_items WHERE grade IS NULL')
no_grade = cur.fetchone()[0]
print(f'\nMatched with grade: {matched}')
print(f'Auction items with grade: {with_grade}')
print(f'Auction items without grade: {no_grade}')

if with_grade > 0:
    cur.execute('SELECT grade, COUNT(*) FROM auction_items WHERE grade IS NOT NULL GROUP BY grade ORDER BY grade')
    print('\nGrade distribution in auction items:')
    for g, c in cur.fetchall():
        print(f'  Grade {g}: {c} items')

conn.close()

# Also check which objectIDs from auction don't match GitHub
matched_oids = set()
cur2 = sqlite3.connect('auction_items.db').cursor()
cur2.execute('SELECT object_id FROM auction_items WHERE object_id IS NOT NULL')
for r in cur2.fetchall():
    matched_oids.add(int(r[0]))

auction_oids = set()
cur2.execute('SELECT icon_url FROM auction_items')
for r in cur2.fetchall():
    m = re.search(r'auction-item/(\d+)/', r[0] or '')
    if m:
        auction_oids.add(int(m.group(1)))

unmatched = auction_oids - set(id_to_info.keys())
print(f'\nAuction items not found in GitHub: {len(unmatched)}')
if unmatched:
    print(f'Examples: {list(unmatched)[:10]}')
