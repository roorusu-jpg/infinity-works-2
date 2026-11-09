const SAVE_KEY = "infinity-works-2-save-v1";
const skills = [
  { id:"tap1", name:"高効率エネルギー採取", branch:"CORE", description:"クリック出力 +2", cost:100, requires:[], apply:s=>s.clickPower+=2 },
  { id:"tap2", name:"量子反応制御", branch:"CORE", description:"クリック出力 +8", cost:600, requires:["tap1"], apply:s=>s.clickPower+=8 },
  { id:"tap3", name:"超伝導エネルギー収束", branch:"CORE", description:"クリック出力 +25", cost:3000, requires:["tap2"], apply:s=>s.clickPower+=25 },
  { id:"prod1", name:"自動化最適化", branch:"AUTOMATION", description:"全施設の生産量 ×1.25", cost:250, requires:[], apply:s=>s.productionMultiplier*=1.25 },
  { id:"prod2", name:"反応炉同期ネットワーク", branch:"AUTOMATION", description:"全施設の生産量 ×1.5", cost:1200, requires:["prod1"], apply:s=>s.productionMultiplier*=1.5 },
  { id:"prod3", name:"恒星炉連結システム", branch:"AUTOMATION", description:"全施設の生産量 ×2", cost:5000, requires:["prod2"], apply:s=>s.productionMultiplier*=2 },
  { id:"eco1", name:"資源循環プロトコル", branch:"INDUSTRY", description:"施設の購入価格 ×0.9", cost:400, requires:[], apply:s=>s.costMultiplier*=0.9 },
  { id:"eco2", name:"予測型生産管理", branch:"INDUSTRY", description:"施設の購入価格 ×0.85", cost:1800, requires:["eco1"], apply:s=>s.costMultiplier*=0.85 },
  { id:"eco3", name:"銀河規模の資源最適化", branch:"INDUSTRY", description:"施設の購入価格 ×0.75", cost:7500, requires:["eco2"], apply:s=>s.costMultiplier*=0.75 }
];
function loadState(){
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!saved)return null;
    return {...saved,skills:Array.isArray(saved.skills)?saved.skills:[],purchased:Array.isArray(saved.purchased)?saved.purchased:[]};
  } catch { return null; }
}
let state=loadState();
function format(value){
  if(!Number.isFinite(value))return "∞";
  if(value<1000)return value.toLocaleString("ja-JP",{maximumFractionDigits:value<10?1:0});
  const units=["","K","M","B","T","Qa","Qi"];
  let n=value,i=0;while(n>=1000&&i<units.length-1){n/=1000;i++;}
  return i===units.length-1&&n>=1000?value.toExponential(2):n.toFixed(n<10?2:1)+units[i];
}
function saveState(){
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(state));document.querySelector("#skill-save-status").textContent="研究データをセーブ済み"; }
  catch { document.querySelector("#skill-save-status").textContent="セーブできませんでした"; }
}
function render(){
  document.querySelector("#skill-energy").textContent=format(state?.energy||0);
  document.querySelector("#skill-list").innerHTML=skills.map(skill=>{
    const owned=state.skills.includes(skill.id);
    const locked=skill.requires.some(id=>!state.skills.includes(id));
    const affordable=state.energy>=skill.cost;
    const requirement=locked?"前提スキルを取得すると解放":owned?"取得済み":"必要エネルギー："+format(skill.cost);
    return `<article class="skill-card ${owned?"skill-owned":locked?"skill-locked":""}"><div class="skill-branch">${skill.branch}</div><strong>${skill.name}</strong><p>${skill.description}</p><small>${requirement}</small><button class="buy-button" data-skill="${skill.id}" ${owned||locked||!affordable?"disabled":""}>${owned?"取得済み":locked?"ロック中":"研究する · "+format(skill.cost)}</button></article>`;
  }).join("");
  document.querySelector("#skill-count").textContent=state.skills.length+" / "+skills.length+" 取得";
}
document.querySelector("#skill-list").addEventListener("click",e=>{
  const button=e.target.closest("[data-skill]");if(!button)return;
  const skill=skills.find(x=>x.id===button.dataset.skill);
  if(!skill||state.skills.includes(skill.id)||state.energy<skill.cost||skill.requires.some(id=>!state.skills.includes(id)))return;
  state.energy-=skill.cost;skill.apply(state);state.skills.push(skill.id);saveState();render();
});
if(!state){
  document.querySelector("#skill-list").innerHTML='<p class="empty-state">セーブデータがありません。先にゲームを開始してください。</p>';
  document.querySelector("#skill-count").textContent="0 / 9 取得";
  document.querySelector("#skill-energy").textContent="0";
} else {
  if(!Array.isArray(state.skills))state.skills=[];
  render();
}
