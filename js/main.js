import {setAnimatedNumber} from "./number-animation.js";
import {migrateAstralBalance,astralTreeEffects as calculateAstralTreeEffects} from "./astral-balance.js";
const SAVE_KEY = "infinity-works-2-save-v1";
const factories = [
  { id:"orbital", name:"軌道太陽光発電所", description:"軌道上で恒星エネルギーを回収する基本施設", symbol:"☼", baseCost:10, production:0.5, creditCost:true },
  { id:"fusion", name:"核融合発電プラント", description:"高密度エネルギーを安定して生み出す", symbol:"核", baseCost:100, production:15, creditCost:true },
  { id:"antimatter", name:"反物質発電施設", description:"反物質反応を利用した高出力発電施設", symbol:"反", baseCost:1000, production:500, creditCost:true },
  { id:"quantum", name:"量子エネルギー発電所", description:"量子技術でエネルギー変換効率を高める", symbol:"量", baseCost:10000, production:20000, creditCost:true },
  { id:"stellar", name:"恒星間エネルギー網", description:"恒星系を結ぶ宇宙規模のエネルギー網", symbol:"∞", baseCost:100000, production:1000000, creditCost:true }
];
const upgrades = [
  { id:"click2", name:"強化型グローブ", description:"クリック出力を +1", cost:25, apply:s=>s.clickPower+=1 },
  { id:"click3", name:"量子駆動ツール", description:"クリック出力を +5", cost:250, apply:s=>s.clickPower+=5 },
  { id:"click4", name:"神経リンク強化", description:"クリック出力を +25", cost:2500, apply:s=>s.clickPower+=25 }
];
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
const companyContracts = [
  {id:"starter",name:"初回エネルギー納品",description:"会社設立後の最初の契約",capacity:1000,quantity:1,reward:100},
  {id:"asteroid",name:"小惑星基地への供給",description:"小規模基地の電力網を稼働させる",capacity:50000,quantity:3,reward:1500},
  {id:"lunar",name:"月面都市への供給",description:"月面都市のエネルギー需要を満たす",capacity:1000000,quantity:5,reward:25000},
  {id:"orbital",name:"軌道都市への供給",description:"軌道都市の大型蓄電網を満たす",capacity:1000000000,quantity:5,reward:2500000},
  {id:"stellar",name:"恒星圏への大規模供給",description:"恒星圏ネットワークへエネルギーを納品",capacity:1000000000000,quantity:10,reward:1000000000}
];
const freshCompany = () => ({
  name:"INFINITY ENERGY", credits:0, unlockedFacilityIds:["orbital"],
  facilities:Object.fromEntries(factories.map(f=>[f.id,0])),
  unlockedContractCount:1, activeContractId:"starter", contractProgress:{},
  customContract:null, deliveryCount:0, totalDeliveredEnergy:0,
  lastDelivery:null, selectedLogo:"default", selectedTheme:"blue"
});
function normalizeCompany(savedCompany){
  const base=freshCompany(), saved=savedCompany&&typeof savedCompany==="object"?savedCompany:{};
  const validIds=factories.map(f=>f.id);
  const unlocked=Array.isArray(saved.unlockedFacilityIds)?saved.unlockedFacilityIds.filter(id=>validIds.includes(id)):[];
  if(!unlocked.includes("orbital"))unlocked.unshift("orbital");
  const contractIds=companyContracts.map(c=>c.id);
  const progress={...(saved.contractProgress||{})};
  for(const id of contractIds)progress[id]={charge:Math.max(0,Number(progress[id]?.charge)||0),completed:Math.max(0,Math.floor(Number(progress[id]?.completed)||0))};
  progress.custom={charge:Math.max(0,Number(progress.custom?.charge)||0),completed:Math.max(0,Math.floor(Number(progress.custom?.completed)||0))};
  return {...base,...saved,
    name:String(saved.name||base.name).slice(0,32),
    credits:Math.max(0,Number(saved.credits)||0),
    unlockedFacilityIds:unlocked,
    facilities:{...base.facilities,...(saved.facilities||{})},
    unlockedContractCount:Math.max(1,Math.min(companyContracts.length,Math.floor(Number(saved.unlockedContractCount)||1))),
    activeContractId:contractIds.includes(saved.activeContractId)||saved.activeContractId==="custom"?saved.activeContractId:"starter",
    contractProgress:progress,
    deliveryCount:Math.max(0,Math.floor(Number(saved.deliveryCount)||0)),
    totalDeliveredEnergy:Math.max(0,Number(saved.totalDeliveredEnergy)||0)
  };
}
const freshState = () => ({
  energy:0, clickPower:1, totalClicks:0, productionMultiplier:1, costMultiplier:1,
  goalBatteryCapacity:1e12, goalBatteryCharge:0, goalBatteryCompleted:0,
  factories:Object.fromEntries(factories.map(f=>[f.id,0])),
  company:freshCompany(),
  prestigeSkills:[], prestigeSkillCosts:{},
  unlockedFactoryCount:1, purchased:[], upgradeLevels:{}, skills:[], lifetime:0, runLifetime:0, prestigePoints:0, totalPrestigePoints:0, prestigeCount:0, ap:0, totalAP:0, astralSkills:[], lastSeen:Date.now()
});
let state = loadGame();
let isResettingSave = false;
let isRebirthAnimating = false;
function loadGame(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return freshState();
    const base=freshState();
    const normalized={...base,...saved,
      factories:{...base.factories},
      company:normalizeCompany(saved.company),
      unlockedFactoryCount:1,
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
    const migrated=migrateAstralBalance(normalized).state;
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
  if(m){const t=Number(m[2])-1,v=tiers[m[1]][t];if(v===undefined)continue;if(m[1]==="start")effects.startEnergy+=v;else effects[m[1]]*=v;if(m[1]==="resonance"){effects.click*=v;effects.production*=v;}if(m[1]==="singularity"){effects.click*=v;effects.production*=v;effects.offline*=v;}continue;}
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
function formatAP(value){ if(!Number.isFinite(value)||value<0)return "0"; if(value>=1000)return format(value); if(value>0&&value<0.0001)return value.toExponential(2); return value.toFixed(4); }
function upgradeCost(upgrade,level){return Math.ceil(upgrade.cost*Math.pow(1.65,level));}
function upgradeBatchInfo(upgrade,mode){
  const level=state.upgradeLevels[upgrade.id]||0;
  if(mode==="max"){let count=0,total=0;while(count<10000){const next=upgradeCost(upgrade,level+count);if(total+next>state.energy)break;total+=next;count++;}return {count,total};}
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));let total=0;
  for(let i=0;i<quantity;i++)total+=upgradeCost(upgrade,level+i);
  return {count:state.energy>=total?quantity:0,total,quantity};
}
function totalPerSecond(){ return factories.reduce((sum,f)=>sum+(state.company.facilities[f.id]||0)*f.production,0)*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production; }
function prestigeGain(){ const rebirthPenalty=1+Math.max(0,Number(state.prestigeCount)||0)*0.25; return Math.floor(Math.sqrt(Math.max(0,state.runLifetime)/100_000_000_000_000)/rebirthPenalty); }
function nextPrestigeThreshold(){ const next=prestigeGain()+1; const rebirthPenalty=1+Math.max(0,Number(state.prestigeCount)||0)*0.25; return next*next*rebirthPenalty*rebirthPenalty*100_000_000_000_000; }
function format(value){
  if (!Number.isFinite(value)) return "∞";
  if (value <= 1_000_000) return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["M","B","T","Qa","Qi"];
  let n=value/1_000_000,i=0;
  while(n>=1000&&i<units.length-1){n/=1000;i++;}
  return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];
}
function costAt(factory,owned){ return Math.ceil(factory.baseCost*Math.pow(1.16,owned)); }
function batchInfo(factory,mode){
  const owned=state.company.facilities[factory.id]||0;
  if(mode==="max"){
    let count=0,total=0;
    while(count<10000){
      const next=costAt(factory,owned+count);
      if(total+next>state.company.credits)break;
      total+=next;count++;
    }
    return {count,total};
  }
  const quantity=Math.max(1,Math.min(25,Number(mode)||1));
  let total=0;
  for(let i=0;i<quantity;i++)total+=costAt(factory,owned+i);
  return {count:state.company.credits>=total?quantity:0,total,quantity};
}
function activeCompanyContract(){
  if(state.company.activeContractId==="custom"&&state.company.customContract)return state.company.customContract;
  return companyContracts.find(c=>c.id===state.company.activeContractId)||companyContracts[0];
}
function companyContractProgress(id=state.company.activeContractId){
  return state.company.contractProgress[id]||(state.company.contractProgress[id]={charge:0,completed:0});
}
function companyUnlockCost(index){return [0,50,500,5000,50000][index]??Infinity;}
function renderCompany(){
  const company=state.company;
  document.querySelector("#company-name-display").textContent=company.name;
  const nameInput=document.querySelector("#company-name-input");
  if(document.activeElement!==nameInput)nameInput.value=company.name;
  setAnimatedNumber(document.querySelector("#company-credits"),company.credits,format);
  const visible=factories.filter(f=>company.unlockedFacilityIds.includes(f.id));
  setAnimatedNumber(document.querySelector("#factory-count"),visible.reduce((n,f)=>n+(company.facilities[f.id]||0),0),n=>Math.round(n).toLocaleString("ja-JP")," 基");
  const factoryList=document.querySelector("#factory-list");
  if(factoryList.dataset.initialized!=="true"){factoryList.replaceChildren();factoryList.dataset.initialized="true";}
  for(const f of visible){
    let button=factoryList.querySelector('[data-buy="'+f.id+'"]');
    if(!button){
      factoryList.insertAdjacentHTML("beforeend",`<article class="shop-item"><div class="item-symbol">${f.symbol}</div><div class="item-info"><strong>${f.name}</strong><small>${f.description}</small><small>生産：<span data-factory-production></span> / 秒 · <span class="owned" data-factory-owned></span></small></div><button class="buy-button" type="button" data-buy="${f.id}"><span data-factory-buy-label></span><br><span data-factory-buy-total></span><small class="currency-label">星界クレジット</small></button></article>`);
      button=factoryList.querySelector('[data-buy="'+f.id+'"]');
    }
    const mode=document.querySelector("#buy-mode").value;
    const info=batchInfo(f,mode),owned=company.facilities[f.id]||0;
    button.disabled=info.count===0;
    const item=button.closest(".shop-item");
    item.querySelector("[data-factory-production]").textContent=format(f.production*state.productionMultiplier*prestigeMultiplier()*prestigeTreeEffects().production*astralTreeEffects().production);
    item.querySelector("[data-factory-owned]").textContent="所有："+owned;
    button.querySelector("[data-factory-buy-label]").textContent=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    button.querySelector("[data-factory-buy-total]").textContent=format(info.total);
  }
  document.querySelector("#factory-progress").textContent="施設の追加解放は、会社スキルツリーから行えます。購入数による自動解放はありません。";
  const tree=document.querySelector("#company-skill-tree");
  tree.innerHTML=factories.map((f,index)=>{
    const unlocked=company.unlockedFacilityIds.includes(f.id);
    const previous=index===0||company.unlockedFacilityIds.includes(factories[index-1].id);
    const cost=companyUnlockCost(index);
    const canUnlock=!unlocked&&previous&&company.credits>=cost;
    return `<article class="company-node ${unlocked?"is-unlocked":canUnlock?"is-available":"is-locked"}"><div class="company-node-index">NODE ${String(index+1).padStart(2,"0")}</div><strong>${f.name}</strong><small>${unlocked?"解放済み":previous?"研究コスト："+format(cost)+" クレジット":"前の施設の研究が必要"}</small><button type="button" class="buy-button" data-company-unlock="${f.id}" ${unlocked||!canUnlock?"disabled":""}>${unlocked?"解放済み":"研究して解放"}</button></article>`;
  }).join("");
  const contract=activeCompanyContract(),progress=companyContractProgress();
  const contractSelect=document.querySelector("#delivery-contract-select");
  const optionKey=companyContracts.slice(0,company.unlockedContractCount).map(c=>c.id).join("|")+"|custom";
  if(contractSelect.dataset.options!==optionKey){
    contractSelect.innerHTML=companyContracts.slice(0,company.unlockedContractCount).map(c=>`<option value="${c.id}">${c.name}</option>`).join("")+`<option value="custom">自由契約</option>`;
    contractSelect.dataset.options=optionKey;
  }
  contractSelect.value=company.activeContractId;
  document.querySelector("#delivery-contract-description").textContent=contract.description||"容量と本数を自由に設定する契約です。";
  document.querySelector("#delivery-battery-capacity").textContent=format(contract.capacity);
  document.querySelector("#delivery-battery-quantity").textContent=String(contract.quantity);
  document.querySelector("#delivery-battery-completed").textContent=progress.completed+" / "+contract.quantity+" 本";
  const charge=Math.min(contract.capacity,progress.charge||0),percent=Math.max(0,Math.min(100,charge/contract.capacity*100));
  document.querySelector("#delivery-battery-fill").style.width=percent+"%";
  document.querySelector("#delivery-battery-percent").textContent=percent.toFixed(2)+"%";
  document.querySelector("#delivery-battery-current").textContent=format(charge);
  document.querySelector("#delivery-contract-reward").textContent=format(contract.reward)+" クレジット";
  document.querySelector("#delivery-count").textContent=format(company.deliveryCount)+" 回";
  document.querySelector("#delivery-total").textContent=format(company.totalDeliveredEnergy);
  document.querySelector("#company-delivery-summary").textContent=progress.completed>=contract.quantity?"この契約は納品完了！":`あと ${contract.quantity-progress.completed} 本のバッテリーを納品しよう。`;
}
function render(){
  setAnimatedNumber(document.querySelector("#energy"),state.energy,format);
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
  renderCompany();
  setAnimatedNumber(document.querySelector("#lifetime"),state.lifetime,format);
  const mode=document.querySelector("#buy-mode").value;
  setAnimatedNumber(document.querySelector("#prestige-current"),state.prestigePoints,format);
  setAnimatedNumber(document.querySelector("#prestige-multiplier"),prestigeMultiplier(),n=>"×"+n.toFixed(2));
  setAnimatedNumber(document.querySelector("#prestige-run"),state.runLifetime,format);
  const gain=prestigeGain();
  setAnimatedNumber(document.querySelector("#prestige-gain"),gain,n=>"+"+Math.floor(n)+" ポイント");
  document.querySelector("#prestige-requirement").textContent=gain>0
    ?"転生すると "+gain+" ポイントを獲得できます。"
    :"次の1ポイントまで "+format(Math.max(0,nextPrestigeThreshold()-state.runLifetime))+" エネルギー必要";
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
  if(astralActive)setAnimatedNumber(document.querySelector("#astral-rate"),totalPerSecond()/5e15*astralMultiplier()*astralTreeEffects().apGain,formatAP," AP / 秒");else document.querySelector("#astral-rate").textContent="星界観測の研究が必要";
  document.querySelector("#astral-status").textContent=astralActive?"星界粒子の生成が稼働中":"5領域すべてTier 18と10の48乗エネルギーで星界観測を解放できます";
  const upgradeList=document.querySelector("#upgrade-list");
  if(upgradeList.dataset.initialized!=="true"){
    upgradeList.innerHTML=upgrades.map(u=>`
      <article class="shop-item">
        <div class="item-symbol">+</div>
        <div class="item-info">
          <strong>${u.name}</strong><small>${u.description}</small>
          <small><span class="owned" data-upgrade-owned></span> · 次回価格：<span data-upgrade-next-cost></span></small>
        </div>
        <button class="buy-button" type="button" data-upgrade="${u.id}">
          <span data-upgrade-label></span><br><span data-upgrade-total></span>
        </button>
      </article>`).join("");
    upgradeList.dataset.initialized="true";
  }
  for(const u of upgrades){
    const level=state.upgradeLevels[u.id]||0,info=upgradeBatchInfo(u,mode);
    const button=upgradeList.querySelector('[data-upgrade="'+u.id+'"]');
    if(!button)continue;
    button.disabled=info.count===0;
    const item=button.closest(".shop-item");
    item.querySelector("[data-upgrade-owned]").textContent="購入数："+level;
    item.querySelector("[data-upgrade-next-cost]").textContent=format(upgradeCost(u,level));
    button.querySelector("[data-upgrade-label]").textContent=mode==="max"?"購入 MAX ("+info.count+")":"購入 ×"+mode;
    button.querySelector("[data-upgrade-total]").textContent=format(info.total);
  }
}
function gain(amount){
  const safe=Number.isFinite(amount)&&amount>0?amount:0;
  state.energy+=safe; state.lifetime+=safe; state.runLifetime+=safe;
  if(safe>0&&astralUnlocked()){
    const earned=(safe/5e15)*astralMultiplier()*astralTreeEffects().apGain;
    if(Number.isFinite(earned)&&earned>0){state.ap=(Number(state.ap)||0)+earned;state.totalAP=(Number(state.totalAP)||0)+earned;}
  }
}
function showRebirthDischargeEffect(onComplete){
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
  state.unlockedFactoryCount=1;
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
  const message="転生すると、エネルギーと通常強化がリセットされます。会社施設・会社クレジット・会社スキルツリーは引き継がれます。\\n\\n"+earned+"ポイントを獲得して転生しますか？";
  if(!window.confirm(message))return;
  isRebirthAnimating=true;
  document.querySelector("#prestige-button").disabled=true;
  showRebirthDischargeEffect(()=>completePrestige(earned));
}


document.querySelector("#buy-mode").addEventListener("change",render);
document.querySelector("#company-name-save").addEventListener("click",saveCompanyName);
document.querySelector("#delivery-battery-transfer").addEventListener("click",transferToDeliveryBattery);
document.querySelector("#delivery-custom-create").addEventListener("click",createCustomContract);
document.querySelector("#delivery-contract-select").addEventListener("change",event=>{
  state.company.activeContractId=event.target.value;
  render();saveGame();
});
document.querySelector("#company-skill-tree").addEventListener("click",event=>{
  const button=event.target.closest("[data-company-unlock]");if(!button)return;
  const index=factories.findIndex(f=>f.id===button.dataset.companyUnlock);
  if(index<=0||index<0||state.company.unlockedFacilityIds.includes(button.dataset.companyUnlock))return;
  const previous=factories[index-1];
  if(!state.company.unlockedFacilityIds.includes(previous.id))return;
  const cost=companyUnlockCost(index);
  if(state.company.credits<cost)return;
  state.company.credits-=cost;
  state.company.unlockedFacilityIds.push(button.dataset.companyUnlock);
  document.querySelector("#company-name-feedback").textContent=factories[index].name+"を解放しました！";
  render();saveGame();
});
document.querySelector("#prestige-button").addEventListener("click",performPrestige);
document.querySelector("#reset-save-button").addEventListener("click",()=>{
  const confirmed=window.confirm("ゲームのセーブデータをすべて削除します。\\n\\nエネルギー・会社施設・クレジット・強化・転生ポイント・スキル取得状況が初期化されます。\\nこの操作は取り消せません。\\n\\n本当に削除しますか？");
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
document.querySelector("#produce-button").addEventListener("click",event=>{
  const button=event.currentTarget;
  const previousRank=clickMasteryRank();
  state.totalClicks=(Number(state.totalClicks)||0)+1;
  const currentRank=clickMasteryRank();
  const clickGain=effectiveClickPower();
  gain(clickGain);
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
  const f=factories.find(x=>x.id===button.dataset.buy);
  if(!f||!state.company.unlockedFacilityIds.includes(f.id))return;
  const mode=document.querySelector("#buy-mode").value,info=batchInfo(f,mode);
  if(info.count===0||state.company.credits<info.total)return;
  state.company.credits-=info.total;
  state.company.facilities[f.id]=(state.company.facilities[f.id]||0)+info.count;
  showUpgradePurchaseEffect(button,false,info.count);
  render();saveGame();
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
  showUpgradePurchaseEffect(button,u.id==="click4",info.count);
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
render();
saveGame();
