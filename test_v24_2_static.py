from pathlib import Path
import re, subprocess, sys, zipfile
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
js=(root/'scripts/app.js').read_text()
css=(root/'styles.css').read_text()
cat=(root/'scripts/catalog.js').read_text()
checks=[]
def check(name, cond, detail=''):
    checks.append((name,bool(cond),detail))

# Syntax / document structure
r=subprocess.run(['node','--check',str(root/'scripts/app.js')],capture_output=True,text=True)
check('app.js syntax valid',r.returncode==0,r.stderr.strip())
r=subprocess.run(['node','--check',str(root/'scripts/catalog.js')],capture_output=True,text=True)
check('catalog.js syntax valid',r.returncode==0,r.stderr.strip())
soup=BeautifulSoup(html,'html.parser')
check('HTML parses', soup.find('main',id='main') is not None)
check('V24.2 cache bust applied','styles.css?v=20260908-v24-2' in html and 'scripts/app.js?v=20260908-v24-2' in html and 'scripts/catalog.js?v=20260908-v24-2' in html)

# Availability helpers / truthful semantics
check('Reusable availability status helper exists','function availabilityStatusMarkup' in js and 'function availabilityTone' in js)
check('Available explicit state supported',"product.availability === 'available'" in js and "return 'Available'" in js)
check('Low availability state supported',"product.availability === 'low'" in js and "return 'Low availability'" in js)
check('Fallback remains Availability to confirm',"return 'Availability to confirm'" in js)
check('Unavailable semantics preserved',"product.availability === 'sold-out' || product.availability === 'unavailable'" in js)

# Current catalogue status counts
blocks=re.split(r'\n\s*\{\n\s*"id":',cat)[1:]
unavailable=sum('"availability": "unavailable"' in b for b in blocks)
sold=sum('"availability": "sold-out"' in b for b in blocks)
available_explicit=sum('"availability": "available"' in b for b in blocks)
low=sum('"availability": "low"' in b for b in blocks)
check('12 products remain',len(blocks)==12,str(len(blocks)))
check('Four current unavailable products preserved',unavailable==4,str(unavailable))
check('No products falsely changed to explicit available',available_explicit==0,str(available_explicit))
check('No products arbitrarily changed to low availability',low==0,str(low))
check('No products arbitrarily changed to sold out',sold==0,str(sold))

# Rendering locations
card=js[js.index('function productCard(product, index)'):js.index('function renderProducts()',js.index('function productCard(product, index)'))]
check('Card renders status helper',"availabilityStatusMarkup(product, 'card-availability')" in card)
check('Card image has no availability overlay','availability-badge' not in card)
q=js[js.index('function quickViewMarkup(product)'):js.index('function openQuickView',js.index('function quickViewMarkup(product)'))]
check('Quick View renders same status helper',"availabilityStatusMarkup(product, 'quick-availability')" in q)
check('Quick View image no longer renders availability badge','availability-badge' not in q)
d=js[js.index('function openProduct'):js.index('function addToBag',js.index('function openProduct'))] if 'function openProduct' in js else js
check('Full details renders same status helper',"availabilityStatusMarkup(product, 'detail-availability-status')" in js)

# Visual CSS states
for cls in ['.availability-status{','.availability-dot{','.availability-status.is-unavailable{','.availability-status.is-sold-out{','.availability-status.is-low{','.availability-status.is-preview{']:
    check(f'CSS contains {cls}',cls in css)
check('Status uses pill shape','border-radius:999px' in css[css.index('/* V24.2'):])
check('Mobile card status remains below image','.product-bottom-line .card-availability{grid-column:1;grid-row:2' in css)
check('Status stays off Quick View media','.quick-view-media .availability-badge{display:none}' in css)

# Asset integrity
refs=[]
for attr in ['src','href']:
    for tag in soup.find_all(attrs={attr:True}):
        v=tag.get(attr)
        if not v or v.startswith(('http:','https:','#','mailto:','tel:','data:')): continue
        v=v.split('?')[0]
        if v and not v.startswith('javascript:'): refs.append(v)
missing=[r for r in refs if not (root/r).exists()]
check('HTML local assets exist',not missing,repr(missing[:10]))

for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail and not ok else ''))
failed=[x for x in checks if not x[1]]
print(f'V24.2 static checks: {len(checks)} total, {len(failed)} failed')
sys.exit(1 if failed else 0)
