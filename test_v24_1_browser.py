from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
css=(root/'styles.css').read_text()
catalog=(root/'scripts/catalog.js').read_text()
app=(root/'scripts/app.js').read_text()
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
    checks.append((name,bool(ok),detail));print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail else ''))
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':440,'height':956},device_scale_factor=1)
    page.route('http://sutras.local/**',route_local)
    errs=[]; page.on('pageerror',lambda e: errs.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded')
    page.wait_for_selector('.product-card')
    check('12 product cards render',page.locator('.product-card').count()==12,str(page.locator('.product-card').count()))
    check('No availability badge overlays product card images',page.locator('.product-card .availability-badge').count()==0,str(page.locator('.product-card .availability-badge').count()))
    check('All 12 Quick View eyes remain',page.locator('.product-card .quick-view-trigger').count()==12,str(page.locator('.product-card .quick-view-trigger').count()))
    orange=page.locator('.product-card').nth(0)
    check('Unavailable status still appears below Orange product', 'CURRENTLY UNAVAILABLE' in orange.inner_text().upper(), orange.inner_text())
    # Scroll collection to match the user's screenshot-like framing.
    orange.scroll_into_view_if_needed(); page.evaluate('window.scrollBy(0,-135)')
    page.wait_for_timeout(150)
    page.screenshot(path=str(root/'v24-1-collection-mobile.png'),full_page=False)
    eye=orange.locator('.quick-view-trigger').bounding_box()
    image=orange.locator('.product-image-wrap').bounding_box()
    check('Eye remains inside image bounds', eye and image and eye['x']>=image['x'] and eye['y']>=image['y'] and eye['x']+eye['width']<=image['x']+image['width'] and eye['y']+eye['height']<=image['y']+image['height'], f'eye={eye} image={image}')
    check('Eye keeps 42px touch target',eye and eye['width']>=42 and eye['height']>=42,str(eye))
    check('No page errors',not errs,repr(errs))
    b.close()
failed=[x for x in checks if not x[1]]
print(f'V24.1 browser checks: {len(checks)} total, {len(failed)} failed')
raise SystemExit(1 if failed else 0)
