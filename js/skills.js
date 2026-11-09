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
function loadState(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!saved)return null;return {...saved,skills:Array.isArray(saved.skills)?saved.skills:[],purchased:Array.isArray(saved.purchased)?saved.purchased:[]};}catch{return null;}}
let state=loadState(),selectedSkill="core-hub";
if(state&&!state.skills.includes("core-hub")){
 state.skills.push("core-hub");
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}
}
function format(value){if(!Number.isFinite(value))return "∞";if(value<1000)return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});const units=["","K","M","B","T","Qa","Qi"];let n=value,i=0;while(n>=1000&&i<units.length-1){n/=1000;i++;}return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];}
function saveState(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#skill-save-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#skill-save-status").textContent="セーブできませんでした";}}
function skillById(id){return skills.find(s=>s.id===id);}
function isUnlocked(skill){return skill.requires.every(id=>state.skills.includes(id));}
function renderDetail(){
 const detail=document.querySelector("#skill-detail"),s=skillById(selectedSkill)||skills[0];
 if(s.type==="hub"){detail.innerHTML='<div class="detail-branch">STARTING NODE · UNLOCKED</div><strong>インフィニティ・コア</strong><p>初期状態で解放済みの研究起点です。ここから5つの研究領域の最初のノードを選択できます。</p><small>必要エネルギー：0</small>';return;}
 const owned=state.skills.includes(s.id),unlocked=isUnlocked(s);
 const effect=s.type==="click"?"クリック出力 +"+format(s.value):s.type==="cost"?"工場価格 ×"+s.value.toFixed(3):"全工場生産量 ×"+s.value.toFixed(3);
 const prereq=s.requires.map(id=>skillById(id)?.name||id).join(" / ");
 detail.innerHTML='<div class="detail-branch" style="color:'+s.color+'">'+s.branch+(s.tier?' · TIER '+s.tier:'')+'</div><strong>'+s.name+'</strong><p>'+s.description+'</p><small>効果：'+effect+'</small><small>必要エネルギー：'+format(s.cost)+'</small><small>前提研究：'+prereq+'</small><button class="buy-button" id="research-selected" '+(owned||!unlocked||state.energy<s.cost?"disabled":"")+'>'+(owned?"取得済み":!unlocked?"前提研究が必要":"研究する · "+format(s.cost))+'</button>';
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
if(!state){document.querySelector("#skill-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';document.querySelector("#skill-count").textContent="0 / "+(skills.length-1)+" 取得";}else{render();const viewport=document.querySelector(".skill-map-viewport");requestAnimationFrame(()=>{viewport.scrollLeft=(MAP_SIZE-viewport.clientWidth)/2;viewport.scrollTop=(MAP_SIZE-viewport.clientHeight)/2;});}
