// Restrained transition; continuity comes from the story.
const journeyBeats={"intro":"TENGU / EPISODE 02","slide-1":"FROM ANSWER TO WORK","slide-2":"PLAN AND DEPENDENCIES","slide-3":"EACH AGENT’S CONTEXT","slide-4":"ACTION BOUNDARIES","slide-5":"RECOVERING FROM FAILURE","slide-6":"SEE WHAT HAPPENED","slide-7":"MEMORY BETWEEN TASKS","slide-8":"TENGU / YOUR NEXT STEP"};
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
