import {setAnimatedNumber,setRollingNumber,triggerRebirthVoltage} from "./number-animation.js?v=0.51.0";
import {migrateAstralBalance,astralTreeEffects as calculateAstralTreeEffects} from "./astral-balance.js?v=0.61.0";
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
  { id:"click2", name:"強化型グローブ", description:"クリック出力を +1（購入ごと）", cost:25, power:1 },
  { id:"click3", name:"量子駆動ツール", description:"クリック出力を +5（購入ごと）", cost:250, power:5 },
  { id:"click4", name:"神経リンク強化", description:"クリック出力を +25（購入ごと）", cost:2500, power:25 },
  { id:"click5", name:"反射神経ブースター", description:"クリック出力を +125（購入ごと）", cost:375000, power:125 },
  { id:"click6", name:"高密度タップコア", description:"クリック出力を +625（購入ごと）", cost:56250000, power:625 },
  { id:"click7", name:"ニューラル加速器", description:"クリック出力を +3,125（購入ごと）", cost:8437500000, power:3125 },
  { id:"click8", name:"位相同期デバイス", description:"クリック出力を +15,625（購入ごと）", cost:1265625000000, power:15625 },
  { id:"click9", name:"超伝導インターフェース", description:"クリック出力を +78,125（購入ごと）", cost:189843750000000, power:78125 },
  { id:"click10", name:"量子反応増幅器", description:"クリック出力を +390,625（購入ごと）", cost:28476562500000000, power:390625 },
  { id:"click11", name:"時空間入力装置", description:"クリック出力を +1,953,125（購入ごと）", cost:4271484375000000000, power:1953125 },
  { id:"click12", name:"恒星級神経回路", description:"クリック出力を +9,765,625（購入ごと）", cost:640722656250000000000, power:9765625 },
  { id:"click13", name:"銀河規模リンク", description:"クリック出力を +48,828,125（購入ごと）", cost:96108398437500000000000, power:48828125 },
  { id:"click14", name:"ダークマター・グリップ", description:"クリック出力を +244,140,625（購入ごと）", cost:14416259765625000000000000, power:244140625 },
  { id:"click15", name:"特異点反応ユニット", description:"クリック出力を +1,220,703,125（購入ごと）", cost:2162438964843750000000000000, power:1220703125 },
  { id:"click16", name:"宇宙律速解除装置", description:"クリック出力を +6,103,515,625（購入ごと）", cost:324365844726562500000000000000, power:6103515625 },
  { id:"click17", name:"多元宇宙オペレーター", description:"クリック出力を +30,517,578,125（購入ごと）", cost:48654876708984375000000000000000, power:30517578125 },
  { id:"click18", name:"超越神経機構", description:"クリック出力を +152,587,890,625（購入ごと）", cost:7298231506347656250000000000000000, power:152587890625 },
  { id:"click19", name:"無限連結インターフェース", description:"クリック出力を +762,939,453,125（購入ごと）", cost:1094734725952148437500000000000000000, power:762939453125 },
  { id:"click20", name:"創世タップ機関", description:"クリック出力を +3,814,697,265,625（購入ごと）", cost:164210208892822265625000000000000000000, power:3814697265625 },
  { id:"click21", name:"インフィニティ・オペレーター", description:"クリック出力を +19,073,486,328,125（購入ごと）", cost:24631531333923339843750000000000000000000, power:19073486328125 }
].map(u=>({...u,apply:s=>s.clickPower+=u.power}));
const OPERATOR_UNLOCK_PURCHASES=20;
function prestigeSkillSpent(skills,savedCosts={}){
  const costAt=t=>Math.ceil(t*Math.pow(2.35,t-1));
  const branches=["click","production","economy","offline","start","resonance","singularity"];
  return (Array.isArray(skills)?skills:[]).reduce((sum,id)=>{
    const tierMatch=id.match(/^rebirth-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
    if(tierMatch)return sum+(Number.isFinite(Number(savedCosts?.[id]))?Number(savedCosts[id]):costAt(Number(tierMatch[2])));
    const linkMatch=id.match(/^rebirth-link-(click|production|economy|offline|start|resonance|singularity)-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
    if(linkMatch&&branches.includes(linkMatch[1])&&branches.includes(linkMatch[2]))return sum+(Number.isFinite(Number(savedCosts?.[id]))?Number(savedCosts[id]):Math.ceil(costAt(Number(linkMatch[3]))*2.5));
    return sum;
  },0);
}
const freshState = () => ({
  energy:0, clickPower:1, clickBalanceVersion:1, totalClicks:0, productionMultiplier:1, costMultiplier:1,
  goalBatteryCapacity:1e12, goalBatteryCharge:0, goalBatteryCompleted:0,
  factories:Object.fromEntries(factories.map(f=>[f.id,0])),
  prestigeSkills:[], prestigeSkillCosts:{},
  unlockedFactoryCount:4, unlockedOperatorUpgradeCount:3, purchased:[], upgradeLevels:{}, skills:[], lifetime:0, runLifetime:0, prestigePoints:0, totalPrestigePoints:0, prestigeCount:0, ap:0, totalAP:0, astralSkills:[], lastSeen:Date.now()
});
let state = loadGame();
let isResettingSave = false;
let isRebirthAnimating = false;
function loadGame(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return freshState();
    const base=freshState();
    // v0.37〜v0.38の会社施設を、同名の旧自動生産工場へ引き継ぐ
    const legacyFacilities=saved.company?.facilities||{};
    const legacyUnlockedIds=saved.company?.unlockedFacilityIds||[];
    const restoredFactories={...base.factories,...(saved.factories||{})};
    for(const [id,count] of Object.entries(legacyFacilities)){
      if(Object.prototype.hasOwnProperty.call(restoredFactories,id)){
        restoredFactories[id]=Math.max(0,Number(count)||0);
      }
    }
    const legacyUnlockedCount=legacyUnlockedIds.reduce((count,id)=>{
      const index=factories.findIndex(factory=>factory.id===id);
      return index>=0?Math.max(count,index+1):count;
    },4);
    const {company:removedCompanyData,...savedCore}=saved;
    const normalized={...base,...savedCore,
      factories:restoredFactories,
      unlockedFactoryCount:Math.max(4,Math.min(factories.length,Math.max(Number(saved.unlockedFactoryCount)||4,legacyUnlockedCount))),
      unlockedOperatorUpgradeCount:(()=>{let count=Math.max(3,Math.min(upgrades.length,Number(saved.unlockedOperatorUpgradeCount)||3));while(count<upgrades.length&&(Number(saved.upgradeLevels?.[upgrades[count-1].id])||0)>=OPERATOR_UNLOCK_PURCHASES)count++;return count;})(),
      purchased:Array.isArray(saved.purchased)?saved.purchased:[],
      upgradeLevels:Object.fromEntries([...new Set([...(saved.purchased||[]),...Object.keys(saved.upgradeLevels||{})])].map(id=>[id,Math.max(Number(saved.upgradeLevels?.[id])||0,(saved.purchased||[]).includes(id)?1:0)])),
      skills:Array.isArray(saved.skills)?saved.skills:[],
      runLifetime:Math.max(0,Number(saved.runLifetime ?? saved.lifetime)||0),
      totalClicks:Math.max(0,Math.floor(Number(saved.totalClicks)||0)),
      prestigePoints:Math.max(0,Number(saved.prestigePoints)||0),
      totalPrestigePoints:Math.max(0,Number(saved.totalPrestigePoints)||0,Math.max(0,Number(saved.prestigePoints)||0)+prestigeSkillSpent(saved.prestigeSkills,saved.prestigeSkillCosts)),
      prestigeCount:Math.max(0,Number(saved.prestigeCount)||0),
      ap:Math.max(0,Number(saved.ap)||0),
      totalAP:Math.max(0,Number(saved.totalAP)||Number(saved.ap)||0),
      astralSkills:Array.isArray(saved.astralSkills)?saved.astralSkills:[],
      goalBatteryCapacity:Number.isFinite(Number(saved.goalBatteryCapacity))&&Number(saved.goalBatteryCapacity)>0?Number(saved.goalBatteryCapacity):base.goalBatteryCapacity,
      goalBatteryCharge:Math.max(0,Number(saved.goalBatteryCharge)||0),
      goalBatteryCompleted:Math.max(0,Math.floor(Number(saved.goalBatteryCompleted)||0)),
      prestigeSkills:Array.isArray(saved.prestigeSkills)?saved.prestigeSkills:[],
      prestigeSkillCosts:{...(saved.prestigeSkillCosts||{})}
    };
    if(saved.clickBalanceVersion!==1){
      const clickSkills=Array.isArray(normalized.skills)?normalized.skills:[];
      const baseClickPower=1+(clickSkills.includes("tap1")?2:0)+(clickSkills.includes("tap2")?8:0)+(clickSkills.includes("tap3")?25:0);
      const levels=normalized.upgradeLevels||{};
      normalized.clickPower=baseClickPower
        +(Math.max(0,Number(levels.click2)||0)*1)
        +(Math.max(0,Number(levels.click3)||0)*5)
        +(Math.max(0,Number(levels.click4)||0)*25);
      normalized.clickBalanceVersion=1;
    }
    const migration=migrateAstralBalance(normalized);
    const migrated=migration.state;
    if(migration.changed){try{localStorage.setItem(SAVE_KEY,JSON.stringify(migrated));}catch{}}
    const resetUrl=new URL(window.location.href);
    if(resetUrl.searchParams.get("reset-astral-particles")==="1"){
      migrated.ap=0;
      try{localStorage.setItem(SAVE_KEY,JSON.stringify(migrated));}catch{}
      resetUrl.searchParams.delete("reset-astral-particles");
      window.history.replaceState(null,"",resetUrl.pathname+resetUrl.search+resetUrl.hash);
    }
    return migrated;
  } catch { return freshState(); }
}
function prestigeTreeEffects(){
 const effects={click:1,production:1,cost:1,offline:1,startEnergy:0};
 const tiers={click:[1.05,1.08,1.12,1.18,1.25,1.32,1.4,1.5,1.65,1.8,2,2.25],production:[1.05,1.08,1.12,1.18,1.25,1.32,1.4,1.5,1.65,1.8,2,2.25],economy:[.98,.97,.96,.95,.94,.93,.92,.91,.9,.88,.86,.84],offline:[1.1,1.15,1.2,1.3,1.4,1.5,1.65,1.8,2,2.25,2.5,3],start:[100,500,2000,10000,50000,250000,1e6,5e6,2.5e7,1e8,5e8,2.5e9],resonance:[1.02,1.03,1.04,1.05,1.07,1.09,1.12,1.15,1.2,1.25,1.32,1.4],singularity:[1.01,1.015,1.02,1.025,1.03,1.04,1.05,1.06,1.08,1.1,1.12,1.15]};
 for(const id of state.prestigeSkills||[]){
  const m=id.match(/^rebirth-(click|production|economy|offline|start|resonance|singularity)-(\d+)$/);
  if(m){const t=Number(m[2])-1,base=tiers[m[1]][Math.min(t,11)],v=t<12?base:(m[1]==="start"?2.5e9*Math.pow(4,t-11):m[1]==="economy"?Math.max(.45,.82-(t-12)*.025):1.5+(t-12)*.22);if(m[1]==="start")effects.startEnergy+=v;else effects[m[1]]*=v;if(m[1]==="resonance"){effects.click*=v;effects.production*=v;}if(m[1]==="singularity"){effects.click*=v;effects.production*=v;effects.offline*=v;}continue;}
  if(id.startsWith("rebirth-link-")){effects.click*=1.03;effects.production*=1.03;effects.offline*=1.05;}
 }
 return effects;
}
function prestigeMultiplier(){ const total=Math.max(0,Number(state.totalPrestigePoints ?? state.prestigePoints)||0); return 1+(0.02*Math.sqrt(10*total)); }
const clickMasteryRanks=[
  {name:"見習い",threshold:100,multiplier:1.05},
  {name:"熟練者",threshold:1000,multiplier:1.10},
  {name:"達人",threshold:5000,multiplier:1.20},
  {name:"職人",threshold:20000,multiplier:1.35},
  {name:"マスター",threshold:100000,multiplier:1.55},
  {name:"伝説",threshold:500000,multiplier:1.80},
  {name:"超越者",threshold:2000000,multiplier:2.20}
];
function clickMasteryRank(){return clickMasteryRanks.reduce((rank,item,index)=>state.totalClicks>=item.threshold?index:rank,-1);}
function clickMasteryMultiplier(){const rank=clickMasteryRank();return rank<0?1:clickMasteryRanks[rank].multiplier;}
function effectiveClickPower(){return state.clickPower*prestigeMultiplier()*prestigeTreeEffects().click*astralTreeEffects().click*clickMasteryMultiplier();}
const astralPrerequisites=["core-18","automation-18","industry-18","quantum-18","cosmic-18"];
function astralPrerequisitesDone(){return Array.isArray(state.skills)&&astralPrerequisites.every(id=>state.skills.includes(id));}
function astralUnlocked(){ return Array.isArray(state.skills)&&state.skills.includes("astral-observation"); }
function astralTreeEffects(){ return calculateAstralTreeEffects(state.astralSkills); }
function astralMultiplier(){ const rate=Math.max(0,Number(totalPerSecond())||0); return 1+Math.log10(1+rate/1e6); }
function astralAPPerSecond(){ const production=Math.max(0,Number(totalPerSecond())||0); const compressed=Math.log10(1+Math.log10(1+production/5e15))*0.01; return compressed*astralMultiplier()*astralTreeEffects().apGain; }
function formatAP(value){ if(!Number.isFinite(value)||value<0)return "0"; if(value>=1000)return format(value); if(value>0&&value<0.0001)return value.toExponential(2); return value.toFixed(4); }
function upgradeCost(upgrade,level){return Math.max(1,Math.ceil(upgrade.cost*0.4*Math.pow(1.2,level)));}
function geometricBatchCount(firstCost,ratio,budget,maxCount=10000){
  if(firstCost>budget)return 0;
  let low=1,high=maxCount;
  while(low<high){
    const mid=Math.ceil((low+high)/2);
    const estimated=ratio===1?firstCost*mid:firstCost*(Math.pow(ratio,mid)-1)/(ratio-1);
    if(estimated<=budget)low=mid;else high=mid-1;
  }
  return low;
}
function upgradeBatchInfo(upgrade,mode){
  const level=state.upgradeLevels[upgrade.id]||0;
  if(mode==="max"){
    const first=upgradeCost(upgrade,level),count=geometricBatchCount(first,1.2,state.energy);
    let total=0;for(let i=0;i<count;i++)total+=upgradeCost(upgrade,level+i);
    while(count>0&&total>state.energy){total-=upgradeCost(upgrade,level+count-1);}
    return {count:total<=state.energy?count:0,total:total<=state.energy?total:0};
  }
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));let total=0;
  for(let i=0;i<quantity;i++)total+=upgradeCost(upgrade,level+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.factories[f.id]||0)*f.production,0)*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production; }
const PRESTIGE_ENERGY_PER_POINT=10_000_000_000_000_000;
const FIRST_PRESTIGE_ENERGY_PER_POINT=100_000_000_000_000;
function prestigeEnergyPerPoint(){ return Number(state.prestigeCount)||0 ? PRESTIGE_ENERGY_PER_POINT : FIRST_PRESTIGE_ENERGY_PER_POINT; }
function prestigeGain(){ const rebirthPenalty=1+Math.max(0,Number(state.prestigeCount)||0)*0.25; return Math.floor(Math.pow(Math.max(0,state.runLifetime)/prestigeEnergyPerPoint(),0.25)/rebirthPenalty); }
function nextPrestigeThreshold(){ const next=prestigeGain()+1; const rebirthPenalty=1+Math.max(0,Number(state.prestigeCount)||0)*0.25; const adjusted=next*rebirthPenalty; return adjusted*adjusted*adjusted*adjusted*prestigeEnergyPerPoint(); }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value < 10_000_000) return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["M","B","T","Qa","Qi"];
  let n=value/1_000_000,i=0;
  while(n>=10_000&&i<units.length-1){n/=1_000;i++;}
  if(i===units.length-1&&n>=10_000)return value.toExponential(2);
  const rounded=Number(n.toFixed(n<100?2:1));
  return rounded.toString()+units[i];
}
function costAt(factory,owned){ return Math.ceil(factory.baseCost*Math.pow(1.16,owned)*state.costMultiplier*prestigeTreeEffects().cost*astralTreeEffects().cost); }
function batchInfo(factory,mode){
  const owned=state.factories[factory.id]||0;
  if(mode==="max"){
    const first=costAt(factory,owned),count=geometricBatchCount(first,1.16,state.energy);
    let total=0;for(let i=0;i<count;i++)total+=costAt(factory,owned+i);
    while(count>0&&total>state.energy)total-=costAt(factory,owned+--count);
    return {count,total};
  }
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));
  let total=0;
  for(let i=0;i<quantity;i++)total+=costAt(factory,owned+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function saveGame(){
  if(isResettingSave||isRebirthAnimating)return;
  if(!document.hidden)state.lastSeen=Date.now();
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); document.querySelector("#save-status").textContent="セーブ済み · "+new Date().toLocaleTimeString("ja-JP"); }
  catch { document.querySelector("#save-status").textContent="セーブできませんでした"; }
}
function render(){
  setRollingNumber(document.querySelector("#energy"),state.energy,format);
  const batteryCapacity=Math.max(1,Number(state.goalBatteryCapacity)||1);
  const batteryCharge=Math.max(0,Math.min(batteryCapacity,Number(state.goalBatteryCharge)||0));
  const batteryPercent=Math.max(0,Math.min(100,batteryCharge/batteryCapacity*100));
  document.querySelector("#goal-battery-fill").style.width=batteryPercent+"%";
  document.querySelector("#goal-battery-percent").textContent=batteryPercent.toFixed(2)+"%";
  document.querySelector("#goal-battery-current").textContent=format(batteryCharge);
  document.querySelector("#goal-battery-capacity").textContent=format(batteryCapacity);
  document.querySelector("#goal-battery-completed").textContent=format(state.goalBatteryCompleted||0)+" 本";
  const batteryInput=document.querySelector("#goal-battery-capacity-input");
  if(document.activeElement!==batteryInput)batteryInput.value=String(state.goalBatteryCapacity);
  setAnimatedNumber(document.querySelector("#per-second"),totalPerSecond(),format," / 秒");
  setAnimatedNumber(document.querySelector("#click-power"),effectiveClickPower(),format);
  const masteryRank=clickMasteryRank();
  const nextMastery=clickMasteryRanks[masteryRank+1];
  document.querySelector("#click-mastery-count").textContent=format(state.totalClicks)+" 回";
  document.querySelector("#click-mastery-rank").textContent=masteryRank<0?"未認定":` ${masteryRank+1} · ${clickMasteryRanks[masteryRank].name}`;
  document.querySelector("#click-mastery-multiplier").textContent="×"+clickMasteryMultiplier().toFixed(2);
  document.querySelector("#click-mastery-next").textContent=nextMastery?`次のランクまで ${format(Math.max(0,nextMastery.threshold-state.totalClicks))} 回`:"最高ランク到達";
  const masteryProgress=masteryRank<0?state.totalClicks/clickMasteryRanks[0].threshold:(nextMastery?(state.totalClicks-clickMasteryRanks[masteryRank].threshold)/(nextMastery.threshold-clickMasteryRanks[masteryRank].threshold):1);
  document.querySelector("#click-mastery-progress").style.width=(Math.max(0,Math.min(1,masteryProgress))*100)+"%";
  setAnimatedNumber(document.querySelector("#factory-count"),factories.reduce((n,f)=>n+state.factories[f.id],0),n=>Math.round(n).toLocaleString("ja-JP")," 基");
  setAnimatedNumber(document.querySelector("#lifetime"),state.lifetime,format);
  const mode=document.querySelector("#buy-mode").value;
  const visibleFactories=factories.slice(0,state.unlockedFactoryCount);
  const factoryList=document.querySelector("#factory-list");
  if(factoryList.dataset.initialized!=="true"){
    factoryList.replaceChildren();
    factoryList.dataset.initialized="true";
  }
  for(const f of visibleFactories){
    let button=factoryList.querySelector('[data-buy="'+f.id+'"]');
    if(!button){
      factoryList.insertAdjacentHTML("beforeend",`
        <article class="shop-item">
          <div class="item-symbol">${f.symbol}</div>
          <div class="item-info">
            <strong>${f.name}</strong><small>${f.description}</small>
            <small>生産：<span data-factory-production></span> / 秒 · <span class="owned" data-factory-owned></span></small>
          </div>
          <button class="buy-button" type="button" data-buy="${f.id}">
            <span data-factory-buy-label></span><br><span data-factory-buy-total></span>
          </button>
        </article>`);
      button=factoryList.querySelector('[data-buy="'+f.id+'"]');
    }
    const info=batchInfo(f,mode),owned=state.factories[f.id]||0;
    button.disabled=info.count===0;
    const item=button.closest(".shop-item");
    item.querySelector("[data-factory-production]").textContent=format(f.production*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production);
    item.querySelector("[data-factory-owned]").textContent="所有："+owned;
    button.querySelector("[data-factory-buy-label]").textContent=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    button.querySelector("[data-factory-buy-total]").textContent=info.count===0&&mode!=="max"?"必要 "+format(info.total):format(info.total);
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
  setAnimatedNumber(document.querySelector("#prestige-multiplier"),prestigeMultiplier(),n=>"×"+n.toFixed(2));
  setAnimatedNumber(document.querySelector("#prestige-run"),state.runLifetime,format);
  const gain=prestigeGain();
  setAnimatedNumber(document.querySelector("#prestige-gain"),gain,n=>"+"+Math.floor(n)+" ポイント");
  document.querySelector("#prestige-requirement").textContent=gain>0
    ? "転生すると "+gain+" ポイントを獲得できます。"
    : "次の1ポイントまで "+format(Math.max(0,nextPrestigeThreshold()-state.runLifetime))+" エネルギー必要";
  document.querySelector("#prestige-button").disabled=gain<1;
  const astralActive=astralUnlocked();
  const energyDone=Number(state.energy)>=1e48;
  const astralResearchDone=astralPrerequisitesDone();
  const progressCount=(astralResearchDone?1:0)+(energyDone?1:0);
  const progressTrack=document.querySelector(".astral-progress-track");
  document.querySelector("#astral-final-check").textContent=astralResearchDone?"✓":"○";
  document.querySelector("#astral-final-state").textContent=astralResearchDone?"取得済み":"未取得";
  document.querySelector("#astral-energy-check").textContent=energyDone?"✓":"○";
  setAnimatedNumber(document.querySelector("#astral-energy-state"),state.energy,format," / 1e48");
  document.querySelector("#astral-progress-count").textContent=astralActive?"解放済み":progressCount+" / 2";
  document.querySelector("#astral-progress-fill").style.width=(astralActive?100:progressCount/2*100)+"%";
  progressTrack.setAttribute("aria-valuenow",astralActive?2:progressCount);
  document.querySelector("#astral-next-step").textContent=astralActive
    ?"星界観測を取得済み。星界粒子の生成が稼働中"
    :!astralResearchDone?"次の目標：5つの研究領域すべてでTier 18まで取得"
    :!energyDone?"次の目標：10の48乗エネルギーを貯めて「星界観測」を研究"
    :"条件達成！スキルツリーで「星界観測」を研究しよう";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-points"),state.ap,formatAP);else document.querySelector("#astral-points").textContent="未解放";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-total"),state.totalAP,formatAP);else document.querySelector("#astral-total").textContent="—";
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-rate"),astralAPPerSecond(),formatAP," AP / 秒");else document.querySelector("#astral-rate").textContent="星界観測の研究が必要";
  document.querySelector("#astral-status").textContent=astralActive?"星界粒子の生成が稼働中":"5領域すべてTier 18と10の48乗エネルギーで星界観測を解放できます";
  const upgradeList=document.querySelector("#upgrade-list");
  if(upgradeList.dataset.initialized!=="true"){
    upgradeList.replaceChildren();
    upgradeList.dataset.initialized="true";
  }
  for(const u of upgrades.slice(0,state.unlockedOperatorUpgradeCount)){
    let button=upgradeList.querySelector('[data-upgrade="'+u.id+'"]');
    if(!button){
      upgradeList.insertAdjacentHTML("beforeend",`
        <article class="shop-item">
          <div class="item-symbol">+</div>
          <div class="item-info">
            <strong>${u.name}</strong><small>${u.description}</small>
            <small><span class="owned" data-upgrade-owned></span> · 価格倍率：<span data-upgrade-multiplier></span> · 次回価格：<span data-upgrade-next-cost></span></small>
          </div>
          <button class="buy-button" type="button" data-upgrade="${u.id}">
            <span data-upgrade-label></span><br><span data-upgrade-total></span>
          </button>
        </article>`);
      button=upgradeList.querySelector('[data-upgrade="'+u.id+'"]');
    }
    const level=state.upgradeLevels[u.id]||0,info=upgradeBatchInfo(u,mode);
    button.disabled=info.count===0;
    const item=button.closest(".shop-item");
    item.querySelector("[data-upgrade-owned]").textContent="購入数："+level;
    item.querySelector("[data-upgrade-next-cost]").textContent=format(upgradeCost(u,level));
    item.querySelector("[data-upgrade-multiplier]").textContent="×"+Math.pow(1.2,level).toFixed(2);
    button.querySelector("[data-upgrade-label]").textContent=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    button.querySelector("[data-upgrade-total]").textContent=format(info.total);
  }
  const operatorProgress=document.querySelector("#operator-progress");
  if(state.unlockedOperatorUpgradeCount<upgrades.length){
    const current=upgrades[state.unlockedOperatorUpgradeCount-1];
    const owned=state.upgradeLevels[current.id]||0;
    operatorProgress.textContent=`次の強化解放：${current.name}を${OPERATOR_UNLOCK_PURCHASES}回購入（現在 ${Math.min(owned,OPERATOR_UNLOCK_PURCHASES)} / ${OPERATOR_UNLOCK_PURCHASES}）`;
  }else{
    operatorProgress.textContent="全20種類のオペレーター強化を解放済み";
  }
}
function gain(amount){
  const safe=Number.isFinite(amount)&&amount>0?amount:0;
  state.energy+=safe; state.lifetime+=safe; state.runLifetime+=safe;
  const batteryCapacity=Math.max(1,Number(state.goalBatteryCapacity)||1);
  const combined=(Number(state.goalBatteryCharge)||0)+safe;
  if(safe>0){
    const completed=Math.floor(combined/batteryCapacity);
    state.goalBatteryCompleted=(Number(state.goalBatteryCompleted)||0)+completed;
    state.goalBatteryCharge=combined-completed*batteryCapacity;
    if(state.goalBatteryCharge<0||state.goalBatteryCharge>=batteryCapacity)state.goalBatteryCharge=combined%batteryCapacity;
  }
  if(safe>0&&astralUnlocked()){
    const earned=Math.log10(1+Math.log10(1+safe/5e15))*0.01*astralMultiplier()*astralTreeEffects().apGain;
    if(Number.isFinite(earned)&&earned>0){state.ap=(Number(state.ap)||0)+earned;state.totalAP=(Number(state.totalAP)||0)+earned;}
  }
}
function showRebirthDischargeEffect(onComplete){
  triggerRebirthVoltage();
  document.querySelector(".rebirth-discharge-overlay")?.remove();
  const overlay=document.createElement("div");
  overlay.className="rebirth-discharge-overlay";
  overlay.setAttribute("role","status");
  overlay.setAttribute("aria-live","assertive");
  overlay.innerHTML=`
    <div class="rebirth-electric-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="rebirth-blackout"></div>
    <div class="rebirth-global-bolts" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="rebirth-screen-flash" aria-hidden="true"></div>
    <div class="rebirth-battery-scene" aria-hidden="true">
      <div class="rebirth-battery-glow"></div>
      <div class="rebirth-battery">
        <span class="rebirth-battery-cap rebirth-battery-cap-top"></span>
        <span class="rebirth-battery-half rebirth-battery-half-top"></span><span class="rebirth-battery-half rebirth-battery-half-bottom"></span>
        <span class="rebirth-battery-core"></span><span class="rebirth-battery-crack"></span>
      </div>
      <div class="rebirth-split-discharge"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="rebirth-discharge-arcs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="rebirth-effect-caption"><span>ENERGY CORE CRITICAL</span><strong>REBIRTH</strong><small>MAXIMUM DISCHARGE</small></div>`;
  document.body.append(overlay);
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(()=>{
    onComplete();
    overlay.classList.add("is-complete");
    window.setTimeout(()=>overlay.remove(),650);
  },reduced?1200:4600);
}
function completePrestige(earned){
  state.prestigePoints+=earned;
  state.totalPrestigePoints=(Number(state.totalPrestigePoints)||0)+earned;
  state.prestigeCount+=1;
  state.energy=prestigeTreeEffects().startEnergy;
  state.clickPower=1+(state.skills.includes("tap1")?2:0)+(state.skills.includes("tap2")?8:0)+(state.skills.includes("tap3")?25:0);
  state.factories=Object.fromEntries(factories.map(f=>[f.id,0]));
  state.unlockedFactoryCount=4;
  state.unlockedOperatorUpgradeCount=3;
  state.purchased=[];
  state.upgradeLevels={};
  state.runLifetime=0;
  document.querySelector("#click-feedback").textContent="転生完了！永久生産ボーナスを獲得しました。";
  isRebirthAnimating=false;
  render();
  saveGame();
}
function performPrestige(){
  if(isRebirthAnimating)return;
  const earned=prestigeGain();
  if(earned<1)return;
  const message="転生すると、エネルギー・工場・通常強化がリセットされます。スキルツリーと転生ポイントは引き継がれます。\\n\\n"+earned+"ポイントを獲得して転生しますか？";
  if(!window.confirm(message))return;
  isRebirthAnimating=true;
  document.querySelector("#prestige-button").disabled=true;
  showRebirthDischargeEffect(()=>completePrestige(earned));
}
function setGoalBatteryCapacity(){
  const input=document.querySelector("#goal-battery-capacity-input");
  const raw=String(input.value||"").replaceAll(",","").trim();
  const capacity=Number(raw);
  if(!Number.isFinite(capacity)||capacity<=0){
    document.querySelector("#goal-battery-feedback").textContent="0より大きい数値を入力してください。";
    return;
  }
  state.goalBatteryCapacity=capacity;
  state.goalBatteryCharge=0;
  state.goalBatteryCompleted=0;
  document.querySelector("#goal-battery-feedback").textContent="新しい容量を設定しました。充電スタート！";
  render();saveGame();
}
function checkFactoryUnlock(){
  if(state.unlockedFactoryCount>=factories.length)return false;
  const top=factories[state.unlockedFactoryCount-1];
  if((state.factories[top.id]||0)<10)return false;
  state.unlockedFactoryCount++;
  return true;
}
function checkOperatorUpgradeUnlock(){
  let unlocked=false;
  while(state.unlockedOperatorUpgradeCount<upgrades.length){
    const current=upgrades[state.unlockedOperatorUpgradeCount-1];
    if((state.upgradeLevels[current.id]||0)<OPERATOR_UNLOCK_PURCHASES)break;
    state.unlockedOperatorUpgradeCount++;
    unlocked=true;
  }
  return unlocked;
}
document.querySelector("#buy-mode").addEventListener("change",render);
document.querySelector("#goal-battery-set").addEventListener("click",setGoalBatteryCapacity);
document.querySelector("#prestige-button").addEventListener("click",performPrestige);
document.querySelector("#reset-save-button").addEventListener("click",()=>{
  const confirmed=window.confirm("ゲームのセーブデータをすべて削除します。\\n\\nエネルギー・工場・強化・転生ポイント・スキル取得状況が初期化されます。\\nこの操作は取り消せません。\\n\\n本当に削除しますか？");
  if(!confirmed)return;
  isResettingSave=true;
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
});
function showUpgradePurchaseEffect(button,special=false,count=1){
  const item=button.closest(".shop-item");
  if(!item)return;
  item.classList.remove("is-purchase-flash","is-purchase-special");
  void item.offsetWidth;
  item.classList.add("is-purchase-flash");
  if(special)item.classList.add("is-purchase-special");
  const label=document.createElement("span");
  label.className="purchase-effect-label";
  label.setAttribute("aria-hidden","true");
  label.textContent=special?"✦ SPECIAL UPGRADE":count>1?"✓ ×"+count+" PURCHASED":"✓ PURCHASED";
  item.append(label);
  label.addEventListener("animationend",()=>label.remove(),{once:true});
  item.addEventListener("animationend",event=>{
    if(event.target===item)item.classList.remove("is-purchase-flash","is-purchase-special");
  },{once:true});
}
function showMasteryRankUnlock(rank){
  const achievement=clickMasteryRanks[rank];
  if(!achievement)return;
  document.querySelector(".mastery-unlock-overlay")?.remove();
  const overlay=document.createElement("div");
  overlay.className="mastery-unlock-overlay";
  overlay.setAttribute("role","status");
  overlay.setAttribute("aria-live","assertive");
  const card=document.createElement("div");
  card.className="mastery-unlock-card";
  const emblem=document.createElement("div");
  emblem.className="mastery-unlock-emblem";
  emblem.textContent=["I","II","III","IV","V","VI","VII"][rank]||String(rank+1);
  const eyebrow=document.createElement("div");
  eyebrow.className="mastery-unlock-eyebrow";
  eyebrow.textContent="✦ RANK ACHIEVEMENT UNLOCKED ✦";
  const heading=document.createElement("strong");
  heading.className="mastery-unlock-heading";
  heading.textContent=achievement.name;
  const detail=document.createElement("span");
  detail.className="mastery-unlock-detail";
  detail.textContent="CLICK MASTERY · RANK "+(rank+1);
  const bonus=document.createElement("span");
  bonus.className="mastery-unlock-bonus";
  bonus.textContent="クリック出力 ×"+achievement.multiplier.toFixed(2);
  card.append(emblem,eyebrow,heading,detail,bonus);
  overlay.append(card);
  for(let i=0;i<18;i++){
    const spark=document.createElement("i");
    spark.className="mastery-unlock-spark";
    spark.style.setProperty("--spark-angle",(i*20)+"deg");
    spark.style.setProperty("--spark-delay",(i%3)*35+"ms");
    overlay.append(spark);
  }
  document.body.append(overlay);
  window.setTimeout(()=>overlay.remove(),3100);
}
function showClickEffect(button,event,amount){
  const rect=button.getBoundingClientRect();
  const hasPointer=event.detail!==0&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY);
  const x=hasPointer?Math.max(14,Math.min(rect.width-14,event.clientX-rect.left)):rect.width/2;
  const y=hasPointer?Math.max(14,Math.min(rect.height-14,event.clientY-rect.top)):rect.height/2;
  const burst=document.createElement("span");
  burst.className="click-effect-burst";
  burst.setAttribute("aria-hidden","true");
  burst.style.left=x+"px";
  burst.style.top=y+"px";
  const number=document.createElement("span");
  number.className="click-effect-number";
  number.textContent="+"+format(amount);
  burst.append(number);
  const directions=[[-30,-24],[0,-38],[30,-24],[-38,2],[38,2],[-25,30],[0,40],[25,30]];
  for(const [dx,dy] of directions){
    const particle=document.createElement("i");
    particle.className="click-effect-particle";
    particle.style.setProperty("--particle-x",dx+"px");
    particle.style.setProperty("--particle-y",dy+"px");
    burst.append(particle);
  }
  button.append(burst);
  burst.addEventListener("animationend",()=>burst.remove(),{once:true});
  button.classList.remove("is-clicking");
  void button.offsetWidth;
  button.classList.add("is-clicking");
}
let clickCombo=0;
let lastManualClickAt=0;
let clickComboResetTimer=null;
function updateClickComboIndicator(multiplier=1){
  const indicator=document.querySelector("#click-combo");
  if(!indicator)return;
  indicator.textContent="連続クリックボーナス ×"+multiplier.toFixed(2);
  indicator.classList.toggle("is-active",multiplier>1);
}
document.querySelector("#produce-button").addEventListener("click",event=>{
  const button=event.currentTarget;
  const now=performance.now();
  clickCombo=lastManualClickAt>0&&now-lastManualClickAt<=1500?Math.min(10,clickCombo+1):0;
  lastManualClickAt=now;
  const comboMultiplier=1+clickCombo*0.05;
  const previousRank=clickMasteryRank();
  state.totalClicks=(Number(state.totalClicks)||0)+1;
  const currentRank=clickMasteryRank();
  const clickGain=effectiveClickPower()*comboMultiplier;
  gain(clickGain);
  updateClickComboIndicator(comboMultiplier);
  if(clickComboResetTimer)clearTimeout(clickComboResetTimer);
  clickComboResetTimer=setTimeout(()=>{
    clickCombo=0;
    lastManualClickAt=0;
    updateClickComboIndicator();
  },1500);
  showClickEffect(button,event,clickGain);
  if(currentRank>previousRank){
    showMasteryRankUnlock(currentRank);
    document.querySelector("#click-feedback").textContent="ランク "+(currentRank+1)+" 解放！ "+clickMasteryRanks[currentRank].name;
  }else{
    document.querySelector("#click-feedback").textContent="+"+format(clickGain)+" ENERGY";
  }
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
  showUpgradePurchaseEffect(button,false,info.count);
  const unlocked=checkFactoryUnlock();
  render(); saveGame();
  if(unlocked)document.querySelector("#click-feedback").textContent="新しい自動生産工場が解放されました！";
});
document.querySelector("#upgrade-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-upgrade]");if(!button)return;
  const upgradeIndex=upgrades.findIndex(x=>x.id===button.dataset.upgrade);if(upgradeIndex<0||upgradeIndex>=state.unlockedOperatorUpgradeCount)return;
  const u=upgrades[upgradeIndex];
  const mode=document.querySelector("#buy-mode").value,info=upgradeBatchInfo(u,mode);
  if(info.count<1||state.energy<info.total)return;
  state.energy-=info.total;
  for(let i=0;i<info.count;i++)u.apply(state);
  state.upgradeLevels[u.id]=(state.upgradeLevels[u.id]||0)+info.count;
  if(!state.purchased.includes(u.id))state.purchased.push(u.id);
  const unlocked=checkOperatorUpgradeUnlock();
  showUpgradePurchaseEffect(button,u.id==="click4"||upgradeIndex>=3,info.count);
  render();saveGame();
  if(unlocked)document.querySelector("#click-feedback").textContent="新しいオペレーター強化が解放されました！";
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
  if(isResettingSave||isRebirthAnimating||document.hidden)return;
  const now=Date.now(),dt=Math.max(0,Math.min(2,(now-lastProductionTick)/1000));
  lastProductionTick=now;
  const production=totalPerSecond()*dt;
  if(production>0)gain(production);
  render();
},250);
setInterval(saveGame,10000);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){if(!isResettingSave){state.lastSeen=Date.now();saveGame();}}
  else if(!isResettingSave)applyBackgroundProduction();
});
function finalizeProductionSave(){
  if(isResettingSave||isRebirthAnimating)return;
  if(document.hidden)applyBackgroundProduction();
  state.lastSeen=Date.now();
  saveGame();
}
window.addEventListener("pagehide",finalizeProductionSave);
window.addEventListener("beforeunload",finalizeProductionSave);
checkFactoryUnlock();
render();
saveGame();
