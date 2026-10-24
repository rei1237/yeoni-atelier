// 프롤로그: 게임 오리지널 외전. 아틀리에·빚·골드는 이 게임의 설정이고 원작(code-destiny) 사실이 아니다.
// 인물 말투는 원작 기준: 연이 = 가벼운 반말·별점 개그·괄호 속마음, 영냥이 = 무표정 해라체, 네오(사람) = 부드러운 반말.
// 박자 형식: s = 말하는 이(yeoni·neo·neo_cat·nar·sys·impact), t = 대사, l/c/r = 'key:표정' 초상화 칸(null 이면 비움, 생략하면 유지),
//           bg = 배경(river_night·atelier_dark·atelier_lit), fx = shake·flash·glow, chapter = [위 작은 글, 제목]

export const SPEAKERS = Object.freeze({
  yeoni: { name: '연이', portrait: 'yeoni' },
  neo: { name: '네오', portrait: 'neo' },
  neo_cat: { name: '영냥이', portrait: 'neo_cat' },
});

export const PROLOGUE = Object.freeze([
  { chapter: ['PROLOGUE', '달빛 아래 빈 아틀리에'], bg: 'river_night', l: null, c: null, r: null },
  { s: 'sys', t: '[ 이 이야기는 「연이의 아틀리에」 게임 오리지널 외전입니다 ]' },
  { s: 'nar', t: '사주의 강 위로 밤이 내려앉았다. 물빛을 따라 걷던 두 그림자 앞에, 작은 불빛 하나가 깜빡였다.' },
  { s: 'yeoni', t: '어? 저기 간판 있어. 아… 틀… 리… 에?', l: 'yeoni:surprised' },
  { s: 'yeoni', t: '(강가에 웬 가게야. 분위기 별 다섯… 아니, 수상함도 별 다섯.)', l: 'yeoni:normal' },
  { s: 'neo_cat', t: '기운이 이상하다. 함부로 들어가지 마라.', r: 'neo_cat:serious' },
  { s: 'yeoni', t: '에이, 불 켜져 있잖아. 잠깐만 구경하고 나오자!', l: 'yeoni:smile' },
  { s: 'nar', t: '손잡이에 닿기도 전에 문이 저절로 열렸다. 먼지 쌓인 의자, 식어 버린 오븐, 그리고 카운터 위의 종이 한 장.', bg: 'atelier_dark' },
  { s: 'yeoni', t: '계약서…? 글씨가 빛나는데.', l: 'yeoni:normal' },
  { s: 'sys', t: '[ 이 아틀리에를 깨운 자는 남은 빚 120,000G를 함께 맡는다 ]' },
  { s: 'impact', t: '십이만 골드으으으?!', l: 'yeoni:surprised', fx: 'shake' },
  { s: 'yeoni', t: '꿀악! 나 아직 아무것도 안 만졌는데?!', l: 'yeoni:sulky' },
  { s: 'neo_cat', t: '문을 연 건 너다.', r: 'neo_cat:smug' },
  { s: 'sys', t: '[ 단, 손님의 마음을 채우는 한 잔마다 빚은 조금씩 줄어든다 ]' },
  { s: 'nar', t: '그 순간, 식어 있던 오븐 안에서 작은 불꽃이 튀었다. 선반의 병들이 하나씩 빛을 되찾았다.', fx: 'flash' },
  { s: 'yeoni', t: '…좋아, 이왕 이렇게 된 거 뭐라도 만들어 보자! 우유랑 설탕이랑 아무거나 막…', l: 'yeoni:determined' },
  { s: 'neo_cat', t: '아무렇게나 섞지 마라. 조합에는 순서가 있다.', r: 'neo_cat:serious' },
  { s: 'yeoni', t: '그럼 레시피는? 영냥이는 알아?', l: 'yeoni:normal' },
  { s: 'neo_cat', t: '모른다. 그러니 직접 찾아라.', r: 'neo_cat:normal' },
  { s: 'nar', t: '모자의 초승달이 금빛으로 번졌다. 빛이 걷히자, 그 자리에 은발의 네오가 서 있었다.', r: 'neo:normal', fx: 'glow' },
  { s: 'neo', t: '손님 맞는 건 내가 할게. 지명이 들어오면 5분 동안은 그 테이블만 볼 거야.', r: 'neo:smile' },
  { s: 'neo', t: '그동안 주방은 연이가 맡아 줘. 너라면 할 수 있어.', r: 'neo:normal' },
  { s: 'yeoni', t: '오… 갑자기 든든함 별 네 개.', l: 'yeoni:smile' },
  { s: 'neo', t: '밤에는 고양이 모습으로 강가에 나가 재료를 찾아올게.', r: 'neo:serious' },
  { s: 'neo', t: '검은 손이 돌아다니는 곳이라 오래 있진 못해. 3분이면 돌아올게.', r: 'neo:serious' },
  { s: 'yeoni', t: '빚 12만, 손님 0명… 현재 평점 별 반 개.', l: 'yeoni:sulky' },
  { s: 'neo', t: '그럼 별을 하나씩 채우자. 문 열자, 연이의 아틀리에.', r: 'neo:smile' },
  { s: 'impact', t: '연이의 아틀리에, 영업 시작!', bg: 'atelier_lit', l: 'yeoni:determined', r: 'neo:smile' },
  { s: 'sys', t: '[ 영업 준비에서 재료를 사고, 조합대에서 재료를 섞어 새 레시피를 찾아보세요 ]' },
]);
