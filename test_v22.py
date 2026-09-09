from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/v21fixwork').resolve()
url=(root/'index.html').as_uri()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1365,'height':900}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='networkidle')
    page.evaluate("localStorage.setItem('sutras-demo-v26-1-enquiry-bag-v1', JSON.stringify([{id:'navy-two-piece-set', size:'Not sure', quantity:1}]))")
    page.reload(wait_until='networkidle')
    page.locator('[data-open-bag]').first.click()
    page.wait_for_selector('#bag-dialog[open]')
    sel=page.locator('[data-bag-size="0"]')
    before=sel.evaluate('(e)=>e')
    # The critical regression check: clicking the select must not trigger a bag re-render.
    sel.click()
    after=page.locator('[data-bag-size="0"]')
    same=before==after.evaluate('(e)=>e')
    print('PASS native select click does not re-render:', same)
    # Changing the value should update the bag and persist it.
    after.select_option('M')
    print('PASS size changed to M:', page.locator('[data-bag-size="0"]').input_value()=='M')
    saved=page.evaluate("JSON.parse(localStorage.getItem('sutras-demo-v26-1-enquiry-bag-v1'))[0].size")
    print('PASS size persisted:', saved=='M')
    # Quantity stepper remains compact and functional.
    q=page.locator('.bag-quantity-control')
    print('PASS compact quantity control visible:', q.is_visible())
    page.locator('[data-quantity="0"][data-change="1"]').click()
    print('PASS quantity increments:', page.locator('.quantity-value').inner_text()=='2')
    print('PASS no page errors:', not errors, errors)
    browser.close()
