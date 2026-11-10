const activeAnimations=new WeakMap();

export function setAnimatedNumber(element,target,formatter,valueSuffix=""){
  if(!element)return;
  target=Number(target);
  if(!Number.isFinite(target))return;
  let animation=activeAnimations.get(element);
  if(!animation){
    animation={value:target,target,frame:0};
    activeAnimations.set(element,animation);
    element.textContent=formatter(target)+valueSuffix;
    return;
  }
  const tolerance=Math.max(1e-12,Math.abs(target)*1e-12);
  if(Math.abs(animation.target-target)<=tolerance)return;
  if(animation.frame)cancelAnimationFrame(animation.frame);
  const start=animation.value;
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const duration=reducedMotion?0:220;
  if(duration===0){
    animation.value=target;
    animation.target=target;
    animation.frame=0;
    element.textContent=formatter(target)+valueSuffix;
    return;
  }
  let startedAt=0;
  animation.target=target;
  const tick=now=>{
    if(!startedAt)startedAt=now;
    const progress=Math.min(1,(now-startedAt)/duration);
    const eased=1-Math.pow(1-progress,3);
    const value=start+(target-start)*eased;
    animation.value=value;
    element.textContent=formatter(value)+valueSuffix;
    if(progress<1)animation.frame=requestAnimationFrame(tick);
    else{
      animation.value=target;
      animation.frame=0;
      element.textContent=formatter(target)+valueSuffix;
    }
  };
  animation.frame=requestAnimationFrame(tick);
}
