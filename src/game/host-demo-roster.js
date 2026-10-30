// 체험 저장에만 적용하는 준비 상태. 이미 고른 배치와 진행 기록은 보존한다.
export function prepareHostDemo(state){
 if(!state.meta?.hostDemo||state.meta.hostDemoCrewV1||state.mode!=='prep')return false;
 for(const id of ['solv','bambi','lune','raven']){
  if(!state.roster[id]){state.roster[id]={usableFrom:state.day};state.stats.recruited++;}
  state.people[id]??={activity:'idle',form:'human',visitId:null,tableNo:null,endAt:null};
  if(state.recruitment[id]?.status!=='recruited')state.recruitment[id]={status:'recruited',at:Math.max(1,state.day-1)};
 }
 const chosen=state.staffing?.selected;
 if(!Array.isArray(chosen)||chosen.length===1&&chosen[0]==='neo')state.staffing={selected:['neo','solv','bambi']};
 state.meta.hostDemoCrewV1=true;
 return true;
}
