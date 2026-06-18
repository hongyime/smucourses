import os
import re
import collections
from pathlib import Path

root = Path('Y:/courses')
unsorted = []
patterns = collections.Counter()
parts = collections.defaultdict(list)
total = 0

if not root.exists():
    print("Y:/courses does not exist.")
    exit(1)

for p in root.rglob('*.pdf'):
    total += 1
    name = p.name
    if 'Unsorted' in p.parts:
        unsorted.append(name)
    else:
        count = name.count('_')
        patterns[count] += 1
        parts[count].append(name)

print(f'Total PDFs: {total}')
print(f'Unsorted: {len(unsorted)}')
print('Top 20 Unsorted examples:')
for u in unsorted[:20]:
    print(f'  - {u}')

print('\nUnderscore counts in sorted:')
for k, v in patterns.most_common():
    print(f'  {k} underscores: {v} files')

print('\nExamples with 3 underscores:')
for x in parts[3][:5]: print(f'  - {x}')

print('\nExamples with 5 underscores:')
for x in parts[5][:5]: print(f'  - {x}')

print('\nExamples with 6+ underscores:')
for x in parts[6][:5]: print(f'  - {x}')
for x in parts[7][:5]: print(f'  - {x}')

