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

const motion=[{"frames":["В браузере — отказ.","В другой программе — соединение может пройти."],"kind":"cover"},{"frames":["Сертификат CA содержит открытый ключ — с ним можно сверять кандидатов.","Закрытые числа были настолько малы, что исследователи восстановили их.","По предварительному отчёту CA, в запросы на сертификаты попал ошибочный набор ключей."],"kind":"weak"},{"frames":["Клиент строит цепочку от сертификата сайта к доверенному корню.","Другой сертификат того же ключа может дать альтернативный путь.","SPKI-блокировка привязана к открытому ключу, а не только к одному сертификату."],"kind":"cross"},{"frames":["Обычно приложение соединяется с настоящим сервисом.","Атакующий оказался на пути и предъявил поддельный сертификат.","Если приложение его приняло, шифрование заканчивается у посредника."],"kind":"attack"},{"frames":["Подпись, имя и цепочка — необходимые, но не все проверки доверия.","CT требует подтверждения от публичных журналов; CRLSet доставляет блокировку.","Публикация отзыва CA не заставляет любой TLS-клиент его применять."],"kind":"compare"},{"frames":["Общие trust stores и образы получили исправления.","Сервисы должны реально загрузить исправление.","Клиентский cloudflared: обновление 2026.10.2; контейнер — redeploy."],"kind":"cloudflare"},{"frames":["Новый компилятор на build-машине не меняет работающий бинарник.","Пересобираем на исправленной версии Go и развёртываем новый артефакт.","Проверяем именно этот TLS-путь: опасная цепочка отклоняется."],"kind":"update"},{"frames":["DNS-ошибка или таймаут ещё не доказывают блокировку сертификата.","Положительный контроль отличает защиту от сломанной сети.","Один браузерный тест не проверяет все ваши приложения."],"kind":"closing"}];
function sceneTiming(){const i=Number(currentScene.dataset.index)-1;return i<0?null:{count:motion[i].frames.length,duration:10};}
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

// A single clock drives phase changes and restrained character motion.
function renderScene(){
 const timing=sceneTiming();if(!timing)return;
 const t=animationTime(),still=reducedMotion.matches&&!manualAnimation;
 const f=still?timing.count-1:Math.min(timing.count-1,Math.floor(t/timing.duration));
 const p=still?1:Math.min(1,t/(timing.duration*timing.count));
 currentScene.style.setProperty('--phase-progress',String(p));
 currentScene.querySelectorAll('.connection').forEach(n=>{
  const age=t/timing.duration-Number(n.dataset.from);
  const drawn=animationPaused||still?1:Math.max(0,Math.min(1,age*2));
  n.style.strokeDasharray='100';n.style.strokeDashoffset=String(100*(1-drawn));
 });
 if(currentScene.dataset.renderedFrame===String(f))return;
 currentScene.dataset.renderedFrame=String(f);currentScene.dataset.frame=String(f);
 const m=motion[Number(currentScene.dataset.index)-1];
 currentScene.querySelector('[data-caption]').textContent=m.frames[f];
 currentScene.querySelectorAll('[data-from]').forEach(n=>n.classList.toggle('is-pending',Number(n.dataset.from)>f));
 currentScene.querySelectorAll('[data-only]').forEach(n=>n.classList.toggle('is-absent',Number(n.dataset.only)!==f));
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
