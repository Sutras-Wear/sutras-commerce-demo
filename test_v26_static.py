from pathlib import Path
from bs4 import BeautifulSoup
import re, subprocess, sys
ROOT = Path(__file__).resolve().parent
checks=[]
def check(cond, name):
    if not cond: raise AssertionError(name)
    checks.append(name); print(f"PASS {len(checks):02d} {name}")
for name in ['commerce-preview.html','admin-preview.html','checkout-preview.html','commerce-preview.css','scripts/commerce-core.js','scripts/commerce-store.js','scripts/commerce-admin.js','scripts/commerce-checkout.js','V26-COMMERCE-ARCHITECTURE.md','V26-TEST-GUIDE.md']:
    check((ROOT/name).exists(), f'{name} exists')
for html in ['commerce-preview.html','admin-preview.html','checkout-preview.html']:
    soup=BeautifulSoup((ROOT/html).read_text(encoding='utf-8'),'html.parser')
    check(bool(soup.title and soup.title.string), f'{html} has title')
    check(bool(soup.find('meta',attrs={'name':'robots','content':'noindex,nofollow'})), f'{html} is noindex')
    check('NO REAL' in soup.get_text(' ',strip=True).upper() or 'SIMULATED PAYMENT' in soup.get_text(' ',strip=True).upper(), f'{html} clearly labels test/no-real-payment mode')
for js in ['scripts/commerce-core.js','scripts/commerce-store.js','scripts/commerce-admin.js','scripts/commerce-checkout.js']:
    result=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    check(result.returncode==0, f'{js} passes Node syntax check')
core=(ROOT/'scripts/commerce-core.js').read_text(encoding='utf-8')
check('reserved' in core and 'onHand' in core and 'availableStock' in core, 'core models on-hand/reserved/available stock')
check('commitReservation' in core and 'releaseReservation' in core, 'core has payment-success and payment-failure paths')
check("reservation.status === 'paid'" in core, 'core includes idempotent already-paid guard')
check('RESERVATION_TTL_MS' in core and 'cleanupExpiredReservations' in core, 'core includes expiring reservations')
check('localStorage' in core, 'preview explicitly uses browser-local storage')
check('price: null' in core and 'onHand: 0' in core and 'enabled: false' in core, 'default commerce data does not invent real prices/stock')
admin=(ROOT/'admin-preview.html').read_text(encoding='utf-8')
check('Load 60-stock demo' in admin, 'admin exposes explicit 60-stock demo scenario')
checkout=(ROOT/'checkout-preview.html').read_text(encoding='utf-8')
check('Simulate successful payment' in checkout and 'Simulate failed / cancelled payment' in checkout, 'checkout exposes success and failure simulators')
store=(ROOT/'commerce-preview.html').read_text(encoding='utf-8')
check('Need help? Ask us on WhatsApp' in store, 'WhatsApp repositioned as customer help in commerce preview')
check((ROOT/'index.html').exists(), 'approved V25 public index remains packaged')
print(f"\nV26 STATIC: {len(checks)} checks, 0 failures.")
