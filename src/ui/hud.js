import {maxActionPoints} from '../game/calendar.js';
import {CUSTOMER_WEALTH} from '../data/customer-wealth.js';
import {waitingSatisfaction} from '../game/reputation.js';
import {popularity} from '../game/reputation.js';
import {cafeProgress,cafeStyle,atmosphere} from '../game/cafe-growth.js';
import { SUPPLIES } from '../game/moka-armory.js';
import { stressLabel, stressStage, stressOf } from '../game/stress.js';
import { automationOn } from '../game/permissions.js';
import { assetIcon } from './asset-html.js';
// 상단 바·하단 패널·테이블 말풍선·테이블 터치 영역의 HTML. 상태를 읽기만 한다.
// 모든 표시는 글자 + 아이콘 + 시간으로 쓴다(색만으로 구분하지 않는다).

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
import { GEAR } from '../data/gear.js';
import { FURNITURE } from '../data/layout.js';
import { HELP_KINDS } from '../data/lines.js';
import { fmtTime, personName, remainingShift, usableHosts, shiftDuration, lastAcceptAt } from '../game/state.js';
import { STATION_NAMES, findServeTarget, openOrdersOfVisit, staffStatusText } from '../game/cafe.js';
import { feverCheck, personBusyReason } from '../game/nomination.js';
import { startCheck } from '../game/shift.js';
import { huntCheck, findBoss, getHuntWorld } from '../game/hunt.js';
import { stageDef } from '../data/hunt-stages.js';
import { calendarOf, dateLabel, turnsLeft, isEnded, PARTS } from '../game/calendar.js';
import { WEAPONS, PASSIVES } from '../data/hunt-kit.js';
import { debtStage, recruitView } from '../game/economy.js';
import { preview as interiorPreview } from '../game/interior.js';
import { cellToPx } from '../render/cafe-view.js';
import { btn, esc } from './dom.js';

const won = n => n === 100_000_000 ? '1억 골드' : `${Math.floor(n).toLocaleString('ko-KR')}G`;

// ── 상단 바
export function topbarHtml(state, ui) {
  const dev = ui.dev ? '<span class="tag dev">DEV</span>' : '';
  if (!state) return `<div class="tb-col"><span class="clock">연이의 아틀리에</span></div>${dev}`;
  const stress = state.hostbar.open ? `<span class="stress-chip ${stressStage(state)}" aria-label="네오 스트레스 ${Math.round(stressOf(state))}/100">${assetIcon(`ui/stress-${stressStage(state)}`)}네오 · ${stressLabel(state)}<meter min="0" max="100" value="${stressOf(state)}">${Math.round(stressOf(state))}</meter></span>` : '';
  const cp=cafeProgress(state);
  const gold = `<div class="cafe-scores"><span class="level-badge" aria-label="카페 레벨 ${cp.level}"><b>Lv.${cp.level}</b><progress max="${cp.next}" value="${cp.xp}" aria-label="다음 카페 레벨 경험치">${cp.xp}/${cp.next}</progress></span><span class="reputation-score" title="주문을 빨리 챙기고 만족스럽게 응대하면 올라요"><small>평판</small><b>${Math.round(popularity(state))}<em>/100</em></b></span><span class="atmosphere-score"><small>분위기</small><b>${atmosphere(state)}</b></span></div><span class="gold" aria-label="골드">🪙 <span data-count-to="${Math.floor(state.gold)}" data-count-suffix="G">${won(state.gold)}</span></span>`;
  if (state.mode === 'shift') {
    const sh = state.shift;
    const st = [];
    if (state.paused) st.push('⏸ 일시정지');
    if (state.fever.activeUntil != null) st.push(`🔥 피버 ${fmtTime(state.fever.activeUntil - sh.elapsedMs)}`);
    if (state.auto) st.push('🤖 자동 운영');
    else { if (automationOn(state, 'hall')) st.push('🐰 홀 자동'); if (automationOn(state, 'kitchen')) st.push('🍳 주방 자동'); }
    if (state.hostbar.open && sh.elapsedMs > lastAcceptAt(state)) st.push('지명 수락 마감');
    if (!st.length) st.push('영업 중');
    if (ui.dev && ui.speed !== 1) st.push(`×${ui.speed}`);
    return `<div class="tb-col"><span class="clock" aria-label="남은 영업 시간">⏱ ${fmtTime(remainingShift(state))}</span><span class="small muted">경과 ${fmtTime(sh.elapsedMs)} / ${fmtTime(shiftDuration(state))}</span></div>
      ${gold}${stress}<span class="speed-controls" role="group" aria-label="영업 속도">${btn({action:'play.cycle',label:`${ui.playSpeed||1}배`,title:'영업 속도 바꾸기: 1배, 2배, 3배'})}</span><span class="status">${esc(st.join(' · '))}</span>${dev}
      ${btn({ action: 'pause', label: state.paused ? '▶' : '⏸', title: state.paused ? '계속하기' : '일시정지', cls: 'ghost' })}`;
  }
  if (state.mode === 'hunt') {
    const h = state.hunt;
    const pct = Math.max(0, Math.round(h.hp / h.maxHp * 100));
    const xpPct = h.xpNext ? Math.min(100, Math.round((h.xp || 0) / h.xpNext * 100)) : 0;
    return `<div class="tb-col"><span class="clock" aria-label="생존 시간">🐾 ${fmtTime(h.elapsedMs)}</span><span class="small muted">🌙 ${h.bag.moonstone || 0} · 월정석 사냥</span></div>
      <div class="tb-col"><span class="small">HP ${h.hp}/${h.maxHp}</span><span class="hpbar" role="img" aria-label="체력 ${pct}%"><i style="width:${pct}%"></i></span></div>
      <div class="tb-col"><span class="small">Lv ${h.level ?? 1}</span><span class="xpbar" role="img" aria-label="경험치 ${xpPct}%"><i style="width:${xpPct}%"></i></span></div>
      <span class="status">${state.paused ? '⏸ 일시정지' : ui.dev && ui.speed !== 1 ? `×${ui.speed}` : ''}</span>${dev}
      ${btn({ action: 'pause', label: state.paused ? '▶' : '⏸', title: state.paused ? '계속하기' : '일시정지', cls: 'ghost' })}`;
  }
  const label = state.mode === 'settlement' ? '결산' : state.interior.draft ? '인테리어 편집' : '영업 준비';
  return `<div class="tb-col"><span class="clock">${esc(shortDate(state))}</span><span class="small muted">${label}</span></div>
    ${gold}${stress}<span class="speed-controls" role="group" aria-label="영업 속도">${btn({action:'play.cycle',label:`${ui.playSpeed||1}배`,title:'영업 속도 바꾸기: 1배, 2배, 3배'})}</span><span class="status cafe-wallet">${assetIcon('icons/moonstone')}${state.moonstone||0}</span>${dev}
    ${btn({ action: 'sheet.open', args: { sheet: 'manage' }, label: '☰', title: '카페 수첩', cls: 'ghost' })}`;
}

// 상단 바용 짧은 날짜: '3월 상순' / '후일담 2일째'
function shortDate(state) {
  if (isEnded(state)) return dateLabel(state);
  const c = calendarOf(state.day);
  return `${c.month}월 ${PARTS[c.part]}`;
}

// 달력 띠: 연차·남은 순·이번 달 이자 예고·행동력(글자와 점으로 함께 보인다)
function calendarStrip(state) {
  const apMax = maxActionPoints(state);
  const left = state.ap?.left ?? 0;
  const pips = `<span class="pips" role="img" aria-label="행동력 ${left}/${apMax}">${'●'.repeat(left)}${'○'.repeat(Math.max(0, apMax - left))}</span>`;
  if (isEnded(state)) return `<div class="calstrip"><span>📅 ${esc(dateLabel(state))} · 자유 영업</span><span>행동력 ${pips}</span></div>`;
  const c = calendarOf(state.day);
  const due = Math.ceil(Math.max(0, state.debt) * TEMP.CALENDAR.INTEREST_RATE);
  const when = c.part === 2 ? '이번 영업 뒤' : `${PARTS[2]} 영업 뒤`;
  return `<div class="calstrip"><span>📅 ${esc(dateLabel(state))} · 남은 ${turnsLeft(state)}순</span><span title="하순 영업을 마치면 이자가 나갑니다">💸 ${when} 이자 약 ${won(due)}</span><span>행동력 ${pips}</span></div>`;
}

// ── 하단 패널
export function panelHtml(state, ui) {
  if (!state) return '';
  if (state.mode === 'shift') return stationDock(state)+shiftPanel(state, ui);
  if (state.mode === 'hunt') return huntPanel(state);
  if (state.mode === 'settlement') return `<div class="prep">${btn({ action: 'overlay.settlement', label: '📒 결산 보기', cls: 'primary big' })}</div>`;
  if (state.interior.draft) return interiorPanel(state);
  return prepPanel(state);
}

function navRow(items) {
  return `<div class="nav">${items.map(([sheet, label]) => btn({ action: 'sheet.open', args: { sheet }, label: `${assetIcon(({kitchen:'icons/fortune_latte',shop:'icons/bean',quests:'farm/seeds',more:'skills/hat',companions:'skills/bell',debt:'icons/moonstone',farm:'farm/seeds',town:'ui/town-node-atelier',manage:'ui/ledger'})[sheet])}${esc(label.replace(/^[^가-힣A-Za-z]+/,''))}` })).join('')}</div>`;
}

function shiftPanel(state, ui) {
  const slots = state.tray.map((it, i) => {
    if (!it) return '';
    const m = MENUS[it.menuId];
    const target = it.reservedFor ? null : findServeTarget(state, it);
    const to = it.reservedFor ? '🚶 운반 중' : target != null ? `→ ${target}번` : '주문 없음';
    const sel = ui.selectedSlot === i ? ' sel' : '';
    return `<button type="button" class="slot${sel}" data-action="tray.tap" data-i="${i}" data-key="slot${i}" aria-pressed="${!!sel}" aria-label="트레이 ${i + 1}번 ${esc(m.name)} ${esc(to)}">
      <span>${assetIcon(`icons/${m.id}`,`<i class="dot" style="background:${m.color}"></i>`)} ${esc(m.short)}</span><span class="to">${esc(to)}</span></button>`;
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

  return `${customerOrders(state)}<div class="tray" role="group" aria-label="완성 트레이 3칸">${slots || '<p class="tray-guide">완성 서빙대 · 주문 메뉴를 눌러 조리해 주세요.</p>'}</div>
    ${held.length ? `<div class="small warn">${esc(held.join(' / '))}</div>` : ''}${hint}
    <div class="hostrow${state.hostbar.open ? '' : ' cafe-only'}">${state.hostbar.open ? hostCell + fever : ''}</div>
    ${navRow([['kitchen','주방'],['shop','배달'],['companions','동료'],['manage','수첩']])}`;
}

function prepPanel(state) {
 const sc=startCheck(state), available=recruitView(state).filter(c=>c.status==='available');
 return `<div class="cafe-dock"><div class="day-plan"><span>${esc(dateLabel(state))}</span><span>행동력 ${state.ap?.left??0}/${maxActionPoints(state)}</span></div>${available.length?btn({action:'recruit.event',args:{id:available[0].id},cls:'new-friend',label:available[0].id==='seohanbi'?'봉인된 초대장이 도착했어요':`${esc(available[0].name)}의 초대장` }):''}${btn({action:'shift.start',cls:'primary open-cafe',disabled:!sc.ok,title:sc.ok?'10분 영업을 시작해요':sc.reasons.join(' / '),label:`${assetIcon('icons/fortune_latte')} 카페 문 열기 <small>10:00</small>`})}${navRow([['kitchen','주방'],['farm','농장'],['town','마을'],['manage','수첩']])}</div>`;
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
    <div class="row"><b>인테리어 편집</b><span class="small muted grow">가구를 누른 뒤 빈 칸을 누르면 이동</span></div>
    <div class="row">${pad}<div class="grow" style="display:flex;flex-direction:column;gap:4px;min-width:0">
      <span class="small"><b>${esc(selName)}</b></span>
      <div class="row">${btn({ action: 'interior.rotate', args: { uid: u }, label: '⟳ 회전', disabled: !placed })}${btn({ action: 'interior.store', args: { uid: u }, label: '📦 보관', disabled: !placed })}</div>
    </div></div>
    ${storage}${problems}
    <div class="grid2">${btn({ action: 'interior.cancel', label: '↩ 취소 (원래대로)' })}${btn({ action: 'interior.apply', cls: 'primary', disabled: !v.ok, title: v.ok ? '배치 적용' : v.problems[0].msg, label: '✔ 적용' })}</div>
  </div>`;
}

// 이번 단계 목표: 준비 시간 → 보스 등장 → 보스 처치 = 클리어
function huntGoal(h,state){const w=getHuntWorld(state),boss=w&&findBoss(w)>=0;if(boss||h.bossSpawned)return '<b class="hunt-goal boss">보스 처치 = 클리어</b>';const left=Math.max(0,stageDef(h.depth).prepMs-(h.stageMs||0));return `<span class="hunt-goal">보스까지 ${fmtTime(left)}</span>`;}
function huntPanel(state){const h=state.hunt;return `<div class="hunt-dock"><div class="row"><b class="grow">${h.hunterId==='seohanbi'?'서한비':'영냥이'} · 성장 Lv.${h.careerLevel} · ${h.depth}/100단계</b>${huntGoal(h,state)}<span>처치 ${h.kills}</span>${btn({action:h.status==='running'?'hunt.retreat':'overlay.hunt',label:h.status==='running'?'귀환':'결과'})}</div><div class="hunt-kit">${h.weapons.map(w=>`<span class="hunt-skill" title="${esc(WEAPONS[w.id].name)}">${assetIcon(`skills/${w.id}`)}<small>${esc(WEAPONS[w.id].name)} ${w.evo?'★':'Lv.'+w.level}</small></span>`).join('')}${Object.entries(h.passives).map(([id,lv])=>`<span class="hunt-skill" title="${esc(PASSIVES[id].name)}">${assetIcon(`skills/${id}`)}<small>${esc(PASSIVES[id].name)} Lv.${lv}</small></span>`).join('')}</div><div class="hunt-supplies">${Object.entries(SUPPLIES).filter(([id])=>state.armory?.supplies?.[id]>0).map(([id,d])=>btn({action:'hunt.supply',args:{id},label:`${assetIcon(`skills/${d.icon}`)}${d.name} ${state.armory.supplies[id]}`})).join('')}</div><small>드래그로 이동 · 가까운 적 자동 공격 · 붉은 예고 밖으로 피하세요</small></div>`;}

// ── 무대 위 DOM 층. 동료 수다는 하단 패널 높이를 먹지 않도록 무대 왼쪽 아래에 띄운다(주문 카드가 밀려 잘리지 않게).
export function bubblesHtml(ui){return chatterRibbon(ui);}

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
      if (open) return { cls: 'help', text: `SOS · ${HELP_KINDS[open.kind].label} ${fmtTime(open.until - now)}` };
      return { cls: 'host', text: `🫖 접대 ${fmtTime(visit.endAt - now)}${orderText ? ` · 🍽${orderText}` : ''}` };
    }
    case 'thinking': return { cls: '', text: '💭 고민 중' };
    case 'waiting_food': {
      if (!orders.length) return { cls: '', text: '🍽 대기' };
      const left = TEMP.FOOD_PATIENCE_MS - (now - orders[0].placedAt);
      const waiting = orders.find(o => o.status === 'waiting');
      const ready = waiting && state.tray.some(it => it && !it.reservedFor && it.menuId === waiting.menuId);
      return { cls: ready ? 'ready' : '', orderId: waiting?.id, text: `🍽 ${orderText} · ${ready ? '서빙' : waiting ? '만들기' : '운반 중'} ${fmtTime(left)}` };
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

function customerOrders(state){
 // 떠난 자리 정리 카드는 앞에 둔다(가로 목록 끝에 숨으면 놓치기 쉽다). 수동 영업에서는 눌러야 정리한다.
 const tidy=state.tables.filter(t=>!t.customerId&&(t.state==='dirty'||t.state==='cleaning')).map(t=>{
  const busy=t.state==='cleaning'||t.cleanQueued;
  return btn({action:'clean',args:{no:t.no},disabled:busy,cls:'customer-order tidy',label:`<span class="order-thinking" aria-hidden="true">🧽</span><span class="order-content"><b>${t.no}번 · 정리</b><small>${t.state==='cleaning'?'닦는 중':t.cleanQueued?'정리하러 가는 중':'눌러서 정리하기'}</small></span>`});
 }).join('');
 const rows=tidy+Object.values(state.customers).map(c=>{
  const v=state.visits[c.visitId];if(!v||c.state==='leaving')return '';
  const pending=v.orderIds.map(id=>state.orders[id]).filter(o=>o&&['waiting','assigned'].includes(o.status));
  const order=pending.find(o=>o.status==='waiting')||pending[0], menu=MENUS[order?.menuId];
  const counts={};for(const o of v.orderIds.map(id=>state.orders[id]).filter(Boolean))counts[o.menuId]=(counts[o.menuId]||0)+1;
  const items=Object.entries(counts).map(([id,n])=>`${MENUS[id].short}${n>1?' ×'+n:''}`).join(' · ');
  const job=order&&Object.values(state.stations).flatMap(s=>[s.current,s.next]).find(j=>j&&j.orderId===order.id);
  const tray=order&&state.tray.some(it=>it?.menuId===order.menuId&&!it.reservedFor), help=v.help?.some(h=>h.status==='open');
  const score=waitingSatisfaction(state,v),mood=score>=80?'여유':score>=55?'기다림':'서둘러요';
  const status=help?'도움 요청':c.state==='checkout'?'연이에게 결제 중':job?'조리 중':tray?'완성 · 전달하기':order?.status==='assigned'?'가져가는 중':order?'주문 · 만들기':c.state==='eating'?'맛있게 먹는 중':c.state==='requesting'?'지명 요청':c.state==='entering'?'자리로 안내 중':'메뉴 고르는 중';
  return btn({action:help?'table.tap':order?.status==='waiting'&&!job?'order.quick':'table.tap',args:{id:order?.id||'',no:c.tableNo},disabled:c.tableNo===0&&(!order||!!job),cls:'customer-order',label:`${menu?assetIcon('icons/'+menu.id):'<span class="order-thinking" aria-hidden="true">…</span>'}<span class="order-content"><b>${v.kind==='takeaway'?'포장':`${c.tableNo}번`} · ${esc(items||status)}</b><small>${esc(CUSTOMER_WEALTH[v.wealthId]?.name||'손님')} · ${status}</small>${pending.length?`<span class="patience ${score<55?'urgent':''}"><meter min="0" max="100" value="${score}" aria-label="손님 만족도 ${score}점"></meter><small>${mood}</small></span>`:''}</span>`});
 }).join('');
 return `<div class="customer-orders" aria-label="손님 주문 현황">${rows||'<p class="tray-guide">곧 첫 손님이 찾아와요. 재료와 주방을 준비해 주세요.</p>'}</div>`;
}
function stationDock(state){return `<div class="station-dock" aria-label="주방 설비">${[['drink','음료 머신','objects/drink'],['oven','오븐','objects/oven'],['pass','서빙대','objects/pass']].map(([id,name,icon])=>{const st=state.stations[id],job=st?.current,ready=id==='pass'?state.tray.filter(Boolean).length:0;return btn({action:'sheet.open',args:{sheet:'kitchen'},label:`${assetIcon(icon)}<span>${name}<small>${job?'만드는 중':ready?ready+'개 완성':id==='pass'?'완성 음식':'준비됨'}</small>${job?`<progress max="${job.durationMs}" value="${job.progressMs}" aria-label="${name} 조리 진행"></progress>`:''}</span>`});}).join('')}</div>`;}
function chatterRibbon(ui){const c=ui.chatter;if(!c||performance.now()>c.until)return '';return `<aside class="cafe-chatter" aria-label="카페에서 들리는 이야기">${assetIcon('portraits/'+c.portrait)}<div><b>${esc(c.speaker)}</b><p>${esc(c.line)}</p></div></aside>`;}
