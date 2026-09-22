// Native scroll and a shared easing curve; no animation framework or scroll hijack.
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => 1 - Math.pow(1 - value, 4);
  const hero = document.getElementById('home');
  const work = document.getElementById('work');
  const scene = hero.querySelector('.hero-scene');
  const title = document.getElementById('hero-title');
  const source = document.createElement('div');
  source.className = 'hero-title-source';
  // Keep the untouched text as the resting state, including its exact kerning.
  while (title.firstChild) source.append(title.firstChild);
  title.setAttribute('aria-label', source.textContent);
  const letterLayer = document.createElement('div');
  letterLayer.className = 'hero-letter-layer';
  letterLayer.setAttribute('aria-hidden', 'true');
  title.append(source, letterLayer);
  const letters = [];
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (let index = 0; index < node.length; index++) {
      const glyph = document.createElement('span');
      glyph.className = 'hero-letter' + (node.data[index] === '.' ? ' hero-letter--period' : '');
      glyph.textContent = node.data[index];
      letterLayer.append(glyph);
      letters.push({ node, index, glyph });
    }
  }
  const headings = [...document.querySelectorAll('main section h2')].map(element => {
    element.setAttribute('data-motion-heading', '');
    return { element, top: 0 };
  });
  const loader = document.querySelector('.intro-screen');
  let introFrame = 0, introDone = !root.classList.contains('intro-pending');
  let target = 25, displayed = 0, readyAt = null, landingAt = null, previous = 0;
  const protectedElements = [...document.querySelectorAll('.skip-link, .site-header, main, .site-footer, .assistant-launcher')];

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    cancelAnimationFrame(introFrame);
    clearTimeout(window.portfolioIntroFallback);
    const restoreFocus = loader.contains(document.activeElement);
    root.classList.remove('intro-pending', 'intro-landing');
    protectedElements.forEach(element => { element.inert = false; element.removeAttribute('data-intro-inert'); });
    window.portfolioCharacter?.endIntro();
    try { sessionStorage.setItem('anjana:introduced:v2', '1'); } catch (_) { /* Storage is optional. */ }
    if (restoreFocus) {
      const heading = document.getElementById('hero-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
    }
    measure();
  }

  function introTick(now) {
    if (introDone) return;
    const dt = Math.min(50, previous ? now - previous : 16);
    previous = now;
    // Ease only toward completed readiness milestones, never invented progress.
    displayed += (target - displayed) * (1 - Math.exp(-dt / 55));
    if (target - displayed < .7) displayed = target;
    loader.querySelector('.intro-count').textContent = String(Math.floor(displayed));
    if (displayed === 100 && readyAt === null) readyAt = now;
    if (readyAt !== null && now - readyAt >= 90 && landingAt === null) {
      landingAt = now;
      root.classList.add('intro-landing');
    }
    const landing = landingAt === null ? 0 : clamp((now - landingAt) / 1050);
    loader.style.setProperty('--intro-cover', String(1 - ease(clamp(landing / .75))));
    window.portfolioCharacter?.setIntro(displayed / 100, ease(landing));
    if (landing === 1) { finishIntro(); return; }
    introFrame = requestAnimationFrame(introTick);
  }

  if (!introDone) {
    protectedElements.forEach(element => { element.inert = true; element.setAttribute('data-intro-inert', ''); });
    window.portfolioCharacter?.setIntro(0, 0);
    // The character has a synchronous CSS fallback, so it never blocks the page.
    target += 40;
    // Font readiness is bounded: proceed using the existing system-font fallback.
    let fontTimer;
    Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(resolve => { fontTimer = setTimeout(resolve, 700); }),
    ]).then(() => { clearTimeout(fontTimer); target = 100; });
    introFrame = requestAnimationFrame(introTick);
    loader.querySelector('button').addEventListener('click', finishIntro);
  }
  document.addEventListener('portfolio:intro-skip', finishIntro);
  window.addEventListener('pagehide', finishIntro);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') finishIntro(); });

  // Native sticky positioning provides the runway. Scroll is the only timeline.
  let scrollFrame = 0, heroStart = 0, heroRange = 1, pinned = false;
  let openingSignature = '';
  function measure() {
    heroStart = hero.getBoundingClientRect().top + scrollY;
    const sceneHeight = scene.offsetHeight;
    pinned = !reduced.matches && fine.matches && innerWidth > 1000 && sceneHeight + 20 <= innerHeight;
    heroRange = pinned ? Math.round(innerHeight * .95) : Math.max(1, sceneHeight * .8);
    root.style.setProperty('--hero-scene-height', `${sceneHeight}px`);
    root.style.setProperty('--hero-runway', `${heroRange}px`);
    root.style.setProperty('--hero-overlap', `${Math.min(180, sceneHeight * .22)}px`);
    root.classList.toggle('opening-pinned', pinned);
    // Ranges measure the original shaped text; the resting title is never split.
    const titleBounds = title.getBoundingClientRect();
    letters.forEach(({ node, index, glyph }) => {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      glyph.style.left = `${range.getBoundingClientRect().left - titleBounds.left}px`;
    });
    headings.forEach(heading => {
      // Subtract our own transform from measurement to prevent cumulative drift.
      const offset = parseFloat(heading.element.style.getPropertyValue('--heading-y')) || 0;
      heading.top = heading.element.getBoundingClientRect().top + scrollY - offset;
    });
    const signature = `${pinned}:${heroStart}:${heroRange}:${sceneHeight}`;
    if (signature !== openingSignature) {
      openingSignature = signature;
      window.portfolioCharacter?.setOpening({ enabled: pinned, start: heroStart, range: heroRange });
      document.dispatchEvent(new CustomEvent('portfolio:opening-layout'));
    }
    scheduleScroll();
  }
  function renderScroll() {
    scrollFrame = 0;
    root.classList.toggle('motion-ready', !reduced.matches && introDone);
    if (reduced.matches || !introDone) return;
    const progress = clamp((scrollY - heroStart) / heroRange);
    title.classList.toggle('hero-letters-active', progress > 0);
    const travel = [30, 45, 20, 55, 36, 48, 25, 42, 32];
    letters.forEach(({ glyph }, index) => {
      const amount = fine.matches ? 1 : .45;
      glyph.style.setProperty('--letter-x', `${(index - (letters.length - 1) / 2) * progress * 2 * amount}px`);
      glyph.style.setProperty('--letter-y', `${-progress * travel[index % travel.length] * amount}px`);
      glyph.style.setProperty('--letter-scale', String(1 - progress * .025));
      glyph.style.setProperty('--letter-clip', `${clamp((progress - .5 - index * .018) / .32) * 100}%`);
    });
    hero.style.setProperty('--hero-copy-y', `${-progress * 24}px`);
    hero.style.setProperty('--hero-copy-clip', `${clamp((progress - .12) / .45) * 100}%`);
    headings.forEach(({ element, top }) => {
      const entry = clamp((top - scrollY - innerHeight * .65) / (innerHeight * .3));
      element.style.setProperty('--heading-y', `${entry * (fine.matches ? 28 : 12)}px`);
      element.style.setProperty('--heading-clip', `${entry * 100}%`);
    });
  }
  function scheduleScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll); }
  window.addEventListener('scroll', () => {
    if (!introDone && scrollY > 8) finishIntro();
    scheduleScroll();
  }, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  fine.addEventListener('change', measure);
  document.addEventListener('portfolio:layout', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  if (document.fonts) document.fonts.ready.then(measure);
  reduced.addEventListener('change', () => { if (reduced.matches) finishIntro(); measure(); });

  // The original sentences and project links remain usable without JavaScript.
  const statement = document.querySelector('.about-profile p');
  const phrases = [...statement.querySelectorAll('.about-phrase')];
  const preview = document.createElement('div');
  preview.className = 'about-preview';
  preview.id = 'about-preview';
  const cards = phrases.map(phrase => {
    const figure = document.createElement('figure');
    figure.className = 'about-preview-card';
    const img = document.createElement('img');
    img.src = phrase.dataset.image;
    img.alt = phrase.dataset.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.className = 'mono';
    caption.textContent = phrase.dataset.project;
    const link = document.createElement('a');
    link.href = phrase.getAttribute('href');
    link.textContent = 'View project ↗';
    link.className = 'about-preview-link';
    link.addEventListener('click', () => {
      document.getElementById(phrase.dataset.tab)?.click();
      hidePreview();
    });
    caption.append(link);
    figure.append(img, caption);
    preview.append(figure);
    return figure;
  });
  let active = null, previewFrame = 0, hideTimer = 0, lastTime = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const floating = () => fine.matches && !reduced.matches;
  function hidePreview() {
    clearTimeout(hideTimer);
    active = null;
    phrases.forEach(phrase => {
      phrase.classList.remove('is-active');
      phrase.removeAttribute('aria-describedby');
      if (!floating()) phrase.setAttribute('aria-expanded', 'false');
    });
    cards.forEach(card => {
      card.classList.remove('is-current');
      card.setAttribute('aria-hidden', 'true');
      card.inert = true;
    });
    preview.classList.remove('is-visible');
    cancelAnimationFrame(previewFrame);
    previewFrame = 0;
  }
  function arrangePreview() {
    hidePreview();
    preview.classList.toggle('is-inline', !floating());
    phrases.forEach(phrase => {
      if (floating()) {
        phrase.removeAttribute('role'); phrase.removeAttribute('aria-expanded'); phrase.removeAttribute('aria-controls');
      } else {
        phrase.setAttribute('role', 'button'); phrase.setAttribute('aria-expanded', 'false'); phrase.setAttribute('aria-controls', preview.id);
      }
    });
    if (floating()) document.body.append(preview);
    else statement.after(preview);
  }
  function positionPreview(phrase, point) {
    const bounds = phrase.getBoundingClientRect();
    const width = preview.offsetWidth, height = preview.offsetHeight;
    // Keep the image below/above the entire phrase, not on top of its text.
    targetX = Math.max(16, Math.min(innerWidth - width - 16, (point?.clientX ?? bounds.left) + 22));
    targetY = bounds.bottom + 16;
    if (targetY + height > innerHeight - 16) targetY = Math.max(16, bounds.top - height - 16);
  }
  function movePreview(now) {
    previewFrame = 0;
    if (!active || !floating()) return;
    const dt = Math.min(50, lastTime ? now - lastTime : 16);
    lastTime = now;
    const amount = 1 - Math.exp(-dt / 75);
    x += (targetX - x) * amount;
    y += (targetY - y) * amount;
    preview.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (Math.abs(x - targetX) + Math.abs(y - targetY) > .2) previewFrame = requestAnimationFrame(movePreview);
  }
  function showPreview(phrase, event) {
    clearTimeout(hideTimer);
    const wasVisible = !!active;
    active = phrase;
    const selected = phrases.indexOf(phrase);
    phrases.forEach((item, index) => {
      item.classList.toggle('is-active', index === selected);
      if (index === selected) item.setAttribute('aria-describedby', `about-preview-${index}`);
      else item.removeAttribute('aria-describedby');
      if (!floating()) item.setAttribute('aria-expanded', String(index === selected));
      cards[index].id = `about-preview-${index}`;
      cards[index].inert = index !== selected || floating();
      cards[index].setAttribute('aria-hidden', String(index !== selected));
      cards[index].classList.toggle('is-current', index === selected);
    });
    preview.classList.add('is-visible');
    if (floating()) {
      positionPreview(phrase, event);
      if (!wasVisible) { x = targetX; y = targetY; lastTime = 0; }
      if (!previewFrame) previewFrame = requestAnimationFrame(movePreview);
    }
  }
  function leavePreview() {
    clearTimeout(hideTimer);
    // Brief grace period lets neighbouring phrases crossfade without a blank gap.
    hideTimer = setTimeout(() => {
      if (phrases.includes(document.activeElement)) showPreview(document.activeElement);
      else if (preview.contains(document.activeElement)) return;
      else hidePreview();
    }, 130);
  }
  phrases.forEach(phrase => {
    phrase.addEventListener('pointerenter', event => { if (floating() && event.pointerType !== 'touch') showPreview(phrase, event); });
    phrase.addEventListener('pointermove', event => {
      if (active !== phrase || !floating() || event.pointerType === 'touch') return;
      positionPreview(phrase, event);
      if (!previewFrame) previewFrame = requestAnimationFrame(movePreview);
    }, { passive: true });
    phrase.addEventListener('pointerleave', () => { if (floating()) leavePreview(); });
    phrase.addEventListener('focus', () => showPreview(phrase));
    phrase.addEventListener('blur', leavePreview);
    phrase.addEventListener('keydown', event => {
      if (!floating() && event.key === ' ') { event.preventDefault(); showPreview(phrase); }
    });
    phrase.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (!floating()) { event.preventDefault(); showPreview(phrase); return; }
      document.getElementById(phrase.dataset.tab)?.click();
      hidePreview();
    });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePreview(); });
  document.addEventListener('pointerdown', event => { if (!statement.contains(event.target) && !preview.contains(event.target)) hidePreview(); });
  window.addEventListener('scroll', () => { if (floating()) hidePreview(); }, { passive: true });
  window.addEventListener('blur', hidePreview);
  window.addEventListener('resize', arrangePreview, { passive: true });
  fine.addEventListener('change', arrangePreview);
  reduced.addEventListener('change', arrangePreview);
  arrangePreview();
  measure();
})();
