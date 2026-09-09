/* Sutras storefront — vanilla JavaScript, no services or build step required. */
(() => {
  'use strict';

  const config = window.SUTRAS;
  if (!config || !Array.isArray(config.products)) return;
  const products = config.products;
  const byId = new Map(products.map(product => [product.id, product]));
  const commerce = window.SutrasCommerce || null;
  const checkoutPrefillKey = 'sutras-demo-v26-1-checkout-prefill-v1';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const sizes = ['Not sure', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const storageKey = 'sutras-demo-v26-1-enquiry-bag-v1';
  const recentStorageKey = 'sutras-demo-v26-1-recently-viewed-v1';
  const maxQuantity = 10;
  const maxSelections = 50;
  let activeProduct = null;
  let activeGallery = [];
  let selectedPhotoIndex = 0;
  let selectedSize = 'Not sure';
  let quickViewProduct = null;
  let quickViewSize = 'Not sure';
  let activeFilter = 'All';
  let activeEdit = null;
  let toastTimer;
  let suppressedHoverCard = null;
  let storageAvailable = true;
  let bag = [];
  let orderNote = '';
  let recentlyViewed = [];
  let finderStep = 0;
  let finderAnswers = { occasion: null, mood: null, silhouette: null };


  // V4: lightweight scroll state for the editorial header. It only decorates
  // existing navigation; it does not change any click destinations.
  const header = document.querySelector('.site-header');
  const progressBar = document.getElementById('scroll-progress-bar');
  const sectionLinks = $$('.desktop-nav .nav-link');
  const trackedSections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  function updateScrollState() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
    if (progressBar) progressBar.style.width = `${ratio * 100}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 18);
    let active = null;
    trackedSections.forEach(section => { if (section.getBoundingClientRect().top <= 150) active = section.id; });
    sectionLinks.forEach(link => {
      const isCurrent = link.getAttribute('href') === `#${active}`;
      if (isCurrent) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  }
  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => { scrollTick = false; updateScrollState(); });
  }, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // The file preview may be sandboxed without localStorage. Browsing and the
  // current in-memory enquiry bag still work; storage is never mandatory.
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && Array.isArray(saved.items)) {
      bag = saved.items.slice(0, maxSelections).filter(item => item && byId.has(item.id) && sizes.includes(item.size) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= maxQuantity);
      orderNote = typeof saved.note === 'string' ? saved.note.slice(0, 500) : '';
      if (!bag.length) orderNote = '';
    }
  } catch (_) {
    storageAvailable = false;
  }

  function loadRecentlyViewed() {
    try {
      const saved = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
      recentlyViewed = Array.isArray(saved)
        ? saved.filter(id => byId.has(id)).slice(0, 6)
        : [];
    } catch (_) {
      recentlyViewed = [];
    }
  }

  function saveRecentlyViewed() {
    try {
      if (recentlyViewed.length) localStorage.setItem(recentStorageKey, JSON.stringify(recentlyViewed));
      else localStorage.removeItem(recentStorageKey);
    } catch (_) {}
  }

  function renderRecentlyViewed() {
    const section = $('#recently-viewed');
    const grid = $('#recently-viewed-grid');
    if (!section || !grid) return;
    const items = recentlyViewed.map(id => byId.get(id)).filter(Boolean);
    section.hidden = items.length < 2;
    if (items.length < 2) { grid.innerHTML = ''; return; }
    grid.innerHTML = items.map(product => `<button class="recently-viewed-card" type="button" data-product="${escape(product.id)}" aria-label="View ${escape(product.name)}">
      <span class="recently-viewed-image"><img src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="240" height="320" loading="lazy" decoding="async"></span>
      <span class="recently-viewed-copy"><strong>${escape(product.cardName || product.name)}</strong><small>${escape(product.color)} · ${escape(priceText(product))}</small></span>
    </button>`).join('');
  }

  function rememberRecentlyViewed(id) {
    if (!byId.has(id)) return;
    recentlyViewed = [id, ...recentlyViewed.filter(item => item !== id)].slice(0, 6);
    saveRecentlyViewed();
    renderRecentlyViewed();
  }

  function saveBag() {
    try {
      if (bag.length) localStorage.setItem(storageKey, JSON.stringify({ version: 1, items: bag, note: orderNote }));
      else localStorage.removeItem(storageKey);
      storageAvailable = true;
    } catch (_) {
      storageAvailable = false;
    }
  }

  loadRecentlyViewed();
  renderRecentlyViewed();

  if (commerce) {
    try {
      commerce.ensureProducts(products);
      commerce.cleanupExpiredReservations();
    } catch (_) {
      // The normal catalogue and enquiry bag must keep working even if the
      // V26 browser-only commerce lab storage is unavailable.
    }
  }

  function priceText(product) {
    if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.isPreview) return 'Price on enquiry';
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: config.currency || 'ZMW', maximumFractionDigits: 2 }).format(product.price);
  }

  function availabilityLabel(product) {
    if (product.isPreview) return 'Style preview';
    if (product.availability === 'sold-out') return 'Sold out';
    if (product.availability === 'unavailable') return 'Currently unavailable';
    if (product.availability === 'low') return 'Low availability';
    if (product.availability === 'available') return 'Available';
    return 'Availability to confirm';
  }

  function availabilityTone(product) {
    if (product.isPreview) return 'is-preview';
    if (product.availability === 'sold-out') return 'is-sold-out';
    if (product.availability === 'unavailable') return 'is-unavailable';
    if (product.availability === 'low') return 'is-low';
    return 'is-available';
  }

  function availabilityStatusMarkup(product, extraClass = '') {
    const className = `availability-status ${availabilityTone(product)}${extraClass ? ` ${extraClass}` : ''}`;
    return `<span class="${className}" role="status"><span class="availability-dot" aria-hidden="true"></span><span>${escape(availabilityLabel(product))}</span></span>`;
  }

  function isUnavailable(product) {
    return product.availability === 'sold-out' || product.availability === 'unavailable';
  }

  function colorValue(product) {
    return /^#[0-9a-f]{6}$/i.test(product.colorHex) ? product.colorHex : '#c9c8bb';
  }

  function waLink(text, line = 0) {
    const number = (config.whatsapp[line] || config.whatsapp[0]).replace(/\D/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  function showToast(text) {
    const toast = $('#toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function showBagConfirmation(target = 'product') {
    const confirmation = target === 'quick' ? $('#quick-view-confirmation') : $('#bag-confirmation');
    if (!confirmation) return;
    confirmation.classList.add('visible');
    confirmation.removeAttribute('hidden');
  }

  function syncScrollLock() {
    document.body.classList.toggle('modal-open', Boolean($('dialog[open]')));
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.open) return;
    $$('dialog[open]').forEach(open => open.close());
    dialog.showModal();
    dialog.scrollTop = 0;
    syncScrollLock();
    if (id === 'search-dialog') {
      renderSearch();
      $('#search-input').focus({ preventScroll: true });
    }
  }

  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', syncScrollLock);
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        // Search inputs otherwise consume the first Escape to clear themselves.
        event.preventDefault();
        dialog.close();
      }
      if (event.key === 'Tab') {
        const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]', dialog)
          .filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    // A click outside the dialog panel closes it. Interior whitespace does not.
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });

  const collectionGrid = $('#product-grid');
  collectionGrid?.addEventListener('pointerout', event => {
    const card = event.target.closest?.('.product-card');
    if (!card || !collectionGrid.contains(card)) return;
    const next = event.relatedTarget;
    if (!next || !card.contains(next)) card.classList.remove('hover-suppressed');
  });

  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog').close();
    if (event.target.closest('[data-open-search]')) openDialog('search-dialog');
    if (event.target.closest('[data-open-bag]')) { renderBag(); openDialog('bag-dialog'); }
    const continueBrowsing = event.target.closest('[data-browse-styles]');
    if (continueBrowsing && !continueBrowsing.closest('#bag-items')) {
      $('#bag-dialog')?.close();
      $('#collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    if (event.target.closest('[data-open-contact]')) openDialog('contact-dialog');
    if (event.target.closest('[data-open-info]')) openDialog('info-dialog');
    if (event.target.closest('[data-open-menu]')) openDialog('menu-dialog');
    if (event.target.closest('[data-open-style-finder]')) openStyleFinder();
    const finderAnswer = event.target.closest('[data-finder-answer]');
    if (finderAnswer) {
      finderAnswers[finderAnswer.dataset.finderAnswer] = finderAnswer.dataset.finderValue;
      finderStep += 1;
      renderStyleFinder();
    }
    if (event.target.closest('[data-finder-back]')) { finderStep = Math.max(0, finderStep - 1); renderStyleFinder(); }
    if (event.target.closest('[data-finder-restart]')) { finderStep = 0; finderAnswers = { occasion: null, mood: null, silhouette: null }; renderStyleFinder(); }
    if (event.target.closest('[data-finder-browse]')) { $('#style-finder-dialog')?.close(); applyFinderEdit(); }
    const quickViewButton = event.target.closest('[data-quick-view]');
    if (quickViewButton) {
      suppressedHoverCard = quickViewButton.closest('.product-card');
      suppressedHoverCard?.classList.add('hover-suppressed');
      openQuickView(quickViewButton.dataset.quickView);
      return;
    }
    const productButton = event.target.closest('[data-product]');
    if (productButton) {
      suppressedHoverCard = productButton.closest('.product-card');
      suppressedHoverCard?.classList.add('hover-suppressed');
      openProduct(productButton.dataset.product);
    }
  });

  $$('#menu-dialog nav a').forEach(link => link.addEventListener('click', () => $('#menu-dialog').close()));

  function primaryImageKind(product) {
    return ['ai-model', 'store-photo', 'style-preview'].includes(product.imageKind)
      ? product.imageKind : (product.isPreview ? 'style-preview' : 'store-photo');
  }

  function imageTypeLabel(kind) {
    // V6 keeps transparency in the site notes, while making the gallery itself feel editorial.
    return kind === 'ai-model' ? 'Model view' : kind === 'store-photo' ? 'Store photograph' : kind === 'ai-detail' ? 'Detail view' : 'Style preview';
  }

  const finderQuestions = [
    {
      key: 'occasion', eyebrow: '01 · WHAT ARE YOU LOOKING FOR?', title: 'Choose your moment.',
      options: [
        { value: 'everyday', label: 'Everyday', note: 'Easy pieces for ordinary days.' },
        { value: 'occasion', label: 'A little occasion', note: 'Something with a little more presence.' },
        { value: 'complete', label: 'A complete set', note: 'Coordinated pieces, ready to style.' },
        { value: 'simple', label: 'Keep it simple', note: 'One easy piece, no overthinking.' }
      ]
    },
    {
      key: 'mood', eyebrow: '02 · WHAT FEELS LIKE YOU?', title: 'Choose a feeling.',
      options: [
        { value: 'soft', label: 'Soft & light', note: 'Ivory, blush and gentle neutrals.' },
        { value: 'bright', label: 'Bright & cheerful', note: 'Warm colour with a little energy.' },
        { value: 'deep', label: 'Deep & elegant', note: 'Rich, grounded and jewel-like tones.' },
        { value: 'earthy', label: 'Earthy & natural', note: 'Olive, botanical and quieter shades.' }
      ]
    },
    {
      key: 'silhouette', eyebrow: '03 · WHAT SHAPE?', title: 'Choose your kind of piece.',
      options: [
        { value: 'set', label: 'Two-piece set', note: 'A kurta with matching bottoms.' },
        { value: 'three', label: 'Three-piece set', note: 'Kurta, bottoms and dupatta.' },
        { value: 'kurti', label: 'Kurti', note: 'A single kurti to style your way.' },
        { value: 'any', label: 'Surprise me', note: 'Let the collection decide.' }
      ]
    }
  ];

  function finderOptionMarkup(question) {
    return `<div class="finder-step" data-finder-step="${question.key}">
      <p class="finder-eyebrow">${question.eyebrow}</p><h3>${question.title}</h3>
      <div class="finder-options" role="group" aria-label="${question.title}">${question.options.map(option => `<button class="finder-option${finderAnswers[question.key] === option.value ? ' is-selected' : ''}" type="button" data-finder-answer="${question.key}" data-finder-value="${option.value}" aria-pressed="${finderAnswers[question.key] === option.value}"><span class="finder-option-number">${String(question.options.indexOf(option)+1).padStart(2,'0')}</span><span><strong>${option.label}</strong><small>${option.note}</small></span><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>`).join('')}</div>
      <div class="finder-footer"><span>Step ${finderStep + 1} of ${finderQuestions.length}</span>${finderStep ? '<button class="text-link" type="button" data-finder-back>Back</button>' : '<span></span>'}</div>
    </div>`;
  }

  function finderMatchPool() {
    const { silhouette } = finderAnswers;
    if (silhouette === 'three') return products.filter(product => product.pieces === 3);
    if (silhouette === 'set') return products.filter(product => product.pieces === 2 && product.productType === 'set');
    if (silhouette === 'kurti') return products.filter(product => product.pieces === 1 && product.productType === 'kurti');
    return products.slice();
  }

  function finderScore(product) {
    const text = `${product.name} ${product.description} ${product.detail} ${product.setContents} ${product.color}`.toLowerCase();
    const category = product.category;
    let score = 0;
    const { occasion, mood, silhouette } = finderAnswers;
    if (occasion === 'everyday') score += category === 'Kurtas' || /everyday|easy|simple|short kurti/.test(text) ? 5 : 1;
    if (occasion === 'occasion') score += /three-piece|dupatta|embellish|gold|paisley|floral/.test(text) ? 5 : 1;
    if (occasion === 'complete') score += product.pieces >= 2 ? 6 : 0;
    if (occasion === 'simple') score += product.pieces === 1 ? 6 : category === 'Co-ord sets' ? 2 : 1;
    if (mood === 'soft') score += /white|ivory|pink|blush|light|gentle/.test(text) ? 6 : 0;
    if (mood === 'bright') score += /orange|pink|yellow|bright|fuchsia|colour/.test(text) ? 6 : 0;
    if (mood === 'deep') score += /navy|purple|plum|wine|deep|dark|jewel/.test(text) ? 6 : 0;
    if (mood === 'earthy') score += /olive|green|botanical|natural|earth/.test(text) ? 6 : 0;
    if (silhouette === 'set') score += product.pieces === 2 && product.productType === 'set' ? 12 : 0;
    if (silhouette === 'three') score += product.pieces === 3 ? 12 : 0;
    if (silhouette === 'kurti') score += product.pieces === 1 && product.productType === 'kurti' ? 12 : 0;
    if (silhouette === 'any') score += 1;
    return score;
  }

  function finderResults() {
    const pool = finderMatchPool();
    return pool.map((product, index) => ({ product, score: finderScore(product), index }))
      .sort((a,b) => b.score - a.score || a.index - b.index)
      .slice(0, 4)
      .map(item => item.product);
  }

  function renderFinderResults() {
    const ranked = finderResults();
    return `<div class="finder-results">
      <div class="finder-result-intro"><p class="finder-eyebrow">YOUR EDIT IS READY</p><h3>Made for your <em>moment.</em></h3><p>Up to four styles from the current catalogue, matched to your choices. Your selected shape is always respected. Nothing is booked or ordered here — just a starting point.</p></div>
      <div class="finder-result-grid">${ranked.map((product,index) => `<button class="finder-result-card" type="button" data-product="${escape(product.id)}"><span class="finder-result-image"><img src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="500" height="670" loading="lazy" decoding="async"><span>${String(index+1).padStart(2,'0')}</span></span><span class="finder-result-copy"><strong>${escape(product.cardName || product.name)}</strong><small>${escape(product.color)}</small></span></button>`).join('')}</div>
      <div class="finder-result-actions"><button class="button button-rust" type="button" data-finder-browse>See your four matches <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button><button class="text-link" type="button" data-finder-restart>Start again</button></div>
    </div>`;
  }

  function openStyleFinder() {
    const dialog = $('#style-finder-dialog');
    if (!dialog) return;
    finderStep = 0; finderAnswers = { occasion: null, mood: null, silhouette: null };
    renderStyleFinder(); openDialog('style-finder-dialog');
  }

  function renderStyleFinder() {
    const content = $('#style-finder-content');
    const progress = $('#finder-progress-bar');
    if (!content) return;
    if (finderStep >= finderQuestions.length) {
      content.innerHTML = renderFinderResults();
      if (progress) progress.style.width = '100%';
      return;
    }
    content.innerHTML = finderOptionMarkup(finderQuestions[finderStep]);
    if (progress) progress.style.width = `${((finderStep) / finderQuestions.length) * 100}%`;
  }

  function applyFinderEdit() {
    const ranked = finderResults().map(item => item.id);
    window.__sutrasFinderMatches = ranked;
    activeEdit = null; activeFilter = 'All';
    $('#collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    renderProducts();
    // Give the recommendation set a clear, premium spotlight without hiding the catalogue.
    const grid = $('#product-grid');
    grid?.classList.add('finder-spotlight-active');
    setTimeout(() => {
      $$('.product-card').forEach(card => {
        const id = card.querySelector('[data-product]')?.dataset.product;
        const match = ranked.includes(id);
        card.classList.toggle('finder-match', match);
        card.classList.toggle('finder-not-match', !match);
        card.setAttribute('data-finder-rank', match ? String(ranked.indexOf(id) + 1) : '');
      });
      const first = $('#product-grid .finder-match');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 180);
  }

  const editDefinitions = {
    everyday: {
      label: 'Everyday ease',
      ids: ['green-two-piece-set', 'white-floral-two-piece-set', 'yellow-floral-kurti', 'olive-lattice-short-kurti', 'slate-grey-short-kurti', 'wine-floral-short-kurti']
    },
    'three-piece': {
      label: 'Three-piece moments',
      ids: ['orange-three-piece-set', 'pink-three-piece-set', 'dark-purple-three-piece-set', 'plum-purple-three-piece-set']
    },
    colour: {
      label: 'Colour stories',
      ids: ['orange-three-piece-set', 'pink-three-piece-set', 'green-two-piece-set', 'yellow-floral-kurti', 'dark-purple-three-piece-set', 'plum-purple-three-piece-set', 'wine-floral-short-kurti', 'dark-green-floral-two-piece-set']
    },
    soft: {
      label: 'Soft & light',
      ids: ['white-floral-two-piece-set', 'pink-three-piece-set', 'yellow-floral-kurti', 'slate-grey-short-kurti']
    }
  };

  function visibleProducts() {
    if (activeEdit && editDefinitions[activeEdit]) {
      const ids = new Set(editDefinitions[activeEdit].ids);
      return products.filter(product => ids.has(product.id));
    }
    return products.filter(product => activeFilter === 'All' || product.category === activeFilter);
  }

  function productCard(product, index) {
    const detailImage = Array.isArray(product.gallery) ? product.gallery.find(photo => photo && photo.src && photo.kind === 'ai-detail') : null;
    const detailLabel = detailImage?.label || 'Detail preview';
    return `<article class="product-card" style="animation-delay:${index * 40}ms">
      <div class="product-image-wrap${primaryImageKind(product) === 'ai-model' ? ' model-image-wrap' : ''}${detailImage ? ' has-detail-hover' : ''}">
        <button type="button" class="product-image-link" data-product="${escape(product.id)}" aria-label="View ${escape(product.name)}${product.isPreview ? ', illustrative style preview' : primaryImageKind(product) === 'ai-model' ? ', AI-modelled view' : ''}">
          <img class="product-image-primary" src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="896" height="1200" loading="lazy" decoding="async">
          ${detailImage ? `<img class="product-image-detail" src="${escape(detailImage.src)}" alt="${escape(detailImage.alt || detailLabel)}" width="896" height="1200" loading="lazy" decoding="async" aria-hidden="true">` : ''}
          <span class="image-view-label">Take a closer look ↗</span>
          ${detailImage ? `<span class="detail-peek-label">${escape(detailLabel)} · hover to preview</span>` : ''}
        </button>
        <span class="card-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <button class="quick-view-trigger" type="button" data-quick-view="${escape(product.id)}" aria-label="Quick view ${escape(product.name)}">${icon('eye')}<span aria-hidden="true">Quick view</span></button>
      </div>
      <div class="product-meta">
        <p class="product-category"><span>${escape(product.isPreview ? 'Style preview' : product.category)}</span><span class="color-dot" style="background:${colorValue(product)}" role="img" aria-label="${escape(product.color)}"></span></p>
        <h3><button type="button" class="product-name" data-product="${escape(product.id)}">${escape(product.cardName || product.name)}</button></h3>
        <div class="product-bottom-line"><p class="product-price">${escape(priceText(product))}</p>${availabilityStatusMarkup(product, 'card-availability')}<button class="product-enquire" type="button" data-product="${escape(product.id)}">Explore style ↗</button></div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const visible = visibleProducts();
    $('#product-grid').innerHTML = visible.length ? visible.map(productCard).join('') : '<div class="search-empty"><h3>Something lovely is taking shape.</h3><p>Message us on WhatsApp to discover the current collection.</p></div>';
    const countLabel = activeEdit && editDefinitions[activeEdit] ? editDefinitions[activeEdit].label : '';
    if (activeEdit) {
      $('#style-count').textContent = `${visible.length} ${visible.length === 1 ? 'style' : 'styles'} · ${countLabel}`;
    } else if (window.__sutrasFinderMatches) {
      $('#style-count').textContent = `${window.__sutrasFinderMatches.length} recommended styles · Your find`;
    } else {
      $('#style-count').textContent = `${visible.length} ${visible.every(product => product.isPreview) ? 'style preview' : 'style'}${visible.length === 1 ? '' : 's'}${countLabel ? ` · ${countLabel}` : ''}`;
    }
    $$('.filter-button').forEach(button => {
      const isActive = !activeEdit && button.dataset.filter === activeFilter;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      if (button.dataset.filter !== 'All') button.hidden = new Set(products.map(product => product.category)).size < 2 || !products.some(product => product.category === button.dataset.filter);
      else $('span', button).textContent = String(products.length).padStart(2, '0');
    });
    $$('[data-edit]').forEach(button => {
      const isActive = button.dataset.edit === activeEdit;
      button.classList.toggle('is-selected', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    $('[data-clear-edit]')?.classList.toggle('is-hidden', !activeEdit);
  }

  document.addEventListener('click', event => {
    const clearRecent = event.target.closest('[data-clear-recently-viewed]');
    if (!clearRecent) return;
    recentlyViewed = [];
    saveRecentlyViewed();
    renderRecentlyViewed();
    showToast('Recent picks cleared.');
  });

  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    window.__sutrasFinderMatches = null;
    $('#product-grid')?.classList.remove('finder-spotlight-active');
    activeEdit = null;
    activeFilter = button.dataset.filter;
    renderProducts();
  }));

  $$('.edit-card').forEach(button => button.addEventListener('click', () => {
    window.__sutrasFinderMatches = null;
    $('#product-grid')?.classList.remove('finder-spotlight-active');
    const edit = button.dataset.edit;
    if (!editDefinitions[edit]) return;
    activeEdit = edit;
    activeFilter = 'All';
    renderProducts();
    $('#collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    showToast(`${editDefinitions[edit].label} selected.`);
  }));

  $('[data-clear-edit]')?.addEventListener('click', () => {
    window.__sutrasFinderMatches = null;
    $('#product-grid')?.classList.remove('finder-spotlight-active');
    activeEdit = null;
    activeFilter = 'All';
    renderProducts();
    $('#collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  function normalize(value) {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function renderSearch() {
    const query = normalize($('#search-input').value);
    const tokens = query.split(' ').filter(Boolean);
    const found = products.filter(product => {
      const haystack = normalize(`${product.name} ${product.category} ${product.color} ${product.description} cotton Indian wear`);
      return tokens.every(token => haystack.includes(token));
    });
    $('#search-result-count').textContent = query ? `${found.length} matching style${found.length === 1 ? '' : 's'}` : `Explore all ${products.length} ${products.every(product => product.isPreview) ? 'style previews' : 'styles'}`;
    $('#search-results').innerHTML = found.length ? found.map(product => `<button class="search-result" type="button" data-product="${escape(product.id)}"><img src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="62" height="83"><span><strong>${escape(product.cardName || product.name)}</strong><small>${escape(product.category)} · ${escape(product.color)}</small><small>${escape(imageTypeLabel(primaryImageKind(product)))}${product.isPreview ? '' : ' · ' + escape(priceText(product))}</small></span></button>`).join('') : '<div class="search-empty"><h3>No match, just yet.</h3><p>Try a colour or a category, like “blue” or “kurta”. Our actual collection is a WhatsApp message away.</p></div>';
  }

  $('#search-input').addEventListener('input', renderSearch);
  $('#search-form').addEventListener('submit', event => { event.preventDefault(); renderSearch(); });
  $('#search-form').addEventListener('reset', () => {
    $('#search-input').value = '';
    renderSearch();
    $('#search-input').focus();
  });

  function directMessage(product, size = 'Not sure') {
    const intro = product.isPreview
      ? `Hi Sutras by S³! I saw the illustrative style preview “${product.name}” (${product.category}, ${product.color}) on your website. I understand this is inspiration, not confirmed stock. Could you share similar current pieces, prices and available sizes?`
      : `Hi Sutras by S³! I’m interested in ${product.name} (${product.category}, ${product.color}). Could you confirm the price and availability?`;
    const imageNote = primaryImageKind(product) === 'ai-model' ? ' I viewed the AI-modelled image and understand that fit and styling are approximate; please confirm the actual garment details.' : '';
    const contentsNote = product.setContents ? `\nSet: ${product.setContents}.` : '';
    return `${intro}${imageNote}${contentsNote}\nMy usual size: ${size === 'Not sure' ? 'I would appreciate sizing advice' : size}.`;
  }

  // Share only a public product identifier, never a customer's size, bag or note.
  function productShareUrl(product) {
    let url;
    try {
      url = new URL($('link[rel="canonical"]')?.href || 'https://sutras-wear.github.io/Sutras-by-S3/');
      if (url.protocol !== 'https:') throw new Error('Public HTTPS URL required');
    } catch (_) {
      url = new URL('https://sutras-wear.github.io/Sutras-by-S3/');
    }
    url.search = '';
    url.hash = '';
    url.searchParams.set('product', product.id);
    return url.href;
  }

  function productQuery() {
    return new URLSearchParams(window.location.search).get('product');
  }

  function updateProductAddress(id) {
    // File viewers can deny History API access; the shop must still work there.
    if (!['http:', 'https:', 'file:'].includes(window.location.protocol)) return;
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('product', id);
      else url.searchParams.delete('product');
      if (url.href !== window.location.href) history.replaceState(history.state, '', url.href);
    } catch (_) { /* The public share URL does not depend on browser history. */ }
  }

  function shareControls(product) {
    const url = productShareUrl(product);
    const text = `Take a look at ${product.name} from Sutras by S³:\n${url}`;
    return `<section class="product-share" aria-label="Share this product">
      <p class="share-heading">Share this piece</p>
      <div class="product-share-actions">
        <button type="button" class="share-action" data-copy-product-link>${icon('link')}<span>Copy link</span></button>
        <a class="share-action" id="share-product-whatsapp" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer" aria-label="Share this product on WhatsApp (opens a new tab)">${icon('whatsapp')}<span>Share on WhatsApp</span></a>
      </div>
      <div class="product-share-fallback" id="product-share-fallback" hidden>
        <label for="product-share-url">Product link — select and copy</label>
        <input id="product-share-url" type="text" value="${escape(url)}" readonly spellcheck="false" aria-describedby="share-link-help">
        <p id="share-link-help">This link opens this exact piece. It does not share your enquiry bag.</p>
      </div>
    </section>`;
  }

  async function copyProductLink() {
    if (!activeProduct) return;
    const id = activeProduct.id;
    const url = productShareUrl(activeProduct);
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Product link copied.');
        return;
      }
    } catch (_) { /* Offer an ordinary selectable link when clipboard is denied. */ }
    if (activeProduct?.id !== id || !$('#product-dialog').open) return;
    const fallback = $('#product-share-fallback');
    const input = $('#product-share-url');
    fallback.hidden = false;
    input.value = url;
    input.focus();
    input.select();
    input.setSelectionRange(0, url.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* Manual copy remains available. */ }
    showToast(copied ? 'Product link copied.' : 'Select and copy the product link below.');
  }

  function openProductFromAddress(initial = false) {
    const id = productQuery();
    if (!id) {
      if ($('#image-dialog').open) $('#image-dialog').close();
      if ($('#product-dialog').open) $('#product-dialog').close();
      return;
    }
    if (!byId.has(id)) {
      updateProductAddress(null);
      if ($('#image-dialog').open) $('#image-dialog').close();
      if ($('#product-dialog').open) $('#product-dialog').close();
      showToast('That piece is not in the current collection. Please browse or ask us on WhatsApp.');
      return;
    }
    if (initial) {
      // A shared product opens over the top of the homepage. Returning focus
      // to a card below the fold would otherwise scroll the page on close.
      $('.site-header .wordmark')?.focus({ preventScroll: true });
    }
    openProduct(id, { fromAddress: true });
  }

  $('#product-dialog').addEventListener('close', () => {
    // Keep the card that opened the product on its primary image until the pointer
    // actually leaves it. This prevents the CSS hover preview from getting
    // visually stuck underneath the just-closed modal.
    if (suppressedHoverCard) suppressedHoverCard.classList.add('hover-suppressed');
    // A queued close event must not clear the route of a product already reopened.
    if (!$('#product-dialog').open && productQuery() === activeProduct?.id) updateProductAddress(null);
  });
  window.addEventListener('popstate', () => {
    openProductFromAddress();
    if (!productQuery()) {
      const section = document.getElementById(window.location.hash.slice(1));
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      if (section) section.scrollIntoView({ block: 'start', behavior: 'instant' });
      else if (!window.location.hash) window.scrollTo(0, 0);
      root.style.scrollBehavior = previous;
    }
  });

  function galleryFor(product) {
    return [{
      src: product.image,
      alt: product.imageAlt,
      kind: primaryImageKind(product),
      label: primaryImageKind(product) === 'ai-model' ? 'Model view' : product.isPreview ? 'Style preview' : 'Full set',
      caption: product.isPreview ? 'AI-generated style inspiration, not a confirmed stock photograph.' : (product.photoNote || 'Actual store photograph. Please confirm current availability on WhatsApp.')
    }, ...(Array.isArray(product.gallery) ? product.gallery.filter(photo => photo && photo.src && photo.label).map(photo => ({ ...photo, kind: photo.kind || (product.isPreview ? 'style-preview' : 'store-photo') })) : [])];
  }

  function productMedia(product) {
    const photo = activeGallery[0];
    const stage = `<div class="product-detail-image${photo.kind === 'ai-model' ? ' modelled-product-image' : photo.kind === 'store-photo' ? ' real-product-image' : ''}">
      <img id="product-main-image" src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="1200" height="1600">
      <div class="product-image-badge" aria-hidden="true"><span id="product-image-kind">${escape(imageTypeLabel(photo.kind))}</span></div>
      <button class="photo-nav photo-nav-prev" type="button" data-photo-prev aria-label="Show previous product view">${icon('arrow-left')}</button>
      <button class="photo-nav photo-nav-next" type="button" data-photo-next aria-label="Show next product view">${icon('arrow')}</button>
      <button class="photo-zoom-button" type="button" data-zoom-photo aria-label="Enlarge the selected product image">${icon('search')}<span>View larger</span></button>
    </div>`;
    if (activeGallery.length === 1) return stage;
    return `<div class="product-detail-media has-gallery">${stage}
      <div class="gallery-header"><span>Views</span><span id="gallery-position">1 / ${activeGallery.length}</span></div>
      <div class="photo-gallery" role="group" aria-label="Choose a view of this product">
        ${activeGallery.map((image, index) => `<button class="photo-thumbnail" type="button" data-photo-index="${index}" aria-pressed="${index === 0}" aria-label="Show ${escape(image.label.toLowerCase())}"><img src="${escape(image.src)}" alt="" width="72" height="96"><span>${escape(image.label)}</span></button>`).join('')}
      </div>
      <p class="photo-caption" id="photo-caption" aria-live="polite">${escape(photo.caption)}</p>
    </div>`;
  }

  function selectPhoto(index) {
    if (!Number.isInteger(index) || !activeGallery[index]) return;
    selectedPhotoIndex = index;
    const photo = activeGallery[index];
    const image = $('#product-main-image');
    image.src = photo.src;
    image.alt = photo.alt || activeProduct.imageAlt;
    image.removeAttribute('data-fallback');
    const stage = image.parentElement;
    stage.classList.toggle('modelled-product-image', photo.kind === 'ai-model');
    stage.classList.toggle('real-product-image', photo.kind === 'store-photo');
    $$('.photo-thumbnail').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.photoIndex) === index)));
    const caption = $('#photo-caption');
    if (caption) caption.textContent = photo.caption || '';
    const kind = $('#product-image-kind');
    if (kind) kind.textContent = imageTypeLabel(photo.kind);
    const position = $('#gallery-position');
    if (position) position.textContent = `${index + 1} / ${activeGallery.length}`;
    const selectedThumb = $(`[data-photo-index="${index}"]`);
    selectedThumb?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function showPhotoViewer() {
    const photo = activeGallery[selectedPhotoIndex];
    if (!photo || !activeProduct) return;
    $('#image-viewer-title').textContent = `${activeProduct.cardName || activeProduct.name} — ${photo.label}`;
    const image = $('#image-viewer-image');
    image.src = photo.src;
    image.alt = photo.alt || activeProduct.imageAlt;
    image.hidden = false;
    image.removeAttribute('data-fallback');
    $('#image-viewer-caption').textContent = photo.caption || '';
    // Keep the product dialog underneath so closing the photograph returns to
    // exactly the same style, size preference and selected thumbnail.
    $('#image-dialog').showModal();
    syncScrollLock();
  }


  // V24 — Quick View keeps fast browsing separate from the full product experience.
  // It intentionally does not change the URL or gallery state.
  function quickViewMarkup(product) {
    const imageKind = primaryImageKind(product);
    const pieces = product.pieces || 1;
    return `<div class="quick-view-layout">
      <div class="quick-view-media ${imageKind === 'ai-model' ? 'is-model-view' : ''}">
        <img src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="720" height="960" decoding="async">
        <span class="quick-view-image-badge">${escape(imageTypeLabel(imageKind))}</span>
      </div>
      <div class="quick-view-copy">
        <p class="quick-view-eyebrow">QUICK VIEW · ${escape(product.category.toUpperCase())}</p>
        <h2 id="quick-view-title">${escape(product.name)}</h2>
        <p class="quick-view-color"><span class="color-dot" style="background:${colorValue(product)}"></span>${escape(product.color)}</p>
        <p class="quick-view-description">${escape(product.description)}</p>
        <div class="quick-view-facts" aria-label="Quick style facts">
          <div><span>PIECES</span><strong>${pieces} ${pieces === 1 ? 'piece' : 'pieces'}</strong></div>
          <div><span>STYLE</span><strong>${escape(product.productType === 'kurti' ? 'Kurti' : 'Kurta set')}</strong></div>
          <div><span>PRICE</span><strong>${escape(priceText(product))}</strong></div>
        </div>
        <div class="quick-view-status">${availabilityStatusMarkup(product, 'quick-availability')}<span class="quick-view-set-contents">${escape(product.setContents || 'One garment')}</span></div>
        ${isUnavailable(product) ? `<div class="detail-unavailable ${product.availability === 'sold-out' ? 'is-sold-out' : ''}" role="status"><strong>${escape(availabilityLabel(product))}</strong><span>This style can still be explored, but it cannot be added to the enquiry bag.</span></div>` : `
          <div class="quick-size-heading"><span>Your usual size</span><strong id="quick-selected-size">Selected · ${escape(quickViewSize)}</strong></div>
          <div class="quick-size-list" role="group" aria-label="Usual size preference">${sizes.map(size => `<button class="quick-size-option" type="button" data-quick-size="${escape(size)}" aria-pressed="${size === quickViewSize}">${escape(size)}</button>`).join('')}</div>
          <p class="quick-size-helper">A preference only — Sutras will confirm the actual garment fit.</p>
        `}
        <div class="quick-view-actions">
          ${isUnavailable(product) ? '' : `<button class="button button-green" type="button" id="quick-view-add">${icon('bag')} Add to bag</button>`}
          <button class="button button-outline" type="button" data-product="${escape(product.id)}">View full details ${icon('diagonal')}</button>
        </div>
        <a class="quick-view-whatsapp" id="quick-view-whatsapp" href="${escape(waLink(directMessage(product, quickViewSize)))}" target="_blank" rel="noopener noreferrer">Ask about this style on WhatsApp ↗</a>
        <div class="quick-view-confirmation" id="quick-view-confirmation" role="status" aria-live="polite" aria-atomic="true" hidden>
          <span>${icon('check')} <strong>Added to your enquiry bag.</strong></span>
          <button type="button" data-open-bag>View bag</button>
        </div>
      </div>
    </div>`;
  }

  function openQuickView(id) {
    const product = byId.get(id);
    if (!product) return;
    quickViewProduct = product;
    quickViewSize = 'Not sure';
    $('#quick-view-detail').innerHTML = quickViewMarkup(product);
    openDialog('quick-view-dialog');
    $('#quick-view-dialog').scrollTop = 0;
  }

  $('#quick-view-detail').addEventListener('click', event => {
    if (!quickViewProduct) return;
    const sizeButton = event.target.closest('[data-quick-size]');
    if (sizeButton) {
      quickViewSize = sizeButton.dataset.quickSize;
      $$('.quick-size-option', $('#quick-view-detail')).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.quickSize === quickViewSize)));
      const sizeCue = $('#quick-selected-size');
      if (sizeCue) sizeCue.textContent = `Selected · ${quickViewSize}`;
      const whatsapp = $('#quick-view-whatsapp');
      if (whatsapp) whatsapp.href = waLink(directMessage(quickViewProduct, quickViewSize));
    }
    const addButton = event.target.closest('#quick-view-add');
    if (addButton) addToBag(quickViewProduct.id, quickViewSize, { confirmation: 'quick', trigger: addButton });
  });

  $('#quick-view-dialog').addEventListener('close', () => {
    if (suppressedHoverCard) suppressedHoverCard.classList.add('hover-suppressed');
  });

  function relatedProducts(product) {
    const sameCategory = products.filter(item => item.id !== product.id && item.category === product.category);
    const sameColor = products.filter(item => item.id !== product.id && item.color === product.color && !sameCategory.includes(item));
    const pool = [...sameCategory, ...sameColor, ...products.filter(item => item.id !== product.id && !sameCategory.includes(item) && !sameColor.includes(item))];
    return pool.slice(0, 3);
  }

  function relatedStylesMarkup(product) {
    const related = relatedProducts(product);
    if (!related.length) return '';
    return `<section class="related-styles" aria-labelledby="related-styles-title">
      <div class="related-styles-heading"><div><p class="detail-eyebrow">KEEP EXPLORING</p><h3 id="related-styles-title">You may also like.</h3></div><span>${related.length} nearby styles</span></div>
      <div class="related-styles-grid">${related.map(item => `<button type="button" class="related-style" data-product="${escape(item.id)}" aria-label="View ${escape(item.name)}">
        <span class="related-style-image"><img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="360" height="480" loading="lazy" decoding="async"></span>
        <span class="related-style-copy"><strong>${escape(item.cardName || item.name)}</strong><small>${escape(item.color)} · ${escape(priceText(item))}</small></span>
      </button>`).join('')}</div>
    </section>`;
  }

  function openProduct(id, { fromAddress = false } = {}) {
    const product = byId.get(id);
    if (!product) return;
    activeProduct = product;
    rememberRecentlyViewed(product.id);
    activeGallery = galleryFor(product);
    selectedPhotoIndex = 0;
    selectedSize = 'Not sure';
    $('#product-detail').innerHTML = `<div class="product-detail-layout">
      ${productMedia(product)}
      <div class="product-detail-copy">
        <p class="detail-eyebrow">THE COTTON EDIT / ${escape(product.category.toUpperCase())}</p>
        <h2 id="product-title">${escape(product.name)}</h2>
        <p class="detail-color"><span class="color-dot" style="background:${colorValue(product)}"></span>${escape(product.color)}</p>
        <p class="detail-description">${escape(product.description)}</p>
        <p class="detail-features">${escape(product.detail)}</p>
        <div class="detail-included"><span>WHAT’S INCLUDED</span><strong>${escape(product.setContents || 'One garment')}</strong></div>
        <div class="detail-facts" aria-label="Style facts">
          <div><span>PIECES</span><strong>${product.pieces || 1} ${product.pieces === 1 ? 'piece' : 'pieces'}</strong></div>
          <div><span>STYLE</span><strong>${escape(product.productType === 'kurti' ? 'Kurti' : 'Kurta set')}</strong></div>
          <div><span>VIEW</span><strong>${escape(imageTypeLabel(primaryImageKind(product)))}</strong></div>
        </div>
        ${product.isPreview ? '<p class="preview-notice"><strong>A little inspiration, not a stock listing.</strong>This AI-generated image and style name are placeholders. Ask us about similar real pieces, prices and availability.</p>' : `<p class="preview-notice ${primaryImageKind(product) === 'ai-model' ? 'ai-model-notice' : 'real-photo-notice'}"><strong>${primaryImageKind(product) === 'ai-model' ? 'About the modelled view.' : 'Photographed by Sutras.'}</strong>${escape(product.photoNote || 'Actual product photograph. Please confirm the price, sizing and availability with us.')}</p>`}
        <div class="detail-size-heading"><p class="detail-size-label" id="size-label">Your usual size <span>— a preference, not confirmed availability</span></p><span class="selected-size-pill" id="selected-size-value">Selected · ${escape(selectedSize)}</span></div>
        <div class="size-list" role="group" aria-labelledby="size-label">${sizes.map(size => `<button class="size-option" type="button" data-size="${escape(size)}" aria-pressed="${size === selectedSize}">${escape(size)}</button>`).join('')}</div>
        <p class="size-helper">Not sure? We can help with the actual garment’s fit.</p>
        <div class="detail-price"><span>${escape(priceText(product))}</span>${availabilityStatusMarkup(product, 'detail-availability-status')}</div>
        ${isUnavailable(product) ? `<div class="detail-unavailable ${product.availability === 'sold-out' ? 'is-sold-out' : ''}" role="status"><strong>${escape(availabilityLabel(product))}</strong><span>This style can still be viewed, but it cannot be added to the enquiry bag.</span></div>` : ''}
        <div class="detail-action-stack">
          ${isUnavailable(product) ? '' : `<button class="button button-green full-width detail-add-button" type="button" id="add-to-bag">${icon('bag')} Add to enquiry bag ${icon('arrow')}</button>`}
          <a class="detail-direct-enquiry detail-action-link" id="direct-enquiry" href="${escape(waLink(directMessage(product, selectedSize)))}" target="_blank" rel="noopener noreferrer">Or ask about this style on WhatsApp ↗</a>
        </div>
        <div class="bag-confirmation" id="bag-confirmation" role="status" aria-live="polite" aria-atomic="true" hidden>
          <div class="bag-confirmation-message"><span class="bag-confirmation-check">${icon('check')}</span><span><strong>Added to your enquiry bag</strong><small>Your selection is saved. You can keep browsing.</small></span></div>
          <button class="bag-confirmation-action" type="button" data-open-bag>View bag</button>
        </div>
        ${shareControls(product)}
        ${relatedStylesMarkup(product)}
      </div>
    </div>`;
    openDialog('product-dialog');
    $('#product-dialog').scrollTop = 0;
    if (!fromAddress) updateProductAddress(product.id);
  }

  $('#product-detail').addEventListener('keydown', event => {
    if (!activeProduct || !activeGallery.length) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectPhoto((selectedPhotoIndex - 1 + activeGallery.length) % activeGallery.length); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectPhoto((selectedPhotoIndex + 1) % activeGallery.length); }
  });

  $('#product-detail').addEventListener('click', event => {
    if (event.target.closest('[data-copy-product-link]')) void copyProductLink();
    const photoButton = event.target.closest('[data-photo-index]');
    if (photoButton) selectPhoto(Number(photoButton.dataset.photoIndex));
    if (event.target.closest('[data-photo-prev]')) selectPhoto((selectedPhotoIndex - 1 + activeGallery.length) % activeGallery.length);
    if (event.target.closest('[data-photo-next]')) selectPhoto((selectedPhotoIndex + 1) % activeGallery.length);
    if (event.target.closest('[data-zoom-photo]')) showPhotoViewer();
    const sizeButton = event.target.closest('[data-size]');
    if (sizeButton) {
      selectedSize = sizeButton.dataset.size;
      $$('.size-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.size === selectedSize)));
      const selectedSizeValue = $('#selected-size-value');
      if (selectedSizeValue) selectedSizeValue.textContent = `Selected · ${selectedSize}`;
      const directEnquiry = $('#direct-enquiry');
      if (directEnquiry) directEnquiry.href = waLink(directMessage(activeProduct, selectedSize));
    }
    const detailAddButton = event.target.closest('#add-to-bag');
    if (detailAddButton && activeProduct) addToBag(activeProduct.id, selectedSize, { trigger: detailAddButton });
  });

  function addToBag(id, size, { confirmation = 'product', trigger = null } = {}) {
    const product = byId.get(id);
    if (!product || isUnavailable(product) || !sizes.includes(size)) return;
    const existing = bag.find(item => item.id === id && item.size === size);
    if (!existing && bag.length >= maxSelections) {
      showToast('Your bag has 50 selections. Please remove one or message us to discuss more.');
      return;
    }
    if (existing && existing.quantity >= maxQuantity) {
      const button = trigger || $('#add-to-bag');
      if (button) button.textContent = 'Maximum 10 per style & size — message us for more';
      showToast('Maximum 10 per style & size — message us for more.');
      return false;
    }
    if (existing) existing.quantity += 1;
    else bag.push({ id, size, quantity: 1 });
    saveBag();
    renderBag();
    // Adding an item should confirm the selection without forcing the customer into the bag.
    showBagConfirmation(confirmation);
    return true;
  }

  function checkoutMoney(value) {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: config.currency || 'ZMW',
      maximumFractionDigits: 2
    }).format(Number(value) || 0).replace('ZMW', 'K').trim();
  }

  function checkoutReadiness() {
    if (!commerce) {
      return { ready: false, total: 0, issues: ['Checkout engine is unavailable in this preview.'], items: [] };
    }
    let state;
    try {
      state = commerce.snapshot();
    } catch (_) {
      return { ready: false, total: 0, issues: ['Checkout storage is unavailable in this browser.'], items: [] };
    }
    const issues = [];
    const items = bag.map(item => {
      const product = byId.get(item.id);
      const inventory = state.products[item.id];
      const available = inventory ? commerce.availableStock(item.id, state) : 0;
      const enabled = Boolean(inventory?.enabled && typeof inventory.price === 'number');
      if (!product) issues.push('A selected style is no longer in the catalogue.');
      else if (isUnavailable(product)) issues.push(`${product.cardName || product.name} is currently unavailable.`);
      else if (!enabled) issues.push(`${product.cardName || product.name} is not configured for checkout yet.`);
      else if (item.quantity > available) issues.push(`${product.cardName || product.name} only has ${available} available in the checkout test.`);
      return {
        productId: item.id,
        quantity: item.quantity,
        size: item.size,
        price: enabled ? inventory.price : null,
        available
      };
    });
    const total = items.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price * item.quantity : 0), 0);
    return { ready: Boolean(items.length) && issues.length === 0, total, issues, items };
  }

  function updateCheckoutActions() {
    const status = checkoutReadiness();
    const total = $('#bag-checkout-total');
    const message = $('#bag-checkout-status');
    const desktopButton = $('#bag-checkout');
    const mobileButton = $('#bag-checkout-mobile');
    const stickySummary = $('#bag-sticky-summary');
    const stickySubline = $('#bag-sticky-subline');

    if (!bag.length) return status;

    if (status.ready) {
      if (total) total.textContent = `Test total · ${checkoutMoney(status.total)}`;
      if (message) message.textContent = 'Ready for the V26 simulated checkout. Stock will be reserved before the payment test.';
      if (stickySummary) stickySummary.textContent = `${checkoutMoney(status.total)} · ${bagTotals().units} item${bagTotals().units === 1 ? '' : 's'}`;
      if (stickySubline) stickySubline.textContent = 'Ready for test checkout.';
    } else {
      if (total) total.textContent = 'Checkout setup required';
      const issue = status.issues[0] || 'Checkout is not ready for this selection.';
      if (message) message.textContent = status.issues.length > 1 ? `${issue} + ${status.issues.length - 1} more selection${status.issues.length === 2 ? '' : 's'} need attention.` : issue;
      if (stickySummary) stickySummary.textContent = `${bagTotals().units} item${bagTotals().units === 1 ? '' : 's'} in your bag`;
      if (stickySubline) stickySubline.textContent = 'Checkout is not ready for every selection yet.';
    }

    [desktopButton, mobileButton].forEach(button => {
      if (!button) return;
      button.classList.toggle('is-disabled', !status.ready);
      button.setAttribute('aria-disabled', String(!status.ready));
      button.title = status.ready ? 'Continue to the V26 simulated checkout' : (status.issues[0] || 'Checkout is not ready yet');
      if (status.ready) button.href = 'checkout-preview.html?source=enquiry-bag';
      else button.removeAttribute('href');
    });
    return status;
  }

  function proceedToCheckout(event) {
    const status = checkoutReadiness();
    if (!status.ready || !commerce) {
      event?.preventDefault();
      showToast(status.issues[0] || 'Checkout is not ready for this selection yet.');
      updateCheckoutActions();
      return;
    }
    try {
      commerce.saveCart(status.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size
      })));
      localStorage.setItem(checkoutPrefillKey, JSON.stringify({
        source: 'enquiry-bag',
        note: orderNote.slice(0, 500),
        createdAt: new Date().toISOString()
      }));
      // The checkout controls are real links. The browser performs the page
      // navigation after this handler has safely synchronized the bag.
    } catch (_) {
      event?.preventDefault();
      showToast('Checkout could not open in this browser. Your enquiry bag is still safe.');
    }
  }

  function enquiryMessage() {
    const hasPreviews = bag.some(item => byId.get(item.id).isPreview);
    const hasModelledViews = bag.some(item => primaryImageKind(byId.get(item.id)) === 'ai-model');
    const lines = [
      'Hi Sutras by S³! I’d love to enquire about pure cotton Indian wear.',
      hasPreviews ? 'My selection below may include real product photos and illustrative style previews. Only items labelled “style preview” are inspiration, not confirmed stock. Please confirm availability of the photographed pieces and share real alternatives for the previews, with prices and sizes.' : 'I saved these pieces on your website. Please confirm prices and availability.',
      ...(hasModelledViews ? ['AI-modelled views are styling illustrations. Please confirm the actual garment details and fit.'] : []),
      '',
      ...bag.map((item, index) => {
        const product = byId.get(item.id);
        const size = item.size === 'Not sure' ? 'sizing advice please' : item.size;
        const contentsNote = product.setContents ? `\n   Set: ${product.setContents}` : '';
        return `${index + 1}. ${product.name}${product.isPreview ? ' (style preview)' : primaryImageKind(product) === 'ai-model' ? ' (AI-modelled view)' : ' (store photograph)'} — ${product.color}${contentsNote}\n   Usual size: ${size} | Requested quantity: ${item.quantity}`;
      }),
      '',
      ...(orderNote.trim() ? [`My note: ${orderNote.trim()}`, ''] : []),
      'Please also confirm delivery or collection options in Lusaka/Zambia and payment details. This is an enquiry, not a confirmed order. Thank you!'
    ];
    return lines.join('\n');
  }

  function updateWhatsAppLinks() {
    const message = enquiryMessage();
    $('#bag-whatsapp').href = waLink(message, 0);
    $('#bag-whatsapp-alt').href = waLink(message, 1);
    $('#bag-whatsapp-mobile').href = waLink(message, 0);
  }

  function bagTotals() {
    return {
      units: bag.reduce((sum, item) => sum + item.quantity, 0),
      selections: bag.length
    };
  }

  function renderBag() {
    const { units: count, selections } = bagTotals();
    $$('[data-bag-count]').forEach(element => element.textContent = count);
    $$('button.bag-button').forEach(button => button.setAttribute('aria-label', `Open your enquiry bag, ${count} item${count === 1 ? '' : 's'}`));
    $('#bag-footer').hidden = !bag.length;
    $('#order-note').value = orderNote;
    $('#bag-unit-count').textContent = `${count} item${count === 1 ? '' : 's'}`;
    $('#bag-selection-count').textContent = `${selections} style${selections === 1 ? '' : 's'}`;
    $('#bag-sticky-summary').textContent = `${count} item${count === 1 ? '' : 's'} in your bag`;
    if (!bag.length) {
      $('#bag-items').innerHTML = `<div class="empty-bag">${icon('bag')}<h3>A little room for lovely things.</h3><p>Explore the collection and add the pieces or inspiration you love. We’ll confirm actual availability with you.</p><button class="button button-rust" type="button" data-browse-styles>Explore the collection ${icon('arrow')}</button></div>`;
      $('#bag-sticky-action').hidden = true;
      return;
    }
    $('#bag-sticky-action').hidden = false;
    $('#bag-items').innerHTML = bag.map((item, index) => {
      const product = byId.get(item.id);
      const sizeOptions = sizes.map(size => `<option value="${escape(size)}" ${item.size === size ? 'selected' : ''}>${escape(size)}</option>`).join('');
      return `<article class="bag-item" data-bag-index="${index}">
        <button class="bag-item-image" type="button" data-product="${escape(product.id)}" aria-label="View ${escape(product.name)}">
          <img src="${escape(product.image)}" alt="${escape(product.imageAlt)}" width="79" height="106" loading="lazy" decoding="async">
        </button>
        <div class="bag-item-content">
          <div class="bag-item-heading"><div><p class="bag-item-kicker">STYLE ${String(index + 1).padStart(2,'0')}</p><h3>${escape(product.cardName || product.name)}</h3></div><button class="bag-remove" type="button" data-remove="${index}" aria-label="Remove ${escape(product.name)}, size ${escape(item.size)}, from your bag">Remove</button></div>
          <p class="bag-item-meta">${escape(product.color)} · ${escape(product.category)}${isUnavailable(product) ? ` · ${escape(availabilityLabel(product))}` : ''}</p>
          <div class="bag-item-controls">
            <label class="bag-size-control"><span>Size</span><select data-bag-size="${index}" aria-label="Requested size for ${escape(product.name)}">${sizeOptions}</select></label>
            <div class="bag-quantity-control"><span class="quantity-label">Qty</span><div class="quantity-controls" role="group" aria-label="Requested quantity for ${escape(product.name)}, size ${escape(item.size)}"><button type="button" data-quantity="${index}" data-change="-1" aria-label="Decrease quantity for ${escape(product.name)}" ${item.quantity <= 1 ? 'disabled' : ''}>${icon('minus')}</button><span class="quantity-value" aria-live="polite">${item.quantity}</span><button type="button" data-quantity="${index}" data-change="1" aria-label="Increase quantity for ${escape(product.name)}" ${item.quantity >= maxQuantity ? 'disabled' : ''}>${icon('plus')}</button></div></div>
          </div>
          <div class="bag-item-bottom"><span>${escape(priceText(product))}</span><span>${escape(imageTypeLabel(primaryImageKind(product)))}</span></div>
        </div>
      </article>`;
    }).join('') + '<button class="clear-bag" type="button" data-clear-bag>Clear entire bag</button>';
    $('#bag-summary').textContent = `${count} requested item${count === 1 ? '' : 's'} · ${selections} selection${selections === 1 ? '' : 's'}`;
    $('.bag-disclaimer').textContent = `V26 checkout is simulated for testing; no real money can be charged.${bag.some(item => byId.get(item.id).isPreview) ? ' Preview styles are not confirmed stock.' : ''}${bag.some(item => primaryImageKind(byId.get(item.id)) === 'ai-model') ? ' AI-modelled views illustrate styling; actual fit may differ.' : ''}${storageAvailable ? '' : ' This preview cannot save your bag between visits.'} Need help? WhatsApp stays available for questions.`;
    updateWhatsAppLinks();
    updateCheckoutActions();
  }

  $('#bag-items').addEventListener('change', event => {
    const sizeSelect = event.target.closest('[data-bag-size]');
    if (!sizeSelect) return;
    const index = Number(sizeSelect.dataset.bagSize);
    const nextSize = sizeSelect.value;
    if (!bag[index] || !sizes.includes(nextSize)) return;
    const duplicate = bag.findIndex((item, itemIndex) => itemIndex !== index && item.id === bag[index].id && item.size === nextSize);
    if (duplicate >= 0) {
      bag[duplicate].quantity = Math.min(maxQuantity, bag[duplicate].quantity + bag[index].quantity);
      bag.splice(index, 1);
    } else {
      bag[index].size = nextSize;
    }
    saveBag();
    renderBag();
    $(`[data-bag-size="${Math.min(index, bag.length - 1)}"]`)?.focus({ preventScroll: true });
  });

  $('#bag-items').addEventListener('click', event => {
    const quantityButton = event.target.closest('[data-quantity]');
    const removeButton = event.target.closest('[data-remove]');
    const clearButton = event.target.closest('[data-clear-bag]');
    const browseButton = event.target.closest('[data-browse-styles]');
    if (browseButton) {
      $('#bag-dialog').close();
      $('#collection').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      $('.filter-button').focus({ preventScroll: true });
      return;
    }
    if (quantityButton) {
      const index = Number(quantityButton.dataset.quantity);
      const change = Number(quantityButton.dataset.change);
      if (!bag[index]) return;
      bag[index].quantity = Math.min(maxQuantity, Math.max(1, bag[index].quantity + change));
      saveBag();
      renderBag();
      // Keep keyboard focus after the quantity controls have re-rendered.
      const replacement = $(`[data-quantity="${index}"][data-change="${change}"]`);
      if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
      else $(`[data-quantity="${index}"][data-change="${-change}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (removeButton) {
      const index = Number(removeButton.dataset.remove);
      bag.splice(index, 1);
      if (!bag.length) orderNote = '';
      saveBag();
      renderBag();
      ($('[data-remove]') || $('[data-browse-styles]'))?.focus({ preventScroll: true });
    }
    if (clearButton) {
      bag = [];
      orderNote = '';
      saveBag();
      renderBag();
      $('[data-browse-styles]')?.focus({ preventScroll: true });
    }
  });

  $('#order-note').addEventListener('input', event => {
    orderNote = event.target.value.slice(0, 500);
    saveBag();
    updateWhatsAppLinks();
  });

  $('#bag-checkout')?.addEventListener('click', proceedToCheckout);
  $('#bag-checkout-mobile')?.addEventListener('click', proceedToCheckout);

  // Keep separate tabs in step without sending anything to a server.
  window.addEventListener('storage', event => {
    if (event.key === commerce?.STORAGE_KEY) {
      if (bag.length) updateCheckoutActions();
      return;
    }
    if (event.key !== storageKey) return;
    try {
      const saved = JSON.parse(event.newValue || 'null');
      bag = saved && Array.isArray(saved.items) ? saved.items.slice(0, maxSelections).filter(item => item && byId.has(item.id) && sizes.includes(item.size) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= maxQuantity) : [];
      orderNote = bag.length && typeof saved.note === 'string' ? saved.note.slice(0, 500) : '';
      renderBag();
    } catch (_) { /* Leave the current selection intact if saved data is invalid. */ }
  });

  // Prevent a broken-image icon if a file is accidentally omitted on upload.
  // This local, original SVG fallback has no external dependencies.
  const imageFallback = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#eeece3"/><path d="M300 500V350m0 70c-65 0-100-40-100-70 60-5 90 25 100 70Zm0-55c65 0 100-40 100-70-60-5-90 25-100 70Z" fill="none" stroke="#9aa48b" stroke-width="3"/><text x="300" y="565" text-anchor="middle" fill="#45533f" font-family="Georgia,serif" font-size="38">A little beauty, coming soon.</text><text x="300" y="610" text-anchor="middle" fill="#6c7065" font-family="Arial,sans-serif" font-size="18">Please ask us for current photographs.</text></svg>');
  document.addEventListener('error', event => {
    const image = event.target;
    if (image instanceof HTMLImageElement && !image.dataset.fallback) {
      image.dataset.fallback = 'true';
      image.src = imageFallback;
    }
  }, true);

  const hasPreviewProducts = products.some(product => product.isPreview);
  const hasModelledProducts = products.some(product => primaryImageKind(product) === 'ai-model');
  $$('[data-collection-preview-note]').forEach(note => note.hidden = !hasPreviewProducts && !hasModelledProducts);
  $$('[data-imagery-note]').forEach(note => note.hidden = !config.imageryIsIllustrative);
  const collectionNote = $('#collection-image-note');
  if (collectionNote) collectionNote.textContent = hasPreviewProducts
    ? 'AI model views illustrate styling. Style-preview cards are concepts, not confirmed stock.'
    : 'AI model views illustrate styling. Please confirm actual garment details and sizes with us.';
  $('#stock-faq-answer').textContent = hasPreviewProducts
    ? 'AI model views illustrate styling, not exact garment fit. Items identified as “Style preview” are concepts, not confirmed stock. Please confirm actual pieces, prices and measurements on WhatsApp.'
    : `${hasModelledProducts ? 'The collection is based on photographs supplied by Sutras. Product pages currently show the modelled view only, which illustrates styling rather than exact fit. ' : ''}Please confirm current availability, prices and garment measurements on WhatsApp before ordering.`;
  const imageryNotes = [];
  if (hasModelledProducts) imageryNotes.push('AI model views are generated illustrations, not photographs of a model wearing the actual garment. Fit, length, drape and small details are approximate.');
  if (products.some(product => Array.isArray(product.gallery) && product.gallery.some(photo => photo && photo.kind === 'ai-detail'))) imageryNotes.push('Some product pages include AI-generated detail views based on the modelled garment, intended to show design details rather than replace confirmed product photography.');
  if (hasPreviewProducts) imageryNotes.push('Items identified as “Style preview” are concept examples, not confirmed stock.');
  if (config.imageryIsIllustrative) imageryNotes.push('The campaign and moodboard also use illustrative imagery.');
  imageryNotes.push('Please confirm the real garment details before ordering.');
  $('#imagery-info').textContent = imageryNotes.join(' ');
  $('#year').textContent = new Date().getFullYear();
  renderProducts();
  renderBag();
  const initialParams = new URLSearchParams(window.location.search);
  if (initialParams.get('bag') === 'open') {
    openDialog('bag-dialog');
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('bag');
    history.replaceState(history.state, '', cleanUrl.href);
  } else if (productQuery() !== null) {
    openProductFromAddress(true);
  }
})();
