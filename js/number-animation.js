import {playElectricCrackle} from "./electric-audio.js?v=0.74.4";
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
  const position=10+Number(digit);
  strip.style.transform="translateY(-"+position+"em)";
  windowNode.dataset.digit=String(digit);
  const state={position,from:position,to:position,start:0,duration:0,frame:0};
  rollingDigitStates.set(strip,state);
  return windowNode;
}

const rollingDigitStates=new WeakMap();

function currentDigitPosition(strip,state,now){
  if(!state.frame||!state.duration)return state.to;
  const progress=Math.min(1,Math.max(0,(now-state.start)/state.duration));
  const eased=1-Math.pow(1-progress,3);
  return state.from+(state.to-state.from)*eased;
}

function moveRollingDigit(node,nextDigit,increasing,reducedMotion){
  const strip=node.firstElementChild;
  const state=rollingDigitStates.get(strip);
  if(!state)return;
  const now=performance.now();
  let current=currentDigitPosition(strip,state,now);
  if(state.frame)cancelAnimationFrame(state.frame);

  // The strip contains three identical digit cycles. Re-center without changing
  // the visible digit so repeated updates can never run beyond its boundaries.
  if(current<10||current>19){
    const shift=current<10?10:-10;
    current+=shift;
    state.to+=shift;
    strip.style.transform="translateY(-"+current+"em)";
  }
  const digit=Number(nextDigit);
  let destination=Math.floor(current/10)*10+digit;
  if(increasing){
    while(destination<=current+0.001)destination+=10;
  }else{
    while(destination>=current-0.001)destination-=10;
  }
  const distance=Math.abs(destination-current);
  if(reducedMotion||distance<0.001){
    state.position=destination;
    state.from=destination;
    state.to=destination;
    state.duration=0;
    state.frame=0;
    strip.style.transform="translateY(-"+destination+"em)";
    return;
  }
  state.position=current;
  state.from=current;
  state.to=destination;
  state.start=now;
  state.duration=Math.min(460,Math.max(90,distance*78));
  const tick=time=>{
    const progress=Math.min(1,(time-state.start)/state.duration);
    const eased=1-Math.pow(1-progress,3);
    const position=state.from+(state.to-state.from)*eased;
    state.position=position;
    strip.style.transform="translateY(-"+position+"em)";
    if(progress<1)state.frame=requestAnimationFrame(tick);
    else{
      state.position=state.to;
      state.frame=0;
      strip.style.transform="translateY(-"+state.to+"em)";
    }
  };
  state.frame=requestAnimationFrame(tick);
}

function triggerScreenVoltage(rebirthSurge=false){
  if(!rebirthSurge){if(/Android/i.test(navigator.userAgent)&&typeof navigator.vibrate==="function")navigator.vibrate([35,25,55]);}
  let overlay=document.querySelector(".screen-voltage-overlay");
  if(!overlay){
    overlay=document.createElement("div");
    overlay.className="screen-voltage-overlay";
    overlay.setAttribute("aria-hidden","true");
    document.body.append(overlay);
  }
  overlay.classList.remove("is-active","is-rebirth-surge");
  void overlay.offsetWidth;
  if(rebirthSurge)overlay.classList.add("is-rebirth-surge");
  overlay.classList.add("is-active");
}

export function triggerRebirthVoltage(){
  triggerScreenVoltage(true);
}

export function setRollingNumber(element,target,formatter){
  if(!element)return;
  target=Number(target);
  if(!Number.isFinite(target))return;
  const text=formatter(target);
  let state=rollingNumbers.get(element);
  if(!state){
    state={target:null,text:"",signature:"",digits:new Map(),lastSurgeAt:0,lastScreenSurgeAt:0};
    rollingNumbers.set(element,state);
  }
  if(state.text===text&&state.target===target)return;
  const previousTarget=state.target;
  const signature=text.replace(/[0-9]/g,"#");
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
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
    const increasing=previousTarget===null||target>=previousTarget;
    for(let index=characters.length-1;index>=0;index--){
      const character=characters[index];
      if(!/[0-9]/.test(character))continue;
      const node=state.digits.get(place);
      if(node&&Number(character)!==Number(node.dataset.digit)){
        moveRollingDigit(node,character,increasing,reducedMotion);
        node.dataset.digit=character;
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
    if(crossedMagnitude&&now-state.lastScreenSurgeAt>900){
      playElectricCrackle(0.27);
      if(!reducedMotion)triggerScreenVoltage();
      state.lastScreenSurgeAt=now;
    }
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
