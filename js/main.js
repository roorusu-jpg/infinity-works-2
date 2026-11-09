const SAVE_KEY = "infinity-works-2-save-v1";
const factories = [
  { id:"drone", name:"採掘ドローン", description:"小惑星からエネルギー資源を回収", symbol:"D", baseCost:15, production:0.2 },
  { id:"collector", name:"エネルギー収集機", description:"周辺空間からエネルギーを収集", symbol:"E", baseCost:100, production:1.5 },
  { id:"plant", name:"自動生産工場", description:"安定したエネルギーを大量生産", symbol:"F", baseCost:750, production:10 },
  { id:"reactor", name:"核融合リアクター", description:"高密度エネルギーを連続生成", symbol:"R", baseCost:6000, production:85 },
  { id:"orbital", name:"軌道太陽光発電所", description:"惑星軌道上で恒星エネルギーを回収", symbol:"O", baseCost:50000, production:650 },
  { id:"helium", name:"ヘリウム3精製プラント", description:"月面資源から高効率燃料を精製", symbol:"H", baseCost:420000, production:5200 },
  { id:"antimatter", name:"反物質生成施設", description:"反物質反応による超高出力発電", symbol:"A", baseCost:3500000, production:42000 },
  { id:"dyson", name:"ダイソン・コレクター", description:"恒星を包む巨大集光ネットワーク", symbol:"Y", baseCost:30000000, production:350000 },
  { id:"fusion", name:"恒星融合プラント", description:"小型恒星炉を連結した発電区画", symbol:"S", baseCost:260000000, production:3000000 },
  { id:"quantum", name:"量子真空発電所", description:"量子ゆらぎからエネルギーを抽出", symbol:"Q", baseCost:2200000000, production:26000000 },
  { id:"gate", name:"次元ゲート発電機", description:"別次元とのエネルギー交換を実現", symbol:"G", baseCost:19000000000, production:220000000 },
  { id:"neutron", name:"中性子星採掘基地", description:"超高密度天体のエネルギーを利用", symbol:"N", baseCost:160000000000, production:1900000000 },
  { id:"blackhole", name:"ブラックホール発電リング", description:"事象の地平面付近で膨大な出力を得る", symbol:"B", baseCost:1400000000000, production:16000000000 },
  { id:"stellar", name:"恒星系エネルギー網", description:"恒星系全域を結ぶ巨大送電網", symbol:"星", baseCost:12000000000000, production:140000000000 },
  { id:"galactic", name:"銀河核融合アレイ", description:"銀河中心の資源を統合して発電", symbol:"銀", baseCost:100000000000000, production:1200000000000 },
  { id:"cosmic", name:"宇宙背景波コンバーター", description:"宇宙全体に広がる背景エネルギーを変換", symbol:"宇", baseCost:900000000000000, production:10000000000000 },
  { id:"brane", name:"ブレーン振動炉", description:"高次元空間の振動をエネルギーへ変換", symbol:"次", baseCost:8000000000000000, production:90000000000000 },
  { id:"singularity", name:"特異点エンジン", description:"人工特異点を利用した究極の発電機", symbol:"特", baseCost:70000000000000000, production:800000000000000 },
  { id:"universe", name:"宇宙創成リアクター", description:"新たな宇宙の膨張エネルギーを回収", symbol:"創", baseCost:600000000000000000, production:7000000000000000 },
  { id:"infinity", name:"インフィニティ・コア", description:"無限のエネルギー循環を生み出す最終施設", symbol:"∞", baseCost:5000000000000000000, production:60000000000000000 }
];
const upgrades = [
  { id:"click2", name:"強化型グローブ", description:"クリック出力を +1", cost:25, apply:s=>s.clickPower+=1 },
  { id:"click3", name:"量子駆動ツール", description:"クリック出力を +5", cost:250, apply:s=>s.clickPower+=5 },
  { id:"click4", name:"神経リンク強化", description:"クリック出力を +25", cost:2500, apply:s=>s.clickPower+=25 }
];
const freshState = () => ({
  energy:0, clickPower:1, productionMultiplier:1, costMultiplier:1,
  factories:Object.fromEntries(factories.map(f=>[f.id,0])),
  unlockedFactoryCount:4, purchased:[], upgradeLevels:{}, skills:[], lifetime:0, runLifetime:0, prestigePoints:0, prestigeCount:0, lastSeen:Date.now()
});
let state = loadGame();
function loadGame(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return freshState();
    const base=freshState();
    return {...base,...saved,
      factories:{...base.factories,...(saved.factories||{})},
      unlockedFactoryCount:Math.max(4,Math.min(factories.length,Number(saved.unlockedFactoryCount)||4)),
      purchased:Array.isArray(saved.purchased)?saved.purchased:[],
      upgradeLevels:Object.fromEntries([...new Set([...(saved.purchased||[]),...Object.keys(saved.upgradeLevels||{})])].map(id=>[id,Math.max(Number(saved.upgradeLevels?.[id])||0,(saved.purchased||[]).includes(id)?1:0)])),
      skills:Array.isArray(saved.skills)?saved.skills:[],
      runLifetime:Math.max(0,Number(saved.runLifetime ?? saved.lifetime)||0),
      prestigePoints:Math.max(0,Number(saved.prestigePoints)||0),
      prestigeCount:Math.max(0,Number(saved.prestigeCount)||0)
    };
  } catch { return freshState(); }
}
function prestigeMultiplier(){ return 1+(state.prestigePoints*0.1); }
function upgradeCost(upgrade,level){return Math.ceil(upgrade.cost*Math.pow(1.65,level));}
function upgradeBatchInfo(upgrade,mode){
  const level=state.upgradeLevels[upgrade.id]||0;
  if(mode==="max"){let count=0,total=0;while(count<10000){const next=upgradeCost(upgrade,level+count);if(total+next>state.energy)break;total+=next;count++;}return {count,total};}
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));let total=0;
  for(let i=0;i<quantity;i++)total+=upgradeCost(upgrade,level+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.factories[f.id]||0)*f.production,0)*state.productionMultiplier*prestigeMultiplier(); }
function prestigeGain(){ return Math.floor(Math.sqrt(Math.max(0,state.runLifetime)/1_000_000_000)); }
function nextPrestigeThreshold(){ const next=prestigeGain()+1; return next*next*1_000_000_000; }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value < 1000) return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["","K","M","B","T","Qa","Qi"];
  let n=value,i=0; while(n>=1000&&i<units.length-1){n/=1000;i++;}
  return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];
}
function costAt(factory,owned){ return Math.ceil(factory.baseCost*Math.pow(1.16,owned)*state.costMultiplier); }
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
  document.querySelector("#click-power").textContent=format(state.clickPower*prestigeMultiplier());
  document.querySelector("#factory-count").textContent=factories.reduce((n,f)=>n+state.factories[f.id],0)+" 基";
  document.querySelector("#lifetime").textContent=format(state.lifetime);
  const mode=document.querySelector("#buy-mode").value;
  const visibleFactories=factories.slice(0,state.unlockedFactoryCount);
  const factoryList=document.querySelector("#factory-list");
  const factoryMarkup=visibleFactories.map(f=>{
    const info=batchInfo(f,mode),owned=state.factories[f.id]||0;
    const label=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    return `<article class="shop-item"><div class="item-symbol">${f.symbol}</div><div class="item-info"><strong>${f.name}</strong><small>${f.description}</small><small>生産：${format(f.production*state.productionMultiplier*prestigeMultiplier())} / 秒 · <span class="owned">所有：${owned}</span></small></div><button class="buy-button" data-buy="${f.id}" ${info.count===0?"disabled":""}>${label}<br>${info.count===0&&mode!=="max"?"必要 "+format(info.total):format(info.total)}</button></article>`;
  }).join("");
  if(factoryList.dataset.renderedMarkup!==factoryMarkup){
    const scrollTop=factoryList.scrollTop;
    factoryList.innerHTML=factoryMarkup;
    factoryList.dataset.renderedMarkup=factoryMarkup;
    factoryList.scrollTop=scrollTop;
  }
  const progress=document.querySelector("#factory-progress");
  if(state.unlockedFactoryCount<factories.length){
    const topFactory=visibleFactories[visibleFactories.length-1];
    const owned=state.factories[topFactory.id]||0;
    progress.textContent=`次の工場解放：${topFactory.name}を10基購入（現在 ${Math.min(owned,10)} / 10）`;
  } else {
    progress.textContent="全20種類の工場を解放済み";
  }
  document.querySelector("#prestige-points").textContent=format(state.prestigePoints);
  document.querySelector("#prestige-multiplier").textContent="×"+prestigeMultiplier().toFixed(2);
  document.querySelector("#prestige-run").textContent=format(state.runLifetime);
  const gain=prestigeGain();
  document.querySelector("#prestige-gain").textContent="+"+gain+" ポイント";
  document.querySelector("#prestige-requirement").textContent=gain>0
    ? "転生すると "+gain+" ポイントを獲得できます。"
    : "次の1ポイントまで "+format(Math.max(0,nextPrestigeThreshold()-state.runLifetime))+" エネルギー必要";
  document.querySelector("#prestige-button").disabled=gain<1;
  document.querySelector("#upgrade-list").innerHTML=upgrades.map(u=>{
    const level=state.upgradeLevels[u.id]||0,info=upgradeBatchInfo(u,mode);
    const label=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    return `<article class="shop-item"><div class="item-symbol">+</div><div class="item-info"><strong>${u.name}</strong><small>${u.description}</small><small><span class="owned">購入数：${level}</span> · 次回価格：${format(upgradeCost(u,level))}</small></div><button class="buy-button" data-upgrade="${u.id}" ${info.count===0?"disabled":""}>${label}<br>${format(info.total)}</button></article>`;
  }).join("");
}
function gain(amount){ state.energy+=amount; state.lifetime+=amount; state.runLifetime+=amount; }
function performPrestige(){
  const earned=prestigeGain();
  if(earned<1)return;
  const message="転生すると、エネルギー・工場・通常強化がリセットされます。スキルツリーと転生ポイントは引き継がれます。\n\n"+earned+"ポイントを獲得して転生しますか？";
  if(!window.confirm(message))return;
  state.prestigePoints+=earned;
  state.prestigeCount+=1;
  state.energy=0;
  state.clickPower=1+(state.skills.includes("tap1")?2:0)+(state.skills.includes("tap2")?8:0)+(state.skills.includes("tap3")?25:0);
  state.factories=Object.fromEntries(factories.map(f=>[f.id,0]));
  state.unlockedFactoryCount=4;
  state.purchased=[];
  state.upgradeLevels={};
  state.runLifetime=0;
  document.querySelector("#click-feedback").textContent="転生完了！生産倍率が強化されました。";
  render();
  saveGame();
}
function checkFactoryUnlock(){
  if(state.unlockedFactoryCount>=factories.length)return false;
  const top=factories[state.unlockedFactoryCount-1];
  if((state.factories[top.id]||0)<10)return false;
  state.unlockedFactoryCount++;
  return true;
}
document.querySelector("#buy-mode").addEventListener("change",render);
document.querySelector("#prestige-button").addEventListener("click",performPrestige);
document.querySelector("#produce-button").addEventListener("click",()=>{
  gain(state.clickPower*prestigeMultiplier());
  document.querySelector("#click-feedback").textContent="+"+format(state.clickPower)+" ENERGY";
  render();
});
document.querySelector("#factory-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-buy]"); if(!button)return;
  const index=factories.findIndex(x=>x.id===button.dataset.buy);
  if(index<0||index>=state.unlockedFactoryCount)return;
  const f=factories[index],mode=document.querySelector("#buy-mode").value;
  const info=batchInfo(f,mode);
  if(info.count===0||state.energy<info.total)return;
  state.energy-=info.total;
  state.factories[f.id]+=info.count;
  const unlocked=checkFactoryUnlock();
  render(); saveGame();
  if(unlocked)document.querySelector("#click-feedback").textContent="新しい自動生産工場が解放されました！";
});
document.querySelector("#upgrade-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-upgrade]");if(!button)return;
  const u=upgrades.find(x=>x.id===button.dataset.upgrade);if(!u)return;
  const mode=document.querySelector("#buy-mode").value,info=upgradeBatchInfo(u,mode);
  if(info.count<1||state.energy<info.total)return;
  state.energy-=info.total;
  for(let i=0;i<info.count;i++)u.apply(state);
  state.upgradeLevels[u.id]=(state.upgradeLevels[u.id]||0)+info.count;
  if(!state.purchased.includes(u.id))state.purchased.push(u.id);
  render();saveGame();
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
checkFactoryUnlock();
render();
saveGame();
