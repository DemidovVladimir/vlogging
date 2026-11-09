// Editorial continuity comes from the argument, not a character moving the UI.
const journeyBeats = {
  intro: 'TENGU / FIELD MANUAL',
  'slide-1': 'INSTRUCTION CONFLICTS',
  'slide-2': 'ASSEMBLING CONTEXT',
  'slide-3': 'CONTEXT IN THE MODEL',
  'slide-6': 'CONTEXT AND THE ANSWER',
  'slide-7': 'INSTRUCTION PRIORITY',
  'slide-8': 'ACTIONS AND NEW DATA',
  'slide-9': 'UNTRUSTED DATA',
  'slide-10': 'TOOLS AND PROCEDURES',
  'slide-12': 'REPEATED COMPUTATIONS',
  'slide-13': 'MODEL AND CONFIGURATION',
  sources: 'TENGU / SOURCES',
};
let travelState = null;
function updateJourneyChapter(scene) {
  document.getElementById('storyChapter').textContent = journeyBeats[scene.id];
}
function finishTravel() {
  const state = travelState;
  if (!state) return;
  state.cancelled = true;
  state.transition?.skipTransition();
  travelState = null;
  if (!state.swapped) scrollToScene(state.to);
}
function travelTo(to) {
  if (!to || to === currentScene || travelState) return;
  if (reducedMotion.matches || !document.startViewTransition) { scrollToScene(to); return; }
  const state = { to, transition: null, cancelled: false, swapped: false };
  travelState = state;
  state.transition = document.startViewTransition(() => {
    if (state.cancelled) return;
    state.swapped = true;
    scrollToScene(to);
  });
  // Skipping the visual fade rejects ready, even when the DOM update succeeds.
  state.transition.ready.catch(() => {});
  state.transition.finished.catch(() => {}).finally(() => {
    if (travelState !== state) return;
    travelState = null;
    updateProgress();
  });
}
// Natural wheel/touch scrolling is never hijacked for a slideshow effect.
window.addEventListener('wheel', () => { if (travelState) finishTravel(); }, { passive: true });
