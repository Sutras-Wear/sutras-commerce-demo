from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes, re
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
html = (root/'index.html').read_text(encoding='utf-8')
css = (root/'styles.css').read_text(encoding='utf-8')
catalog = (root/'scripts/catalog.js').read_text(encoding='utf-8')
app = (root/'scripts/app.js').read_text(encoding='utf-8')

# Build an in-memory page so Chromium does not need file:// or localhost navigation.
html = re.sub(r'<link rel="stylesheet" href="styles\.css[^\"]*">', '<style>'+css+'</style>', html, count=1)
html = re.sub(r'<script src="scripts/catalog\.js[^\"]*" defer></script>', '', html, count=1)
html = re.sub(r'<script src="scripts/app\.js[^\"]*" defer></script>', '', html, count=1)
html = html.replace('<head>', '<head><base href="http://sutras.local/">', 1)
html = html.replace('</body>', '<script>'+catalog+'</script><script>'+app+'</script></body>', 1)

checks=[]
def check(name, ok, detail=''):
    ok=bool(ok); checks.append((name,ok,detail))
    print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail else ''))

def route_local(route):
    url = urlparse(route.request.url)
    if url.netloc != 'sutras.local':
        route.abort(); return
    rel = unquote(url.path.lstrip('/'))
    target = (root/rel).resolve()
    try:
        target.relative_to(root.resolve())
    except ValueError:
        route.abort(); return
    if target.is_file():
        mime = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
        route.fulfill(status=200, body=target.read_bytes(), content_type=mime)
    else:
        route.fulfill(status=404, body=b'not found', content_type='text/plain')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])

    # Desktop flow
    page = browser.new_page(viewport={'width':1365,'height':900}, device_scale_factor=1)
    page.route('http://sutras.local/**', route_local)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html, wait_until='domcontentloaded')
    page.wait_for_selector('[data-quick-view="navy-two-piece-set"]')
    check('12 quick-view triggers render', page.locator('[data-quick-view]').count()==12, str(page.locator('[data-quick-view]').count()))
    all_quick_ids = page.locator('[data-quick-view]').evaluate_all('(els) => els.map(el => el.dataset.quickView)')
    all_opened = True
    for quick_id in all_quick_ids:
        page.locator(f'[data-quick-view="{quick_id}"]').click()
        if page.locator('#quick-view-dialog[open]').count() != 1 or not page.locator('#quick-view-title').text_content().strip():
            all_opened = False
            break
        page.locator('#quick-view-dialog [data-close-dialog]').click()
        if page.locator('#quick-view-dialog[open]').count() != 0:
            all_opened = False
            break
    check('Every Quick View trigger opens and close button closes', all_opened, ', '.join(all_quick_ids))

    # Available item: quick view -> size -> add -> bag.
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.wait_for_selector('#quick-view-dialog[open]')
    check('Quick View opens', page.locator('#quick-view-dialog[open]').count()==1)
    check('Product dialog stays closed', page.locator('#product-dialog[open]').count()==0)
    check('Correct Quick View title', 'Navy Two-Piece' in page.locator('#quick-view-title').inner_text(), page.locator('#quick-view-title').inner_text())
    check('Quick View does not alter URL', 'product=' not in page.url, page.url)
    check('Quick View add available for available product', page.locator('#quick-view-add').count()==1)
    all_sizes_work = True
    for size in ['Not sure','XS','S','M','L','XL','XXL']:
        page.locator(f'[data-quick-size="{size}"]').click()
        if page.locator(f'[data-quick-size="{size}"]').get_attribute('aria-pressed') != 'true':
            all_sizes_work = False
            break
    check('Every Quick View size button selects correctly', all_sizes_work)
    page.locator('[data-quick-size="M"]').click()
    check('Quick View size M selected', page.locator('[data-quick-size="M"]').get_attribute('aria-pressed')=='true')
    check('Quick View selected-size cue updates', page.locator('#quick-selected-size').inner_text()=='Selected · M', page.locator('#quick-selected-size').inner_text())
    check('Quick WhatsApp link tracks size', 'M' in unquote(page.locator('#quick-view-whatsapp').get_attribute('href')))
    page.locator('#quick-view-add').click()
    check('Quick View remains open after add', page.locator('#quick-view-dialog[open]').count()==1)
    check('Bag dialog remains closed after add', page.locator('#bag-dialog[open]').count()==0)
    check('Quick add confirmation visible', page.locator('#quick-view-confirmation').is_visible())
    check('Header bag count increments', page.locator('[data-bag-count]').first.inner_text()=='1', page.locator('[data-bag-count]').first.inner_text())
    page.locator('#quick-view-confirmation [data-open-bag]').click()
    page.wait_for_selector('#bag-dialog[open]')
    check('View bag opens bag', page.locator('#bag-dialog[open]').count()==1)
    check('Quick View closes when bag opens', page.locator('#quick-view-dialog[open]').count()==0)
    check('Bag contains Navy product', 'Navy' in page.locator('#bag-items').inner_text())
    check('Bag size is M', page.locator('[data-bag-size="0"]').input_value()=='M', page.locator('[data-bag-size="0"]').input_value())
    check('Bag quantity starts at 1', page.locator('.quantity-value').first.inner_text()=='1')
    page.locator('#bag-dialog [data-close-dialog]').click()

    # Re-add identical size: existing bag entry quantity should increment, not duplicate.
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.locator('[data-quick-size="M"]').click()
    page.locator('#quick-view-add').click()
    page.locator('#quick-view-confirmation [data-open-bag]').click()
    check('Duplicate quick add merges selection', page.locator('.bag-item').count()==1, str(page.locator('.bag-item').count()))
    check('Duplicate quick add increments quantity', page.locator('.quantity-value').first.inner_text()=='2', page.locator('.quantity-value').first.inner_text())
    page.locator('#bag-dialog [data-close-dialog]').click()

    # Unavailable item still quick-views, but cannot add.
    page.locator('[data-quick-view="orange-three-piece-set"]').click()
    page.wait_for_selector('#quick-view-dialog[open]')
    check('Unavailable product Quick View opens', 'Orange' in page.locator('#quick-view-title').inner_text())
    check('Unavailable product has no add button', page.locator('#quick-view-add').count()==0)
    check('Unavailable status shown', 'Currently unavailable' in page.locator('#quick-view-detail').inner_text())
    check('Unavailable product still offers full details', page.locator('#quick-view-detail [data-product="orange-three-piece-set"]').count()==1)
    page.locator('#quick-view-detail [data-product="orange-three-piece-set"]').click()
    page.wait_for_selector('#product-dialog[open]')
    check('Quick View -> full details works', page.locator('#product-dialog[open]').count()==1)
    check('Quick View closes on full details', page.locator('#quick-view-dialog[open]').count()==0)
    check('Unavailable full detail still blocks add', page.locator('#add-to-bag').count()==0)
    page.keyboard.press('Escape')
    check('Escape closes full product dialog', page.locator('#product-dialog[open]').count()==0)

    # Available Quick View -> full V23 detail regression.
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.locator('#quick-view-detail [data-product="navy-two-piece-set"]').click()
    page.wait_for_selector('#product-dialog[open]')
    check('V23 detail facts preserved live', page.locator('.detail-facts').is_visible())
    check('V23 gallery next preserved', page.locator('[data-photo-next]').count()==1)
    check('V23 selected-size cue preserved', page.locator('#selected-size-value').is_visible())
    page.locator('#product-detail [data-size="S"]').click()
    check('V23 selected-size still updates', page.locator('#selected-size-value').text_content()=='Selected · S', page.locator('#selected-size-value').text_content())
    page.locator('#add-to-bag').click()
    check('Full-detail add confirmation still visible', page.locator('#bag-confirmation').is_visible())
    check('Full-detail add keeps product open', page.locator('#product-dialog[open]').count()==1)
    check('Bag remains closed from full-detail add', page.locator('#bag-dialog[open]').count()==0)
    page.keyboard.press('Escape')

    # Search basic regression.
    page.locator('[data-open-search]').first.click()
    page.wait_for_selector('#search-dialog[open]')
    page.locator('#search-input').fill('navy')
    check('Search still finds Navy', 'Navy' in page.locator('#search-results').inner_text())
    page.keyboard.press('Escape')

    # Bag inline size edit + quantity regression.
    page.locator('[data-open-bag]').first.click()
    page.wait_for_selector('#bag-dialog[open]')
    before = page.locator('.bag-item').count()
    check('Bag contains two style-size selections after S add', before==2, str(before))
    page.locator('[data-bag-size="1"]').select_option('M')
    check('Changing S to M merges duplicate bag rows', page.locator('.bag-item').count()==1, str(page.locator('.bag-item').count()))
    check('Merged quantity becomes 3', page.locator('.quantity-value').first.inner_text()=='3', page.locator('.quantity-value').first.inner_text())
    page.locator('[data-quantity="0"][data-change="1"]').click()
    check('Bag quantity + still works', page.locator('.quantity-value').first.inner_text()=='4')
    page.locator('[data-quantity="0"][data-change="-1"]').click()
    check('Bag quantity - still works', page.locator('.quantity-value').first.inner_text()=='3')
    page.locator('#bag-dialog [data-close-dialog]').click()

    # Desktop visual geometry/screenshot.
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.locator('.quick-view-media img').evaluate('(img) => img.complete && img.naturalWidth ? img.decode().catch(()=>{}) : Promise.resolve()')
    box = page.locator('#quick-view-dialog').bounding_box()
    check('Desktop Quick View fits viewport', box and box['width'] < 900 and box['height'] <= 720, str(box))
    page.screenshot(path=str(root/'v24-quick-view-desktop.png'), full_page=False)
    page.locator('#quick-view-dialog [data-close-dialog]').click()
    check('No desktop page errors', not errors, repr(errors))

    # Mobile flow and geometry.
    mobile = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
    mobile.route('http://sutras.local/**', route_local)
    mobile_errors=[]
    mobile.on('pageerror', lambda e: mobile_errors.append(str(e)))
    mobile.set_content(html, wait_until='domcontentloaded')
    mobile.wait_for_selector('[data-quick-view="navy-two-piece-set"]')
    trigger_box = mobile.locator('[data-quick-view="navy-two-piece-set"]').bounding_box()
    check('Mobile Quick View trigger >=42x42', trigger_box and trigger_box['width']>=42 and trigger_box['height']>=42, str(trigger_box))
    mobile.locator('[data-quick-view="navy-two-piece-set"]').click()
    mobile.wait_for_selector('#quick-view-dialog[open]')
    mbox = mobile.locator('#quick-view-dialog').bounding_box()
    check('Mobile Quick View is bottom sheet width', mbox and mbox['width'] >= 389, str(mbox))
    check('Mobile Quick View stays within 90dvh', mbox and mbox['height'] <= 760, str(mbox))
    mobile.locator('[data-quick-size="L"]').click()
    mobile.locator('#quick-view-add').click()
    check('Mobile add confirmation visible', mobile.locator('#quick-view-confirmation').is_visible())
    check('Mobile Quick View remains open after add', mobile.locator('#quick-view-dialog[open]').count()==1)
    mobile.screenshot(path=str(root/'v24-quick-view-mobile.png'), full_page=False)
    mobile.keyboard.press('Escape')
    check('Mobile Escape closes Quick View', mobile.locator('#quick-view-dialog[open]').count()==0)
    check('No mobile page errors', not mobile_errors, repr(mobile_errors))

    browser.close()

failed=[(n,d) for n,o,d in checks if not o]
print(f'V24 browser checks: {len(checks)} total, {len(failed)} failed')
if failed:
    print('FAILED CHECKS:')
    for n,d in failed: print(' -',n,d)
    raise SystemExit(1)
