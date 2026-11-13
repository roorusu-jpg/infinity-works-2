export const ASTRAL_BALANCE_VERSION=2;

const oldCostAt=(tier,branch)=>Math.ceil(1.35**tier*(1+branch*.35));
export function migrateAstralBalance(state){
 if(!state)return {state,changed:false,refund:0};
 if(Number(state.astralBalanceVersion)>=ASTRAL_BALANCE_VERSION)return {state,changed:false,refund:0};
 let changed=false,refund=0;
 if((Number(state.astralBalanceVersion)||0)<1){
 const ids=Array.isArray(state.astralSkills)?state.astralSkills:[];
 let oldSpent=0;
 for(const id of ids){
  let m=id.match(/^astral-(creation|matter|spacetime|astral|transcendence)-(\d+)$/);
  if(m){
   const branch=["creation","matter","spacetime","astral","transcendence"].indexOf(m[1]),tier=Number(m[2]);
   if(tier>=1&&tier<=40)oldSpent+=oldCostAt(tier,branch);
   continue;
  }
  m=id.match(/^astral-link-(\d+)-(\d+)$/);
  if(m){
   const branch=Number(m[1]),tier=Number(m[2]);
   if(branch>=0&&branch<5&&[8,16,24,32,40].includes(tier))oldSpent+=Math.ceil(oldCostAt(tier,branch)*2.5);
   continue;
  }
  if(id==="astral-final-core")oldSpent+=1000000;
 }
 refund=oldSpent*.8;
 state.ap=Math.max(0,Number(state.ap)||0)+refund;
 state.astralSkills=[];
 state.astralBalanceVersion=1;
 changed=true;
 }
 const currentVersion=Math.max(0,Number(state.astralBalanceVersion)||0);
 if(currentVersion<2){
  const compress=value=>{
   const n=Math.max(0,Number(value)||0);
   return Number.isFinite(n)?Math.log10(1+n)*100:30800;
  };
  state.ap=compress(state.ap);
  state.totalAP=compress(state.totalAP??state.ap);
  state.astralBalanceVersion=2;
  changed=true;
 }
 return {state,changed,refund};
}

export function astralNodeCost(tier,branch){
 return Math.ceil(1.10**tier*(1+branch*.25)*2);
}
export function astralLinkCost(tier,branch){
 return Math.ceil(astralNodeCost(tier,branch)*2.2);
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
 const final=owned.includes("astral-final-core")?1.05:1;
 return {
  production:creation*transcendence*links*final,
  click:matter*transcendence*final,
  cost:costReduction,
  offline:spacetime*transcendence*final,
  apGain:astral*transcendence*links*final
 };
}
