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
  return state.debt > 0 ? Math.ceil(state.debt * interestRate(state, monthIdx) * (1 - bondFx(state).interestCut) * (1 - milestoneCut(state, monthIdx))) : 0;
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

// ── 6-1 청토끼 독촉(게임 오리지널): 약속(마일스톤)·경고·통첩·배드 엔딩. 수치는 TEMP.CALENDAR(임시).
// 하순 마감 때 이자를 걷은 직후 한 번(ledger.creditor['m<달>']) 본다. 옛 180순 저장은 보지 않는다.
const principal = state => state.startingDebt || TEMP.INITIAL_DEBT;
const lastMonth = () => C.TOTAL_TURNS / C.TURNS_PER_MONTH - 1;
export const milestoneAt = monthIdx => C.MILESTONES.find(x => x.monthIdx === monthIdx) || null;
export const milestoneTarget = (state, ms) => Math.ceil(principal(state) * ms.share);
const milestoneMet = (state, ms) => state.debt <= 0 || state.repaidTotal >= milestoneTarget(state, ms);
const ultimatumMet = (state, u) => state.debt <= 0 || state.repaidTotal >= u.target;
// 약속을 지킨 다음 달 이자는 한 번 깎아 준다
export const milestoneCut = (state, monthIdx) => state.ledger?.rewards?.[`milestone:${monthIdx - 1}`] ? C.MILESTONE_INTEREST_CUT : 0;

export function checkCreditor(state, monthIdx, rec) {
  if (!rec || isLegacyTerm(state) || state.calendar?.ended) return null;
  const book = state.ledger.creditor ??= {};
  const key = `m${monthIdx}`;
  if (book[key]) return book[key];
  const cr = state.creditor ??= { warnings: 0, ultimatum: null, lastRepaid: state.repaidTotal, lastCheck: null };
  // 그달 원금 상환이 빚에 붙은 미납 이자를 메우지 못했으면 모자란 달이다
  const repaid = state.repaidTotal - (cr.lastRepaid ?? state.repaidTotal);
  cr.lastRepaid = state.repaidTotal; cr.lastCheck = monthIdx;
  const out = { month: monthIdx, shortfall: Math.max(0, rec.added - repaid), milestone: null, scene: null };
  book[key] = out;
  const ms = milestoneAt(monthIdx);
  if (ms) {
    out.milestone = milestoneMet(state, ms);
    if (out.milestone && !state.ledger.rewards[`milestone:${monthIdx}`]) {
      state.ledger.rewards[`milestone:${monthIdx}`] = true;
      emit('milestoneMet', { monthIdx, share: ms.share, cut: C.MILESTONE_INTEREST_CUT });
    }
  }
  const u = cr.ultimatum;
  if (u) {
    if (resolveUltimatum(state)) return out;
    if (monthIdx >= u.dueMonth) { out.bad = true; endBad(state); }
    return out;
  }
  if (monthIdx < C.MILESTONES[0].monthIdx) return out; // 첫 약속 달까지는 지켜본다
  if (!(out.shortfall > 0 || out.milestone === false)) { cr.warnings = 0; return out; }
  if (cr.warnings >= 1 && monthIdx < lastMonth()) {
    const target = state.repaidTotal + Math.ceil(principal(state) * C.ULTIMATUM_SHARE);
    cr.ultimatum = { fromMonth: monthIdx, dueMonth: Math.min(monthIdx + C.ULTIMATUM_MONTHS, lastMonth()), target, startRepaid: state.repaidTotal };
    cr.warnings = 2;
    out.scene = `ultimatum:${monthIdx}`; out.need = target - state.repaidTotal; out.dueMonth = cr.ultimatum.dueMonth;
    emit('creditorUltimatum', { monthIdx, need: out.need, dueMonth: cr.ultimatum.dueMonth, turns: (cr.ultimatum.dueMonth - monthIdx) * C.TURNS_PER_MONTH });
  } else {
    cr.warnings = 1;
    out.scene = `warn:${monthIdx}`;
    emit('creditorWarning', { monthIdx, milestone: out.milestone === false });
  }
  return out;
}

// 통첩 목표를 채우면 그 자리에서 풀린다(상환 명령 뒤에 부른다)
export function resolveUltimatum(state) {
  const u = state.creditor?.ultimatum;
  if (!u || state.calendar?.ended || !ultimatumMet(state, u)) return false;
  state.creditor.ultimatum = null; state.creditor.warnings = 0;
  const book = state.ledger.creditor ??= {};
  book[`relief:${u.fromMonth}`] = { month: u.fromMonth, scene: `relief:${u.fromMonth}` };
  emit('ultimatumCleared', { monthIdx: u.fromMonth });
  return true;
}

// 기한을 넘긴 통첩: 결말과 같은 길로 끝낸다(gameEnded 한 번)
function endBad(state) {
  state.calendar = { ...state.calendar, ended: true, endingId: 'bad', endedDebt: state.debt };
  emit('gameEnded', { endingId: 'bad' });
}
export const ultimatumUnmet = state => !isLegacyTerm(state) && !!state.creditor?.ultimatum && !ultimatumMet(state, state.creditor.ultimatum);

// 아직 안 본 독촉 장면(경고·통첩·해제). 달 이야기·인상 장면 다음에 나온다.
export function pendingCreditorStory(state) {
  for (const r of Object.values(state.ledger.creditor || {})) if (r.scene && !state.ledger.story[r.scene]) return r.scene;
  return null;
}

// 금융 창·상단 표시용
export function creditorView(state) {
  if (isLegacyTerm(state) || state.calendar?.ended) return null;
  const m = monthOfDay(state.day), cr = state.creditor || {}, u = cr.ultimatum;
  const ms = C.MILESTONES.find(x => x.monthIdx >= m && !state.ledger.creditor?.[`m${x.monthIdx}`]);
  const msTarget = ms && milestoneTarget(state, ms);
  return {
    warnings: cr.warnings || 0,
    ultimatum: u ? { need: state.debt <= 0 ? 0 : Math.max(0, u.target - state.repaidTotal), dueMonth: u.dueMonth, turnsLeft: Math.max(1, (u.dueMonth + 1) * C.TURNS_PER_MONTH - state.day + 1) } : null,
    milestone: ms ? { monthIdx: ms.monthIdx, share: ms.share, target: msTarget, need: state.debt <= 0 ? 0 : Math.max(0, msTarget - state.repaidTotal) } : null,
  };
}
