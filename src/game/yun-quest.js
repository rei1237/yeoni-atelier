import {emit} from './state.js';
export const YUN_COMMISSION=Object.freeze({gold:10000,moonstone:180,target:'boss_hand'});
export function yunQuestView(state){const q=state.yunQuest||{gold:0,moonstone:0,status:'locked'},eligible=q.gold>=YUN_COMMISSION.gold||q.moonstone>=YUN_COMMISSION.moonstone;return {...q,eligible,ready:q.status==='complete'};}
export function recordYunTrade(state,gold=0,moonstone=0){state.yunQuest||={gold:0,moonstone:0,status:'locked'};state.yunQuest.gold+=gold;state.yunQuest.moonstone+=moonstone;}
export function acceptYunQuest(state){const q=yunQuestView(state);if(state.mode!=='prep'||!q.eligible||q.status!=='locked'||state.roster.yun)return {ok:false,reason:'공방에서 장비를 구입하거나 강화해 윤달의 신뢰를 먼저 쌓아 주세요'};state.yunQuest.status='active';emit('questProgress',{label:'윤달의 부탁: 영냥이로 거대한 검은 손을 쓰러뜨리고 돌아오세요'});return {ok:true};}
