const SAVE_KEY="infinity-works-2-save-v1";
const ORES=[
{id:"copper",name:"銅鉱石",symbol:"Cu",material:"銅インゴット",rarity:1,baseTime:8,baseEnergy:20,energyPerOre:50000,price:3},
{id:"iron",name:"鉄鉱石",symbol:"Fe",material:"鉄インゴット",rarity:1.15,baseTime:12,baseEnergy:35,energyPerOre:100000,price:5},
{id:"silver",name:"銀鉱石",symbol:"Ag",material:"銀インゴット",rarity:1.5,baseTime:18,baseEnergy:70,energyPerOre:250000,price:12},
{id:"tin",name:"錫鉱石",symbol:"Sn",material:"錫インゴット",rarity:1.3,baseTime:14,baseEnergy:55,energyPerOre:180000,price:7},
{id:"gold",name:"金鉱石",symbol:"Au",material:"金インゴット",rarity:2,baseTime:28,baseEnergy:150,energyPerOre:500000,price:30},
{id:"zinc",name:"亜鉛鉱石",symbol:"Zn",material:"亜鉛インゴット",rarity:1.4,baseTime:16,baseEnergy:60,energyPerOre:200000,price:10},
{id:"nickel",name:"ニッケル鉱石",symbol:"Ni",material:"ニッケルインゴット",rarity:2.4,baseTime:32,baseEnergy:240,energyPerOre:650000,price:55},
{id:"mithril",name:"ミスリル",symbol:"Mi",material:"ミスリル素材",rarity:3.2,baseTime:45,baseEnergy:500,energyPerOre:1000000,price:100},
{id:"void",name:"虚無鉱石",symbol:"Vo",material:"虚無精製素材",rarity:5,baseTime:75,baseEnergy:1800,energyPerOre:2500000,price:500},
{id:"chromium",name:"クロム鉱石",symbol:"Cr",material:"クロムインゴット",rarity:3.5,baseTime:42,baseEnergy:420,energyPerOre:900000,price:90},
{id:"tungsten",name:"タングステン鉱石",symbol:"W",material:"タングステンインゴット",rarity:3.8,baseTime:50,baseEnergy:650,energyPerOre:1200000,price:180},
{id:"energy-ore",name:"エネルギー鉱石",symbol:"En",material:"エネルギーインゴット",rarity:1,baseTime:1800,energyPerOre:1e109,price:0,special:true,batchSize:10,outputId:"energy-ingot",image:"assets/ores/energy-ore.svg",materialImage:"assets/alloys/special.svg",sellable:false},
{id:"energy-ingot-refining",name:"エネルギーインゴット",symbol:"En",material:"高純度エネルギーインゴット",rarity:1,baseTime:1800,energyPerOre:1e114,price:0,special:true,batchSize:10,outputId:"high-purity-energy-ingot",image:"assets/alloys/special.svg",materialImage:"assets/alloys/special.svg",inputType:"material",inputId:"energy-ingot",sellable:false}
];
const FURNACE_UPGRADES=[
{id:"parallel",name:"並列処理",max:4,factor:1,effect:lv=>"同一鉱石を最大"+(lv+1)+"枠で同時精錬"},
{id:"speed",name:"高速精錬",max:10,factor:1.25,effect:lv=>"精錬時間 "+Math.round((1-1/(1+lv*.08))*100)+"%短縮"},
{id:"efficiency",name:"省エネ精錬",max:10,factor:1.5,effect:lv=>"エネルギー消費 "+Math.round((1-1/(1+lv*.08))*100)+"%軽減"},
{id:"purity",name:"高純度精錬",max:10,factor:1.75,effect:lv=>"素材獲得量 "+Math.round(lv*3)+"%増加"}
];
const UPGRADE_GEMS={parallel:"emerald",speed:"sapphire",efficiency:"amethyst",purity:"topaz"};
const UPGRADE_ALLOYS={parallel:"emerald-alloy",speed:"sapphire-alloy",efficiency:"amethyst-alloy",purity:"topaz-alloy"};
const $=s=>document.querySelector(s);
const fmt=n=>{if(!Number.isFinite(n))return "∞";if(Math.abs(n)<1e6)return Math.floor(n).toLocaleString("ja-JP");const units=["M","B","T","Qa","Qi"];let v=n/1e6,i=0;while(v>=10000&&i<units.length-1){v/=1000;i++;}return v>=10000?v.toExponential(2):Number(v.toFixed(v<100?2:1))+units[i];};
const fresh=()=>({furnaces:Object.fromEntries(ORES.map(o=>[o.id,{auto:!o.special,active:[],purityRemainder:0,upgrades:{parallel:0,speed:0,efficiency:0,purity:0}}])),materials:Object.fromEntries(ORES.map(o=>[o.outputId||o.id,0])),alloys:{},storageLevel:1,autoSell:{enabled:false,material:"all",keep:10},lastTick:Date.now()});
function loadRoot(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))||{};}catch{return {};}}
let root=loadRoot(),mining=root.miningV2||{},smelt={...fresh(),...(mining.smelting||{})};
smelt.furnaces={...fresh().furnaces,...(smelt.furnaces||{})};smelt.materials={...fresh().materials,...(smelt.materials||{})};smelt.autoSell={...fresh().autoSell,...(smelt.autoSell||{})};smelt.alloys={...(smelt.alloys||{})};
for(const o of ORES){const old=smelt.furnaces[o.id]||{};const jobs=Array.isArray(old.active)?old.active:(old.active?[old.active]:[]);smelt.furnaces[o.id]={auto:o.special?false:old.auto!==false,active:jobs,upgrades:{parallel:0,speed:0,efficiency:0,purity:0,...(old.upgrades||{})}};}
const oreCount=id=>{const o=ORES.find(x=>x.id===id);return Math.max(0,Number(o?.inputType==="material"?smelt.materials?.[o.inputId]:mining.ores?.[id])||0);};
const energy=()=>Math.max(0,Number(root.energy)||0);
const credits=()=>Math.max(0,Number(mining.credits)||0);
const storageUsed=()=>Object.values(smelt.materials).reduce((a,b)=>a+(Number(b)||0),0);
const capacity=()=>smelt.storageLevel>=10?Infinity:250*Math.pow(2,smelt.storageLevel-1);
const COST_MULTIPLIER=3;
const upgradeLevel=(f,id)=>Math.max(0,Math.floor(Number(f.upgrades?.[id])||0));
const parallelSlots=f=>1+Math.min(4,upgradeLevel(f,"parallel"));
const upgradeCost=(f,o,u)=>{const lv=upgradeLevel(f,u.id);return {gem:UPGRADE_GEMS[u.id],gemAmount:Math.ceil((2+lv)*u.factor),alloy:UPGRADE_ALLOYS[u.id],alloyAmount:1+Math.floor(lv/3)};};
const onlineCount=()=>Math.max(0,Number(window.__iw2OnlineCount)||0);
const smeltingSpeed=()=>1+Math.min(10,onlineCount()*0.5)/100;
const furnaceTime=(o,f)=>o.special?o.baseTime:Math.max(2,o.baseTime*o.rarity/(1+upgradeLevel(f,"speed")*.08));
const furnaceEnergy=(o,f,n)=>Math.max(1,o.energyPerOre*n/(o.special?1:(1+upgradeLevel(f,"efficiency")*.08)));
const batchSize=f=>{const o=ORES.find(x=>smelt.furnaces[x.id]===f);return o?.batchSize||5;};
const outputPreview=(f,n)=>{const o=ORES.find(x=>smelt.furnaces[x.id]===f);return o?.special?1:Math.max(1,Math.floor(n*(1+upgradeLevel(f,"purity")*.03)+(Number(f.purityRemainder)||0)));};
const outputAmount=(f,n)=>{const o=ORES.find(x=>smelt.furnaces[x.id]===f);if(o?.special)return 1;const exact=n*(1+upgradeLevel(f,"purity")*.03)+(Number(f.purityRemainder)||0),amount=Math.max(1,Math.floor(exact));f.purityRemainder=exact-amount;return amount;};
// インゴット価格は採掘ページの鉱石売却価格と同じ基準で算出し、精錬の付加価値として3倍にする。
const INGOT_PRICE_MULTIPLIER=3;
const ORE_PRICE_BASE={copper:2,iron:4,silver:12,tin:7,gold:35,zinc:10,nickel:55,mithril:120,void:600,chromium:90,tungsten:180};
const ORE_RARITY_MULTIPLIER={copper:1,iron:1,silver:1.75,tin:1.75,gold:2.5,zinc:1.75,nickel:2.5,mithril:3.25,void:4,chromium:3.25,tungsten:3.25};
const ingotSellPrice=o=>(ORE_PRICE_BASE[o.id]||o.price)*(ORE_RARITY_MULTIPLIER[o.id]||1)*(1+(Math.max(1,Number(mining.depth)||1))*.04)*INGOT_PRICE_MULTIPLIER;
function save(){root.energy=Math.max(0,Number(root.energy)||0);smelt.lastTick=Date.now();root.miningV2={...(root.miningV2||{}),...mining,smelting:{...smelt,lastTick:smelt.lastTick}};localStorage.setItem(SAVE_KEY,JSON.stringify(root));mining=root.miningV2;}
function say(s){$("#smelting-feedback").textContent=s;}
function begin(id,speed=smeltingSpeed(),quiet=false){
 const o=ORES.find(x=>x.id===id),f=smelt.furnaces[id];if(!o)return false;
 if(!Array.isArray(f.active))f.active=f.active?[f.active]:[];
 if(f.active.length>=parallelSlots(f))return false;
 const n=Math.min(batchSize(f),oreCount(id));if(n<1||(o.special&&n<batchSize(f)))return false;
 const cost=furnaceEnergy(o,f,n);if(energy()<cost||capacity()-storageUsed()<1)return false;
 root.energy-=cost;if(o.inputType==="material")smelt.materials[o.inputId]=Math.max(0,(Number(smelt.materials[o.inputId])||0)-n);else mining.ores[id]=Math.max(0,(Number(mining.ores[id])||0)-n);
 const effectiveTime=furnaceTime(o,f)/(o.special?1:Math.max(.001,speed));
 f.active.push({total:effectiveTime,remaining:effectiveTime,input:n,output:outputAmount(f,n),blocked:false});
 if(!quiet)say(o.name+"の精錬を開始した！");return true;
}function start(id){if(begin(id,smeltingSpeed())){save();render();}else{const o=ORES.find(x=>x.id===id),f=smelt.furnaces[id];if(o&&(f.active||[]).length<parallelSlots(f)){if(oreCount(id)<1)say(o.name+"が足りないため精錬できない。");else if(energy()<furnaceEnergy(o,f,Math.min(batchSize(f),oreCount(id))))say("エネルギーが不足している。");else if(capacity()-storageUsed()<1)say("精錬素材倉庫が満杯！倉庫を強化するか素材を売却しよう。");}}}
function finish(id,job,quiet=false){
 const f=smelt.furnaces[id],o=ORES.find(x=>x.id===id);if(!o)return false;if(!Array.isArray(f.active))f.active=f.active?[f.active]:[];
 const target=job||f.active[0];if(!target)return false;
 if(capacity()-storageUsed()<target.output){target.blocked=true;return false;}
 smelt.materials[o.outputId||id]=(Number(smelt.materials[o.outputId||id])||0)+target.output;
 const amount=target.output,index=f.active.indexOf(target);if(index>=0)f.active.splice(index,1);
 if(!quiet)say(ORES.find(o=>o.id===id).material+"を"+fmt(amount)+"個獲得！");return true;
}
function advanceProduction(seconds,speed=1,quiet=true){
 let progressLeft=Math.max(0,seconds)*Math.max(.001,speed),completed=0,guard=0;
 while(progressLeft>0.000001&&guard++<50000){
  for(const o of ORES){const f=smelt.furnaces[o.id];for(const job of [...(f.active||[])])if(job.blocked&&capacity()-storageUsed()>=job.output){if(finish(o.id,job,quiet))completed++;}}
  runAutoSell();
  for(const o of ORES){const f=smelt.furnaces[o.id];while(f.auto&&(f.active||[]).length<parallelSlots(f)){if(!begin(o.id,speed,true))break;}}
  let next=Infinity;
  for(const o of ORES)for(const job of smelt.furnaces[o.id].active||[])if(!job.blocked)next=Math.min(next,Math.max(0,job.remaining));
  if(!Number.isFinite(next))break;
  const step=Math.min(progressLeft,next);
  if(step<=0.000001){
   let didFinish=false;
   for(const o of ORES)for(const job of [...(smelt.furnaces[o.id].active||[])])if(!job.blocked&&job.remaining<=0.000001){if(finish(o.id,job,quiet)){completed++;didFinish=true;}}
   if(!didFinish)break;continue;
  }
  for(const o of ORES)for(const job of smelt.furnaces[o.id].active||[])if(!job.blocked)job.remaining=Math.max(0,job.remaining-step);
  progressLeft-=step;
  for(const o of ORES)for(const job of [...(smelt.furnaces[o.id].active||[])])if(!job.blocked&&job.remaining<=0.000001){if(finish(o.id,job,quiet))completed++;}
  runAutoSell();
 }
 return completed;
}
function tick(){advanceProduction(1,smeltingSpeed(),true);runAutoSell();save();render();}
function runAutoSell(){if(!smelt.autoSell.enabled)return;for(const o of ORES){if(o.special)continue;if(smelt.autoSell.material!=="all"&&smelt.autoSell.material!==o.id)continue;const excess=Math.max(0,(smelt.materials[o.id]||0)-Math.max(0,Number(smelt.autoSell.keep)||0));if(excess>0)sell(o.id,excess);}}
function sell(id,n){const o=ORES.find(x=>x.id===id);if(!o||o.special)return 0;const amount=Math.max(0,Math.min(Number(smelt.materials[id])||0,Math.floor(Number(n)||0)));if(!amount)return 0;smelt.materials[id]-=amount;const unitPrice=ingotSellPrice(o);mining.credits=(Number(mining.credits)||0)+amount*unitPrice;return amount*unitPrice;}
function upgradeFurnace(id,upgradeId){
 const f=smelt.furnaces[id],u=FURNACE_UPGRADES.find(x=>x.id===upgradeId),o=ORES.find(x=>x.id===id);if(!f||!u||o?.special)return;
 const lv=upgradeLevel(f,u.id);if(lv>=u.max)return;
 const cost=upgradeCost(f,ORES.find(x=>x.id===id),u),alloys=smelt.alloys||{};
 if((Number(mining.gems?.[cost.gem])||0)<cost.gemAmount||(Number(alloys[cost.alloy])||0)<cost.alloyAmount){say("強化に必要な"+cost.gem+"または対応する宝石合金が足りない。");return;}
 mining.gems[cost.gem]-=cost.gemAmount;alloys[cost.alloy]-=cost.alloyAmount;f.upgrades[u.id]=lv+1;
 save();render();say(ORES.find(o=>o.id===id).name+"の"+u.name+"をLv."+f.upgrades[u.id]+"に強化した！");
}
function renderFurnaces(){
 const el=$("#furnace-list");if(!el)return;
 const oldImages=[...el.querySelectorAll(".furnace-symbol img")];
 const oldProgress=new Map([...el.querySelectorAll(".furnace-progress > span[data-progress]")].map(node=>[node.dataset.progress,node]));
 el.innerHTML=ORES.map(o=>{
  const f=smelt.furnaces[o.id]||fresh().furnaces[o.id],owned=oreCount(o.id),jobs=f.active||[],slots=parallelSlots(f),active=jobs.length>0;
  const progress=jobs.map((job,i)=>'<div class="furnace-progress"><span data-progress="'+o.id+':'+i+'" style="width:'+Math.min(100,100*(1-job.remaining/job.total))+'%"></span></div><div class="furnace-subtext">処理 '+(i+1)+' / '+jobs.length+' · 残り '+fmt(Math.ceil(job.remaining))+' 秒</div>').join("");
  const alloyNames={bronze:"青銅",brass:"真鍮",orichalcum:"オリハルコン",adamantite:"アダマンタイト","abyssal-alloy":"深淵合金","astral-steel":"星鋼","singularity-alloy":"特異点合金","emerald-alloy":"翠緑合金","sapphire-alloy":"蒼輝合金","amethyst-alloy":"紫晶合金","topaz-alloy":"黄金晶合金"};
  const gemNames={emerald:"エメラルド",sapphire:"サファイア",amethyst:"アメジスト",topaz:"トパーズ"};
  const upgrades=o.special?"":FURNACE_UPGRADES.map(u=>{
   const lv=upgradeLevel(f,u.id),cost=upgradeCost(f,o,u),gemOwned=Number(mining.gems?.[cost.gem])||0,alloyOwned=Number(smelt.alloys?.[cost.alloy])||0,done=lv>=u.max;
   return '<button class="buy-button secondary" data-upgrade="'+o.id+':'+u.id+'" '+(done||gemOwned<cost.gemAmount||alloyOwned<cost.alloyAmount?'disabled':'')+'>'+u.name+' Lv.'+lv+'<small>'+(done?'MAX':(gemNames[cost.gem]||cost.gem)+' ×'+fmt(cost.gemAmount)+' / '+(alloyNames[cost.alloy]||cost.alloy)+' ×'+cost.alloyAmount)+'</small><small>'+u.effect(lv)+'</small></button>';
  }).join("");
  return '<article class="furnace-card"><div class="furnace-head"><div class="furnace-title"><span class="furnace-symbol"><img data-preserve-src="'+(o.image||("assets/ores/"+o.id+".svg"))+'" alt="'+o.name+'"></span><div><strong>'+(o.special?o.name+"加工枠":o.name+"専用精錬炉")+'</strong><small>並列 '+jobs.length+' / '+slots+' 枠 · 保有素材 '+fmt(owned)+'</small></div></div><span class="furnace-owned">'+(active?'精錬中':'待機中')+'</span></div><div class="furnace-stats"><div><span>一度の処理量 / 枠</span><strong>'+fmt(batchSize(f))+' 個</strong></div><div><span>精錬時間 / 枠</span><strong>'+Number(furnaceTime(o,f)/(o.special?1:smeltingSpeed())).toFixed(1)+' 秒</strong></div><div><span>必要エネルギー / 枠</span><strong>'+fmt(furnaceEnergy(o,f,batchSize(f)))+'</strong><small>1個あたり '+fmt(furnaceEnergy(o,f,1))+'</small></div><div><span>素材獲得量 / 枠</span><strong>'+fmt(outputPreview(f,batchSize(f)))+' 個</strong></div></div>'+(active?progress:'<div class="furnace-subtext">精錬後は「'+o.material+'」として素材倉庫に格納。</div>')+'<div class="furnace-actions"><button class="buy-button" data-start="'+o.id+'" '+(jobs.length>=slots||owned<(o.special?batchSize(f):1)||energy()<furnaceEnergy(o,f,Math.min(batchSize(f),owned))||storageUsed()>=capacity()?'disabled':'')+'>'+(o.special?"加工を開始":"精錬を開始")+'</button>'+(o.special?"":'<label><input type="checkbox" data-auto="'+o.id+'" '+(f.auto?'checked':'')+'> 自動精錬</label>')</div><div class="furnace-actions">'+upgrades+'</div></article>';
 }).join("");
 el.querySelectorAll('img[data-preserve-src]').forEach((img,i)=>{if(oldImages[i])img.replaceWith(oldImages[i]);else{img.src=img.dataset.preserveSrc;img.removeAttribute('data-preserve-src');}});
 el.querySelectorAll('.furnace-progress > span[data-progress]').forEach(node=>{const previous=oldProgress.get(node.dataset.progress);if(previous){previous.style.width=node.style.width;node.replaceWith(previous);}});
}
function render(){root=loadRoot();mining=root.miningV2||mining;smelt={...fresh(),...(mining.smelting||smelt)};smelt.furnaces=smelt.furnaces&&typeof smelt.furnaces==="object"?smelt.furnaces:{};for(const o of ORES){const d=fresh().furnaces[o.id],saved=smelt.furnaces[o.id]||{};const jobs=Array.isArray(saved.active)?saved.active:(saved.active?[saved.active]:[]);smelt.furnaces[o.id]={auto:o.special?false:saved.auto!==false,active:jobs,purityRemainder:Math.max(0,Number(saved.purityRemainder)||0),upgrades:{...d.upgrades,...(saved.upgrades||{})}};}$("#energy-balance").textContent=fmt(energy());$("#credit-balance").textContent=fmt(credits())+" CR";$("#material-total").textContent=fmt(storageUsed());const cap=capacity();$("#material-capacity").textContent=cap===Infinity?"∞":fmt(cap);$("#material-storage-level").textContent="Lv."+smelt.storageLevel;$("#material-storage-cost").textContent=smelt.storageLevel>=10?"MAX":fmt(COST_MULTIPLIER*100*Math.pow(1.8,smelt.storageLevel-1))+" CR";$("#material-storage-upgrade").disabled=smelt.storageLevel>=10||credits()<COST_MULTIPLIER*100*Math.pow(1.8,smelt.storageLevel-1);renderFurnaces();const materialList=$("#material-list"),oldIngotImages=[...materialList.querySelectorAll(".material-card-head img")];materialList.innerHTML=ORES.map(o=>{const id=o.outputId||o.id;return '<article class="material-card"><div class="material-card-head"><img data-preserve-src="'+(o.materialImage||("assets/ingots/"+o.id+".svg"))+'" alt="'+o.material+'"><strong>'+o.material+'</strong></div><span>'+fmt(smelt.materials[id]||0)+' 個</span><small>'+(o.special?"エネルギー加工ライン · 売却不可":"対応鉱石："+o.name+" · 売却 "+fmt(ingotSellPrice(o))+" CR / 個（鉱石の3倍）")+"</small></article>";}).join("");materialList.querySelectorAll("img[data-preserve-src]").forEach((img,i)=>{if(oldIngotImages[i])img.replaceWith(oldIngotImages[i]);else{img.src=img.dataset.preserveSrc;img.removeAttribute('data-preserve-src');}});const selectedSellMaterial=$("#sell-material").value;$("#sell-material").innerHTML=ORES.filter(o=>!o.special).map(o=>'<option value="'+o.id+'">'+o.material+'</option>').join("");if(ORES.some(o=>o.id===selectedSellMaterial&&!o.special))$("#sell-material").value=selectedSellMaterial;if(!window.__smeltControls){$("#auto-sell-material").innerHTML='<option value="all">すべて</option>'+ORES.filter(o=>!o.special).map(o=>'<option value="'+o.id+'">'+o.material+'</option>').join("");$("#auto-sell-enabled").checked=smelt.autoSell.enabled;$("#auto-sell-material").value=smelt.autoSell.material;$("#auto-sell-keep").value=smelt.autoSell.keep;window.__smeltControls=true;}$("#sell-selected").disabled=!(smelt.materials[$("#sell-material").value]>0);$("#sell-all").disabled=!(smelt.materials[$("#sell-material").value]>0);$("#sell-bulk").disabled=storageUsed()<=0;}
$("#furnace-list").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.start)start(b.dataset.start);if(b.dataset.upgrade){const [id,upgrade]=b.dataset.upgrade.split(":");upgradeFurnace(id,upgrade);}});
$("#furnace-list").addEventListener("change",e=>{if(e.target.dataset.auto){smelt.furnaces[e.target.dataset.auto].auto=e.target.checked;save();}});
$("#material-storage-upgrade").addEventListener("click",()=>{const cost=COST_MULTIPLIER*100*Math.pow(1.8,smelt.storageLevel-1);if(smelt.storageLevel>=10||credits()<cost)return;mining.credits-=cost;smelt.storageLevel++;save();render();say("精錬素材倉庫を強化した！");});
$("#sell-selected").addEventListener("click",()=>{const id=$("#sell-material").value,earned=sell(id,Number($("#sell-amount").value));$("#sell-feedback").textContent=earned?fmt(earned)+" CRを獲得！":"売却できる素材がない。";save();render();});
$("#sell-all").addEventListener("click",()=>{const id=$("#sell-material").value,earned=sell(id,smelt.materials[id]);$("#sell-feedback").textContent=earned?fmt(earned)+" CRを獲得！":"売却できる素材がない。";save();render();});
$("#sell-bulk").addEventListener("click",()=>{let total=0;for(const o of ORES)if(!o.special)total+=sell(o.id,smelt.materials[o.id]);$("#sell-feedback").textContent=total?fmt(total)+" CRを獲得！":"売却できる素材がない。";save();render();});
$("#save-auto-sell").addEventListener("click",()=>{smelt.autoSell={enabled:$("#auto-sell-enabled").checked,material:$("#auto-sell-material").value,keep:Math.max(0,Number($("#auto-sell-keep").value)||0)};save();say("自動売却設定を保存した。");});
const offlineNow=Date.now(),last=Number(smelt.lastTick)||offlineNow,offlineSeconds=Math.min(8*60*60,Math.max(0,(offlineNow-last)/1000)),offlineCompleted=advanceProduction(offlineSeconds,1,true);runAutoSell();save();render();if(offlineSeconds>=2&&offlineCompleted>0)say("オフライン中に精錬が進行！ "+fmt(offlineCompleted)+" 回分の精錬が完了した。");function animateProgress(){const now=Date.now(),elapsed=Math.max(0,(now-(Number(smelt.lastTick)||now))/1000);for(const o of ORES){(smelt.furnaces[o.id]?.active||[]).forEach((active,i)=>{if(active.blocked)return;const bar=document.querySelector('.furnace-progress [data-progress="'+o.id+':'+i+'"]');if(!bar)return;const remaining=Math.max(0,active.remaining-elapsed*smeltingSpeed());bar.style.width=Math.min(100,Math.max(0,100*(1-remaining/Math.max(.001,active.total))))+"%";});}requestAnimationFrame(animateProgress);}requestAnimationFrame(animateProgress);setInterval(tick,1000);function catchUpOffline(){const now=Date.now(),last=Number(smelt.lastTick)||now,elapsed=Math.min(8*60*60,Math.max(0,(now-last)/1000));if(elapsed>1.5){const completed=advanceProduction(elapsed,1,true);runAutoSell();save();render();if(completed>0)say("オフライン中に精錬が進行！ "+fmt(completed)+" 回分の精錬が完了した。");}}window.addEventListener("focus",catchUpOffline);window.addEventListener("pageshow",catchUpOffline);document.addEventListener("visibilitychange",()=>{if(!document.hidden)catchUpOffline();});window.addEventListener("storage",event=>{if(event.key===SAVE_KEY){root=loadRoot();mining=root.miningV2||{};render();}});
if("BroadcastChannel" in window){const energyChannel=new BroadcastChannel("infinity-works-2-energy");energyChannel.addEventListener("message",event=>{if(Number.isFinite(Number(event.data?.energy))){root.energy=Math.max(0,Number(event.data.energy));$("#energy-balance").textContent=fmt(root.energy);}});}
window.addEventListener("pagehide",save);
