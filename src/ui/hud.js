// 상단 바·하단 패널·테이블 말풍선·테이블 터치 영역의 HTML. 상태를 읽기만 한다.
// 모든 표시는 글자 + 아이콘 + 시간으로 쓴다(색만으로 구분하지 않는다).

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
import { GEAR } from '../data/gear.js';
import { FURNITURE } from '../data/layout.js';
import { HELP_KINDS } from '../data/lines.js';
import { fmtTime, personName, remainingShift, usableHosts } from '../game/state.js';
import { STATION_NAMES, findServeTarget, openOrdersOfVisit, staffStatusText } from '../game/cafe.js';
import { feverCheck, personBusyReason } from '../game/nomination.js';
import { startCheck } from '../game/shift.js';
import { huntCheck } from '../game/hunt.js';
import { WEAPONS, PASSIVES } from '../data/hunt-kit.js';
import { debtStage } from '../game/economy.js';
import { preview as interiorPreview } from '../game/interior.js';
import { cellToPx } from '../render/cafe-view.js';
import { btn, esc } from './dom.js';

const won = n => `${Math.floor(n).toLocaleString('ko-KR')}G`;

// ── 상단 바
export function topbarHtml(state, ui) {
  const dev = ui.dev ? '<span class="tag dev">DEV</span>' : '';
  if (!state) return `<div class="tb-col"><span class="clock">연이의 아틀리에</span></div>${dev}`;
  const gold = `<span class="gold" aria-label="골드">🪙 ${won(state.gold)}</span>`;
  if (state.mode === 'shift') {
    const sh = state.shift;
    const st = [];
    if (state.paused) st.push('⏸ 일시정지');
    if (state.fever.activeUntil != null) st.push(`🔥 피버 ${fmtTime(state.fever.activeUntil - sh.elapsedMs)}`);
    if (state.auto) st.push('🤖 자동 운영');
    else if (state.autoKitchen) st.push('🍳 주방 자동');
    if (sh.elapsedMs > RULES.LAST_ACCEPT_ELAPSED_MS) st.push('지명 수락 마감');
    if (!st.length) st.push(`Day ${state.day} 영업 중`);
    if (ui.dev && ui.speed !== 1) st.push(`×${ui.speed}`);
    return `<div class="tb-col"><span class="clock" aria-label="남은 영업 시간">⏱ ${fmtTime(remainingShift(state))}</span><span class="small muted">경과 ${fmtTime(sh.elapsedMs)} / 30:00</span></div>
      ${gold}<span class="status">${esc(st.join(' · '))}</span>${dev}
      ${btn({ action: 'pause', label: state.paused ? '▶' : '⏸', title: state.paused ? '계속하기' : '일시정지', cls: 'ghost' })}`;
  }
  if (state.mode === 'hunt') {
    const h = state.hunt;
    const pct = Math.max(0, Math.round(h.hp / h.maxHp * 100));
    const xpPct = h.xpNext ? Math.min(100, Math.round((h.xp || 0) / h.xpNext * 100)) : 0;
    return `<div class="tb-col"><span class="clock" aria-label="남은 사냥 시간">🐾 ${fmtTime(h.durationMs - h.elapsedMs)}</span><span class="small muted">🌙 ${h.bag.moonstone || 0} · 월정석 사냥</span></div>
      <div class="tb-col"><span class="small">HP ${h.hp}/${h.maxHp}</span><span class="hpbar" role="img" aria-label="체력 ${pct}%"><i style="width:${pct}%"></i></span></div>
      <div class="tb-col"><span class="small">Lv ${h.level ?? 1}</span><span class="xpbar" role="img" aria-label="경험치 ${xpPct}%"><i style="width:${xpPct}%"></i></span></div>
      <span class="status">${state.paused ? '⏸ 일시정지' : ui.dev && ui.speed !== 1 ? `×${ui.speed}` : ''}</span>${dev}
      ${btn({ action: 'pause', label: state.paused ? '▶' : '⏸', title: state.paused ? '계속하기' : '일시정지', cls: 'ghost' })}`;
  }
  const label = state.mode === 'settlement' ? '결산' : state.interior.draft ? '인테리어 편집' : '영업 준비';
  return `<div class="tb-col"><span class="clock">Day ${state.day}</span><span class="small muted">${label}</span></div>
    ${gold}<span class="status">🌙 ${state.moonstone || 0} · 빚 ${won(state.debt)}</span>${dev}
    ${btn({ action: 'sheet.open', args: { sheet: 'more' }, label: '☰', title: '기타 메뉴', cls: 'ghost' })}`;
}

// ── 하단 패널
export function panelHtml(state, ui) {
  if (!state) return '';
  if (state.mode === 'shift') return shiftPanel(state, ui);
  if (state.mode === 'hunt') return huntPanel(state);
  if (state.mode === 'settlement') return `<div class="prep">${btn({ action: 'overlay.settlement', label: '📒 결산 보기', cls: 'primary big' })}</div>`;
  if (state.interior.draft) return interiorPanel(state);
  return prepPanel(state);
}

function navRow(items) {
  return `<div class="nav">${items.map(([sheet, label]) => btn({ action: 'sheet.open', args: { sheet }, label })).join('')}</div>`;
}

function shiftPanel(state, ui) {
  const slots = state.tray.map((it, i) => {
    if (!it) return `<button type="button" class="slot empty" data-action="tray.tap" data-i="${i}" data-key="slot${i}" aria-label="트레이 ${i + 1}번 빈 칸">빈 칸</button>`;
    const m = MENUS[it.menuId];
    const target = it.reservedFor ? null : findServeTarget(state, it);
    const to = it.reservedFor ? '🚶 운반 중' : target != null ? `→ ${target}번` : '주문 없음';
    const sel = ui.selectedSlot === i ? ' sel' : '';
    return `<button type="button" class="slot${sel}" data-action="tray.tap" data-i="${i}" data-key="slot${i}" aria-pressed="${!!sel}" aria-label="트레이 ${i + 1}번 ${esc(m.name)} ${esc(to)}">
      <span><i class="dot" style="background:${m.color}"></i> ${esc(m.short)}</span><span class="to">${esc(to)}</span></button>`;
  }).join('');
  const held = Object.entries(state.stations).filter(([, s]) => s.held)
    .map(([sid, s]) => `⚠ 트레이가 가득 차 ${STATION_NAMES[sid]} 위에 ${MENUS[s.held.menuId].short} 보관 중`);
  const hint = ui.selectedSlot != null && state.tray[ui.selectedSlot]
    ? `<div class="small" style="color:var(--info)">🍽 ${esc(MENUS[state.tray[ui.selectedSlot].menuId].name)} 선택됨 — 테이블을 누르면 서빙, 같은 칸을 다시 누르면 주문한 테이블로</div>` : '';

  const hosts = usableHosts(state).filter(id => state.staff[id]);
  const hostCards = hosts.map(id => {
    const busy = personBusyReason(state, id);
    const txt = busy ? busy.replace(`${personName(state, id)}: `, '') : staffStatusText(state, id) || '대기';
    const color = id === 'neo' ? '#5b6fb0' : '#9a9a9a';
    return btn({ action: 'sheet.open', args: { sheet: 'companions' }, cls: 'hostcard', title: `${personName(state, id)} 상태: ${txt}`,
      label: `<span class="av" style="background:${color}">${esc(personName(state, id).slice(0, 1))}</span><span class="txt"><b>${esc(personName(state, id))}</b><span class="small">${esc(txt)}</span></span>` });
  });
  const hostCell = hostCards.length > 1 ? `<div class="row" style="min-width:0;overflow-x:auto">${hostCards.join('')}</div>` : hostCards[0] || '<span></span>';

  const fv = state.fever;
  const active = fv.activeUntil != null;
  const chk = feverCheck(state);
  const fcls = active ? 'feverbtn active' : fv.gauge >= RULES.FEVER_GAUGE_MAX ? 'feverbtn ready' : 'feverbtn';
  const flabel = active ? `🔥 피버 ${fmtTime(fv.activeUntil - state.shift.elapsedMs)}` : fv.gauge >= RULES.FEVER_GAUGE_MAX ? '🔥 피버!' : `피버 ${fv.gauge}/100`;
  const fever = btn({ action: 'fever.activate', cls: fcls, disabled: !chk.ok, title: chk.ok ? '피버 발동 (20초, 대상 팁 2배)' : chk.reason,
    label: `<span>${flabel}</span><span class="gauge" aria-hidden="true"><i style="width:${active ? 100 : fv.gauge}%"></i></span>` });
  const kitchen = btn({ action: 'kitchen.toggle', cls: `autobtn${state.autoKitchen ? ' on' : ''}`, title: '주방 자동(루나 언니 굽기·루나 서빙) 켜기/끄기', label: `<span>🍳 주방</span><span>${state.autoKitchen ? '자동' : '수동'}</span>` });
  const auto = btn({ action: 'auto.toggle', cls: `autobtn${state.auto ? ' on' : ''}`, title: '전체 자동(지명 수락·도움 응답·피버까지) 켜기/끄기', label: `<span>🤖 전체</span><span>${state.auto ? '켜짐' : '꺼짐'}</span>` });

  return `<div class="tray" role="group" aria-label="완성 트레이 3칸">${slots}</div>
    ${held.length ? `<div class="small warn">${esc(held.join(' / '))}</div>` : ''}${hint}
    <div class="hostrow">${hostCell}${fever}${kitchen}${auto}</div>
    ${navRow([['kitchen', '🧪 주방'], ['shop', '🛵 긴급 배달'], ['quests', '📜 퀘스트'], ['more', '☰ 기타']])}`;
}

function prepPanel(state) {
  const sc = startCheck(state);
  const hc = huntCheck(state);
  const ds = debtStage(state);
  return `<div class="prep">
    ${btn({ action: 'shift.start', cls: 'primary big', disabled: !sc.ok, title: sc.ok ? '정규 영업 30분 시작' : sc.reasons.join(' / '), label: `☕ Day ${state.day} 영업 시작 (30:00)` })}
    <div class="grid2">
      ${btn({ action: 'hunt.start', disabled: !hc.ok, title: hc.ok ? '영냥이 월정석 사냥 (약 3분) · 월정석은 루나의 저울에서 골드로' : hc.reasons.join(' / '), label: '🌙 월정석 사냥 (3분)' })}
      ${btn({ action: 'sheet.open', args: { sheet: 'town' }, cls: 'primary', title: '모카 식재료점 · 무인 장비 좌판 · 루나의 저울 · 공방(테이블·증축)', label: '🏘 마을 나가기' })}
      ${btn({ action: 'interior.begin', label: '🪑 인테리어' })}
      ${btn({ action: 'kitchen.toggle', cls: state.autoKitchen ? 'on' : '', title: '영업 중 주문 조리·서빙을 자동으로', label: `🍳 주방 자동 ${state.autoKitchen ? '켜짐' : '꺼짐'}` })}
    </div>
    <div class="debtline"><span>💳 빚 ${won(state.debt)}</span><span>상환 단계: ${esc(ds.label)} ${ds.need ? `${won(ds.paid)} / ${won(ds.need)}` : ''}</span></div>
    ${navRow([['kitchen', '🧪 조합대'], ['quests', '📜 퀘스트'], ['companions', '👥 동료'], ['debt', '💳 상환']])}
  </div>`;
}

function interiorPanel(state) {
  const d = state.interior.draft;
  const sel = d.selected ? d.furniture.find(f => f.uid === d.selected) : null;
  const v = interiorPreview(state);
  const selName = sel ? FURNITURE[sel.defId].name + (sel.tableNo ? ` ${sel.tableNo}번` : '') : '가구를 눌러 고르세요';
  const placed = !!(sel && sel.x != null);
  const u = sel?.uid || '';
  const pad = `<div class="pad" role="group" aria-label="선택 가구 이동">
    <span></span>${btn({ action: 'interior.nudge', args: { uid: u, dx: 0, dy: -1 }, label: '↑', title: '위로', disabled: !placed })}<span></span>
    ${btn({ action: 'interior.nudge', args: { uid: u, dx: -1, dy: 0 }, label: '←', title: '왼쪽으로', disabled: !placed })}
    ${btn({ action: 'interior.nudge', args: { uid: u, dx: 0, dy: 1 }, label: '↓', title: '아래로', disabled: !placed })}
    ${btn({ action: 'interior.nudge', args: { uid: u, dx: 1, dy: 0 }, label: '→', title: '오른쪽으로', disabled: !placed })}</div>`;
  const stored = d.furniture.filter(f => f.x == null);
  const storage = stored.length
    ? `<div class="storage" aria-label="보관함">${stored.map(f => btn({ action: 'interior.place', args: { uid: f.uid }, label: `📦 ${esc(FURNITURE[f.defId].name)} 꺼내기` })).join('')}</div>`
    : '<div class="small muted">보관함이 비어 있습니다</div>';
  const problems = v.ok
    ? '<div class="small ok">✅ 겹침·입구 막힘 없음 · 모든 테이블로 가는 길 확인됨</div>'
    : `<ul class="problems">${v.problems.map(p => `<li>${esc(p.msg)}</li>`).join('')}</ul>`;
  return `<div class="edit prep">
    <div class="row"><b>🪑 인테리어 편집</b><span class="small muted grow">가구를 누른 뒤 빈 칸을 누르면 이동</span></div>
    <div class="row">${pad}<div class="grow" style="display:flex;flex-direction:column;gap:4px;min-width:0">
      <span class="small"><b>${esc(selName)}</b></span>
      <div class="row">${btn({ action: 'interior.rotate', args: { uid: u }, label: '⟳ 회전', disabled: !placed })}${btn({ action: 'interior.store', args: { uid: u }, label: '📦 보관', disabled: !placed })}</div>
    </div></div>
    ${storage}${problems}
    <div class="grid2">${btn({ action: 'interior.cancel', label: '↩ 취소 (원래대로)' })}${btn({ action: 'interior.apply', cls: 'primary', disabled: !v.ok, title: v.ok ? '배치 적용' : v.problems[0].msg, label: '✔ 적용' })}</div>
  </div>`;
}

function huntPanel(state) {
  const h = state.hunt;
  const bag = Object.entries(h.bag).filter(([, n]) => n > 0).map(([id, n]) => `${id === 'moonstone' ? '🌙 월정석' : INGREDIENTS[id]?.name || id} ${n}`).join(' · ');
  const gear = Object.values(state.gear?.equipped || {}).filter(Boolean).map(id => GEAR[id].name).join(' · ');
  const running = h.status === 'running';
  const kit = (h.weapons || []).map(w => `<span class="chip${w.evo ? ' evo' : ''}" title="${esc(w.evo ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name)}">${esc(WEAPONS[w.id].icon)} ${w.evo ? '★' : `Lv${w.level}`}</span>`).join('')
    + Object.entries(h.passives || {}).map(([id, lv]) => `<span class="chip" title="${esc(PASSIVES[id].name)}">${PASSIVES[id].icon} ${lv}</span>`).join('');
  return `<div class="prep">
    <div class="row"><span class="grow">🎒 ${esc(bag || '아직 없음')} · 처치 ${h.kills}</span></div>
    <div class="row chips">${kit}</div>
    ${gear ? `<div class="small muted">🗡 장비: ${esc(gear)}</div>` : ''}
    <div class="row"><span class="small muted grow">화면을 끌어서 이동 · 공격은 자동 · 별조각을 모으면 레벨업</span>
    ${running ? btn({ action: 'hunt.retreat', label: '🏠 돌아가기' }) : btn({ action: 'overlay.hunt', cls: 'primary', label: '결과 보기' })}</div>
  </div>`;
}

// ── 테이블 말풍선(캔버스 위 DOM). v: 캔버스 뷰(cafe-view computeView)
export function bubblesHtml(state, v) {
  if (!state || state.mode !== 'shift' || !v) return '';
  const now = state.shift.elapsedMs;
  return state.tables.map(t => {
    const b = bubbleOf(state, t, now);
    if (!b) return '';
    const p = cellToPx(v, t.table.x + 0.5, t.table.y);
    return `<button type="button" class="bubble ${b.cls}" data-key="b${t.no}" data-action="table.tap" data-no="${t.no}" style="left:${Math.round(p.x)}px;top:${Math.round(p.y - 2)}px" aria-label="${t.no}번 테이블: ${esc(b.text)}">${esc(b.text)}</button>`;
  }).join('');
}

function bubbleOf(state, t, now) {
  const c = t.customerId ? state.customers[t.customerId] : null;
  if (!c) {
    if (t.state === 'dirty') return { cls: 'dirty', text: t.cleanQueued ? '🧽 정리 대기' : '🧽 정리 필요' };
    if (t.state === 'cleaning') return { cls: 'dirty', text: `🧽 정리 중 ${fmtTime((t.cleanEndAt ?? now) - now)}` };
    return null;
  }
  const visit = state.visits[c.visitId];
  if (!visit) return null;
  const orders = openOrdersOfVisit(state, visit);
  const orderText = orders.map(o => MENUS[o.menuId].short + (o.status === 'assigned' ? '🚶' : '')).join('·');
  switch (c.state) {
    case 'requesting': {
      const left = TEMP.NOMINATION_PATIENCE_MS - (now - visit.requestAt);
      return { cls: 'req', text: `💌 ${personName(state, visit.nominee)} 지명 · ${fmtTime(left)}` };
    }
    case 'hosted': {
      const open = visit.help.find(h => h.status === 'open');
      if (open) return { cls: 'help', text: `❗ ${HELP_KINDS[open.kind].label} ${fmtTime(open.until - now)}` };
      return { cls: 'host', text: `🫖 접대 ${fmtTime(visit.endAt - now)}${orderText ? ` · 🍽${orderText}` : ''}` };
    }
    case 'thinking': return { cls: '', text: '💭 고민 중' };
    case 'waiting_food': {
      if (!orders.length) return { cls: '', text: '🍽 대기' };
      const left = TEMP.FOOD_PATIENCE_MS - (now - orders[0].placedAt);
      return { cls: '', text: `🍽 ${orderText} ⏳${fmtTime(left)}` };
    }
    case 'eating': return { cls: '', text: '😋 식사 중' };
    default: return null;
  }
}

// ── 테이블 터치 영역(최소 44px)
export function hitsHtml(state, v, ui) {
  if (!state || state.mode !== 'shift' || !v) return '';
  const size = Math.max(44, Math.round(v.tile * 1.3));
  const sel = ui.selectedSlot != null ? state.tray[ui.selectedSlot] : null;
  const target = sel && !sel.reservedFor ? findServeTarget(state, sel) : null;
  return state.tables.map(t => {
    const p = cellToPx(v, t.table.x + 0.5, t.table.y + 0.5);
    const cls = target === t.no ? 'hit target' : 'hit';
    return `<button type="button" class="${cls}" data-key="h${t.no}" data-action="table.tap" data-no="${t.no}" aria-label="${t.no}번 테이블" style="left:${Math.round(p.x - size / 2)}px;top:${Math.round(p.y - size / 2)}px;width:${size}px;height:${size}px"></button>`;
  }).join('');
}

export { won };
