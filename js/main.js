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
const freshState = () => ({ energy:0, clickPower:1, factories:{drone:0,collector:0,plant:0,reactor:0}, purchased:[], lifetime:0, lastSeen:Date.now() });
let state = loadGame();
function loadGame(){
  try { const saved=JSON.parse(localStorage.getItem(SAVE_KEY)); return saved ? {...freshState(),...saved,factories:{...freshState().factories,...saved.factories}} : freshState(); }
  catch { return freshState(); }
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.factories[f.id]||0)*f.production,0); }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value < 1000) return value.toLocaleString("ja-JP",{maximumFractionDigits: value<10?1:0});
  const units=["","K","M","B","T","Qa","Qi"];
  let n=value, i=0; while(n>=1000 && i<units.length-1){n/=1000;i++;}
  return i===units.length-1 && n>=1000 ? value.toExponential(2) : n.toFixed(n<10?2:1)+units[i];
}
function costOf(factory){ return Math.ceil(factory.baseCost*Math.pow(1.16,state.factories[factory.id]||0)); }
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
  document.querySelector("#factory-list").innerHTML=factories.map(f=>{
    const cost=costOf(f), owned=state.factories[f.id];
    return `<article class="shop-item"><div class="item-symbol">${f.symbol}</div><div class="item-info"><strong>${f.name}</strong><small>${f.description}</small><small>生産：${format(f.production)} / 秒 · <span class="owned">所有：${owned}</span></small></div><button class="buy-button" data-buy="${f.id}" ${state.energy<cost?"disabled":""}>購入<br>${format(cost)}</button></article>`;
  }).join("");
  document.querySelector("#upgrade-list").innerHTML=upgrades.map(u=>{
    const owned=state.purchased.includes(u.id);
    return `<article class="shop-item"><div class="item-symbol">+</div><div class="item-info"><strong>${u.name}</strong><small>${u.description}</small><small>${owned?'<span class="owned">取得済み</span>':'必要エネルギー：'+format(u.cost)}</small></div><button class="buy-button" data-upgrade="${u.id}" ${owned||state.energy<u.cost?"disabled":""}>${owned?"取得済み":"強化"}</button></article>`;
  }).join("");
}
function gain(amount){ state.energy+=amount; state.lifetime+=amount; }
document.querySelector("#produce-button").addEventListener("click",()=>{
  gain(state.clickPower);
  document.querySelector("#click-feedback").textContent="+"+format(state.clickPower)+" ENERGY";
  render();
});
document.querySelector("#factory-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-buy]"); if(!button)return;
  const f=factories.find(x=>x.id===button.dataset.buy); const cost=costOf(f);
  if(state.energy<cost)return;
  state.energy-=cost; state.factories[f.id]++; render(); saveGame();
});
document.querySelector("#upgrade-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-upgrade]"); if(!button)return;
  const u=upgrades.find(x=>x.id===button.dataset.upgrade);
  if(!u||state.purchased.includes(u.id)||state.energy<u.cost)return;
  state.energy-=u.cost; u.apply(state); state.purchased.push(u.id); render(); saveGame();
});
const elapsed=Math.max(0,Math.min(8*60*60,(Date.now()-(state.lastSeen||Date.now()))/1000));
if(elapsed>5 && totalPerSecond()>0){
  const bonus=totalPerSecond()*elapsed; gain(bonus);
  document.querySelector("#click-feedback").textContent="オフライン生産：+"+format(bonus)+" ENERGY";
}
let last=Date.now();
setInterval(()=>{
  const now=Date.now(), dt=Math.min(2,(now-last)/1000); last=now;
  const production=totalPerSecond()*dt;
  if(production>0)gain(production);
  render();
},250);
setInterval(saveGame,10000);
window.addEventListener("beforeunload",saveGame);
render();
saveGame();