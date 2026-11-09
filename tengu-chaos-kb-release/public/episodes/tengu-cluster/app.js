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

const phaseCounts=[2,4,3,3,3,4,3,3];
const phaseDurations=[11,8,9,9,9,8,9,8];
const motion={"captions":[["config.toml → planner → executor","run-agent → tool call → результат шага"],["Planner видит настроенный roster: описания агентов, skills и tools.","A и B не зависят друг от друга — executor запускает их параллельно.","C: depends_on = [A, B]. Пока оба не готовы, сравнение не начнётся.","D получает результат C. Простой запрос может обойти план: Direct."],["Родитель передаёт цель, результаты зависимостей и план этой сессии.","Дочерний процесс загружает конфигурацию выбранного агента.","Внутри идёт цикл модели и инструментов. Итог возвращается как JSON."],["Инструмент должен быть выдан агенту: одной просьбы в промпте мало.","Scope дополнительно проверяет аргументы: например, адрес или путь.","Shell, браузер и native tools CLI требуют собственных ограничений."],["Сравнение завершилось ошибкой. Проверка ждёт; источники уже собраны.","Retry повторяет тот же шаг с задержкой, пока остаются попытки.","Replan меняет план. *Готовый результат сохраняется лишь при совпадении шага и зависимостей."],["Запись показывает DAG и выбранных агентов.","session_id и step_id связывают работу дочернего процесса.","События вызовов возвращаются в trace родителя под своим шагом.","Studio воспроизводит запись событий. Инструменты заново не запускаются."],["output / summary передаются следующему шагу по IPC даже без базы.","При включённой памяти сводка сохраняется в Postgres + pgvector.","Recall добавляет релевантные записи в новый контекст, не меняя веса модели."],["config.toml: кто и с какими правами","DAG + IPC: как идёт работа","Trace + проверка: почему доверяем итогу"]],"cover":[["НЕ ТОЛЬКО ПРОМПТ","config.toml → planner → executor"],["ИСПОЛНЕНИЕ","run-agent → tool call → результат шага"]],"retry":[["ГОТОВО","ОШИБКА","ЖДЁТ"],["СОХРАНЕНО","RETRY","ЖДЁТ"],["ПЕРЕИСПОЛЬЗУЕМ*","REPLAN","НОВЫЙ ПЛАН"]],"trace":[["ПЛАН","Запись показывает DAG и выбранных агентов."],["ШАГ","session_id и step_id связывают работу дочернего процесса."],["ИНСТРУМЕНТ","События вызовов возвращаются в trace родителя под своим шагом."],["REPLAY","Studio воспроизводит запись событий. Инструменты заново не запускаются."]]};
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

// All diagram states and character movement derive from the single scene clock.
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
  if(index===1){
    const done=[[0],[0,1,2],[0,1,2,3],[0,1,2,3,4]][frame];
    currentScene.querySelectorAll('[data-plan-node]').forEach(el=>el.classList.toggle('is-active',done.includes(Number(el.dataset.planNode))));
  }
  if(index===2)currentScene.querySelectorAll('[data-role]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.role)===frame));
  if(index===4)currentScene.querySelectorAll('[data-retry]').forEach(el=>{el.textContent=motion.retry[frame][Number(el.dataset.retry)];});
  if(index===5){
    currentScene.querySelector('[data-trace-label]').textContent=motion.trace[frame][0];
    currentScene.querySelectorAll('[data-trace]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.trace)===frame));
  }
  if(index===7)currentScene.querySelectorAll('[data-close]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.close)<=frame));
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
