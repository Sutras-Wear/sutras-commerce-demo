from pathlib import Path
import re, subprocess, sys
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
js=(root/'scripts/app.js').read_text()
css=(root/'styles.css').read_text()
checks=[]
def check(name, cond, detail=''):
    checks.append((name, bool(cond), detail))

# Product card markup block only: no availability badge over imagery.
start=js.index('function productCard(product, index)')
end=js.index('function renderProducts()', start)
card=js[start:end]
check('Card image no longer renders availability badge', 'availability-badge' not in card)
check('Card still renders availability below product name', 'product-availability' in card and 'availabilityLabel(product)' in card)
check('Card Quick View eye remains', 'quick-view-trigger' in card and "icon('eye')" in card)
# Quick View dialog keeps its availability badge where there is enough room.
qstart=js.index('function quickViewMarkup(product)')
qend=js.index('function openQuickView', qstart)
qblock=js[qstart:qend]
check('Quick View modal keeps availability badge', 'availability-badge' in qblock)
# Mobile polish: same safe touch target but moved farther inward, smaller icon.
check('Mobile eye moved inward', '.quick-view-trigger{right:9px;bottom:9px;min-width:42px;height:42px' in css)
mobile_segment=css[css.index('@media(max-width:699px)'):] 
check('Mobile eye icon visually reduced', '.quick-view-trigger .icon{width:16px;height:16px}' in mobile_segment)
check('42px touch target preserved', 'min-width:42px;height:42px' in mobile_segment)
check('V24.1 cache bust applied', 'styles.css?v=20260908-v24-1' in html and 'scripts/app.js?v=20260908-v24-1' in html)
# Basic JS syntax check.
r=subprocess.run(['node','--check',str(root/'scripts/app.js')],capture_output=True,text=True)
check('app.js syntax valid', r.returncode==0, r.stderr.strip())

for name, ok, detail in checks:
    print(('PASS' if ok else 'FAIL')+': '+name+((' — '+detail) if detail and not ok else ''))
failed=[x for x in checks if not x[1]]
print(f'\n{len(checks)} checks, {len(failed)} failed')
sys.exit(1 if failed else 0)
