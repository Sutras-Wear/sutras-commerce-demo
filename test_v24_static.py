from pathlib import Path
import re, subprocess
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parent
html = (root/'index.html').read_text(encoding='utf-8')
js = (root/'scripts/app.js').read_text(encoding='utf-8')
css = (root/'styles.css').read_text(encoding='utf-8')
catalog = (root/'scripts/catalog.js').read_text(encoding='utf-8')
checks=[]
def check(name, ok): checks.append((name, bool(ok)))

soup=BeautifulSoup(html,'html.parser')
check('HTML parses', soup.find('html') is not None and soup.find('body') is not None)
check('App JS syntax', subprocess.run(['node','--check',str(root/'scripts/app.js')],capture_output=True).returncode==0)
check('Catalog JS syntax', subprocess.run(['node','--check',str(root/'scripts/catalog.js')],capture_output=True).returncode==0)
check('Quick View dialog shell present', soup.select_one('#quick-view-dialog') is not None and soup.select_one('#quick-view-detail') is not None)
check('Quick View dialog labelled dynamically', soup.select_one('#quick-view-dialog').get('aria-labelledby') == 'quick-view-title')
check('Quick View close button present', soup.select_one('#quick-view-dialog [data-close-dialog]') is not None)
check('Quick View trigger renderer present', 'data-quick-view=' in js and 'quick-view-trigger' in js and "icon('eye')" in js)
check('Old card quick-add shortcut removed', 'class="quick-add"' not in js)
check('Quick View opens before generic product routing', js.find("const quickViewButton = event.target.closest('[data-quick-view]')") < js.find("const productButton = event.target.closest('[data-product]')"))
check('Quick View renderer present', 'function quickViewMarkup(product)' in js and 'function openQuickView(id)' in js)
check('Quick View does not mutate product URL', "updateProductAddress" not in js[js.find('function openQuickView(id)'):js.find("$('#quick-view-detail').addEventListener")])
check('Quick View image uses product image', 'src="${escape(product.image)}"' in js)
check('Quick View price shown', 'quick-view-facts' in js and '${escape(priceText(product))}' in js)
check('Quick View availability shown', 'quick-view-status' in js and '${escape(availabilityLabel(product))}' in js)
check('Quick View size controls present', 'data-quick-size' in js and 'quick-size-option' in js)
check('Quick View selected-size cue updates', 'quick-selected-size' in js and 'Selected · ${quickViewSize}' in js)
check('Quick View WhatsApp link updates with size', "$('#quick-view-whatsapp')" in js and 'directMessage(quickViewProduct, quickViewSize)' in js)
check('Quick View add-to-bag present', 'id="quick-view-add"' in js)
check('Quick View uses existing bag function', "addToBag(quickViewProduct.id, quickViewSize" in js)
check('Quick View has inline confirmation', 'id="quick-view-confirmation"' in js and "confirmation: 'quick'" in js)
check('Quick View can open bag', 'data-open-bag' in js[js.find('function quickViewMarkup'):js.find('function openQuickView')])
check('Quick View full-detail action preserved', 'View full details' in js and 'data-product="${escape(product.id)}"' in js)
check('Unavailable Quick View blocks add', "${isUnavailable(product) ? '' : `<button class=\"button button-green\" type=\"button\" id=\"quick-view-add\"" in js)
check('Unavailable Quick View still offers full details', 'This style can still be explored, but it cannot be added to the enquiry bag.' in js)
check('Quick View desktop CSS present', '.quick-view-layout{display:grid' in css and '.quick-view-dialog{' in css)
check('Quick View mobile bottom sheet CSS present', '@media(max-width:699px)' in css and 'border-radius:18px 18px 0 0' in css)
check('Quick View small-phone CSS present', '@media(max-width:380px)' in css and '.quick-view-media{height:31dvh}' in css)
check('Quick View touch target >=42px on mobile', '.quick-view-trigger{right:9px;bottom:9px;min-width:42px;height:42px' in css)
check('Reduced-motion rules present', '@media(prefers-reduced-motion:reduce)' in css and '.quick-view-trigger,.quick-view-trigger span,.quick-size-option{transition:none!important}' in css)
check('Print hides Quick View', '.quick-view-trigger,.quick-view-dialog{display:none!important}' in css)
check('V24 cache-bust on CSS', 'styles.css?v=20260908-v24' in html)
check('V24 cache-bust on catalog JS', 'scripts/catalog.js?v=20260908-v24' in html)
check('V24 cache-bust on app JS', 'scripts/app.js?v=20260908-v24' in html)
check('Existing product dialog preserved', soup.select_one('#product-dialog') is not None and 'function openProduct(id' in js)
check('Existing gallery controls preserved', all(x in js for x in ['data-photo-prev','data-photo-next','data-zoom-photo']))
check('Existing related styles preserved', 'relatedStylesMarkup(product)' in js)
check('Existing V23 facts preserved', 'detail-facts' in js and 'selected-size-value' in js and 'detail-direct-enquiry' in js)
check('Existing enquiry bag preserved', soup.select_one('#bag-dialog') is not None and 'data-bag-size' in js and 'data-quantity' in js)
check('Existing Style Finder preserved', soup.select_one('#style-finder-dialog') is not None and 'finderMatchPool' in js)
check('Existing Style Edits preserved', 'editDefinitions' in js and 'data-edit' in js)
check('V20 build-look remains removed', all('build-look' not in text for text in [html,js,css]))
ids=[x.get('id') for x in soup.find_all(id=True)]
check('No duplicate static HTML ids', len(ids)==len(set(ids)))
product_ids=re.findall(r'"id"\s*:\s*"([^"]+)"',catalog)
check('12 catalogue product IDs', len(product_ids)==12)
check('Catalogue IDs unique', len(product_ids)==len(set(product_ids)))
check('All products retain pieces metadata', catalog.count('"pieces":')==12)
check('All products retain productType metadata', catalog.count('"productType":')==12)
check('All product images preserved in catalog', catalog.count('"image":') >= 12)

# Local HTML assets.
for ref in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',html):
    if ref.startswith(('#','https://','http://','mailto:','data:','javascript:')): continue
    target = root/ref.split('?',1)[0]
    check(f'HTML asset exists: {ref}', target.exists())

# CSS url() assets.
for ref in re.findall(r'url\(["\']?([^\)"\']+)', css):
    ref=ref.strip()
    if ref.startswith(('data:','http://','https://','#')): continue
    check(f'CSS asset exists: {ref}', (root/ref.split('?',1)[0]).exists())

# Catalog local image refs.
for ref in sorted(set(re.findall(r'["\'](assets/images/[^"\']+)["\']',catalog))):
    check(f'Catalog asset exists: {ref}', (root/ref).exists())

failed=[n for n,o in checks if not o]
print(f'V24 static checks: {len(checks)} total, {len(failed)} failed')
for n,o in checks:
    print(('PASS' if o else 'FAIL')+' - '+n)
if failed:
    print('\nFAILED:')
    for n in failed: print(' -', n)
    raise SystemExit(1)
