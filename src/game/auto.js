// 자동 운영: 사람이 누르는 것과 같은 명령만 낸다(run(cmd)). 상태를 직접 바꾸지 않는다.
// 주방 자동(state.autoKitchen, 기본 켜짐) = 4) 서빙 5) 정리 6) 조리만 한다. 전체 자동(state.auto)은 1)~3) 접대 판단까지 한다.
// 지명 수락 조건: 실제 요청 + 예상 H ≥ 60 + 남은 시간 ≥ 300초 + 동료 대기 중. 재미 중심 요청은 수락하지 않는다.

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS } from '../data/menus.js';
import { acceptCheck, hostingPreview, topPref, feverCheck, hostingVisits } from './nomination.js';
import { findServeTarget, stockCheck } from './cafe.js';

export function autoAcceptDecision(state, tableNo) {
  const chk = acceptCheck(state, tableNo);
  if (!chk.visit) return { accept: false, why: chk.reasons[0] };
  const pv = hostingPreview(state, chk.visit);
  if (topPref(chk.visit.prefs) === 'fun' || chk.visit.profileId === 'fun') return { accept: false, decline: true, why: '재미 중심 요청(네오의 재미 0 → 만족 불가)' };
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
      run({ type: 'help.respond', visitId: v.id, index: i, choice: h.kind === 'topic' ? topPref(v.prefs) : h.kind });
    });
  }
  // 3) 피버
  if (full && feverCheck(state).ok) run({ type: 'fever.activate' });
  // 4) 서빙
  for (const it of state.tray) {
    if (!it || it.reservedFor) continue;
    const t = findServeTarget(state, it);
    if (t != null) run({ type: 'serve', itemId: it.id, tableNo: t });
  }
  // 5) 정리
  for (const t of state.tables) if (t.state === 'dirty' && !t.cleanQueued) run({ type: 'clean', tableNo: t.no });
  // 6) 조리: 대기 주문 중 트레이·조리 중인 것으로 아직 덮이지 않은 메뉴
  const supply = {};
  const add = id => { supply[id] = (supply[id] || 0) + 1; };
  for (const it of state.tray) if (it && !it.reservedFor) add(it.menuId);
  for (const st of Object.values(state.stations)) for (const j of [st.current, st.next, st.held]) if (j) add(j.menuId);
  const waiting = Object.values(state.orders).filter(o => o.status === 'waiting').sort((a, b) => a.placedAt - b.placedAt);
  for (const o of waiting) {
    if (supply[o.menuId] > 0) { supply[o.menuId] -= 1; continue; }
    const st = state.stations[MENUS[o.menuId].station];
    if (st.next || !stockCheck(state, o.menuId).ok) continue;
    run({ type: 'cook', menuId: o.menuId }); // 이 작업이 이 주문을 덮는다
  }
}
