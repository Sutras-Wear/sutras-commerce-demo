from pathlib import Path
from urllib.parse import urlparse, unquote
import base64, json, mimetypes
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
checks=[]
def check(ok,name,detail=''):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append(name); print(f'PASS {len(checks):02d} {name}'+(f' :: {detail}' if detail else ''))

def data_uri(path):
    p=ROOT/path
    mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode('ascii')

storage_mock="""
(()=>{const mem=new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear(),key:i=>[...mem.keys()][i]??null,get length(){return mem.size},_dump:()=>Object.fromEntries(mem)}});})();
"""

def inline_fonts(css):
    for rel in ['assets/fonts/cormorant-medium.woff2','assets/fonts/cormorant-medium-italic.woff2','assets/fonts/dm-sans-regular.woff2','assets/fonts/dm-sans-medium.woff2','assets/fonts/dm-sans-semibold.woff2']:
        css=css.replace(rel,data_uri(rel))
    return css

def build_page(filename, cssfile, pre_core=''):
    soup=BeautifulSoup((ROOT/filename).read_text(encoding='utf-8'),'html.parser')
    # Make local relative URLs resolvable for images while staying in-memory.
    base=soup.new_tag('base',href='http://sutras.local/')
    soup.head.insert(0,base)
    for link in list(soup.find_all('link',rel='stylesheet')):
        link.decompose()
    style=soup.new_tag('style'); style.string=inline_fonts((ROOT/cssfile).read_text(encoding='utf-8')); soup.head.append(style)
    deferred=[]
    for script in list(soup.find_all('script')):
        src=script.get('src')
        if not src: continue
        rawsrc=src.split('?',1)[0]
        content=(ROOT/rawsrc).read_text(encoding='utf-8')
        if rawsrc=='scripts/commerce-core.js':
            content=storage_mock+'\n'+content+'\n'+pre_core
        deferred.append(content)
        script.decompose()
    # Original external scripts are `defer`; append their inline equivalents at
    # the end of body so the DOM exists before storefront code executes.
    for content in deferred:
        new=soup.new_tag('script'); new.string=content; soup.body.append(new)
    return str(soup)

def inject_dump(dump):
    return ';'.join(f"localStorage.setItem({json.dumps(k)},{json.dumps(v)})" for k,v in dump.items())+';'

def route_local(route):
    u=urlparse(route.request.url)
    if u.netloc!='sutras.local': return route.abort()
    rel=unquote(u.path.lstrip('/'))
    target=(ROOT/rel).resolve()
    try: target.relative_to(ROOT.resolve())
    except ValueError: return route.abort()
    if target.is_file():
        route.fulfill(status=200,body=target.read_bytes(),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
    else: route.fulfill(status=404,body='not found',content_type='text/plain')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1365,'height':900})
    page.route('http://sutras.local/**',route_local)
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))

    # Safety default: with no commerce configuration, checkout remains visible but locked.
    page.set_content(build_page('index.html','styles.css'),wait_until='domcontentloaded')
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.locator('[data-quick-size="M"]').click(); page.locator('#quick-view-add').click(); page.locator('#quick-view-confirmation [data-open-bag]').click()
    check(page.locator('#bag-dialog[open]').count()==1,'enquiry bag opens from normal storefront')
    check(page.locator('#bag-checkout').get_attribute('aria-disabled')=='true','checkout is locked before stock/price configuration')
    check(page.locator('#bag-checkout').get_attribute('href') is None,'locked checkout has no href')
    check('not configured for checkout yet' in page.locator('#bag-checkout-status').inner_text().lower(),'locked checkout explains why')
    check('Need help before ordering?' in page.locator('#bag-whatsapp').inner_text(),'WhatsApp remains available as help')

    # Explicit V26 demo: Navy 60 at K700. Add 2 to the real enquiry bag.
    pre="SutrasCommerce.demoScenario(window.SUTRAS.products);"
    page.set_content(build_page('index.html','styles.css',pre),wait_until='domcontentloaded')
    page.locator('[data-quick-view="navy-two-piece-set"]').click(); page.locator('[data-quick-size="M"]').click(); page.locator('#quick-view-add').click(); page.locator('#quick-view-confirmation [data-open-bag]').click()
    check(page.locator('#bag-checkout').get_attribute('aria-disabled')=='false','checkout unlocks for configured in-stock selection')
    check(page.locator('#bag-checkout').get_attribute('href')=='checkout-preview.html?source=enquiry-bag','checkout points to source-aware test checkout')
    check('700' in page.locator('#bag-checkout-total').inner_text(),'bag shows K700 test total for one Navy')
    page.locator('[data-quantity="0"][data-change="1"]').click()
    check(page.locator('.quantity-value').inner_text()=='2','bag quantity can increase to two')
    check('1,400' in page.locator('#bag-checkout-total').inner_text(),'bag checkout total updates to K1,400')
    page.locator('#order-note').fill('Please confirm a comfortable fit.')
    # Prevent only the default navigation. The storefront click handler still runs and synchronizes storage.
    page.evaluate("document.addEventListener('click',e=>{if(e.target.closest('#bag-checkout'))e.preventDefault()},true)")
    page.locator('#bag-checkout').click()
    cart=page.evaluate('SutrasCommerce.loadCart()')
    check(cart==[{'productId':'navy-two-piece-set','quantity':2,'size':'M'}],'Proceed to checkout synchronizes enquiry bag into commerce cart',repr(cart))
    prefill=json.loads(page.evaluate("localStorage.getItem('sutras-demo-v26-1-checkout-prefill-v1')"))
    check(prefill['source']=='enquiry-bag' and 'comfortable fit' in prefill['note'],'checkout bridge carries the order note')
    main_dump=page.evaluate('localStorage._dump()')
    check('sutras-demo-v26-1-enquiry-bag-v1' in main_dump,'original enquiry bag remains before payment succeeds')
    page.screenshot(path=str(ROOT/'v26-1-bag-desktop.png'),full_page=False)

    # Stock decrease guard: if only one is available, the same bag qty 2 becomes blocked.
    pre_low="SutrasCommerce.demoScenario(window.SUTRAS.products); SutrasCommerce.updateProduct('navy-two-piece-set',{onHand:1},'browser test low stock');"
    page.set_content(build_page('index.html','styles.css',pre_low),wait_until='domcontentloaded')
    page.locator('[data-quick-view="navy-two-piece-set"]').click(); page.locator('[data-quick-size="M"]').click(); page.locator('#quick-view-add').click(); page.locator('#quick-view-confirmation [data-open-bag]').click(); page.locator('[data-quantity="0"][data-change="1"]').click()
    check(page.locator('#bag-checkout').get_attribute('aria-disabled')=='true','checkout re-locks when requested quantity exceeds live available stock')
    check('only has 1 available' in page.locator('#bag-checkout-status').inner_text().lower(),'over-stock block explains current availability')

    # Checkout receives exact synchronized cart + note and knows it came from the enquiry bag.
    page.goto('about:blank?source=enquiry-bag',wait_until='domcontentloaded')
    page.set_content(build_page('checkout-preview.html','commerce-preview.css',inject_dump(main_dump)),wait_until='domcontentloaded')
    check(page.locator('#summary-items .summary-item').count()==1,'checkout receives one synchronized line item')
    check('Qty 2' in page.locator('#summary-items').inner_text(),'checkout receives quantity two')
    check('1,400' in page.locator('#summary-total').inner_text(),'checkout receives K1,400 total')
    check('comfortable fit' in page.locator('#order-note').input_value(),'checkout prefills note from enquiry bag')
    check(page.locator('#checkout-back-link').get_attribute('href')=='index.html?bag=open','checkout Back link returns to original bag')
    check('Back to your bag' in page.locator('#checkout-back-link').inner_text(),'checkout Back link wording changes for storefront source')
    page.locator('#checkout-form').evaluate('(form)=>form.requestSubmit()'); page.locator('#payment-sim').wait_for(state='visible')
    reserved=page.evaluate("()=>{const s=SutrasCommerce.snapshot();return [s.products['navy-two-piece-set'].onHand,s.products['navy-two-piece-set'].reserved,SutrasCommerce.availableStock('navy-two-piece-set',s)]}")
    check(reserved==[60,2,58],'checkout reserves 2: on-hand 60 / reserved 2 / available 58',repr(reserved))
    page.locator('#simulate-success').click()
    after=page.evaluate("()=>{const s=SutrasCommerce.snapshot();return [s.products['navy-two-piece-set'].onHand,s.products['navy-two-piece-set'].reserved,SutrasCommerce.availableStock('navy-two-piece-set',s),s.orders.length]}")
    check(after==[58,0,58,1],'successful simulated payment permanently changes Navy 60 → 58 once',repr(after))
    check(page.evaluate("localStorage.getItem('sutras-demo-v26-1-enquiry-bag-v1')") is None,'successful payment clears original enquiry bag')
    check(page.evaluate('SutrasCommerce.loadCart()')==[],'successful payment clears commerce cart')

    # Failed payment preserves the customer bag and restores reserved stock.
    page.goto('about:blank?source=enquiry-bag',wait_until='domcontentloaded')
    page.set_content(build_page('checkout-preview.html','commerce-preview.css',inject_dump(main_dump)),wait_until='domcontentloaded')
    page.locator('#checkout-form').evaluate('(form)=>form.requestSubmit()'); page.locator('#payment-sim').wait_for(state='visible'); page.locator('#simulate-fail').click()
    failed=page.evaluate("()=>{const s=SutrasCommerce.snapshot();return [s.products['navy-two-piece-set'].onHand,s.products['navy-two-piece-set'].reserved,SutrasCommerce.availableStock('navy-two-piece-set',s),s.orders.length]}")
    check(failed==[60,0,60,0],'failed simulated payment restores availability and records no sale',repr(failed))
    check(page.evaluate("localStorage.getItem('sutras-demo-v26-1-enquiry-bag-v1')") is not None,'failed payment preserves original enquiry bag for retry')

    # Mobile: checkout becomes the sticky primary action while WhatsApp remains inline help.
    mobile=browser.new_page(viewport={'width':440,'height':956})
    mobile.route('http://sutras.local/**',route_local)
    mobile_errors=[]; mobile.on('pageerror',lambda e: mobile_errors.append(str(e)))
    mobile.set_content(build_page('index.html','styles.css',pre),wait_until='domcontentloaded')
    mobile.locator('[data-quick-view="navy-two-piece-set"]').click(); mobile.locator('[data-quick-size="M"]').click(); mobile.locator('#quick-view-add').click(); mobile.locator('#quick-view-confirmation [data-open-bag]').click()
    check(mobile.locator('#bag-checkout-mobile').is_visible(),'mobile sticky Checkout is visible')
    check(mobile.locator('#bag-checkout-mobile').get_attribute('aria-disabled')=='false','mobile sticky Checkout is enabled when ready')
    check(not mobile.locator('#bag-checkout').is_visible(),'desktop checkout button is hidden on mobile')
    check(mobile.locator('#bag-whatsapp-mobile').is_visible(),'mobile WhatsApp help remains visible in bag content')
    box=mobile.locator('#bag-checkout-mobile').bounding_box()
    check(box and box['height']>=48,'mobile Checkout touch target is at least 48px high',repr(box))
    overflow=mobile.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
    check(not overflow,'mobile bag has no horizontal page overflow')
    mobile.screenshot(path=str(ROOT/'v26-1-bag-mobile.png'),full_page=False)

    check(not errors,'no desktop Chromium page errors',repr(errors))
    check(not mobile_errors,'no mobile Chromium page errors',repr(mobile_errors))
    browser.close()

print(f'\nV26.1 BROWSER: {len(checks)} checks, 0 failures.')
