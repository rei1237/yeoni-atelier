// 짧은 대사. 기획서 p.21의 개그 대사를 쓴다. 대사는 규칙과 능력치를 바꾸지 않는다.

export const GAG_HOSTBAR = Object.freeze([
  { who: '손님', text: '여기가 소문난 호스트 카페예요?' },
  { who: '연이', text: '맞아요! 커피는 잔에, 이야기는 마음에 담아 드려요.' },
]);

export const GAG_NEO_FUN = Object.freeze([
  { who: '연이', text: '네오야, 손님 좀 웃겨봐.' },
  { who: '네오', text: '웃으면 긴장이 풀린대. …이건 농담이 아니네.' },
  { who: '연이', text: '설명 말고 실행을 해.' },
]);

export const HELP_KINDS = Object.freeze({
  topic: { id: 'topic', label: '대화 주제 고르기' },
  listen: { id: 'listen', label: '이야기 들어주기' },
  photo: { id: 'photo', label: '사진 요청', special: true },
  refill: { id: 'refill', label: '음료 리필' },
  trouble: { id: 'trouble', label: '곤란한 요청' },
  compliment: { id: 'compliment', label: '칭찬 받아치기' },
});

// 주제 고르기 선택지: 손님의 가장 높은 선호와 맞으면 '좋음'
export const TOPICS = Object.freeze({
  empathy: '요즘 고민 이야기',
  talk: '재치 있는 말장난',
  fun: '웃긴 에피소드',
  looks: '오늘의 코디 이야기',
});

// ── 개그 대사 풀(게임 오리지널). 화면 연출용 말풍선일 뿐, 골드·시간·규칙을 바꾸지 않는다.
// 말투: 모카 = 별점 매기는 퉁명 반말, 루나 = 잘 우는 밝은 반말, 루나 언니 = 지친 존댓말, 청토끼 = "어머~" 상냥한 금융 말투.

// 영업 시작할 때 하나
export const GAG_SHIFT_START = Object.freeze([
  [{ who: '연이', text: '계산대 사수 완료! 오늘도 사장님 포스 별 다섯!' }, { who: '네오', text: '앉아 있는 것도 전략이네.' }],
  [{ who: '루나', text: '오늘은 손님 열 배 올까?' }, { who: '루나 언니', text: '0 곱하기 10은 안 돼요, 루나.' }],
  [{ who: '네오', text: '오늘도 홀은 내가 볼게.' }, { who: '연이', text: '(네오 미소 효과로 손님 체류 시간 별 네 개.)' }],
  [{ who: '연이', text: '루나 언니, 오븐 잘 부탁해! 나는 계산기를 지킬게.' }, { who: '루나 언니', text: '괜찮아요… 늘 제가 굽는걸요.' }],
]);

// 자동 조리·서빙 중 가끔
export const GAG_KITCHEN = Object.freeze([
  [{ who: '연이', text: '거스름돈 300G, 정확! 계산 실력 별 다섯.' }, { who: '루나', text: '연이 언니는 정말 계산만 하네…!' }],
  [{ who: '연이', text: '(손님이 웃었다. 오늘 서비스 별 하나 추가.)' }],
  [{ who: '루나', text: '언니! 빵 냄새 맡고 손님이 줄 섰어!' }, { who: '루나 언니', text: '순서 지켜요. 다 들어와요.' }],
  [{ who: '네오', text: '3번 테이블, 주문하신 운세 라테 나왔습니다.' }, { who: '손님', text: '운세도 같이 나와요?' }, { who: '네오', text: '라테는 거짓말을 안 해요.' }],
  [{ who: '네오', text: '설탕 두 스푼이면 충분할 것 같아.' }],
]);

// 모카 식재료점
export const GAG_MOKA_BUY = Object.freeze([
  { who: '모카', text: '원두 고르는 눈은 별 셋. 아직 멀었어.' },
  { who: '모카', text: '밀가루는 여기. 가격표보다 반죽 상태도 좀 봐.' },
  { who: '모카', text: '수달한테 궁합 보지 마. 재료 궁합만 봐.' },
  { who: '모카', text: '현금 박치기 좋아. 이 손님 별 넷.' },
]);
export const GAG_MOKA_DELIVERY = Object.freeze([
  { who: '모카', text: '배달 완료. 다음번엔 미리 시켜. 식기 전에 먹고.' },
  { who: '모카', text: '영업 중 긴급 배달? 수달 발 출장비 붙는다.' },
  { who: '모카', text: '헉헉… 강 건너 뛰어왔어. 배달비는 정직하게.' },
]);

// 청토끼 금융 센터(월정석 환전소)
export const GAG_LUNA_EXCHANGE = Object.freeze([
  [{ who: '청토끼', text: '어머~ 돌이 돈이 되는 순간이네요. 환산 내역도 꼭 챙기세요.' }],
  [{ who: '청토끼', text: '반짝이는 월정석은 반가워요. 이자 납부일도 잊지 마시고요.' }],
  [{ who: '연이', text: '환율 확인, 개수 확인. 이번엔 내가 장부를 봐!' }],
]);

// 윤달의 무기 공방
export const GAG_GEAR_STALL = Object.freeze([
  { who: '윤달', text: '손에 맞는지부터 봐. 쥐기 불편하면 다시 다듬어 줄게.' },
  { who: '윤달', text: '장비는 준비됐어. 돌아올 힘도 남겨 두고 가.' },
  { who: '영냥이', text: '…잔소리까지 묶음 상품인가.' },
]);

// 빚 상환할 때 청토끼
export const GAG_CHEONGTOKKI_REPAY = Object.freeze([
  { who: '청토끼', text: '후후.. 저는 최약체랍니다~ 그래도 영수증 계산은 빈틈없죠.' },
  { who: '연이', text: '영수증부터 줘! 1골드까지 장부랑 맞춰 볼 거야.' },
  { who: '청토끼', text: '어머~ 성실하셔라! 이자는 아주아주 조금 더 줄었어요~' },
  { who: '청토끼', text: '총총~ 다음 상환일도 기대할게요!' },
  { who: '루나', text: '저 토끼 귀 접어 버리고 싶어!' },
]);

// 월정석 사냥 끝
export const GAG_HUNT_RETURN = Object.freeze([
  [{ who: '영냥이', text: '월정석이다. 검은 손이 물고 있던 걸 빼앗았다.' }, { who: '연이', text: '영냥이 오늘 사냥 별 다섯!' }],
  [{ who: '영냥이', text: '츄르 값은 따로 받겠다.' }],
]);

export const pickLine = pool => pool[Math.floor((globalThis.performance?.now() || 0)/1200) % pool.length];
