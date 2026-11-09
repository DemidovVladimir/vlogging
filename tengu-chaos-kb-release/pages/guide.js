// TENGU EP.04, the chaos-kb guide. The rail shows the current part and the reading progress; the
// part's id goes into the address (replaceState), so /site/site.js keeps it when switching
// language. Code blocks get a copy button; the check demo shows one real answer at a time.
// Everything here is an enhancement: without it the page reads the same, all answers visible.
(() => {
  const root = document.documentElement, ru = root.lang === 'ru';
  root.classList.add('js');
  const parts = [...document.querySelectorAll('[data-part]')];
  const chapter = document.querySelector('#storyChapter');
  const index = document.querySelector('#sectionIndex');
  const fill = document.querySelector('#progressFill');
  let current = null, settled = false, queued = false;

  function update() {
    queued = false;
    const line = scrollY + innerHeight * 0.3;
    let active = parts[0];
    for (const part of parts) if (part.offsetTop <= line) active = part;
    if (active !== current) {
      current = active;
      // Not on the first pass: a page opened at #install must keep its address.
      if (settled) {
        const hash = active.id === 'top' ? '' : '#' + active.id;
        if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);
      }
      chapter.textContent = active.dataset.title;
      index.textContent = active.dataset.part;
    }
    const max = root.scrollHeight - innerHeight;
    fill.style.width = (max > 0 ? Math.min(100, (scrollY / max) * 100) : 0) + '%';
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', () => { settled = true; request(); }, {passive: true});
  addEventListener('resize', request);
  update();

  const label = {copy: ru ? 'Копировать' : 'Copy', copied: ru ? 'Скопировано' : 'Copied', failed: ru ? 'Не получилось' : 'Copy failed'};
  const status = () => document.querySelector('#siteStatus');
  for (const pre of document.querySelectorAll('pre[data-copy]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy';
    button.textContent = label.copy;
    let timer;
    button.addEventListener('click', async () => {
      let done = true;
      try { await navigator.clipboard.writeText(pre.dataset.copy); } catch { done = false; }
      button.textContent = done ? label.copied : label.failed;
      if (status()) status().textContent = button.textContent;
      clearTimeout(timer);
      timer = setTimeout(() => { button.textContent = label.copy; }, 1800);
    });
    pre.parentElement.append(button);
  }

  // Which of the three steps each answer used: exact stops at the fingerprint; similar and
  // absent embed the question and differ at the score line.
  const paths = {exact: ['yes', 'skip', 'skip'], similar: ['no', 'done', 'yes'], absent: ['no', 'done', 'no']};
  for (const demo of document.querySelectorAll('[data-check-demo]')) {
    const buttons = [...demo.querySelectorAll('[data-check]')];
    const answers = [...demo.querySelectorAll('[data-answer]')];
    const steps = [...demo.querySelectorAll('.check-flow li')];
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let timers = [];
    function show(i) {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.check === String(i))));
      answers.forEach(a => { a.hidden = a.dataset.answer !== String(i); });
      const path = paths[answers[i].dataset.presence];
      timers.forEach(clearTimeout); timers = [];
      steps.forEach(s => { s.dataset.state = 'skip'; });
      // One step after another, so the path reads left to right.
      path.forEach((state, n) => {
        if (still.matches) steps[n].dataset.state = state;
        else timers.push(setTimeout(() => { steps[n].dataset.state = state; }, 120 + n * 260));
      });
    }
    buttons.forEach(b => b.addEventListener('click', () => show(Number(b.dataset.check))));
    show(0);
  }
})();
