/* Checkout sends contact details and product/size/quantity only. Database controls price and stock. */
(() => {
  'use strict';
  const key = 'sutras-demo-v26-1-enquiry-bag-v1'; // Preserve V26.1 saved bags.
  const products = new Map((window.SUTRAS?.products || []).map(p => [p.id, p]));
  const sizes = ['Not sure', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat('en-ZM',{style:'currency',currency:'ZMW',maximumFractionDigits:2}).format(value);
  let currentItems=[],submitting=false,noteInitialized=false;
  function render() {
    let saved, unavailable = false;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { unavailable = true; }
    const raw = Array.isArray(saved?.items) ? saved.items.slice(0, 50) : [];
    const items = raw.filter(i => i && products.has(i.id) && sizes.includes(i.size) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 10);
    const note = items.length && typeof saved?.note === 'string' ? saved.note.slice(0, 500) : '';
    currentItems=items;
    if(!noteInitialized){document.getElementById('customer-note').value=note;noteInitialized=true;}
    document.getElementById('summary-items').innerHTML = items.length ? items.map(i => {
      const p = products.get(i.id);
      const inv=p.inventory;
      const totalQty=items.filter(item=>item.id===i.id).reduce((n,item)=>n+item.quantity,0);
      const issue=['sold-out','unavailable'].includes(p.availability) ? 'Currently unavailable — please review your bag.' : inv?.sizes.length && i.size!=='Not sure' && !inv.sizes.includes(i.size) ? 'Size no longer available — please choose another.' : inv?.availability==='available' && totalQty>inv.available_quantity ? `Only ${inv.available_quantity} available — please adjust your bag.` : '';
      const stock=inv?.availability==='available' ? `${inv.available_quantity} available` : 'Availability to confirm';
      return `<div class="summary-item"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name)}"><div><strong>${esc(p.cardName || p.name)}</strong><small>Size preference: ${esc(i.size)} · Qty ${i.quantity}</small><small>${Number.isFinite(p.price)?esc(money(p.price*i.quantity)):'Price to be confirmed'} · ${esc(stock)}</small>${issue?`<small role="status">${esc(issue)}</small>`:''}</div></div>`;
    }).join('') : '<p class="empty-cart">Your shopping bag is empty. <a href="index.html#collection">Explore the collection</a> to find your next favourite.</p>';
    document.getElementById('selection-status').textContent = unavailable ? 'Your saved bag could not be read in this browser. Return to the collection or ask us for help.' : raw.length !== items.length ? 'Some saved pieces are no longer available. Please review your bag.' : 'Prices and availability are confirmed before ordering.';
    const ready=window.SutrasInventory?.status==='ready';
    if(!unavailable && !ready)document.getElementById('selection-status').textContent='Current prices and availability could not be confirmed. Please try again or ask us for help.';
    else if(ready && !unavailable && raw.length===items.length)document.getElementById('selection-status').textContent='Availability can change until your order reserves stock. Online payment remains unavailable.';
    const eligible=ready&&!unavailable&&items.length>0&&raw.length===items.length&&items.every(i=>{
      const inv=products.get(i.id).inventory;
      return inv?.checkout_enabled&&inv.availability==='available'&&Number.isFinite(inv.price_zmw)&&inv.sizes.includes(i.size)&&items.filter(x=>x.id===i.id).reduce((n,x)=>n+x.quantity,0)<=inv.available_quantity;
    });
    document.getElementById('place-order').disabled=submitting||!eligible;
    document.getElementById('checkout-eligibility').textContent=eligible?'Your selected pieces are ready to order. Stock is held for 15 minutes after submission.':'Ordering is unavailable for this selection. Confirmed prices, sizes and stock are needed before a piece can be ordered. You can continue browsing or ask us for help.';
    document.getElementById('checkout-subtotal').textContent=items.length && ready && items.every(i=>Number.isFinite(products.get(i.id).price)) ? money(items.reduce((n,i)=>n+products.get(i.id).price*i.quantity,0)) : 'To be confirmed';
    const noteNode = document.getElementById('selection-note');
    noteNode.hidden = !note; noteNode.textContent = note ? `Your note: ${note}` : '';
    const lines = items.map((i,n) => `${n+1}. ${products.get(i.id).name} — Size preference: ${i.size}; Qty: ${i.quantity}`);
    const message = ['Hi Sutras by S³! I need help with my shopping bag.', ...lines, note ? `My note: ${note}` : '', 'Please help me with availability, sizing or delivery. This is a support enquiry, not an order.'].filter(Boolean).join('\n\n');
    document.getElementById('checkout-help').href = `https://wa.me/260978865604?text=${encodeURIComponent(message)}`;
    document.getElementById('checkout-help-alt').href = `https://wa.me/260973668415?text=${encodeURIComponent(message)}`;
  }
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
  window.addEventListener('sutras:inventory',render);
  const method=document.getElementById('fulfilment'),address=document.getElementById('delivery-details');
  method.addEventListener('change',()=>{const delivery=method.value==='delivery';document.getElementById('delivery-field').hidden=!delivery;address.disabled=!delivery;address.required=delivery;});
  const errorNode=document.getElementById('order-error'),recovery=document.getElementById('recover-order');
  try{const pending=JSON.parse(sessionStorage.getItem('sutras-checkout-pending'));if(pending?.token){recovery.href='order.html#'+pending.token;recovery.hidden=false;}}catch{}
  document.getElementById('order-form').addEventListener('submit',async event=>{
    event.preventDefault();if(submitting||document.getElementById('place-order').disabled)return;
    submitting=true;render();errorNode.hidden=true;
    let token;
    try{
      const form=event.currentTarget,values=new FormData(form);
      const order={full_name:values.get('full_name').trim(),phone:values.get('phone').trim(),email:values.get('email').trim(),fulfilment:method.value,delivery_details:method.value==='delivery'?address.value.trim():'',customer_note:values.get('customer_note').trim(),items:currentItems.map(i=>({product_id:i.id,size:i.size,quantity:i.quantity}))};
      const encoded=JSON.stringify(order),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded))),n=>n.toString(16).padStart(2,'0')).join('');
      let pending;try{pending=JSON.parse(sessionStorage.getItem('sutras-checkout-pending'));}catch{}
      if(pending?.token&&pending.hash!==digest){
        try{await window.SutrasOrders.get(pending.token);location.href='order.html#'+pending.token;return;}catch(e){if(!e.definitive)throw e;sessionStorage.removeItem('sutras-checkout-pending');pending=null;}
      }
      token=pending?.token||window.SutrasOrders.token();
      // Persist the retry identity before any request. Never store customer details here.
      sessionStorage.setItem('sutras-checkout-pending',JSON.stringify({token,hash:digest}));
      sessionStorage.setItem('sutras-receipt-token',token);
      recovery.href='order.html#'+token;recovery.hidden=false;
      const originalBag=localStorage.getItem(key),receipt=await window.SutrasOrders.create(token,order);
      sessionStorage.removeItem('sutras-checkout-pending');
      if(['pending','awaiting_payment'].includes(receipt.status)&&localStorage.getItem(key)===originalBag)localStorage.removeItem(key);
      location.href='order.html#'+token;
    }catch(e){
      if(e.definitive){try{sessionStorage.removeItem('sutras-checkout-pending');}catch{}recovery.hidden=true;}
      errorNode.textContent=e.message||'Checkout could not be completed. Check your previous submission before retrying.';errorNode.hidden=false;
      void window.SutrasInventory?.refresh();
    }finally{submitting=false;render();}
  });
  render();
})();
