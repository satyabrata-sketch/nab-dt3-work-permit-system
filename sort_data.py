import json
import datetime

def parse_date(d_str):
    if not d_str:
        return datetime.date(1970, 1, 1)
    try:
        dt = datetime.datetime.strptime(d_str, '%B %d, %Y')
        return dt.date()
    except Exception:
        pass
    try:
        dt = datetime.datetime.strptime(d_str.split(' ')[0], '%Y-%m-%d')
        return dt.date()
    except Exception:
        pass
    return datetime.date(1970, 1, 1)

with open('permits_clean.json') as f:
    records = json.load(f)

# Sort descending by parsed date, then by permit_no/id descending
records.sort(key=lambda r: (parse_date(r.get('date', '')), r.get('id', 0)), reverse=True)

print('Top 5 Latest Records:')
for r in records[:5]:
    print(f"ID: {r['id']}, Date: {r['date']}, Permit #: {r['permit_no']}, Category: {r['type']}")

print('\nBottom 5 Oldest Records:')
for r in records[-5:]:
    print(f"ID: {r['id']}, Date: {r['date']}, Permit #: {r['permit_no']}, Category: {r['type']}")

with open('permits_clean.json', 'w') as f:
    json.dump(records, f, indent=2)

with open('data.js', 'w') as f:
    f.write('const PERMIT_DATA = ' + json.dumps(records, indent=2) + ';')

print("\nSuccessfully sorted data.js from latest date to oldest date!")
