from pathlib import Path
import re, subprocess, zipfile
from bs4 import BeautifulSoup

root=Path('/mnt/data/v23work')
html=(root/'index.html').read_text()
js=(root/'scripts/app.js').read_text()
css=(root/'styles.css').read_text()
catalog=(root/'scripts/catalog.js').read_text()
checks=[]
def check(name, ok): checks.append((name,bool(ok)))

soup=BeautifulSoup(html,'html.parser')
check('HTML parses', soup.find('html') is not None and soup.find('body') is not None)
check('JS syntax', subprocess.run(['node','--check',str(root/'scripts/app.js')],capture_output=True).returncode==0)
check('Product dialog present', soup.select_one('#product-dialog') is not None)
check('Product detail renderer present', 'function openProduct(id' in js and 'product-detail-layout' in js)
check('V23 detail facts present', 'detail-facts' in js and 'PIECES' in js and 'STYLE' in js and 'VIEW' in js)
check('V23 live selected-size cue present', 'selected-size-value' in html or 'selected-size-value' in js)
check('Size selection updates live cue', "selectedSizeValue.textContent = `Selected · ${selectedSize}`" in js)
check('Size selection updates direct enquiry safely', 'const directEnquiry = $(\'#direct-enquiry\')' in js)
check('Single direct enquiry element in product renderer', js.count('id="direct-enquiry"') == 1)
check('Desktop sticky gallery rule present', '.product-detail-media.has-gallery{align-self:start;position:sticky;top:0}' in css)
check('Sticky gallery disabled below 959px', '@media(max-width:959px)' in css and 'position:relative;top:auto' in css)
check('Mobile detail action stack present', 'detail-action-stack' in css)
check('Existing gallery controls preserved', 'data-photo-prev' in js and 'data-photo-next' in js and 'data-zoom-photo' in js)
check('Existing related styles preserved', 'relatedStylesMarkup(product)' in js)
check('Existing bag preserved', 'id="bag-dialog"' in html and 'data-bag-size' in js and 'data-quantity' in js)
check('V20 build-look remains removed', 'build-look' not in html and 'build-look' not in js and 'build-look' not in css)
check('No duplicate HTML ids', len([x.get('id') for x in soup.find_all(id=True)]) == len(set(x.get('id') for x in soup.find_all(id=True))))
# Validate catalog has 12 unique products and complete V17 metadata.
ids=re.findall(r'"id"\s*:\s*"([^"]+)"',catalog)
check('12 catalogue product IDs', len(ids)==12)
check('Catalogue IDs unique', len(ids)==len(set(ids)))
check('All products have piece metadata', catalog.count('"pieces":')==12)
check('All products have productType metadata', catalog.count('"productType":')==12)
# All local asset refs in HTML exist.
for ref in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',html):
    if ref.startswith(('#','https://','http://','mailto:','data:','javascript:')): continue
    check(f'Asset exists: {ref}', (root/ref.split('?',1)[0]).exists())

failed=[n for n,o in checks if not o]
print(f'V23 static checks: {len(checks)} total, {len(failed)} failed')
for n,o in checks: print(('PASS' if o else 'FAIL')+' - '+n)
if failed: raise SystemExit(1)
