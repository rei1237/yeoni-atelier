// 바텀시트(테이블·주방·재료·마을·퀘스트·기타·부채·동료·의상)와 전면 오버레이(타이틀·확인·일시정지·결산·사냥 결과·만남 이벤트).
// 상태를 읽기만 하고, 버튼은 data-action 으로 명령을 요청한다.

import { RULES, STAT_KEYS, STAT_LABELS, CORE_CAP } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, MENU_ORDER, INGREDIENTS } from '../data/menus.js';
import { HELP_KINDS, TOPICS } from '../data/lines.js';
import { PEOPLE, LOCKED_SLOT_COUNT } from '../data/companions.js';
import { OUTFITS, OUTFIT_SLOTS, OUTFIT_WEARERS } from '../data/outfits.js';
import { GEAR, GEAR_SLOTS, GEAR_ORDER } from '../data/gear.js';
import { FURNITURE } from '../data/layout.js';
import { fmtTime, personName, personDef, hostStats, usableHosts, isUsableHost, remainingShift } from '../game/state.js';
import { STATION_NAMES, tableByNo, customerAt, staffStatusText, stockCheck } from '../game/cafe.js';
import { acceptCheck, hostingPreview, personBusyReason } from '../game/nomination.js';
import { gradeOf } from '../game/satisfaction.js';
import { debtStage, questView, recruitView } from '../game/economy.js';
import { estimateOfflineIncome } from '../game/offline.js';
import { describeOption } from '../game/hunt.js';
import { townCheck, nextExpansion } from '../game/town.js';
import { COMBO_MAX } from '../game/recipe.js';
import { btn, esc } from './dom.js';
import { won } from './hud.js';

const SLOT_LABEL = { outfit: '의상', acc1: '액세서리 1', acc2: '액세서리 2' };
const ORDER_STATUS = { waiting: '⏳ 조리·서빙 대기', assigned: '🚶 운반 중', served: '✅ 서빙 완료', cancelled: '✖ 취소' };

const head = title => `<h2>${title}${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>`;
const bar = (pct, cls = '') => `<span class="bar" aria-hidden="true"><i class="${cls}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;

export function sheetHtml(state, ui) {
  const s = ui.sheet;
  if (!state || !s) return '';
  switch (s.kind) {
    case 'table': return tableSheet(state, s.no, ui);
    case 'kitchen': return kitchenSheet(state, ui);
    case 'shop': return shopSheet(state);
    case 'town': return townSheet(state, s.tab);
    case 'quests': return questSheet(state);
    case 'more': return moreSheet(state, ui);
    case 'debt': return debtSheet(state);
    case 'companions': return companionSheet(state);
    case 'outfits': return outfitSheet(state);
    default: return '';
  }
}

// ── 테이블
function tableSheet(state, no, ui) {
  if (state.mode !== 'shift') return `${head(`${no}번 테이블`)}<p class="muted">영업이 끝났습니다.</p>`;
  const t = tableByNo(state, no);
  if (!t) return `${head(`${no}번 테이블`)}<p class="muted">없는 테이블입니다.</p>`;
  const c = customerAt(state, no);
  const now = state.shift.elapsedMs;
  if (!c) {
    const body = t.state === 'dirty'
      ? `<p>🧽 손님이 떠난 자리입니다. 정리해야 다음 손님을 받을 수 있어요.</p>${btn({ action: 'clean', args: { no }, cls: 'primary', disabled: t.cleanQueued, label: t.cleanQueued ? '정리 대기 중' : '🧽 정리하기' })}`
      : t.state === 'cleaning' ? `<p>🧽 정리 중 · ${fmtTime((t.cleanEndAt ?? now) - now)} 남음</p>` : '<p class="muted">빈 테이블 · 손님을 기다리는 중</p>';
    return `${head(`${no}번 테이블`)}<div class="card">${body}</div>`;
  }
  const visit = state.visits[c.visitId];
  const parts = [head(`${no}번 테이블 · ${esc(c.label)}`)];
  parts.push(`<div class="card"><h3>🍽 주문</h3>${ordersHtml(state, visit, no)}</div>`);
  const foods = visit.foodScores;
  const foodText = foods.length ? `${Math.round(foods.reduce((a, b) => a + b, 0) / foods.length)}점 (${foods.length}회)` : '아직 없음';
  if (visit.kind === 'regular') {
    parts.push(`<div class="card"><div class="kv"><span>손님 유형</span><b>일반 손님</b><span>접대 만족도</span><b>해당 없음</b><span>음식 점수</span><b>${foodText}</b></div>
      <p class="small muted">일반 손님은 접대 없이 식사만 하고 떠납니다.</p></div>`);
  } else {
    parts.push(nominationCard(state, visit, c, now, foodText, ui));
  }
  return parts.join('');
}

function ordersHtml(state, visit, no) {
  const orders = visit.orderIds.map(id => state.orders[id]).filter(Boolean);
  if (!orders.length) return '<p class="small muted">아직 주문 전입니다 (메뉴 고르는 중).</p>';
  const usedItems = new Set();
  return `<div class="list">${orders.map(o => {
    const m = MENUS[o.menuId];
    let action = '';
    if (o.status === 'waiting') {
      const item = state.tray.find(it => it && !it.reservedFor && it.menuId === o.menuId && !usedItems.has(it.id));
      if (item) { usedItems.add(item.id); action = btn({ action: 'serve', args: { item: item.id, no }, cls: 'primary', label: '트레이에서 서빙' }); }
      else action = `<span class="small muted">${state.learned[o.menuId] ? '주방에서 만들어 주세요' : '레시피 없음'}</span>`;
    }
    return `<div class="item"><i class="swatch" style="background:${m.color}"></i><div class="meta grow"><b>${esc(m.name)} · ${won(o.price)}</b><span>${ORDER_STATUS[o.status]}</span></div>${action}</div>`;
  }).join('')}</div>`;
}

function prefsGrid(state, visit, pid) {
  const stats = hostStats(state, pid) || {};
  return `<div class="prefs" role="table" aria-label="선호 가중치와 능력치">${STAT_KEYS.map(k => {
    const pct = visit.prefs[k];
    const fail = pct >= CORE_CAP.PREF_MIN && (stats[k] ?? 0) < CORE_CAP.STAT_BELOW;
    return `<span>${fail ? '⚠ ' : ''}${STAT_LABELS[k]}</span>${bar(pct, pct >= CORE_CAP.PREF_MIN ? 'core' : '')}<b>${pct}%</b><span class="${fail ? 'bad' : 'muted'}">${stats[k] ?? '-'}/10</span>`;
  }).join('')}</div>`;
}

function predictionHtml(pv, label) {
  const capLine = pv.capped
    ? `<p class="small bad">⛔ 핵심 조건 미충족(${pv.failures.map(k => STAT_LABELS[k]).join('·')}: 선호 ${CORE_CAP.PREF_MIN}% 이상인데 능력치 ${CORE_CAP.STAT_BELOW} 미만) → 만족도는 최대 ${CORE_CAP.H_MAX}점</p>` : '';
  return `<div class="row"><span class="big-num">${pv.H.toFixed(1)}</span><span><b>${esc(pv.grade.label)}</b><br><span class="small muted">${label}</span></span></div>
    <p class="small muted">기본 상성 M ${pv.M.toFixed(1)} · 대화 보정 ${pv.talkBonus >= 0 ? '+' : ''}${pv.talkBonus} · 대기 불만 −${pv.waitPenalty}${pv.capped ? ` · 상한 전 ${pv.H0.toFixed(1)}` : ''}</p>
    ${capLine}<p class="small muted">음식·인테리어·의상·피버는 접대 만족도를 올리지 않습니다(피버는 팁만 2배).</p>`;
}

function nominationCard(state, visit, c, now, foodText, ui) {
  const profile = PDF.PROFILES.find(p => p.id === visit.profileId);
  const pid = visit.nominee;
  const out = [`<div class="card"><div class="kv"><span>손님 유형</span><b>💌 지명 손님 · ${esc(profile?.label || visit.profileId)}</b>
    <span>지명</span><b>${esc(personName(state, pid))}${visit.requestedNominee && visit.requestedNominee !== pid ? ` (원래 ${esc(personName(state, visit.requestedNominee))})` : ''}</b>
    <span>음식 점수(별도)</span><b>${foodText}</b></div>
    <h3>선호 가중치 · ${esc(personName(state, pid))} 능력치</h3>${prefsGrid(state, visit, pid)}`];

  if (visit.settled) {
    const g = gradeOf(visit.finalH);
    out.push(`<h3>접대 결과</h3><p><b>${visit.finalH.toFixed(1)} · ${esc(g.label)}</b> · 팁 ${won(visit.tip?.total || 0)}</p></div>`);
    return out.join('');
  }
  const pv = hostingPreview(state, visit, pid);
  if (visit.acceptAt == null) {
    out.push(`<h3>예상 접대 만족도</h3>${predictionHtml(pv, '수락하면 이 값에서 시작')}`);
    const chk = acceptCheck(state, visit.tableNo);
    const left = TEMP.NOMINATION_PATIENCE_MS - (now - visit.requestAt);
    out.push(`<p class="small">⏳ 지명 요청 대기 ${fmtTime(left)} 남음 · 아직 300초 타이머는 시작하지 않았습니다</p>`);
    out.push(chk.ok
      ? `<ul class="reasons okay"><li>수락하면 지금부터 300초 동안 ${esc(personName(state, pid))}이(가) 이 테이블 전담</li></ul>`
      : `<ul class="reasons">${chk.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`);
    const others = usableHosts(state).filter(id => id !== pid && state.staff[id]);
    out.push(`<div class="btns">${btn({ action: 'nomination.accept', args: { no: visit.tableNo }, cls: 'primary', disabled: !chk.ok, title: chk.ok ? '지명 수락 (300초 전담 시작)' : chk.reasons.join(' / '), label: '💌 지명 수락' })}
      ${btn({ action: 'nomination.decline', args: { no: visit.tableNo }, label: '일반 식사로 안내' })}
      ${others.map(id => {
        const p2 = hostingPreview(state, visit, id);
        return btn({ action: 'nomination.propose', args: { no: visit.tableNo, person: id }, label: `${esc(personName(state, id))} 추천 (예상 ${p2.H.toFixed(0)})` });
      }).join('')}</div></div>`);
    return out.join('');
  }
  // 접대 중
  const left = visit.endAt - now;
  const pct = (now - visit.acceptAt) / RULES.NOMINATION_MS * 100;
  out.push(`<h3>🫖 접대 중 · ${fmtTime(left)} 남음</h3>${bar(pct)}
    <p class="small muted">수락 ${fmtTime(visit.acceptAt)} → 종료 ${fmtTime(visit.endAt)} (영업 경과 기준) · 300초를 채우면 정산</p>
    <h3>현재 접대 만족도</h3>${predictionHtml(pv, '대화 도움으로 −5~+5 보정')}`);
  out.push(`<h3>도움 요청</h3><div class="list">${visit.help.map(h => helpHtml(state, visit, h, now)).join('')}</div>`);
  if (visit.fevered) out.push('<p class="small">🔥 피버 대상 테이블 — 정산 시 팁 2배</p>');
  out.push('</div>');
  return out.join('');
}

function helpHtml(state, visit, h, now) {
  const label = HELP_KINDS[h.kind].label;
  if (h.status === 'pending') return `<div class="item"><div class="meta grow"><b>${label}</b><span>${fmtTime(h.at - now)} 뒤</span></div></div>`;
  if (h.status === 'done') return `<div class="item"><div class="meta grow"><b>${label}</b><span>✅ 응답함${h.result === 'good' ? ' · 좋은 반응' : ''}</span></div></div>`;
  if (h.status === 'missed') return `<div class="item"><div class="meta grow"><b>${label}</b><span>✖ 놓침 (대화 보정 −1)</span></div></div>`;
  const args = c => ({ visit: visit.id, index: h.index, choice: c });
  let choices;
  if (h.kind === 'topic') choices = `<div class="choice-grid">${STAT_KEYS.map(k => btn({ action: 'help.respond', args: args(k), label: `${esc(TOPICS[k])}` })).join('')}</div>`;
  else if (h.kind === 'listen') choices = btn({ action: 'help.respond', args: args('listen'), cls: 'primary', label: '👂 이야기 들어주기' });
  else choices = btn({ action: 'help.respond', args: args('photo'), cls: 'primary', label: '📸 사진 찍어 주기 (피버 +8, 1회)' });
  return `<div class="card"><b>❗ ${label}</b> <span class="small">${fmtTime(h.until - now)} 안에 응답</span>${choices}</div>`;
}

// ── 주방
// 조합대: 고른 재료(화면 선택일 뿐, 섞기 전엔 게임 상태가 바뀌지 않는다) → 섞기 = recipe.try
function comboBench(state, ui) {
  const pick = ui.combo || [];
  const used = {};
  for (const id of pick) used[id] = (used[id] || 0) + 1;
  const slots = Array.from({ length: COMBO_MAX }, (_, i) => {
    const id = pick[i];
    return id ? btn({ action: 'combo.remove', args: { index: i }, cls: 'cb-slot full', title: `${INGREDIENTS[id].name} 빼기`, label: `<i class="swatch" style="background:${INGREDIENTS[id].color}"></i>${esc(INGREDIENTS[id].name)}` })
      : '<span class="cb-slot" aria-hidden="true">＋</span>';
  }).join('');
  const ings = Object.values(INGREDIENTS).map(ing => {
    const left = (state.stock[ing.id] || 0) - (used[ing.id] || 0);
    return btn({ action: 'combo.add', args: { id: ing.id }, cls: 'cb-ing', disabled: left <= 0 || pick.length >= COMBO_MAX,
      title: left <= 0 ? `${ing.name}이(가) 없어요` : pick.length >= COMBO_MAX ? `재료는 ${COMBO_MAX}개까지` : `${ing.name} 넣기`,
      label: `<i class="swatch" style="background:${ing.color}"></i>${esc(ing.name)}<small>${Math.max(0, left)}</small>` });
  }).join('');
  const verb = state.mode === 'shift' ? '섞어서 만들기' : '섞어 보기';
  return `<div class="card combo" id="combo-bench"><b>🧪 조합대</b>
    <p class="small muted">재료를 골라 섞어 보세요. 맞는 조합이면 새 레시피를 배워요(시험으로 섞을 땐 재료가 줄지 않아요).${state.mode === 'shift' ? ' 아는 레시피면 바로 조리를 시작해요.' : ''}</p>
    <div class="cb-slots">${slots}</div>
    <div class="cb-ings">${ings}</div>
    <div class="row">${btn({ action: 'combo.clear', label: '비우기', disabled: !pick.length })}${btn({ action: 'combo.mix', cls: 'primary grow', disabled: !pick.length, title: pick.length ? verb : '재료를 먼저 골라 주세요', label: `🥄 ${verb}` })}</div></div>`;
}

function kitchenSheet(state, ui) {
  const waitingBy = {};
  for (const o of Object.values(state.orders)) if (o.status === 'waiting') waitingBy[o.menuId] = (waitingBy[o.menuId] || 0) + 1;
  const stations = Object.entries(state.stations).map(([sid, st]) => {
    const cur = st.current
      ? `${esc(MENUS[st.current.menuId].name)} ${fmtTime(st.current.durationMs - st.current.progressMs)}${bar(st.current.progressMs / st.current.durationMs * 100)}` : '<span class="muted">비어 있음</span>';
    const next = st.next
      ? `<div class="row"><span class="grow">다음: ${esc(MENUS[st.next.menuId].name)} (재료 아직 안 씀)</span>${btn({ action: 'cook.cancelNext', args: { station: sid }, label: '취소' })}</div>` : '<div class="small muted">다음: 없음</div>';
    const held = st.held ? `<div class="small warn">⚠ 트레이가 가득 차 ${esc(MENUS[st.held.menuId].name)} 보관 중</div>` : '';
    return `<div class="card"><b>${STATION_NAMES[sid]}</b><div>${cur}</div>${next}${held}</div>`;
  }).join('');
  const menus = MENU_ORDER.map(id => {
    const m = MENUS[id];
    const ings = Object.entries(m.ingredients).map(([i, n]) => `${INGREDIENTS[i].name} ${state.stock[i] || 0}/${n}`).join(' · ');
    if (!state.learned[id]) {
      const how = m.combo ? `조합대에서 발견 · 재료 ${Object.values(m.ingredients).reduce((a, b) => a + b, 0)}가지 · ${STATION_NAMES[m.station]}` : m.special ? '퀘스트 보상 또는 조합대에서 발견' : '퀘스트로 레시피를 배워야 합니다';
      return `<div class="item"><i class="swatch" style="background:#bbb"></i><div class="meta grow"><b>❓ ${m.combo ? '???' : esc(m.name)}</b><span>${how}</span></div></div>`;
    }
    const sc = stockCheck(state, id);
    const w = waitingBy[id] ? ` · 대기 주문 ${waitingBy[id]}` : '';
    return `<div class="item"><i class="swatch" style="background:${m.color}"></i><div class="meta grow"><b>${esc(m.name)} · ${won(m.price)}</b><span>${STATION_NAMES[m.station]} ${Math.round(m.cookMs / 1000)}초 · ${ings}${w}</span></div>
      ${state.mode !== 'shift' ? '' : btn({ action: 'cook', args: { menu: id }, cls: waitingBy[id] ? 'primary' : '', disabled: !sc.ok, title: sc.ok ? `${m.name} 만들기` : sc.reason, label: '만들기' })}</div>`;
  }).join('');
  const found = MENU_ORDER.filter(id => state.learned[id]).length;
  const autoLine = `<div class="row"><span class="grow small">${state.autoKitchen ? '🍳 주방 자동 · 주문이 들어오면 연이가 만들고 네오가 서빙해요' : '✋ 주방 수동 · 직접 만들고 트레이로 서빙해요'}</span>${btn({ action: 'kitchen.toggle', cls: state.autoKitchen ? 'on' : '', label: state.autoKitchen ? '자동 켜짐' : '자동 꺼짐' })}</div>`;
  if (state.mode !== 'shift') return `${head('🧪 조합대')}${autoLine}${comboBench(state, ui)}<h3>레시피 노트 ${found}/${MENU_ORDER.length}</h3><div class="list">${menus}</div>`;
  return `${head('🍳 주방')}${autoLine}${comboBench(state, ui)}${stations}<h3>레시피 노트 ${found}/${MENU_ORDER.length} (재료는 조리 시작 때 사용)</h3><div class="list">${menus}</div>`;
}

// ── 재료: 모카 식재료점(마을) 또는 영업 중 모카 긴급 배달(배달비 포함). 값 계산은 economy.buy 와 같은 식.
function ingredientRows(state, delivery) {
  const cost = (ing, n) => ing.price * n + (delivery ? Math.ceil(ing.price * n * TEMP.DELIVERY_FEE_RATE) : 0);
  return Object.values(INGREDIENTS).filter(ing => ing.basic || ing.shop).map(ing => {
    const c1 = cost(ing, 1), c5 = cost(ing, 5);
    return `<div class="item"><i class="swatch" style="background:${ing.color}"></i><div class="meta grow"><b>${esc(ing.name)} ${state.stock[ing.id] || 0}개</b><span>개당 ${won(ing.price)}${ing.shop ? ' · 모카 특별 재료' : ''}</span></div>
      ${btn({ action: 'shop.buy', args: { id: ing.id, qty: 1 }, disabled: state.gold < c1, label: `+1 (${c1})` })}${btn({ action: 'shop.buy', args: { id: ing.id, qty: 5 }, disabled: state.gold < c5, label: `+5 (${c5})` })}</div>`;
  }).join('');
}

function shopSheet(state) {
  if (state.mode !== 'shift') return `${head('🧺 재료')}<p class="small">재료는 마을 「모카 식재료점」에서 사요.</p><div class="stack">${btn({ action: 'sheet.open', args: { sheet: 'town', tab: 'moka' }, cls: 'primary', label: '🏘 마을 나가기' })}</div>`;
  return `${head('🛵 모카 긴급 배달')}<p class="small">보유 ${won(state.gold)} · 영업 중에는 가게를 비울 수 없어 배달비 ${Math.round(TEMP.DELIVERY_FEE_RATE * 100)}%가 붙어요 (괄호 안이 낼 돈)</p><div class="list">${ingredientRows(state, true)}</div>`;
}

// ── 마을 나가기(영업 준비 중에만). 장소 이름과 역할은 게임 오리지널 임시 설정(docs/WORLD.md).
const TOWN_TABS = [['moka', '🦦 식재료점'], ['gear', '🗡 장비 좌판'], ['luna', '⚖ 루나의 저울'], ['expand', '🪑 가게 확장']];
function townSheet(state, tab = 'moka') {
  const tabs = `<div class="tabs">${TOWN_TABS.map(([id, label]) => btn({ action: 'town.tab', args: { tab: id }, cls: id === tab ? 'on' : '', label })).join('')}</div>`;
  const chk = townCheck(state);
  const body = !chk.ok ? `<p class="warn">${esc(chk.reason)}</p>`
    : tab === 'gear' ? gearStall(state) : tab === 'luna' ? lunaScale(state) : tab === 'expand' ? expandShop(state) : mokaShop(state);
  return `${head('🏘 마을')}<p class="small">보유 ${won(state.gold)} · 🌙 월정석 ${state.moonstone || 0}개</p>${tabs}${body}`;
}

function mokaShop(state) {
  return `<p class="small">🦦 모카: "신선도 별 다섯 개짜리만 들여놨어. 밤이슬은 오늘 별 네 개 반, 그래도 이 동네 최고."</p><div class="list">${ingredientRows(state, false)}</div>`;
}

function gearStall(state) {
  const eq = state.gear.equipped;
  const slots = Object.entries(GEAR_SLOTS).map(([slot, label]) => `<span>${label}</span><b>${eq[slot] ? esc(GEAR[eq[slot]].name) : '-'}</b>`).join('');
  const rows = GEAR_ORDER.map(id => {
    const g = GEAR[id];
    const price = g.cost.gold ? won(g.cost.gold) : `🌙 ${g.cost.moonstone}`;
    let right;
    if (!state.gear.owned.includes(id)) {
      const can = g.cost.gold ? state.gold >= g.cost.gold : (state.moonstone || 0) >= g.cost.moonstone;
      right = btn({ action: 'gear.buy', args: { id }, disabled: !can, label: price });
    } else if (eq[g.slot] === id) right = btn({ action: 'gear.equip', args: { slot: g.slot }, cls: 'on', title: `${g.name} 빼기`, label: '장착 중' });
    else right = btn({ action: 'gear.equip', args: { slot: g.slot, id }, label: '장착' });
    return `<div class="item"><div class="meta grow"><b>${esc(g.name)} · ${GEAR_SLOTS[g.slot]}</b><span>${esc(g.desc)}</span></div>${right}</div>`;
  }).join('');
  return `<p class="small muted">주인 없는 좌판. 「값은 상자에 넣어 주세요」 팻말만 서 있다. 장비는 영냥이 사냥 능력치만 바꿔요.</p><div class="kv">${slots}</div><div class="list">${rows}</div>`;
}

function lunaScale(state) {
  const m = state.moonstone || 0, rate = TEMP.MOONSTONE_GOLD;
  return `<p class="small">🐰 루나 언니: "월정석 하나에 ${rate}G예요. 저울은 정확해요… 괜찮아요."</p>
    <div class="kv"><span>보유 월정석</span><b>🌙 ${m}</b><span>환율(임시)</span><b>1개 = ${won(rate)}</b><span>전부 바꾸면</span><b>${won(m * rate)}</b></div>
    <div class="row">${btn({ action: 'moonstone.exchange', args: { qty: 1 }, disabled: m < 1, label: '1개' })}${btn({ action: 'moonstone.exchange', args: { qty: 10 }, disabled: m < 10, label: '10개' })}${btn({ action: 'moonstone.exchange', args: { qty: 'all' }, cls: 'primary', disabled: m < 1, label: '전부 환전' })}</div>`;
}

function expandShop(state) {
  const ex = nextExpansion(state);
  const tables = state.interior.furniture.filter(f => FURNITURE[f.defId].table).length;
  const tableRow = ex
    ? `<div class="item"><div class="meta grow"><b>🪑 ${esc(ex.label)}</b><span>지금 테이블 ${tables}개 · 빈자리에 바로 놓여요</span></div>${btn({ action: 'expand.table', cls: 'primary', disabled: state.gold < ex.cost, label: won(ex.cost) })}</div>`
    : `<div class="item"><div class="meta grow"><b>🪑 테이블 ${tables}개</b><span>지금 들일 수 있는 테이블을 모두 들였어요</span></div></div>`;
  const decor = Object.entries(TEMP.DECOR_PRICES).map(([def, price]) => {
    const f = FURNITURE[def];
    return `<div class="item"><i class="swatch" style="background:${f.color}"></i><div class="meta grow"><b>${esc(f.name)}</b><span>분위기 +${f.ambience} · 보관함으로 와요</span></div>${btn({ action: 'expand.decor', args: { def }, disabled: state.gold < price, label: won(price) })}</div>`;
  }).join('');
  return `<div class="list">${tableRow}</div><h3>장식 들이기</h3><div class="list">${decor}</div>`;
}

// ── 퀘스트
function rewardText(r) {
  const out = [];
  if (r.gold) out.push(won(r.gold));
  if (r.items) out.push(Object.entries(r.items).map(([i, n]) => `${INGREDIENTS[i].name} ${n}`).join(', '));
  if (r.learn) out.push(`레시피: ${MENUS[r.learn].name}`);
  return out.join(' + ') || '없음';
}

function questSheet(state) {
  const rows = questView(state).map(q => {
    const right = q.claimed ? '<span class="small ok">✅ 완료</span>'
      : q.locked ? '<span class="small muted">🔒 앞 퀘스트 먼저</span>'
      : btn({ action: 'quest.claim', args: { id: q.id }, cls: q.claimable ? 'primary' : '', disabled: !q.claimable, label: q.claimable ? '보상 받기' : `${q.progress}/${q.goal}` });
    return `<div class="item"><div class="meta grow"><b>${esc(q.title)}</b><span>${esc(q.desc)} · 보상 ${esc(rewardText(q.reward))}</span></div>${right}</div>`;
  }).join('');
  return `${head('📜 퀘스트')}<div class="list">${rows}</div>`;
}

// ── 기타
function moreSheet(state, ui) {
  const off = estimateOfflineIncome(state, Date.now());
  const inShift = state.mode === 'shift' || state.mode === 'hunt';
  const dev = ui.dev ? `<div class="card"><b><span class="tag dev">DEV</span> 개발 기능</b>
      <p class="small muted">별도 저장 키를 씁니다. 배속은 저장하지 않으며 일반 플레이에는 없습니다. 정규 영업 길이(30:00)는 그대로입니다.</p>
      <div class="btns">${[1, 10, 60].map(sp => btn({ action: 'dev.speed', args: { speed: sp }, cls: ui.speed === sp ? 'on' : '', label: `×${sp}` })).join('')}
      ${btn({ action: 'dev.skip', disabled: !inShift || state.paused, label: '+60초 진행' })}</div></div>` : '';
  return `${head('☰ 기타')}
    <div class="list">
      ${btn({ action: 'sheet.open', args: { sheet: 'debt' }, label: `💳 빚 상환 (남은 빚 ${won(state.debt)})` })}
      ${btn({ action: 'sheet.open', args: { sheet: 'companions' }, label: '👥 동료' })}
      ${btn({ action: 'sheet.open', args: { sheet: 'outfits' }, label: '👗 의상' })}
      ${btn({ action: 'game.save', label: '💾 지금 저장' })}
      ${btn({ action: 'game.title', label: '🏠 저장하고 타이틀로' })}
    </div>
    <p class="small muted">🌙 오프라인 운영: ${esc(off.note)}</p>${dev}`;
}

// ── 부채
function debtSheet(state) {
  const ds = debtStage(state);
  const can = state.mode !== 'shift';
  const amounts = [[1000, '1,000G'], [5000, '5,000G'], [Math.min(state.gold, state.debt), '가진 만큼 전액']];
  return `${head('💳 빚 상환')}
    <div class="card kv"><span>남은 빚</span><b>${won(state.debt)}</b><span>갚은 총액</span><b>${won(state.repaidTotal)}</b><span>보유 골드</span><b>${won(state.gold)}</b>
      <span>상환 단계</span><b>${esc(ds.label)}${ds.need ? ` ${won(ds.paid)} / ${won(ds.need)}` : ''}</b></div>
    ${ds.need ? bar(ds.paid / ds.need * 100) : ''}
    <p class="small muted">💡 다음 영업 재료비로 ${won(TEMP.KEEP_FOR_INGREDIENTS_HINT)} 정도는 남겨 두는 것을 권장합니다.</p>
    ${can ? '' : '<p class="small warn">상환은 영업 전이나 마감 후에 할 수 있습니다.</p>'}
    <div class="btns">${amounts.map(([a, l]) => btn({ action: 'debt.repay', args: { amount: a }, disabled: !can || a <= 0 || state.gold < a || state.debt <= 0, label: l })).join('')}</div>`;
}

// ── 동료
function companionSheet(state) {
  const neoStats = STAT_KEYS.map(k => `${STAT_LABELS[k]} ${PEOPLE.neo.stats[k]}`).join(' · ');
  const neoStatus = personBusyReason(state, 'neo') || (state.mode === 'shift' ? staffStatusText(state, 'neo') : state.people.neo.activity === 'hunting' ? '영냥이 모습으로 월정석 사냥 중' : '대기');
  const rows = [
    `<div class="item"><span class="swatch" style="background:${PEOPLE.yeoni.color}"></span><div class="meta grow"><b>연이 · 사장</b><span>카운터·조리·서빙 담당 (접대 안 함)${state.mode === 'shift' ? ` · ${esc(staffStatusText(state, 'yeoni'))}` : ''}</span></div></div>`,
    `<div class="item"><span class="swatch" style="background:${PEOPLE.neo.color}"></span><div class="meta grow"><b>네오 · 접대 담당</b><span>${neoStats}</span><span>상태: ${esc(neoStatus)} · 고양이 모습일 때 이름은 영냥이(같은 사람)</span></div></div>`,
  ];
  for (const r of recruitView(state)) {
    const def = personDef(state, r.id);
    const tag = r.devOnly ? '<span class="tag dev">DEV 임시</span> ' : '';
    let right, sub;
    if (r.status === 'recruited') {
      const usable = isUsableHost(state, r.id);
      sub = usable ? '접대 가능' : `Day ${r.usableFrom} 영업부터 접대 가능`;
      right = '<span class="small ok">✅ 함께함</span>';
    } else if (r.status === 'available') {
      sub = '만남 조건 충족';
      right = btn({ action: 'recruit.event', args: { id: r.id }, cls: 'primary', disabled: state.mode !== 'prep', title: state.mode === 'prep' ? '만남 이벤트 보기' : '영업 준비 중에만 진행할 수 있습니다', label: '만남 이벤트 보기' });
    } else {
      sub = `조건: 정규 영업 ${Math.min(state.stats.shiftsCompleted, r.condition.shiftsCompleted)}/${r.condition.shiftsCompleted}회 · 상환 ${Math.min(state.stats.repayCount, r.condition.repaidAtLeast)}/${r.condition.repaidAtLeast}회`;
      right = '<span class="small muted">🔒 잠김</span>';
    }
    rows.push(`<div class="item"><span class="swatch" style="background:${def?.color || '#999'}"></span><div class="meta grow"><b>${tag}${esc(r.name)}</b><span>${esc(sub)}</span></div>${right}</div>`);
  }
  for (let i = 0; i < LOCKED_SLOT_COUNT; i++) rows.push('<div class="item"><span class="swatch" style="background:#ddd"></span><div class="meta grow"><b>🔒 새로운 인연</b><span>퀘스트로 영입 (아직 정해진 동료 없음)</span></div></div>');
  return `${head('👥 동료')}<div class="list">${rows.join('')}</div><p class="small muted">새 게임의 접대 담당은 네오 한 명입니다. 다른 동료는 퀘스트·이벤트로 영입한 뒤 다음 영업부터 쓸 수 있습니다.</p>`;
}

// ── 의상
function outfitSheet(state) {
  const blocks = OUTFIT_WEARERS.map(who => {
    const eq = state.outfits.equipped[who];
    const slots = OUTFIT_SLOTS.map(slot => {
      const kind = slot === 'outfit' ? 'outfit' : 'acc';
      const items = state.outfits.owned.map(id => OUTFITS[id]).filter(o => o.slot === kind);
      return `<div><span class="small"><b>${SLOT_LABEL[slot]}</b> · 지금: ${eq[slot] ? esc(OUTFITS[eq[slot]].name) : '없음'}</span>
        <div class="btns">${items.map(o => btn({ action: 'outfit.equip', args: { who, slot, item: o.id }, cls: eq[slot] === o.id ? 'on' : '', label: `<i class="swatch" style="background:${o.color}"></i> ${esc(o.name)}` })).join('')}
        ${btn({ action: 'outfit.equip', args: { who, slot, item: '' }, disabled: !eq[slot], label: '벗기' })}</div></div>`;
    }).join('');
    return `<div class="card"><b>${esc(PEOPLE[who].name)}</b>${slots}</div>`;
  }).join('');
  return `${head('👗 의상')}<p class="small muted">의상 1 + 액세서리 2. 보기만 바뀌고 능력치·상성·만족도 상한에는 영향이 없습니다.</p>${blocks}`;
}

// ── 오버레이(우선순위: 확인 > 타이틀 > 사냥 결과 > 결산 > 일시정지 > 레벨업 > 만남 이벤트)
export function overlayHtml(state, ui) {
  if (ui.confirm) return confirmDialog(ui.confirm);
  if (!state) return titleDialog(ui);
  if (state.mode === 'hunt' && state.hunt && state.hunt.status !== 'running') return huntResult(state);
  if (state.mode === 'settlement' && state.lastSettlement) return settlementDialog(state);
  if (state.paused && (state.mode === 'shift' || state.mode === 'hunt')) return pausedDialog(state);
  if (state.mode === 'hunt' && state.hunt?.status === 'running' && state.hunt.picks?.length) return levelUpDialog(state);
  if (ui.discovery && MENUS[ui.discovery]) return discoveryDialog(ui.discovery);
  if (ui.recruitEvent) return recruitDialog(state, ui.recruitEvent);
  return '';
}

function confirmDialog(cf) {
  return `<div class="dialog" role="alertdialog" aria-modal="true"><h2>${esc(cf.title)}</h2><p>${esc(cf.text)}</p>
    <div class="stack">${btn({ action: 'confirm.yes', cls: cf.danger ? 'primary danger' : 'primary', label: esc(cf.yesLabel || '확인') })}${btn({ action: 'confirm.no', label: '취소' })}</div></div>`;
}

function titleDialog(ui) {
  const dev = ui.dev ? '<p class="small"><span class="tag dev">DEV</span> 개발 모드 · 일반 저장과 다른 별도 저장 키를 씁니다.</p>' : '';
  const store = ui.storageOk ? '' : '<p class="small warn">⚠ 이 브라우저에서 저장소를 쓸 수 없어 새로고침하면 진행이 사라집니다.</p>';
  return `<div class="dialog" role="dialog" aria-modal="true">
    <div class="title-art" aria-hidden="true">☕🐾</div>
    <h1>연이의 아틀리에</h1><p class="small muted">꿀꿀 운세 외전 · 토끼 자매 빚 갚기 대작전 (프로토타입)</p>${dev}${store}
    <div class="stack">
      ${btn({ action: 'game.continue', cls: 'primary', disabled: !ui.hasSave, label: ui.hasSave ? '이어하기' : '이어하기 (저장 없음)' })}
      ${btn({ action: 'game.new', label: '새 게임' })}
      ${btn({ action: 'game.prologue', label: '📖 프롤로그 보기' })}
      ${btn({ action: 'game.reset', disabled: !ui.hasSave, label: '저장 초기화' })}
    </div></div>`;
}

function pausedDialog(state) {
  const what = state.mode === 'hunt'
    ? `🐾 사냥 남은 시간 ${fmtTime(state.hunt.durationMs - state.hunt.elapsedMs)}`
    : `⏱ 영업 남은 시간 ${fmtTime(remainingShift(state))}`;
  const hosting = state.mode === 'shift' ? Object.values(state.visits).filter(v => v.acceptAt != null && !v.settled)
    .map(v => `<li>${v.tableNo}번 접대 ${fmtTime(v.endAt - state.shift.elapsedMs)} 남음</li>`).join('') : '';
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>⏸ 일시정지</h2><p><b>${what}</b></p>
    ${hosting ? `<ul class="small">${hosting}</ul>` : ''}<p class="small muted">시간이 멈춰 있습니다. 같은 손님, 같은 남은 시간으로 이어집니다.</p>
    <div class="stack">${btn({ action: 'resume', cls: 'primary', label: '▶ 계속하기' })}${btn({ action: 'game.title', label: '💾 저장하고 타이틀로' })}</div></div>`;
}

function settlementDialog(state) {
  const s = state.lastSettlement;
  const hostings = s.hostings.length
    ? `<div class="list">${s.hostings.map(h => `<div class="item"><div class="meta grow"><b>${h.tableNo}번 · ${esc(personName(state, h.nominee))} · ${h.H.toFixed(1)} ${esc(h.grade)}${h.capped ? ' (상한)' : ''}</b><span>주문 ${won(h.servedTotal)} · 팁 ${won(h.tip)}${h.feverExtra ? ` (피버 +${h.feverExtra})` : ''} · 음식 ${h.food ?? '-'}점</span></div></div>`).join('')}</div>`
    : '<p class="small muted">이번 영업의 지명 접대 없음</p>';
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>📒 Day ${s.day} 결산</h2>
    <div class="kv"><span>판매 금액(서빙 완료분)</span><b>${won(s.sales)}</b><span>재료비</span><b>−${won(s.ingredientCost)}</b>
      <span>기본 팁</span><b>${won(s.baseTips)}</b><span>피버 추가 팁</span><b>${won(s.feverTips)}</b>
      <span class="sum">영업 결과</span><b class="sum">${s.result >= 0 ? '' : '−'}${won(Math.abs(s.result))}</b>
      <span>보유 골드</span><b>${won(s.gold)}</b><span>남은 빚</span><b>${won(s.debt)}</b></div>
    <p class="small muted">서빙 ${s.servedCount}건 · 일반 ${s.regularVisits} · 지명 ${s.nominationVisits} · 놓친 주문 ${s.lostOrders} · 폐기 ${s.wasted}</p>
    <h3>지명 접대</h3>${hostings}
    <div class="stack">${btn({ action: 'settlement.close', cls: 'primary', label: '다음 날 준비로' })}</div></div>`;
}

// 레벨업 카드 3장. 고르는 동안 사냥 시간이 멈춘다(엔진이 멈춤, UI는 고른 번호만 보낸다).
function levelUpDialog(state) {
  const h = state.hunt;
  const cards = h.picks[0].map((o, i) => {
    const d = describeOption(h, o);
    return btn({ action: 'hunt.pick', args: { index: i }, cls: `lv-card k-${o.kind}`,
      label: `<span class="lv-icon" aria-hidden="true">${esc(d.icon)}</span><span class="lv-body"><b>${esc(d.name)}</b><span class="lv-tag">${esc(d.tag)}</span><span class="small">${esc(d.text)}</span></span>` });
  }).join('');
  const more = h.picks.length > 1 ? `<p class="small muted">남은 선택 ${h.picks.length - 1}번</p>` : '';
  return `<div class="dialog levelup" role="dialog" aria-modal="true"><h2>✨ 레벨 ${h.level}! 하나를 고르세요</h2>
    <p class="small muted">고르는 동안 시간이 멈춰 있어요.</p><div class="lv-cards">${cards}</div>${more}</div>`;
}

function huntResult(state) {
  const h = state.hunt;
  const head2 = h.status === 'down' ? '😿 영냥이가 지쳤어요' : h.status === 'retreat' ? '🏠 일찍 돌아왔어요' : '🎉 사냥 완료';
  const bag = Object.entries(h.bag).filter(([id, n]) => id === 'moonstone' || n > 0).map(([id, n]) => `<span>${id === 'moonstone' ? '🌙 월정석' : esc(INGREDIENTS[id]?.name || id)}</span><b>${n}</b>`).join('');
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>${head2}</h2>
    <div class="kv">${bag}<span>처치</span><b>${h.kills}</b><span>레벨</span><b>${h.level ?? 1}</b><span>거대한 검은 손</span><b>${h.bossDown ? '물리침' : '-'}</b><span>사냥 시간</span><b>${fmtTime(h.elapsedMs)}</b></div>
    <p class="small muted">월정석은 한 번만 들어갑니다. 쓰러져도 모은 월정석은 가져와요. 마을 「루나의 저울」에서 골드로 바꿀 수 있어요.</p>
    <div class="stack">${btn({ action: 'hunt.finish', cls: 'primary', label: '월정석 받고 가게로' })}</div></div>`;
}

function discoveryDialog(id) {
  const m = MENUS[id];
  const ings = Object.entries(m.ingredients).map(([i, k]) => `${INGREDIENTS[i].name}${k > 1 ? ` ×${k}` : ''}`).join(' + ');
  return `<div class="dialog discovery" role="dialog" aria-modal="true">
    <div class="disc-burst" aria-hidden="true"><i style="background:${m.color}"></i></div>
    <h2>✨ 새 레시피 발견!</h2><p class="disc-name">${esc(m.name)}</p>
    <div class="kv"><span>재료</span><b>${esc(ings)}</b><span>조리</span><b>${STATION_NAMES[m.station]} ${Math.round(m.cookMs / 1000)}초</b><span>판매가</span><b>${won(m.price)}</b></div>
    <p class="small muted">이제 손님이 이 메뉴를 주문할 수 있어요. 가격과 시간은 임시값입니다.</p>
    <div class="stack">${btn({ action: 'discovery.close', cls: 'primary', label: '레시피 노트에 적기' })}</div></div>`;
}

function recruitDialog(state, id) {
  const r = recruitView(state).find(x => x.id === id);
  if (!r) return '';
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>${r.devOnly ? '<span class="tag dev">DEV</span> ' : ''}${esc(r.meetEvent.title)}</h2>
    ${r.meetEvent.lines.map(l => `<p class="line">${esc(l)}</p>`).join('')}
    <p class="small muted">보상(1회): ${esc(rewardText(r.reward || {}))} · 완료하면 다음 영업(Day ${state.day})부터 접대 가능</p>
    <div class="stack">${btn({ action: 'recruit.complete', args: { id }, cls: 'primary', label: '이벤트 완료' })}${btn({ action: 'recruit.close', label: '나중에' })}</div></div>`;
}
