from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes,re,sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(); css=(root/'styles.css').read_text(); catalog=(root/'scripts/catalog.js').read_text(); app=(root/'scripts/app.js').read_text()
html=re.sub(r'<link rel="stylesheet" href="styles\.css[^\"]*">','<style>'+css+'</style>',html,count=1)
html=re.sub(r'<script src="scripts/catalog\.js[^\"]*" defer></script>','',html,count=1)
html=re.sub(r'<script src="scripts/app\.js[^\"]*" defer></script>','',html,count=1)
html=html.replace('<head>','<head><base href="http://sutras.local/">',1)
html=html.replace('</body>','<script>'+catalog+'</script><script>'+app+'</script></body>',1)
def route_local(route):
    u=urlparse(route.request.url)
    if u.netloc!='sutras.local': route.abort(); return
    target=(root/unquote(u.path.lstrip('/'))).resolve()
    try: target.relative_to(root.resolve())
    except ValueError: route.abort(); return
    if target.is_file(): route.fulfill(status=200,body=target.read_bytes(),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
    else: route.fulfill(status=404,body=b'not found')
checks=[]
def check(name,ok,detail=''):
    checks.append((name,bool(ok),detail)); print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail else ''))
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    # Mobile collection
    page=b.new_page(viewport={'width':440,'height':956},device_scale_factor=1)
    page.route('http://sutras.local/**',route_local)
    errs=[]; page.on('pageerror',lambda e: errs.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded'); page.wait_for_selector('.product-card')
    cards=page.locator('.product-card')
    check('12 cards render',cards.count()==12,str(cards.count()))
    check('12 availability pills render',page.locator('.product-card .availability-status').count()==12,str(page.locator('.product-card .availability-status').count()))
    check('No card image availability overlays',page.locator('.product-card .product-image-wrap .availability-status, .product-card .product-image-wrap .availability-badge').count()==0)
    texts=[page.locator('.product-card .availability-status').nth(i).inner_text().strip().upper() for i in range(12)]
    check('Four unavailable pills',sum(t=='CURRENTLY UNAVAILABLE' for t in texts)==4,str(texts))
    check('Eight confirm pills',sum(t=='AVAILABILITY TO CONFIRM' for t in texts)==8,str(texts))
    check('Unavailable cards have unavailable tone',page.locator('.product-card .availability-status.is-unavailable').count()==4,str(page.locator('.product-card .availability-status.is-unavailable').count()))
    check('Default cards have available-tone styling',page.locator('.product-card .availability-status.is-available').count()==8,str(page.locator('.product-card .availability-status.is-available').count()))
    orange=cards.nth(0); orange.scroll_into_view_if_needed(); page.evaluate('window.scrollBy(0,-135)'); page.wait_for_timeout(120)
    page.screenshot(path=str(root/'v24-2-collection-mobile.png'),full_page=False)
    # ensure pill doesn't overflow card
    pill=orange.locator('.availability-status').bounding_box(); card=orange.bounding_box()
    check('Mobile unavailable pill fits card width',pill and card and pill['x']>=card['x'] and pill['x']+pill['width']<=card['x']+card['width']+0.5,f'pill={pill} card={card}')

    # Quick View, available item
    navy=cards.nth(2); navy.locator('.quick-view-trigger').click(); page.wait_for_selector('#quick-view-dialog[open]')
    check('Available Quick View has status pill',page.locator('#quick-view-dialog .availability-status').count()==1)
    check('Available Quick View says confirm',page.locator('#quick-view-dialog .availability-status').inner_text().strip().upper()=='AVAILABILITY TO CONFIRM')
    check('Quick View media has no availability overlay',page.locator('#quick-view-dialog .quick-view-media .availability-badge, #quick-view-dialog .quick-view-media .availability-status').count()==0)
    page.screenshot(path=str(root/'v24-2-quick-view-mobile.png'),full_page=False)
    page.locator('#quick-view-dialog .quick-view-close').click(); page.wait_for_timeout(60)

    # Quick View unavailable item
    orange.locator('.quick-view-trigger').click(); page.wait_for_selector('#quick-view-dialog[open]')
    check('Unavailable Quick View uses rust tone',page.locator('#quick-view-dialog .availability-status.is-unavailable').count()==1)
    check('Unavailable Quick View cannot add to bag',page.locator('#quick-view-add').count()==0)
    page.locator('#quick-view-dialog .quick-view-close').click(); page.wait_for_timeout(60)

    # Full details status, available item
    navy.locator('.product-name').click(); page.wait_for_selector('#product-dialog[open]')
    check('Full details has status pill',page.locator('#product-dialog .detail-availability-status').count()==1)
    check('Full details status text correct',page.locator('#product-dialog .detail-availability-status').inner_text().strip().upper()=='AVAILABILITY TO CONFIRM')
    page.locator('#product-dialog .product-close').click();
    check('No mobile page errors',not errs,repr(errs))
    page.close()

    # Desktop visual sanity
    desk=b.new_page(viewport={'width':1365,'height':900},device_scale_factor=1)
    desk.route('http://sutras.local/**',route_local); derr=[]; desk.on('pageerror',lambda e: derr.append(str(e)))
    desk.set_content(html,wait_until='domcontentloaded'); desk.wait_for_selector('.product-card')
    desk.locator('.product-card').nth(0).scroll_into_view_if_needed(); desk.evaluate('window.scrollBy(0,-170)'); desk.wait_for_timeout(120)
    desk.screenshot(path=str(root/'v24-2-collection-desktop.png'),full_page=False)
    check('Desktop has 12 status pills',desk.locator('.product-card .availability-status').count()==12)
    check('No desktop page errors',not derr,repr(derr))
    desk.close(); b.close()
failed=[x for x in checks if not x[1]]
print(f'V24.2 browser checks: {len(checks)} total, {len(failed)} failed')
sys.exit(1 if failed else 0)
