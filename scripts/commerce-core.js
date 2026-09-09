/* Sutras V26 Commerce Lab — local preview engine only. No real payments or production inventory. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SutrasCommerce = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'sutras-demo-v26-1-commerce-preview-v1';
  const CART_KEY = 'sutras-demo-v26-1-commerce-cart-v1';
  const SCHEMA_VERSION = 1;
  const RESERVATION_TTL_MS = 15 * 60 * 1000;
  const MAX_CART_QTY = 10;
  let memoryState = null;
  let memoryCart = [];

  function nowIso() { return new Date().toISOString(); }
  function id(prefix) {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${random}`;
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function toMoney(value) {
    if (value === null || value === '' || typeof value === 'undefined') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : null;
  }
  function toCount(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
  }
  function storage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const key = 'sutras-demo-v26-1-storage-probe';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return localStorage;
      }
    } catch (_) {}
    return null;
  }
  function blankState() {
    return {
      version: SCHEMA_VERSION,
      updatedAt: nowIso(),
      products: {},
      reservations: {},
      orders: [],
      movements: []
    };
  }
  function normalizeProduct(entry = {}) {
    return {
      enabled: Boolean(entry.enabled),
      sku: String(entry.sku || ''),
      price: toMoney(entry.price),
      onHand: toCount(entry.onHand),
      reserved: toCount(entry.reserved),
      lowStockAt: Math.max(1, toCount(entry.lowStockAt, 5)),
      updatedAt: entry.updatedAt || nowIso()
    };
  }
  function normalizeState(raw) {
    const state = raw && typeof raw === 'object' ? raw : blankState();
    state.version = SCHEMA_VERSION;
    state.updatedAt = state.updatedAt || nowIso();
    state.products = state.products && typeof state.products === 'object' ? state.products : {};
    Object.keys(state.products).forEach(key => { state.products[key] = normalizeProduct(state.products[key]); });
    state.reservations = state.reservations && typeof state.reservations === 'object' ? state.reservations : {};
    state.orders = Array.isArray(state.orders) ? state.orders : [];
    state.movements = Array.isArray(state.movements) ? state.movements.slice(-500) : [];
    return state;
  }
  function loadState() {
    const store = storage();
    if (store) {
      try { return normalizeState(JSON.parse(store.getItem(STORAGE_KEY) || 'null')); } catch (_) {}
    }
    if (!memoryState) memoryState = blankState();
    return normalizeState(clone(memoryState));
  }
  function saveState(state) {
    state.updatedAt = nowIso();
    const normalized = normalizeState(state);
    const store = storage();
    if (store) {
      store.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } else {
      memoryState = clone(normalized);
    }
    return clone(normalized);
  }
  function resetState() {
    const state = blankState();
    const store = storage();
    if (store) store.setItem(STORAGE_KEY, JSON.stringify(state));
    else memoryState = clone(state);
    saveCart([]);
    return clone(state);
  }
  function ensureProducts(catalogProducts = []) {
    const state = loadState();
    catalogProducts.forEach((product, index) => {
      if (!product || !product.id) return;
      if (!state.products[product.id]) {
        state.products[product.id] = normalizeProduct({
          enabled: false,
          sku: `S3-${String(index + 1).padStart(3, '0')}`,
          price: null,
          onHand: 0,
          reserved: 0,
          lowStockAt: 5
        });
      }
    });
    return saveState(state);
  }
  function productState(productId, state = loadState()) {
    return state.products[productId] ? clone(state.products[productId]) : normalizeProduct();
  }
  function availableStock(productId, state = loadState()) {
    const product = state.products[productId];
    if (!product) return 0;
    return Math.max(0, toCount(product.onHand) - toCount(product.reserved));
  }
  function statusFor(productId, state = loadState()) {
    const product = state.products[productId];
    if (!product || !product.enabled || product.price === null) return { key: 'not-configured', label: 'Not configured for checkout' };
    const available = availableStock(productId, state);
    if (available <= 0) return { key: 'sold-out', label: 'Sold out' };
    if (available <= product.lowStockAt) return { key: 'low', label: `${available} left` };
    return { key: 'available', label: `${available} in stock` };
  }
  function updateProduct(productId, patch = {}, reason = 'Admin configuration') {
    const state = loadState();
    const current = state.products[productId] || normalizeProduct();
    const next = normalizeProduct({ ...current, ...patch, reserved: current.reserved, updatedAt: nowIso() });
    state.products[productId] = next;
    state.movements.push({ id: id('mv'), type: 'configure', productId, delta: 0, note: reason, createdAt: nowIso() });
    return saveState(state);
  }
  function adjustStock(productId, delta, note = 'Manual stock adjustment') {
    const amount = Math.trunc(Number(delta));
    if (!Number.isFinite(amount) || amount === 0) throw new Error('Enter a non-zero whole-number stock adjustment.');
    const state = loadState();
    const product = state.products[productId];
    if (!product) throw new Error('Product is not configured.');
    const nextOnHand = product.onHand + amount;
    if (nextOnHand < product.reserved) throw new Error('Stock cannot be reduced below the quantity currently reserved.');
    if (nextOnHand < 0) throw new Error('Stock cannot be negative.');
    product.onHand = nextOnHand;
    product.updatedAt = nowIso();
    state.movements.push({ id: id('mv'), type: 'adjustment', productId, delta: amount, note: String(note || 'Manual stock adjustment').slice(0, 160), createdAt: nowIso() });
    return saveState(state);
  }
  function loadCart() {
    const store = storage();
    let raw = memoryCart;
    if (store) {
      try { raw = JSON.parse(store.getItem(CART_KEY) || '[]'); } catch (_) { raw = []; }
    }
    return Array.isArray(raw) ? raw.filter(item => item && item.productId && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_CART_QTY) : [];
  }
  function saveCart(cart) {
    const clean = Array.isArray(cart) ? cart.filter(item => item && item.productId && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_CART_QTY).slice(0, 50) : [];
    const store = storage();
    if (store) store.setItem(CART_KEY, JSON.stringify(clean));
    else memoryCart = clone(clean);
    return clone(clean);
  }
  function setCartItem(productId, quantity, size = 'Not sure') {
    const qty = Math.max(0, Math.min(MAX_CART_QTY, Math.trunc(Number(quantity) || 0)));
    const cart = loadCart();
    const keySize = String(size || 'Not sure');
    const index = cart.findIndex(item => item.productId === productId && item.size === keySize);
    if (qty === 0) {
      if (index >= 0) cart.splice(index, 1);
    } else if (index >= 0) {
      cart[index].quantity = qty;
    } else {
      cart.push({ productId, quantity: qty, size: keySize });
    }
    return saveCart(cart);
  }
  function addCartItem(productId, quantity = 1, size = 'Not sure') {
    const cart = loadCart();
    const keySize = String(size || 'Not sure');
    const existing = cart.find(item => item.productId === productId && item.size === keySize);
    return setCartItem(productId, Math.min(MAX_CART_QTY, (existing?.quantity || 0) + Math.max(1, Math.trunc(Number(quantity) || 1))), keySize);
  }
  function cartSummary(catalogById) {
    const state = loadState();
    const items = loadCart().map(item => {
      const catalog = catalogById[item.productId];
      const inventory = state.products[item.productId];
      const price = inventory?.price;
      const subtotal = typeof price === 'number' ? price * item.quantity : null;
      return { ...item, catalog, inventory: inventory ? clone(inventory) : null, available: availableStock(item.productId, state), subtotal };
    });
    const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    return { items, total };
  }
  function cleanupExpiredReservations(state = loadState()) {
    const now = Date.now();
    let changed = false;
    Object.values(state.reservations).forEach(reservation => {
      if (!reservation || reservation.status !== 'reserved') return;
      if (new Date(reservation.expiresAt).getTime() > now) return;
      reservation.items.forEach(item => {
        const product = state.products[item.productId];
        if (product) product.reserved = Math.max(0, product.reserved - item.quantity);
      });
      reservation.status = 'expired';
      reservation.releasedAt = nowIso();
      state.movements.push({ id: id('mv'), type: 'reservation-expired', reservationId: reservation.id, delta: 0, note: 'Expired checkout reservation released.', createdAt: nowIso() });
      changed = true;
    });
    return changed ? saveState(state) : clone(state);
  }
  function validateItems(items, state = loadState()) {
    if (!Array.isArray(items) || !items.length) throw new Error('Your bag is empty.');
    const normalized = [];
    items.forEach(raw => {
      const productId = String(raw.productId || '');
      const quantity = Math.trunc(Number(raw.quantity));
      const size = String(raw.size || 'Not sure');
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QTY) throw new Error('One or more bag items are invalid.');
      const product = state.products[productId];
      if (!product || !product.enabled || product.price === null) throw new Error('One or more products are not enabled for checkout.');
      if (availableStock(productId, state) < quantity) throw new Error(`Not enough stock is available for ${productId}.`);
      normalized.push({ productId, quantity, size, unitPrice: product.price });
    });
    return normalized;
  }
  function createReservation(items, customer = {}) {
    let state = cleanupExpiredReservations(loadState());
    const normalized = validateItems(items, state);
    const reservationId = id('res');
    normalized.forEach(item => { state.products[item.productId].reserved += item.quantity; });
    const createdAt = nowIso();
    const reservation = {
      id: reservationId,
      status: 'reserved',
      items: normalized,
      customer: {
        name: String(customer.name || '').slice(0, 80),
        phone: String(customer.phone || '').slice(0, 40),
        fulfilment: String(customer.fulfilment || '').slice(0, 40),
        note: String(customer.note || '').slice(0, 300)
      },
      total: normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      createdAt,
      expiresAt: new Date(Date.now() + RESERVATION_TTL_MS).toISOString()
    };
    state.reservations[reservationId] = reservation;
    state.movements.push({ id: id('mv'), type: 'reserve', reservationId, delta: 0, note: 'Checkout stock reserved.', createdAt });
    saveState(state);
    return clone(reservation);
  }
  function releaseReservation(reservationId, reason = 'Checkout cancelled') {
    const state = loadState();
    const reservation = state.reservations[reservationId];
    if (!reservation) throw new Error('Reservation not found.');
    if (reservation.status !== 'reserved') return clone(reservation);
    reservation.items.forEach(item => {
      const product = state.products[item.productId];
      if (product) product.reserved = Math.max(0, product.reserved - item.quantity);
    });
    reservation.status = 'released';
    reservation.releasedAt = nowIso();
    reservation.releaseReason = String(reason).slice(0, 160);
    state.movements.push({ id: id('mv'), type: 'release', reservationId, delta: 0, note: reservation.releaseReason, createdAt: nowIso() });
    saveState(state);
    return clone(reservation);
  }
  function commitReservation(reservationId, payment = {}) {
    const state = loadState();
    const reservation = state.reservations[reservationId];
    if (!reservation) throw new Error('Reservation not found.');
    if (reservation.status === 'paid') {
      const existing = state.orders.find(order => order.reservationId === reservationId);
      return clone(existing || reservation);
    }
    if (reservation.status !== 'reserved') throw new Error(`Reservation is ${reservation.status} and cannot be paid.`);
    reservation.items.forEach(item => {
      const product = state.products[item.productId];
      if (!product || product.reserved < item.quantity || product.onHand < item.quantity) throw new Error('Inventory changed and the reservation can no longer be completed.');
    });
    reservation.items.forEach(item => {
      const product = state.products[item.productId];
      product.reserved -= item.quantity;
      product.onHand -= item.quantity;
      product.updatedAt = nowIso();
      state.movements.push({ id: id('mv'), type: 'sale', productId: item.productId, reservationId, delta: -item.quantity, note: `Paid order ${reservationId}`, createdAt: nowIso() });
    });
    reservation.status = 'paid';
    reservation.paidAt = nowIso();
    reservation.payment = {
      provider: String(payment.provider || 'V26 simulator').slice(0, 80),
      reference: String(payment.reference || id('pay')).slice(0, 120),
      status: 'successful'
    };
    const order = {
      id: id('ord'),
      reservationId,
      status: 'paid',
      customer: clone(reservation.customer),
      items: clone(reservation.items),
      total: reservation.total,
      payment: clone(reservation.payment),
      createdAt: reservation.createdAt,
      paidAt: reservation.paidAt
    };
    state.orders.push(order);
    saveState(state);
    return clone(order);
  }
  function demoScenario(catalogProducts = []) {
    const state = resetState();
    const products = catalogProducts || [];
    products.forEach((product, index) => {
      state.products[product.id] = normalizeProduct({ enabled: false, sku: `S3-${String(index + 1).padStart(3, '0')}`, price: null, onHand: 0, reserved: 0, lowStockAt: 5 });
    });
    const presets = {
      'navy-two-piece-set': { enabled: true, price: 700, onHand: 60, lowStockAt: 5 },
      'green-two-piece-set': { enabled: true, price: 650, onHand: 24, lowStockAt: 5 },
      'yellow-short-kurti': { enabled: true, price: 400, onHand: 8, lowStockAt: 3 },
      'yellow-floral-kurti': { enabled: true, price: 400, onHand: 8, lowStockAt: 3 }
    };
    Object.keys(presets).forEach(productId => {
      if (state.products[productId]) state.products[productId] = normalizeProduct({ ...state.products[productId], ...presets[productId] });
    });
    state.movements.push({ id: id('mv'), type: 'demo', delta: 0, note: 'Loaded V26 sample data. These are TEST values, not real Sutras stock or prices.', createdAt: nowIso() });
    return saveState(state);
  }
  function snapshot() {
    const state = cleanupExpiredReservations(loadState());
    return clone(state);
  }
  function stats() {
    const state = snapshot();
    const productEntries = Object.entries(state.products);
    return {
      liveProducts: productEntries.filter(([, p]) => p.enabled && p.price !== null).length,
      onHand: productEntries.reduce((sum, [, p]) => sum + p.onHand, 0),
      reserved: productEntries.reduce((sum, [, p]) => sum + p.reserved, 0),
      available: productEntries.reduce((sum, [productId]) => sum + availableStock(productId, state), 0),
      paidOrders: state.orders.filter(order => order.status === 'paid').length,
      revenue: state.orders.filter(order => order.status === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0)
    };
  }

  return {
    STORAGE_KEY, CART_KEY, SCHEMA_VERSION, RESERVATION_TTL_MS, MAX_CART_QTY,
    loadState, saveState, resetState, ensureProducts, productState, availableStock, statusFor,
    updateProduct, adjustStock, loadCart, saveCart, setCartItem, addCartItem, cartSummary,
    cleanupExpiredReservations, validateItems, createReservation, releaseReservation, commitReservation,
    demoScenario, snapshot, stats
  };
});
