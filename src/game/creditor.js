// 청토끼 금융(게임 오리지널): 이자율 인상 일정과 인상 때마다 자라는 네오. 수치는 TEMP.CALENDAR(임시).
// 옛 180순 저장은 인상 없이 끝까지 기본 이자율을 쓴다(소급 벌칙 금지).
import { TEMP } from '../config/balance.temp.js';
import { bondFx } from '../data/bonds.js';
import { emit } from './state.js';

const C = TEMP.CALENDAR;
const STAT_KEYS = ['empathy', 'talk', 'fun', 'looks'];
export const monthOfDay = day => Math.floor(Math.max(0, day - 1) / C.TURNS_PER_MONTH);
export const isLegacyTerm = state => (state?.calendar?.totalTurns || C.TOTAL_TURNS) === C.LEGACY_TOTAL_TURNS;
export const rateHikes = state => isLegacyTerm(state) ? [] : C.RATE_HIKES;

// 그 달 하순에 걷는 인수 빚 이자율
export function interestRate(state, monthIdx = monthOfDay(state.day)) {
  let rate = C.INTEREST_RATE;
  for (const h of rateHikes(state)) if (h.monthIdx <= monthIdx) rate = h.rate;
  return rate;
}

export const nextHike = (state, monthIdx = monthOfDay(state.day)) => rateHikes(state).find(h => h.monthIdx > monthIdx) || null;

// 이번 달 하순 이자(루나의 검산 등 인연 감면 포함, 올림)
export function interestDue(state, monthIdx = monthOfDay(state.day)) {
  return state.debt > 0 ? Math.ceil(state.debt * interestRate(state, monthIdx) * (1 - bondFx(state).interestCut)) : 0;
}

// 이미 지난(또는 이번) 인상 중 아직 안 본 장면. 달 이야기 다음에 하나씩 튼다.
export function pendingRateStory(state) {
  const m = monthOfDay(state.day);
  const h = rateHikes(state).find(x => x.monthIdx <= m && !state.ledger.story[`rate:${x.monthIdx}`]);
  return h ? `rate:${h.monthIdx}` : null;
}

// 인상 장면을 본 순간 한 번: 네오 능력치 상승(원장 hike:<달>:neo)
export function grantHikeGrowth(state, monthIdx) {
  const key = `hike:${monthIdx}:neo`;
  if (state.ledger.rewards[key] || !rateHikes(state).some(h => h.monthIdx === monthIdx)) return false;
  state.ledger.rewards[key] = true;
  emit('neoGrowth', { monthIdx, rate: interestRate(state, monthIdx), ...neoHikeBonus(state) });
  return true;
}

// 지금까지 받은 인상 보상 합(원장에서 다시 센다: 저장에 따로 두지 않는다)
export function neoHikeBonus(state) {
  const n = rateHikes(state).filter(h => state.ledger?.rewards?.[`hike:${h.monthIdx}:neo`]).length;
  const g = C.HIKE_NEO;
  return { count: n, stats: Object.fromEntries(STAT_KEYS.map(k => [k, n * g[k]])), huntHp: n * g.huntHp, huntDmg: n * g.huntDmg };
}

// 원래 능력치 + 인상 보상(상한 10)
export function withHikeStats(state, base) {
  const b = neoHikeBonus(state);
  if (!b.count) return base;
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.min(10, v + (b.stats[k] || 0))]));
}
