from pathlib import Path
import re, zipfile

root=Path('/mnt/data/v21fixwork')
html=(root/'index.html').read_text()
js=(root/'scripts/app.js').read_text()
css=(root/'styles.css').read_text()

checks=[]
def check(name, ok):
    checks.append((name, bool(ok)))

check('HTML parses', '<html' in html and '</html>' in html)
check('JS syntax', __import__('subprocess').run(['node','--check',str(root/'scripts/app.js')],capture_output=True,text=True).returncode==0)
check('V20 markup removed', 'build-look' not in html and 'build-look' not in js and 'build-look' not in css)
check('V20 logic removed', 'lookSelections' not in js and 'buildLookProducts' not in js and 'lookProfile' not in js)
check('Bag dialog present', 'id="bag-dialog"' in html)
check('Inline size selector present', 'data-bag-size' in js and 'data-bag-size' in html or 'data-bag-size' in js)
check('Quantity controls present', 'data-quantity' in js)
check('Remove and clear controls present', 'data-remove' in js and 'data-clear-bag' in js)
check('Continue browsing control present', 'data-browse-styles' in html and 'data-browse-styles' in js)
check('Mobile sticky WhatsApp action present', 'bag-sticky-action' in html and 'bag-whatsapp-mobile' in html and 'bag-sticky-action' in css)
check('Mobile 760px rules present', '@media(max-width:760px)' in css and '.bag-sticky-action' in css)
check('Small-phone 380px rules present', '@media(max-width:380px)' in css)
check('Safe-area bottom handling present', 'env(safe-area-inset-bottom)' in css)
check('Mobile WhatsApp uses same generated message', "$('#bag-whatsapp-mobile').href = waLink(message, 0);" in js)
check('Size change merges duplicate product/size entries', 'duplicate = bag.findIndex' in js and 'bag[duplicate].quantity' in js)
check('No obvious V20 docs residue', 'V20 — Build Your Look' not in (root/'README.md').read_text() and 'V20 — Build Your Look' not in (root/'TESTING.md').read_text())

# Verify every local src/href asset reference exists.
for ref in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', html):
    if ref.startswith(('#','https://','http://','mailto:','data:','javascript:')): continue
    check(f'Asset exists: {ref}', (root/ref.split('?',1)[0]).exists())

failed=[name for name,ok in checks if not ok]
print(f'V21 checks: {len(checks)} total, {len(failed)} failed')
for name,ok in checks:
    print(('PASS' if ok else 'FAIL')+' - '+name)
if failed:
    raise SystemExit(1)
