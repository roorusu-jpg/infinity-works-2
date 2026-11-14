(()=>{"use strict";
const KEY="infinity-works-2-save-v1";
const RECIPES=[
{id:"bronze",name:"青銅",kind:"実在合金",desc:"銅と錫の合金",parts:{copper:3,tin:1}},
{id:"brass",name:"真鍮",kind:"実在合金",desc:"銅と亜鉛の合金",parts:{copper:3,zinc:1}},
{id:"electrum",name:"エレクトラム",kind:"実在合金",desc:"金と銀の天然合金をイメージ",parts:{gold:1,silver:1}},
{id:"rose-gold",name:"ローズゴールド",kind:"実在合金",desc:"金75%・銅25%の18K相当レシピ",parts:{gold:3,copper:1}},
{id:"sterling-silver",name:"スターリングシルバー",kind:"実在合金",desc:"銀約92.3%・銅約7.7%の近似レシピ",parts:{silver:12,copper:1}},
{id:"nickel-silver",name:"洋白",kind:"実在合金",desc:"銅・ニッケル・亜鉛の合金（銀は含まない）",parts:{copper:3,nickel:1,zinc:1}},
{id:"stainless-steel",name:"ステンレス鋼",kind:"実在合金",desc:"鉄・クロム・ニッケルのゲーム用簡略比率",parts:{iron:7,chromium:2,nickel:1}},
{id:"nichrome",name:"ニクロム",kind:"実在合金",desc:"ニッケル80%・クロム20%相当",parts:{nickel:4,chromium:1}},
{id:"tungsten-steel",name:"タングステン鋼",kind:"実在合金",desc:"鉄とタングステンを使う簡略レシピ",parts:{iron:4,tungsten:1}},
{id:"mithril-steel",name:"ミスリル鋼",kind:"ゲームオリジナル",desc:"鉄にミスリルを融合した特殊合金",parts:{iron:2,mithril:1}},
{id:"void-alloy",name:"ヴォイド合金",kind:"ゲームオリジナル",desc:"ミスリルと虚無素材から生まれる超希少合金",parts:{mithril:2,void:1}}
];
const labels={copper:"銅",iron:"鉄",silver:"銀",tin:"錫",gold:"金",zinc:"亜鉛",nickel:"ニッケル",chromium:"クロム",tungsten:"タングステン",mithril:"ミスリル",void:"虚無"};
const $=s=>document.querySelector(s),fmt=n=>Math.floor(n).toLocaleString("ja-JP");
function state(){const r=JSON.parse(localStorage.getItem(KEY)||"{}"),m=r.miningV2||(r.miningV2={}),s=m.smelting||(m.smelting={});s.materials=s.materials||{};s.alloys=s.alloys||{};s.alloyDiscovered=Array.isArray(s.alloyDiscovered)?s.alloyDiscovered:[];s.alloyTotalCrafted=s.alloyTotalCrafted||{};return {r,m,s};}
const owned=(s,id)=>Math.max(0,Number(s.materials[id])||0);
const base={copper:2,iron:4,silver:12,tin:7,gold:35,zinc:10,nickel:55,mithril:120,void:600,chromium:90,tungsten:180};
const rarity={copper:1,iron:1,silver:1.75,tin:1.75,gold:2.5,zinc:1.75,nickel:2.5,mithril:3.25,void:4,chromium:3.25,tungsten:3.25};
function price(id,m){return (base[id]||1)*(rarity[id]||1)*(1+Math.max(1,Number(m.depth)||1)*.04)*3;}
function maxMake(s,a){return Math.max(0,...[0].slice(1),Math.min(...Object.entries(a.parts).map(([id,q])=>Math.floor(owned(s,id)/q))));}
function unitPrice(a,m){return Math.floor(Object.entries(a.parts).reduce((sum,[id,q])=>sum+price(id,m)*q,0)*1.2);}
let selected="bronze",quantity=1;
function say(t){$("#alloy-feedback").textContent=t;}
function render(){const {s,m}=state(),a=RECIPES.find(x=>x.id===selected),max=maxMake(s,a);
$("#alloy-list").innerHTML=RECIPES.map(x=>'<button type="button" class="alloy-choice '+(x.id===selected?'is-selected':'')+'" data-alloy="'+x.id+'"><img src="assets/alloys/'+x.id+'.svg" alt=""><span><b>'+(s.alloyDiscovered.includes(x.id)?x.name:"？？？")+'</b><small>'+(s.alloyDiscovered.includes(x.id)?x.kind:"未発見")+'</small></span><strong>'+(Number(s.alloys[x.id])||0)+'</strong></button>').join("");
$("#alloy-name").textContent=a.name;$("#alloy-kind").textContent=a.kind;$("#alloy-description").textContent=a.desc;$("#alloy-recipe").textContent=Object.entries(a.parts).map(([id,n])=>labels[id]+"×"+n).join(" + ");$("#alloy-image").src="assets/alloys/"+a.id+".svg";$("#alloy-owned").textContent=fmt(Number(s.alloys[a.id])||0);$("#alloy-max").textContent=fmt(max);$("#alloy-unit-price").textContent=fmt(unitPrice(a,m))+" CR";
$("#alloy-recipe-materials").innerHTML=Object.entries(a.parts).map(([id,n])=>'<div><span>'+labels[id]+' × '+fmt(n*quantity)+'</span><b>所持 '+fmt(owned(s,id))+'</b></div>').join("");
$("#alloy-quantity").value=quantity;$("#alloy-make").disabled=max<quantity;$("#alloy-sell-quantity").max=Number(s.alloys[a.id])||0;$("#alloy-sell").disabled=!(s.alloys[a.id]>0);$("#alloy-codex-count").textContent=s.alloyDiscovered.length+" / "+RECIPES.length+" 発見";$("#alloy-crafted-count").textContent=fmt(Object.values(s.alloyTotalCrafted).reduce((x,y)=>x+(Number(y)||0),0))+" 個製造";}
function make(){const {r,m,s}=state(),a=RECIPES.find(x=>x.id===selected),max=maxMake(s,a),n=Math.max(0,Math.min(max,Math.floor(quantity)));if(!n){say("必要なインゴットが足りないよ。");return;}for(const [id,q] of Object.entries(a.parts))s.materials[id]=owned(s,id)-q*n;s.alloys[a.id]=(Number(s.alloys[a.id])||0)+n;s.alloyTotalCrafted[a.id]=(Number(s.alloyTotalCrafted[a.id])||0)+n;if(!s.alloyDiscovered.includes(a.id))s.alloyDiscovered.push(a.id);localStorage.setItem(KEY,JSON.stringify(r));say(a.name+"を"+fmt(n)+"個製造！図鑑に登録したよ。");render();}
function sell(){const {r,m,s}=state(),a=RECIPES.find(x=>x.id===selected),n=Math.max(0,Math.min(Number(s.alloys[a.id])||0,Math.floor(Number($("#alloy-sell-quantity").value)||0)));if(!n){say("売却できる合金がないよ。");return;}const earned=n*unitPrice(a,m);s.alloys[a.id]-=n;m.credits=(Number(m.credits)||0)+earned;localStorage.setItem(KEY,JSON.stringify(r));say(a.name+"を"+fmt(n)+"個売却！ "+fmt(earned)+" CRを獲得。");render();}
$("#alloy-list").addEventListener("click",e=>{const b=e.target.closest("[data-alloy]");if(!b)return;selected=b.dataset.alloy;quantity=1;render();});
$("#alloy-quantity").addEventListener("input",e=>{quantity=Math.max(1,Math.floor(Number(e.target.value)||1));const {s}=state(),a=RECIPES.find(x=>x.id===selected);$("#alloy-make").disabled=maxMake(s,a)<quantity;$("#alloy-recipe-materials").innerHTML=Object.entries(a.parts).map(([id,n])=>'<div><span>'+labels[id]+' × '+fmt(n*quantity)+'</span><b>所持 '+fmt(owned(s,id))+'</b></div>').join("");});
document.querySelectorAll("[data-alloy-amount]").forEach(b=>b.addEventListener("click",()=>{const {s}=state(),a=RECIPES.find(x=>x.id===selected);quantity=b.dataset.alloyAmount==="max"?Math.max(1,maxMake(s,a)):Number(b.dataset.alloyAmount);$("#alloy-quantity").value=quantity;$("#alloy-quantity").dispatchEvent(new Event("input"));}));
$("#alloy-make").addEventListener("click",make);$("#alloy-sell").addEventListener("click",sell);render();
})();