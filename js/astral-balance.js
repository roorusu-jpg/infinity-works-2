export const ASTRAL_BALANCE_VERSION=3;
export const ASTRAL_COST_MULTIPLIER=100;

const oldCostAt=(tier,branch)=>Math.ceil(1.35**tier*(1+branch*.35));
const previousNodeCost=(tier,branch)=>tier<=40
 ? Math.ceil(1.10**tier*(1+branch*.25)*2)
 : Math.ceil(1.10**40*(1+branch*.25)*2*1000*Math.pow(1.18,tier-40));
function previousOwnedCost(id){
 let m=id.match(/^astral-(creation|matter|spacetime|astral|transcendence)-(\d+)$/);
 if(m){const branch=["creation","matter","spacetime","astral","transcendence"].indexOf(m[1]),tier=Number(m[2]);return tier>=1&&tier<=60?previousNodeCost(tier,branch):null;}
 m=id.match(/^astral-link-(\d+)-(\d+)$/);
 if(m){const branch=Number(m[1]),tier=Number(m[2]);return branch>=0&&branch<5&&[8,16,24,32,40,50,60].includes(tier)?Math.ceil(previousNodeCost(tier,branch)*(tier<=40?2.2:3.5)):null;}
 if(id==="astral-final-core")return 50000000;
 return null;
}
export function migrateAstralBalance(state){
 if(!state)return {state,changed:false,refund:0};
 let changed=false,refund=0;
 let version=Math.max(0,Number(state.astralBalanceVersion)||0);
 if(version<1){
  const ids=Array.isArray(state.astralSkills)?state.astralSkills:[];
  let oldSpent=0;
  for(const id of ids){
   let m=id.match(/^astral-(creation|matter|spacetime|astral|transcendence)-(\d+)$/);
   if(m){const branch=["creation","matter","spacetime","astral","transcendence"].indexOf(m[1]),tier=Number(m[2]);if(tier>=1&&tier<=40)oldSpent+=oldCostAt(tier,branch);continue;}
   m=id.match(/^astral-link-(\d+)-(\d+)$/);
   if(m){const branch=Number(m[1]),tier=Number(m[2]);if(branch>=0&&branch<5&&[8,16,24,32,40].includes(tier))oldSpent+=Math.ceil(oldCostAt(tier,branch)*2.5);continue;}
   if(id==="astral-final-core")oldSpent+=1000000;
  }
  refund=oldSpent*.8;
  state.ap=Math.max(0,Number(state.ap)||0)+refund;
  state.astralSkills=[];
  state.astralBalanceVersion=1;
  version=1;
  changed=true;
 }
 if(version<2){
  const compress=value=>{const n=Math.max(0,Number(value)||0);return Number.isFinite(n)?Math.log10(1+n)*100:30800;};
  state.ap=compress(state.ap);
  state.totalAP=compress(state.totalAP??state.ap);
  state.astralBalanceVersion=2;
  version=2;
  changed=true;
 }
 if(version<3){
  const savedCosts={...(state.astralSkillCosts||{})};
  for(const id of Array.isArray(state.astralSkills)?state.astralSkills:[]){
   if(!Number.isFinite(Number(savedCosts[id]))){const cost=previousOwnedCost(id);if(cost!==null)savedCosts[id]=cost;}
  }
  state.astralSkillCosts=savedCosts;
  state.astralBalanceVersion=3;
  changed=true;
 }
 if((Number(state.apBalanceVersion)||0)<1){
  state.totalAP=Math.max(0,Number(state.totalAP)||Number(state.ap)||0);
  state.ap=0;
  state.apLifetimeEnergy=Math.max(0,Number(state.lifetime)||0);
  state.apBalanceVersion=1;
  changed=true;
 }else if(!Number.isFinite(Number(state.apLifetimeEnergy))){
  state.apLifetimeEnergy=Math.max(0,Number(state.lifetime)||0);
  changed=true;
 }
 return {state,changed,refund};
}

export function astralNodeCost(tier,branch){
 const base=tier<=40?Math.ceil(1.10**tier*(1+branch*.25)*2):Math.ceil(1.10**40*(1+branch*.25)*2*1000*Math.pow(1.18,tier-40));
 return Math.ceil(base*ASTRAL_COST_MULTIPLIER);
}
export function astralLinkCost(tier,branch){
 return Math.ceil(astralNodeCost(tier,branch)*(tier<=40?2.2:3.5));
}
const tierRate=(min,max,tier,start=1,end=40)=>{
 const t=Math.max(start,Math.min(end,Number(tier)||start));
 return min+(max-min)*(t-start)/(end-start);
};
export function astralTreeEffects(skills){
 const owned=Array.isArray(skills)?skills:[];
 const multiply=(prefix,min,max,start=1,end=40)=>owned.reduce((value,id)=>{
  const match=id.match(new RegExp("^"+prefix+"(\\d+)$"));
  if(!match)return value;
  return value*(1+tierRate(min,max,Number(match[1]),start,end));
 },1);
 const creation=multiply("astral-creation-",.005,.015);
 const matter=multiply("astral-matter-",.005,.015);
 const spacetime=multiply("astral-spacetime-",.01,.025);
 const astral=multiply("astral-astral-",.005,.015);
 const transcendence=multiply("astral-transcendence-",.0025,.005);
 const links=multiply("astral-link-\\d+-",.0025,.005,8,40);
 const costReduction=owned.reduce((value,id)=>{
  const match=id.match(/^astral-(creation|matter)-(\d+)$/);
  if(!match)return value;
  return value*(1-tierRate(.001,.0025,Number(match[2])));
 },1);
 const layer2=(prefix,min,max)=>owned.reduce((value,id)=>{const m=id.match(new RegExp("^"+prefix+"(4[1-9]|5[0-9]|60)$"));if(!m)return value;const t=Number(m[1])-40;return value*(1+min+(max-min)*(t-1)/19);},1);
 const creation2=layer2("astral-creation-",.02,.04),matter2=layer2("astral-matter-",.02,.04),spacetime2=layer2("astral-spacetime-",.035,.07),astral2=layer2("astral-astral-",.02,.04),transcendence2=layer2("astral-transcendence-",.01,.025);
 const final=owned.includes("astral-final-core")?1.05:1;
 return {
  production:creation*creation2*transcendence*transcendence2*links*final,
  click:matter*matter2*transcendence*transcendence2*final,
  cost:costReduction,
  offline:spacetime*spacetime2*transcendence*transcendence2*final,
  apGain:astral*astral2*transcendence*transcendence2*links*final
 };
}
