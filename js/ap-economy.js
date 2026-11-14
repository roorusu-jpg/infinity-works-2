// AP growth follows a fourth-root curve, with a rebirth penalty like prestige points.
export const AP_ENERGY_PER_POINT=1e112;

export function astralAPGainForEnergy(energyBefore,energyAdded,prestigeCount=0){
 const before=Math.max(0,Number(energyBefore)||0);
 const added=Math.max(0,Number(energyAdded)||0);
 if(!Number.isFinite(added)||added<=0)return 0;
 const penalty=1+Math.max(0,Number(prestigeCount)||0)*0.25;
 if(before===0)return Math.pow(added/AP_ENERGY_PER_POINT,0.25)/penalty;
 const basePotential=Math.pow(before/AP_ENERGY_PER_POINT,0.25);
 const relativeIncrease=added/before;
 const gain=basePotential*Math.expm1(0.25*Math.log1p(relativeIncrease))/penalty;
 return Number.isFinite(gain)&&gain>0?gain:0;
}
