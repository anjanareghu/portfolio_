// Native page scrolling drives the stack. No wheel/touch interception or timers.
(() => {
  'use strict';
  const gallery = document.getElementById('recognition-gallery');
  if (!gallery) return;
  const stage = gallery.querySelector('.recognition-stage');
  const entries = [...gallery.querySelectorAll('.recognition-entry')];
  const progress = gallery.querySelector('.recognition-progress');
  const current = progress.querySelector('[data-recognition-current]');
  progress.querySelector('[data-recognition-total]').textContent = String(entries.length).padStart(2, '0');
  const hint = progress.querySelector('[data-recognition-hint]');
  const viewToggle = document.querySelector('.recognition-view-toggle');
  const desktop = matchMedia('(min-width: 1001px) and (min-height: 650px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const rotations = [-2, 2.5, -3, 1.5];
  let enabled = false, listPreferred = false, frame = 0;
  let start = 0, step = 1, activeIndex = -1;
  let exitDistance = 0;

  // Warm the covered layers before the stack arrives; browser lazy loading can
  // otherwise leave a newly revealed photograph blank for its first frame.
  function preparePhotos() {
    gallery.querySelectorAll('img').forEach(photo => { photo.loading = 'eager'; });
  }
  if ('IntersectionObserver' in window) {
    const photoObserver = new IntersectionObserver(records => {
      if (enabled && records.some(record => record.isIntersecting)) {
        preparePhotos();
        photoObserver.disconnect();
      }
    }, { rootMargin: '100% 0px' });
    photoObserver.observe(gallery);
  }

  function render() {
    frame = 0;
    if (!enabled) return;
    // A short hold at both ends makes the first and last stories easy to read.
    const position = Math.max(0, Math.min(entries.length - 1, (scrollY - start) / step - 0.28));
    const active = Math.min(entries.length - 1, Math.floor(position + 0.55));
    entries.forEach((entry, index) => {
      const departure = index === entries.length - 1 ? 0 : ease(clamp(position - index));
      const arrival = ease(clamp(position - index + 1));
      const depth = Math.min(3, Math.max(0, index - position));
      const rotation = rotations[index % rotations.length] * (1 - arrival) - 1 * arrival - departure * 10;
      const scale = 1 - Math.min(0.08, depth * 0.04);
      const x = -exitDistance * departure + depth * 10;
      const y = depth * 11 - departure * 70;
      const imageOpacity = 1 - ease(clamp((departure - 0.65) / 0.35));
      entry.style.setProperty('--photo-x', `${x.toFixed(2)}px`);
      entry.style.setProperty('--photo-y', `${y.toFixed(2)}px`);
      entry.style.setProperty('--photo-rotation', `${rotation.toFixed(2)}deg`);
      entry.style.setProperty('--photo-scale', scale.toFixed(4));
      entry.style.setProperty('--photo-opacity', imageOpacity.toFixed(4));
      const incoming = index === 0 ? 1 : ease(clamp((position - index + 0.45) / 0.30));
      const outgoing = index === entries.length - 1 ? 0 : ease(clamp((position - index - 0.25) / 0.30));
      entry.style.setProperty('--copy-opacity', (incoming * (1 - outgoing)).toFixed(4));
      entry.style.setProperty('--copy-y', `${((1 - incoming) * 16 - outgoing * 16).toFixed(2)}px`);
    });
    if (active !== activeIndex) {
      activeIndex = active;
      entries.forEach((entry, index) => {
        const selected = index === active;
        entry.classList.toggle('is-current', selected);
        entry.inert = !selected;
        // All content remains normal HTML; inactive stack layers are not focusable.
        if (selected) entry.removeAttribute('aria-hidden');
        else entry.setAttribute('aria-hidden', 'true');
      });
      current.textContent = String(active + 1).padStart(2, '0');
      hint.textContent = active === entries.length - 1 ? 'More ahead ↓' : 'Scroll to explore ↓';
    }
    progress.style.setProperty('--story-progress', String((position + 1) / entries.length));
  }

  function schedule() {
    if (enabled && !frame) frame = requestAnimationFrame(render);
  }

  function measure() {
    if (!enabled) return;
    step = Math.max(620, innerHeight * 0.85);
    gallery.style.setProperty('--story-runway', `${stage.offsetHeight + step * (entries.length - 1 + 0.56)}px`);
    start = gallery.getBoundingClientRect().top + scrollY;
    // Measure layout width, not the currently transformed photograph bounds.
    exitDistance = gallery.getBoundingClientRect().left + Math.max(...entries.map(entry => {
      const photo = entry.querySelector('.recognition-media');
      return photo.offsetLeft + photo.offsetWidth * 1.3;
    })) + 70;
    render();
  }

  function configure() {
    const wasEnabled = enabled;
    enabled = desktop.matches && !reduced.matches && !window.PortfolioMotion?.disabled && !listPreferred;
    gallery.classList.toggle('is-scroll-story', enabled);
    progress.hidden = !enabled;
    viewToggle.hidden = !desktop.matches || reduced.matches || !!window.PortfolioMotion?.disabled;
    viewToggle.textContent = listPreferred ? 'View as stack' : 'View as list';
    viewToggle.setAttribute('aria-pressed', String(listPreferred));
    activeIndex = -1;
    if (enabled) {
      entries.forEach((entry, index) => entry.style.setProperty('--stack-order', String(entries.length - index)));
      const bounds = gallery.getBoundingClientRect();
      if (bounds.top < innerHeight * 2 && bounds.bottom > -innerHeight) preparePhotos();
      measure();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      gallery.style.removeProperty('--story-runway');
      entries.forEach(entry => {
        entry.removeAttribute('style');
        entry.classList.remove('is-current');
        entry.removeAttribute('aria-hidden');
        entry.inert = false;
      });
    }
    if (enabled !== wasEnabled) document.dispatchEvent(new CustomEvent('portfolio:layout'));
  }

  viewToggle.addEventListener('click', () => {
    listPreferred = !listPreferred;
    configure();
    gallery.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { configure(); }, { passive: true });
  desktop.addEventListener('change', configure);
  reduced.addEventListener('change', configure);
  document.addEventListener('portfolio:motion', configure);
  document.addEventListener('portfolio:layout', measure);
  document.addEventListener('portfolio:opening-layout', measure);
  window.addEventListener('load', measure);
  document.addEventListener('portfolio:recognition', event => {
    const entry = entries.find(item => item.id === `recognition-${event.detail?.id}`);
    if (!entry) return;
    const behavior = event.detail.behavior === 'instant' || reduced.matches || window.PortfolioMotion?.disabled ? 'instant' : 'smooth';
    if (enabled) {
      measure();
      window.scrollTo({ top: start + step * (entries.indexOf(entry) + 0.28), behavior });
      if (behavior === 'instant') render();
    } else entry.scrollIntoView({ behavior, block: 'start' });
    if (event.detail.focus) {
      const heading = entry.querySelector('h3');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });
  if (document.fonts) document.fonts.ready.then(measure);
  // Observe the stage only; changing the runway height must not create a loop.
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  configure();
})();
