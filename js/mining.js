const SAVE_KEY="infinity-works-2-save-v1";
const ORES=[
{id:"copper",name:"銅鉱石",symbol:"Cu",rarity:"common",rarityName:"COMMON",color:"#d98b55",base:2,depth:1,area:"surface"},
{id:"iron",name:"鉄鉱石",symbol:"Fe",rarity:"common",rarityName:"COMMON",color:"#aab8c8",base:4,depth:1,area:"surface"},
{id:"silver",name:"銀鉱石",symbol:"Ag",rarity:"uncommon",rarityName:"UNCOMMON",color:"#d6e2ef",base:12,depth:8,area:"shallow"},
{id:"tin",name:"錫鉱石",symbol:"Sn",rarity:"uncommon",rarityName:"UNCOMMON",color:"#b9c4ce",base:7,depth:12,area:"shallow"},
{id:"gold",name:"金鉱石",symbol:"Au",rarity:"rare",rarityName:"RARE",color:"#f5c95c",base:35,depth:20,area:"mid"},
{id:"zinc",name:"亜鉛鉱石",symbol:"Zn",rarity:"uncommon",rarityName:"UNCOMMON",color:"#9eabb9",base:10,depth:25,area:"mid"},
{id:"nickel",name:"ニッケル鉱石",symbol:"Ni",rarity:"rare",rarityName:"RARE",color:"#a7b3bf",base:55,depth:60,area:"deep"},
{id:"mithril",name:"ミスリル",symbol:"Mi",rarity:"epic",rarityName:"EPIC",color:"#73d8ed",base:120,depth:50,area:"deep"},
{id:"void",name:"虚無鉱石",symbol:"Vo",rarity:"legendary",rarityName:"LEGENDARY",color:"#b69cff",base:600,depth:100,area:"abyss"},
{id:"chromium",name:"クロム鉱石",symbol:"Cr",rarity:"epic",rarityName:"EPIC",color:"#c7d4e1",base:90,depth:100,area:"abyss"},
{id:"tungsten",name:"タングステン鉱石",symbol:"W",rarity:"epic",rarityName:"EPIC",color:"#69798d",base:180,depth:150,area:"abyss"},
{id:"geode",name:"晶洞片",symbol:"◇",rarity:"epic",rarityName:"VEIN ONLY",color:"#d5a7ff",base:300,depth:1,area:"surface",specialOnly:true}
];
const AREAS=[{id:"surface",name:"地表鉱区",min:1,description:"銅・鉄を中心に、アメジストなどが見つかる。"},{id:"shallow",name:"浅層鉱区",min:8,description:"銀・錫の鉱脈。サファイアやトパーズも見つかる。"},{id:"mid",name:"中層鉱区",min:20,description:"金・亜鉛が採れる。ルビーなど希少な宝石が出現し始める。"},{id:"deep",name:"深層鉱区",min:50,description:"ニッケル・ミスリルの鉱脈。希少な宝石の発見率が上がる。"},{id:"abyss",name:"深淵鉱区",min:100,description:"虚無鉱石などの高位鉱石と、ダイヤモンドが眠る最深部。"}];
const GEMS=[{id:"amethyst",name:"アメジスト",symbol:"✦",rarityName:"COMMON",color:"#b68cff"},{id:"sapphire",name:"サファイア",symbol:"✦",rarityName:"UNCOMMON",color:"#5b9dff"},{id:"ruby",name:"ルビー",symbol:"✦",rarityName:"RARE",color:"#ff637e"},{id:"topaz",name:"トパーズ",symbol:"✦",rarityName:"UNCOMMON",color:"#f3bd58"},{id:"diamond",name:"ダイヤモンド",symbol:"✦",rarityName:"LEGENDARY",color:"#8ff3ef"}];
const GEM_DROPS={surface:[["amethyst",55],["topaz",30],["sapphire",15]],shallow:[["amethyst",35],["topaz",30],["sapphire",25],["ruby",10]],mid:[["topaz",25],["sapphire",30],["ruby",25],["amethyst",10],["diamond",10]],deep:[["sapphire",25],["ruby",35],["diamond",25],["topaz",10],["amethyst",5]],abyss:[["ruby",30],["diamond",45],["sapphire",20],["topaz",5]]};
const RECIPES=[{id:"drill",name:"強化ドリル",desc:"銅鉱石×20 + 鉄鉱石×10",cost:{copper:20,iron:10},effect:"採掘パワー +50%",power:.5},{id:"silverbit",name:"銀合金ビット",desc:"銀鉱石×12 + 鉄鉱石×25",cost:{silver:12,iron:25},effect:"採掘パワー +100%",power:1},{id:"goldcore",name:"黄金採掘コア",desc:"金鉱石×8 + 銀鉱石×20",cost:{gold:8,silver:20},effect:"採掘パワー +250%",power:2.5}];
const fresh=()=>({credits:0,depth:1,maxDepth:1,area:"surface",equipment:1,equipmentLevel:1,crafted:[],alloyCrafted:[],compositeAlloyCrafted:[],storageLevel:1,ores:Object.fromEntries(ORES.map(o=>[o.id,0])),gems:Object.fromEntries(GEMS.map(g=>[g.id,0])),discovered:[],discoveredGems:[],vein:null,veinsFound:0,autoSell:{enabled:false,rarity:"all",ore:"all",keep:10},lastSeen:Date.now()});
function load(){try{const old=JSON.parse(localStorage.getItem(SAVE_KEY))||{};const m=old.miningV2||{};const base=fresh();return {...base,...m,ores:{...base.ores,...(m.ores||{})},gems:{...base.gems,...(m.gems||{})},discovered:Array.isArray(m.discovered)?m.discovered:[],discoveredGems:Array.isArray(m.discoveredGems)?m.discoveredGems:[],crafted:Array.isArray(m.crafted)?m.crafted:[],alloyCrafted:Array.isArray(m.alloyCrafted)?m.alloyCrafted:[],compositeAlloyCrafted:Array.isArray(m.compositeAlloyCrafted)?m.compositeAlloyCrafted:[],autoSell:{...base.autoSell,...(m.autoSell||{})},depth:Math.max(1,Math.floor(Number(m.depth)||1)),maxDepth:Math.max(1,Math.floor(Number(m.maxDepth)||1))};}catch{return fresh();}}
let state=load();if(!AREAS.some(a=>a.id===state.area&&state.depth>=a.min))state.area=[...AREAS].reverse().find(a=>state.depth>=a.min)?.id||"surface";const $=s=>document.querySelector(s);const fmt=n=>{if(!Number.isFinite(n))return "∞";if(n<1e6)return Math.floor(n).toLocaleString("ja-JP");const u=["M","B","T","Qa","Qi"];let v=n/1e6,i=0;while(v>=10000&&i<u.length-1){v/=1000;i++;}return v>=10000?v.toExponential(2):Number(v.toFixed(v<100?2:1))+u[i];};
const rarityOrder=["common","uncommon","rare","epic","legendary"];const rarityBase={common:.62,uncommon:.22,rare:.1,epic:.045,legendary:.015};
const area=()=>AREAS.find(a=>a.id===state.area)||AREAS[0];const alloyPower={ "bronze-drill-bit":.5,"stainless-mining-frame":1,"tungsten-impact-head":1.5};const craftedPower=()=>state.crafted.reduce((s,id)=>s+(RECIPES.find(r=>r.id===id)?.power||0),0)+state.alloyCrafted.reduce((s,id)=>s+(alloyPower[id]||0),0);
const power=()=>state.equipment*(1+craftedPower());
const used=()=>Object.values(state.ores).reduce((a,b)=>a+(Number(b)||0),0)+Object.values(state.gems).reduce((a,b)=>a+(Number(b)||0),0);const cap=()=>state.storageLevel>=10?Infinity:250*Math.pow(2,state.storageLevel-1);
const depthCost=()=>Math.min(Number.MAX_SAFE_INTEGER,Math.floor(25*Math.exp(Math.min(700,Math.log(1.18)*state.depth))));const equipCost=()=>Math.min(Number.MAX_SAFE_INTEGER,Math.floor(30*Math.pow(1.45,state.equipmentLevel-1)));const storeCost=()=>Math.min(Number.MAX_SAFE_INTEGER,Math.floor(60*Math.pow(1.9,state.storageLevel-1)));
const isFound=o=>state.discovered.includes(o.id);const sellPrice=o=>o.base*(1+rarityOrder.indexOf(o.rarity)*.75)*(1+state.depth*.04);
function save(){try{const all=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");all.miningV2={...(all.miningV2||{}),credits:state.credits,depth:state.depth,maxDepth:state.maxDepth,area:state.area,equipment:state.equipment,equipmentLevel:state.equipmentLevel,crafted:state.crafted,alloyCrafted:state.alloyCrafted,compositeAlloyCrafted:state.compositeAlloyCrafted,storageLevel:state.storageLevel,ores:state.ores,gems:state.gems,discovered:state.discovered,discoveredGems:state.discoveredGems,vein:state.vein,veinsFound:state.veinsFound,autoSell:state.autoSell,lastSeen:Date.now()};localStorage.setItem(SAVE_KEY,JSON.stringify(all));}catch{}}
function say(s){$("#mining-feedback").textContent=s;}
function addOre(o,n){const room=cap()-used();const got=Math.max(0,Math.min(n,room));if(got>0){state.ores[o.id]=(state.ores[o.id]||0)+got;if(!isFound(o)){state.discovered.push(o.id);say("初発見！ "+o.name+"を見つけた！");}}return got;}
function addGem(g,n=1){const room=cap()-used();const got=Math.max(0,Math.min(n,room));if(got>0){state.gems[g.id]=(state.gems[g.id]||0)+got;if(!state.discoveredGems.includes(g.id)){state.discoveredGems.push(g.id);say("宝石を初発見！ "+g.name+"を見つけた！");}}return got;}
function findGem(){if(Math.random()>=.1)return null;const drops=GEM_DROPS[state.area]||GEM_DROPS.surface;let roll=Math.random()*drops.reduce((sum,item)=>sum+item[1],0);for(const [id,weight] of drops){roll-=weight;if(roll<=0)return GEMS.find(g=>g.id===id)||null;}return GEMS.find(g=>g.id===drops[0][0])||null;}
function chooseOre(){const eligible=ORES.filter(o=>!o.specialOnly&&o.depth<=state.depth&&(o.area==="surface"||AREAS.find(a=>a.id===o.area).min<=state.depth));const weights=eligible.map(o=>rarityBase[o.rarity]*(o.area===state.area?2.5:1)*(1+Math.min(state.depth/150,8)*({common:0,uncommon:.2,rare:.65,epic:1.1,legendary:1.7}[o.rarity])));const sum=weights.reduce((a,b)=>a+b,0);let r=Math.random()*sum;for(let i=0;i<eligible.length;i++){r-=weights[i];if(r<=0)return eligible[i];}return eligible[0]||ORES[0];}
function spawnVein(guaranteed=false){const o=chooseOre();state.vein={ore:o.id,amount:Math.floor(25+state.depth*1.5),guaranteed};$("#vein-status").textContent=(guaranteed?"深度到達ボーナス！ ":"特殊鉱脈を発見！ ")+o.name+"が大量に眠っている。";$("#vein-button").disabled=false;}
function triggerMiningImpact(){
  const button=$("#mine-button");
  const hero=document.querySelector(".mining-hero");
  if(!button)return;
  button.classList.remove("is-mining-impact");
  if(hero)hero.classList.remove("is-mining-shake");
  void button.offsetWidth;
  button.classList.add("is-mining-impact");
  if(hero){
    hero.classList.add("is-mining-shake");
    hero.addEventListener("animationend",()=>hero.classList.remove("is-mining-shake"),{once:true});
  }
  const burst=document.createElement("span");
  burst.className="mining-impact-burst";
  burst.setAttribute("aria-hidden","true");
  for(let i=0;i<12;i++){
    const spark=document.createElement("i");
    const angle=(Math.PI*2*i/12)+(Math.random()-.5)*.22;
    const distance=42+Math.random()*34;
    spark.style.setProperty("--spark-x",(Math.cos(angle)*distance)+"px");
    spark.style.setProperty("--spark-y",(Math.sin(angle)*distance)+"px");
    spark.style.setProperty("--spark-delay",(Math.random()*55)+"ms");
    burst.appendChild(spark);
  }
  button.appendChild(burst);
  burst.addEventListener("animationend",()=>burst.remove(),{once:true});
  button.addEventListener("animationend",()=>button.classList.remove("is-mining-impact"),{once:true});
}
function mine(){triggerMiningImpact();let got=0;const n=Math.max(1,Math.floor(power()));for(let i=0;i<n;i++)got+=addOre(chooseOre(),1);const gem=findGem();const gemGot=gem?addGem(gem,1):0;if(!got&&!gemGot)say("保管庫が満杯！鉱石や宝石を整理するか、保管庫を強化しよう。");else if(gemGot)say("採掘成功！ "+fmt(got)+" 個の鉱石と、"+gem.name+"を発見！");else say("採掘成功！ "+fmt(got)+" 個の鉱石を獲得");runAutoSell();if(!state.vein&&Math.random()<.025)spawnVein();save();render();}
function collectVein(){if(!state.vein)return;const o=ORES.find(x=>x.id===state.vein.ore)||ORES[0];const n=addOre(o,state.vein.amount);const geode=ORES.find(x=>x.id==="geode");addOre(geode,Math.max(1,Math.floor(n*.08)));state.veinsFound++;state.vein=null;runAutoSell();$("#vein-status").textContent="鉱脈を採掘！通常鉱石に加えて、鉱脈限定の晶洞片を入手した。";save();render();}
function sell(id,n){const o=ORES.find(x=>x.id===id);if(!o)return 0;const amount=Math.max(0,Math.min(state.ores[id]||0,Math.floor(n)));if(!amount)return 0;state.ores[id]-=amount;const earned=amount*sellPrice(o);state.credits+=earned;return earned;}
function runAutoSell(){if(!state.autoSell.enabled)return;for(const o of ORES){if(state.autoSell.rarity!=="all"&&state.autoSell.rarity!==o.rarity)continue;if(state.autoSell.ore!=="all"&&state.autoSell.ore!==o.id)continue;const excess=Math.max(0,(state.ores[o.id]||0)-Math.max(0,Number(state.autoSell.keep)||0));if(excess>0)sell(o.id,excess);}}
function renderGems(){const grid=$("#gem-grid");if(!grid)return;grid.innerHTML=GEMS.map(g=>{const found=state.discoveredGems.includes(g.id);return '<article class="ore-card-new gem-card '+(found?"":"is-locked")+'" style="--ore-color:'+g.color+'"><div class="ore-card-head"><span class="ore-glyph gem-glyph">'+g.symbol+'</span><span class="ore-rarity">'+g.rarityName+'</span></div><strong class="ore-name">'+g.name+'</strong><span class="ore-owned">'+(found?fmt(state.gems[g.id]||0):"未発見")+'</span><small>'+(found?"所持数・コレクション登録済み":"採掘で発見") +'</small></article>';}).join("");$("#gem-count").textContent=state.discoveredGems.length+" / "+GEMS.length+" 発見";}
function renderOres(){
  for(const o of ORES){
    const open=state.depth>=o.depth;
    let card=document.querySelector('[data-ore-id="'+o.id+'"]');
    if(!card){
      card=document.createElement("article");
      card.dataset.oreId=o.id;
      card.className="ore-card-new";
      card.innerHTML='<div class="ore-card-head"><span class="ore-glyph"><img alt="" loading="lazy"></span><span class="ore-rarity"></span></div><strong class="ore-name"></strong><span class="ore-owned"></span><small class="ore-detail"></small>';
      $("#ore-grid").appendChild(card);
    }
    card.className="ore-card-new"+(open?"":" is-locked");
    card.style.setProperty("--ore-color",o.color);
    const img=card.querySelector("img");
    const imagePath="assets/ores/"+o.id+".svg";
    if(img.getAttribute("src")!==imagePath){img.src=imagePath;img.alt=o.name;}
    card.querySelector(".ore-rarity").textContent=o.rarityName;
    card.querySelector(".ore-name").textContent=o.name;
    card.querySelector(".ore-owned").textContent=isFound(o)?fmt(state.ores[o.id]||0):"未発見";
    card.querySelector(".ore-detail").textContent=o.specialOnly?"特殊鉱脈限定":open?(isFound(o)?"売却価格 "+fmt(sellPrice(o))+" CR / 個":"発見可能"):"深度 "+o.depth+" m で解放";
  }
  $("#ore-count").textContent=state.discovered.filter(id=>id!=="geode").length+" / "+ORES.filter(o=>!o.specialOnly).length+" 発見";
renderGems();
}
function renderRecipes(){$("#recipe-list").innerHTML=RECIPES.map(r=>'<article class="recipe-card"><div><strong>'+r.name+(state.crafted.includes(r.id)?" ✓":"")+'</strong><small>'+r.desc+'<br>'+r.effect+'</small></div><button class="buy-button" data-craft="'+r.id+'" '+(state.crafted.includes(r.id)?"disabled":"")+'>'+(state.crafted.includes(r.id)?"製作済み":"製作する")+'</button></article>').join("");document.querySelectorAll("[data-craft]").forEach(b=>b.addEventListener("click",()=>craft(b.dataset.craft)));}
function render(){const usedNow=used(),capacity=cap();$("#credits").textContent=fmt(state.credits)+" CR";$("#max-depth").textContent=fmt(state.maxDepth)+" m";$("#depth").innerHTML=fmt(state.depth)+' <small>m</small>';$("#area-name").textContent=area().name;$("#power").textContent="×"+power().toFixed(1);$("#equipment-level").textContent=state.equipmentLevel;$("#storage").textContent=fmt(usedNow)+" / "+(capacity===Infinity?"∞":fmt(capacity));$("#storage-capacity").textContent=capacity===Infinity?"∞":fmt(capacity);$("#storage-level").textContent="Lv."+state.storageLevel;$("#depth-cost").textContent="必要: "+fmt(depthCost())+" CR";$("#equipment-cost").textContent="必要: "+fmt(equipCost())+" CR";$("#storage-cost").textContent=state.storageLevel>=10?"MAX":fmt(storeCost())+" CR";$("#depth-button").disabled=state.credits<depthCost();$("#equipment-button").disabled=state.credits<equipCost()||(state.equipmentLevel>=5&&(state.ores.geode||0)<1);$("#storage-upgrade").disabled=state.storageLevel>=10||state.credits<storeCost();$("#area-select-button").textContent="現在: "+area().name;$("#depth-progress-fill").style.width=(state.depth%10)*10+"%";const sellOreSelect=$("#sell-ore"),selectedSellOre=sellOreSelect.value;sellOreSelect.innerHTML=ORES.filter(isFound).map(o=>'<option value="'+o.id+'">'+o.name+'</option>').join("")||'<option value="">鉱石未発見</option>';if([...sellOreSelect.options].some(option=>option.value===selectedSellOre))sellOreSelect.value=selectedSellOre;if(!window.__miningAutoControlsReady){const autoOre=$("#auto-sell-ore");autoOre.innerHTML='<option value="all">すべての鉱石</option>'+ORES.map(o=>'<option value="'+o.id+'">'+o.name+'</option>').join("");$("#auto-sell-enabled").checked=state.autoSell.enabled;$("#auto-sell-rarity").value=state.autoSell.rarity;autoOre.value=state.autoSell.ore;$("#auto-sell-keep").value=state.autoSell.keep;window.__miningAutoControlsReady=true;}$("#vein-button").disabled=!state.vein;if(state.vein){const o=ORES.find(x=>x.id===state.vein.ore);$("#vein-status").textContent="特殊鉱脈発見！ "+o.name+" ×"+fmt(state.vein.amount)+" が眠っている。";}renderOres();renderRecipes();$("#area-list").innerHTML=AREAS.map(a=>'<article class="area-card '+(state.area===a.id?"is-active":"")+'"><strong>'+a.name+'</strong><p>'+a.description+'</p><small>'+(state.depth>=a.min?"解放済み":"深度 "+a.min+" m で解放")+'</small></article>').join("");}
function craft(id){const r=RECIPES.find(x=>x.id===id);if(!r||state.crafted.includes(id))return;for(const [key,n] of Object.entries(r.cost)){if((state.ores[key]||0)<n){say("素材が足りない: "+ORES.find(o=>o.id===key).name);return;}}for(const [key,n] of Object.entries(r.cost))state.ores[key]-=n;state.crafted.push(id);say(r.name+"を製作した！");save();render();}
$("#mine-button").addEventListener("click",mine);
$("#save-auto-sell").addEventListener("click",()=>{state.autoSell={enabled:$("#auto-sell-enabled").checked,rarity:$("#auto-sell-rarity").value,ore:$("#auto-sell-ore").value,keep:Math.max(0,Number($("#auto-sell-keep").value)||0)};save();say("自動売却設定を保存した。");});
$("#depth-button").addEventListener("click",()=>{const c=depthCost();if(state.credits<c)return;state.credits-=c;state.depth++;state.maxDepth=Math.max(state.maxDepth,state.depth);const next=[...AREAS].reverse().find(a=>state.depth>=a.min);if(next)state.area=next.id;if(state.depth%10===0&&!state.vein)spawnVein(true);save();render();say("深度 "+state.depth+" m に到達！");});
$("#equipment-button").addEventListener("click",()=>{const c=equipCost();if(state.credits<c)return;if(state.equipmentLevel>=5){if((state.ores.geode||0)<1){say("Lv.6以降の強化には晶洞片が必要！");return;}state.ores.geode--;}state.credits-=c;state.equipmentLevel++;state.equipment+=.5;save();render();});
$("#area-select-button").addEventListener("click",()=>{const unlocked=AREAS.filter(a=>state.depth>=a.min);const i=unlocked.findIndex(a=>a.id===state.area);state.area=unlocked[(i+1)%unlocked.length].id;save();render();});
$("#vein-button").addEventListener("click",collectVein);
$("#sell-one").addEventListener("click",()=>{const earned=sell($("#sell-ore").value,Number($("#sell-amount").value)||0);$("#sell-feedback").textContent=earned?fmt(earned)+" CRを獲得！":"売却できる鉱石がない。";save();render();});
$("#sell-all").addEventListener("click",()=>{const id=$("#sell-ore").value;const earned=sell(id,state.ores[id]||0);$("#sell-feedback").textContent=earned?fmt(earned)+" CRを獲得！":"売却できる鉱石がない。";save();render();});
$("#storage-upgrade").addEventListener("click",()=>{const c=storeCost();if(state.storageLevel>=10||state.credits<c)return;state.credits-=c;state.storageLevel++;save();render();});
state.lastSeen=Date.now();save();render();
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});window.addEventListener("pagehide",save);
