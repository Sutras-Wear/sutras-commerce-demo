from playwright.sync_api import sync_playwright
from pathlib import Path
import json
url=Path('/mnt/data/v20work/index.html').as_uri()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='networkidle')
    print('title:', page.title())
    print('cards:', page.locator('.product-card').count())
    # open first available product card
    buttons=page.locator('.product-card [data-product]')
    for i in range(buttons.count()):
        b=buttons.nth(i)
        if b.is_visible() and not b.is_disabled():
            b.click(); break
    page.wait_for_timeout(150)
    print('product dialog open:', page.locator('#product-dialog[open]').count())
    print('build look:', page.locator('#build-look .build-look').count())
    print('companions:', page.locator('#build-look .look-companion').count())
    if page.locator('#build-look .look-select').count():
        page.locator('#build-look .look-select').first.click()
        print('add look enabled:', not page.locator('[data-add-look]').is_disabled())
        page.locator('[data-add-look]').click()
        print('bag count:', page.locator('[data-bag-count]').first.inner_text())
    print('errors:', errors)
    browser.close()
