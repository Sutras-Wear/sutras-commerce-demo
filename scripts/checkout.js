/* Customer selection review only. No order, inventory or payment engine. */
(() => {
  'use strict';
  const key = 'sutras-demo-v26-1-enquiry-bag-v1'; // Preserve V26.1 saved bags.
  const products = new Map((window.SUTRAS?.products || []).map(p => [p.id, p]));
  const sizes = ['Not sure', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    let saved, unavailable = false;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { unavailable = true; }
    const raw = Array.isArray(saved?.items) ? saved.items.slice(0, 50) : [];
    const items = raw.filter(i => i && products.has(i.id) && sizes.includes(i.size) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 10);
    const note = items.length && typeof saved?.note === 'string' ? saved.note.slice(0, 500) : '';
    document.getElementById('summary-items').innerHTML = items.length ? items.map(i => {
      const p = products.get(i.id);
      return `<div class="summary-item"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name)}"><div><strong>${esc(p.cardName || p.name)}</strong><small>Size preference: ${esc(i.size)} · Qty ${i.quantity}</small></div></div>`;
    }).join('') : '<p class="empty-cart">Your shopping bag is empty. <a href="index.html#collection">Explore the collection</a> to find your next favourite.</p>';
    document.getElementById('selection-status').textContent = unavailable ? 'Your saved bag could not be read in this browser. Return to the collection or ask us for help.' : raw.length !== items.length ? 'Some saved pieces are no longer available. Please review your bag.' : 'Prices and availability are confirmed before ordering.';
    const noteNode = document.getElementById('selection-note');
    noteNode.hidden = !note; noteNode.textContent = note ? `Your note: ${note}` : '';
    const lines = items.map((i,n) => `${n+1}. ${products.get(i.id).name} — Size preference: ${i.size}; Qty: ${i.quantity}`);
    const message = ['Hi Sutras by S³! I need help with my shopping bag.', ...lines, note ? `My note: ${note}` : '', 'Please help me with availability, sizing or delivery. This is a support enquiry, not an order.'].filter(Boolean).join('\n\n');
    document.getElementById('checkout-help').href = `https://wa.me/260978865604?text=${encodeURIComponent(message)}`;
    document.getElementById('checkout-help-alt').href = `https://wa.me/260973668415?text=${encodeURIComponent(message)}`;
  }
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
  render();
})();
