const scenes = [...document.querySelectorAll('.scene')];
const progressFill = document.querySelector('#progressFill');
const sectionIndex = document.querySelector('#sectionIndex');
const initialHash = location.hash;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let ready = false;
let layoutWidth = innerWidth;
let currentScene = scenes[0];
let sceneTimer;
let sceneStartedAt = 0;
let sceneElapsed = 0;
let animationPaused = false;
let animationRate = 1;
let manualAnimation = false;
let clockRunning = false;

const storySelectors = {
  'slide-3': ['.process-step--input', '.process-step--model', '.process-step--output'],
  'slide-7': ['.priority-rule', '.priority-rule--skill', '.role-explainer'],
  'slide-10': ['.capability-rows article:nth-child(1)', '.capability-rows article:nth-child(2)', '.capability-rows article:nth-child(3)'],
  'slide-8': ['.action-cycle article:nth-of-type(1)', '.action-cycle article:nth-of-type(2)', '.action-cycle article:nth-of-type(3)', '.cycle-return'],
  'slide-9': ['.source-note', '.source-note blockquote', '.permission-boundary'],
  'slide-12': ['.cache-row:nth-child(1)', '.cache-row:nth-child(2)', '.cache-row:nth-child(3)'],
};

const storyActors = new Map();
Object.entries(storySelectors).forEach(([id, selectors]) => {
  const scene = document.getElementById(id);
  scene.classList.add('has-story');
  const cues = selectors.map(selector => scene.querySelector(selector));
  if (cues.some(cue => !cue)) throw new Error('Missing cue in ' + id);
  cues.forEach(cue => cue.classList.add('story-cue'));
  storyActors.set(id, { cues });
});

// A qualitative comparison, not measured attention or recorded model outputs.
// The same request is interpreted with two different audience contexts.
const attentionScene = document.getElementById('slide-6');
const contextBranches = [...attentionScene.querySelectorAll('.context-branch')];
const contextFrames = [
  { focus: '', connected: [], answers: [], text: 'Просьба одинаковая. Но сведения об аудитории уже задают разный контекст.' },
  { focus: 'a', connected: ['a'], answers: [], text: 'Attention связывает запрос с контекстом и меняет вклад его частей в состояние токена.' },
  { focus: 'a', connected: ['a'], answers: ['a'], text: 'Дальнейшие вычисления могут привести к плану с понятными примерами применения ИИ.' },
  { focus: 'b', connected: ['a', 'b'], answers: ['a'], text: 'Для инженерной аудитории контекст другой. Связи внимания тоже могут измениться.' },
  { focus: 'b', connected: ['a', 'b'], answers: ['a', 'b'], text: 'Теперь возможен план про устройство модели и проверку её качества.' },
  { focus: '', connected: ['a', 'b'], answers: ['a', 'b'], text: 'Поэтому последнюю просьбу нужно проверять вместе со всем контекстом.' },
];
function renderContextComparison(seconds, still) {
  const frameIndex = still ? contextFrames.length - 1 : Math.floor(seconds / 4.5) % contextFrames.length;
  const mode = still ? 'still' : 'animated';
  if (attentionScene.dataset.frame === String(frameIndex) && attentionScene.dataset.motion === mode) return;
  attentionScene.dataset.frame = frameIndex;
  attentionScene.dataset.motion = mode;
  const frame = contextFrames[frameIndex];
  contextBranches.forEach(branch => {
    const id = branch.dataset.branch;
    branch.classList.toggle('is-context-focus', frame.focus === id);
    branch.classList.toggle('is-connected', frame.connected.includes(id));
    branch.classList.toggle('has-answer', frame.answers.includes(id));
  });
  document.getElementById('contextNarration').textContent = frame.text;
}

// Authored design counterfactual. The brief, copy and image stay fixed.
// No LLM comparison or measured conversion result is claimed.
const migrationScene = document.getElementById('slide-13');
const migrationFrames = [
  { era: 'Старая модель', mode: 'Без навыка', rule: 'off', design: 'bare',
    reason: 'Прежней модели не хватало структуры и выразительности.',
    result: 'Всё есть, но нет ясного акцента.',
    text: 'Начинаем с макета, ради которого когда-то написали навык.' },
  { era: 'Старая модель', mode: 'С прежним навыком', rule: 'old', design: 'structured',
    reason: 'Для этой модели рецепт помог собрать аккуратную страницу.',
    result: 'Блоки собраны, главное действие заметно.',
    text: 'Тогда навык помог: появился порядок, страница стала убедительнее.' },
  { era: 'Новая модель', mode: 'Без прежнего навыка', rule: 'off', design: 'editorial',
    reason: 'В этом сценарии новая модель сама выстраивает композицию.',
    result: 'Крупный предмет, свободное пространство, один акцент.',
    text: 'Та же задача. Новая модель уже справляется без прежнего усиления.' },
  { era: 'Новая модель', mode: 'С прежним навыком', rule: 'old', design: 'overloaded',
    reason: 'Тот же рецепт добавляет усиление поверх готовой композиции.',
    result: 'Рамки и акценты спорят за внимание.',
    text: 'Навык остался в контексте. «Выделить всё» мешает увидеть главное.' },
  { era: 'Новая модель', mode: 'С обновлённым навыком', rule: 'updated', design: 'editorial',
    reason: 'Оставили цель и характер бренда, убрали обязательные украшения.',
    result: 'Снова видны предмет и главное действие.',
    text: 'Обновили навык под модель и задачу. Сравниваем именно результат.' },
];
function renderMigrationExample(seconds, still) {
  const frameIndex = still ? migrationFrames.length - 1 : Math.floor(seconds / 5) % migrationFrames.length;
  if (migrationScene.dataset.frame === String(frameIndex)) return;
  migrationScene.dataset.frame = frameIndex;
  const frame = migrationFrames[frameIndex];
  migrationScene.dataset.rule = frame.rule;
  migrationScene.dataset.design = frame.design;
  const labels = { old: 'ПРЕЖНИЙ НАВЫК ПОДКЛЮЧЁН', off: 'ПРЕЖНИЙ НАВЫК ОТКЛЮЧЁН', updated: 'ОБНОВЛЁННЫЙ НАВЫК' };
  const fields = { migrationEra: frame.era, migrationMode: frame.mode, migrationRuleLabel: labels[frame.rule],
    migrationReason: frame.reason, migrationResult: frame.result, migrationNarration: frame.text,
    designModelKey: frameIndex < 2 ? 'Прежняя' : 'Новая',
    designSkillKey: frame.rule === 'off' ? 'Не подключён' : frame.rule === 'old' ? 'Прежний' : 'Обновлён' };
  Object.entries(fields).forEach(([id, text]) => document.getElementById(id).textContent = text);
  migrationScene.querySelectorAll('.migration-rule__texts [data-rule]').forEach(el => {
    const visible = el.dataset.rule === (frame.rule === 'updated' ? 'updated' : 'old');
    el.classList.toggle('is-shown', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  const page = migrationScene.querySelector('.design-page');
  page.dataset.design = frame.design;
  page.setAttribute('aria-label', 'Учебный макет: ' + frame.era + ', ' + frame.mode.toLowerCase() + '. ' + frame.result);
}

function sceneTiming() {
  if (currentScene.id === 'slide-2') return { duration: 4, count: 3 };
  if (currentScene.id === 'slide-6') return { duration: 4.5, count: contextFrames.length };
  if (currentScene.id === 'slide-13') return { duration: 5, count: migrationFrames.length };
  const story = storyActors.get(currentScene.id);
  return story ? { duration: 3.6, count: story.cues.length } : null;
}
function animationTime() {
  return sceneElapsed + (clockRunning ? (performance.now() - sceneStartedAt) / 1000 * animationRate : 0);
}
function captureAnimationTime() {
  sceneElapsed = animationTime();
  sceneStartedAt = performance.now();
}
function runAnimationClock() {
  clearInterval(sceneTimer);
  clockRunning = !document.hidden && !animationPaused && !reducedMotion.matches && !!sceneTiming();
  sceneStartedAt = performance.now();
  document.documentElement.dataset.animationPaused = String(animationPaused);
  document.documentElement.dataset.animationRate = String(animationRate);
  renderScene();
  if (clockRunning) sceneTimer = setInterval(renderScene, 100);
}
function toggleAnimation() {
  const timing = sceneTiming();
  if (!timing) return;
  captureAnimationTime();
  if (reducedMotion.matches && !manualAnimation) sceneElapsed = (timing.count - 1) * timing.duration;
  animationPaused = !animationPaused;
  manualAnimation = true;
  runAnimationClock();
}
function stepAnimation(delta) {
  const timing = sceneTiming();
  if (!timing) return;
  const at = reducedMotion.matches && !manualAnimation ? timing.count - 1 : Math.floor(animationTime() / timing.duration + 1e-6) % timing.count;
  const target = Math.max(0, Math.min(timing.count - 1, at + delta));
  animationPaused = true;
  manualAnimation = true;
  sceneElapsed = target * timing.duration + 0.001;
  clockRunning = false;
  runAnimationClock();
}
function changeAnimationRate(factor) {
  captureAnimationTime();
  animationRate = Math.max(0.25, Math.min(2, animationRate * factor));
  runAnimationClock();
}

function renderScene() {
  const seconds = animationTime();
  const still = reducedMotion.matches && !manualAnimation;
  if (currentScene.id === 'slide-6') renderContextComparison(seconds, still);
  if (currentScene.id === 'slide-13') renderMigrationExample(seconds, still);
  if (currentScene.id === 'slide-2') {
    const step = still ? 2 : Math.floor(seconds / 4) % 3;
    document.querySelector('.context-assembly').dataset.stage = step;
    document.querySelector('#assemblyStep').textContent = [
      'Ваша просьба задаёт короткий формат.',
      'Навык добавляет процедуру, данные дают материал для ответа.',
      'Harness собирает эти части во вход одного вызова модели.',
    ][step];
  }
  const story = storyActors.get(currentScene.id);
  if (!story) return;
  const step = still ? story.cues.length - 1 : Math.floor(seconds / 3.6) % story.cues.length;
  if (currentScene.dataset.storyStep !== String(step)) {
    currentScene.dataset.storyStep = step;
    story.cues.forEach(cue => cue.classList.remove('is-cue'));
    story.cues[step].classList.add('is-cue');
  }

}

function syncScene() {
  sceneElapsed = 0;
  clockRunning = false;
  manualAnimation = animationPaused;
  runAnimationClock();
}

function setCurrent(scene) {
  if (scene === currentScene && scene.classList.contains('is-current')) return;
  currentScene = scene;
  if (ready) history.replaceState(null, '', '#' + scene.id);
  sectionIndex.textContent = scene.dataset.index;
  updateJourneyChapter(scene);
  scenes.forEach(item => item.classList.toggle('is-current', item === scene));
  scene.classList.add('is-visible');
  syncScene();
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.closest('.scene')?.classList.add('is-visible');
  });
}, { threshold: .16 });
document.querySelectorAll('.reveal').forEach(item => revealObserver.observe(item));

function updateProgress() {
  if (travelState || innerWidth !== layoutWidth) return;
  const total = document.documentElement.scrollHeight - innerHeight;
  progressFill.style.width = Math.min(100, Math.max(0, total > 0 ? scrollY / total * 100 : 0)) + '%';
  const anchor = scrollY + Math.min(innerHeight * .4, 300);
  setCurrent(scenes.findLast(scene => scene.offsetTop <= anchor) || scenes[0]);
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', () => {
  finishTravel();
  if (innerWidth !== layoutWidth) {
    layoutWidth = innerWidth;
    scrollToScene(currentScene);
  }
  updateProgress();
});
document.addEventListener('visibilitychange', () => {
  captureAnimationTime();
  if (document.hidden) finishTravel();
  runAnimationClock();
});
reducedMotion.addEventListener('change', () => { captureAnimationTime(); finishTravel(); manualAnimation = false; runAnimationClock(); });
updateProgress();

function scrollToScene(target) {
  if (!target) return;
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  setCurrent(target);
  history.replaceState(null, '', '#' + target.id);
}
function go(delta) {
  if (travelState) return;
  const index = scenes.indexOf(currentScene);
  travelTo(scenes[Math.min(scenes.length - 1, Math.max(0, index + delta))]);
}
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const tag = document.activeElement?.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag) || document.activeElement?.isContentEditable) return;
  // Physical key codes work with Russian as well as English keyboard layouts.
  if (event.code === 'KeyP') { event.preventDefault(); finishTravel(); toggleAnimation(); return; }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); finishTravel(); stepAnimation(event.key === 'ArrowLeft' ? -1 : 1); return; }
  if (event.code === 'Minus' || event.code === 'NumpadSubtract') { event.preventDefault(); changeAnimationRate(0.5); return; }
  if (event.code === 'Equal' || event.code === 'NumpadAdd') { event.preventDefault(); changeAnimationRate(2); return; }
  if (event.code === 'Digit0' || event.code === 'Numpad0') { event.preventDefault(); changeAnimationRate(1 / animationRate); return; }
  if (event.code === 'KeyR' && sceneTiming()) { event.preventDefault(); finishTravel(); sceneElapsed = 0; clockRunning = false; animationPaused = true; manualAnimation = true; runAnimationClock(); return; }
  if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
    event.preventDefault(); go(1);
  }
  if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
    event.preventDefault(); go(-1);
  }
  if (event.key === 'Home') { event.preventDefault(); finishTravel(); scrollToScene(scenes[0]); }
  if (event.key === 'End') { event.preventDefault(); finishTravel(); scrollToScene(scenes.at(-1)); }
});

// Keep the original intro and its explicit audio gesture.
const introVideo = document.querySelector('#introVideo');
const introVeil = document.querySelector('#introVeil');
const startButton = document.querySelector('#startButton');
async function playIntro() {
  startButton.blur();
  introVideo.currentTime = 0;
  introVideo.muted = false;
  introVeil.classList.add('is-hidden');
  try { await introVideo.play(); }
  catch {
    introVideo.muted = true;
    try { await introVideo.play(); }
    catch { introVeil.classList.remove('is-hidden'); startButton.querySelector('span').textContent = 'Повторить запуск'; }
  }
}
startButton.addEventListener('click', playIntro);
function restoreHash(hash = location.hash) {
  const legacy = { 'slide-4': 'slide-3', 'slide-5': 'slide-6', 'slide-11': 'slide-13' };
  const id = hash.slice(1);
  const target = document.getElementById(legacy[id] || id);
  if (target?.classList.contains('scene')) scrollToScene(target);
  else updateProgress();
}
window.addEventListener('hashchange', event => { finishTravel(); restoreHash(new URL(event.newURL).hash); });
window.addEventListener('load', async () => {
  await document.fonts.ready;
  ready = true;
  restoreHash(initialHash);
});
