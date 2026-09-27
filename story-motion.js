// Scroll-driven typography and section landmarks. Content stays readable at rest.
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)');
  const disabled = () => reduced.matches || !!window.PortfolioMotion?.disabled;
  const clamp = value => Math.max(0, Math.min(1, value));
  const sections = [...document.querySelectorAll('main > section[id]:not(#home)')];
  const groups = [], visible = new Set();
  let frame = 0;

  sections.forEach(section => {
    section.classList.add('story-section');
    const host = section.classList.contains('wrap') ? section : section.querySelector('.wrap');
    if (!host) return;
    host.classList.add('story-host');
    const anchor = document.createElement('span');
    anchor.className = 'character-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    host.append(anchor);
    const line = document.createElement('span');
    line.className = 'scene-divider';
    line.setAttribute('aria-hidden', 'true');
    host.append(line);
    groups.push({ element: host, section: true });
  });

  const selector = [
    'h2', 'h3', '.about-profile > p', '.capability-group p', '.project-card p',
    '.research-description', '.internship-description', '.recognition-description',
    '.recognition-heading > p', '.contact-intro > p', '.community-note',
    '.section-index', '.research-meta', '.profile-facts > span',
    '.profile-evidence strong', '.profile-evidence small', '.section-count',
    '.capability-group > .mono', '.recognition-topline', '.internship-date',
    '.community-entry .mono', '.education-block .mono', '.contact-email > .mono',
  ].join(',');
  sections.forEach(section => section.querySelectorAll(selector).forEach(element => {
    if (element.closest('[hidden], dialog') || element.closest('.story-text')) return;
    const heading = /^H[23]$/.test(element.tagName);
    const letters = heading && !element.querySelector('a');
    const label = !heading && element.classList.contains('mono');
    const split = !mobile.matches && (heading || element.tagName === 'P');
    element.classList.add('story-text');
    if (label) element.classList.add('story-label');
    if (split) {
      // Retain links, whitespace and line breaks; only replace their text nodes.
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const units = [];
      if (letters) element.setAttribute('aria-label', element.innerText.replace(/\s+/g, ' ').trim());
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(word => {
          if (!word || /^\s+$/.test(word)) { fragment.append(document.createTextNode(word)); return; }
          const wrap = document.createElement('span');
          wrap.className = 'story-word';
          if (letters) {
            wrap.setAttribute('aria-hidden', 'true');
            for (const letter of word) {
              const unit = document.createElement('span');
              unit.className = 'story-unit'; unit.textContent = letter;
              units.push(unit); wrap.append(unit);
            }
          } else { wrap.classList.add('story-unit'); wrap.textContent = word; units.push(wrap); }
          fragment.append(wrap);
        });
        node.replaceWith(fragment);
      });
      units.forEach((unit, index) => unit.style.setProperty('--unit-delay', String(index / Math.max(1, units.length - 1) * .24)));
      element.classList.add('story-split');
    }
    groups.push({ element, section: false });
  }));

  function render() {
    frame = 0;
    root.classList.toggle('story-motion', !disabled());
    root.classList.toggle('story-light', mobile.matches);
    if (disabled() || document.hidden) return;
    // All reads precede writes. Only currently visible groups are processed.
    const updates = [...visible].map(group => {
      const bounds = group.element.getBoundingClientRect();
      const previous = Number(group.element.style.getPropertyValue('--story-progress') || 1);
      const translated = !group.section && (mobile.matches || (!group.element.classList.contains('story-split') && !group.element.classList.contains('story-label')));
      const offset = translated ? (1 - previous) * (mobile.matches ? 3 : 6) : 0;
      const progress = clamp((innerHeight * .97 - bounds.top + offset) / (innerHeight * (mobile.matches ? .18 : .32)));
      return { group, progress };
    });
    updates.forEach(({ group, progress }) => group.element.style.setProperty(group.section ? '--section-progress' : '--story-progress', String(progress)));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const group = groups.find(item => item.element === entry.target);
        if (entry.isIntersecting) visible.add(group);
        else { visible.delete(group); group.element.style.setProperty(group.section ? '--section-progress' : '--story-progress', '1'); }
      });
      schedule();
    }, { rootMargin: '32px 0px' });
    groups.forEach(group => observer.observe(group.element));
  } else groups.forEach(group => visible.add(group));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('portfolio:motion', schedule);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  mobile.addEventListener('change', schedule);
  // Added anchors are decorative and absolutely positioned: no layout runway.
  document.dispatchEvent(new CustomEvent('portfolio:layout'));
  schedule();
})();
