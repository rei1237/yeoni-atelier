import {changePopularity} from './reputation.js';
import {patronTipMultiplier,hostRevenueMultiplier} from '../data/customer-wealth.js';
// 지명 접대: 요청 → (수락 검사) → 수락 순간부터 해당 영업의 접대 시간 → 정산 1회 → 동료 해제.
// 요청과 수락은 다른 상태다. 요청만으로는 동료를 예약하지 않고 타이머도 시작하지 않는다.

import { RULES, STAT_KEYS } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS } from '../data/menus.js';
import { GAG_HOSTBAR, GAG_NEO_FUN, HELP_KINDS } from '../data/lines.js';
import { emit, fmtTime, hostStats, isUsableHost, personName, remainingShift, nominationDuration, lastAcceptAt } from './state.js';
import { hostingScore, gradeOf, tipFor, feverGainFor } from './satisfaction.js';
import { visitAt, customerAt, chooseMenu, placeOrder, customerLeave, sendHostToTable, sendHome, openOrdersOfVisit } from './cafe.js';
import { nextRandom } from '../core/rng.js';
import { HELP_SCENES, helpQuality, bestHelpChoice, HELP_REACTIONS } from '../data/help.js';
import { changeStress } from './stress.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 지명 대기 불만(0~20): 유예 시간 후 일정 간격마다 1점. 수락 순간 값으로 고정된다.
export function waitPenaltyAt(visit, now) {
  if (visit.acceptAt != null) return visit.waitPenalty;
  const over = Math.max(0, now - visit.requestAt - TEMP.WAIT_PENALTY_GRACE_MS);
  return clamp(Math.floor(over / TEMP.WAIT_PENALTY_PER_MS), RULES.WAIT_PENALTY_MIN, RULES.WAIT_PENALTY_MAX);
}

export function topPref(prefs) {
  return STAT_KEYS.reduce((a, k) => (prefs[k] > prefs[a] ? k : a), STAT_KEYS[0]);
}

// 예상(또는 진행 중) 접대 만족도. 음식·인테리어·의상·피버는 넣지 않는다.
export function hostingPreview(state, visit, personId = visit.nominee) {
  const stats = hostStats(state, personId);
  if (!stats) return null;
  const now = state.shift ? state.shift.elapsedMs : 0;
  const s = hostingScore({ stats, prefs: visit.prefs, talkBonus: visit.talkBonus, waitPenalty: waitPenaltyAt(visit, now) });
  return { ...s, grade: gradeOf(s.H) };
}

export function personBusyReason(state, personId) {
  const p = state.people[personId];
  if (!p) return null;
  if (p.activity === 'hosting') return `${personName(state, personId)}: ${p.tableNo}번 테이블 접대 중 · ${fmtTime(p.endAt - state.shift.elapsedMs)} 남음`;
  if (p.activity === 'hunting') return `${personName(state, personId)}: 영냥이 모습으로 월정석 사냥 중`;
  return null;
}

// 수락 가능 여부를 한 번에 모두 검사한다. 실패 이유를 모두 모아 돌려준다.
export function acceptCheck(state, tableNo) {
  const reasons = [];
  if (state.mode !== 'shift' || !state.shift) return { ok: false, reasons: ['정규 영업 중이 아닙니다'] };
  if (!state.hostbar.open) reasons.push('호스트 카페 개장 전입니다 · 5월 이야기를 먼저 확인해 주세요');
  if (state.paused) reasons.push('일시정지 중입니다');
  const visit = visitAt(state, tableNo);
  const c = customerAt(state, tableNo);
  if (!visit || visit.kind !== 'nomination') return { ok: false, reasons: [`${tableNo}번 테이블에 지명 요청이 없습니다`] };
  if (c.state === 'entering') reasons.push('손님이 아직 자리에 앉는 중입니다');
  else if (c.state !== 'requesting') reasons.push(visit.acceptAt != null ? '이미 수락된 지명입니다' : '지명 요청 상태가 아닙니다');
  const pid = visit.nominee;
  if (pid === 'neo' && (state.neoResting || state.neoStress >= 100)) reasons.push('네오가 한계에 닿아 이번 영업의 새 지명을 쉬고 있습니다');
  if (!isUsableHost(state, pid)) reasons.push(`${personName(state, pid)}은(는) 아직 접대할 수 없는 동료입니다`);
  else if (!state.staff[pid]) reasons.push(`${personName(state, pid)}은(는) 이번 영업에 출근하지 않았습니다`);
  const busy = personBusyReason(state, pid);
  if (busy) reasons.push(busy);
  const el = state.shift.elapsedMs;
  if (el > lastAcceptAt(state)) reasons.push(`${fmtTime(lastAcceptAt(state))} 이후에는 새 지명을 수락할 수 없습니다 (${nominationDuration(state) / 1000}초 전담)`);
  else if (remainingShift(state) < nominationDuration(state)) reasons.push('접대를 마칠 영업 시간이 부족합니다');
  return { ok: reasons.length === 0, reasons, visit };
}

function helpSchedule(state, visit) {
  const available = Object.keys(HELP_SCENES).filter(k => k !== 'topic');
  const first = available.splice(Math.floor(nextRandom(state.rng) * available.length), 1)[0];
  const kinds = ['topic', first, available[Math.floor(nextRandom(state.rng) * available.length)]];
  return TEMP.HELP_AT_MS.map((at, i) => ({ index: i, kind: kinds[i], at: visit.acceptAt + at, until: visit.acceptAt + at + TEMP.HELP_WINDOW_MS, status: 'pending', result: null }));
}

function orderLimit(state, visit) {
  return Math.min(remainingShift(state), visit.endAt - state.shift.elapsedMs);
}

export function accept(state, tableNo) {
  const chk = acceptCheck(state, tableNo);
  if (!chk.ok) return { ok: false, reason: chk.reasons[0], reasons: chk.reasons };
  const visit = chk.visit;
  const c = customerAt(state, tableNo);
  const now = state.shift.elapsedMs;
  visit.waitPenalty = waitPenaltyAt(visit, now);
  visit.acceptAt = now;
  visit.endAt = now + nominationDuration(state); // 이동 연출을 포함한 수락 시점부터
  visit.help = helpSchedule(state, visit);
  const pid = visit.nominee;
  if (pid === 'neo') changeStress(state, 'accept');
  Object.assign(state.people[pid], { activity: 'hosting', visitId: visit.id, tableNo, endAt: visit.endAt });
  c.state = 'hosted';
  sendHostToTable(state, pid, tableNo);
  const menuId = chooseMenu(state, orderLimit(state, visit),visit);
  if (menuId) placeOrder(state, visit, menuId);
  if (c && nextRandom(state.rng) < 0.25) visit.gag = 'hostbar';
  emit('nominationAccepted', { tableNo, nominee: pid, endAt: visit.endAt, gag: visit.gag ? GAG_HOSTBAR : null });
  return { ok: true };
}

// 요청을 받지 않거나(거절) 손님이 기다리다 지치면 일반 식사로 바뀐다. 접대 만족도는 '해당 없음'.
export function convertToRegular(state, c, visit, why) {
  visit.kind = 'regular';
  visit.nominee = null;
  visit.outcome = why;
  c.state = 'thinking';
  c.orderAt = state.shift.elapsedMs + TEMP.ORDER_THINK_MS;
  state.shift.regularVisits += 1;
  emit('nominationConverted', { tableNo: c.tableNo, why });
}

export function decline(state, tableNo) {
  const c = customerAt(state, tableNo);
  const visit = visitAt(state, tableNo);
  if (!visit || visit.kind !== 'nomination' || c.state !== 'requesting') return { ok: false, reason: `${tableNo}번 테이블에 대기 중인 지명 요청이 없습니다` };
  convertToRegular(state, c, visit, '지명 거절 → 일반 식사');
  return { ok: true };
}

// 다른 동료 추천(영입 후 쓰는 구조). 접대 가능한 동료가 없으면 화면에 나타나지 않는다.
export function propose(state, tableNo, personId) {
  const c = customerAt(state, tableNo);
  const visit = visitAt(state, tableNo);
  if (!visit || visit.kind !== 'nomination' || c.state !== 'requesting') return { ok: false, reason: '대기 중인 지명 요청이 없습니다' };
  if (personId === visit.nominee) return { ok: false, reason: '이미 지명된 동료입니다' };
  if (!isUsableHost(state, personId) || !state.staff[personId]) return { ok: false, reason: '추천할 수 있는 동료가 아닙니다' };
  visit.nominee = personId;
  emit('nominationProposed', { tableNo, personId });
  return { ok: true };
}

export function respondHelp(state, visitId, index, choice) {
  const visit = state.visits[visitId];
  if (!visit || visit.acceptAt == null || visit.settled) return { ok: false, reason: '진행 중인 접대가 아닙니다' };
  const h = visit.help[index];
  if (!h || h.status !== 'open') return { ok: false, reason: '응답할 수 있는 도움 요청이 없습니다' };
  if (state.shift.elapsedMs >= h.until) return { ok: false, reason: '응답 시간이 지났습니다' };
  const quality = helpQuality(h.kind, visit.prefs, choice);
  if (!quality) return { ok: false, reason: '없는 대응입니다' };
  const gain = quality === 'good' ? TEMP.HELP_GAIN_GOOD : quality === 'okay' ? TEMP.HELP_GAIN_OK : TEMP.HELP_MISS;
  const gag = h.kind === 'topic' && choice === 'fun' && visit.nominee === 'neo' ? GAG_NEO_FUN : null;
  if (visit.nominee === 'neo' && quality !== 'okay') changeStress(state, quality === 'good' ? 'good' : 'wrong');
  if (h.kind === 'photo' && quality === 'good' && !visit.feverSpecialDone) {
    visit.feverSpecialDone = true;
    addFever(state, RULES.FEVER_GAIN_SPECIAL, '특별 요청');
  }
  visit.talkBonus = clamp(visit.talkBonus + gain, RULES.TALK_BONUS_MIN, RULES.TALK_BONUS_MAX);
  changePopularity(state,quality==='good'?1:quality==='wrong'?-.8:0);
  h.status = 'done';
  h.result = quality;
  emit('helpDone', { tableNo: visit.tableNo, kind: h.kind, gain, quality, hint: HELP_SCENES[h.kind].choices.find(([id])=>id===bestHelpChoice(h.kind,visit.prefs))?.[1], gag, nominee: visit.nominee, reaction: HELP_REACTIONS[quality] });
  return { ok: true, gain };
}

export function addFever(state, n, why) {
  const before = state.fever.gauge;
  state.fever.gauge = clamp(before + n, 0, RULES.FEVER_GAUGE_MAX);
  if (state.fever.gauge !== before) emit('feverGain', { amount: state.fever.gauge - before, why });
}

export function hostingVisits(state) {
  return Object.values(state.visits).filter(v => v.acceptAt != null && !v.settled);
}

export function feverCandidates(state) {
  return hostingVisits(state)
    .map(v => ({ v, H: hostingPreview(state, v).H }))
    .filter(x => x.H >= RULES.TIP_MIN_H)
    .sort((a, b) => b.H - a.H)
    .slice(0, RULES.FEVER_MAX_TABLES);
}

export function feverCheck(state) {
  if (state.mode !== 'shift') return { ok: false, reason: '정규 영업 중에만 쓸 수 있습니다' };
  if (state.fever.activeUntil != null) return { ok: false, reason: `피버 진행 중 · ${fmtTime(state.fever.activeUntil - state.shift.elapsedMs)} 남음` };
  if (state.fever.gauge < RULES.FEVER_GAUGE_MAX) return { ok: false, reason: `피버 게이지 ${state.fever.gauge}/${RULES.FEVER_GAUGE_MAX}` };
  const list = feverCandidates(state);
  if (!list.length) return { ok: false, reason: '만족도 60 이상으로 접대 중인 테이블이 없어 피버를 쓸 수 없습니다' };
  return { ok: true, list };
}

// 게이지 100을 모두 쓰고 20초 동안 대상 테이블(최대 3)의 팁을 2배로 만든다. 만족도 자체는 바꾸지 않는다.
export function activateFever(state) {
  const chk = feverCheck(state);
  if (!chk.ok) return chk;
  state.fever.gauge = 0;
  state.fever.activeUntil = state.shift.elapsedMs + RULES.FEVER_DURATION_MS;
  for (const { v } of chk.list) v.fevered = true;
  emit('feverOn', { tables: chk.list.map(x => x.v.tableNo) });
  return { ok: true, tables: chk.list.map(x => x.v.tableNo) };
}

// 접대 정산(방문당 1회). 해당 영업의 접대 시간을 모두 채웠을 때만 팁이 생긴다.
export function settleHosting(state, visit) {
  if (visit.settled) return;
  const now = state.shift.elapsedMs;
  const pid = visit.nominee;
  const score = hostingScore({ stats: hostStats(state, pid), prefs: visit.prefs, talkBonus: visit.talkBonus, waitPenalty: visit.waitPenalty });
  const completedFull = now >= visit.endAt;
  const tip = tipFor({ servedTotal: visit.servedTotal, H: score.H, completedFull, fevered: visit.fevered, multiplier: patronTipMultiplier(visit.wealthId)*hostRevenueMultiplier(pid) });
  visit.settled = true;
  visit.finalH = score.H;
  visit.finalScore = score;
  visit.tip = tip;
  if (state.ledger.tips[visit.id] == null) {
    state.ledger.tips[visit.id] = tip.total;
    visit.bill=(visit.bill||0)+tip.total;
    changePopularity(state,score.H>=80?2:score.H<40?-1:0);
    state.shift.baseTips += tip.base;
    state.shift.feverTips += tip.feverExtra;
    if (visit.wealthId==='tycoon' && completedFull && score.H>=80 && tip.total>=100) {
      addFever(state, RULES.FEVER_GAUGE_MAX, '대부호의 앙코르 팁');
      const candidates=feverCandidates(state);
      state.fever.gauge=0;
      state.fever.activeUntil=now+RULES.FEVER_DURATION_MS;
      for(const {v} of candidates)v.fevered=true;
      emit('feverOn',{tables:candidates.map(x=>x.v.tableNo),tycoon:true,tip:tip.total});
    }
  }
  const grade = gradeOf(score.H);
  const foodAvg = visit.foodScores.length ? Math.round(visit.foodScores.reduce((a, b) => a + b, 0) / visit.foodScores.length) : null;
  state.shift.hostings.push({ visitId: visit.id, tableNo: visit.tableNo, nominee: pid, profileId: visit.profileId, H: score.H, M: score.M, capped: score.capped, grade: grade.label, food: foodAvg, servedTotal: visit.servedTotal, tip: tip.total, feverExtra: tip.feverExtra });
  Object.assign(state.people[pid], { activity: 'idle', visitId: null, tableNo: null, endAt: null });
  const s = state.staff[pid];
  if (s) { s.action = 'react'; sendHome(state, s); }
  const c = state.customers[visit.customerId];
  if (c && c.state !== 'leaving') { c.action = 'react'; customerLeave(state, c, '접대 종료'); }
  emit('hostingSettled', { tableNo: visit.tableNo, H: score.H, grade: grade.label, tip: tip.total, feverExtra: tip.feverExtra, capped: score.capped });
}

// 같은 시각의 접대 종료는 종료 시각 → 테이블 번호 순으로 처리한다.
export function settleDue(state) {
  const now = state.shift.elapsedMs;
  const due = hostingVisits(state).filter(v => v.endAt <= now).sort((a, b) => a.endAt - b.endAt || a.tableNo - b.tableNo);
  for (const v of due) settleHosting(state, v);
}

// 수락 기준 경과에 따른 접대 진행: 도움 요청 열기·만료, 첫 평가(피버 적립), 추가 주문
export function stepHosting(state) {
  const now = state.shift.elapsedMs;
  for (const v of hostingVisits(state)) {
    for (const h of v.help) {
      if (h.status === 'pending' && now >= h.at) { h.status = 'open'; emit('helpOpen', { tableNo: v.tableNo, kind: h.kind, label: HELP_KINDS[h.kind].label }); }
      if (h.status === 'open' && now >= h.until) {
        h.status = 'missed'; h.result = 'miss';
        if (v.nominee === 'neo') changeStress(state, 'missed');
        v.talkBonus = clamp(v.talkBonus + TEMP.HELP_MISS, RULES.TALK_BONUS_MIN, RULES.TALK_BONUS_MAX);
        emit('helpMissed', { tableNo: v.tableNo });
      }
    }
    if (!v.feverEvalDone && now >= v.acceptAt + TEMP.FEVER_EVAL_AT_MS) {
      v.feverEvalDone = true;
      const H = hostingPreview(state, v).H;
      v.evalH = H;
      const g = feverGainFor(H);
      if (g) addFever(state, g, `${v.tableNo}번 접대 평가`);
      if(state.fever.activeUntil>now && H>=RULES.TIP_MIN_H && hostingVisits(state).filter(x=>x.fevered).length<RULES.FEVER_MAX_TABLES)v.fevered=true;
    }
    if (!v.extraOrderDone && now >= v.acceptAt + TEMP.EXTRA_ORDER_AT_MS) {
      v.extraOrderDone = true;
      const menuId = openOrdersOfVisit(state, v).length < 2 ? chooseMenu(state, orderLimit(state, v),v) : null;
      if (menuId) placeOrder(state, v, menuId);
    }
  }
}

// 지명 요청 대기: 오래 두면 일반 식사로 전환
export function onRequesting(state, c, visit, now) {
  if (now - visit.requestAt >= TEMP.NOMINATION_PATIENCE_MS) convertToRegular(state, c, visit, '지명 대기 시간 초과 → 일반 식사');
}



