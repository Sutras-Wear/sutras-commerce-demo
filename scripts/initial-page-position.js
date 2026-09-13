(() => {
    let interacted = false;
    const sectionHashes = new Set(['#top', '#main', '#style-finder', '#collection', '#story', '#cotton', '#community', '#how-to-order', '#contact']);
    function prepareVisit() {
      try {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        // Old shared/bookmarked section links should not jump past the hero on
        // arrival. In-page menu clicks happen later and keep working normally.
        if (sectionHashes.has(location.hash)) {
          const url = new URL(location.href);
          url.hash = '';
          history.replaceState(history.state, '', url.href);
        }
      } catch (_) { /* Restricted file previews may deny History API access. */ }
    }
    function startAtTop() {
      if (interacted) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previous;
    }
    for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
      window.addEventListener(event, () => { interacted = true; }, { capture: true, passive: true });
    }
    prepareVisit();
    startAtTop();
    document.addEventListener('DOMContentLoaded', () => {
      startAtTop();
      requestAnimationFrame(startAtTop);
    }, { once: true });
    window.addEventListener('load', () => {
      startAtTop();
      requestAnimationFrame(startAtTop);
    }, { once: true });
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        interacted = false;
        prepareVisit();
      }
      startAtTop();
      requestAnimationFrame(startAtTop);
    });
  })();