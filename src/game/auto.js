import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from './station-slots.js';
// 자동 운영: 사람이 누르는 것과 같은 명령만 낸다(run(cmd)). 상태를 직접 바꾸지 않는다.
// 홀 자동(루나·네오 각자 인연) = 그 직원의 서빙·정리, 주방 자동(루나 언니 인연) = 대기 주문 조리. 둘 다 permissions.js 권한과 켜짐을 함께 본다.
// 담당 직원이 쉬는 중이면 그 자동은 멈추고(automationStatus 가 사유를 알려 준다), 재료가 없는 주문은 건너뛴다.
// 전체 자동(state.auto)은 시뮬·테스트 전용이며 1)~3) 접대 판단까지 한다.
// 지명 수락 조건: 실제 요청 + 예상 H ≥ 60 + 남은 시간 ≥ 60초 + 동료 대기 중. 재미 중심 요청은 수락하지 않는다.

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS } from '../data/menus.js';
import { PEOPLE } from '../data/companions.js';
import { bestHelpChoice } from '../data/help.js';
import { acceptCheck, hostingPreview, topPref, feverCheck, hostingVisits } from './nomination.js';
import { findServeTarget, stockCheck, staffAvailable } from './cafe.js';
import { ABILITIES, HALL_ABILITIES, abilityCheck, automationOn, museongKitchenActive } from './permissions.js';
import { stageCheck } from './fans.js';

// 화면 표시용(상태를 바꾸지 않는다): 잠김·꺼짐·멈춤 사유와 지금 돌아가는지
export function automationStatus(state, ability) {
  const a = ABILITIES[ability], chk = abilityCheck(state, ability);
  if (!chk.ok) return { locked: true, on: false, running: false, reason: chk.reason };
  const on = !!state.automation?.[ability];
  if (!on) return { locked: false, on, running: false, reason: '꺼져 있어요' };
  if (ability === 'museong_kitchen') return {locked:false,on,running:museongKitchenActive(state),reason:state.mode !== 'shift' ? '영업 준비 중 · 직원 배치에서 무성을 출근시켜 주세요' : museongKitchenActive(state) ? '루나 언니의 조리를 돕고 있어요' : '출근과 휴무 상태를 확인해 주세요'};
  if (state.resting?.[a.id] || state.dayOff?.[a.id]) return { locked: false, on, running: false, reason: `${PEOPLE[a.id]?.name || a.id}이(가) 지쳐 쉬는 중이라 멈췄어요` };
  if(HALL_ABILITIES.includes(ability) && state.mode==='shift' && !staffAvailable(state,a.id))return {locked:false,on,running:false,reason:state.staff?.[a.id]?.job?.kind==='deliver'||state.staff?.[a.id]?.job?.kind==='clean'?'맡은 홀 일을 마치는 중이에요':'접대·다른 활동 중이거나 출근하지 않아 기다려요'};
  if (ability === 'kitchen' && state.mode === 'shift') {
    const blocked = Object.values(state.orders).filter(o => o.status === 'waiting' && !stockCheck(state, o.menuId).ok);
    if (blocked.length) return { locked: false, on, running: true, reason: `재료가 모자란 주문 ${blocked.length}건은 멈춰 있어요 · 모카 긴급 배달` };
  }
  return { locked: false, on, running: true, reason: '돌아가는 중' };
}

export function autoAcceptDecision(state, tableNo) {
  const chk = acceptCheck(state, tableNo);
  if (!chk.visit) return { accept: false, why: chk.reasons[0] };
  const pv = hostingPreview(state, chk.visit);
  if (!pv || pv.H < RULES.TIP_MIN_H) return { accept: false, decline: true, why: `예상 만족 ${pv ? pv.H.toFixed(1) : '-'} < 60` };
  if (!chk.ok) return { accept: false, why: chk.reasons[0] };
  return { accept: true, H: pv.H };
}

export function autoStep(state, run) {
  const sh = state.shift;
  if (sh.elapsedMs < sh.autoAt) return;
  sh.autoAt = sh.elapsedMs + TEMP.AUTO_DECIDE_MS;

  const full = !!state.auto;
  // 1) 지명 요청
  if (full) for (const v of Object.values(state.visits)) {
    const c = state.customers[v.customerId];
    if (!c || v.kind !== 'nomination' || c.state !== 'requesting') continue;
    const d = autoAcceptDecision(state, v.tableNo);
    if (d.accept) run({ type: 'nomination.accept', tableNo: v.tableNo });
    else if (d.decline) run({ type: 'nomination.decline', tableNo: v.tableNo });
  }
  // 2) 접대 도움 요청
  if (full) for (const v of hostingVisits(state)) {
    v.help.forEach((h, i) => {
      if (h.status !== 'open') return;
      run({ type: 'help.respond', visitId: v.id, index: i, choice: bestHelpChoice(h.kind, v.prefs) });
    });
  }
  // 3) 피버: 멤버가 쉬고 있으면 무대 공연을 먼저 고른다(시뮬 봇은 autoFever 로 끌 수 있다)
  const fv = state.autoFever ?? 'stage';
  if (full && fv === 'stage' && stageCheck(state).ok) run({ type: 'stage.perform' });
  else if (full && fv !== 'off' && feverCheck(state).ok) run({ type: 'fever.activate' });
  // 수동 영업에서는 조리·서빙·정리 모두 플레이어가 누른다(정리 = 빈 테이블 탭). 아래는 자동 모드에서만 명령한다.
  const hall = full || HALL_ABILITIES.some(key=>automationOn(state,key) && staffAvailable(state,ABILITIES[key].id));
  const kitchen = automationOn(state, 'kitchen') && (full || !state.resting?.[ABILITIES.kitchen.id]);
  if (hall) for (const t of state.tables) if (t.state === 'dirty' && !t.cleanQueued) run({ type: 'clean', tableNo: t.no, autoHall:!full });
  if (kitchen) for (const o of Object.values(state.orders)) if (o.status === 'waiting' && state.visits[o.visitId]?.kind === 'takeaway' && stockCheck(state, o.menuId).ok) run({ type: 'order.quick', orderId: o.id });
  // 4) 서빙
  if (hall) for (const it of state.tray) {
    if (!it || it.reservedFor) continue;
    const t = findServeTarget(state, it);
    if (t != null) run({ type: 'serve', itemId: it.id, tableNo: t, autoHall:!full });
  }
  // 6) 조리: 대기 주문 중 트레이·조리 중인 것으로 아직 덮이지 않은 메뉴
  if (!kitchen) return;
  const supply = {},bound=new Set();
  const add = item => {if(item.orderId)bound.add(item.orderId);else supply[item.menuId]=(supply[item.menuId]||0)+1;};
  for (const it of state.tray) if (it && !it.reservedFor) add(it);
  for (const st of Object.values(state.stations)) for (const j of [...stationJobs(st),...stationItems(st)]) if (j) add(j);
  const waiting = Object.values(state.orders).filter(o => o.status === 'waiting').sort((a, b) => a.placedAt - b.placedAt);
  for (const o of waiting) {
    if(bound.has(o.id))continue;
    if (supply[o.menuId] > 0) { supply[o.menuId] -= 1; continue; }
    const st = state.stations[MENUS[o.menuId].station];
    if (!stockCheck(state, o.menuId).ok) continue;
    run({ type: 'order.quick', orderId: o.id }); // 이 작업이 이 주문을 덮는다
  }
}
