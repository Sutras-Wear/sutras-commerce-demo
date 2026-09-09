from pathlib import Path
from bs4 import BeautifulSoup
import re, subprocess

root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
app=(root/'scripts/app.js').read_text(encoding='utf-8')
checkout=(root/'scripts/commerce-checkout.js').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
checks=[]
def check(ok,name):
    if not ok: raise AssertionError(name)
    checks.append(name); print(f'PASS {len(checks):02d} {name}')

for f in ['scripts/app.js','scripts/commerce-core.js','scripts/commerce-checkout.js','scripts/catalog.js']:
    r=subprocess.run(['node','--check',str(root/f)],capture_output=True,text=True)
    check(r.returncode==0,f'{f} syntax valid')

check(soup.find('dialog',id='bag-dialog') is not None,'enquiry bag preserved')
check(soup.find(id='bag-checkout') is not None,'desktop Proceed to checkout exists')
check('Proceed to checkout' in soup.find(id='bag-checkout').get_text(' ',strip=True),'desktop checkout label correct')
check(soup.find(id='bag-checkout-mobile') is not None,'mobile Checkout action exists')
check(soup.find(id='bag-checkout').get('aria-disabled')=='true','checkout defaults safely disabled')
check(not soup.find(id='bag-checkout').get('href'),'disabled checkout has no navigation target')
check('V26 CHECKOUT TEST MODE' in soup.find(class_='bag-checkout-mode').get_text(' ',strip=True),'bag clearly labels simulated checkout')
check('Need help before ordering?' in soup.find(id='bag-whatsapp').get_text(' ',strip=True),'desktop WhatsApp repositioned as help')
check('Need help? Ask on WhatsApp' in soup.find(id='bag-whatsapp-mobile').get_text(' ',strip=True),'mobile WhatsApp repositioned as help')
check(soup.find(id='bag-checkout-status').get('role')=='status','checkout readiness is announced accessibly')

scripts=[tag.get('src','') for tag in soup.find_all('script') if tag.get('src')]
check(any('catalog.js' in s for s in scripts),'catalog script present')
check(any('commerce-core.js' in s for s in scripts),'commerce core loaded by storefront')
check(any('app.js' in s for s in scripts),'storefront app present')
idx=lambda token: next(i for i,s in enumerate(scripts) if token in s)
check(idx('catalog.js') < idx('commerce-core.js') < idx('app.js'),'catalog → commerce core → storefront script order correct')
check(all('20260909-v26-1' in s for s in scripts if any(x in s for x in ['catalog.js','commerce-core.js','app.js'])),'V26.1 JS cache bust applied')
check('styles.css?v=20260909-v26-1' in html,'V26.1 CSS cache bust applied')

check('function checkoutReadiness()' in app,'checkout readiness helper exists')
check('commerce.availableStock' in app,'checkout checks live available stock')
check("inventory?.enabled" in app and "typeof inventory.price === 'number'" in app,'checkout requires enabled product and numeric price')
check('item.quantity > available' in app,'checkout blocks over-stock quantity')
check("commerce.saveCart(status.items.map" in app,'enquiry bag synchronizes into commerce cart')
check("source: 'enquiry-bag'" in app,'checkout source marker saved')
check("checkout-preview.html?source=enquiry-bag" in app,'checkout link points to V26 test checkout')
check("$('#bag-checkout')?.addEventListener('click', proceedToCheckout)" in app,'desktop checkout wired')
check("$('#bag-checkout-mobile')?.addEventListener('click', proceedToCheckout)" in app,'mobile checkout wired')
check("initialParams.get('bag') === 'open'" in app,'return-from-checkout can reopen bag')

check("fromEnquiryBag" in checkout,'checkout detects enquiry-bag source')
check("index.html?bag=open" in checkout,'checkout returns to the original bag')
check("CHECKOUT_PREFILL_KEY" in checkout and "order-note" in checkout,'bag note is prefilled into checkout')
check("localStorage.removeItem(ENQUIRY_BAG_KEY)" in checkout,'successful checkout clears original enquiry bag')
check(checkout.index('localStorage.removeItem(ENQUIRY_BAG_KEY)') > checkout.index('commitReservation'),'bag clears only after commit path')
check('simulate-success' in (root/'checkout-preview.html').read_text(),'payment remains explicitly simulated')
check('SIMULATED PAYMENT ONLY' in (root/'checkout-preview.html').read_text(),'checkout still warns no real charge')

for selector in ['.bag-checkout-panel{','.bag-checkout-button.is-disabled{','.bag-help-line{','.bag-mobile-help{']:
    check(selector in css,f'checkout CSS contains {selector}')
check('@media(max-width:760px)' in css and '.bag-checkout-button{display:none}' in css,'mobile uses sticky checkout instead of duplicate button')

ids=[tag.get('id') for tag in soup.find_all(attrs={'id':True})]
check(len(ids)==len(set(ids)),'no duplicate static HTML ids')
check(not (root/'CNAME').exists(),'no premature custom-domain CNAME')
check('flutterwave' not in html.lower() and 'stripe' not in html.lower() and 'pesapal' not in html.lower(),'no real payment SDK added prematurely')

print(f'\nV26.1 STATIC: {len(checks)} checks, 0 failures.')
