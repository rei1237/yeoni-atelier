// 저장된 작업 진행률로 일회 동작을 고른다. 렌더는 게임 상태를 바꾸지 않는다.
export function staffMotion(key,o){
 if(!['luna','neo'].includes(key)||o.outfitId)return null;
 const kind=o.cleaning?'wipe':o.servicePose?.kind==='serve'?'place_plate':o.carry?'tray_walk':null;
 if(!kind)return null;
 const frame=o.reducedMotion?0:kind==='tray_walk'?(o.state==='walk'?Math.floor(Number.isFinite(o.walkDistance)?o.walkDistance*4:(o.t||0)/160)%4:0):Math.min(3,Math.floor(Math.max(0,o.servicePose?.progress||0)*4));
 return {key:key+'_'+kind,frame};
}
// 마감 30초: 손이 빈 직원은 설거지·청소 시트로 하루를 정리한다(앞 절반 설거지·비질, 뒤 절반 정리, 마지막 6초 마무리).
export const CLOSE_SHEETS={luna_sis:'luna_sis_close',luna:'luna_close',neo:'neo_close'};
export function closingChore(id,s,elapsedMs,durationMs,closingMs,reducedMotion){
 const key=CLOSE_SHEETS[id],left=durationMs-elapsedMs;
 if(!key||left>closingMs||left<0||s.job||s.carry||s.path?.length||(s.action&&s.action!=='idle'))return null;
 const into=closingMs-left,state=left<=6000?'done':into<(closingMs-6000)/2?'chore':'tidy';
 return {key,state,frame:reducedMotion?0:Math.floor(elapsedMs/160)%4};
}
