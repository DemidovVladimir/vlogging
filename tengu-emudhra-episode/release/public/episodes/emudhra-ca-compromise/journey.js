const journeyBeats={"intro":"Заставка","slide-1":"Ключ доверия. Четыре.","slide-2":"Сертификат — делегированное доверие","slide-3":"Большая кривая. Крошечный секрет.","slide-4":"Подписали не тот набор ключей","slide-5":"Один ключ. Две цепочки.","slide-6":"Подмена сервера, не машина времени","slide-7":"Подпись, отзыв и CT — разные проверки","slide-8":"Одна macOS. Не одна система доверия.","slide-9":"Исправление должно дойти до процесса","slide-10":"Тестируем отказ, а не просто ошибку","slide-11":"Закрыть риск, не отключая защиту","slide-12":"Доверие нужно доставлять"};
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
