// Restrained transition; continuity comes from the story.
const journeyBeats={"intro":"TENGU / ВЫПУСК 05","slide-1":"ПАМЯТЬ ДЛЯ АГЕНТА","slide-2":"ЧТО ЛЕЖИТ В ИНДЕКСЕ","slide-3":"КЛЮЧ — ХЕШ ВХОДА","slide-4":"ПОСЛЕ ПРАВКИ","slide-5":"ВОПРОС О ФИЧЕ","slide-6":"НЕСКОЛЬКО РЕПОЗИТОРИЕВ","slide-7":"ПОИСК В БАЗЕ ЗНАНИЙ","slide-8":"TENGU / ВЫВОД"};
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
