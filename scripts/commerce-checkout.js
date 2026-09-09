(() => {
  'use strict';
  const catalog = window.SUTRAS?.products || [];
  const commerce = window.SutrasCommerce;
  if (!catalog.length || !commerce) return;
  const byId = Object.fromEntries(catalog.map(product => [product.id, product]));
  const form = document.getElementById('checkout-form');
  const summaryItems = document.getElementById('summary-items');
  const summaryTotal = document.getElementById('summary-total');
  const paymentSim = document.getElementById('payment-sim');
  const reservationStatus = document.getElementById('reservation-status');
  const result = document.getElementById('checkout-result');
  const reserveButton = document.getElementById('reserve-button');
  let reservationId = null;
  const CHECKOUT_PREFILL_KEY = 'sutras-demo-v26-1-checkout-prefill-v1';
  const ENQUIRY_BAG_KEY = 'sutras-demo-v26-1-enquiry-bag-v1';
  const fromEnquiryBag = new URLSearchParams(window.location.search).get('source') === 'enquiry-bag';
  const money = value => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 2 }).format(value || 0).replace('ZMW', 'K').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  commerce.ensureProducts(catalog);
  commerce.cleanupExpiredReservations();

  if (fromEnquiryBag) {
    const backHref = 'index.html?bag=open';
    const back = document.getElementById('checkout-back-link');
    const returnLink = document.getElementById('checkout-return-link');
    const wordmark = document.getElementById('checkout-wordmark');
    if (back) { back.href = backHref; back.textContent = 'Back to your bag'; }
    if (returnLink) { returnLink.href = backHref; returnLink.textContent = '← Return to your bag'; }
    if (wordmark) wordmark.href = 'index.html';
    try {
      const prefill = JSON.parse(localStorage.getItem(CHECKOUT_PREFILL_KEY) || 'null');
      if (prefill?.source === 'enquiry-bag' && typeof prefill.note === 'string') {
        const note = document.getElementById('order-note');
        if (note && !note.value) note.value = prefill.note.slice(0, 300);
      }
    } catch (_) {}
  }

  function summary() { return commerce.cartSummary(byId); }
  function renderSummary() {
    const data = summary();
    if (!data.items.length) {
      summaryItems.innerHTML = '<p class="empty-cart">Your test bag is empty. Return to the test store first.</p>';
      summaryTotal.textContent = money(0);
      reserveButton.disabled = true;
      return;
    }
    summaryItems.innerHTML = data.items.map(item => `<div class="summary-item"><img src="${esc(item.catalog?.image || '')}" alt=""><div><strong>${esc(item.catalog?.cardName || item.productId)}</strong><small>Size ${esc(item.size)} · Qty ${item.quantity}</small></div><span>${money(item.subtotal || 0)}</span></div>`).join('');
    summaryTotal.textContent = money(data.total);
    const invalid = data.items.some(item => !item.inventory?.enabled || item.inventory?.price === null || item.quantity > item.available);
    reserveButton.disabled = invalid;
    if (invalid) reservationStatus.textContent = 'The bag needs attention because price or available stock changed.';
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (reservationId) return;
    const data = summary();
    const fd = new FormData(form);
    try {
      const reservation = commerce.createReservation(data.items.map(item => ({ productId: item.productId, quantity: item.quantity, size: item.size })), {
        name: fd.get('name'), phone: fd.get('phone'), fulfilment: `${fd.get('fulfilment')}${fd.get('location') ? ` · ${fd.get('location')}` : ''}`, note: fd.get('note')
      });
      reservationId = reservation.id;
      reserveButton.disabled = true;
      paymentSim.hidden = false;
      reservationStatus.textContent = `Reserved until ${new Date(reservation.expiresAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Available stock has already moved down, but on-hand stock has not.`;
      result.innerHTML = `<div class="result-box">Reservation <strong>${esc(reservation.id)}</strong> created. Test total: <strong>${money(reservation.total)}</strong>.</div>`;
    } catch (error) {
      result.innerHTML = `<div class="result-box bad"><strong>Could not reserve stock:</strong> ${esc(error.message)}</div>`;
      renderSummary();
    }
  });

  document.getElementById('simulate-success').addEventListener('click', () => {
    if (!reservationId) return;
    try {
      const before = commerce.snapshot();
      const reservation = before.reservations[reservationId];
      const beforeLines = reservation.items.map(item => `${byId[item.productId]?.cardName || item.productId}: ${before.products[item.productId].onHand}`).join(' · ');
      const order = commerce.commitReservation(reservationId, { provider: 'V26 simulator', reference: `SIM-${Date.now()}` });
      const after = commerce.snapshot();
      const afterLines = order.items.map(item => `${byId[item.productId]?.cardName || item.productId}: ${after.products[item.productId].onHand}`).join(' · ');
      commerce.saveCart([]);
      if (fromEnquiryBag) {
        try {
          localStorage.removeItem(ENQUIRY_BAG_KEY);
          localStorage.removeItem(CHECKOUT_PREFILL_KEY);
        } catch (_) {}
      }
      paymentSim.hidden = true;
      reservationStatus.textContent = 'Payment marked successful. Reservation became a paid order and stock was permanently reduced exactly once.';
      result.innerHTML = `<div class="result-box good"><strong>TEST PAYMENT SUCCESSFUL ✓</strong><br>Order ${esc(order.id)} · ${money(order.total)}<br><br><strong>On-hand stock:</strong><br>${esc(beforeLines)} → ${esc(afterLines)}<br><br>Pressing the successful-payment handler again would return the existing order instead of reducing stock twice.</div>`;
      renderSummary();
    } catch (error) { result.innerHTML = `<div class="result-box bad">${esc(error.message)}</div>`; }
  });

  document.getElementById('simulate-fail').addEventListener('click', () => {
    if (!reservationId) return;
    try {
      commerce.releaseReservation(reservationId, 'Simulated failed/cancelled payment');
      paymentSim.hidden = true;
      reservationStatus.textContent = 'Payment failed/cancelled. Reserved units were released back to available stock. On-hand stock did not change.';
      result.innerHTML = '<div class="result-box bad"><strong>TEST PAYMENT CANCELLED.</strong><br>No sale was recorded and the reservation was released.</div>';
      reservationId = null;
      reserveButton.disabled = false;
      renderSummary();
    } catch (error) { result.innerHTML = `<div class="result-box bad">${esc(error.message)}</div>`; }
  });

  renderSummary();
})();
