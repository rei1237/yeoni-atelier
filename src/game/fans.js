// 멤버 인기·카페 무대 공연·정기 콘서트(10-28 경제 개편, 수치는 모두 TEMP.FANS·STAGE·CONCERT).
// 팬 수는 동료마다 따로 쌓이고, 인기 단계가 오를수록 그 동료를 찾는 지명이 늘고 팁·지명료 배율이 오른다.
import { TEMP } from '../config/balance.temp.js';
import { RULES } from '../config/rules.js';
import { emit } from './state.js';
import { nextRandom } from '../core/rng.js';
import { DEST1NOVA_MEMBERS } from '../data/dest1nova-profiles.js';
import { patronTipMultiplier } from '../data/customer-wealth.js';
import { priceScale, atmosphere } from './cafe-growth.js';
import { changePopularity } from './reputation.js';
import { calendarOf, apCheck, spendAp } from './calendar.js';
import { tableCount } from './town.js';
import { isResting } from './stress.js';

const F = TEMP.FANS, S = TEMP.STAGE, C = TEMP.CONCERT;
export const DEST1NOVA_IDS = Object.freeze(DEST1NOVA_MEMBERS.map(m => m.id));

export const fansOf = (state, id) => state.fans?.[id] || 0;
export const fanTier = (state, id) => F.TIERS.filter(x => fansOf(state, id) >= x).length;
export const fanTierName = (state, id) => F.NAMES[fanTier(state, id)];
export const fanMultiplier = (state, id) => 1 + fanTier(state, id) * F.TIP_PER_TIER;
export const totalFans = state => Object.values(state.fans || {}).reduce((a, b) => a + b, 0);
// 다음 단계까지 남은 팬 수(최고 단계면 null)
export const nextTierAt = (state, id) => F.TIERS[fanTier(state, id)] ?? null;

export function addFans(state, id, n, why) {
  n = Math.round(n);
  if (!id || n <= 0) return 0;
  const before = fanTier(state, id);
  state.fans = { ...state.fans, [id]: fansOf(state, id) + n };
  const tier = fanTier(state, id);
  emit('fansGain', { id, amount: n, why, tier, tierUp: tier > before ? F.NAMES[tier] : null });
  return n;
}

// 지명 확률: 접대 가능한 동료들의 인기 단계 합만큼 조금씩 오른다(상한 있음)
export const nominateChance = (state, hosts) => Math.min(F.NOMINATE_CHANCE_MAX, TEMP.NOMINATE_CHANCE + hosts.reduce((n, id) => n + fanTier(state, id), 0) * F.NOMINATE_CHANCE_PER_TIER);
// 지명 대상: 인기 단계 가중치. 모두 같은 단계면 예전 pick 과 같은 결과(난수 1회)
export function pickNominee(state, hosts) {
  const w = hosts.map(id => 1 + fanTier(state, id) * F.NOMINATE_WEIGHT_PER_TIER);
  let n = nextRandom(state.rng) * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < hosts.length; i++) { n -= w[i]; if (n < 0) return hosts[i]; }
  return hosts[hosts.length - 1];
}

// 접대 평가로 팬이 는다(정산 원장 안에서 한 번)
export const hostingFans = H => H >= 80 ? F.HOST_GREAT : H >= RULES.TIP_MIN_H ? F.HOST_GOOD : 0;

// ── 카페 무대 공연: 피버 게이지를 다 채우면 피버 대신 고를 수 있다. 영업 600초 안의 30초 구간.
export const stageActive = state => state.stage?.activeUntil != null;
const joinedMembers = state => DEST1NOVA_IDS.filter(id => id !== 'neo' && state.roster[id]);
// 오늘 출근하지 않은 멤버도 무대에는 오른다(접대·사냥 중이거나 쉬는 멤버는 제외)
export function stagePerformers(state) {
  return DEST1NOVA_IDS.filter(id => state.roster[id] && (state.people[id]?.activity ?? 'idle') === 'idle' && !isResting(state, id));
}
// 공연 세기 = 1 + 멤버마다(기본+인기 단계) + 의상 + 무대 가구(분위기·LP)
export function stagePower(state, performers) {
  const members = performers.reduce((n, id) => n + S.PER_MEMBER + fanTier(state, id) * S.PER_TIER + (state.outfits?.equipped?.[id]?.outfit ? S.PER_OUTFIT : 0), 0);
  const lp = state.interior.furniture.some(f => f.defId === 'record_player' && f.x != null) ? S.RECORD_PLAYER : 0;
  return Math.round((1 + members + Math.min(S.DECOR_CAP, atmosphere(state) / S.DECOR_PER) + lp) * 100) / 100;
}
export function stageCheck(state) {
  if (state.mode !== 'shift' || !state.shift) return { ok: false, reason: '정규 영업 중에만 무대에 오를 수 있어요' };
  if (!state.hostbar.open) return { ok: false, reason: '호스트 카페를 연 뒤에 무대를 쓸 수 있어요' };
  if (!joinedMembers(state).length) return { ok: false, reason: 'DEST1NOVA 멤버가 합류하면 무대를 열 수 있어요' };
  if (stageActive(state)) return { ok: false, reason: '무대 공연 중이에요' };
  if (state.fever.activeUntil != null) return { ok: false, reason: '피버가 끝난 뒤에 무대에 오를 수 있어요' };
  if (state.fever.gauge < RULES.FEVER_GAUGE_MAX) return { ok: false, reason: `피버 게이지 ${state.fever.gauge}/${RULES.FEVER_GAUGE_MAX}` };
  if (state.shift.durationMs - state.shift.elapsedMs < S.DURATION_MS) return { ok: false, reason: '공연을 마칠 영업 시간이 부족해요' };
  const performers = stagePerformers(state);
  if (!performers.some(id => id !== 'neo')) return { ok: false, reason: '쉬고 있는 멤버가 없어요 · 접대를 마친 뒤 다시 눌러 주세요' };
  return { ok: true, performers };
}
export function startStage(state) {
  const chk = stageCheck(state);
  if (!chk.ok) return chk;
  const sh = state.shift, now = sh.elapsedMs, power = stagePower(state, chk.performers);
  state.fever.gauge = 0;
  state.stage = { activeUntil: now + S.DURATION_MS, performers: chk.performers, power, nextThrowAt: now + S.THROW_EVERY_MS, gold: 0 };
  for (const id of chk.performers) state.people[id] = { ...state.people[id], activity: 'performing' };
  for (const v of Object.values(state.visits)) if (v.acceptAt != null && !v.settled) v.staged = power;
  sh.nextSpawnAt = Math.min(sh.nextSpawnAt, now + S.FIRST_GUEST_MS); // 공연 소문에 손님이 곧 들어온다
  sh.stages = (sh.stages || 0) + 1;
  emit('stageOn', { performers: chk.performers, power });
  return { ok: true, performers: chk.performers, power };
}
// 자리에 앉은 손님이 정해진 간격마다 꽃잎 지폐·금화를 던진다(계산서에 더해 계산대에서 받는다)
const cheering = c => c && ['thinking', 'waiting_food', 'eating', 'hosted', 'requesting'].includes(c.state);
export function stepStage(state) {
  const st = state.stage, sh = state.shift;
  if (!st || st.activeUntil == null) return;
  while (st.nextThrowAt <= Math.min(sh.elapsedMs, st.activeUntil)) {
    const per = S.THROW_BASE * priceScale(state) * st.power;
    for (const v of Object.values(state.visits)) {
      if (v.paid || v.kind === 'takeaway' || !cheering(state.customers[v.customerId])) continue;
      const g = Math.round(per * patronTipMultiplier(v.wealthId));
      v.bill = (v.bill || 0) + g; v.stageThrown = (v.stageThrown || 0) + g;
      sh.stageTips = (sh.stageTips || 0) + g; st.gold += g;
      emit('stageThrow', { tableNo: v.tableNo, gold: g });
    }
    st.nextThrowAt += S.THROW_EVERY_MS;
  }
  if (sh.elapsedMs >= st.activeUntil) endStage(state);
}
export function endStage(state) {
  const st = state.stage;
  if (!st || st.activeUntil == null) return;
  const guests = Object.values(state.customers).filter(cheering).length;
  for (const id of st.performers) {
    if (state.people[id]?.activity === 'performing') Object.assign(state.people[id], { activity: 'idle' });
    addFans(state, id, (S.FANS + guests * S.FANS_PER_GUEST) * st.power, '무대 공연');
  }
  changePopularity(state, S.POPULARITY);
  emit('stageOff', { gold: st.gold, performers: st.performers });
  state.stage = { activeUntil: null, performers: [], power: 0, gold: st.gold };
}
// 멤버가 합류하면 서빙 한 번마다 손님 응원으로 피버 게이지가 조금 찬다(피버·공연 중에는 쌓지 않는다)
export function cheerOnServe(state) {
  if (!state.hostbar.open || stageActive(state) || state.fever.activeUntil != null || !joinedMembers(state).length) return;
  state.fever.gauge = Math.min(RULES.FEVER_GAUGE_MAX, state.fever.gauge + S.GAUGE_PER_SERVE);
}
// 무대 중: 손님 입장 간격이 줄고, 접대 중이던 테이블의 팁에 공연 세기만큼 추가 팁
export const stageArrivalMultiplier = state => stageActive(state) ? S.ARRIVAL_MULT : 1;
export const stageTipExtra = (visit, base) => visit.staged ? Math.floor(base * (visit.staged - 1) * S.HOST_TIP_RATE) : 0;

// ── 정기 콘서트: 멤버가 합류한 뒤 영업 준비에서 한 달에 한 번. 티켓 수입 + 멤버 전원 팬.
export const concertMonth = state => calendarOf(state.day, state.calendar?.turnsPerMonth || 3).monthIdx;
export const concertSeats = state => C.SEATS_BASE + tableCount(state) * C.SEATS_PER_TABLE;
export function concertQuote(state) {
  const members = DEST1NOVA_IDS.filter(id => id === 'neo' || state.roster[id]);
  const tiers = members.reduce((n, id) => n + fanTier(state, id), 0);
  const ticket = Math.round(C.TICKET * priceScale(state) * (1 + tiers * C.TIER_BONUS));
  return { members, seats: concertSeats(state), ticket, gold: concertSeats(state) * ticket, fans: C.FANS };
}
export function concertCheck(state) {
  if (state.mode !== 'prep') return { ok: false, reason: '영업 준비 중에만 콘서트를 열 수 있어요' };
  if (!joinedMembers(state).length) return { ok: false, reason: 'DEST1NOVA 멤버가 합류하면 콘서트를 열 수 있어요' };
  if (state.ledger.concerts?.[concertMonth(state)]) return { ok: false, reason: '이번 달 콘서트는 이미 열었어요 · 다음 달에 다시' };
  return apCheck(state, C.AP);
}
export function holdConcert(state) {
  const chk = concertCheck(state);
  if (!chk.ok) return chk;
  const q = concertQuote(state), month = concertMonth(state);
  spendAp(state, C.AP);
  state.ledger.concerts = { ...state.ledger.concerts, [month]: { day: state.day, gold: q.gold, seats: q.seats, members: q.members } };
  state.gold += q.gold;
  for (const id of q.members) addFans(state, id, q.fans, '정기 콘서트');
  changePopularity(state, C.POPULARITY);
  emit('concertHeld', { gold: q.gold, seats: q.seats, members: q.members });
  return { ok: true, gold: q.gold, seats: q.seats, members: q.members };
}
