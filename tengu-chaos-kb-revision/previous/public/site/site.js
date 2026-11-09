// Shared viewer navigation. It deliberately does not modify the slide runtime.
(() => {
  const root = document.documentElement;
  const dialog = document.querySelector('#episodeMenu');
  if (!dialog) return;
  const menu = document.querySelector('[data-open-menu]');
  const deck = document.querySelector('#deck');
  const lang = document.querySelector('[data-episode-language]');
  const record = document.querySelector('[data-record]');
  const status = document.querySelector('#siteStatus');
  const ru = root.lang === 'ru';
  function syncLanguage() {
    const url = new URL(lang.dataset.episodeLanguage, location.origin);
    if (root.classList.contains('is-recording')) url.searchParams.set('record', '1');
    url.hash = location.hash;
    lang.href = url.pathname + url.search + url.hash;
  }
  function setRecording(enabled) {
    if (dialog.open) dialog.close();
    root.classList.toggle('is-recording', enabled);
    const url = new URL(location.href);
    if (enabled) url.searchParams.set('record', '1'); else url.searchParams.delete('record');
    history.replaceState(history.state, '', url);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    status.textContent = enabled
      ? (ru ? 'Меню скрыто для записи. H — показать меню.' : 'Navigation hidden for recording. H to show it.')
      : (ru ? 'Меню показано.' : 'Navigation shown.');
    syncLanguage();
  }
  menu.addEventListener('click', () => {
    dialog.showModal();
    menu.setAttribute('aria-expanded', 'true');
    deck.inert = true;
  });
  document.querySelector('[data-close-menu]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    deck.inert = false;
    menu.setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  record.addEventListener('click', () => setRecording(true));
  window.addEventListener('keydown', event => {
    const target = document.activeElement;
    const editing = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
    const modified = event.ctrlKey || event.metaKey || event.altKey || event.repeat;
    if (event.code === 'KeyH' && !editing && !modified) {
      event.preventDefault(); event.stopImmediatePropagation();
      setRecording(!root.classList.contains('is-recording'));
      return;
    }
    // Preserve native dialog Tab/Escape behavior without moving background slides.
    if (dialog.open) event.stopImmediatePropagation();
  }, true);
  window.addEventListener('wheel', event => { if (dialog.open) event.stopImmediatePropagation(); }, {capture:true, passive:true});
  window.addEventListener('hashchange', syncLanguage);
  // The slide runtime uses replaceState, which does not dispatch hashchange.
  const index = document.querySelector('#sectionIndex');
  if (index) new MutationObserver(syncLanguage).observe(index, {childList:true, subtree:true, characterData:true});
  lang.addEventListener('click', syncLanguage);
  lang.addEventListener('focus', syncLanguage);
  lang.addEventListener('pointerenter', syncLanguage);
  syncLanguage();
})();
