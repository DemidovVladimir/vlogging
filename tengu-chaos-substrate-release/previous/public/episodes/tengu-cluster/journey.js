// Restrained transition; continuity comes from the story.
const journeyBeats={"intro":"TENGU / ВЫПУСК 02","slide-1":"НАШ HARNESS НА RUST","slide-2":"ПЛАН — ЭТО ЗАВИСИМОСТИ","slide-3":"КАК ЗАПУСКАЕТСЯ АГЕНТ","slide-4":"ГРАНИЦЫ ИНСТРУМЕНТОВ","slide-5":"ПОВТОР ИЛИ НОВЫЙ ПЛАН","slide-6":"СВЯЗАННЫЙ TRACE","slide-7":"ПАМЯТЬ И РЕЗУЛЬТАТ","slide-8":"TENGU / ВЫВОД"};
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
