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

const phaseCounts=[2,5,4,4,4,4,4,3];
const phaseDurations=[11,8,9,9,9,9,9,8];
const motion={"captions":[["поиск → открыть файлы → ответ → забыто","вопрос → точные строки → ещё актуально?"],["Файлы читаются один раз: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.","Tree-sitter режет каждый файл на единицы, которые человек назвал бы по имени.","Вызовы и импорты связываются по всему проекту, а не внутри одного файла.","Тесно связанные единицы образуют фичи — по связям, а не по папкам.","Каждая единица становится вектором: числами, которые передают её смысл."],["У каждой единицы — хеш её текста. Тот же текст — тот же хеш.","Хеш файла — из хешей единиц; хеш фичи — из её файлов; корень — из всех файлов.","Меняем одну функцию: меняются только хеши на её пути — файл, фича, корень.","Равные хеши — равное содержимое. Сохранённый результат можно взять, не перечитывая."],["Одна строка изменилась внутри одной функции.","chaos add сравнивает хеш каждого файла с сохранённым: заново читается один файл.","Новые векторы — только для единиц, чей текст изменился: 5 из 1 690.","Новая сводка — только у фич, чей хеш сдвинулся: 3 из 33. Готово за 1,73 с."],["Вопрос один раз становится вектором и сравнивается со сводками фич.","Внутри ближайших фич — поиск по смыслу, словам и точным именам, с общим рейтингом.","Один шаг по вызовам и реализациям добавляет соседей.","11 фрагментов с точными строками, 6 000 токенов, 0,20 с. Повторный вопрос — страница из кеша."],["Тот же вопрос задаётся каждому репозиторию — каждый отвечает по своему индексу.","Имя функции из одного репозитория дословно найдено в коде другого — это связь.","Обычные слова и имена короче шести символов связей не дают.","Одна страница, четыре дорожки. Бюджет делится, ответ — размером с один."],["Точные слова абзаца: только хеш и поиск среди листьев дерева. Модель не нужна.","Другие слова: сравнивается смысл ближайших абзацев с порогом 0,38.","Ниже порога — знания нет. Такой факт агенту стоит запомнить.","Добавили факт — корень другой. Забыли — корень ровно прежний."],["Индексировать один раз. add — после каждой правки.","Спрашивать через feature; --all-repos — если фича в нескольких репозиториях.","Хеш доказывает «то же самое», но не «верно»."]],"cover":[["БЕЗ ПАМЯТИ","поиск → открыть файлы → ответ → забыто"],["С ИНДЕКСОМ","вопрос → точные строки → ещё актуально?"]]};
function sceneTiming(){ const i=Number(currentScene.dataset.index)-1; return i<0?null:{count:phaseCounts[i],duration:phaseDurations[i]}; }
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
  const at = reducedMotion.matches && !manualAnimation ? timing.count - 1 : Math.min(timing.count - 1, Math.floor(animationTime() / timing.duration + 1e-6));
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

// All diagram states derive from the single scene clock.
// [data-on="k"]: full strength from phase k. [data-show="k"]: visible from phase k.
function renderScene() {
  const timing=sceneTiming();
  if(!timing)return;
  const seconds=animationTime();
  const still=reducedMotion.matches&&!manualAnimation;
  const frame=still?timing.count-1:Math.min(timing.count-1,Math.floor(seconds/timing.duration));
  const index=Number(currentScene.dataset.index)-1;
  const progress=Math.min(1,seconds/(timing.duration*timing.count));
  currentScene.style.setProperty('--phase-progress',still?'1':String(progress));
  if(currentScene.dataset.renderedFrame===String(frame))return;
  currentScene.dataset.renderedFrame=String(frame);
  currentScene.dataset.frame=String(frame);
  const caption=currentScene.querySelector('[data-caption]');
  if(caption)caption.textContent=motion.captions[index][frame];
  if(index===0)currentScene.querySelector('[data-cover-label]').textContent=motion.cover[frame][0];
  currentScene.querySelectorAll('[data-on]').forEach(el=>el.classList.toggle('is-on',frame>=Number(el.dataset.on)));
  currentScene.querySelectorAll('[data-show]').forEach(el=>el.classList.toggle('is-shown',frame>=Number(el.dataset.show)));
  currentScene.querySelectorAll('[data-close]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.close)<=frame));
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
    catch { introVeil.classList.remove('is-hidden'); startButton.querySelector('span').textContent = 'Попробовать снова'; }
  }
}
startButton.addEventListener('click', playIntro);
function restoreHash(hash = location.hash) {
  const legacy = {};
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
