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
  const duration=reducedMotion?0:420;
  animation.target=target;
  if(duration===0){
    animation.value=target;
    animation.frame=0;
    element.textContent=formatter(target)+valueSuffix;
    return;
  }
  let startedAt=0;
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


const rollingNumbers=new WeakMap();

function createRollingDigit(digit){
  const windowNode=document.createElement("span");
  windowNode.className="odometer-digit";
  const strip=document.createElement("span");
  strip.className="odometer-strip";
  for(let cycle=0;cycle<3;cycle++){
    for(let value=0;value<10;value++){
      const cell=document.createElement("span");
      cell.textContent=String(value);
      strip.append(cell);
    }
  }
  windowNode.append(strip);
  strip.style.transition="none";
  strip.style.transform="translateY(-"+(10+Number(digit))+"em)";
  strip.dataset.position=String(10+Number(digit));
  windowNode.dataset.digit=String(digit);
  strip.addEventListener("transitionend",event=>{
    if(event.propertyName!=="transform")return;
    const current=Number(windowNode.dataset.digit)||0;
    strip.style.transition="none";
    strip.style.transform="translateY(-"+(10+current)+"em)";
    strip.dataset.position=String(10+current);
    requestAnimationFrame(()=>{strip.style.transition="";});
  });
  requestAnimationFrame(()=>{strip.style.transition="";});
  return windowNode;
}

export function setRollingNumber(element,target,formatter){
  if(!element)return;
  target=Number(target);
  if(!Number.isFinite(target))return;
  const text=formatter(target);
  let state=rollingNumbers.get(element);
  if(!state){
    state={target:null,text:"",signature:"",digits:new Map(),lastSurgeAt:0};
    rollingNumbers.set(element,state);
  }
  if(state.text===text&&state.target===target)return;
  const previousTarget=state.target;
  const signature=text.replace(/[0-9]/g,"#");
  if(signature!==state.signature){
    state.digits.clear();
    const nodes=[];
    const totalDigits=(text.match(/[0-9]/g)||[]).length;
    let digitOrdinal=0;
    for(const character of text){
      if(/[0-9]/.test(character)){
        const node=createRollingDigit(character);
        const place=totalDigits-1-digitOrdinal;
        state.digits.set(place,node);
        nodes.push(node);
        digitOrdinal++;
      }else{
        const node=document.createElement("span");
        node.className="odometer-static";
        node.textContent=character;
        nodes.push(node);
      }
    }
    element.replaceChildren(...nodes);
    state.signature=signature;
  }else{
    let place=0;
    const characters=[...text];
    for(let index=characters.length-1;index>=0;index--){
      const character=characters[index];
      if(!/[0-9]/.test(character))continue;
      const node=state.digits.get(place);
      if(node){
        const strip=node.firstElementChild;
        const oldDigit=Number(node.dataset.digit)||0;
        const nextDigit=Number(character);
        const currentPosition=Number(strip.dataset.position)||10+oldDigit;
        if(nextDigit!==oldDigit){
          const increasing=previousTarget===null||target>=previousTarget;
          const steps=increasing?(nextDigit-oldDigit+10)%10:(oldDigit-nextDigit+10)%10;
          const nextPosition=currentPosition+(increasing?steps:-steps);
          strip.dataset.position=String(nextPosition);
          strip.style.transform="translateY(-"+nextPosition+"em)";
          node.dataset.digit=String(nextDigit);
        }
      }
      place++;
    }
  }
  state.target=target;
  state.text=text;
  if(previousTarget!==null&&target>previousTarget){
    const crossedMagnitude=previousTarget>0&&Math.floor(Math.log10(target))>Math.floor(Math.log10(previousTarget));
    const substantial=target-previousTarget>=Math.max(100,previousTarget*0.12);
    const now=performance.now();
    const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if((crossedMagnitude||substantial)&&now-state.lastSurgeAt>650&&!reducedMotion){
      const wrap=element.closest(".energy-counter-wrap");
      if(wrap){
        wrap.classList.remove("is-surging");
        void wrap.offsetWidth;
        wrap.classList.add("is-surging");
        state.lastSurgeAt=now;
      }
    }
  }
}
