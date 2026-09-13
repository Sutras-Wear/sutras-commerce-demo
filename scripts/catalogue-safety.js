(() => {
  'use strict';
  const s=window.SutrasSecurity,c=window.SUTRAS;
  if(!s || !Array.isArray(c?.products))return;
  const fields=['name','cardName','category','color','imageAlt','description','detail','setContents','photoNote','productType','imageKind'];
  c.products=c.products.filter(p=>p && typeof p.id==='string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(p.id) && !p.id.startsWith('v29-qa-'));
  for(const p of c.products){
    for(const key of fields)p[key]=typeof p[key]==='string'?s.text(p[key]).slice(0,3000):'';
    p.pieces=Number.isSafeInteger(p.pieces)&&p.pieces>=1&&p.pieces<=10?p.pieces:1;
    p.image=s.imageURL(p.image);
    p.gallery=Array.isArray(p.gallery)?p.gallery.filter(g=>g&&typeof g==='object').slice(0,30).map(g=>({src:s.imageURL(g.src),alt:s.text(g.alt).slice(0,500),label:s.text(g.label).slice(0,100),caption:s.text(g.caption).slice(0,1000),kind:['ai-model','ai-detail','store-photo','style-preview'].includes(g.kind)?g.kind:'store-photo'})):[];
  }
})();
