import {bondRank} from '../data/bonds.js';
// TEMP: 네오 인연 Rank 8(옛 3단계)에서 영냥이 카페 근무가 열린다. 사냥 모습과 별도 상태다.
export const CAT_CAFE_RANK=8;
export const catCafeUnlocked=s=>!!s.hostbar?.open&&bondRank(s,'neo')>=CAT_CAFE_RANK;
export const catCafeActive=s=>!!s.cafeCat&&catCafeUnlocked(s)&&s.people?.neo?.form==='cat'&&s.people.neo.activity!=='hunting'&&['prep','shift','settlement'].includes(s.mode);
export function setCafeCat(s,on){
 if(!['prep','shift'].includes(s.mode))return {ok:false,reason:'카페 영업 준비나 영업 중에 바꿀 수 있어요'};
 if(!catCafeUnlocked(s))return {ok:false,reason:'호스트 개업 후 네오 인연 Rank 8에서 열려요'};
 if(s.dayOff?.neo)return {ok:false,reason:'오늘은 네오의 휴무예요'};
 const p=s.people.neo,worker=s.staff?.neo;
 if(p?.activity!=='idle'||(s.mode==='shift'&&worker?.job&&worker.job.kind!=='home'))return {ok:false,reason:'네오가 맡은 일을 마친 뒤 모습을 바꿔 주세요'};
 const next=on??!s.cafeCat;s.cafeCat=!!next;p.form=next?'cat':'human';
 if(!next&&(s.stress?.neo||0)>=100)s.resting={...s.resting,neo:true};
 return {ok:true,on:!!next};
}
