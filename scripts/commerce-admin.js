(() => {
  'use strict';
  const catalog = window.SUTRAS?.products || [];
  const commerce = window.SutrasCommerce;
  if (!catalog.length || !commerce) return;
  const byId = Object.fromEntries(catalog.map(product => [product.id, product]));
  const body = document.getElementById('inventory-body');
  const ordersLedger = document.getElementById('orders-ledger');
  const movementLedger = document.getElementById('movement-ledger');
  const money = value => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 2 }).format(value || 0).replace('ZMW', 'K').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  commerce.ensureProducts(catalog);
  commerce.cleanupExpiredReservations();

  function renderStats() {
    const stats = commerce.stats();
    document.getElementById('stat-live').textContent = stats.liveProducts;
    document.getElementById('stat-onhand').textContent = stats.onHand;
    document.getElementById('stat-reserved').textContent = stats.reserved;
    document.getElementById('stat-orders').textContent = stats.paidOrders;
    document.getElementById('stat-revenue').textContent = money(stats.revenue);
  }

  function renderInventory() {
    const state = commerce.snapshot();
    body.innerHTML = catalog.map(product => {
      const inv = state.products[product.id] || commerce.productState(product.id, state);
      const available = commerce.availableStock(product.id, state);
      return `<tr data-row="${esc(product.id)}">
        <td><div class="product-cell"><img src="${esc(product.image)}" alt=""><div><strong>${esc(product.cardName || product.name)}</strong><small>${esc(product.category)}</small></div></div></td>
        <td><label class="toggle"><input type="checkbox" data-field="enabled" ${inv.enabled ? 'checked' : ''}><span>${inv.enabled ? 'Yes' : 'No'}</span></label></td>
        <td><input class="table-input" data-field="sku" value="${esc(inv.sku)}" aria-label="SKU for ${esc(product.cardName || product.name)}"></td>
        <td><input class="table-input" data-field="price" type="number" min="0" step="0.01" value="${inv.price ?? ''}" placeholder="—" aria-label="Price for ${esc(product.cardName || product.name)}"></td>
        <td><strong>${inv.onHand}</strong></td>
        <td>${inv.reserved}</td>
        <td><strong>${available}</strong></td>
        <td><input class="table-input stock-input" data-field="lowStockAt" type="number" min="1" step="1" value="${inv.lowStockAt}" aria-label="Low stock threshold for ${esc(product.cardName || product.name)}"></td>
        <td><div class="adjust-wrap"><input class="table-input stock-input" data-adjust-value type="number" step="1" placeholder="±"><button class="adjust-button" type="button" data-adjust>Apply</button></div></td>
        <td><button class="save-product" type="button" data-save>Save</button></td>
      </tr>`;
    }).join('');
  }

  function renderLedgers() {
    const state = commerce.snapshot();
    const orders = [...state.orders].reverse();
    ordersLedger.innerHTML = orders.length ? orders.map(order => `<div class="ledger-row"><time>${new Date(order.paidAt).toLocaleString()}</time><span><strong>${esc(order.id)}</strong> · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · ${esc(order.customer?.name || 'Test customer')}</span><strong>${money(order.total)}</strong></div>`).join('') : '<p class="ledger-empty">No paid test orders yet.</p>';
    const movements = [...state.movements].slice(-30).reverse();
    movementLedger.innerHTML = movements.length ? movements.map(move => {
      const product = move.productId ? byId[move.productId] : null;
      return `<div class="ledger-row"><time>${new Date(move.createdAt).toLocaleString()}</time><span><strong>${esc(move.type)}</strong>${product ? ` · ${esc(product.cardName || product.name)}` : ''}<br>${esc(move.note || '')}</span><strong>${move.delta ? (move.delta > 0 ? `+${move.delta}` : move.delta) : '—'}</strong></div>`;
    }).join('') : '<p class="ledger-empty">No stock movements yet.</p>';
  }

  function render() { renderStats(); renderInventory(); renderLedgers(); }

  body.addEventListener('change', event => {
    if (event.target.matches('[data-field="enabled"]')) {
      const row = event.target.closest('[data-row]');
      const label = event.target.nextElementSibling;
      if (label) label.textContent = event.target.checked ? 'Yes' : 'No';
      row.dataset.dirty = 'true';
    }
  });

  body.addEventListener('click', event => {
    const row = event.target.closest('[data-row]');
    if (!row) return;
    const productId = row.dataset.row;
    if (event.target.closest('[data-save]')) {
      const enabled = row.querySelector('[data-field="enabled"]').checked;
      const sku = row.querySelector('[data-field="sku"]').value.trim();
      const priceRaw = row.querySelector('[data-field="price"]').value;
      const lowStockAt = row.querySelector('[data-field="lowStockAt"]').value;
      if (enabled && priceRaw === '') { alert('Set a test price before enabling checkout for this product.'); return; }
      commerce.updateProduct(productId, { enabled, sku, price: priceRaw === '' ? null : Number(priceRaw), lowStockAt: Number(lowStockAt) || 5 }, 'Saved from V26 Inventory Admin');
      render();
      return;
    }
    if (event.target.closest('[data-adjust]')) {
      const input = row.querySelector('[data-adjust-value]');
      const delta = Number(input.value);
      if (!Number.isInteger(delta) || delta === 0) { alert('Enter a whole number such as 60, 10, -1, or -5.'); return; }
      try {
        commerce.adjustStock(productId, delta, 'Manual V26 admin stock adjustment');
        render();
      } catch (error) { alert(error.message); }
    }
  });

  document.getElementById('load-demo').addEventListener('click', () => {
    if (!confirm('Load clearly-labelled TEST values? Navy will start at K700 / 60 units, Green K650 / 24 units, and Yellow K400 / 8 units.')) return;
    commerce.demoScenario(catalog);
    render();
  });
  document.getElementById('reset-demo').addEventListener('click', () => {
    if (!confirm('Reset all V26 local test prices, stock, cart, reservations, orders and movements?')) return;
    commerce.resetState();
    commerce.ensureProducts(catalog);
    render();
  });

  window.addEventListener('storage', render);
  render();
})();
