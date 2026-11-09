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
const branches=[
{id:"CORE",oldIds:["tap1","tap2","tap3"],color:"#56dcff",angle:-90,effects:["click","click","click","production","click","production","click","production"]},
{id:"AUTOMATION",oldIds:["prod1","prod2","prod3"],color:"#54e6a2",angle:-18,effects:["production","production","production","click","production","production","click","production"]},
{id:"INDUSTRY",oldIds:["eco1","eco2","eco3"],color:"#ffc76b",angle:54,effects:["cost","cost","cost","production","cost","production","cost","production"]},
{id:"QUANTUM",color:"#b99aff",angle:126,effects:["click","production","click","production","click","production","click","production"]},
{id:"COSMIC",color:"#ff8b8b",angle:198,effects:["production","click","production","click","production","click","production","click"]}
];
const skills=[{id:"core-hub",name:"インフィニティ・コア",branch:"CORE",description:"全研究の起点",cost:0,requires:[],x:500,y:500,type:"hub",value:0}];
branches.forEach((branch,b)=>{
 let parent="core-hub";
 for(let i=0;i<8;i++){
  const old=legacy.find(x=>x[0]===branch.oldIds?.[i]);
  const id=old?old[0]:branch.id.toLowerCase()+"-"+(i+1);
  const angle=(branch.angle+(i-3.5)*3.4)*Math.PI/180,radius=95+i*43;
  const x=500+Math.cos(angle)*radius,y=500+Math.sin(angle)*radius;
  const type=old?old[5]:branch.effects[i];
  const value=old?old[6]:(type==="click"?[3,5,10,20,40,80,160,320][i]:type==="cost"?[0.96,0.93,0.9,0.87,0.84,0.8,0.76,0.72][i]:[1.12,1.16,1.2,1.25,1.3,1.4,1.5,1.65][i]);
  const cost=old?old[4]:Math.round(450*Math.pow(2.05,i)*(1+b*0.12));
  skills.push({id,name:old?old[1]:branch.id+" "+["I","II","III","IV","V","VI","VII","VIII"][i],branch:branch.id,color:branch.color,description:old?old[3]:(type==="click"?"クリック出力を強化":type==="cost"?"工場購入価格を低減":"全工場の生産量を強化"),cost,requires:[parent],x,y,type,value});
  parent=id;
 }
});
function loadState(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!saved)return null;return {...saved,skills:Array.isArray(saved.skills)?saved.skills:[],purchased:Array.isArray(saved.purchased)?saved.purchased:[]};}catch{return null;}}
let state=loadState(),selectedSkill="core-hub";
function format(value){if(!Number.isFinite(value))return "∞";if(value<1000)return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});const units=["","K","M","B","T","Qa","Qi"];let n=value,i=0;while(n>=1000&&i<units.length-1){n/=1000;i++;}return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];}
function saveState(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#skill-save-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#skill-save-status").textContent="セーブできませんでした";}}
function skillById(id){return skills.find(s=>s.id===id);}
function isUnlocked(skill){return skill.requires.every(id=>state.skills.includes(id));}
function renderDetail(){
 const detail=document.querySelector("#skill-detail"),s=skillById(selectedSkill)||skills[0];
 if(s.type==="hub"){detail.innerHTML="<strong>インフィニティ・コア</strong><p>中央のコアから5つの研究ルートが広がります。各ルートは前のノードを取得すると次へ進めます。</p>";return;}
 const owned=state.skills.includes(s.id),unlocked=isUnlocked(s);
 detail.innerHTML='<div class="detail-branch" style="color:'+s.color+'">'+s.branch+'</div><strong>'+s.name+'</strong><p>'+s.description+'</p><small>必要エネルギー：'+format(s.cost)+'</small><button class="buy-button" id="research-selected" '+(owned||!unlocked||state.energy<s.cost?"disabled":"")+'>'+(owned?"取得済み":!unlocked?"前提ノードが必要":"研究する · "+format(s.cost))+'</button>';
}
function render(){
 document.querySelector("#skill-energy").textContent=format(state.energy||0);
 const map=document.querySelector("#skill-map");
 const lines=skills.filter(s=>s.requires.length).map(s=>{const p=skillById(s.requires[0]);return p?'<line x1="'+p.x+'" y1="'+p.y+'" x2="'+s.x+'" y2="'+s.y+'" class="'+(state.skills.includes(s.id)?"line-owned":"")+'"/>':"";}).join("");
 const nodes=skills.map(s=>{const owned=state.skills.includes(s.id),ready=isUnlocked(s),hub=s.type==="hub";return '<button class="skill-node '+(owned?"node-owned":ready?"node-ready":"node-locked")+(hub?" node-hub":"")+'" data-node="'+s.id+'" style="left:'+s.x/10+'%;top:'+s.y/10+'%;--node-color:'+(s.color||"#fff")+'" title="'+s.name+' · '+(hub?"起点":format(s.cost))+'"><span>'+(hub?"✦":owned?"✓":"✧")+'</span></button>';}).join("");
 map.innerHTML='<svg class="skill-lines" viewBox="0 0 1000 1000" aria-hidden="true">'+lines+'</svg>'+nodes;
 document.querySelector("#skill-count").textContent+="";
 document.querySelector("#skill-count").textContent=state.skills.length+" / "+(skills.length-1)+" 取得";
 renderDetail();
}
function buySkill(id){const s=skillById(id);if(!s||s.type==="hub"||state.skills.includes(id)||!isUnlocked(s)||state.energy<s.cost)return;state.energy-=s.cost;if(s.type==="click")state.clickPower=(Number(state.clickPower)||1)+s.value;if(s.type==="production")state.productionMultiplier=(Number(state.productionMultiplier)||1)*s.value;if(s.type==="cost")state.costMultiplier=(Number(state.costMultiplier)||1)*s.value;state.skills.push(id);saveState();render();}
document.querySelector("#skill-map").addEventListener("click",e=>{const node=e.target.closest("[data-node]");if(!node)return;selectedSkill=node.dataset.node;renderDetail();});
document.querySelector("#skill-detail").addEventListener("click",e=>{if(e.target.closest("#research-selected"))buySkill(selectedSkill);});
if(!state){document.querySelector("#skill-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';document.querySelector("#skill-count").textContent="0 / "+(skills.length-1)+" 取得";}else render();
