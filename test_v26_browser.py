from pathlib import Path
import base64, json, mimetypes, re
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
checks=[]
def check(condition,name):
    if not condition: raise AssertionError(name)
    checks.append(name); print(f'PASS {len(checks):02d} {name}')

def data_uri(path):
    p=ROOT/path
    mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode('ascii')

# Inline fonts for visual fidelity in the sandboxed in-memory browser harness.
css=(ROOT/'commerce-preview.css').read_text(encoding='utf-8')
for rel in ['assets/fonts/cormorant-medium.woff2','assets/fonts/cormorant-medium-italic.woff2','assets/fonts/dm-sans-regular.woff2','assets/fonts/dm-sans-medium.woff2','assets/fonts/dm-sans-semibold.woff2']:
    css=css.replace(rel,data_uri(rel))

# Build a product-image map from catalog source paths without executing JS in Python.
catalog_text=(ROOT/'scripts/catalog.js').read_text(encoding='utf-8')
ids=re.findall(r'"id":\s*"([^"]+)"',catalog_text)
images=re.findall(r'"image":\s*"([^"]+)"',catalog_text)
image_map={pid:data_uri(img) for pid,img in zip(ids,images) if (ROOT/img).exists()}
image_map_js='window.SUTRAS.products.forEach(p=>{if(window.__IMG[p.id]) p.image=window.__IMG[p.id];});'

storage_mock="""
(()=>{const mem=new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear(),_dump:()=>Object.fromEntries(mem)}});})();
"""

def build_page(filename, pre_app=''):
    soup=BeautifulSoup((ROOT/filename).read_text(encoding='utf-8'),'html.parser')
    for link in soup.find_all('link',rel='stylesheet'): link.decompose()
    style=soup.new_tag('style'); style.string=css; soup.head.append(style)
    # inline scripts in original order, adding the storage mock before commerce-core
    for script in list(soup.find_all('script')):
        src=script.get('src')
        if not src: continue
        content=(ROOT/src).read_text(encoding='utf-8')
        if src=='scripts/catalog.js':
            content += '\nwindow.__IMG='+json.dumps(image_map)+';\n'+image_map_js
        if src=='scripts/commerce-core.js': content=storage_mock+'\n'+content+'\n'+pre_app
        new=soup.new_tag('script'); new.string=content
        script.replace_with(new)
    return str(soup)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1365,'height':900})
    errors=[]; page.on('pageerror',lambda exc: errors.append(str(exc))); page.on('dialog',lambda dialog: dialog.accept())

    # Admin: blank state + load explicit demo through the real button.
    page.set_content(build_page('admin-preview.html'),wait_until='domcontentloaded')
    check('Mom' in page.locator('h1').inner_text(),'inventory admin loads')
    check(page.locator('#inventory-body tr').count()==12,'admin renders all 12 catalogue products')
    page.locator('#load-demo').click()
    navy=page.locator('tr[data-row="navy-two-piece-set"]'); cells=navy.locator('td')
    check(navy.locator('[data-field="price"]').input_value()=='700','demo sets Navy test price to K700')
    check(cells.nth(4).inner_text().strip()=='60','demo shows Navy 60 on hand')
    check(cells.nth(5).inner_text().strip()=='0','demo shows Navy 0 reserved')
    check(cells.nth(6).inner_text().strip()=='60','demo shows Navy 60 available')
    page.screenshot(path=str(ROOT/'v26-admin-desktop.png'),full_page=True)

    # Store: initialize the same explicit demo before store app starts.
    pre="SutrasCommerce.demoScenario(window.SUTRAS.products);"
    page.set_content(build_page('commerce-preview.html',pre),wait_until='domcontentloaded')
    navy_card=page.locator('[data-product-card="navy-two-piece-set"]')
    check('700' in navy_card.inner_text(),'store shows configured Navy K700 price')
    check('60 IN STOCK' in navy_card.inner_text().upper(),'store shows Navy stock count')
    navy_card.locator('[data-size]').select_option(label='M'); navy_card.locator('[data-quantity]').fill('2'); navy_card.locator('[data-add]').click()
    check(page.locator('#cart-count').inner_text().strip()=='2 ITEMS','adding two Navy items updates bag count')
    check('1,400' in page.locator('#cart-total').inner_text(),'bag total calculates 2 × K700 = K1,400')
    check('Need help? Ask us on WhatsApp' in page.locator('.secondary-action').inner_text(),'WhatsApp is repositioned as help')
    page.screenshot(path=str(ROOT/'v26-store-desktop.png'),full_page=True)
    # Preserve store state to feed the checkout page like a real page transition.
    store_dump=page.evaluate('localStorage._dump()')

    # Checkout: inject exact storage snapshot produced by the store, then run checkout app.
    pre_checkout=';'.join([f"localStorage.setItem({json.dumps(k)},{json.dumps(v)})" for k,v in store_dump.items()])+';'
    page.set_content(build_page('checkout-preview.html',pre_checkout),wait_until='domcontentloaded')
    check(page.locator('#summary-items .summary-item').count()==1,'checkout receives shopping bag')
    check('1,400' in page.locator('#summary-total').inner_text(),'checkout preserves K1,400 total')
    page.locator('#checkout-form').evaluate('(form)=>form.requestSubmit()'); page.locator('#payment-sim').wait_for(state='visible')
    stock=page.evaluate("() => { const s=SutrasCommerce.snapshot(); return {onHand:s.products['navy-two-piece-set'].onHand,reserved:s.products['navy-two-piece-set'].reserved,available:SutrasCommerce.availableStock('navy-two-piece-set',s)}; }")
    check(stock=={'onHand':60,'reserved':2,'available':58},'checkout reservation produces on-hand 60 / reserved 2 / available 58')
    page.locator('#simulate-success').click()
    paid=page.evaluate("() => { const s=SutrasCommerce.snapshot(); return {onHand:s.products['navy-two-piece-set'].onHand,reserved:s.products['navy-two-piece-set'].reserved,available:SutrasCommerce.availableStock('navy-two-piece-set',s),orders:s.orders.length,total:s.orders[0]?.total,rid:s.orders[0]?.reservationId}; }")
    check(paid['onHand']==58,'successful payment permanently reduces Navy 60 → 58')
    check(paid['reserved']==0 and paid['available']==58,'successful payment clears reservation and leaves 58 available')
    check(paid['orders']==1 and paid['total']==1400,'successful payment creates one K1,400 paid order')
    duplicate=page.evaluate("(rid)=>{SutrasCommerce.commitReservation(rid,{provider:'duplicate-test',reference:'duplicate'});const s=SutrasCommerce.snapshot();return [s.products['navy-two-piece-set'].onHand,s.orders.length]}",paid['rid'])
    check(duplicate==[58,1],'duplicate success is idempotent and cannot double-decrement stock')
    check('60' in page.locator('#checkout-result').inner_text() and '58' in page.locator('#checkout-result').inner_text(),'checkout confirmation visibly reports 60 → 58')
    paid_dump=page.evaluate('localStorage._dump()')

    # Admin fed the exact post-payment state.
    pre_paid=';'.join([f"localStorage.setItem({json.dumps(k)},{json.dumps(v)})" for k,v in paid_dump.items()])+';'
    page.set_content(build_page('admin-preview.html',pre_paid),wait_until='domcontentloaded')
    check(page.locator('#stat-orders').inner_text().strip()=='1','admin dashboard shows one paid order')
    check('1,400' in page.locator('#stat-revenue').inner_text(),'admin dashboard shows K1,400 test revenue')
    navy=page.locator('tr[data-row="navy-two-piece-set"]'); cells=navy.locator('td')
    check(cells.nth(4).inner_text().strip()=='58' and cells.nth(6).inner_text().strip()=='58','admin shows Navy 58 after sale')
    check(page.locator('#orders-ledger .ledger-row').count()==1,'paid order appears in admin order ledger')

    # Failed-payment path: fresh demo + cart with Green qty 3.
    pre_fail="SutrasCommerce.demoScenario(window.SUTRAS.products); SutrasCommerce.addCartItem('green-two-piece-set',3,'L');"
    page.set_content(build_page('checkout-preview.html',pre_fail),wait_until='domcontentloaded')
    page.locator('#checkout-form').evaluate('(form)=>form.requestSubmit()'); page.locator('#payment-sim').wait_for(state='visible')
    reserved=page.evaluate("()=>{const s=SutrasCommerce.snapshot();return [s.products['green-two-piece-set'].onHand,s.products['green-two-piece-set'].reserved,SutrasCommerce.availableStock('green-two-piece-set',s)]}")
    check(reserved==[24,3,21],'failed-payment test first reserves Green 24 / 3 / 21')
    page.locator('#simulate-fail').click()
    released=page.evaluate("()=>{const s=SutrasCommerce.snapshot();return [s.products['green-two-piece-set'].onHand,s.products['green-two-piece-set'].reserved,SutrasCommerce.availableStock('green-two-piece-set',s),s.orders.length]}")
    check(released==[24,0,24,0],'cancelled payment releases Green stock with no sale')

    # Responsive layout + screenshots for the three new pages.
    for width,height in [(1365,900),(768,900),(440,956),(390,844)]:
        page.set_viewport_size({'width':width,'height':height})
        cases=[('commerce-preview.html',pre),('admin-preview.html',pre),('checkout-preview.html',"SutrasCommerce.demoScenario(window.SUTRAS.products); SutrasCommerce.addCartItem('navy-two-piece-set',2,'M');")]
        for filename,pres in cases:
            page.set_content(build_page(filename,pres),wait_until='domcontentloaded')
            overflow=page.evaluate('()=>document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
            check(not overflow,f'{filename} has no horizontal page overflow at {width}px')

    page.set_viewport_size({'width':440,'height':956})
    page.set_content(build_page('commerce-preview.html',pre),wait_until='domcontentloaded'); page.screenshot(path=str(ROOT/'v26-store-mobile.png'),full_page=True)
    page.set_content(build_page('checkout-preview.html',"SutrasCommerce.demoScenario(window.SUTRAS.products); SutrasCommerce.addCartItem('navy-two-piece-set',2,'M');"),wait_until='domcontentloaded'); page.screenshot(path=str(ROOT/'v26-checkout-mobile.png'),full_page=True)

    check(len(errors)==0,f'no uncaught browser page errors ({errors})')
    browser.close()
print(f'\nV26 BROWSER: {len(checks)} checks, 0 failures.')
