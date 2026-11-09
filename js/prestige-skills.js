const SAVE_KEY="infinity-works-2-save-v1",SIZE=1900,CENTER=950;
const branches=[
{id:"click",name:"超越操作",label:"CLICK",color:"#ffd477",angle:-90,desc:"クリック出力を高める"},
{id:"production",name:"永続生産",label:"PRODUCTION",color:"#7ce0bc",angle:-18,desc:"全工場の生産量を高める"},
{id:"economy",name:"資源圧縮",label:"ECONOMY",color:"#79c9ff",angle:54,desc:"工場の購入価格を下げる"},
{id:"offline",name:"時空保存",label:"OFFLINE",color:"#c3a0ff",angle:126,desc:"オフライン生産を強化する"},
{id:"start",name:"再起動支援",label:"RESTART",color:"#ff9a9a",angle:198,desc:"転生直後の初期エネルギーを増やす"}
];
const levels=[1,2,3,5,8],nodes=[{id:"rebirth-hub",name:"転生の中枢",branch:"CORE",description:"転生研究ネットワークの起点。",cost:0,requires:[],x:CENTER,y:CENTER,type:"hub"}];
for(let b=0;b<branches.length;b++){const br=branches[b],a=br.angle*Math.PI/180;let parent="rebirth-hub";
for(let i=0;i<5;i++){const radius=175+i*135,id="rebirth-"+br.id+"-"+(i+1),x=CENTER+Math.cos(a)*radius,y=CENTER+Math.sin(a)*radius;
const pct=[5,8,12,18,25][i],desc=br.id==="click"?"クリック倍率を恒久的に"+pct+"%上昇。":br.id==="production"?"全工場の生産倍率を恒久的に"+pct+"%上昇。":br.id==="economy"?"工場価格をさらに"+[3,3,3,4,5][i]+"%削減。":br.id==="offline"?"オフライン生産量を"+[10,20,35,50,100][i]+"%上昇。":"転生直後に"+[100,1000,10000,100000,1000000][i].toLocaleString("ja-JP")+"エネルギーを所持。";
nodes.push({id,name:br.name+" "+["I","II","III","IV","V"][i],branch:br.label,color:br.color,description:br.desc+"。"+desc,cost:levels[i],requires:[parent],x,y,type:br.id,tier:i+1});parent=id;
}}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(!s)return null;return {...s,prestigeSkills:Array.isArray(s.prestigeSkills)?s.prestigeSkills:[],prestigeSkillPoints:Math.max(0,Number(s.prestigeSkillPoints??s.prestigePoints)||0),prestigePoints:Math.max(0,Number(s.prestigePoints)||0)};}catch{return null;}}
let state=load(),selected="rebirth-hub";const byId=id=>nodes.find(n=>n.id===id),owned=id=>(state?.prestigeSkills||[]).includes(id),unlocked=n=>n.requires.every(owned);
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#prestige-save-status").textContent="研究データをセーブ済み";}catch{document.querySelector("#prestige-save-status").textContent="セーブできませんでした";}}
function renderDetail(){const n=byId(selected)||nodes[0],d=document.querySelector("#prestige-detail");if(n.type==="hub"){d.innerHTML='<div class="detail-branch">REBIRTH CORE · START</div><strong>'+n.name+'</strong><p>'+n.description+' 5つの専門研究ルートに接続しています。</p><small>必要ポイント：0</small>';return;}
const has=owned(n.id),ready=unlocked(n),can=state.prestigeSkillPoints>=n.cost;d.innerHTML='<div class="detail-branch" style="color:'+n.color+'">'+n.branch+' · TIER '+n.tier+'</div><strong>'+n.name+'</strong><p>'+n.description+'</p><small>必要ポイント：'+n.cost+'</small><small>前提研究：'+n.requires.map(id=>byId(id)?.name||id).join(" / ")+'</small><button class="buy-button" id="buy-prestige-skill" '+(has||!ready||!can?"disabled":"")+'>'+(has?"取得済み":!ready?"前提研究が必要":!can?"ポイント不足":"研究する · "+n.cost+" pt")+'</button>';}
function render(){document.querySelector("#prestige-skill-points").textContent=state.prestigeSkillPoints;document.querySelector("#prestige-total-points").textContent=state.prestigePoints;document.querySelector("#prestige-skill-count").textContent=state.prestigeSkills.length+" / 25 取得";
const lines=nodes.filter(n=>n.requires.length).map(n=>n.requires.map(id=>{const p=byId(id);return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+n.x+'" y2="'+n.y+'" class="'+(owned(n.id)?"line-owned":"")+'"/>';}).join("")).join("");
const buttons=nodes.map(n=>'<button class="skill-node '+(owned(n.id)?"node-owned":unlocked(n)?"node-ready":"node-locked")+(n.type==="hub"?" node-hub":"")+'" data-node="'+n.id+'" style="left:'+(n.x/SIZE*100)+'%;top:'+(n.y/SIZE*100)+'%;--node-color:'+(n.color||"#ffd477")+'" title="'+n.name+'"><span>'+(n.type==="hub"?"✦":owned(n.id)?"✓":"✧")+'</span></button>').join("");
document.querySelector("#prestige-map").innerHTML='<svg class="skill-lines" viewBox="0 0 '+SIZE+' '+SIZE+'" aria-hidden="true">'+lines+'</svg>'+buttons;renderDetail();}
function buy(){const n=byId(selected);if(!n||n.type==="hub"||owned(n.id)||!unlocked(n)||state.prestigeSkillPoints<n.cost)return;state.prestigeSkillPoints-=n.cost;state.prestigeSkills.push(n.id);save();render();}
document.querySelector("#prestige-map").addEventListener("click",e=>{const el=e.target.closest("[data-node]");if(!el)return;selected=el.dataset.node;renderDetail();});
document.querySelector("#prestige-detail").addEventListener("click",e=>{if(e.target.closest("#buy-prestige-skill"))buy();});
if(!state){document.querySelector("#prestige-map").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';}else{render();const v=document.querySelector(".prestige-map-viewport");requestAnimationFrame(()=>{v.scrollLeft=(SIZE-v.clientWidth)/2;v.scrollTop=(SIZE-v.clientHeight)/2;});}