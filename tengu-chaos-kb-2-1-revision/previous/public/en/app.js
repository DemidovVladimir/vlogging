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
  { focus: '', connected: [], answers: [], text: 'The request is identical. The audience details give it a different context.' },
  { focus: 'a', connected: ['a'], answers: [], text: 'Attention connects the request to context, changing how its parts contribute to a token’s internal state.' },
  { focus: 'a', connected: ['a'], answers: ['a'], text: 'Further computations may produce an outline built around familiar uses of AI.' },
  { focus: 'b', connected: ['a', 'b'], answers: ['a'], text: 'For engineers, the context differs. Attention connections can change too.' },
  { focus: 'b', connected: ['a', 'b'], answers: ['a', 'b'], text: 'Now the outline might focus on model architecture and evaluation.' },
  { focus: '', connected: ['a', 'b'], answers: ['a', 'b'], text: 'Read the last request together with the full context.' },
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
  { era: 'Old model', mode: 'No skill', rule: 'off', design: 'bare',
    reason: 'The old model needed structure and character.',
    result: 'Everything is there. Nothing stands out.',
    text: 'Start with the layout that originally prompted the skill.' },
  { era: 'Old model', mode: 'Old skill on', rule: 'old', design: 'structured',
    reason: 'For this model, the recipe helped create a tidy page.',
    result: 'Organized sections. A clear main action.',
    text: 'Back then, the skill helped: better structure and a more convincing page.' },
  { era: 'New model', mode: 'Old skill off', rule: 'off', design: 'editorial',
    reason: 'In this example, the new model composes the page on its own.',
    result: 'A large product image, space and one focus.',
    text: 'Same brief. The new model no longer needs the old boost.' },
  { era: 'New model', mode: 'Old skill on', rule: 'old', design: 'overloaded',
    reason: 'The old recipe adds decoration to an already composed page.',
    result: 'Borders and accents compete for attention.',
    text: 'The skill stays in context. Highlighting everything hides what matters.' },
  { era: 'New model', mode: 'Updated skill on', rule: 'updated', design: 'editorial',
    reason: 'Keep the goal and brand character. Drop mandatory decoration.',
    result: 'The product and main action are clear again.',
    text: 'Update the skill for the model and task. Judge the result.' },
];
function renderMigrationExample(seconds, still) {
  const frameIndex = still ? migrationFrames.length - 1 : Math.floor(seconds / 5) % migrationFrames.length;
  if (migrationScene.dataset.frame === String(frameIndex)) return;
  migrationScene.dataset.frame = frameIndex;
  const frame = migrationFrames[frameIndex];
  migrationScene.dataset.rule = frame.rule;
  migrationScene.dataset.design = frame.design;
  const labels = { old: 'OLD SKILL ON', off: 'OLD SKILL OFF', updated: 'UPDATED SKILL' };
  const fields = { migrationEra: frame.era, migrationMode: frame.mode, migrationRuleLabel: labels[frame.rule],
    migrationReason: frame.reason, migrationResult: frame.result, migrationNarration: frame.text,
    designModelKey: frameIndex < 2 ? 'Old' : 'New',
    designSkillKey: frame.rule === 'off' ? 'Off' : frame.rule === 'old' ? 'Old' : 'Updated' };
  Object.entries(fields).forEach(([id, text]) => document.getElementById(id).textContent = text);
  migrationScene.querySelectorAll('.migration-rule__texts [data-rule]').forEach(el => {
    const visible = el.dataset.rule === (frame.rule === 'updated' ? 'updated' : 'old');
    el.classList.toggle('is-shown', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  const page = migrationScene.querySelector('.design-page');
  page.dataset.design = frame.design;
  page.setAttribute('aria-label', 'Illustrative mockup: ' + frame.era + ', ' + frame.mode.toLowerCase() + '. ' + frame.result);
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
      'Your request sets a short format.',
      'The skill adds a procedure. The notes supply material for the answer.',
      'The harness assembles these parts into the input for one model call.',
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
    catch { introVeil.classList.remove('is-hidden'); startButton.querySelector('span').textContent = 'Try again'; }
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
