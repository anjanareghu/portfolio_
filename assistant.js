(() => {
  'use strict';
  const source = window.AnjanaPortfolio;
  const panel = document.getElementById('assistant-panel');
  if (!source || !panel || typeof panel.show !== 'function') return;
  const launcher = document.querySelector('.assistant-launcher');
  const trigger = document.getElementById('assistant-trigger');
  const input = document.getElementById('assistant-input');
  const composer = panel.querySelector('.assistant-composer');
  const send = panel.querySelector('.assistant-send');
  const welcome = panel.querySelector('.assistant-welcome');
  const log = panel.querySelector('.assistant-messages');
  const scroll = panel.querySelector('.assistant-scroll');
  const thinking = panel.querySelector('.assistant-thinking');
  const suggestions = panel.querySelector('.assistant-suggestions');
  const reset = panel.querySelector('.assistant-reset');
  const contextQuestion = panel.querySelector('.assistant-context-question');
  const mobile = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('main > section[id]')];
  let context = { section: 'home', entity: null }, contextKey = '';
  let contextPrompt = 'What is Anjana working on?';
  let contextFrame = 0, busy = false, request = 0, previousTopic = null;
  let restoreFocus = true, invitationSeen = false;
  const questions = [
    'What has Anjana built?', "What's her tech stack?", 'Tell me about her experience.',
    'What are her achievements?', 'Where did she study?', 'How can I contact Anjana?',
  ];

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function fitInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(112, Math.max(32, input.scrollHeight))}px`;
    send.disabled = busy || !input.value.trim();
  }
  function viewport() {
    if (!mobile.matches) {
      panel.style.removeProperty('--assistant-height');
      panel.style.removeProperty('--assistant-top');
      return;
    }
    const view = window.visualViewport;
    panel.style.setProperty('--assistant-height', `${Math.max(200, (view?.height || innerHeight) - 16)}px`);
    panel.style.setProperty('--assistant-top', `${(view?.offsetTop || 0) + 8}px`);
  }
  function open() {
    if (panel.open) { dismiss(); return; }
    invitationSeen = true;
    launcher.classList.remove('is-inviting');
    restoreFocus = true;
    viewport();
    panel.setAttribute('aria-modal', String(mobile.matches));
    document.documentElement.classList.toggle('assistant-mobile-open', mobile.matches);
    if (mobile.matches) panel.showModal(); else panel.show();
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Close Ask Anjana portfolio assistant');
    log.setAttribute('aria-live', 'polite');
    updateContext();
    // Leave the mobile keyboard closed until the visitor chooses to type.
    if (mobile.matches) panel.querySelector('.assistant-close').focus();
    else input.focus({ preventScroll: true });
    fitInput();
  }
  function dismiss(returnFocus = true) {
    restoreFocus = returnFocus;
    if (panel.open) panel.close();
  }
  panel.addEventListener('close', () => {
    if (panel.open) return; // A responsive change may have reopened it as a modal.
    document.documentElement.classList.remove('assistant-mobile-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open Ask Anjana portfolio assistant');
    log.setAttribute('aria-live', 'off');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  });
  trigger.addEventListener('click', open);
  panel.querySelector('.assistant-minimize').addEventListener('click', () => dismiss());
  panel.querySelector('.assistant-close').addEventListener('click', () => dismiss());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.open && !document.getElementById('recognition-dialog')?.open) {
      event.preventDefault();
      dismiss();
    }
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !mobile.matches) return;
    const controls = [...panel.querySelectorAll('button:not(:disabled), a[href], textarea')].filter(control => control.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  mobile.addEventListener('change', () => {
    if (panel.open) {
      panel.close();
      panel.setAttribute('aria-modal', String(mobile.matches));
      document.documentElement.classList.toggle('assistant-mobile-open', mobile.matches);
      if (mobile.matches) panel.showModal(); else panel.show();
    }
    viewport();
    queueContext();
  });
  window.visualViewport?.addEventListener('resize', viewport);
  window.visualViewport?.addEventListener('scroll', viewport);

  function renderSuggestions(section) {
    // Context rotates the suggestions; they never move under a keyboard user's focus.
    if (suggestions.contains(document.activeElement)) return;
    const offsets = { home: 0, work: 0, about: 1, experience: 2, recognition: 3, contact: 4 };
    const offset = offsets[section] || 0;
    suggestions.replaceChildren(...Array.from({ length: 4 }, (_, index) => {
      const question = questions[(offset + index) % questions.length];
      const button = element('button');
      button.type = 'button';
      button.append(element('span', 'mono', String(index + 1).padStart(2, '0')), element('span', '', question), element('span', '', '↗'));
      button.lastChild.setAttribute('aria-hidden', 'true');
      button.addEventListener('click', () => submit(question));
      return button;
    }));
  }
  function updateContext() {
    contextFrame = 0;
    const line = innerHeight * 0.4;
    let section = sections[0];
    sections.forEach(candidate => { if (candidate.getBoundingClientRect().top <= line) section = candidate; });
    const id = section.id;
    let entity = null;
    let prompt = 'What is Anjana working on?';
    let label = 'Want a quick introduction?';
    let title = { home: 'Introduction', work: 'Projects', about: 'About & skills', experience: 'Experience', recognition: 'Recognition', contact: 'Contact' }[id];
    if (id === 'work') {
      const tab = document.querySelector('[data-tab-list] [aria-selected="true"]');
      entity = tab?.dataset.panel.replace('panel-', '') || 'remind';
      const project = source.knowledge.projects.find(item => item.id === entity);
      prompt = `How was ${project?.name || 'NeuroWeave'} built?`;
      label = 'Want to know how this was built?';
      title += ` / ${project?.name || 'NeuroWeave'}`;
    } else if (id === 'recognition') {
      let entry = section.querySelector('.recognition-entry.is-current');
      if (!entry) {
        const list = [...section.querySelectorAll('.recognition-entry')];
        entry = list.reduce((best, candidate) => Math.abs(candidate.getBoundingClientRect().top - line) < Math.abs(best.getBoundingClientRect().top - line) ? candidate : best, list[0]);
      }
      entity = entry?.id.replace('recognition-', '') || 'stellaris';
      const achievement = source.knowledge.achievements.find(item => item.id === entity);
      prompt = `Tell me about the ${achievement?.organization || 'ICCPCT'} achievement.`;
      // AI Insight shares an organizer with other stories; use its distinctive name.
      if (entity === 'ai-insight') prompt = 'Tell me about the AI Insight achievement.';
      label = 'Ask me about this achievement';
    } else if (id === 'about') { prompt = "What's her tech stack?"; label = 'Explore the tools behind her work'; }
    else if (id === 'experience') { prompt = 'Tell me about her experience.'; label = 'Where has Anjana worked?'; }
    else if (id === 'contact') { prompt = 'How can I contact Anjana?'; label = 'Start a conversation with Anjana'; }
    const key = `${id}:${entity}`;
    context = { section: id, entity };
    contextPrompt = prompt;
    if (key === contextKey) return;
    contextKey = key;
    panel.querySelector('[data-assistant-context]').textContent = title;
    contextQuestion.replaceChildren(document.createTextNode(label + ' '), element('span', '', '↗'));
    contextQuestion.lastChild.setAttribute('aria-hidden', 'true');
    renderSuggestions(id);
  }
  function queueContext() { if (!contextFrame) contextFrame = requestAnimationFrame(updateContext); }
  contextQuestion.addEventListener('click', () => submit(contextPrompt));
  window.addEventListener('scroll', queueContext, { passive: true });
  window.addEventListener('resize', () => { viewport(); queueContext(); }, { passive: true });
  document.addEventListener('portfolio:layout', queueContext);
  document.querySelectorAll('.recognition-entry').forEach(entry => new MutationObserver(queueContext).observe(entry, { attributes: true, attributeFilter: ['class'] }));

  function navigate(item, keyboard) {
    dismiss(false);
    const behavior = reduced.matches || keyboard ? 'instant' : 'smooth';
    // Let the native modal restore page interaction before changing the document.
    requestAnimationFrame(() => {
      if (item.tab) document.getElementById(item.tab)?.click();
      if (item.achievement) {
        document.dispatchEvent(new CustomEvent('portfolio:recognition', { detail: { id: item.achievement, behavior, focus: keyboard } }));
        return;
      }
      const section = document.getElementById(item.section);
      const target = item.target ? section?.querySelector(item.target) : section;
      if (!target) return;
      target.scrollIntoView({ behavior, block: 'start' });
      const heading = target.querySelector('h2, h3') || target;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
  }
  function appendMessage(role, answer) {
    const message = element('article', 'assistant-message');
    message.dataset.role = role;
    const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());
    message.append(element('p', 'assistant-message-label mono', `${role === 'user' ? 'You' : 'Assistant'} / ${time}`));
    (answer.paragraphs || []).forEach(paragraph => message.append(element('p', '', paragraph)));
    if (answer.bullets?.length) {
      const list = element('ul');
      answer.bullets.forEach(bullet => list.append(element('li', '', bullet)));
      message.append(list);
    }
    if (answer.actions?.length) {
      const actions = element('div', 'assistant-actions');
      answer.actions.forEach(item => {
        const link = element('a', '', `${item.label} ↗`);
        if (item.section && document.getElementById(item.section)) {
          link.href = `#${item.section}`;
          link.addEventListener('click', event => { event.preventDefault(); navigate(item, event.detail === 0); });
        } else if (item.href && /^https:\/\//.test(item.href)) {
          link.href = item.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        } else return;
        actions.append(link);
      });
      message.append(actions);
    }
    log.append(message);
    return message;
  }
  async function submit(value) {
    const question = value.trim().slice(0, 1000);
    if (!question || busy) return;
    const token = ++request;
    busy = true;
    welcome.hidden = true;
    reset.hidden = false;
    appendMessage('user', { paragraphs: [question] });
    input.value = '';
    thinking.hidden = false;
    log.setAttribute('aria-busy', 'true');
    fitInput();
    scroll.scrollTop = scroll.scrollHeight;
    // Yield one paint for the status; local answers have no artificial delay.
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    if (token !== request) return;
    let answer;
    try { answer = source.reply(question, context, previousTopic); }
    catch { answer = { paragraphs: ["I couldn't read that information. You can ask Anjana directly."], actions: [{ label: 'Contact Anjana', section: 'contact' }] }; }
    previousTopic = answer.topic || null;
    const message = appendMessage('assistant', answer);
    thinking.hidden = true;
    log.removeAttribute('aria-busy');
    busy = false;
    fitInput();
    scroll.scrollTop = message.offsetTop - scroll.offsetTop - 8;
  }
  composer.addEventListener('submit', event => { event.preventDefault(); submit(input.value); });
  input.addEventListener('input', fitInput);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(input.value); }
  });
  reset.addEventListener('click', () => {
    request++;
    busy = false;
    previousTopic = null;
    log.replaceChildren();
    log.removeAttribute('aria-busy');
    welcome.hidden = false;
    reset.hidden = true;
    thinking.hidden = true;
    input.value = '';
    fitInput();
    scroll.scrollTop = 0;
    input.focus();
  });
  [trigger, panel].forEach(surface => {
    let pointerFrame = 0;
    surface.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || reduced.matches || pointerFrame || document.getElementById('motion-toggle')?.getAttribute('aria-pressed') === 'true') return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        surface.querySelectorAll('.assistant-character').forEach(character => {
          const rect = character.getBoundingClientRect();
          character.style.setProperty('--look-x', `${Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) / 35))}px`);
          character.style.setProperty('--look-y', `${Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 40))}px`);
        });
      });
    }, { passive: true });
    surface.addEventListener('pointerleave', () => surface.querySelectorAll('.assistant-character').forEach(character => { character.style.removeProperty('--look-x'); character.style.removeProperty('--look-y'); }));
  });
  document.documentElement.classList.add('has-assistant');
  launcher.hidden = false;
  log.setAttribute('aria-live', 'off');
  updateContext();
  setTimeout(() => {
    if (invitationSeen || document.hidden || reduced.matches || document.querySelector('dialog[open]')) return;
    launcher.classList.add('is-inviting');
    setTimeout(() => launcher.classList.remove('is-inviting'), 6000);
  }, 12000);
})();
