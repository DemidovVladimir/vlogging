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
