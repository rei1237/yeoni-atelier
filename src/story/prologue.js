import {TEMP} from '../config/balance.temp.js';
// 프롤로그: 게임 오리지널 외전. 아틀리에·카페 인수 사기·빚·골드는 이 게임의 설정이고 원작(code-destiny) 사실이 아니다.
// 원작에서 빌린 것은 인물과 말투뿐이다: 루나·루나 언니(재성의 섬 언덕 빵집 토끼 자매), 청토끼(청토끼 금융), 모카(수달 래퍼 셰프).
// 인물 말투는 원작 기준: 연이 = 가벼운 반말·별점 개그·괄호 속마음, 영냥이 = 무표정 해라체, 네오(사람) = 부드러운 반말,
//   루나 = 잘 우는 밝은 반말("연이 언니"), 루나 언니 = 지친 존댓말("괜찮아요"), 청토끼 = "어머~" 상냥한 금융 말투, 모카 = 별점 매기는 퉁명 반말.
// 박자 형식: s = 말하는 이(SPEAKERS 키·nar·sys·impact), t = 대사, l/c/r = 'key:표정' 초상화 칸(null 이면 비움, 생략하면 유지),
//           bg = 배경(river_night·atelier_dark·atelier_lit), fx = shake·flash·glow, chapter = [위 작은 글, 제목]

import { RECRUITABLE } from '../data/companions.js';
export const SPEAKERS = Object.freeze({
  ...Object.fromEntries(RECRUITABLE.map(c => [c.id, {name:c.name,portrait:c.id}])),
  yeoni: { name: '연이', portrait: 'yeoni' },
  neo: { name: '네오', portrait: 'neo' },
  neo_cat: { name: '영냥이', portrait: 'neo_cat' },
  luna: { name: '루나', portrait: 'luna' },
  luna_sis: { name: '루나 언니', portrait: 'luna_sis' },
  rab: { name: '청토끼', portrait: 'cheongtokki' },
  moka: { name: '모카', portrait: 'moka' },
});

export const PROLOGUE = Object.freeze([
  { chapter: ['PROLOGUE', '토끼 자매와 작은 글씨의 계약서'], bg: 'river_night', l: null, c: null, r: null },
  { s: 'sys', t: '[ 이 이야기는 「연이의 아틀리에」 게임 오리지널 외전입니다 ]' },
  { s: 'nar', t: '재성의 섬에서 배로 한 정거장, 사주의 강가. 시간 대신 골드가 도는 이 동네에 문 닫은 카페가 하나 있었다.' },
  { s: 'nar', t: '그리고 그 카페 문 앞에서, 하얀 아기 토끼 한 마리가 엉엉 울고 있었다.', c: 'luna:cry' },
  { s: 'yeoni', t: '어? 루나잖아! 왜 여기서 울고 있어?', l: 'yeoni:surprised' },
  { s: 'luna', t: '연이 언니이이! 우리 카페 샀어! 근데 빚도 같이 샀대!', c: 'luna:cry', fx: 'shake' },
  { s: 'yeoni', t: '(문장 앞뒤 온도 차이 별 다섯 개.)', l: 'yeoni:normal' },
  { s: 'luna_sis', t: '…연이 씨, 고양이님. 창피한 데를 보이네요. 들어와요. 의자는 먼지만 털면 앉을 수 있어요.', c: 'luna_sis:tired', r: 'neo_cat:normal', bg: 'atelier_dark' },
  { s: 'nar', t: '식은 오븐, 거미줄 친 음료 머신. 카운터 위에는 파란 토끼 도장이 꾹 찍힌 계약서 한 장.' },
  { s: 'neo_cat', t: '이 도장. 본 적 있다.', r: 'neo_cat:serious' },
  { s: 'nar', t: '그때, 창밖으로 토끼 귀가 달린 파란 비행선이 둥실 내려왔다.', fx: 'flash' },
  { s: 'rab', t: '안녕하세요~ 청토끼 금융입니다! 어머~ 새 사장님들, 벌써 손님까지 모셨네요?', c: 'cheongtokki:smile' },
  { s: 'luna', t: '사기꾼이다! 손님 열 배 된다며! 가게 넘겨받으면 빵이 저절로 팔린다며!', c: 'luna:surprised' },
  { s: 'rab', t: '어머, 사기라뇨~ 손님이 열 배 늘 \'수도\' 있다고 했죠. 0 곱하기 10도 엄연히 계산이랍니다~', c: 'cheongtokki:smug' },
  { s: 'sys', t: `[ 인수 조건: 전 주인이 남긴 빚 ${TEMP.INITIAL_DEBT.toLocaleString('ko-KR')}G를 함께 승계한다 ]` },
  { s: 'impact', t: '일억에서 딱 일 골드가 모자란다고오오?!', l: 'yeoni:surprised', fx: 'shake' },
  { s: 'yeoni', t: '이 조항 글씨 개미보다 작아! 이건 돋보기 없으면 못 읽어!', l: 'yeoni:sulky' },
  { s: 'rab', t: '작은 글씨는 원래 작게 읽는 거예요~ 이자는 아주아주 조금! 그럼 첫 상환일에 뵐게요~ 총총!', c: 'cheongtokki:smile' },
  { s: 'nar', t: '비행선은 들어올 때보다 두 배 빠르게 떠났다.', c: 'luna_sis:tired' },
  { s: 'neo_cat', t: '도망이 빠르군.', r: 'neo_cat:smug' },
  { s: 'luna_sis', t: '괜찮아요. 빵집 문 닫고, 여기서 밤새 구우면… 언젠가는 갚겠죠.', c: 'luna_sis:tired' },
  { s: 'luna', t: '언니 또 괜찮대! 언니가 괜찮다고 할 때가 제일 안 괜찮은 거야!', c: 'luna:cry' },
  { s: 'yeoni', t: '…좋아. 빚은 루나네 거지만, 이 꼴을 보고 그냥 가면 내 양심 평점이 별 마이너스야.', l: 'yeoni:determined' },
  { s: 'yeoni', t: '우리가 도울게! 나는 계산대, 영냥이는… 영냥이는 뭐 할래?', l: 'yeoni:smile' },
  { s: 'neo_cat', t: '손님 받는 건 고양이 모습으로는 못 한다.', r: 'neo_cat:serious' },
  { s: 'nar', t: '모자의 초승달이 금빛으로 번졌다. 빛이 걷히자, 그 자리에 은발의 네오가 서 있었다.', r: 'neo:normal', fx: 'glow' },
  { s: 'luna', t: '고양이님이 사람 됐어?! 이거 공짜로 봐도 돼?', c: 'luna:surprised' },
  { s: 'neo', t: '응, 공짜야. 나는 입구에서 손님들을 안내할게.', r: 'neo:smile' },
  { s: 'nar', t: '그때 문이 벌컥 열리고, 보라색 베레모를 쓴 수달이 헤드폰을 목에 건 채 들어왔다.', c: 'moka:normal' },
  { s: 'moka', t: '여기 새로 연 카페? 냉장고 열어 봐. …텅 비었네. 이 가게 재료 관리 별 하나.', c: 'moka:smug' },
  { s: 'yeoni', t: '누구세요?! 들어오자마자 별점부터 매기는 사람 처음 봐!', l: 'yeoni:surprised' },
  { s: 'moka', t: '모카. 마을에서 식재료점 해. 원두, 우유, 밀가루, 밤이슬까지. 원가는 정직, 잔소리는 무료.', c: 'moka:normal' },
  { s: 'moka', t: '영업 중에 급하면 배달도 해 줘. 대신 배달비 붙어. 수달 발도 공짜 아니거든.', c: 'moka:smug' },
  { s: 'nar', t: '루나 언니가 앞치마를 매자, 식어 있던 오븐에 작은 불꽃이 튀었다.', c: 'luna_sis:serious', fx: 'flash' },
  { s: 'luna_sis', t: '빚을 진 건 저희니까, 굽는 건 제가 할게요. 루나는 접시를 나르고 테이블을 닦고요.', c: 'luna_sis:normal' },
  { s: 'luna', t: '응! 나 접시 백 개도 나를 수 있어! 아니, 많다 개!', c: 'luna:smile' },
  { s: 'yeoni', t: '그럼 나는 계산대! 돈 세는 건 꽃돼지 전문이야, 꿀악!', l: 'yeoni:determined' },
  { s: 'neo', t: '연이는 계산이랑 가게 키우는 것만 고민해. 손은 우리가 보탤게.', r: 'neo:smile' },
  { s: 'yeoni', t: '빚은 거의 일억, 손님은 아직 한 명도… 청토끼, 계약서 글씨를 왜 그렇게 작게 쓴 거야!', l: 'yeoni:sulky' },
  { s: 'luna_sis', t: '…고마워요. 그럼 별을 하나씩 채워 볼게요. 순서 지켜서요.', c: 'luna_sis:smile' },
  { s: 'impact', t: '연이의 아틀리에, 영업 시작!', bg: 'atelier_lit', l: 'yeoni:determined', c: 'luna:smile', r: 'neo:smile' },
  { s: 'sys', t: '[ 주문을 눌러 조리하고, 완성 음식을 눌러 서빙하세요. 루나 언니가 굽고 루나가 운반하며, 연이는 계산대에서 지시합니다 ]' },
]);
