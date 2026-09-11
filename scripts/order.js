(() => {
 'use strict';
 const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('en-ZM',{style:'currency',currency:'ZMW'}).format(n);
 let token=location.hash.slice(1),busy=false;
 if(!/^[a-f0-9]{64}$/.test(token)){try{token=sessionStorage.getItem('sutras-receipt-token')||'';}catch{}}
 if(/^[a-f0-9]{64}$/.test(token)){try{sessionStorage.setItem('sutras-receipt-token',token);}catch{}}
 const labels={pending:'Pending',awaiting_payment:'Awaiting payment — no payment received',paid:'Paid',cancelled:'Cancelled',expired:'Expired'};
 function render(order){
  $('receipt').hidden=false;$('order-title').textContent=order.order_number;$('receipt-status').textContent=labels[order.status];
  $('receipt-items').replaceChildren(...order.items.map(i=>{const li=document.createElement('li'),title=document.createElement('strong'),details=document.createElement('small');title.textContent=i.name;details.textContent=`${i.sku} · Size ${i.size} · Qty ${i.quantity} · ${money(i.unit_price_zmw)} each · ${money(i.line_total)}`;li.append(title,details);return li;}));
  $('receipt-total').textContent=money(order.items_total);$('receipt-fulfilment').textContent=order.fulfilment==='delivery'?'Delivery requested':'Collection in Lusaka';
  const active=['pending','awaiting_payment'].includes(order.status);
  $('receipt-expiry').textContent=active?`Stock held until ${new Date(order.expires_at).toLocaleString()}. Unpaid orders expire automatically.`:['expired','cancelled'].includes(order.status)?'The stock hold has been released.':'';
  $('cancel-order').hidden=!active;
  $('order-help').href='https://wa.me/260978865604?text='+encodeURIComponent(`Hi Sutras by S³! Please help me with order ${order.order_number}.`);
  $('receipt-message').textContent='';
 }
 async function refresh(cancel=false){
  if(busy)return;
  if(!/^[a-f0-9]{64}$/.test(token)){$('order-title').textContent='Private order link required';$('receipt-message').textContent='Open the confirmation link from your checkout, or contact Sutras for help.';return;}
  busy=true;$('refresh-order').disabled=true;$('cancel-order').disabled=true;
  try{render(await window.SutrasOrders[cancel?'cancel':'get'](token));}
  catch(e){$('receipt-message').textContent='Unable to confirm current order status. '+e.message;}
  finally{busy=false;$('refresh-order').disabled=false;$('cancel-order').disabled=false;}
 }
 $('refresh-order').addEventListener('click',()=>refresh());
 $('cancel-order').addEventListener('click',()=>{if(confirm('Cancel this unpaid order and release its stock hold?'))void refresh(true);});
 setInterval(()=>{if(!document.hidden)void refresh();},15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
 void refresh();
})();
