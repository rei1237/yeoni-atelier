// 직원 스트레스(임시 수치 TEMP.NEO_STRESS). 능력치·만족도 공식과 분리하며, 한계에 닿은 직원은 그 영업 끝까지 쉰다.
// 쉬는 직원이 들고 있던 음식은 트레이로, 닦던 테이블은 다시 정리 대기로 돌린다(cafe.js handOver). 계산은 연이가 계속한다.
// 루나 자매 인연: 루나 = 스트레스 증가 저항, 루나 언니 = 회복량 증가(bondFx stressResist / stressRecover).
import { TEMP } from '../config/balance.temp.js';
import { bondFx } from '../data/bonds.js';
import { STAFF_CREW } from '../data/companions.js';
import { emit, personName } from './state.js';
import { townCheck } from './town.js';

export const STRESS_MAX = 100;
export const stressOf = (state, id = 'neo') => state.stress?.[id] || 0;
export const isResting = (state, id = 'neo') => !!state.resting?.[id];
export const stressStage = (state, id = 'neo') => stressOf(state, id) >= STRESS_MAX || isResting(state, id) ? 'limit' : stressOf(state, id) >= 60 ? 'tired' : 'calm';
export const stressLabel = (state, id = 'neo') => ({ calm: '평온', tired: '지침', limit: '한계 · 이번 영업은 쉬어요' })[stressStage(state, id)];
// 스트레스를 받는 사람: 연이(사장·플레이어)를 뺀 가게 직원과 함께하는 동료
export const stressCrew = state => [...new Set(['neo', ...STAFF_CREW, ...Object.keys(state.roster || {})])];

export function changeStress(state, key, id = 'neo') {
  if (!stressCrew(state).includes(id)) return 0;
  const fx = bondFx(state.affinity), raw = TEMP.NEO_STRESS[key];
  const delta = raw > 0 ? raw * (1 - fx.stressResist) : raw * (1 + fx.stressRecover);
  const before = stressOf(state, id);
  const value = Math.max(0, Math.min(STRESS_MAX, Math.round((before + delta) * 10) / 10));
  state.stress = { ...state.stress, [id]: value };
  if (state.mode === 'shift' && value >= STRESS_MAX && !isResting(state, id)) {
    state.resting = { ...state.resting, [id]: true };
    emit('staffResting', { id, name: personName(state, id) });
  }
  emit('stress', { id, before, value, stage: stressStage(state, id) });
  return value - before;
}

// 결산: 모두 조금 회복하고, 이번 영업에 쉬었던(휴무 포함) 직원은 휴식 회복을 더 받는다
export function settleStress(state) {
  for (const id of stressCrew(state)) {
    if (state.dayOff?.[id]) changeStress(state, 'rest', id);
    changeStress(state, 'settle', id);
  }
  state.resting = {}; state.dayOff = {};
}

// 준비 중: 다음 영업 하루 휴무(그 영업 내내 일하지 않고 결산 때 크게 회복한다)
export function setDayOff(state, id, on) {
  if (state.mode !== 'prep') return { ok: false, reason: '영업 준비 중에만 휴무를 정할 수 있어요' };
  if (!stressCrew(state).includes(id)) return { ok: false, reason: '쉴 수 있는 직원이 아니에요' };
  const next = on ?? !state.dayOff?.[id];
  state.dayOff = { ...state.dayOff, [id]: !!next };
  if (!next) delete state.dayOff[id];
  return { ok: true, id, on: !!next };
}

// 루나의 쉼터: 골드로 한 사람을 쉬게 한다. 마을 행동력은 쓰지 않는다(순마다 한 사람 한 번).
export function shelter(state, id) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  if (!stressCrew(state).includes(id)) return { ok: false, reason: '쉼터를 쓸 수 있는 직원이 아니에요' };
  if (state.ap.sheltered?.[id]) return { ok: false, reason: `${personName(state, id)}은(는) 이번 순에 이미 쉼터에서 쉬었어요` };
  if (stressOf(state, id) <= 0) return { ok: false, reason: `${personName(state, id)}은(는) 지금 충분히 편안해요` };
  if (state.gold < TEMP.SHELTER_COST) return { ok: false, reason: `골드가 부족합니다 (${TEMP.SHELTER_COST} 필요, 보유 ${state.gold})` };
  state.gold -= TEMP.SHELTER_COST;
  state.ap.sheltered = { ...state.ap.sheltered, [id]: true };
  const delta = changeStress(state, 'shelter', id);
  emit('shelterRest', { id, name: personName(state, id), recovered: -delta });
  return { ok: true, recovered: -delta };
}
