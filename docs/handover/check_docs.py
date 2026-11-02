#!/usr/bin/env python3
"""Validate this handover pack without installing app dependencies."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
errors = []
checked_links = 0
sibling_skips = set()

for page in sorted(HERE.glob('*.md')):
    text = page.read_text()
    for raw in re.findall(r'\[[^\]]+\]\(([^)]+)\)', text):
        target = raw.split('#', 1)[0].strip('<>')
        if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
            continue
        resolved = (page.parent / unquote(target)).resolve()
        if not resolved.exists():
            # Portfolio links are optional when another repository is not cloned.
            if page.name == 'PORTFOLIO.md' and not resolved.is_relative_to(ROOT):
                sibling_skips.add(str(resolved))
                continue
            errors.append(f'{page.name}: missing link target {target}')
        else:
            checked_links += 1

for template in sorted((HERE / 'env').glob('*.example')):
    seen = set()
    for line in template.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        match = re.fullmatch(r'([A-Za-z_][A-Za-z0-9_]*)=(.*)', line)
        if not match:
            errors.append(f'{template.name}: malformed environment entry')
            continue
        key, value = match.groups()
        if key in seen:
            errors.append(f'{template.name}: duplicate variable {key}')
        if value.strip():
            errors.append(f'{template.name}: expected blank value for {key}')
        seen.add(key)

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(list(HERE.glob("*.md")))} handover pages, {checked_links} local links; templates are blank and unique.')
if sibling_skips:
    print(f'Note: {len(sibling_skips)} optional portfolio links need sibling repositories to be checked out.')
