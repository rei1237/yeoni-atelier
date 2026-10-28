import {TEMP} from '../config/balance.temp.js';
import {popularity} from './reputation.js';
import {FURNITURE} from '../data/layout.js';
export function cafeProgress(state){const total=(state.stats.served||0)*6+Object.keys(state.ledger.tips||{}).length*10;const n=Math.floor(Math.sqrt(total/160));return {level:n+1,xp:total-160*n*n,next:160*(2*n+1),total};}
export function atmosphere(state){const seen=new Set();return state.interior.furniture.filter(f=>f.x!=null&&f.y!=null&&!seen.has(f.uid)&&seen.add(f.uid)).reduce((n,f)=>n+(FURNITURE[f.defId]?.ambience||0),0);}
export const cafeStyle=state=>atmosphere(state)>=60?'달빛 그랜드 카페':atmosphere(state)>=20?'아늑한 살롱':'소박한 동네 카페';
export const arrivalMultiplier=state=>(.65+popularity(state)/70)+Math.min(1.4,(cafeProgress(state).level-1)*.07)+Math.min(.5,atmosphere(state)/160);
export const WEALTH_UNLOCKS=Object.freeze({generous:{level:4,ambience:10},tycoon:{level:8,ambience:35}});
export function wealthEligible(state,id){const rule=WEALTH_UNLOCKS[id];return !rule||(cafeProgress(state).level>=rule.level&&atmosphere(state)>=rule.ambience);}
export function wealthWeights(state){const l=Math.min(30,cafeProgress(state).level-1),a=Math.min(60,atmosphere(state));return {frugal:Math.max(10,48-l),ordinary:42,generous:wealthEligible(state,'generous')?9+l*.8:0,tycoon:wealthEligible(state,'tycoon')?1+l*.55+a*.08:0};}
export function customerWealth(state,roll){const weights=wealthWeights(state);let n=roll*Object.values(weights).reduce((a,b)=>a+b,0);for(const [id,w]of Object.entries(weights)){n-=w;if(n<0)return id;}return 'ordinary';}
export const takeawayChance=state=>Math.min(.32,.12+(cafeProgress(state).level-1)*.008);
export function menuWeight(state,visit,m){
 if(m.nominationOnly && (visit?.kind!=='nomination'||visit.acceptAt==null))return 0;
 if(m.nominationOnly)return ['generous','tycoon'].includes(visit.wealthId)?(visit.wealthId==='tycoon'?18:5):0;
 if(visit?.kind==='takeaway' && m.cookMs>22000)return 0;
 const grade={frugal:0,ordinary:1,generous:2,tycoon:3}[visit?.wealthId]??1;
 const simple=['americano','fortune_latte','starlight_tea','flower_cookie'].includes(m.id);
 if(cafeProgress(state).level<=2)return simple?16:1;
 return simple?Math.max(1,10-grade*3):Math.max(1,grade*(m.price/80));
}

export const priceScale=state=>Math.pow(TEMP.CAFE_PRICE_GROWTH,Math.min(25,cafeProgress(state).level)-1);
export const menuPrice=(state,menu)=>Math.min(Number.MAX_SAFE_INTEGER,Math.round(menu.price*priceScale(state)));

// 단계명은 표시용 파생값이며 기존 평판·분위기 효과를 바꾸지 않는다.
const SCORE_STAGES={reputation:{cuts:[0,40,70],names:['새로 문 연 카페','동네 단골집','소문난 카페'],cap:100},atmosphere:{cuts:[0,20,60],names:['소박한 공간','아늑한 쉼터','감성 명소'],cap:Infinity}};
export function scoreStage(kind,raw){
 const d=SCORE_STAGES[kind];if(!d)throw Error('없는 카페 지표');
 const value=Math.min(d.cap,Math.max(0,Number.isFinite(raw)?raw:0));
 const index=d.cuts.reduce((found,cut,i)=>value>=cut?i:found,0),next=d.cuts[index+1]??null;
 return {value,level:index+1,name:d.names[index],nextName:d.names[index+1]??null,next,remaining:next==null?0:next-value,progress:next==null?1:(value-d.cuts[index])/(next-d.cuts[index])};
}
