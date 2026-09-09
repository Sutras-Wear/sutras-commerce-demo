(() => {
  'use strict';
  const catalog = window.SUTRAS?.products || [];
  const commerce = window.SutrasCommerce;
  if (!catalog.length || !commerce) return;
  const byId = Object.fromEntries(catalog.map(product => [product.id, product]));
  const sizes = ['Not sure', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const productRoot = document.getElementById('commerce-products');
  const cartRoot = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const checkoutLink = document.getElementById('checkout-link');

  const money = value => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 2 }).format(value || 0).replace('ZMW', 'K').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  commerce.ensureProducts(catalog);
  commerce.cleanupExpiredReservations();

  function renderProducts() {
    const state = commerce.snapshot();
    productRoot.innerHTML = catalog.map((product, index) => {
      const inv = state.products[product.id] || {};
      const status = commerce.statusFor(product.id, state);
      const available = commerce.availableStock(product.id, state);
      const live = Boolean(inv.enabled && typeof inv.price === 'number');
      const disabled = !live || available <= 0;
      return `<article class="commerce-card ${live ? '' : 'not-live'}" data-product-card="${esc(product.id)}">
        <div class="card-image"><img src="${esc(product.image)}" alt="${esc(product.imageAlt)}" loading="lazy" decoding="async"><span class="card-number">${String(index + 1).padStart(2, '0')}</span></div>
        <div class="card-copy">
          <div class="card-category">${esc(product.category)}</div>
          <h3>${esc(product.cardName || product.name)}</h3>
          <div class="card-meta"><span class="price">${live ? money(inv.price) : 'Price not set'}</span><span class="stock ${esc(status.key)}">${esc(status.label)}</span></div>
          <div class="card-controls">
            <select aria-label="Choose size for ${esc(product.cardName || product.name)}" data-size>${sizes.map(size => `<option>${esc(size)}</option>`).join('')}</select>
            <input aria-label="Quantity for ${esc(product.cardName || product.name)}" data-quantity type="number" min="1" max="${Math.max(1, Math.min(commerce.MAX_CART_QTY, available || 1))}" value="1" inputmode="numeric">
          </div>
          <div class="add-row">
            <button class="primary-button" type="button" data-add="${esc(product.id)}" ${disabled ? 'disabled' : ''}>${available <= 0 && live ? 'Sold out' : live ? 'Add to bag' : 'Not ready for checkout'}</button>
            <a class="help-link" aria-label="Ask Sutras about ${esc(product.cardName || product.name)} on WhatsApp" href="https://wa.me/260978865604?text=${encodeURIComponent(`Hi Sutras! I have a question about the ${product.cardName || product.name}.`)}" target="_blank" rel="noopener noreferrer">?</a>
          </div>
        </div>
      </article>`;
    }).join('');

    if (!Object.values(state.products).some(item => item.enabled && typeof item.price === 'number')) {
      productRoot.insertAdjacentHTML('afterbegin', `<div class="setup-empty"><h3>Nothing is enabled for test checkout yet.</h3><p>Open the Inventory Admin and enter test stock/prices, or use the one-click demo scenario. The public V25 website stays untouched.</p><a class="head-link" href="admin-preview.html">Open Inventory Admin →</a></div>`);
    }
  }

  function renderCart() {
    const summary = commerce.cartSummary(byId);
    const totalQty = summary.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `${totalQty} ${totalQty === 1 ? 'ITEM' : 'ITEMS'}`;
    cartTotal.textContent = money(summary.total);
    checkoutLink.style.pointerEvents = summary.items.length ? 'auto' : 'none';
    checkoutLink.style.opacity = summary.items.length ? '1' : '.42';
    if (!summary.items.length) {
      cartRoot.innerHTML = '<p class="empty-cart">Your test shopping bag is empty.</p>';
      return;
    }
    cartRoot.innerHTML = summary.items.map(item => {
      const product = item.catalog;
      const stockWarning = item.quantity > item.available ? `<p style="color:#95533c">Only ${item.available} currently available.</p>` : '';
      return `<div class="cart-item" data-cart-item="${esc(item.productId)}" data-size="${esc(item.size)}">
        <img src="${esc(product?.image || '')}" alt="">
        <div><h3>${esc(product?.cardName || item.productId)}</h3><p>Size: ${esc(item.size)} · ${item.inventory?.price !== null ? money(item.inventory.price) : 'No price'}</p>${stockWarning}
          <div class="cart-item-bottom"><input type="number" min="1" max="${commerce.MAX_CART_QTY}" value="${item.quantity}" aria-label="Quantity for ${esc(product?.cardName || item.productId)}" data-cart-qty><button class="remove" type="button" data-remove>Remove</button></div>
        </div>
      </div>`;
    }).join('');
  }

  productRoot.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const card = button.closest('[data-product-card]');
    const productId = button.dataset.add;
    const size = card.querySelector('[data-size]').value;
    const quantity = Math.max(1, Math.min(commerce.MAX_CART_QTY, Number(card.querySelector('[data-quantity]').value) || 1));
    const available = commerce.availableStock(productId);
    const existing = commerce.loadCart().filter(item => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0);
    if (existing + quantity > available) {
      alert(`Only ${available} of this test product are currently available.`);
      return;
    }
    commerce.addCartItem(productId, quantity, size);
    renderCart();
    button.textContent = 'Added ✓';
    setTimeout(() => { button.textContent = 'Add to bag'; }, 1200);
  });

  cartRoot.addEventListener('change', event => {
    const qty = event.target.closest('[data-cart-qty]');
    if (!qty) return;
    const row = qty.closest('[data-cart-item]');
    const value = Math.max(1, Math.min(commerce.MAX_CART_QTY, Number(qty.value) || 1));
    commerce.setCartItem(row.dataset.cartItem, value, row.dataset.size);
    renderCart();
  });
  cartRoot.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    if (!remove) return;
    const row = remove.closest('[data-cart-item]');
    commerce.setCartItem(row.dataset.cartItem, 0, row.dataset.size);
    renderCart();
  });

  window.addEventListener('storage', () => { renderProducts(); renderCart(); });
  renderProducts();
  renderCart();
})();
