// 짧은 대사. 기획서 p.21의 개그 대사를 쓴다. 대사는 규칙과 능력치를 바꾸지 않는다.

export const GAG_HOSTBAR = Object.freeze([
  { who: '손님', text: '여기 호스트바 아니에요?' },
  { who: '연이', text: '카페예요. 커피가 먼저 나오잖아요.' },
]);

export const GAG_NEO_FUN = Object.freeze([
  { who: '연이', text: '네오야, 손님 좀 웃겨봐.' },
  { who: '네오', text: '웃음은 스트레스 반응을 완화하는 데 도움이 됩니다.' },
  { who: '연이', text: '설명 말고 실행을 해.' },
]);

export const HELP_KINDS = Object.freeze({
  topic: { id: 'topic', label: '대화 주제 고르기' },
  listen: { id: 'listen', label: '이야기 들어주기' },
  photo: { id: 'photo', label: '사진 요청', special: true },
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
  [{ who: '연이', text: '손이 알아서 반죽을 치대! 오늘도 장인의 경지 별 다섯!' }, { who: '영냥이', text: '그건 습관이다.' }],
  [{ who: '루나', text: '오늘은 손님 열 배 올까?' }, { who: '루나 언니', text: '0 곱하기 10은 안 돼요, 루나.' }],
  [{ who: '네오', text: '오늘도 홀은 내가 볼게.' }, { who: '연이', text: '(네오 미소 효과로 손님 체류 시간 별 네 개.)' }],
  [{ who: '연이', text: '오븐아, 오늘은 태우지 말자. 약속.' }, { who: '영냥이', text: '오븐은 약속을 모른다.' }],
]);

// 자동 조리·서빙 중 가끔
export const GAG_KITCHEN = Object.freeze([
  [{ who: '연이', text: '라테 아트 그렸어! 하트… 아니 감자.' }],
  [{ who: '연이', text: '(손님이 웃었다. 오늘 서비스 별 하나 추가.)' }],
  [{ who: '루나', text: '언니! 빵 냄새 맡고 손님이 줄 섰어!' }, { who: '루나 언니', text: '순서 지켜요. 다 들어와요.' }],
  [{ who: '네오', text: '3번 테이블, 주문하신 운세 라테 나왔습니다.' }, { who: '손님', text: '운세도 같이 나와요?' }, { who: '네오', text: '라테는 거짓말을 안 해요.' }],
  [{ who: '영냥이', text: '설탕 두 스푼. 세 스푼은 사치다.' }],
]);

// 모카 식재료점
export const GAG_MOKA_BUY = Object.freeze([
  { who: '모카', text: '원두 고르는 눈은 별 셋. 아직 멀었어.' },
  { who: '모카', text: '밀가루 한 포대 30G. 맛없으면? 그건 네 손 탓.' },
  { who: '모카', text: '수달한테 궁합 보지 마. 재료 궁합만 봐.' },
  { who: '모카', text: '현금 박치기 좋아. 이 손님 별 넷.' },
]);
export const GAG_MOKA_DELIVERY = Object.freeze([
  { who: '모카', text: '영업 중 긴급 배달? 수달 발 출장비 붙는다.' },
  { who: '모카', text: '헉헉… 강 건너 뛰어왔어. 배달비는 정직하게.' },
]);

// 루나의 저울(월정석 환전소)
export const GAG_LUNA_EXCHANGE = Object.freeze([
  [{ who: '루나', text: '하나, 둘, 많다! 그러니까 많이 줄게!' }, { who: '루나 언니', text: '루나, 저울을 봐요. 정확히 드려야 해요.' }],
  [{ who: '루나', text: '월정석 반짝반짝! 한 개만 내가 가지면 안 돼?' }, { who: '루나 언니', text: '안 돼요.' }],
  [{ who: '루나 언니', text: '무게 정직하게 달았어요. 빵값을 거짓으로 받으면, 빵이 거짓말 맛이 나거든요.' }],
]);

// 무인 장비 좌판 팻말 — 주인은 없다
export const GAG_GEAR_STALL = Object.freeze([
  { who: '팻말', text: '「무인 좌판. 돈은 상자에. 훔치면 고양이가 봅니다.」' },
  { who: '팻말', text: '「반품 불가. 단, 고양이 털 묻은 건 원래 그런 겁니다.」' },
  { who: '영냥이', text: '…주인이 없는데 왜 나를 노려보는 기분이지.' },
]);

// 빚 상환할 때 청토끼
export const GAG_CHEONGTOKKI_REPAY = Object.freeze([
  { who: '청토끼', text: '어머~ 성실하셔라! 이자는 아주아주 조금 더 줄었어요~' },
  { who: '청토끼', text: '총총~ 다음 상환일도 기대할게요!' },
  { who: '루나', text: '저 토끼 귀 접어 버리고 싶어!' },
]);

// 월정석 사냥 끝
export const GAG_HUNT_RETURN = Object.freeze([
  [{ who: '영냥이', text: '월정석이다. 검은 손이 물고 있던 걸 빼앗았다.' }, { who: '연이', text: '영냥이 오늘 사냥 별 다섯!' }],
  [{ who: '영냥이', text: '츄르 값은 따로 받겠다.' }],
]);

export const pickLine = pool => pool[Math.floor(Math.random() * pool.length)];
