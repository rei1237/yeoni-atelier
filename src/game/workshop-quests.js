import {WORKSHOP_QUESTS} from '../data/workshop-quests.js';
import {placeLock} from './unlocks.js';
import {grant} from './economy.js';
// 단계 n을 클리어하면 maxStage가 n+1이 된다
const cleared=(state,stage)=>(state.hunter?.maxStage||1)>stage;
export function workshopQuestView(state){
 if(placeLock(state,'gear'))return [];
 const saved=state.quests.workshop||{};
 return WORKSHOP_QUESTS.filter((q,i)=>!i||saved[WORKSHOP_QUESTS[i-1].id]?.claimed||saved[q.id]).map(q=>{const r=saved[q.id],progress=r&&cleared(state,q.stage)?1:0;return {...q,goal:1,accepted:!!r,claimed:!!r?.claimed,progress,acceptable:(state.hunter?.maxStage||1)>=q.stage,claimable:!!r&&!r.claimed&&progress>=1};});
}
export function workshopQuestAction(state,id,action){
 if(state.mode!=='prep'||state.interior.draft)return {ok:false,reason:'영업 준비 중 공방에서 이야기해 주세요'};
 const q=workshopQuestView(state).find(x=>x.id===id);if(!q)return {ok:false,reason:'아직 듣지 않은 부탁이에요'};
 if(action==='accept'){
  if(q.accepted)return {ok:false,reason:'이미 수락한 부탁이에요'};
  if(!q.acceptable)return {ok:false,reason:`사냥터 ${q.stage}단계에 먼저 도달해 주세요`};
  (state.quests.workshop||={})[id]={acceptedDay:state.day,claimed:false};return {ok:true};
 }
 if(action!=='claim'||!q.claimable)return {ok:false,reason:q.claimed?'이미 마친 부탁이에요':`${q.stage}단계 보스를 쓰러뜨린 뒤 이야기해 주세요`};
 state.quests.workshop[id].claimed=true;grant(state,'workshop:'+id,{gold:q.gold});return {ok:true};
}
