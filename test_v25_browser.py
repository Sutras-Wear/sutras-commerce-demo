from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes, re
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
catalog=(root/'scripts/catalog.js').read_text(encoding='utf-8')
app=(root/'scripts/app.js').read_text(encoding='utf-8')
html=re.sub(r'<link rel="stylesheet" href="styles\.css[^"]*">','<style>'+css+'</style>',html,count=1)
html=re.sub(r'<script src="scripts/catalog\.js[^"]*" defer></script>','',html,count=1)
html=re.sub(r'<script src="scripts/app\.js[^"]*" defer></script>','',html,count=1)
html=html.replace('<head>','<head><base href="http://sutras.local/">',1)
html=html.replace('</body>','<script>'+catalog+'</script><script>'+app+'</script></body>',1)
checks=[]
def check(name,ok,detail=''):
    ok=bool(ok);checks.append((name,ok,detail));print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail else ''))
def route_local(route):
    url=urlparse(route.request.url)
    if url.netloc!='sutras.local': route.abort();return
    rel=unquote(url.path.lstrip('/'))
    target=(root/rel).resolve()
    try: target.relative_to(root.resolve())
    except ValueError: route.abort();return
    if target.is_file():
        route.fulfill(status=200,body=target.read_bytes(),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
    else: route.fulfill(status=404,body=b'not found',content_type='text/plain')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1365,'height':900},device_scale_factor=1)
    page.route('http://sutras.local/**',route_local)
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded')
    page.wait_for_selector('#how-to-order')
    check('Order journey renders',page.locator('#how-to-order').is_visible())
    check('Four order steps render',page.locator('#how-to-order .order-step').count()==4,str(page.locator('#how-to-order .order-step').count()))
    check('Confirm card renders',page.locator('.order-confirm-card').is_visible())
    check('Four confirmation items render',page.locator('.order-confirm-list li').count()==4)
    # Desktop geometry
    width=page.locator('#how-to-order').bounding_box()['width']
    check('Desktop order journey fits viewport',width<=1365,str(width))
    page.locator('#how-to-order').scroll_into_view_if_needed()
    page.screenshot(path=str(root/'v25-ordering-desktop.png'),full_page=False)
    # Bag entry action
    page.locator('#how-to-order [data-open-bag]').click()
    page.wait_for_selector('#bag-dialog[open]')
    check('How-to-order bag action opens bag',page.locator('#bag-dialog[open]').count()==1)
    page.keyboard.press('Escape')
    check('Escape closes bag',page.locator('#bag-dialog[open]').count()==0)
    # WhatsApp/contact action opens contact dialog
    page.locator('#how-to-order [data-open-contact]').click()
    page.wait_for_selector('#contact-dialog[open]')
    check('Confirm-card WhatsApp action opens contact dialog',page.locator('#contact-dialog[open]').count()==1)
    check('Both WhatsApp numbers present in contact dialog',page.locator('#contact-dialog .contact-number').count()==2)
    page.keyboard.press('Escape')
    # Existing Quick View basic regression
    page.locator('[data-quick-view="navy-two-piece-set"]').click()
    page.wait_for_selector('#quick-view-dialog[open]')
    check('Quick View still opens after V25',page.locator('#quick-view-dialog[open]').count()==1)
    check('V24.2 availability still visible',page.locator('#quick-view-dialog .availability-status').count()>=1)
    page.keyboard.press('Escape')
    check('No desktop page errors',not errors,repr(errors))

    # Mobile 440x956, matching user's DevTools screenshot width.
    mobile=browser.new_page(viewport={'width':440,'height':956},device_scale_factor=1)
    mobile.route('http://sutras.local/**',route_local)
    merr=[];mobile.on('pageerror',lambda e: merr.append(str(e)))
    mobile.set_content(html,wait_until='domcontentloaded')
    mobile.wait_for_selector('#how-to-order')
    mobile.evaluate("window.scrollTo(0, document.querySelector('#how-to-order').offsetTop - 82)")
    mobile.wait_for_timeout(800)
    mbox=mobile.locator('#how-to-order').bounding_box()
    check('Mobile order journey fits 440px viewport',mbox and mbox['x']>=0 and mbox['x']+mbox['width']<=441,str(mbox))
    step_rects=mobile.locator('.order-step').evaluate_all('(els) => els.slice(0,2).map(el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })')
    first_step,second_step=step_rects
    check('Mobile 440px uses compact two-column steps',190<=first_step['width']<=205 and 190<=second_step['width']<=205 and abs(first_step['y']-second_step['y'])<1,str(step_rects))
    cbox=mobile.locator('.order-confirm-card').bounding_box()
    check('Mobile confirm card fits viewport',cbox and cbox['x']>=0 and cbox['x']+cbox['width']<=441,str(cbox))
    mobile.screenshot(path=str(root/'v25-ordering-mobile.png'),full_page=False)
    # Mobile menu new links
    mobile.locator('[data-open-menu]').click()
    mobile.wait_for_selector('#menu-dialog[open]')
    check('Mobile menu includes collection link',mobile.locator('#menu-dialog a[href="#collection"]').count()==1)
    check('Mobile menu includes How to order link',mobile.locator('#menu-dialog a[href="#how-to-order"]').count()==1)
    check('Mobile How-to-order link points to the correct anchor',mobile.locator('#menu-dialog a[href="#how-to-order"]').get_attribute('href')=='#how-to-order')
    mobile.keyboard.press('Escape')
    check('Escape closes mobile menu',mobile.locator('#menu-dialog[open]').count()==0)
    # Small mobile 390 basic card quick view regression
    check('12 Quick View triggers remain',mobile.locator('[data-quick-view]').count()==12,str(mobile.locator('[data-quick-view]').count()))
    check('No mobile page errors',not merr,repr(merr))
    browser.close()

failed=[x for x in checks if not x[1]]
print(f'V25 browser checks: {len(checks)} total, {len(failed)} failed')
if failed:
    for n,o,d in failed: print(' -',n,d)
    raise SystemExit(1)
