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
