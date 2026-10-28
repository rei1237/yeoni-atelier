import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from './station-slots.js';
import {chargeLoanInterest} from './finance.js';
import {accruePayroll} from './payroll.js';
import {ensureRecordPlayer} from './music-furniture.js';
// 정규 영업: 시작 → 활성 시간 1,800초 동안 진행 → 30:00 마지막 접대 정산 → 마감 → 결산.
// 한 시뮬레이션 단계 안의 처리 순서(동시 사건 순서)는 stepShift 에 고정되어 있다.

import {arrivalMultiplier,takeawayChance} from './cafe-growth.js';
import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { emit, usableHosts, emptyStations, shiftDuration, lastAcceptAt } from './state.js';
import { checkout, setupWorld, stepStations, stepStaff, stepCustomers, spawnCustomer, customerLeave, settleClosingOrders } from './cafe.js';
import { settleDue, settleHosting, hostingVisits, stepHosting, onRequesting } from './nomination.js';
import { nextRandom, randRange, pick } from '../core/rng.js';
import { chargeInterest, advanceTurn } from './calendar.js';
import { workShift } from './bonds.js';
import { settleStress, stressOf } from './stress.js';
import { canUse } from './permissions.js';
import { delegateCheck, delegateFarm } from './farm-delegate.js';

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
  if (state.foodGifts?.job) reasons.push('여분 조리를 마치거나 취소한 뒤 문을 열어 주세요');
  if (state.people.neo?.activity !== 'idle') reasons.push('네오가 다른 활동 중입니다');
  return { ok: reasons.length === 0, reasons };
}

export function startShift(state) {
  const chk = startCheck(state);
  if (!chk.ok) return { ok: false, reason: chk.reasons[0], reasons: chk.reasons };
  // 농장 맡기기를 켜 두었으면 문을 열기 전에 네오가 밭을 한 번 돌보고 온다(사냥을 다녀온 순·이미 맡긴 순은 건너뜀)
  if (state.automation?.farm && canUse(state, 'farm')) {
    const d = delegateCheck(state);
    if (d.ok) delegateFarm(state); else emit('farmDelegateSkipped', { reason: d.reason });
  }
  const firstHostShift=state.hostbar.open&&!state.hostbar.introShiftStarted;
  if(firstHostShift)state.hostbar.introShiftStarted=true;
  state.mode = 'shift';
  state.paused = false;
  state.fever = { gauge: 0, activeUntil: null };
  state.shift = {
    id: `shift-${state.day}`, day: state.day, elapsedMs: 0, durationMs: RULES.SHIFT_MS, nominationMs: RULES.NOMINATION_MS,
    nextSpawnAt: TEMP.SPAWN_FIRST_MS, scriptIndex: firstHostShift || state.stats.shiftsCompleted === 0 ? 0 : FIRST_SHIFT_SCRIPT.length,
    sales: 0, hostFees: 0, ingredientCost: 0, baseTips: 0, feverTips: 0, servedCount: 0, lostOrders: 0, wasted: 0,
    spawnCount: 0, regularVisits: 0, nominationVisits: 0, hostings: [], autoAt: 0,
    stressStart: stressOf(state, 'neo'),
  };
  state.resting = { ...state.dayOff }; // 하루 휴무로 정한 직원은 이번 영업에 나오지 않는다
  setupWorld(state);
  emit('shiftStart', { day: state.day });
  return { ok: true };
}

function nextSpec(state) {
  const sh = state.shift;
  if(sh.spawnCount>=2 && nextRandom(state.rng)<takeawayChance(state))return {kind:'takeaway'};
  if (!state.hostbar.open) return { kind: 'regular' };
  if (sh.scriptIndex < FIRST_SHIFT_SCRIPT.length) {
    const spec = { ...FIRST_SHIFT_SCRIPT[sh.scriptIndex++] };
    if (spec.kind === 'nomination') spec.nominee = 'neo';
    return spec;
  }
  const hosts = usableHosts(state).filter(id => state.staff[id]);
  // 지명 요청은 아직 수락할 시간이 남아 있을 때만 생긴다. 지명 대상은 접대 가능한 동료뿐이다.
  const canNominate = hosts.length && sh.elapsedMs < lastAcceptAt(state) - 20000;
  if (canNominate && nextRandom(state.rng) < TEMP.NOMINATE_CHANCE) return { kind: 'nomination', nominee: pick(state.rng, hosts) };
  return { kind: 'regular' };
}

function stepSpawn(state) {
  const sh = state.shift;
  if (sh.elapsedMs >= shiftDuration(state) - TEMP.CLOSING_MS) { // 마감 준비: 새 손님은 받지 않고 직원은 정리를 시작한다
    if (sh.closingAt == null) { sh.closingAt = sh.elapsedMs; emit('closingStart'); }
    return;
  }
  if (sh.elapsedMs < sh.nextSpawnAt) return;
  const spec=nextSpec(state);
  if (!state.tables.some(t => t.state === 'empty') && spec.kind!=='takeaway') { sh.nextSpawnAt = sh.elapsedMs + 2000; return; }
  spawnCustomer(state, spec);
  // 테이블이 늘면 손님 간격이 그만큼 짧아진다(임시)
  const scale = TEMP.SPAWN_TABLE_BASE / Math.max(TEMP.SPAWN_TABLE_BASE, state.tables.length);
  sh.nextSpawnAt = sh.elapsedMs + Math.round(randRange(state.rng, ...TEMP.SPAWN_INTERVAL_MS) * scale / arrivalMultiplier(state));
}

// 한 시뮬레이션 단계(dt ≤ SIM_STEP_MS). 순서:
// 1 시간 진행 → 2 접대 종료 정산(종료 시각·테이블 순) → 3 피버 종료 → 4 접대 진행(도움 요청·평가·추가 주문)
// → 5 조리 → 6 직원 이동·운반·정리 → 7 손님 → 8 입장 → 9 자동 운영 → 10 30:00 이면 마감
export function stepShift(state, dt, autoStep) {
  const sh = state.shift;
  const step = Math.max(0, Math.min(dt, shiftDuration(state) - sh.elapsedMs));
  sh.elapsedMs += step;
  settleDue(state);
  if (state.fever.activeUntil != null && sh.elapsedMs >= state.fever.activeUntil) { state.fever.activeUntil = null; emit('feverOff'); }
  stepHosting(state);
  stepStations(state, step);
  stepStaff(state, step);
  stepCustomers(state, step, { onRequesting });
  stepSpawn(state);
  if (autoStep) autoStep(state);
  if (sh.elapsedMs >= shiftDuration(state)) closeShift(state);
}

export function closeShift(state) {
  const sh = state.shift;
  if (!sh || state.mode !== 'shift') return;
  settleDue(state); // 30:00 에 끝나는 마지막 접대를 먼저 정산
  for (const v of hostingVisits(state)) settleHosting(state, v); // (규칙상 남을 수 없지만 안전장치: 300초 미달 → 팁 없음)
  const settled = settleClosingOrders(state); // 끝까지 남은 손님의 주문도 매출에 넣는다
  for (const c of Object.values(state.customers)) if (c.state !== 'leaving') customerLeave(state, c, '영업 종료');
  for(const visit of Object.values(state.visits))checkout(state,visit); // 마감 직전 계산대 대기도 같은 원장으로 정산
  const spare = it => it && !settled.has(it.orderId) && !settled.has(it.reservedFor); // 마감 정산된 주문 몫은 버린 음식이 아니다
  let wasted = state.tray.filter(spare).length;
  for (const st of Object.values(state.stations)) wasted += runningJobs(st).filter(j => !settled.has(j.orderId)).length+stationItems(st).filter(spare).length;
  for (const s of Object.values(state.staff)) wasted += [s.carry, ...(s.carryMore || [])].filter(spare).length;
  sh.wasted = wasted;
  const settlement = {
    shiftId: sh.id, day: sh.day,
    stressStart: sh.stressStart, stressEnd: stressOf(state, 'neo'),
    sales: sh.sales, hostFees: sh.hostFees||0, ingredientCost: sh.ingredientCost, baseTips: sh.baseTips, feverTips: sh.feverTips,
    result: sh.sales + (sh.hostFees||0) + sh.baseTips + sh.feverTips - sh.ingredientCost,
    gold: state.gold, debt: state.debt,
    servedCount: sh.servedCount, lostOrders: sh.lostOrders, wasted,
    regularVisits: sh.regularVisits, nominationVisits: sh.nominationVisits, hostings: sh.hostings,
    crew: Object.fromEntries(Object.entries(state.staff).filter(([id]) => id !== 'yeoni').map(([id, s]) => [id, s.jobsTaken || 0])), // 마감 화면용: 홀 일을 맡은 횟수
  };
  if (!state.ledger.settlements[sh.id]) {
    // 하순이면 이달 이자가 나간다(한 번만)
    settlement.payroll = structuredClone(accruePayroll(state,sh));
    settlement.loanInterest=chargeLoanInterest(state,sh);
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
  settleStress(state);
  state.shift = null;
  state.day += 1;
  advanceTurn(state);
  ensureRecordPlayer(state);
  return { ok: true };
}

