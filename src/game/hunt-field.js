import {TEMP} from '../config/balance.temp.js';
// Deterministic infinite chunks. Only nearby props are materialized; broken IDs survive reload.
export const CHUNK_SIZE=400;
export function fieldHash(x,y,seed=1){let v=Math.imul(x^seed,374761393)^Math.imul(y,668265263);v=Math.imul(v^(v>>>13),1274126177);return (v^(v>>>16))>>>0;}
export const fieldTheme=depth=>depth>=85?'hunt_heukwol':depth>=55?'hunt_ruins':depth>=35?'hunt_rabbit':'hunt_garden';
// 보물 상자(coffer)는 기물 자리 중 아주 드물게만 나온다.
export const isTreasure=h=>(h>>>20)%1000<TEMP.HUNT.TREASURE_PER_MIL;
export function nearbyProps(hs,player){
 const cx=Math.floor(player.x/CHUNK_SIZE),cy=Math.floor(player.y/CHUNK_SIZE),out=[],seed=hs.fieldSeed||1;
 for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){
  const h=fieldHash(x,y,seed),id=`${x}:${y}`;
  if(h%10<TEMP.HUNT.FIELD_PROP_SKIP||hs.brokenProps?.[id])continue;
  const treasure=isTreasure(h),base=(3+h%5)*(1+hs.depth*.045)*TEMP.HUNT.FIELD_PROP_REWARD;
  out.push({id,x:x*CHUNK_SIZE+60+h%280,y:y*CHUNK_SIZE+60+(h>>>9)%280,r:treasure?26:22,kind:treasure?'coffer':hs.depth>=85?'obsidian':['crystal','urn'][h%2],treasure,maxHp:36+hs.depth*2,hp:hs.propDamage?.[id]??36+hs.depth*2,reward:Math.ceil(base*(treasure?TEMP.HUNT.TREASURE_REWARD:1))});
 }
 return out;
}
export function hitFieldProp(hs,prop,damage){
 if(hs.brokenProps?.[prop.id])return 0;
 hs.propDamage??={};const hp=(hs.propDamage[prop.id]??prop.maxHp)-damage;
 if(hp>0){hs.propDamage[prop.id]=hp;return 0;}
 hs.brokenProps??={};hs.brokenProps[prop.id]=true;delete hs.propDamage[prop.id];return prop.reward;
}
