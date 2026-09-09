/* Demo-only controls. GitHub Pages projects share an origin, so never clear storage wholesale. */
(() => {
  'use strict';
  const nav = document.querySelector('.demo-nav');
  if (!nav) return;
  const keys = [
    'sutras-demo-v26-1-commerce-preview-v1',
    'sutras-demo-v26-1-commerce-cart-v1',
    'sutras-demo-v26-1-enquiry-bag-v1',
    'sutras-demo-v26-1-recently-viewed-v1',
    'sutras-demo-v26-1-checkout-prefill-v1'
  ];
  const status = nav.querySelector('[role="status"]');
  const reset = nav.querySelector('[data-reset-demo]');
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
  });
  const url = new URL(location.href);
  if (url.searchParams.get('demo') === 'reset') {
    status.textContent = 'Demo reset. Open Admin to load sample stock and prices.';
    url.searchParams.delete('demo');
    history.replaceState(null, '', url);
  }
  reset.disabled = false;
  reset.addEventListener('click', () => {
    try {
      keys.forEach(key => localStorage.removeItem(key));
      // A new document also discards the simulator's in-memory state.
      location.replace('commerce-preview.html?demo=reset');
    } catch (_) {
      status.textContent = 'Your browser blocked storage access. Allow site storage, then try Reset Demo again.';
    }
  });
})();
