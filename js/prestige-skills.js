const SAVE_KEY="infinity-works-2-save-v1",SIZE=3000,CENTER=1500;
const branches=[
{id:"click",name:"超越操作",label:"CLICK",color:"#ffd477",angle:-90,desc:"クリック出力を高める"},
{id:"production",name:"永続生産",label:"PRODUCTION",color:"#7ce0bc",angle:-38.57,desc:"全工場の生産量を高める"},
{id:"economy",name:"資源圧縮",label:"ECONOMY",color:"#79c9ff",angle:12.86,desc:"工場の購入価格を下げる"},
{id:"offline",name:"時空保存",label:"OFFLINE",color:"#c3a0ff",angle:64.29,desc:"オフライン生産を強化する"},
{id:"start",name:"再起動支援",label:"RESTART",color:"#ff9a9a",angle:115.71,desc:"転生直後の初期エネルギーを増やす"},
{id:"resonance",name:"共鳴増幅",label:"RESONANCE",color:"#ff8fd1",angle:167.14,desc:"クリックと生産を同時に高める"},
{id:"singularity",name:"特異点制御",label:"SINGULARITY",color:"#a9b5ff",angle:218.57,desc:"全能力を底上げする"}
];
const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const nodes=[{id:"rebirth-hub",name:"転生の中枢",branch:"CORE",description:"共通転生ポイントで全研究を解放する中枢。",cost:0,requires:[],x:CENTER,y:CENTER,type:"hub"}];
const polar=(r,a)=>({x:CENTER+Math.cos(a*Math.PI/180)*r,y:CENTER+Math.sin(a*Math.PI/180)*r});
const costAt=t=>Math.ceil(t*Math.pow(2.35,t-1));
for(const br of branches){let parent="rebirth-hub";for(let t=1;t<=12;t++){
 const id="rebirth-"+br.id+"-"+t,p=polar(145+t*92,br.angle);
 const values={click:[5,8,12,18,25,32,40,50,65,80,100,125],production:[5,8,12,18,25,32,40,50,65,80,100,125],economy:[2,3,4,5,6,7,8,9,10,12,14,16],offline:[10,15,20,30,40,50,65,80,100,125,150,200],start:[100,500,2000,10000,50000,250000,1e6,5e6,2.5e7,1e8,5e8,2.5e9],resonance:[2,3,4,5,7,9,12,15,20,25,32,40],singularity:[1,1.5,2,2.5,3,4,5,6,8,10,12,15]};
 const v=values[br.id][t-1],desc=br.id==="click"?"クリック出力を"+v+"%上昇。":br.id==="production"?"全工場の生産量を"+v+"%上昇。":br.id==="economy"?"工場価格を"+v+"%削減。":br.id==="offline"?"オフライン生産を"+v+"%上昇。":br.id==="start"?"転生直後の初期エネルギーを+"+v.toLocaleString("ja-JP")+"。":br.id==="resonance"?"クリックと全工場生産をそれぞれ"+v+"%上昇。":"クリック・生産・オフライン効率をそれぞれ"+v+"%上昇。";
 nodes.push({id,name:br.name+" "+roman[t-1],branch:br.label,color:br.color,description:br.desc+"。"+desc,cost:costAt(t),requires:[parent],x:p.x,y:p.y,type:br.id,tier:t});parent=id;
}}
for(let b=0;b<branches.length;b++){const a=branches[b],c=branches[(b+1)%branches.length];for(const t of [4,8,12]){
 const mid=a.angle+((c.angle-a.angle+360)%360)/2,p=polar(145+t*92,mid),id="rebirth-link-"+a.id+"-"+c.id+"-"+t;
 nodes.push({id,name:"領域連結 "+roman[t/4-1],branch:"CONVERGENCE",color:"#fff0b0",description:a.name+"と"+c.name+"を結ぶ統合研究。クリック・生産・オフライン効率を追加で強化する。",cost:Math.ceil(costAt(t)*2.5),requires:["rebirth-"+a.id+"-"+t,"rebirth-"+c.id+"-"+t],x:p.x,y:p.y,type:"link",tier:t});
}}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(!s)return null;return {...s,prestigeSkills:Array.isArray(s.prestigeSkills)?s.prestigeSkills:[],prestigePoints:Math.max(0,Number(s.prestigeSkillPoints ?? s.prestigePoints)||0),totalPrestigePoints:Math.max(0,Number(s.totalPrestigePoints ?? s.prestigePoints)||0)};}catch{return null;}}
let state=load(),selected="rebirth-hub";const byId=id=>nodes.find(n=>n.id===id),owned=id=>id==="rebirth-hub"||(state?.prestigeSkills||[]).includes(id),unlocked=n=>n.requires.every(owned);
function spent(){return nodes.reduce((sum,n)=>sum+(owned(n.id)?n.cost:0),0);}
function available(){return Math.max(0,state.prestigePoints-spent());}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#prestige-save-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#prestige-save-status").textContent="セーブできませんでした";}}
function renderDetail(){const n=byId(selected)||nodes[0],d=document.querySelector("#prestige-detail");if(n.type==="hub"){d.innerHTML='<div class="detail-branch">REBIRTH CORE · START</div><strong>'+n.name+'</strong><p>'+n.description+' 7つの専門領域と領域間の統合研究に接続しています。</p><small>必要ポイント：0</small>';return;}
const has=owned(n.id),ready=unlocked(n),can=available()>=n.cost;d.innerHTML='<div class="detail-branch" style="color:'+(n.color||"#fff0b0")+'">'+n.branch+' · TIER '+n.tier+'</div><strong>'+n.name+'</strong><p>'+n.description+'</p><small>必要ポイント：'+n.cost.toLocaleString("ja-JP")+'</small><small>前提研究：'+n.requires.map(id=>byId(id)?.name||id).join(" / ")+'</small><button class="buy-button" id="buy-prestige-skill" '+(has||!ready||!can?"disabled":"")+'>'+(has?"取得済み":!ready?"前提研究が必要":!can?"ポイント不足":"研究する · "+n.cost.toLocaleString("ja-JP")+" pt")+'</button>';}
function render(){document.querySelector("#prestige-skill-points").textContent=available().toLocaleString("ja-JP");document.querySelector("#prestige-total-points").textContent=state.totalPrestigePoints.toLocaleString("ja-JP");document.querySelector("#prestige-skill-count").textContent=state.prestigeSkills.filter(id=>byId(id)).length+" / "+(nodes.length-1)+" 取得";
const lines=nodes.filter(n=>n.requires.length).map(n=>n.requires.map(id=>{const p=byId(id);return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+n.x+'" y2="'+n.y+'" class="'+(owned(n.id)?"line-owned":"")+'"/>';}).join("")).join("");
const buttons=nodes.map(n=>'<button class="skill-node '+(owned(n.id)?"node-owned":unlocked(n)?"node-ready":"node-locked")+(n.type==="hub"?" node-hub":"")+(n.type==="link"?" node-link":"")+'" data-node="'+n.id+'" style="left:'+(n.x/SIZE*100)+'%;top:'+(n.y/SIZE*100)+'%;--node-color:'+(n.color||"#ffd477")+'" title="'+n.name+'"><span>'+(n.type==="hub"?"✦":owned(n.id)?"✓":n.type==="link"?"◇":"✧")+'</span></button>').join("");
document.querySelector("#prestige-map").innerHTML='<svg class="skill-lines" viewBox="0 0 '+SIZE+' '+SIZE+'" aria-hidden="true">'+lines+'</svg>'+buttons;renderDetail();}
function buy(){const n=byId(selected);if(!n||n.type==="hub"||owned(n.id)||!unlocked(n)||available()<n.cost)return;state.prestigeSkills.push(n.id);save();render();}
document.querySelector("#prestige-map").addEventListener("click",e=>{const el=e.target.closest("[data-node]");if(!el)return;selected=el.dataset.node;renderDetail();});
document.querySelector("#prestige-detail").addEventListener("click",e=>{if(e.target.closest("#buy-prestige-skill"))buy();});
if(!state){document.querySelector("#prestige-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';}else{render();const v=document.querySelector(".prestige-map-viewport");requestAnimationFrame(()=>{v.scrollLeft=(SIZE-v.clientWidth)/2;v.scrollTop=(SIZE-v.clientHeight)/2;});}
