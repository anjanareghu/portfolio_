// A single preference coordinates every non-essential motion system.
(() => {
  'use strict';
  const root = document.documentElement;
  const button = document.getElementById('motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = sessionStorage.getItem('anjana:motion-paused') === '1'; } catch (_) {}
  window.PortfolioMotion = { get disabled() { return paused || reduced.matches; } };
  function update(preservePosition = false) {
    const section = preservePosition ? document.elementFromPoint(innerWidth / 2, innerHeight * .35)?.closest('main > section') : null;
    const anchor = section?.id === 'recognition' ? section.querySelector('.recognition-entry.is-current') || section : section;
    const top = anchor?.getBoundingClientRect().top;
    const disabled = window.PortfolioMotion.disabled;
    root.classList.toggle('motion-disabled', disabled);
    if (button) {
      button.hidden = false;
      button.disabled = reduced.matches;
      button.setAttribute('aria-pressed', String(disabled));
      button.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your system preference' : paused ? 'Resume non-essential motion' : 'Pause non-essential motion');
      button.textContent = reduced.matches ? 'Motion reduced' : paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
    }
    document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { disabled } }));
    if (anchor) requestAnimationFrame(() => window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' }));
  }
  button?.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('anjana:motion-paused', paused ? '1' : '0'); } catch (_) {}
    update(true);
  });
  reduced.addEventListener('change', () => update(true));
  update();
})();
