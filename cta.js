// Native download and anchor links remain functional without JavaScript.
(() => {
  'use strict';
  const groups = [...document.querySelectorAll('.hero-cta-group')];
  if (!groups.length) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('.cta-target')];
  const canMove = () => finePointer.matches && !reduced.matches && !window.PortfolioMotion?.disabled;
  const lookAt = target => document.dispatchEvent(new CustomEvent('portfolio:character-look', { detail: { target } }));

  targets.forEach(zone => {
    const link = zone.querySelector('.portfolio-cta');
    let frame = 0, point = null;
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      point = null;
      link.style.removeProperty('--cta-x');
      link.style.removeProperty('--cta-y');
      link.style.removeProperty('--cta-text-x');
      link.style.removeProperty('--cta-text-y');
    }
    function move() {
      frame = 0;
      if (!point || !canMove()) { reset(); return; }
      // The untransformed wrapper is a stable hit area around the magnetic link.
      const rect = zone.getBoundingClientRect();
      const x = (point.x - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (point.y - rect.top - rect.height / 2) / (rect.height / 2);
      const distance = Math.max(1, Math.hypot(x, y));
      const dx = x / distance * 5, dy = y / distance * 5;
      link.style.setProperty('--cta-x', `${dx.toFixed(2)}px`);
      link.style.setProperty('--cta-y', `${dy.toFixed(2)}px`);
      // Counter-translate the contents: total text movement is 65% of the pill.
      link.style.setProperty('--cta-text-x', `${(-dx * 0.35).toFixed(2)}px`);
      link.style.setProperty('--cta-text-y', `${(-dy * 0.35).toFixed(2)}px`);
    }
    zone.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !canMove()) return;
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(move);
    }, { passive: true });
    zone.addEventListener('pointerleave', reset);
    link.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && canMove()) lookAt(link);
    });
    link.addEventListener('pointerleave', () => lookAt(null));
    zone.addEventListener('pointercancel', () => { reset(); lookAt(null); });
    finePointer.addEventListener('change', () => { reset(); lookAt(null); });
    reduced.addEventListener('change', () => { reset(); lookAt(null); });
    document.addEventListener('portfolio:motion', () => { reset(); lookAt(null); });
    window.addEventListener('blur', () => { reset(); lookAt(null); });
  });

  groups.forEach(group => {
  const resume = group.querySelector('.portfolio-cta--resume');
  const status = group.querySelector('.cta-status');
  let successTimer = 0;
  resume.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // The browser owns saving the file; a web page cannot confirm it reached disk.
    // Keep the native download and acknowledge initiation, not unobservable completion.
    clearTimeout(successTimer);
    resume.classList.add('is-downloaded');
    status.textContent = 'Resume download started. Your browser will save the PDF.';
    successTimer = setTimeout(() => {
      resume.classList.remove('is-downloaded');
      status.textContent = '';
    }, 1800);
  });
  });
  const copyButton = document.querySelector('.copy-email');
  const emailLink = document.getElementById('contact-email-address');
  const copyStatus = document.querySelector('.copy-email-status');
  if (copyButton && emailLink && copyStatus && navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    let resetCopy;
    copyButton.addEventListener('click', async () => {
      clearTimeout(resetCopy);
      copyButton.disabled = true;
      try {
        await navigator.clipboard.writeText(emailLink.textContent.trim());
        copyStatus.textContent = 'Email address copied.';
      } catch (_) {
        copyStatus.textContent = 'Select and copy the email address above.';
      } finally {
        copyButton.disabled = false;
        resetCopy = setTimeout(() => { copyStatus.textContent = ''; }, 4000);
      }
    });
  }
})();
