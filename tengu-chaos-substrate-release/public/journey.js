// Editorial continuity comes from the argument, not a character moving the UI.
const journeyBeats = {
  intro: 'TENGU / FIELD MANUAL',
  'slide-1': 'КОНФЛИКТ ИНСТРУКЦИЙ',
  'slide-2': 'СБОРКА КОНТЕКСТА',
  'slide-3': 'КОНТЕКСТ В МОДЕЛИ',
  'slide-6': 'КОНТЕКСТ И ОТВЕТ',
  'slide-7': 'ПРИОРИТЕТ ИНСТРУКЦИЙ',
  'slide-8': 'ДЕЙСТВИЯ И НОВЫЕ ДАННЫЕ',
  'slide-9': 'НЕДОВЕРЕННЫЕ ДАННЫЕ',
  'slide-10': 'ИНСТРУМЕНТЫ И ПРОЦЕДУРЫ',
  'slide-12': 'ПОВТОРНЫЕ ВЫЧИСЛЕНИЯ',
  'slide-13': 'МОДЕЛЬ И НАСТРОЙКИ',
  sources: 'TENGU / ИСТОЧНИКИ',
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
