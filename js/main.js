import {setAnimatedNumber} from "./number-animation.js";
import {migrateAstralBalance,astralTreeEffects as calculateAstralTreeEffects} from "./astral-balance.js";
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
function prestigeSkillSpent(skills){
  const costAt=t=>Math.ceil(t*Math.pow(2.35,t-1));
  const branches=["click","production","economy","offline","start","resonance","singularity"];
  return (Array.isArray(skills)?skills:[]).reduce((sum,id)=>{
    const tierMatch=id.match(/^rebirth-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
    if(tierMatch)return sum+costAt(Number(tierMatch[2]));
    const linkMatch=id.match(/^rebirth-link-(click|production|economy|offline|start|resonance|singularity)-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
    if(linkMatch&&branches.includes(linkMatch[1])&&branches.includes(linkMatch[2]))return sum+Math.ceil(costAt(Number(linkMatch[3]))*2.5);
    return sum;
  },0);
}
const freshState = () => ({
  energy:0, clickPower:1, productionMultiplier:1, costMultiplier:1,
  factories:Object.fromEntries(factories.map(f=>[f.id,0])),
  prestigeSkills:[],
  unlockedFactoryCount:4, purchased:[], upgradeLevels:{}, skills:[], lifetime:0, runLifetime:0, prestigePoints:0, totalPrestigePoints:0, prestigeCount:0, ap:0, totalAP:0, astralSkills:[], lastSeen:Date.now()
});
let state = loadGame();
let isResettingSave = false;
function loadGame(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return freshState();
    const base=freshState();
    const normalized={...base,...saved,
      factories:{...base.factories,...(saved.factories||{})},
      unlockedFactoryCount:Math.max(4,Math.min(factories.length,Number(saved.unlockedFactoryCount)||4)),
      purchased:Array.isArray(saved.purchased)?saved.purchased:[],
      upgradeLevels:Object.fromEntries([...new Set([...(saved.purchased||[]),...Object.keys(saved.upgradeLevels||{})])].map(id=>[id,Math.max(Number(saved.upgradeLevels?.[id])||0,(saved.purchased||[]).includes(id)?1:0)])),
      skills:Array.isArray(saved.skills)?saved.skills:[],
      runLifetime:Math.max(0,Number(saved.runLifetime ?? saved.lifetime)||0),
      prestigePoints:Math.max(0,Number(saved.prestigePoints)||0),
      totalPrestigePoints:Math.max(0,Number(saved.totalPrestigePoints)||0,Math.max(0,Number(saved.prestigePoints)||0)+prestigeSkillSpent(saved.prestigeSkills)),
      prestigeCount:Math.max(0,Number(saved.prestigeCount)||0),
      ap:Math.max(0,Number(saved.ap)||0),
      totalAP:Math.max(0,Number(saved.totalAP)||Number(saved.ap)||0),
      astralSkills:Array.isArray(saved.astralSkills)?saved.astralSkills:[],
      prestigeSkills:Array.isArray(saved.prestigeSkills)?saved.prestigeSkills:[]
    };
    return migrateAstralBalance(normalized).state;
  } catch { return freshState(); }
}
function prestigeTreeEffects(){
 const effects={click:1,production:1,cost:1,offline:1,startEnergy:0};
 const tiers={click:[1.05,1.08,1.12,1.18,1.25,1.32,1.4,1.5,1.65,1.8,2,2.25],production:[1.05,1.08,1.12,1.18,1.25,1.32,1.4,1.5,1.65,1.8,2,2.25],economy:[.98,.97,.96,.95,.94,.93,.92,.91,.9,.88,.86,.84],offline:[1.1,1.15,1.2,1.3,1.4,1.5,1.65,1.8,2,2.25,2.5,3],start:[100,500,2000,10000,50000,250000,1e6,5e6,2.5e7,1e8,5e8,2.5e9],resonance:[1.02,1.03,1.04,1.05,1.07,1.09,1.12,1.15,1.2,1.25,1.32,1.4],singularity:[1.01,1.015,1.02,1.025,1.03,1.04,1.05,1.06,1.08,1.1,1.12,1.15]};
 for(const id of state.prestigeSkills||[]){
  const m=id.match(/^rebirth-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
  if(m){const t=Number(m[2])-1,v=tiers[m[1]][t];if(v===undefined)continue;if(m[1]==="start")effects.startEnergy+=v;else effects[m[1]]*=v;if(m[1]==="resonance"){effects.click*=v;effects.production*=v;}if(m[1]==="singularity"){effects.click*=v;effects.production*=v;effects.offline*=v;}continue;}
  if(id.startsWith("rebirth-link-")){effects.click*=1.03;effects.production*=1.03;effects.offline*=1.05;}
 }
 return effects;
}
function prestigeMultiplier(){ const total=Math.max(0,Number(state.totalPrestigePoints ?? state.prestigePoints)||0); return 1+(total*0.02); }
function astralUnlocked(){ return Array.isArray(state.skills)&&state.skills.includes("astral-observation"); }
function astralTreeEffects(){ return calculateAstralTreeEffects(state.astralSkills); }
function astralMultiplier(){ const rate=Math.max(0,Number(totalPerSecond())||0); return 1+Math.log10(1+rate/1e6); }
function formatAP(value){ if(!Number.isFinite(value)||value<0)return "0"; if(value>=1000)return format(value); if(value>0&&value<0.0001)return value.toExponential(2); return value.toFixed(4); }
function upgradeCost(upgrade,level){return Math.ceil(upgrade.cost*Math.pow(1.65,level));}
function upgradeBatchInfo(upgrade,mode){
  const level=state.upgradeLevels[upgrade.id]||0;
  if(mode==="max"){let count=0,total=0;while(count<10000){const next=upgradeCost(upgrade,level+count);if(total+next>state.energy)break;total+=next;count++;}return {count,total};}
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));let total=0;
  for(let i=0;i<quantity;i++)total+=upgradeCost(upgrade,level+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.factories[f.id]||0)*f.production,0)*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production; }
function prestigeGain(){ return Math.floor(Math.sqrt(Math.max(0,state.runLifetime)/1_000_000_000_000)); }
function nextPrestigeThreshold(){ const next=prestigeGain()+1; return next*next*1_000_000_000_000; }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value < 1000) return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["","K","M","B","T","Qa","Qi"];
  let n=value,i=0; while(n>=1000&&i<units.length-1){n/=1000;i++;}
  return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];
}
function costAt(factory,owned){ return Math.ceil(factory.baseCost*Math.pow(1.16,owned)*state.costMultiplier*prestigeTreeEffects().cost*astralTreeEffects().cost); }
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
  if(isResettingSave)return;
  state.lastSeen=Date.now();
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); document.querySelector("#save-status").textContent="セーブ済み · "+new Date().toLocaleTimeString("ja-JP"); }
  catch { document.querySelector("#save-status").textContent="セーブできませんでした"; }
}
function render(){
  setAnimatedNumber(document.querySelector("#energy"),state.energy,format);
  setAnimatedNumber(document.querySelector("#per-second"),totalPerSecond(),format," / 秒");
  setAnimatedNumber(document.querySelector("#click-power"),state.clickPower*prestigeMultiplier()*prestigeTreeEffects().click*astralTreeEffects().click,format);
  setAnimatedNumber(document.querySelector("#factory-count"),factories.reduce((n,f)=>n+state.factories[f.id],0),n=>Math.round(n).toLocaleString("ja-JP")," 基");
  setAnimatedNumber(document.querySelector("#lifetime"),state.lifetime,format);
  const mode=document.querySelector("#buy-mode").value;
  const visibleFactories=factories.slice(0,state.unlockedFactoryCount);
  const factoryList=document.querySelector("#factory-list");
  const factoryMarkup=visibleFactories.map(f=>{
    const info=batchInfo(f,mode),owned=state.factories[f.id]||0;
    const label=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    return `<article class="shop-item"><div class="item-symbol">${f.symbol}</div><div class="item-info"><strong>${f.name}</strong><small>${f.description}</small><small>生産：${format(f.production*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production)} / 秒 · <span class="owned">所有：${owned}</span></small></div><button class="buy-button" data-buy="${f.id}" ${info.count===0?"disabled":""}>${label}<br>${info.count===0&&mode!=="max"?"必要 "+format(info.total):format(info.total)}</button></article>`;
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
  setAnimatedNumber(document.querySelector("#prestige-current"),state.prestigePoints,format);
  setAnimatedNumber(document.querySelector("#prestige-total"),state.totalPrestigePoints,format);
  setAnimatedNumber(document.querySelector("#prestige-multiplier"),prestigeMultiplier(),n=>"×"+n.toFixed(2));
  setAnimatedNumber(document.querySelector("#prestige-run"),state.runLifetime,format);
  const gain=prestigeGain();
  setAnimatedNumber(document.querySelector("#prestige-gain"),gain,n=>"+"+Math.floor(n)+" ポイント");
  document.querySelector("#prestige-requirement").textContent=gain>0
    ? "転生すると "+gain+" ポイントを獲得できます。"
    : "次の1ポイントまで "+format(Math.max(0,nextPrestigeThreshold()-state.runLifetime))+" エネルギー必要";
  document.querySelector("#prestige-button").disabled=gain<1;
  const astralActive=astralUnlocked();
  const quantumDone=Array.isArray(state.skills)&&state.skills.includes("quantum-5");
  const cosmicDone=Array.isArray(state.skills)&&state.skills.includes("cosmic-5");
  const energyDone=Number(state.energy)>=1e12;
  const progressCount=(quantumDone?1:0)+(cosmicDone?1:0)+(energyDone?1:0);
  const progressTrack=document.querySelector(".astral-progress-track");
  document.querySelector("#astral-quantum-check").textContent=quantumDone?"✓":"○";
  document.querySelector("#astral-quantum-state").textContent=quantumDone?"取得済み":"未取得";
  document.querySelector("#astral-cosmic-check").textContent=cosmicDone?"✓":"○";
  document.querySelector("#astral-cosmic-state").textContent=cosmicDone?"取得済み":"未取得";
  document.querySelector("#astral-energy-check").textContent=energyDone?"✓":"○";
  setAnimatedNumber(document.querySelector("#astral-energy-state"),state.energy,format," / 1T");
  document.querySelector("#astral-progress-count").textContent=astralActive?"解放済み":progressCount+" / 3";
  document.querySelector("#astral-progress-fill").style.width=(astralActive?100:progressCount/3*100)+"%";
  progressTrack.setAttribute("aria-valuenow",astralActive?3:progressCount);
  document.querySelector("#astral-next-step").textContent=astralActive
    ?"星界観測を取得済み。星界粒子の生成が稼働中"
    :!quantumDone?"次の目標：スキルツリーで「量子V」を取得"
    :!cosmicDone?"次の目標：スキルツリーで「宇宙V」を取得"
    :!energyDone?"次の目標：1兆エネルギーを貯めて「星界観測」を研究"
    :"条件達成！スキルツリーで「星界観測」を研究しよう";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-points"),state.ap,formatAP);else document.querySelector("#astral-points").textContent="未解放";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-total"),state.totalAP,formatAP);else document.querySelector("#astral-total").textContent="—";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-rate"),totalPerSecond()/5e13*astralMultiplier()*astralTreeEffects().apGain,formatAP," AP / 秒");else document.querySelector("#astral-rate").textContent="星界観測の研究が必要";
  document.querySelector("#astral-status").textContent=astralActive?"星界粒子の生成が稼働中":"星界観測の研究条件を達成してAPを解放しよう";
  document.querySelector("#upgrade-list").innerHTML=upgrades.map(u=>{
    const level=state.upgradeLevels[u.id]||0,info=upgradeBatchInfo(u,mode);
    const label=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    return `<article class="shop-item"><div class="item-symbol">+</div><div class="item-info"><strong>${u.name}</strong><small>${u.description}</small><small><span class="owned">購入数：${level}</span> · 次回価格：${format(upgradeCost(u,level))}</small></div><button class="buy-button" data-upgrade="${u.id}" ${info.count===0?"disabled":""}>${label}<br>${format(info.total)}</button></article>`;
  }).join("");
}
function gain(amount){
  const safe=Number.isFinite(amount)&&amount>0?amount:0;
  state.energy+=safe; state.lifetime+=safe; state.runLifetime+=safe;
  if(safe>0&&astralUnlocked()){
    const earned=(safe/5e13)*astralMultiplier()*astralTreeEffects().apGain;
    if(Number.isFinite(earned)&&earned>0){state.ap=(Number(state.ap)||0)+earned;state.totalAP=(Number(state.totalAP)||0)+earned;}
  }
}
function performPrestige(){
  const earned=prestigeGain();
  if(earned<1)return;
  const message="転生すると、エネルギー・工場・通常強化がリセットされます。スキルツリーと転生ポイントは引き継がれます。\n\n"+earned+"ポイントを獲得して転生しますか？";
  if(!window.confirm(message))return;
  state.prestigePoints+=earned;
  state.totalPrestigePoints=(Number(state.totalPrestigePoints)||0)+earned;
  state.prestigeCount+=1;
  state.energy=prestigeTreeEffects().startEnergy;
  state.clickPower=1+(state.skills.includes("tap1")?2:0)+(state.skills.includes("tap2")?8:0)+(state.skills.includes("tap3")?25:0);
  state.factories=Object.fromEntries(factories.map(f=>[f.id,0]));
  state.unlockedFactoryCount=4;
  state.purchased=[];
  state.upgradeLevels={};
  state.runLifetime=0;
  document.querySelector("#click-feedback").textContent="転生完了！永久生産ボーナスを獲得しました。";
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
document.querySelector("#reset-save-button").addEventListener("click",()=>{
  const confirmed=window.confirm("ゲームのセーブデータをすべて削除します。\\n\\nエネルギー・工場・強化・転生ポイント・スキル取得状況が初期化されます。\\nこの操作は取り消せません。\\n\\n本当に削除しますか？");
  if(!confirmed)return;
  isResettingSave=true;
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
});
document.querySelector("#produce-button").addEventListener("click",()=>{
  gain(state.clickPower*prestigeMultiplier()*prestigeTreeEffects().click*astralTreeEffects().click);
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
  const bonus=totalPerSecond()*elapsed*prestigeTreeEffects().offline*astralTreeEffects().offline; gain(bonus);
  document.querySelector("#click-feedback").textContent="オフライン生産：+"+format(bonus)+" ENERGY";
}
let lastProductionTick=Date.now();
function applyBackgroundProduction(){
  const now=Date.now();
  const elapsed=Math.max(0,Math.min(8*60*60,(now-lastProductionTick)/1000));
  lastProductionTick=now;
  if(elapsed>0&&totalPerSecond()>0){
    const bonus=totalPerSecond()*elapsed*prestigeTreeEffects().offline*astralTreeEffects().offline;
    gain(bonus);
    document.querySelector("#click-feedback").textContent="オフライン生産："+format(bonus)+" ENERGY";
  }
  render();
}
setInterval(()=>{
  if(isResettingSave)return;
  const now=Date.now(),dt=Math.max(0,Math.min(2,(now-lastProductionTick)/1000));
  lastProductionTick=now;
  const production=totalPerSecond()*dt;
  if(production>0)gain(production);
  render();
},250);
setInterval(saveGame,10000);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){if(!isResettingSave)saveGame();}
  else if(!isResettingSave)applyBackgroundProduction();
});
window.addEventListener("pagehide",()=>{if(!isResettingSave)saveGame();});
window.addEventListener("beforeunload",()=>{if(!isResettingSave)saveGame();});
checkFactoryUnlock();
render();
saveGame();
