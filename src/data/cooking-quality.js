import {MENUS} from './menus.js';
// TEMP: 대기·분위기 점수에 작은 품질 보정을 더한다. 기존·자동 음식은 좋음이다.
export const COOK_QUALITY=Object.freeze({normal:{label:'보통',delta:-8},good:{label:'좋음',delta:0},perfect:{label:'완벽',delta:6}});
export const qualityOf=id=>COOK_QUALITY[id]||COOK_QUALITY.good;
export function cookingDifficulty(menuId){
 const m=MENUS[menuId]||{},tier=m.huntStage?Math.min(9,4+Math.floor((m.huntStage-20)/15)):m.special?3:m.combo?2:m.farm?1:0;
 const width=[80,70,60,50,42,36,30,26,22,18][tier];
 return {tier,width,min:50-width/2,max:50+width/2,perfectMin:50-width/4,perfectMax:50+width/4,speedMs:800-tier*40};
}
export function qualityForTiming(value,menuId){
 if(value==null)return 'good';
 if(!Number.isFinite(value)||value<0||value>100)return 'normal';
 const d=cookingDifficulty(menuId);return value>=d.perfectMin&&value<=d.perfectMax?'perfect':value>=d.min&&value<=d.max?'good':'normal';
}
export function foodScore(waitSeconds,ambience,quality){
 const base=Math.max(30,Math.min(100,100-Math.max(0,waitSeconds-30)*.8))+Math.min(10,ambience);
 const delta=qualityOf(quality).delta;
 return {base:Math.round(base),qualityDelta:delta,score:Math.max(0,Math.min(100,Math.round(base+delta)))};
}
