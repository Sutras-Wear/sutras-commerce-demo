/* Narrow guest-order RPC client. Never contains an admin key or client-selected price. */
(() => {
 'use strict';
 const c=window.SUTRAS_BACKEND||{};
 async function rpc(name,body){
  let publicKey=String(c.publishableKey||'').startsWith('sb_publishable_');
  if(String(c.publishableKey).startsWith('eyJ')){try{publicKey=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{}}
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url||'') || !publicKey)throw new Error('Checkout is unavailable. Please contact Sutras.');
  const headers={apikey:c.publishableKey,'Content-Type':'application/json'};
  if(c.publishableKey.startsWith('eyJ'))headers.Authorization='Bearer '+c.publishableKey;
  const response=await fetch(c.url+'/rest/v1/'+name,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok){const error=new Error(result?.message||'We could not confirm your order. Please check your submission before retrying.');error.definitive=response.status===400;throw error;}
  if(!result||typeof result.order_number!=='string'||!Array.isArray(result.items)||!['pending','awaiting_payment','paid','cancelled','expired'].includes(result.status))throw new Error('We could not read your order. Please check your submission before retrying.');
  return result;
 }
 window.SutrasOrders=Object.freeze({
  token:()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''),
  create:(token,order)=>rpc('rpc/sutras_create_order',{p_token:token,p_order:order}),
  get:token=>rpc('rpc/sutras_get_order',{p_token:token}),
  cancel:token=>rpc('rpc/sutras_cancel_order',{p_token:token})
 });
})();
