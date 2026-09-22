// Navigation remains usable without JavaScript; only the mobile toggle is enhanced.
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const navLinks = [...nav.querySelectorAll('a')];
const mobileMenu = window.matchMedia('(max-width: 760px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.querySelector('span').textContent = open ? '−' : '+';
  nav.classList.toggle('open', open);
}

document.documentElement.classList.add('js-nav');
menuButton.hidden = false;
setMenu(false);
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
mobileMenu.addEventListener('change', () => setMenu(false));
document.getElementById('year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));
}

// Progressive enhancement: without JavaScript, every project stays visible.
document.querySelectorAll('[data-tabs]').forEach(component => {
  const list = component.querySelector('[data-tab-list]');
  const tabs = [...list.querySelectorAll('button[data-panel]')];
  const panels = tabs.map(tab => document.getElementById(tab.dataset.panel));
  if (!tabs.length || panels.some(panel => !panel)) return;

  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });

  let selectedIndex = -1;
  let panelAnimation;
  function select(index, focus = false) {
    const changed = selectedIndex !== index;
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[tabIndex].hidden = !active;
    });
    if (focus) tabs[index].focus();
    if (changed && selectedIndex !== -1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panelAnimation?.cancel();
      panelAnimation = panels[index].animate?.([
        { opacity: .25, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
    selectedIndex = index;
    // Keep the companion's section anchors in sync with changed panel heights.
    document.dispatchEvent(new CustomEvent('portfolio:layout'));
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next, true);
    });
  });
  select(0);
  list.hidden = false;
});

// A native modal supplies focus containment and Escape dismissal. All milestone
// copy and publication links remain available when JavaScript is disabled.
const storyDialog = document.getElementById('recognition-dialog');
if (storyDialog && typeof storyDialog.showModal === 'function') {
  let storyOpener = null;
  const closeStory = () => storyDialog.close();

  function openStory(entry) {
    storyOpener = entry.querySelector('.story-trigger');
    storyDialog.querySelector('.story-media').replaceChildren(entry.querySelector('.recognition-media').cloneNode(true));
    storyDialog.querySelector('.story-number').textContent = entry.querySelector('.recognition-number').textContent;
    storyDialog.querySelector('#story-title').textContent = entry.querySelector('h3').textContent;
    storyDialog.querySelector('.story-organization').textContent = entry.querySelector('.recognition-organization').textContent;
    storyDialog.querySelector('#story-description').textContent = entry.querySelector('.recognition-story').textContent;
    const source = entry.querySelector('.recognition-source');
    storyDialog.querySelector('.story-source').replaceChildren(...(source ? [source.cloneNode(true)] : []));
    document.documentElement.classList.add('story-open');
    storyDialog.showModal();
    storyDialog.scrollTop = 0;
  }

  document.querySelectorAll('.recognition-entry').forEach(entry => {
    const trigger = entry.querySelector('.story-trigger');
    trigger.hidden = false;
    entry.classList.add('is-interactive');
    trigger.addEventListener('click', () => openStory(entry));
    entry.addEventListener('click', event => {
      if (event.target.closest('a, button') || window.getSelection()?.toString()) return;
      openStory(entry);
    });
  });
  storyDialog.querySelector('.story-close').addEventListener('click', closeStory);
  storyDialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...storyDialog.querySelectorAll('button, a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  storyDialog.addEventListener('close', () => {
    document.documentElement.classList.remove('story-open');
    storyOpener?.focus({ preventScroll: true });
  });
}
