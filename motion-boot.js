// Run before first paint. The page always fails open if enhancement cannot load.
(() => {
  const root = document.documentElement;
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('anjana:motion-paused') === '1' || location.hash ||
        sessionStorage.getItem('anjana:introduced:v2') || scrollY > 0) return;
  } catch (_) { return; }
  root.classList.add('intro-pending');
  window.portfolioIntroFallback = setTimeout(() => {
    root.classList.remove('intro-pending', 'intro-landing');
    document.querySelectorAll('[data-intro-inert]').forEach(element => {
      element.inert = false;
      element.removeAttribute('data-intro-inert');
    });
    window.portfolioCharacter?.endIntro();
    document.dispatchEvent(new Event('portfolio:intro-skip'));
  }, 2400);
})();
