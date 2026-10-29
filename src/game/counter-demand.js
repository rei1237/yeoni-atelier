// 10-29 손님 요구 · 계산대 한마디(docs/WORLD.md). 일반 손님이 계산하러 일어설 때 가끔 부탁을 하나 꺼낸다.
// 연이는 계산대에서만 응대한다. 계산 속도(payAt)는 그대로이고, 보상은 방문마다 ledger.demands에 한 번만 남긴다.
import { TEMP } from '../config/balance.temp.js';
import { nextRandom } from '../core/rng.js';
import { emit } from './state.js';
import { gainYeoni } from './yeoni-growth.js';
export const DEMAND_KINDS = Object.freeze({
  takeout: { icon: '🧁', name: '디저트 포장', ask: '남은 디저트, 포장해 주실 수 있어요?', done: '리본까지 묶어 예쁘게 싸 드렸어요' },
  fortune: { icon: '🔮', name: '운세 쪽지', ask: '오늘의 운세 쪽지 하나 받아 갈 수 있을까요?', done: '좋은 글귀가 나왔어요' },
  stamp: { icon: '🌸', name: '단골 도장', ask: '단골 도장 하나 찍어 주세요!', done: '꽃 도장 하나 더 쾅' },
  memo: { icon: '📝', name: '다음 방문 메모', ask: '다음에 올 날, 메모해 두실래요?', done: '달력에 동그라미 쳐 두었어요' },
});
const KINDS = Object.keys(DEMAND_KINDS);

// 계산 줄에 들어서는 순간 한 번만 굴린다. 지명 손님은 빼고, 마감 직전에는 새 부탁을 받지 않는다
export function maybeDemand(state, visit) {
  const D = TEMP.DEMAND, sh = state.shift;
  if (!sh || !visit || visit.kind === 'nomination' || visit.demand || state.ledger.demands?.[visit.id]) return;
  if (sh.elapsedMs > sh.durationMs - D.closeMs) return;
  if (nextRandom(state.rng) >= D.chance) return;
  const kind = KINDS[Math.floor(nextRandom(state.rng) * KINDS.length)];
  visit.demand = { kind, at: sh.elapsedMs, until: sh.elapsedMs + D.windowMs };
  emit('counterDemand', { visitId: visit.id, kind });
}

// 아직 응대할 수 있는 부탁(계산 줄에 서 있고 게이지가 다 차지 않은 손님), 먼저 꺼낸 순서
export function openDemands(state) {
  const now = state.shift?.elapsedMs ?? 0;
  return Object.values(state.customers || {}).filter(c => c.state === 'checkout').map(c => state.visits[c.visitId])
    .filter(v => v?.demand && !v.demand.result && !v.paid && now < v.demand.until && !state.ledger.demands?.[v.id])
    .sort((a, b) => a.demand.at - b.demand.at);
}
export const demandProgress = (state, visit) => Math.min(1, Math.max(0, ((state.shift?.elapsedMs ?? 0) - visit.demand.at) / TEMP.DEMAND.windowMs));

// 계산대의 「한마디 건네기」(counter.respond). visitId가 없으면 가장 먼저 꺼낸 부탁에 응대한다
export function respondDemand(state, visitId) {
  const open = openDemands(state), visit = visitId ? open.find(v => v.id === visitId) : open[0];
  if (!visit) return { ok: false, reason: '지금 계산대에 부탁한 손님이 없어요' };
  const D = TEMP.DEMAND, good = demandProgress(state, visit) < D.goodBefore;
  const tip = good ? Math.min(D.tipCap, Math.round(Math.max(0, visit.bill || 0) * D.tipRate)) : 0;
  (state.ledger.demands ||= {})[visit.id] = { kind: visit.demand.kind, result: good ? 'good' : 'ok', tip };
  visit.demand.result = good ? 'good' : 'ok';
  if (tip) { visit.bill = (visit.bill || 0) + tip; state.shift.baseTips += tip; }
  gainYeoni(state, 'counter');
  state.cafeGesture = { kind: 'cashier', at: state.shift.elapsedMs };
  emit('counterDemandDone', { visitId: visit.id, kind: visit.demand.kind, result: visit.demand.result, tip });
  return { ok: true, result: visit.demand.result, tip };
}
