import { MONTH_STORIES } from './months.js';
import { BONDS } from '../data/bonds.js';
import { totalMonths } from '../game/calendar.js';
const SEASONS = [
  ['다시 피는 간판','새 꽃을 심기 전에 지난봄의 뿌리가 살아 있는지 살폈다.','올해는 손님 이름을 더 많이 기억하고 싶어.'],
  ['이름을 기억하는 자리','단골이 늘자 주문서 가장자리에 작은 메모가 쌓였다.','늘 같은 걸 드셔도 먼저 물어보자. 오늘 마음은 다를 수 있잖아.'],
  ['커피보다 따뜻한 대화','개업 기념일, 손님들이 작은 편지를 한 장씩 두고 갔다.','따뜻한 네오는 여전히 메뉴에 없지만, 따뜻한 인사는 있어.'],
  ['빗소리와 박자','지붕의 빗소리에 맞춰 주방에서 접시를 정리했다.','비 오는 날엔 서두르지 말자. 미끄러운 바닥부터 닦고.'],
  ['창가의 빈자리','연이는 예약표에 쉬어 가는 시간을 직접 적었다.','오늘 창가 한 자리는 우리 차례야. 쉬는 것도 약속이지.'],
  ['작은 여름 무대','가게 앞 축제에 맞춰 동선을 넓히고 테이블을 옮겼다.','춤추는 자리랑 차 놓는 자리는 꼭 나눠야 해. 지난번 기억하지?'],
  ['함께 거둔 달빛','농장의 수확 바구니가 주방 문 앞에 나란히 놓였다.','직접 키운 재료라 그런가. 오늘 냄새는 조금 더 자랑스럽네.'],
  ['노래가 끝난 뒤','마지막 손님이 떠난 뒤에도 함께 정리하는 손길은 남았다.','앙코르보다 고마운 건 설거지 한 번이더라. 별 다섯.'],
  ['불이 꺼져도','전등을 쉬게 한 저녁, 작은 램프 하나로 마감 장부를 읽었다.','밝은 무대가 아니어도 네 이야기는 잘 들려.'],
  ['지우지 않는 한 줄','연이는 실수한 장부를 버리지 않고 옆에 고친 방법을 적었다.','틀린 숫자도 남겨 둘래. 다음 사람은 같은 데서 안 넘어지게.'],
  ['한 해를 나누는 차','새해 첫 찻잔은 주문을 받기 전에 동료들에게 건넸다.','계획표에 쉬는 날도 적었어. 이번엔 진짜 지킬 거야.'],
  ['오래 머무는 가게','서가에 한 해의 장부를 꽂자 다음 권을 놓을 자리가 보였다.','다음 봄에도 같이 문을 열자. 그 약속부터 적어 둘게.'],
];
// 연차 제목: 2년 운영은 앞의 둘만 쓴다. 3~5년차는 옛 180순 저장용이다.
const YEARS = ['처음 연 문','두 해의 약속','함께 만든 무대','머물고 싶은 자리','다섯 해의 약속'];
const SPAN = {2:'두 해',5:'다섯 해'};
const FOCUS = ['yun','yun','neo','moka','seohanbi','solv','museong','bambi','lune','raven','luna','luna_sis'];
export function careerMonthStory(index, state) {
  if(index < 12) return MONTH_STORIES[index];
  const months = totalMonths(state);
  if(index < 0 || index >= months) return null;
  const year = 1 + Math.floor(index / 12), month = (index + 2) % 12 + 1, season = index % 12;
  const [title,scene,line] = SEASONS[season];
  const candidate = FOCUS[season];
  const who = BONDS[candidate]?.requiresRecruit && !state.roster[candidate] ? 'luna' : candidate;
  const b = BONDS[who];
  const last = index === months - 1, span = SPAN[months / 12] || `${months / 12}년`;
  return [
    {chapter:[`운영 ${year}년차 ${month}월 · ${YEARS[year-1]}`,last?`${span}의 마지막 장부`:title],bg:season>7?'atelier_dark':'atelier_lit',l:'yeoni:normal',c:`${b.speaker}:normal`,r:null},
    {s:'nar',t:`${year}번째 운영 해. ${scene}`},
    {s:'yeoni',t:last?`${span}를 채웠네. 이번 세 순을 마치면 우리 가게의 이야기를 결산하자.`:line},
    {s:b.speaker,t:b.talk[(year-2)%b.talk.length][1]},
    {s:'sys',t:last?`[ ${months * 3}번째 영업을 마치면 운영 엔딩을 봅니다. 이후에도 자유 영업과 인연은 이어집니다 ]`:`[ ${YEARS[year-1]} · 동료와 대화하고 함께 일하면 인연 스킬이 열립니다 ]`},
  ];
}
export {authoredCastBondStory as castBondStory} from './cast-bond-scenes.js';
