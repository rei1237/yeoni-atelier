// 날짜는 게임 달력의 day(한 순)이며 현실 시계를 읽지 않는다.
export const huntVisitKey=(state,who='neo')=>`${who}:${state.day}`;
export function huntVisitReason(state,who='neo'){
 return who==='neo'&&state.ledger.huntVisits?.[huntVisitKey(state,who)]?'영냥이는 오늘 다녀왔어 · 내일 다시 갈 수 있어':'';
}
export function recordHuntVisit(state,who,id){(state.ledger.huntVisits??={})[huntVisitKey(state,who)]=id;}
export function migrateHuntVisits(state){
 state.ledger.huntVisits??={};
 // 이전 저장의 현재 순 활동은 보존하고 진행 사냥을 새 방문으로 시작하지 않는다.
 if(state.ap?.neoTask==='hunt'||state.hunt?.hunterId==='neo'||(state.hunt&&!state.hunt.hunterId))state.ledger.huntVisits[huntVisitKey(state)]??=state.hunt?.id||state.lastHunt?.id||'legacy';
}
