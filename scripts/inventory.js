/* Read-only Supabase Data API client. Inventory is never saved in browser storage. */
(() => {
  'use strict';
  const config = window.SUTRAS_BACKEND || {};
  const products = window.SUTRAS?.products || [];
  const known = new Map(products.map(p => [p.id, p]));
  const allowedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const originals = new Map(products.map(p => [p.id, {name:p.name, cardName:p.cardName, availability:p.availability}]));
  const fields = 'id,sku,name,price_zmw,currency,stock_quantity,reserved_quantity,available_quantity,sizes,availability,low_stock_threshold,checkout_enabled,version,updated_at';
  let status = 'loading', lastSuccess = null, pending = null, timer;
  let fingerprint = '';
  function publish() { window.dispatchEvent(new CustomEvent('sutras:inventory', {detail: {status, lastSuccess}})); }
  function invalidate(next) {
    status = next;
    for (const p of products) {
      p.inventory = null; p.price = null;
      p.availability = originals.get(p.id).availability === 'unavailable' ? 'unavailable' : 'unconfirmed';
    }
    if(fingerprint!==next){fingerprint=next;publish();}
  }
  function validConfig() {
    try {
      const u = new URL(config.url);
      if(u.protocol!=='https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname) || u.username || u.password || u.search || u.hash) return false;
      const key=String(config.publishableKey || '');
      if (key.startsWith('sb_publishable_')) return key.length>20;
      if (!key.startsWith('eyJ')) return false;
      const claim=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      return claim.role==='anon';
    } catch (_) { return false; }
  }
  function validate(row) {
    if(!row || !known.has(row.id)) return false;
    if(typeof row.name!=='string' || !row.name.trim() || row.name.length>180 || typeof row.sku!=='string') throw new Error('Invalid product data');
    for(const k of ['stock_quantity','reserved_quantity','available_quantity','low_stock_threshold'])
      if(!Number.isSafeInteger(row[k]) || row[k]<0) throw new Error('Invalid stock data');
    if(row.available_quantity!==row.stock_quantity-row.reserved_quantity) throw new Error('Invalid stock balance');
    if(row.price_zmw!==null && (typeof row.price_zmw!=='number' || !Number.isFinite(row.price_zmw) || row.price_zmw<0)) throw new Error('Invalid price');
    if(row.currency!=='ZMW' || !Array.isArray(row.sizes) || row.sizes.some(s=>!allowedSizes.includes(s)) || !['unconfirmed','available','unavailable'].includes(row.availability) || typeof row.checkout_enabled!=='boolean') throw new Error('Invalid catalogue data');
    return true;
  }
  async function read() {
    if(!validConfig()){invalidate('unconfigured');return;}
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),8000);
    try {
      const headers={apikey:config.publishableKey, Accept:'application/json'};
      // New publishable keys belong in apikey only; legacy anon JWTs also use Bearer.
      if(config.publishableKey.startsWith('eyJ')) headers.Authorization=`Bearer ${config.publishableKey}`;
      const response=await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/sutras_products?select=${fields}&order=id`,{headers,cache:'no-store',signal:controller.signal});
      if(!response.ok) throw new Error('Inventory unavailable');
      const rows=await response.json();
      if(!Array.isArray(rows) || rows.length>1000) throw new Error('Invalid inventory response');
      const records=new Map();
      for(const row of rows)if(validate(row)){if(records.has(row.id))throw new Error('Duplicate product');records.set(row.id,row);}
      const next=JSON.stringify(rows); status='ready';lastSuccess=new Date().toISOString();
      for(const p of products){
        const row=records.get(p.id);
        p.inventory=row ? Object.freeze({...row,sizes:Object.freeze([...row.sizes])}) : null;
        p.price=row?.price_zmw ?? null;
        if(row){p.name=row.name;p.cardName=row.name===originals.get(p.id).name ? originals.get(p.id).cardName : row.name;}
        p.availability=!row ? 'unavailable' : row.availability==='unconfirmed' ? 'unconfirmed' : row.availability==='unavailable' ? 'unavailable' : row.available_quantity===0 ? 'sold-out' : row.available_quantity<=row.low_stock_threshold ? 'low' : 'available';
      }
      if(next!==fingerprint){fingerprint=next;publish();}
    } catch (_) { invalidate('offline'); }
    finally {clearTimeout(timeout);}
  }
  function refresh(){if(!pending)pending=read().finally(()=>{pending=null;});return pending;}
  function schedule(){clearTimeout(timer);timer=setTimeout(async()=>{if(!document.hidden)await refresh();schedule();},Math.max(1000,Number(config.pollIntervalMs)||15000));}
  window.SutrasInventory=Object.freeze({refresh,get status(){return status;},get lastSuccess(){return lastSuccess;},get(id){return known.get(id)?.inventory||null;}});
  invalidate(validConfig()?'loading':'unconfigured');
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
  window.addEventListener('online',()=>void refresh());
  window.addEventListener('offline',()=>invalidate('offline'));
  window.addEventListener('pageshow',()=>void refresh());
  void refresh();schedule();
})();
