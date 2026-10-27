// 서한비의 영입 명단은 기존 합류 이벤트가 만든 정본이다. 옛 정당한 영입도 유지한다.
export const HUNT_CAST=['neo','seohanbi','yeoni_pig'];
export const hunterName=id=>({neo:'영냥이',seohanbi:'서한비',yeoni_pig:'꽃돼지 연이'})[id]||'잠긴 동료';
export const hunterPortrait=id=>({neo:'neo_cat',seohanbi:'seohanbi_tiger',yeoni_pig:'yeoni_pig'})[id]||'neo_cat';
export const hunterPerson=id=>id==='yeoni_pig'?'yeoni':id;
export const campaignCleared=s=>!!(s.ledger.rewards['stage:neo:100']||s.ledger.rewards['stage:seohanbi:100']);
export function hunterUnlocked(s,id){return id==='neo'||id==='seohanbi'&&!!s.roster.seohanbi||id==='yeoni_pig'&&campaignCleared(s)&&!!s.ledger.story['ev:bloom'];}
export const selectedHunter=(s,id)=>hunterUnlocked(s,id)?id:'neo';
export const pendingBloomStory=s=>campaignCleared(s)&&!s.ledger.story['ev:bloom']?'ev:bloom':null;
