// 저장된 작업 진행률로 일회 동작을 고른다. 렌더는 게임 상태를 바꾸지 않는다.
export function staffMotion(key,o){
 if(!['luna','neo'].includes(key)||o.outfitId)return null;
 const kind=o.cleaning?'wipe':o.servicePose?.kind==='serve'?'place_plate':o.carry?'tray_walk':null;
 if(!kind)return null;
 const frame=o.reducedMotion?0:kind==='tray_walk'?(o.state==='walk'?Math.floor(Number.isFinite(o.walkDistance)?o.walkDistance*4:(o.t||0)/160)%4:0):Math.min(3,Math.floor(Math.max(0,o.servicePose?.progress||0)*4));
 return {key:key+'_'+kind,frame};
}
