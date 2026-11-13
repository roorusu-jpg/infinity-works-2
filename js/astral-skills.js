import {migrateAstralBalance,astralNodeCost,astralLinkCost} from "./astral-balance.js";
const SAVE_KEY="infinity-works-2-save-v1",MAP_SIZE=3000,CENTER=1500;
const branches=[
{id:"creation",name:"創造",label:"CREATION",color:"#62e6b5",angle:-90,desc:"工場・自動生産・生産効率を強化"},
{id:"matter",name:"物質",label:"MATTER",color:"#ffd477",angle:-18,desc:"エネルギー・タップ出力・資源効率を強化"},
{id:"spacetime",name:"時空",label:"SPACETIME",color:"#79c9ff",angle:54,desc:"時間・オフライン生産を強化"},
{id:"astral",name:"星界",label:"ASTRAL",color:"#c5a8ff",angle:126,desc:"星界粒子の獲得効率を強化"},
{id:"transcendence",name:"超越",label:"TRANSCENDENCE",color:"#ff91d5",angle:198,desc:"複数能力を横断的に強化"}
];
const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX","XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII","XXXVIII","XXXIX","XL"];
const polar=(r,a)=>({x:CENTER+Math.cos(a*Math.PI/180)*r,y:CENTER+Math.sin(a*Math.PI/180)*r});
const nodes=[{id:"astral-hub",name:"星界の起点",branch:"CORE",description:"5つの研究領域へつながる星界ネットワークの起点。",cost:0,requires:[],x:CENTER,y:CENTER,type:"hub"}];
const branchNodes=branches.map(()=>[]);
const costAt=(tier,b)=>astralNodeCost(tier,b);
const rate=(min,max,tier,start=1,end=40)=>min+(max-min)*(tier-start)/(end-start);
const pct=value=>(value*100).toFixed(2).replace(/\.?0+$/,"")+"%";
for(let b=0;b<branches.length;b++){
 const br=branches[b];let parent="astral-hub";
 for(let tier=1;tier<=40;tier++){
  const p=polar(170+tier*24,br.angle+Math.sin(tier*.48+b)*.045);
  const id="astral-"+br.id+"-"+tier;
  const requires=[parent];
  if([9,17,25,33].includes(tier))requires.push("astral-link-"+((b+4)%5)+"-"+(tier-1));
  const effects={
   creation:"全工場の生産量を"+pct(rate(.005,.015,tier))+"上昇。工場購入コストを"+pct(rate(.001,.0025,tier))+"軽減",
   matter:"クリック出力を"+pct(rate(.005,.015,tier))+"上昇。工場購入コストを"+pct(rate(.001,.0025,tier))+"軽減",
   spacetime:"オフライン生産効率を"+pct(rate(.01,.025,tier))+"上昇",
   astral:"星界粒子の獲得量を"+pct(rate(.005,.015,tier))+"上昇",
   transcendence:"生産・クリック・オフライン・AP獲得量を"+pct(rate(.0025,.005,tier))+"上昇"
  };
  nodes.push({id,name:br.name+" "+roman[tier-1],branch:br.label,color:br.color,description:br.desc+"。"+effects[br.id]+"。",cost:costAt(tier,b),requires,x:p.x,y:p.y,type:br.id,tier});
  branchNodes[b].push(id);parent=id;
 }
}
for(let b=0;b<branches.length;b++){
 const next=(b+1)%branches.length;
 for(const tier of [8,16,24,32,40]){
  const a=nodes.find(n=>n.id===branchNodes[b][tier-1]),c=nodes.find(n=>n.id===branchNodes[next][tier-1]);
  const p={x:(a.x+c.x)/2,y:(a.y+c.y)/2};
  const id="astral-link-"+b+"-"+tier;
  nodes.push({id,name:"領域連結 "+branches[b].name+" × "+branches[next].name+" "+roman[tier/8-1],branch:"CONVERGENCE",color:"#fff0b0",description:"隣接する2つの研究領域を接続。全工場の生産量と星界粒子獲得量を追加で"+pct(rate(.0025,.005,tier,8,40))+"上昇。",cost:astralLinkCost(tier,b),requires:[a.id,c.id],x:p.x,y:p.y,type:"link",tier});
 }
}
nodes.push({id:"astral-final-core",name:"星界の深淵",branch:"FINAL",color:"#ffffff",description:"5系統すべての第40研究と5つの最終領域連結を統合する究極研究。生産・クリック・オフライン・AP獲得量を5%上昇。",cost:50000000,requires:[...branchNodes.map(a=>a[39]),...branches.map((_,b)=>"astral-link-"+b+"-40")],x:CENTER,y:145,type:"final",tier:41});
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(!s)return null;return {...s,astralSkills:Array.isArray(s.astralSkills)?s.astralSkills:[],ap:Math.max(0,Number(s.ap)||0),totalAP:Math.max(0,Number(s.totalAP)||Number(s.ap)||0)};}catch{return null;}}
let state=load(),selected="astral-hub";
if(state){const migration=migrateAstralBalance(state);state=migration.state;if(migration.changed){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}}}
const byId=id=>nodes.find(n=>n.id===id),owned=id=>id==="astral-hub"||(state?.astralSkills||[]).includes(id),unlocked=n=>n.requires.every(owned);
function format(v){if(!Number.isFinite(v))return "∞";if(v<=1_000_000)return v.toLocaleString("ja-JP",{maximumFractionDigits:4});const units=["M","B","T","Qa","Qi"];let n=v/1_000_000,i=0;while(n>=1000&&i<units.length-1){n/=1000;i++;}return i===units.length-1&&n>=1000?v.toExponential(2):n.toFixed(n<10?2:1)+units[i];}
function spent(){return nodes.reduce((sum,n)=>sum+(owned(n.id)?n.cost:0),0);}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#astral-tree-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#astral-tree-status").textContent="セーブできませんでした";}}
function detail(){
 const n=byId(selected)||nodes[0],d=document.querySelector("#astral-detail");
 if(n.type==="hub"){d.innerHTML='<div class="detail-branch">ASTRAL CORE · START</div><strong>'+n.name+'</strong><p>'+n.description+'</p><small>必要AP：0</small>';return;}
 const has=owned(n.id),ready=unlocked(n),can=state.ap>=n.cost;
 d.innerHTML='<div class="detail-branch" style="color:'+(n.color||"#fff")+'">'+n.branch+(n.tier?' · TIER '+n.tier:'')+'</div><strong>'+n.name+'</strong><p>'+n.description+'</p><small>必要AP：'+format(n.cost)+'</small><small>前提研究：'+n.requires.map(id=>byId(id)?.name||id).join(" / ")+'</small><button class="buy-button" id="buy-astral-skill" '+(has||!ready||!can?"disabled":"")+'>'+(has?"取得済み":!ready?"前提研究が必要":!can?"AP不足":"研究する · "+format(n.cost)+" AP")+'</button>';
}
function render(){
 document.querySelector("#astral-tree-ap").textContent=format(state.ap);
 document.querySelector("#astral-tree-total").textContent=format(state.totalAP);
 document.querySelector("#astral-tree-spent").textContent=format(spent());
 document.querySelector("#astral-tree-count").textContent=state.astralSkills.filter(id=>byId(id)&&id!=="astral-hub").length+" / "+(nodes.length-1)+" ノード取得";
 const lines=nodes.filter(n=>n.requires.length).map(n=>n.requires.map(id=>{const p=byId(id);return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+n.x+'" y2="'+n.y+'" class="'+(owned(n.id)?"line-owned":"")+'"/>';}).join("")).join("");
 const buttons=nodes.map(n=>'<button class="skill-node '+(owned(n.id)?"node-owned":unlocked(n)?"node-ready":"node-locked")+(n.type==="hub"?" node-hub":"")+(n.type==="link"?" node-link":"")+(n.type==="final"?" node-final":"")+'" data-node="'+n.id+'" style="left:'+(n.x/MAP_SIZE*100)+'%;top:'+(n.y/MAP_SIZE*100)+'%;--node-color:'+(n.color||"#c5a8ff")+'" title="'+n.name+'"><span>'+(n.type==="hub"?"✦":owned(n.id)?"✓":n.type==="link"?"◇":n.type==="final"?"∞":"✧")+'</span></button>').join("");
 document.querySelector("#astral-map").innerHTML='<svg class="skill-lines" viewBox="0 0 '+MAP_SIZE+' '+MAP_SIZE+'" aria-hidden="true">'+lines+'</svg>'+buttons;
 document.querySelector("#astral-reset-button").disabled=state.astralSkills.length===0;
 detail();
}
function buy(){const n=byId(selected);if(!n||n.type==="hub"||owned(n.id)||!unlocked(n)||state.ap<n.cost)return;state.ap-=n.cost;state.astralSkills.push(n.id);save();render();}
function bulkBuy(){let count=0,progress=true;while(progress){progress=false;for(const n of nodes){if(n.type==="hub"||owned(n.id)||!unlocked(n)||state.ap<n.cost)continue;state.ap-=n.cost;state.astralSkills.push(n.id);count++;progress=true;}}save();render();document.querySelector("#bulk-unlock-status").textContent=count+"個の研究を一括取得しました";}
function reset(){const ids=state.astralSkills.filter(id=>byId(id));if(!ids.length)return;const spentAmount=ids.reduce((sum,id)=>sum+byId(id).cost,0),refund=spentAmount*.8;const message="星界粒子スキルツリーをリセットします。\n\n使用AP："+format(spentAmount)+"\n返還AP（80%）："+format(refund)+"\n消失AP（20%）："+format(spentAmount-refund)+"\n\n取得済みノードはすべて未取得に戻ります。実行しますか？";if(!window.confirm(message))return;state.ap+=refund;state.astralSkills=[];selected="astral-hub";save();render();}
document.querySelector("#astral-map").addEventListener("click",e=>{const el=e.target.closest("[data-node]");if(!el)return;selected=el.dataset.node;detail();});
document.querySelector("#astral-detail").addEventListener("click",e=>{if(e.target.closest("#buy-astral-skill"))buy();});
document.querySelector("#astral-reset-button").addEventListener("click",reset);
document.querySelector("#bulk-unlock-button").addEventListener("click",bulkBuy);
if(!state){document.querySelector("#astral-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';}else if(!state.skills?.includes("astral-observation")){document.querySelector("#astral-map").innerHTML='<p class="empty-state">星界粒子スキルツリーは通常スキルツリーの5つの研究領域すべてでTier 18まで取得し、「星界観測」を研究すると利用できます。</p>';document.querySelector("#astral-reset-button").disabled=true;}else{render();const v=document.querySelector(".astral-map-viewport");requestAnimationFrame(()=>{v.scrollLeft=(MAP_SIZE-v.clientWidth)/2;v.scrollTop=(MAP_SIZE-v.clientHeight)/2;});}
