// 친밀도(인연) 데이터: 동료별 마을 장소·좋아하는 선물·단계 능력·대화 대사.
// 모두 게임 오리지널 임시 설정(docs/WORLD.md §2). 원작 능력치·설정이 아니다.
// 능력(fx)은 단계가 열릴 때마다 더해진다. 문턱은 TEMP.BONDS.TIERS.

import { TEMP } from '../config/balance.temp.js';

import { CAST_BONDS } from './cast-bonds.js';
export const BOND_IDS = Object.freeze(['neo', 'luna', 'luna_sis', 'moka', ...Object.keys(CAST_BONDS)]);

// fx 키: huntHp(사냥 HP+) huntDmg(무기 피해+) bossMoon(보스 월정석 +비율) ap(순마다 행동력+)
//        patience(음식 기다림 +비율) interestCut(이자 −비율) cookSpeed(조리 시간 −비율)
//        moonRate(환전 +비율) discount(재료값 −비율) feeCut(배달비 −비율) dailyDew(순마다 밤이슬)
export const BONDS = Object.freeze({
  ...CAST_BONDS,
  neo: {
    name: '네오', place: 'hunt', speaker: 'neo_cat',
    gift: { id: 'tuna_churu', name: '참치 츄르', cost: 180 },
    perks: [
      { label: '사냥 시작 HP +20', fx: { huntHp: 20 } },
      { label: '사냥 무기 피해 +15%', fx: { huntDmg: 0.15 } },
      { label: '보스 월정석 +50%', fx: { bossMoon: 0.5 } },
      { label: '순마다 행동력 +1', fx: { ap: 1 } },
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
      { label: '손님이 음식을 10% 더 기다려 줌', fx: { patience: 0.1 } },
      { label: '손님이 음식을 15% 더 기다려 줌', fx: { patience: 0.15 } },
      { label: '루나의 검산: 월 이자 −10%', fx: { interestCut: 0.1 } },
      { label: '루나의 검산: 월 이자 −15%', fx: { interestCut: 0.15 } },
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
    gift: { id: 'herb_tea', name: '꿀 허브티', cost: 200 },
    perks: [
      { label: '조리 시간 −8%', fx: { cookSpeed: 0.08 } },
      { label: '조리 시간 −8%', fx: { cookSpeed: 0.08 } },
      { label: '저울 손질: 월정석 환전 +10%', fx: { moonRate: 0.1 } },
      { label: '조리 시간 −9%', fx: { cookSpeed: 0.09 } },
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
      { label: '단골 할인: 재료값 −5%', fx: { discount: 0.05 } },
      { label: '긴급 배달비 반값', fx: { feeCut: 0.5 } },
      { label: '순마다 밤이슬 1개 선물', fx: { dailyDew: 1 } },
      { label: '찐단골 할인: 재료값 −10%', fx: { discount: 0.1 } },
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

export function bondTier(v) {
  let t = 0;
  for (const x of TEMP.BONDS.TIERS) if (v >= x) t += 1;
  return t;
}

// 열린 능력의 합
export function bondFx(affinity = {}) {
  const fx = { huntHp: 0, huntDmg: 0, bossMoon: 0, ap: 0, patience: 0, interestCut: 0, cookSpeed: 0, moonRate: 0, discount: 0, feeCut: 0, dailyDew: 0 };
  for (const id of BOND_IDS) {
    const t = bondTier(affinity[id] || 0);
    for (const p of BONDS[id].perks.slice(0, t)) for (const [k, v] of Object.entries(p.fx)) fx[k] += v;
  }
  for (const [key, cap] of Object.entries({cookSpeed:.5,discount:.4,feeCut:.75,interestCut:.5,patience:.6})) fx[key] = Math.min(cap, fx[key]);
  return fx;
}
