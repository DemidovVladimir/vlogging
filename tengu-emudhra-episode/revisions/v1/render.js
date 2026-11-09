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
 if(m.kind==='scalar')currentScene.querySelectorAll('[data-byte]').forEach((n,i)=>{n.textContent=f?i===47?'04':'00':((i*73+31)%256).toString(16).padStart(2,'0').toUpperCase();n.classList.toggle('nonzero',f>0&&i===47);});
}
