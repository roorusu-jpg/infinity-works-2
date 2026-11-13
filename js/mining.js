const SAVE_KEY="infinity-works-2-save-v1";
const oreTypes=[
{id:"copper",name:"銅鉱石",symbol:"Cu",color:"#d98b55"},{id:"iron",name:"鉄鉱石",symbol:"Fe",color:"#9aa8b7"},{id:"silver",name:"銀鉱石",symbol:"Ag",color:"#d6e2ef"},{id:"gold",name:"金鉱石",symbol:"Au",color:"#f5c95c"},{id:"mithril",name:"ミスリル",symbol:"Mi",color:"#73d8ed"},{id:"obsidian",name:"黒晶石",symbol:"Ob",color:"#a78bfa"},{id:"ruby",name:"紅蓮鉱石",symbol:"Ru",color:"#ff718c"},{id:"sapphire",name:"蒼玉鉱石",symbol:"Sa",color:"#68a9ff"},{id:"star",name:"星晶石",symbol:"St",color:"#c7a6ff"},{id:"chrono",name:"時空鉱石",symbol:"Ch",color:"#78e0c4"},{id:"void",name:"虚無鉱石",symbol:"Vo",color:"#a1a6c9"},{id:"omega",name:"オメガ鉱石",symbol:"Ω",color:"#f3a7ff"}];
function loadState(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY))||{};return {...saved,omega:Math.max(0,Number(saved.omega)||0),totalOmega:Math.max(0,Number(saved.totalOmega)||Number(saved.omega)||0),miningLevel:Math.max(0,Math.floor(Number(saved.miningLevel)||0)),miningDepth:Math.max(1,Math.min(oreTypes.length,Math.floor(Number(saved.miningDepth)||1))),ores:Object.fromEntries(oreTypes.map(o=>[o.id,Math.max(0,Number(saved.ores?.[o.id])||0)])),miningLastSeen:Number(saved.miningLastSeen)||Number(saved.lastSeen)||Date.now()};}catch{return {omega:0,totalOmega:0,miningLevel:0,miningDepth:1,ores:Object.fromEntries(oreTypes.map(o=>[o.id,0])),miningLastSeen:Date.now()};}}
let state=loadState();
function format(value){if(!Number.isFinite(value))return "∞";if(value<10000000)return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?2:0});const units=["M","B","T","Qa","Qi"];let n=value/1e6,i=0;while(n>=10000&&i<units.length-1){n/=1000;i++;}if(i===units.length-1&&n>=10000)return value.toExponential(2);return Number(n.toFixed(n<100?2:1))+units[i];}
function formatOmega(value){return value>0&&value<1?value.toFixed(4):format(value);}
function miningPower(){return 1+state.miningLevel*.5;}
function upgradeCost(){return 1.5*Math.pow(1.65,state.miningLevel);}
function depthCost(){return 5*Math.pow(2.5,state.miningDepth-1);}
function oreRate(index){return miningPower()*Math.pow(.62,index);}
function totalRate(){return oreTypes.slice(0,state.miningDepth).reduce((sum,ore,i)=>sum+oreRate(i),0);}
function applyMining(seconds){for(let i=0;i<state.miningDepth;i++){const id=oreTypes[i].id;state.ores[id]=(state.ores[id]||0)+oreRate(i)*seconds;}}
function save(){state.miningLastSeen=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}}
function render(){
 document.querySelector("#mining-omega").textContent=formatOmega(state.omega);
 document.querySelector("#mining-level").textContent=state.miningLevel;
 document.querySelector("#mining-power").textContent="×"+miningPower().toFixed(2);
 document.querySelector("#mining-depth").textContent=state.miningDepth+" / "+oreTypes.length;
 document.querySelector("#mining-rate").textContent=formatOmega(totalRate())+" 個 / 秒";
 const levelButton=document.querySelector("#mining-upgrade-button"),levelCost=upgradeCost();
 levelButton.disabled=state.omega<levelCost;
 document.querySelector("#mining-level-cost").textContent=formatOmega(levelCost)+" Ω";
 const depthButton=document.querySelector("#mining-depth-button"),nextDepth=state.miningDepth+1;
 if(state.miningDepth>=oreTypes.length){depthButton.disabled=true;depthButton.textContent="全採掘層を解放済み";}
 else{depthButton.disabled=state.omega<depthCost();depthButton.innerHTML="深度 "+nextDepth+" を解放<br><span id=\"mining-depth-cost\">"+formatOmega(depthCost())+" Ω</span>";}
 const grid=document.querySelector("#ore-grid");
 if(grid.dataset.initialized!=="true"){grid.innerHTML=oreTypes.map((ore,i)=>'<article class="ore-card" data-ore-card="'+ore.id+'" style="--ore-color:'+ore.color+'"><div class="ore-card-top"><span class="ore-symbol">'+ore.symbol+'</span><span class="ore-depth">深度 '+(i+1)+'</span></div><strong>'+ore.name+'</strong><span class="ore-amount" data-ore-count>未発見</span><small data-ore-rate>深度 '+(i+1)+' で発見</small></article>').join("");grid.dataset.initialized="true";}
 oreTypes.forEach((ore,i)=>{const card=grid.querySelector('[data-ore-card="'+ore.id+'"]'),unlocked=i<state.miningDepth;card.classList.toggle("is-locked",!unlocked);card.querySelector("[data-ore-count]").textContent=unlocked?format(state.ores[ore.id]||0):"未発見";card.querySelector("[data-ore-rate]").textContent=unlocked?formatOmega(oreRate(i))+" 個 / 秒":"深度 "+(i+1)+" で発見";});
}
document.querySelector("#mining-upgrade-button").addEventListener("click",()=>{const cost=upgradeCost();if(state.omega<cost)return;state.omega-=cost;state.miningLevel++;save();render();});
document.querySelector("#mining-depth-button").addEventListener("click",()=>{if(state.miningDepth>=oreTypes.length)return;const cost=depthCost();if(state.omega<cost)return;state.omega-=cost;state.miningDepth++;save();render();});
const offline=Math.max(0,Math.min(8*60*60,(Date.now()-state.miningLastSeen)/1000));
if(offline>0)applyMining(offline);
state.miningLastSeen=Date.now();save();render();
let lastTick=Date.now(),lastSave=Date.now();
setInterval(()=>{const now=Date.now(),dt=Math.max(0,Math.min(2,(now-lastTick)/1000));lastTick=now;applyMining(dt);render();if(now-lastSave>=5000){save();lastSave=now;}},250);
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();else{const now=Date.now(),elapsed=Math.max(0,Math.min(8*60*60,(now-state.miningLastSeen)/1000));applyMining(elapsed);lastTick=now;save();render();}});
window.addEventListener("pagehide",save);
