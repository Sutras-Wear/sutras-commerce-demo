from pathlib import Path
import re, subprocess, sys, json
from bs4 import BeautifulSoup

root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
js=(root/'scripts/app.js').read_text(encoding='utf-8')
cat=(root/'scripts/catalog.js').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
checks=[]
def check(name, cond, detail=''):
    checks.append((name,bool(cond),detail))

for f in ['scripts/app.js','scripts/catalog.js']:
    r=subprocess.run(['node','--check',str(root/f)],capture_output=True,text=True)
    check(f'{f} syntax valid',r.returncode==0,r.stderr.strip())
check('HTML parses',soup.find('main',id='main') is not None)
check('V25 cache bust applied', all(x in html for x in ['styles.css?v=20260909-v26-1','scripts/app.js?v=20260909-v26-1','scripts/catalog.js?v=20260909-v26-1','scripts/commerce-core.js?v=20260909-v26-1']))

# New order journey
journey=soup.find('section',id='how-to-order')
check('How-to-order section exists', journey is not None)
check('How-to-order heading labelled', journey and journey.get('aria-labelledby')=='order-journey-title')
steps=journey.select('.order-step') if journey else []
check('Exactly four ordering steps',len(steps)==4,str(len(steps)))
step_text=' '.join(x.get_text(' ',strip=True) for x in steps)
for phrase in ['Find your piece','Save your favourites','Send one message','Confirm before ordering']:
    check(f'Ordering step includes {phrase}',phrase in step_text)
check('Bag entry point in ordering section',journey and journey.select_one('[data-open-bag]') is not None)
check('WhatsApp contact entry point in confirm card',journey and journey.select_one('[data-open-contact]') is not None)
check('No false checkout claim',journey and 'No checkout maze' in journey.get_text(' ',strip=True))
check('Enquiry disclaimer is explicit',journey and 'does not place, reserve or charge an order' in journey.get_text(' ',strip=True))
check('Confirmation list has four details',journey and len(journey.select('.order-confirm-list li'))==4)

# Navigation access
footer_order=soup.select_one('.footer-column a[href="#how-to-order"]')
mobile_order=soup.select_one('.menu-dialog nav a[href="#how-to-order"]')
mobile_collection=soup.select_one('.menu-dialog nav a[href="#collection"]')
check('Footer links to How to order',footer_order is not None)
check('Mobile menu links to How to order',mobile_order is not None)
check('Mobile menu now links to collection',mobile_collection is not None)

# Launch support files
check('robots.txt exists',(root/'robots.txt').is_file())
robots=(root/'robots.txt').read_text() if (root/'robots.txt').is_file() else ''
check('robots allows crawl','User-agent: *' in robots and 'Allow: /' in robots)
check('robots points to sitemap','Sitemap: https://sutras-wear.github.io/Sutras-by-S3/sitemap.xml' in robots)
check('404 page exists',(root/'404.html').is_file())
error=(root/'404.html').read_text() if (root/'404.html').is_file() else ''
check('404 is noindex','noindex, nofollow' in error)
check('404 has home return','href="./"' in error)
check('Pre-launch checklist exists',(root/'PRE-LAUNCH-CHECKLIST.md').is_file())
check('Domain launch notes exist',(root/'DOMAIN-LAUNCH.md').is_file())
check('No premature CNAME',(root/'CNAME').exists() is False)

# Metadata
check('Open Graph site name','<meta property="og:site_name" content="Sutras by S³">' in html)
check('Open Graph locale','<meta property="og:locale" content="en_ZM">' in html)
check('Twitter title metadata','<meta name="twitter:title"' in html)
check('Twitter description metadata','<meta name="twitter:description"' in html)
check('Twitter image metadata','<meta name="twitter:image"' in html)
ld=soup.find('script',attrs={'type':'application/ld+json'})
try:
    data=json.loads(ld.string)
    check('JSON-LD parses',True)
    graph=data.get('@graph',[])
    check('JSON-LD store + website graph',len(graph)==2 and {x.get('@type') for x in graph}=={'ClothingStore','WebSite'},str([x.get('@type') for x in graph]))
    store=next((x for x in graph if x.get('@type')=='ClothingStore'),{})
    check('Both contact numbers in structured data',len(store.get('contactPoint',[]))==2)
except Exception as e:
    check('JSON-LD parses',False,str(e))

sitemap=(root/'sitemap.xml').read_text()
check('Sitemap lastmod updated','<lastmod>2026-09-08</lastmod>' in sitemap)

# Preserve V24.2 catalogue truth and quick view
blocks=re.split(r'\n\s*\{\n\s*"id":',cat)[1:]
check('12 products remain',len(blocks)==12,str(len(blocks)))
check('Four unavailable remain',sum('"availability": "unavailable"' in b for b in blocks)==4)
check('No false explicit available',sum('"availability": "available"' in b for b in blocks)==0)
check('Quick View logic preserved','function quickViewMarkup(product)' in js and 'data-quick-view' in js)
check('Availability status preserved','function availabilityStatusMarkup' in js and '.availability-status{' in css)

# IDs unique
ids=[tag.get('id') for tag in soup.find_all(id=True)]
dupes=sorted({i for i in ids if ids.count(i)>1})
check('No duplicate HTML IDs',not dupes,repr(dupes))
# Internal anchors resolve to IDs or top.
missing_anchors=[]
for a in soup.find_all('a',href=True):
    href=a['href']
    if href.startswith('#') and len(href)>1 and soup.find(id=href[1:]) is None:
        missing_anchors.append(href)
check('Internal anchors resolve',not missing_anchors,repr(missing_anchors))
# External target blank links secure.
insecure=[]
for a in soup.find_all('a',target='_blank'):
    rel=set(a.get('rel') or [])
    if not {'noopener','noreferrer'}.issubset(rel): insecure.append(a.get('href'))
check('External new-tab links use noopener+noreferrer',not insecure,repr(insecure[:5]))
# Local HTML assets
refs=[]
for attr in ['src','href']:
    for tag in soup.find_all(attrs={attr:True}):
        v=tag.get(attr)
        if not v or v.startswith(('http:','https:','#','mailto:','tel:','data:')): continue
        v=v.split('?')[0]
        if v and not v.startswith('javascript:'): refs.append(v)
missing=[r for r in refs if not (root/r).exists()]
check('HTML local assets exist',not missing,repr(missing[:10]))
# CSS URLs
css_urls=re.findall(r'url\(["\']?([^"\')]+)',css)
missing_css=[]
for u in css_urls:
    if u.startswith(('data:','http:','https:','#')): continue
    target=(root/u).resolve()
    if not target.exists(): missing_css.append(u)
check('CSS local URLs exist',not missing_css,repr(missing_css[:10]))

for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL')+' - '+name+(f' :: {detail}' if detail and not ok else ''))
failed=[x for x in checks if not x[1]]
print(f'V25 static checks: {len(checks)} total, {len(failed)} failed')
if failed:
    raise SystemExit(1)
