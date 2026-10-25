import {personName,emit} from './state.js';
export const popularity=state=>Math.max(0,Math.min(100,state.reputation??25));
export function changePopularity(state,n){state.reputation=Math.max(0,Math.min(100,Math.round((popularity(state)+n)*10)/10));}
export function guestChatter(state,visit,roll){
 const latest=Object.entries(state.recruitment).filter(([id,r])=>r.status==='recruited' && state.day-r.at<=6 && state.day>=r.at).sort((a,b)=>b[1].at-a[1].at)[0];
 let lines=popularity(state)>=70?['소문보다 더 좋은데? 다음엔 친구도 데려와야지.','단골 자리를 예약하고 싶을 정도야.']:popularity(state)<20?['응대가 아쉽다는 얘길 들었는데… 오늘은 괜찮을까?','조금만 더 차분히 챙겨 주면 좋겠어.']:['길을 걷다가 차 향기에 이끌려 들어왔어.','오늘은 무슨 메뉴가 잘 나가나요?'];
 if(latest&&roll<.55)lines=[`${personName(state,latest[0])} 님이 합류했다면서요? 소문 듣고 왔어요!`];
 else if(visit.motive==='atmosphere')lines=['이 의자에 앉아 조용히 쉬고 싶어서 왔어요.','차도 좋지만, 이 가게의 분위기가 마음에 들어요.'];
 else if(visit.kind==='takeaway')lines=['가는 길에 한 잔만! 포장은 금방 되죠?','오늘은 바빠서 포장할게요. 다음엔 앉았다 갈게요.'];
 const line=lines[Math.min(lines.length-1,Math.floor(roll*lines.length))];emit('guestChatter',{line,wealthId:visit.wealthId});return line;
}
