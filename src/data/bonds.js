// 친밀도(인연) 데이터: 동료별 마을 장소·좋아하는 선물·단계 능력·대화 대사.
// 모두 게임 오리지널 임시 설정(docs/WORLD.md §2). 원작 능력치·설정이 아니다.
// 능력(fx)은 인연 랭크 3·6·8·10에서 하나씩 해방된다(TEMP.BONDS.PERK_RANKS).

import { TEMP } from '../config/balance.temp.js';

import { CAST_BONDS } from './cast-bonds.js';
export const BOND_IDS = Object.freeze(['neo', 'luna', 'luna_sis', 'moka', ...Object.keys(CAST_BONDS)]);

// fx 키: huntHp(사냥 HP+) huntDmg(무기 피해+) bossMoon(보스 월정석 +비율) ap(순마다 행동력+)
//        patience(음식 기다림 +비율) interestCut(이자 −비율) cookSpeed(조리 시간 −비율)
//        moonRate(환전 +비율) discount(재료값 −비율) feeCut(배달비 −비율) dailyDew(순마다 밤이슬)
//        stressResist(직원 스트레스 증가 −비율) stressRecover(휴식·쉼터·결산 회복 +비율)
//        cookSlots(설비마다 동시 조리 +건) queueSlots(설비마다 대기 +건) traySlots(픽업 선반 +칸). feeCut 1이면 배달비 0G(무료 배달)
// 자동화(홀·주방·농장) 해금은 fx가 아니라 permissions.js 가 인연 단계 + 이야기 기록으로 확인한다.
export const BONDS = Object.freeze({
  ...CAST_BONDS,
  neo: {
    name: '네오', place: 'hunt', speaker: 'neo_cat',
    gift: { id: 'tuna_churu', name: '참치 츄르', cost: 180 },
    perks: [
      { label: '백사자의 수호 · 사냥 HP +40 · 마을 대행 해금', fx: { huntHp: 40 } },
      { label: '빈틈을 읽는 눈 · 사냥 피해 +35% · 네오 홀 자동 해금', fx: { huntDmg: 0.35 } },
      { label: '달빛 전략가 · 보스 월정석 +80% · 농장 맡기기 해금', fx: { bossMoon: 0.8 } },
      { label: '함께 쓰는 내일 · 행동력 +2', fx: { ap: 2 } },
    ],
    talk: [
      ['neo_cat', '사냥터 바람이 차갑다. 그래도 네 계산대보다는 따뜻하겠지.'],
      ['neo', '연이가 오늘 장부 덮을 때 웃더라. 그거면 됐어.'],
      ['neo_cat', '검은 손은 달이 차오를수록 거세진다. 준비는 게을리하지 마라.'],
      ['neo', '츄르 얘기는… 영냥이한테 직접 해. 나는 모르는 일이야.'],
    ],
  },
  luna: {
    name: '루나', place: 'atelier', speaker: 'luna',
    gift: { id: 'star_ribbon', name: '별 리본', cost: 220 },
    perks: [
      { label: '웃음 주문 · 음식 기다림 +15% · 직원 스트레스 증가 −20%', fx: { patience: 0.15, stressResist: 0.2 } },
      { label: '쟁반 달리기 · 음식 기다림 +15% · 루나 홀 자동(서빙·정리) 해금', fx: { patience: 0.15 } },
      { label: '루나의 검산 · 월 이자 −20%', fx: { interestCut: 0.2 } },
      { label: '눈물 없는 장부 · 월 이자 −30% · 음식 기다림 +10%', fx: { interestCut: 0.3, patience: 0.1 } },
    ],
    talk: [
      ['luna', '연이 언니, 오늘 쟁반 하나도 안 떨어뜨렸어! 칭찬해 줘!'],
      ['luna', '이자 계산을 따라 해 봤는데 숫자가 자꾸 울어. 아니, 내가 우는 건가?'],
      ['luna', '손님이 웃으면 나도 웃게 돼. 연이 언니 계산대도 웃게 해 줄게!'],
      ['luna', '언니가 괜찮다고 할 때는 안 괜찮은 거래. 연이 언니가 알려 줬잖아.'],
    ],
  },
  luna_sis: {
    name: '루나 언니', place: 'luna', speaker: 'luna_sis',
    // 랭크가 하나 오를 때마다 주문 대기가 조금씩 줄어든다(능력 해방 랭크와 별도로 매 랭크).
    rankFx: { label: '랭크마다 조리 시간 −2% · 음료·오븐 대기 +1', fx: { cookSpeed: 0.02, queueSlots: 1 } },
    gift: { id: 'herb_tea', name: '꿀 허브티', cost: 200 },
    perks: [
      { label: '두 번째 냄비 · 설비마다 동시 조리 +1 · 조리 시간 −10% · 휴식 회복 +25%', fx: { cookSlots: 1, cookSpeed: 0.1, stressRecover: 0.25 } },
      { label: '한 손 더 · 동시 조리 +1 · 조리 시간 −5% · 주방 자동(대기 주문 조리) 해금', fx: { cookSlots: 1, cookSpeed: 0.05 } },
      { label: '오븐 두 칸 · 동시 조리 +1 · 픽업 선반 +2 · 월정석 환전 +10%', fx: { cookSlots: 1, traySlots: 2, moonRate: 0.1 } },
      { label: '절제의 주방 · 동시 조리 +2 · 조리 시간 −15%', fx: { cookSlots: 2, cookSpeed: 0.15 } },
    ],
    talk: [
      ['luna_sis', '반죽은 쉬게 해야 부풀어요. 저도… 조금은 쉬어 볼게요.'],
      ['luna_sis', '저울은 거짓말을 안 해요. 그래서 좋아요, 괜찮아요.'],
      ['luna_sis', '연이 씨가 계산대를 지켜 주니까 오븐 앞이 덜 무서워요.'],
      ['luna_sis', '루나가 또 울었어요? 제가 가 볼게요, 괜찮아요.'],
    ],
  },
  moka: {
    name: '모카', place: 'moka', speaker: 'moka',
    gift: { id: 'wireless_mic', name: '무선 마이크', cost: 260 },
    perks: [
      { label: '단골 할인 · 재료값 −10%', fx: { discount: 0.1 } },
      { label: '긴급 배달비 반값 · 순마다 밤이슬 1개', fx: { feeCut: 0.5, dailyDew: 1 } },
      { label: '찐단골 할인 · 재료값 −10% · 밤이슬 +1개', fx: { discount: 0.1, dailyDew: 1 } },
      { label: '평생 무료 배달 · 배달비 0G', fx: { feeCut: 0.5 } },
    ],
    talk: [
      ['moka', '오늘 우유 신선도 별 다섯. 네 장부 정리 실력은 별 셋.'],
      ['moka', '랩이라니, 포장용 랩 얘기지? 별 하나짜리 질문이네.'],
      ['moka', '밤이슬은 해 뜨기 전에 따야 해. 늦잠 자는 가게엔 안 팔아.'],
      ['moka', '네 카페 라테, 별 넷. 다섯은 아직이야. 다음 달에 다시 와.'],
    ],
  },
});

// 아무에게나 줄 수 있는 선물(좋아하는 선물보다 덜 오른다)
export const COMMON_GIFT = Object.freeze({ id: 'moon_bun', name: '달빵', cost: 120 });

// 동료마다 한 장의 아르카나(게임 오리지널, docs/WORLD.md). 연이의 타로 상담 세계관에 맞춘 인연 카드다.
export const ARCANA = Object.freeze({
  neo: ['VIII', '힘'], luna: ['XVIII', '달'], luna_sis: ['XIV', '절제'], moka: ['X', '운명의 수레바퀴'],
  yun: ['IX', '은둔자'], seohanbi: ['XX', '심판'], museong: ['IV', '황제'], solv: ['VII', '전차'],
  bambi: ['XVII', '별'], lune: ['XIX', '태양'], raven: ['XII', '매달린 사람'],
});
export const MAX_RANK = TEMP.BONDS.RANKS.length;
// 받침에 맞춘 '와/과'(윤달과, 네오와)
export const withWa = n => { const c = n.charCodeAt(n.length - 1) - 0xAC00; return n + (c >= 0 && c < 11172 && c % 28 ? '과' : '와'); };

// 점수로 닿을 수 있는 랭크(옛 저장 이전·테스트 준비용)
export const pointsRank = (v, ranks = TEMP.BONDS.RANKS) => ranks.filter(x => v >= x).length;
export const bondRank = (state, id) => Math.min(MAX_RANK, state.bondRank?.[id] || 0);
// 다음 랭크 문턱을 채웠다: 다음 대화에서 랭크 업(인연이 깊어질 것 같다)
export const bondReady = (state, id) => bondRank(state, id) < MAX_RANK && (state.affinity?.[id] || 0) >= TEMP.BONDS.RANKS[bondRank(state, id)];
// 한 사람당 한 달(3순)에 랭크는 하나만: 이번 달에 이미 올랐으면 문턱을 채워도 다음 달 대화까지 기다린다
export const bondMonth = state => Math.floor(((state.day || 1) - 1) / TEMP.CALENDAR.TURNS_PER_MONTH);
export const rankWaits = (state, id) => bondReady(state, id) && state.bondRankAt?.[id] === bondMonth(state);
// 해방된 능력 수(0~4)
export const perkTier = (state, id) => TEMP.BONDS.PERK_RANKS.filter(r => r <= bondRank(state, id)).length;

export function bondTier(v) {
  let t = 0;
  for (const x of TEMP.BONDS.TIERS) if (v >= x) t += 1;
  return t;
}

// 해방된 능력의 합(랭크 기준)
export function bondFx(state) {
  const fx = { huntHp: 0, huntDmg: 0, bossMoon: 0, ap: 0, patience: 0, interestCut: 0, cookSpeed: 0, moonRate: 0, discount: 0, feeCut: 0, dailyDew: 0, stressResist: 0, stressRecover: 0, cookSlots: 0, queueSlots: 0, traySlots: 0 };
  for (const id of BOND_IDS) {
    const t = perkTier(state, id);
    for (const p of BONDS[id].perks.slice(0, t)) for (const [k, v] of Object.entries(p.fx)) fx[k] += v;
    if(!BONDS[id].requiresRecruit || state.roster?.[id]) for (const [k, v] of Object.entries(BONDS[id].rankFx?.fx || {})) fx[k] += v * bondRank(state, id);
  }
  for (const [key, cap] of Object.entries({cookSpeed:.5,discount:.4,feeCut:1,interestCut:.5,patience:.6,stressResist:.5,stressRecover:1})) fx[key] = Math.min(cap, fx[key]);
  return fx;
}
