import {emit} from './state.js';
import {MENUS} from '../data/menus.js';
// TEMP: 연이의 직접 활동 성장. 기존 플레이 기록은 소급하지 않는다.
export const YEONI_GROWTH = Object.freeze({maxLevel:50, xp:{cook:12,farm:4,talk:10,gift:6}, revenuePerLevel:.01,revenueCap:.25,cookPerLevel:.01,cookCap:.2});
export const YEONI_TITLES = Object.freeze([
 {id:'beginner',name:'첫 잔의 주인',kind:'level',need:1},
 {id:'cook',name:'향을 빚는 손',kind:'cook',need:10},
 {id:'farmer',name:'꽃밭의 친구',kind:'farm',need:20},
 {id:'friend',name:'마음을 잇는 사람',kind:'bond',need:15},
 {id:'keeper',name:'단골의 안식처',kind:'level',need:10},
 {id:'master',name:'달빛 아틀리에의 주인',kind:'level',need:25},
]);
export const yeoniThreshold=level=>12*(level-1)*level;
export function yeoniProgress(s){
 const xp=Math.max(0,Number(s.yeoniGrowth?.xp)||0);let level=1;
 while(level<YEONI_GROWTH.maxLevel&&xp>=yeoniThreshold(level+1))level++;
 return {xp,level,floor:yeoniThreshold(level),next:level<YEONI_GROWTH.maxLevel?yeoniThreshold(level+1):null,counts:s.yeoniGrowth?.counts||{}};
}
export function yeoniEffects(s){const n=yeoniProgress(s).level-1;return {revenue:Math.min(YEONI_GROWTH.revenueCap,n*YEONI_GROWTH.revenuePerLevel),cookSpeed:Math.min(YEONI_GROWTH.cookCap,n*YEONI_GROWTH.cookPerLevel),ap:Math.min(2,Math.floor(n/10))};}
export function yeoniTitles(s){const p=yeoniProgress(s);return YEONI_TITLES.filter(t=>(t.kind==='level'?p.level:p.counts[t.kind]||0)>=t.need);}
export function gainYeoni(s,kind){
 const amount=YEONI_GROWTH.xp[kind];if(!amount)return;
 const before=yeoniProgress(s).level;const g=s.yeoniGrowth??={xp:0,counts:{},title:'beginner'};
 g.counts??={};g.xp=(Number(g.xp)||0)+amount;const key=['talk','gift'].includes(kind)?'bond':kind;g.counts[key]=(g.counts[key]||0)+1;const level=yeoniProgress(s).level;if(level>before)emit('yeoniLevelUp',{level});
}
export function equipYeoniTitle(s,id){if(!yeoniTitles(s).some(t=>t.id===id))return {ok:false,reason:'아직 얻지 못한 칭호예요'};s.yeoniGrowth??={xp:0,counts:{}};s.yeoniGrowth.title=id;return {ok:true};}
export const canYeoniCook=(s,m)=>!!m&&(m.yeoniLevel?yeoniProgress(s).level>=m.yeoniLevel:!!s.learned[m.id]);
export function registerYeoniMenu(s,id){
 const m=MENUS[id];
 if(s.mode!=='prep'||s.paused||s.interior.draft||s.outdoor?.draft)return {ok:false,reason:'영업 준비 중에 메뉴를 등록해 주세요'};
 if(!m?.yeoniLevel||!canYeoniCook(s,m)||!(s.yeoniGrowth?.recipes?.[id]>0))return {ok:false,reason:'해금된 특별 요리를 연이가 한 번 완성하면 등록할 수 있어요'};
 if(s.learned[id])return {ok:true,duplicate:true};
 s.learned[id]=true;emit('yeoniMenuRegistered',{menuId:id});return {ok:true};
}
