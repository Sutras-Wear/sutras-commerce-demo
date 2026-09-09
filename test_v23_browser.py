from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/v23work').resolve()
url=(root/'index.html').as_uri()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1365,'height':900}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='networkidle')
    # Open the first product and exercise core product-detail interactions.
    page.locator('[data-product]').first.click()
    page.wait_for_selector('#product-dialog[open]')
    print('PASS product dialog opens:', page.locator('#product-dialog[open]').count()==1)
    print('PASS detail facts visible:', page.locator('.detail-facts').is_visible())
    print('PASS selected-size cue visible:', page.locator('#selected-size-value').is_visible())
    page.locator('[data-size="M"]').click()
    print('PASS size cue updates:', page.locator('#selected-size-value').inner_text()=='Selected · M')
    print('PASS direct enquiry updates:', 'M' in page.locator('#direct-enquiry').get_attribute('href'))
    # Gallery controls.
    thumbs=page.locator('[data-photo-index]')
    if thumbs.count() > 1:
        page.locator('[data-photo-next]').click()
        print('PASS gallery next changes counter:', page.locator('#gallery-position').inner_text()=='2 / '+str(thumbs.count()))
    # Add to bag should leave product dialog open.
    page.locator('#add-to-bag').click()
    print('PASS add confirmation visible:', page.locator('#bag-confirmation').is_visible())
    print('PASS product dialog remains open:', page.locator('#product-dialog[open]').count()==1)
    print('PASS bag dialog remains closed:', page.locator('#bag-dialog[open]').count()==0)
    print('PASS no page errors:', not errors, errors)
    page.screenshot(path='/mnt/data/v23work/v23-product-detail-desktop.png', full_page=False)
    browser.close()
