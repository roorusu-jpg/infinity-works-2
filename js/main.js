const SAVE_KEY = "infinity-works-2-save-v1";
const factories = [
  { id:"drone", name:"採掘ドローン", description:"小惑星からエネルギー資源を回収", symbol:"D", baseCost:15, production:0.2 },
  { id:"collector", name:"エネルギー収集機", description:"周辺空間からエネルギーを収集", symbol:"E", baseCost:100, production:1.5 },
  { id:"plant", name:"自動生産工場", description:"安定したエネルギーを大量生産", symbol:"F", baseCost:750, production:10 },
  { id:"reactor", name:"核融合リアクター", description:"高密度エネルギーを連続生成", symbol:"R", baseCost:6000, production:85 }
];
const upgrades = [
  { id:"click2", name:"強化型グローブ", description:"クリック出力を +1", cost:25, apply:s=>s.clickPower+=1 },
  { id:"click3", name:"量子駆動ツール", description:"クリック出力を +5", cost:250, apply:s=>s.clickPower+=5 },
  { id:"click4", name:"神経リンク強化", description:"クリック出力を +25", cost:2500, apply:s=>s.clickPower+=25 }
];
const skills = [
  { id:"tap1", name:"高効率エネルギー採取", branch:"CORE", description:"クリック出力 +2", cost:100, requires:[], apply:s=>s.clickPower+=2 },
  { id:"tap2", name:"量子反応制御", branch:"CORE", description:"クリック出力 +8", cost:600, requires:["tap1"], apply:s=>s.clickPower+=8 },
  { id:"tap3", name:"超伝導エネルギー収束", branch:"CORE", description:"クリック出力 +25", cost:3000, requires:["tap2"], apply:s=>s.clickPower+=25 },
  { id:"prod1", name:"自動化最適化", branch:"AUTOMATION", description:"全施設の生産量 ×1.25", cost:250, requires:[], apply:s=>s.productionMultiplier*=1.25 },
  { id:"prod2", name:"反応炉同期ネットワーク", branch:"AUTOMATION", description:"全施設の生産量 ×1.5", cost:1200, requires:["prod1"], apply:s=>s.productionMultiplier*=1.5 },
  { id:"prod3", name:"恒星炉連結システム", branch:"AUTOMATION", description:"全施設の生産量 ×2", cost:5000, requires:["prod2"], apply:s=>s.productionMultiplier*=2 },
  { id:"eco1", name:"資源循環プロトコル", branch:"INDUSTRY", description:"施設の購入価格 ×0.9", cost:400, requires:[], apply:s=>s.costMultiplier*=0.9 },
  { id:"eco2", name:"予測型生産管理", branch:"INDUSTRY", description:"施設の購入価格 ×0.85", cost:1800, requires:["eco1"], apply:s=>s.costMultiplier*=0.85 },
  { id:"eco3", name:"銀河規模の資源最適化", branch:"INDUSTRY", description:"施設の購入価格 ×0.75", cost:7500, requires:["eco2"], apply:s=>s.costMultiplier*=0.75 }
];
const freshState = () => ({ energy:0, clickPower:1, productionMultiplier:1, costMultiplier:1, factories:{drone:0,collector:0,plant:0,reactor:0}, purchased:[], skills:[], lifetime:0, lastSeen:Date.now() });
let state = loadGame();
function loadGame(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return freshState();
    return {...freshState(),...saved,
      factories:{...freshState().factories,...saved.factories},
      purchased:Array.isArray(saved.purchased)?saved.purchased:[],
      skills:Array.isArray(saved.skills)?saved.skills:[]
    };
  } catch { return freshState(); }
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.factories[f.id]||0)*f.production,0)*state.productionMultiplier; }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value < 1000) return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["","K","M","B","T","Qa","Qi"];
  let n=value,i=0; while(n>=1000&&i<units.length-1){n/=1000;i++;}
  return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];
}
function costAt(factory,owned){ return Math.ceil(factory.baseCost*Math.pow(1.16,owned)*state.costMultiplier); }
function costOf(factory){ return costAt(factory,state.factories[factory.id]||0); }
function batchInfo(factory,mode){
  const owned=state.factories[factory.id]||0;
  if(mode==="max"){
    let count=0,total=0;
    while(count<10000){
      const next=costAt(factory,owned+count);
      if(total+next>state.energy)break;
      total+=next;count++;
    }
    return {count,total};
  }
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));
  let total=0;
  for(let i=0;i<quantity;i++)total+=costAt(factory,owned+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function saveGame(){
  state.lastSeen=Date.now();
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); document.querySelector("#save-status").textContent="セーブ済み · "+new Date().toLocaleTimeString("ja-JP"); }
  catch { document.querySelector("#save-status").textContent="セーブできませんでした"; }
}
function render(){
  document.querySelector("#energy").textContent=format(state.energy);
  document.querySelector("#per-second").textContent=format(totalPerSecond())+" / 秒";
  document.querySelector("#click-power").textContent=format(state.clickPower);
  document.querySelector("#factory-count").textContent=factories.reduce((n,f)=>n+state.factories[f.id],0)+" 基";
  document.querySelector("#lifetime").textContent=format(state.lifetime);
  const mode=document.querySelector("#buy-mode").value;
  document.querySelector("#factory-list").innerHTML=factories.map(f=>{
    const info=batchInfo(f,mode),owned=state.factories[f.id];
    const label=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    const costLabel=mode==="max"?format(info.total):format(info.total);
    return `<article class="shop-item"><div class="item-symbol">${f.symbol}</div><div class="item-info"><strong>${f.name}</strong><small>${f.description}</small><small>生産：${format(f.production*state.productionMultiplier)} / 秒 · <span class="owned">所有：${owned}</span></small></div><button class="buy-button" data-buy="${f.id}" ${info.count===0?"disabled":""}>${label}<br>${info.count===0&&mode!=="max"?"必要 "+costLabel:costLabel}</button></article>`;
  }).join("");
  document.querySelector("#upgrade-list").innerHTML=upgrades.map(u=>{
    const owned=state.purchased.includes(u.id);
    return `<article class="shop-item"><div class="item-symbol">+</div><div class="item-info"><strong>${u.name}</strong><small>${u.description}</small><small>${owned?'<span class="owned">取得済み</span>':"必要エネルギー："+format(u.cost)}</small></div><button class="buy-button" data-upgrade="${u.id}" ${owned||state.energy<u.cost?"disabled":""}>${owned?"取得済み":"強化"}</button></article>`;
  }).join("");
  document.querySelector("#skill-list").innerHTML=skills.map(skill=>{
    const owned=state.skills.includes(skill.id);
    const locked=skill.requires.some(id=>!state.skills.includes(id));
    const affordable=state.energy>=skill.cost;
    const requirement=locked?"前提スキルを取得すると解放":owned?"取得済み":"必要エネルギー："+format(skill.cost);
    return `<article class="skill-card ${owned?"skill-owned":locked?"skill-locked":""}"><div class="skill-branch">${skill.branch}</div><strong>${skill.name}</strong><p>${skill.description}</p><small>${requirement}</small><button class="buy-button" data-skill="${skill.id}" ${owned||locked||!affordable?"disabled":""}>${owned?"取得済み":locked?"ロック中":"研究する · "+format(skill.cost)}</button></article>`;
  }).join("");
  document.querySelector("#skill-count").textContent=state.skills.length+" / "+skills.length+" 取得";
}
function gain(amount){ state.energy+=amount; state.lifetime+=amount; }
document.querySelector("#buy-mode").addEventListener("change",render);
document.querySelector("#produce-button").addEventListener("click",()=>{
  gain(state.clickPower);
  document.querySelector("#click-feedback").textContent="+"+format(state.clickPower)+" ENERGY";
  render();
});
document.querySelector("#factory-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-buy]"); if(!button)return;
  const f=factories.find(x=>x.id===button.dataset.buy); if(!f)return;
  const mode=document.querySelector("#buy-mode").value;
  const info=batchInfo(f,mode);
  if(info.count===0||state.energy<info.total)return;
  state.energy-=info.total;
  state.factories[f.id]+=info.count;
  render(); saveGame();
});
document.querySelector("#upgrade-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-upgrade]"); if(!button)return;
  const u=upgrades.find(x=>x.id===button.dataset.upgrade);
  if(!u||state.purchased.includes(u.id)||state.energy<u.cost)return;
  state.energy-=u.cost; u.apply(state); state.purchased.push(u.id); render(); saveGame();
});
document.querySelector("#skill-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-skill]"); if(!button)return;
  const skill=skills.find(x=>x.id===button.dataset.skill);
  if(!skill||state.skills.includes(skill.id)||state.energy<skill.cost||skill.requires.some(id=>!state.skills.includes(id)))return;
  state.energy-=skill.cost; skill.apply(state); state.skills.push(skill.id); render(); saveGame();
});
const elapsed=Math.max(0,Math.min(8*60*60,(Date.now()-(state.lastSeen||Date.now()))/1000));
if(elapsed>5&&totalPerSecond()>0){
  const bonus=totalPerSecond()*elapsed; gain(bonus);
  document.querySelector("#click-feedback").textContent="オフライン生産：+"+format(bonus)+" ENERGY";
}
let last=Date.now();
setInterval(()=>{
  const now=Date.now(),dt=Math.min(2,(now-last)/1000); last=now;
  const production=totalPerSecond()*dt;
  if(production>0)gain(production);
  render();
},250);
setInterval(saveGame,10000);
window.addEventListener("beforeunload",saveGame);
render();
saveGame();
