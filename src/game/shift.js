// 정규 영업: 시작 → 활성 시간 1,800초 동안 진행 → 30:00 마지막 접대 정산 → 마감 → 결산.
// 한 시뮬레이션 단계 안의 처리 순서(동시 사건 순서)는 stepShift 에 고정되어 있다.

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { emit, usableHosts, emptyStations } from './state.js';
import { setupWorld, stepStations, stepStaff, stepCustomers, spawnCustomer, customerLeave } from './cafe.js';
import { settleDue, settleHosting, hostingVisits, stepHosting, onRequesting } from './nomination.js';
import { nextRandom, randRange, pick } from '../core/rng.js';
import { chargeInterest, advanceTurn } from './calendar.js';
import { workShift } from './bonds.js';

// 첫 영업의 손님 순서(온보딩): 일반 손님 → 외모 중심 지명 → 재미 중심 지명
const FIRST_SHIFT_SCRIPT = [
  { kind: 'regular' },
  { kind: 'nomination', profileId: 'looks' },
  { kind: 'nomination', profileId: 'fun' },
];

export function startCheck(state) {
  const reasons = [];
  if (state.mode !== 'prep') reasons.push(state.mode === 'hunt' ? '영냥이가 월정석 사냥 중입니다. 사냥을 마친 뒤 영업할 수 있습니다' : '영업 준비 상태가 아닙니다');
  if (state.interior.draft) reasons.push('인테리어 편집을 적용하거나 취소해 주세요');
  if (state.people.neo?.activity !== 'idle') reasons.push('네오가 다른 활동 중입니다');
  return { ok: reasons.length === 0, reasons };
}

export function startShift(state) {
  const chk = startCheck(state);
  if (!chk.ok) return { ok: false, reason: chk.reasons[0], reasons: chk.reasons };
  state.mode = 'shift';
  state.paused = false;
  state.fever = { gauge: 0, activeUntil: null };
  state.shift = {
    id: `shift-${state.day}`, day: state.day, elapsedMs: 0,
    nextSpawnAt: TEMP.SPAWN_FIRST_MS, scriptIndex: state.stats.shiftsCompleted === 0 ? 0 : FIRST_SHIFT_SCRIPT.length,
    sales: 0, ingredientCost: 0, baseTips: 0, feverTips: 0, servedCount: 0, lostOrders: 0, wasted: 0,
    spawnCount: 0, regularVisits: 0, nominationVisits: 0, hostings: [], autoAt: 0,
  };
  setupWorld(state);
  emit('shiftStart', { day: state.day });
  return { ok: true };
}

function nextSpec(state) {
  const sh = state.shift;
  if (sh.scriptIndex < FIRST_SHIFT_SCRIPT.length) {
    const spec = { ...FIRST_SHIFT_SCRIPT[sh.scriptIndex++] };
    if (spec.kind === 'nomination') spec.nominee = 'neo';
    return spec;
  }
  const hosts = usableHosts(state).filter(id => state.staff[id]);
  // 지명 요청은 아직 수락할 시간이 남아 있을 때만 생긴다. 지명 대상은 접대 가능한 동료뿐이다.
  const canNominate = hosts.length && sh.elapsedMs < RULES.LAST_ACCEPT_ELAPSED_MS - 20000;
  if (canNominate && nextRandom(state.rng) < TEMP.NOMINATE_CHANCE) return { kind: 'nomination', nominee: pick(state.rng, hosts) };
  return { kind: 'regular' };
}

function stepSpawn(state) {
  const sh = state.shift;
  if (sh.elapsedMs < sh.nextSpawnAt || sh.elapsedMs >= TEMP.LAST_SEATING_ELAPSED_MS) return;
  if (!state.tables.some(t => t.state === 'empty')) { sh.nextSpawnAt = sh.elapsedMs + 2000; return; }
  spawnCustomer(state, nextSpec(state));
  // 테이블이 늘면 손님 간격이 그만큼 짧아진다(임시)
  const scale = TEMP.SPAWN_TABLE_BASE / Math.max(TEMP.SPAWN_TABLE_BASE, state.tables.length);
  sh.nextSpawnAt = sh.elapsedMs + Math.round(randRange(state.rng, ...TEMP.SPAWN_INTERVAL_MS) * scale);
}

// 한 시뮬레이션 단계(dt ≤ SIM_STEP_MS). 순서:
// 1 시간 진행 → 2 접대 종료 정산(종료 시각·테이블 순) → 3 피버 종료 → 4 접대 진행(도움 요청·평가·추가 주문)
// → 5 조리 → 6 직원 이동·운반·정리 → 7 손님 → 8 입장 → 9 자동 운영 → 10 30:00 이면 마감
export function stepShift(state, dt, autoStep) {
  const sh = state.shift;
  const step = Math.max(0, Math.min(dt, RULES.SHIFT_MS - sh.elapsedMs));
  sh.elapsedMs += step;
  settleDue(state);
  if (state.fever.activeUntil != null && sh.elapsedMs >= state.fever.activeUntil) { state.fever.activeUntil = null; emit('feverOff'); }
  stepHosting(state);
  stepStations(state, step);
  stepStaff(state, step);
  stepCustomers(state, step, { onRequesting });
  stepSpawn(state);
  if (autoStep && (state.auto || state.autoKitchen)) autoStep(state);
  if (sh.elapsedMs >= RULES.SHIFT_MS) closeShift(state);
}

export function closeShift(state) {
  const sh = state.shift;
  if (!sh || state.mode !== 'shift') return;
  settleDue(state); // 30:00 에 끝나는 마지막 접대를 먼저 정산
  for (const v of hostingVisits(state)) settleHosting(state, v); // (규칙상 남을 수 없지만 안전장치: 300초 미달 → 팁 없음)
  for (const c of Object.values(state.customers)) if (c.state !== 'leaving') customerLeave(state, c, '영업 종료');
  let wasted = state.tray.filter(Boolean).length;
  for (const st of Object.values(state.stations)) wasted += (st.current ? 1 : 0) + (st.held ? 1 : 0);
  for (const s of Object.values(state.staff)) if (s.carry) wasted += 1;
  sh.wasted = wasted;
  const settlement = {
    shiftId: sh.id, day: sh.day,
    sales: sh.sales, ingredientCost: sh.ingredientCost, baseTips: sh.baseTips, feverTips: sh.feverTips,
    result: sh.sales + sh.baseTips + sh.feverTips - sh.ingredientCost,
    gold: state.gold, debt: state.debt,
    servedCount: sh.servedCount, lostOrders: sh.lostOrders, wasted,
    regularVisits: sh.regularVisits, nominationVisits: sh.nominationVisits, hostings: sh.hostings,
  };
  if (!state.ledger.settlements[sh.id]) {
    // 하순이면 이달 이자가 나간다(한 번만)
    settlement.interest = chargeInterest(state, sh);
    settlement.gold = state.gold; settlement.debt = state.debt;
    state.ledger.settlements[sh.id] = settlement;
    state.stats.shiftsCompleted += 1;
    workShift(state);
  }
  state.lastSettlement = state.ledger.settlements[sh.id];
  state.mode = 'settlement';
  state.fever = { gauge: 0, activeUntil: null };
  state.customers = {}; state.visits = {}; state.orders = {}; state.tasks = [];
  state.stations = emptyStations(); state.tray = Array(RULES.TRAY_SLOTS).fill(null);
  state.staff = {}; state.tables = [];
  emit('shiftClosed', { shiftId: sh.id });
}

export function closeSettlement(state) {
  if (state.mode !== 'settlement') return { ok: false, reason: '결산 화면이 아닙니다' };
  state.mode = 'prep';
  state.shift = null;
  state.day += 1;
  advanceTurn(state);
  return { ok: true };
}

