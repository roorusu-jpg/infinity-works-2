import {astralTreeEffects} from "./astral-balance.js";
const SAVE_KEY="infinity-works-2-save-v1";
const legacy=[
["tap1","高効率エネルギー採取","CORE","クリック出力 +2",100,"click",2],
["tap2","量子反応制御","CORE","クリック出力 +8",600,"click",8],
["tap3","超伝導エネルギー収束","CORE","クリック出力 +25",3000,"click",25],
["prod1","自動化最適化","AUTOMATION","全施設の生産量 ×1.25",250,"production",1.25],
["prod2","反応炉同期ネットワーク","AUTOMATION","全施設の生産量 ×1.5",1200,"production",1.5],
["prod3","恒星炉連結システム","AUTOMATION","全施設の生産量 ×2",5000,"production",2],
["eco1","資源循環プロトコル","INDUSTRY","施設の購入価格 ×0.9",400,"cost",0.9],
["eco2","予測型生産管理","INDUSTRY","施設の購入価格 ×0.85",1800,"cost",0.85],
["eco3","銀河規模の資源最適化","INDUSTRY","施設の購入価格 ×0.75",7500,"cost",0.75]
];
const MAP_SIZE=2800,CENTER=1400;
const branches=[
{id:"CORE",oldIds:["tap1","tap2","tap3"],color:"#56dcff",angle:-90,pattern:["click","click","production","click","production"]},
{id:"AUTOMATION",oldIds:["prod1","prod2","prod3"],color:"#54e6a2",angle:-18,pattern:["production","production","click","production","production"]},
{id:"INDUSTRY",oldIds:["eco1","eco2","eco3"],color:"#ffc76b",angle:54,pattern:["cost","cost","production","cost","production"]},
{id:"QUANTUM",color:"#b99aff",angle:126,pattern:["click","production","click","production","click"]},
{id:"COSMIC",color:"#ff8b8b",angle:198,pattern:["production","click","production","click","production"]}
];
const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];
// v0.9.0: steep research-cost curve. Legacy nodes keep their original prices.
function researchCost(branchIndex,tier,multiplier=1){
 const exponent=8+Math.max(0,tier-4)*1.25;
 return Math.ceil(Math.pow(10,exponent)*Math.pow(4,branchIndex)*multiplier);
}
const skills=[{id:"core-hub",name:"インフィニティ・コア",branch:"CORE",description:"全研究ネットワークの起点。5つの巨大研究領域へ接続する。",cost:0,requires:[],x:CENTER,y:CENTER,type:"hub",value:0}];
const branchEnds=[];
for(let b=0;b<branches.length;b++){
 const branch=branches[b];
 const angleBase=branch.angle*Math.PI/180;
 let parent="core-hub";
 const mainIds=[];
 for(let tier=1;tier<=20;tier++){
  const old=legacy.find(x=>x[0]===branch.oldIds?.[tier-1]);
  const angle=angleBase+Math.sin(tier*0.82+b)*0.11;
  const radius=145+tier*48;
  const x=CENTER+Math.cos(angle)*radius;
  const y=CENTER+Math.sin(angle)*radius;
  const type=old?old[5]:branch.pattern[(tier-1)%branch.pattern.length];
  const value=old?old[6]:(type==="click"?Math.round(28*Math.pow(1.58,tier-4)):type==="cost"?0.985:1.12+tier*0.035);
  const cost=old?old[4]:researchCost(b,tier);
  const id=old?old[0]:branch.id.toLowerCase()+"-"+tier;
  const requires=[parent];
  if(tier===10)requires.push(branch.id.toLowerCase()+"-convergence-1");
  if(tier===15)requires.push(branch.id.toLowerCase()+"-convergence-2");
  if(tier===20)requires.push(branch.id.toLowerCase()+"-convergence-3");
  skills.push({id,name:old?old[1]:branch.id+" "+roman[tier-1],branch:branch.id,color:branch.color,description:old?old[3]:(type==="click"?"オペレーターの出力制御を高度化する":type==="cost"?"工場建設コストを圧縮する":"全自動生産網の出力を増幅する"),cost,requires,x,y,type,value,tier});
  parent=id;mainIds.push(id);
 }
 // Three optional research forks per region. Each fork has two paths that must reunite.
 for(let fork=1;fork<=3;fork++){
  const tier=fork*5,parentId=mainIds[tier-1],anchor=skills.find(s=>s.id===parentId);
  const a=angleBase+Math.sin(tier*0.82+b)*0.11;
  const radial={x:Math.cos(a),y:Math.sin(a)},tangent={x:-Math.sin(a),y:Math.cos(a)};
  const forkIds=[];
  for(const side of ["a","b"]){
   const sign=side==="a"?-1:1;
   const firstId=branch.id.toLowerCase()+"-f"+fork+"-"+side+"1";
   const secondId=branch.id.toLowerCase()+"-f"+fork+"-"+side+"2";
   const first={x:anchor.x+radial.x*92+tangent.x*sign*105,y:anchor.y+radial.y*92+tangent.y*sign*105};
   const second={x:anchor.x+radial.x*190+tangent.x*sign*170,y:anchor.y+radial.y*190+tangent.y*sign*170};
   const sideType=side==="a"?"click":"production";
   skills.push({id:firstId,name:branch.id+" 分岐"+fork+"-"+side.toUpperCase()+" I",branch:branch.id,color:branch.color,description:"専門研究ルートの基礎技術。",cost:researchCost(b,tier+1,2.5),requires:[parentId],x:first.x,y:first.y,type:sideType,value:sideType==="click"?Math.round(45*Math.pow(1.6,fork)):1.18+fork*0.08,tier:tier+0.1});
   skills.push({id:secondId,name:branch.id+" 分岐"+fork+"-"+side.toUpperCase()+" II",branch:branch.id,color:branch.color,description:"専門技術を発展させ、合流研究への経路を開く。",cost:researchCost(b,tier+3,4),requires:[firstId],x:second.x,y:second.y,type:sideType,value:sideType==="click"?Math.round(90*Math.pow(1.65,fork)):1.28+fork*0.1,tier:tier+0.2});
   forkIds.push(secondId);
  }
  const mergeId=branch.id.toLowerCase()+"-convergence-"+fork;
  const merge={x:anchor.x+radial.x*265+tangent.x*15,y:anchor.y+radial.y*265+tangent.y*15};
  skills.push({id:mergeId,name:branch.id+" 分岐統合 "+roman[fork-1],branch:branch.id,color:branch.color,description:"左右2つの専門ルートを統合。上位研究の必須条件。",cost:researchCost(b,tier+5,8),requires:forkIds,x:merge.x,y:merge.y,type:branch.pattern[(fork+1)%branch.pattern.length],value:branch.pattern[(fork+1)%branch.pattern.length]==="click"?Math.round(180*Math.pow(1.7,fork)):1.42+fork*0.13,tier:tier+0.3});
 }
 branchEnds.push(mainIds[19]);
}
skills.push({id:"transcendent-core",name:"超越宇宙演算核",branch:"TRANSCENDENT",color:"#ffffff",description:"5つの研究領域を統合する最終研究。全領域の最終ノード取得が必要。",cost:Math.ceil(Math.pow(10,48)),requires:branchEnds,x:CENTER,y:MAP_SIZE-115,type:"production",value:3,tier:21});
skills.push({id:"astral-observation",name:"星界観測",branch:"ASTRAL",color:"#b99aff",description:"通常スキルツリーの最終研究「超越宇宙演算核」を完成させた者だけが解放できる観測技術。生産エネルギーから星界粒子（AP）を抽出する。",cost:1e12,requires:["transcendent-core"],x:980,y:1510,type:"unlock",value:1,tier:6});
function loadState(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!saved)return null;return {...saved,skills:Array.isArray(saved.skills)?saved.skills:[],purchased:Array.isArray(saved.purchased)?saved.purchased:[]};}catch{return null;}}
let state=loadState(),selectedSkill="core-hub";
let lastProductionTick=Date.now();
if(state&&!state.skills.includes("core-hub")){
 state.skills.push("core-hub");
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}
}
function format(value){if(!Number.isFinite(value))return "∞";if(value<1000)return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});const units=["","K","M","B","T","Qa","Qi"];let n=value,i=0;while(n>=1000&&i<units.length-1){n/=1000;i++;}return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];}
function saveState(){try{if(!document.hidden)state.lastSeen=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#skill-save-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#skill-save-status").textContent="セーブできませんでした";}}

const factoryProduction={drone:0.2,collector:1.5,plant:10,reactor:85,orbital:650,helium:5200,antimatter:42000,dyson:350000,fusion:3000000,quantum:26000000,gate:220000000,neutron:1900000000,blackhole:16000000000,stellar:140000000000,galactic:1200000000000,cosmic:10000000000000,brane:90000000000000,singularity:800000000000000,universe:7000000000000000,infinity:60000000000000000};
const productionPrestigeTiers=[1.05,1.08,1.12,1.18,1.25,1.32,1.4,1.5,1.65,1.8,2,2.25];
const resonancePrestigeTiers=[1.02,1.03,1.04,1.05,1.07,1.09,1.12,1.15,1.2,1.25,1.32,1.4];
const singularityPrestigeTiers=[1.01,1.015,1.02,1.025,1.03,1.04,1.05,1.06,1.08,1.1,1.12,1.15];
function productionPrestigeMultiplier(){
 let value=1;
 for(const id of state.prestigeSkills||[]){
  const match=id.match(/^rebirth-(production|resonance|singularity)-(\d+)$/);
  if(match){const tier=Number(match[2])-1,values=match[1]==="production"?productionPrestigeTiers:match[1]==="resonance"?resonancePrestigeTiers:singularityPrestigeTiers;if(values[tier]!==undefined)value*=values[tier];}
  else if(id.startsWith("rebirth-link-"))value*=1.03;
 }
 return value;
}
function offlineProductionMultiplier(){
 const offlineTiers=[1.1,1.15,1.2,1.3,1.4,1.5,1.65,1.8,2,2.25,2.5,3];
 const singularityTiers=[1.01,1.015,1.02,1.025,1.03,1.04,1.05,1.06,1.08,1.1,1.12,1.15];
 let value=1;
 for(const id of state.prestigeSkills||[]){
  const match=id.match(/^rebirth-(offline|singularity)-(\d+)$/);
  if(match){
   const tier=Number(match[2])-1;
   const values=match[1]==="offline"?offlineTiers:singularityTiers;
   if(values[tier]!==undefined)value*=values[tier];
  }else if(id.startsWith("rebirth-link-"))value*=1.05;
 }
 return value*astralTreeEffects(state.astralSkills).offline;
}
function totalProduction(){
 const base=Object.entries(factoryProduction).reduce((sum,[id,rate])=>sum+(Number(state.factories?.[id])||0)*rate,0);
 const totalPrestige=Math.max(0,Number(state.totalPrestigePoints??state.prestigePoints)||0);
 const prestige=1+(0.02*Math.sqrt(10*totalPrestige));
 return base*(Number(state.productionMultiplier)||1)*prestige*productionPrestigeMultiplier()*astralTreeEffects(state.astralSkills).production;
}
function gainEnergy(amount){
 const safe=Number.isFinite(amount)&&amount>0?amount:0;
 state.energy=(Number(state.energy)||0)+safe;
 state.lifetime=(Number(state.lifetime)||0)+safe;
 state.runLifetime=(Number(state.runLifetime)||0)+safe;
 if(safe>0&&Array.isArray(state.skills)&&state.skills.includes("astral-observation")){
  const multiplier=1+Math.log10(1+Math.max(0,totalProduction())/1e6);
  const earned=(safe/5e13)*multiplier*astralTreeEffects(state.astralSkills).apGain;
  if(Number.isFinite(earned)&&earned>0){state.ap=(Number(state.ap)||0)+earned;state.totalAP=(Number(state.totalAP)||0)+earned;}
 }
}
function updateLiveProduction(){
 if(document.hidden)return;
 const now=Date.now(),dt=Math.max(0,Math.min(2,(now-lastProductionTick)/1000));
 lastProductionTick=now;
 const amount=totalProduction()*dt;
 if(amount>0)gainEnergy(amount);
 document.querySelector("#skill-energy").textContent=format(state.energy||0);
 renderDetail();
}
function applyBackgroundProduction(){
 const now=Date.now();
 const elapsed=Math.max(0,Math.min(8*60*60,(now-lastProductionTick)/1000));
 lastProductionTick=now;
 const amount=totalProduction()*elapsed*offlineProductionMultiplier();
 if(amount>0)gainEnergy(amount);
 document.querySelector("#skill-energy").textContent=format(state.energy||0);
 renderDetail();
}

function skillById(id){return skills.find(s=>s.id===id);}
function isUnlocked(skill){return skill.requires.every(id=>state.skills.includes(id));}
function renderDetail(){
 const detail=document.querySelector("#skill-detail"),s=skillById(selectedSkill)||skills[0];
 if(s.type==="hub"){detail.innerHTML='<div class="detail-branch">STARTING NODE · UNLOCKED</div><strong>インフィニティ・コア</strong><p>初期状態で解放済みの研究起点です。ここから5つの研究領域の最初のノードを選択できます。</p><small>必要エネルギー：0</small>';return;}
 const owned=state.skills.includes(s.id),unlocked=isUnlocked(s);
 const effect=s.type==="unlock"?"星界粒子APの生成を解放":s.type==="click"?"クリック出力 +"+format(s.value):s.type==="cost"?"工場価格 ×"+s.value.toFixed(3):"全工場生産量 ×"+s.value.toFixed(3);
 const prereq=s.requires.map(id=>skillById(id)?.name||id).join(" / ");
 detail.innerHTML='<div class="detail-branch" style="color:'+s.color+'">'+s.branch+(s.tier?' · TIER '+s.tier:'')+'</div><strong>'+s.name+'</strong><p>'+s.description+'</p><small>効果：'+effect+'</small><small>必要エネルギー：'+format(s.cost)+'</small><small>前提研究：'+prereq+'</small><button class="buy-button" id="research-selected" '+(owned||!unlocked||state.energy<s.cost?"disabled":"")+'>'+(owned?"取得済み":s.id==="astral-observation"&&!state.skills.includes("transcendent-core")?"通常スキルツリー最終研究後に解放":!unlocked?"前提研究が必要":"研究する · "+format(s.cost))+'</button>';
}
function render(){
 document.querySelector("#skill-energy").textContent=format(state.energy||0);
 const map=document.querySelector("#skill-map");
 const lines=skills.filter(s=>s.requires.length).map(s=>s.requires.map(parentId=>{const p=skillById(parentId);return p?'<line x1="'+p.x+'" y1="'+p.y+'" x2="'+s.x+'" y2="'+s.y+'" class="'+(state.skills.includes(s.id)?"line-owned":"")+'"/>':"";}).join("")).join("");
 const nodes=skills.map(s=>{const owned=state.skills.includes(s.id),ready=isUnlocked(s),hub=s.type==="hub",final=s.id==="transcendent-core";return '<button class="skill-node '+(owned?"node-owned":ready?"node-ready":"node-locked")+(hub?" node-hub":"")+(final?" node-final":"")+'" data-node="'+s.id+'" style="left:'+(s.x/MAP_SIZE*100)+'%;top:'+(s.y/MAP_SIZE*100)+'%;--node-color:'+(s.color||"#fff")+'" title="'+s.name+' · '+(hub?"起点":format(s.cost))+'"><span>'+(hub?"✦":owned?"✓":final?"∞":"✧")+'</span></button>';}).join("");
 map.innerHTML='<svg class="skill-lines" viewBox="0 0 '+MAP_SIZE+' '+MAP_SIZE+'" aria-hidden="true">'+lines+'</svg>'+nodes;
 document.querySelector("#skill-count").textContent=state.skills.filter(id=>skillById(id)&&id!=="core-hub").length+" / "+(skills.length-1)+" 研究取得（コアは初期解放）";
 renderDetail();
}
function buySkill(id){const s=skillById(id);if(!s||s.type==="hub"||state.skills.includes(id)||!isUnlocked(s)||state.energy<s.cost)return;state.energy-=s.cost;if(s.type==="click")state.clickPower=(Number(state.clickPower)||1)+s.value;if(s.type==="production")state.productionMultiplier=(Number(state.productionMultiplier)||1)*s.value;if(s.type==="cost")state.costMultiplier=(Number(state.costMultiplier)||1)*s.value;state.skills.push(id);saveState();render();}
document.querySelector("#skill-map").addEventListener("click",e=>{const node=e.target.closest("[data-node]");if(!node)return;selectedSkill=node.dataset.node;renderDetail();});
document.querySelector("#skill-detail").addEventListener("click",e=>{if(e.target.closest("#research-selected"))buySkill(selectedSkill);});
if(!state){document.querySelector("#skill-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';document.querySelector("#skill-count").textContent="0 / "+(skills.length-1)+" 取得";}else{
 const elapsed=Math.max(0,Math.min(8*60*60,(Date.now()-(Number(state.lastSeen)||Date.now()))/1000));
 if(elapsed>0&&totalProduction()>0)gainEnergy(totalProduction()*elapsed*offlineProductionMultiplier());
 lastProductionTick=Date.now();
 state.lastSeen=Date.now();
 render();
 const viewport=document.querySelector(".skill-map-viewport");
 requestAnimationFrame(()=>{viewport.scrollLeft=(MAP_SIZE-viewport.clientWidth)/2;viewport.scrollTop=(MAP_SIZE-viewport.clientHeight)/2;});
 lastProductionTick=Date.now();
 setInterval(updateLiveProduction,250);
 setInterval(saveState,10000);
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden){state.lastSeen=Date.now();saveState();}
  else{applyBackgroundProduction();saveState();}
 });
 function finalizeProductionSave(){
  if(document.hidden)applyBackgroundProduction();
  state.lastSeen=Date.now();
  saveState();
 }
 window.addEventListener("pagehide",finalizeProductionSave);
 window.addEventListener("beforeunload",finalizeProductionSave);
 saveState();
}
