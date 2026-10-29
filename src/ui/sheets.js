import {pixelIcon,pxBtn} from './pixel-icons.js';
import { creditsScreen } from './credits.js';
import {titleGameRoom,gameRoomSheet} from './game-room.js';
import {hostFeeQuote} from '../game/host-fees.js';
import {catCafeActive} from '../game/cat-cafe-rules.js';
import {worldCastSheet} from './world-cast.js';
import {WORLD_PLACES} from './world-screen.js';
import {uiIcon} from './moonlight-ui.js';
import {trailSheet} from './trail-ui.js';
import {kfpSheet} from './kfp-ui.js';
import {hunterName} from '../game/hunt-cast.js';
import {foodGiftSheet} from './food-gifts.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {staffingSheet} from './staffing.js';
import {cafeCapacity} from '../game/capacity.js';
import {groundsSheet} from './grounds.js';
import {branchesSheet} from './branches.js';
import {areaAvailable} from '../game/branches.js';
import {HELPERS,helperAvailable} from '../game/engine.js';
import {maxActionPoints} from '../game/calendar.js';
import {craftingSheet} from './crafting.js';
import {creditView,exchangeRate} from '../game/finance.js';
import {menuPrice,cafeProgress} from '../game/cafe-growth.js';
import {payrollView} from '../game/payroll.js';
import { armorySheet, supplyShop, gearList } from './armory.js';
import {deliverySheet} from './delivery.js';
import {tableCookingOrders} from '../game/table-cooking.js';
import { tutorialSheet } from './tutorials.js';
import { automationStatus } from '../game/auto.js';
import { ABILITIES, abilityCheck } from '../game/permissions.js';
import { stressCrew, stressOf, stressStage, stressLabel, isResting } from '../game/stress.js';
import { DEST1NOVA_IDS, fansOf, fanTierName, nextTierAt } from '../game/fans.js';
import { audioSheet,audioQuickButton } from './audio.js';
import { HELP_SCENES } from '../data/help.js';
import { farmSheet } from './farm.js';
import { huntPrepSheet, NIGHT_ORN } from './hunt-prep.js';
import { dressroomSheet } from './dressroom.js';
import { assetStyle, assetIcon } from './asset-html.js';
// 바텀시트(테이블·주방·재료·마을·퀘스트·기타·부채·동료·의상)와 전면 오버레이(타이틀·확인·일시정지·결산·사냥 결과·만남 이벤트).
// 상태를 읽기만 하고, 버튼은 data-action 으로 명령을 요청한다.

import { RULES, STAT_KEYS, STAT_LABELS, CORE_CAP } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, MENU_ORDER, INGREDIENTS } from '../data/menus.js';
import { HELP_KINDS, TOPICS } from '../data/lines.js';
import { PEOPLE, LOCKED_SLOT_COUNT, STAFF_CREW } from '../data/companions.js';
import { FURNITURE, AREAS } from '../data/layout.js';
import { fmtTime, personName, personDef, hostStats, usableHosts, isUsableHost, remainingShift } from '../game/state.js';
import { STATION_NAMES, tableByNo, customerAt, staffStatusText, stockCheck } from '../game/cafe.js';
import { acceptCheck, hostingPreview, personBusyReason } from '../game/nomination.js';
import { gradeOf } from '../game/satisfaction.js';
import { debtStage, questView, recruitView } from '../game/economy.js';
import { estimateOfflineIncome } from '../game/offline.js';
import { describeOption, huntCheck, CHEST_WHEEL, CHEST_FALLBACK } from '../game/hunt.js';
import { HANBI_STAGES } from '../data/hunt-stages.js';
import { hiddenGuestQuest } from '../game/hidden-guest.js';
import { survivalReward } from '../game/hunt-rewards.js';
import { BONDS, BOND_IDS, COMMON_GIFT, ARCANA, MAX_RANK, bondRank, bondReady, rankWaits, perkTier, withWa } from '../data/bonds.js';
import { SPEAKERS } from '../story/prologue.js';
import { townCheck, nextExpansion, areaPrice, decorPrice } from '../game/town.js';
import { placeLock, PLACE_NAMES, bondOpen, bondMasked, bondName } from '../game/unlocks.js';
import { COMBO_MAX } from '../game/recipe.js';
import { dateLabel, isEnded, calendarOf, monthName } from '../game/calendar.js';
import { interestRate, nextHike, interestDue, monthOfDay, creditorView } from '../game/creditor.js';
import { ENDINGS } from '../story/months.js';
import { btn, esc } from './dom.js';
import { won } from './hud.js';
import { settlementScreen } from './settlement.js';

const ORDER_STATUS = { waiting: '⏳ 조리·서빙 대기', assigned: '🚶 운반 중', served: '✅ 서빙 완료', cancelled: '✖ 취소' };

const head = title => `<h2>${title}${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>`;
const serviceBanner = (key, name, title, line) => `<section class="service-banner" style="${assetStyle(`services/${key}`)}"><div><h3>${esc(title)}</h3><p>${esc(line)}</p></div></section>`;
const bar = (pct, cls = '') => `<span class="bar" aria-hidden="true"><i class="${cls}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;

export function sheetHtml(state,ui){const html=sheetBody(state,ui);if(state?.mode!=='prep'||ui.sheet?.kind!=='farm')return html;const helpers=Object.keys(HELPERS).filter(id=>state.roster[id]&&perkTier(state,id)>=HELPERS[id].tier);return `<div class="delegate-strip"><span>농장 돌봄을 동료에게 부탁할 수 있어요</span>${helpers.map(id=>btn({action:'world.delegate',args:{id},disabled:!!state.ap.delegated?.[id],cls:ui.delegate===id?'on':'',label:`${BONDS[id].name} ${state.ap.delegated?.[id]?'대행 완료':'대행 선택'}`})).join('')}</div>${html}`;}
function sheetBody(state, ui) {
  const s = ui.sheet;
  if (!state || !s) return '';
  switch (s.kind) {
    case 'gameroom':return gameRoomSheet();
    case 'worldcast':return worldCastSheet(state);
    case 'trail': return trailSheet(state);
    case 'kfp':return kfpSheet(state);
    case 'staffing': return staffingSheet(state);
    case 'grounds': return groundsSheet(state,ui);
    case 'branches': return branchesSheet(state,ui);
    case 'manage': return manageSheet(state);
    case 'table': return tableSheet(state, s.no, ui);
    case 'craft': return craftingSheet(state, ui);
    case 'kitchen': return kitchenSheet(state, ui);
    case 'delivery':return deliverySheet(state,ui);
    case 'shop': return state.mode==='shift'?deliverySheet(state,ui):shopSheet(state);
    case 'town': return townSheet(state, s.tab, ui);
    case 'quests': return questSheet(state);
    case 'more': return moreSheet(state, ui);
    case 'debt': return debtSheet(state);
    case 'companions': return companionSheet(state,ui);
    case 'rankup': return rankUpSheet(state, ui.sheet.up);
    case 'outfits': return state.hostbar.open?dressroomSheet(state, ui):`${head('아직 닫힌 드레스룸')}<div class="locked-room"><b>옷걸이에 초대장이 걸려 있어요</b><p>첫해 5월의 호스트 카페 개업 이야기를 마치면 동료들과 새 의상을 골라요.</p></div>`;
    case 'farm': return placeLock(state,'farm')?`${head(PLACE_NAMES.farm)}${lockedRoom(placeLock(state,'farm'))}`:farmSheet(state, ui);
    case 'hunt': return huntPrepSheet(state,ui);
    case 'armory': return placeLock(state,'gear')?`${head(PLACE_NAMES.gear)}${lockedRoom(placeLock(state,'gear'))}`:armorySheet(state,ui);
    case 'tutorial': return tutorialSheet(ui);
    case 'foodgift':return foodGiftSheet(state,ui);
    case 'audio': return audioSheet();
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
  const foodOrders=`<div class="card"><h3>🍽 주문</h3>${ordersHtml(state, visit, no)}</div>`;
  const foods = visit.foodScores;
  const foodText = foods.length ? `${Math.round(foods.reduce((a, b) => a + b, 0) / foods.length)}점 (${foods.length}회)` : '아직 없음';
  if (visit.kind === 'regular') {
    parts.push(`<div class="card"><div class="kv"><span>손님 유형</span><b>일반 손님</b><span>음식 점수</span><b>${foodText}</b></div>
      <p class="small muted">주문한 음식을 만들어 테이블로 가져다주세요.</p></div>`);
  } else {
    parts.push(nominationCard(state, visit, c, now, foodText, ui));
  }
  parts.push(foodOrders);
  return parts.join('');
}

function ordersHtml(state, visit, no) {
  const orders = visit.orderIds.map(id => state.orders[id]).filter(Boolean);
  if (!orders.length) return '<p class="small muted">아직 주문 전입니다 (메뉴 고르는 중).</p>';
  const usedItems = new Set();
  return `${tableCookingOrders(state,no).length>1?btn({action:'order.table',args:{no},cls:'primary big',label:'이 테이블 주문 한 번에 만들기'}):''}<div class="list">${orders.map(o => {
    const m = MENUS[o.menuId];
    let action = '';
    if (o.status === 'waiting') {
      const item = state.tray.find(it => it && !it.reservedFor && it.menuId === o.menuId && (!it.orderId||it.orderId===o.id) && !usedItems.has(it.id));
      if (item) { usedItems.add(item.id); action = btn({ action: 'serve', args: { item: item.id, no }, cls: 'primary', label: '트레이에서 서빙' }); }
      else action = btn({ action: 'order.quick', args: { id: o.id }, cls: 'primary', disabled: !stockCheck(state, o.menuId).ok, label: '만들기' });
    }
    return `<div class="item">${assetIcon(`icons/${m.id}`,`<i class="swatch" style="background:${m.color}"></i>`)}<div class="meta grow"><b>${esc(m.name)} · ${won(o.price)}</b><span>${ORDER_STATUS[o.status]}</span></div>${action}</div>`;
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
    <details class="host-score-details"><summary>만족도 계산 기준</summary><p class="small muted">기본 상성 M ${pv.M.toFixed(1)} · 대화 보정 ${pv.talkBonus >= 0 ? '+' : ''}${pv.talkBonus} · 대기 불만 −${pv.waitPenalty}${pv.capped ? ` · 상한 전 ${pv.H0.toFixed(1)}` : ''}</p>
    ${capLine}<p class="small muted">음식·인테리어·의상·피버는 접대 만족도를 올리지 않습니다(피버는 팁만 2배).</p></details>`;
}

function nominationCard(state, visit, c, now, foodText, ui) {
 const pid=visit.nominee,pv=hostingPreview(state,visit,pid),profile=PDF.PROFILES.find(p=>p.id===visit.profileId);
 const fee=visit.acceptAt==null?hostFeeQuote(state,visit):(visit.hostFeeQuote||0);
 const out=[`<section class="host-service-card"><div class="host-service-face">${companionPortrait(pid==='neo'&&catCafeActive(state)?'neo_cat':pid)}<div><b>${esc(personName(state,pid))}의 접대</b><small>${esc(profile?.label||visit.profileId)} · ${visit.acceptAt==null?'60초 전담':fmtTime(Math.max(0,visit.endAt-now))+' 남음'}</small></div></div>`];
 if(visit.settled)return out.join('')+`<p>접대 완료 · 지명료 ${won(visit.hostFee||0)} + 팁 ${won(visit.tip?.total||0)}</p></section>`;
 if(visit.acceptAt==null){
  const chk=acceptCheck(state,visit.tableNo);
  out.push(`<div class="host-fee-quote"><span>완료 시 지명료</span><strong>${won(fee)}</strong><small>카페 레벨·인기도·분위기 반영 · 음식값·팁 별도<br>60초 동안 일반 업무를 쉬어요</small></div><p class="host-preview">예상 만족도 <b>${pv.H.toFixed(0)} · ${esc(pv.grade.label)}</b></p><p class="small">요청 대기 ${fmtTime(TEMP.NOMINATION_PATIENCE_MS-(now-visit.requestAt))}</p>`);
  if(!chk.ok)out.push(`<ul class="reasons">${chk.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`);
  out.push(`<div class="host-accept-actions">${btn({action:'nomination.accept',args:{no:visit.tableNo},cls:'primary',disabled:!chk.ok,label:`${won(fee)} 지명 수락`})}${btn({action:'nomination.decline',args:{no:visit.tableNo},label:'일반 식사로 안내'})}</div>`);
  const others=usableHosts(state).filter(id=>id!==pid&&state.staff[id]);
  if(others.length)out.push(`<details class="host-score-details"><summary>다른 동료 추천</summary>${others.map(id=>btn({action:'nomination.propose',args:{no:visit.tableNo,person:id},label:`${esc(personName(state,id))} 추천 · 예상 ${hostingPreview(state,visit,id).H.toFixed(0)}`})).join('')}</details>`);
 }else{
  out.push(`<div class="host-running-summary"><b>완료 시 ${won(fee)} + 음식값·팁</b>${bar((now-visit.acceptAt)/(visit.endAt-visit.acceptAt)*100)}</div>`);
  const open=visit.help.filter(h=>h.status==='open'),pending=visit.help.find(h=>h.status==='pending');
  out.push(open.length?open.map(h=>helpHtml(state,visit,h,now)).join(''):`<p class="host-next-help">${pending?`다음 도움 요청 · ${HELP_KINDS[pending.kind].label} · ${fmtTime(pending.at-now)} 뒤`:'도움 요청 완료 · 접대를 마무리하고 있어요'}</p>`);
  out.push(`<p class="host-preview">현재 만족도 <b>${pv.H.toFixed(0)} · ${esc(pv.grade.label)}</b>${visit.fevered?' · 피버 팁 2배':''}</p>`);
 }
 out.push(`<details class="host-score-details"><summary>손님 선호·능력치·응대 기록</summary>${prefsGrid(state,visit,pid)}${predictionHtml(pv,'음식 점수는 별도로 계산해요')}<p>음식 ${foodText}</p>${visit.acceptAt!=null?visit.help.filter(h=>h.status==='done'||h.status==='missed').map(h=>helpHtml(state,visit,h,now)).join(''):''}</details>${btn({action:'sheet.close',cls:'host-return',label:'카페로 돌아가기'})}</section>`);
 return out.join('');
}

function helpHtml(state, visit, h, now) {
  const label = HELP_KINDS[h.kind].label;
  if (h.status === 'pending') return `<div class="item"><div class="meta grow"><b>${label}</b><span>${fmtTime(h.at - now)} 뒤</span></div></div>`;
  if (h.status === 'done') return `<div class="item"><div class="meta grow"><b>${label}</b><span>✅ 응답함${h.result === 'good' ? ' · 좋은 반응' : ''}</span></div></div>`;
  if (h.status === 'missed') return `<div class="item"><div class="meta grow"><b>${label}</b><span>✖ 놓침 (대화 보정 −1)</span></div></div>`;
  const args = c => ({ visit: visit.id, index: h.index, choice: c });
  const scene = HELP_SCENES[h.kind];
  const choices = `<div class="choice-grid">${scene.choices.map(([id, label]) => btn({ action: 'help.respond', args: args(id), label: esc(label) })).join('')}</div>`;
  return `<div class="sos-card"><b>SOS · ${label}</b><div class="sos-speech">${visit.nominee==='neo'&&catCafeActive(state)?assetIcon('portraits/neo_cat'):`<canvas data-talking-portrait="${esc(visit.nominee)}" width="96" height="96" aria-hidden="true"></canvas>`}<p>${esc(scene.prompt)}</p></div><span class="small">${fmtTime(h.until - now)} 안에 응답</span>${bar((h.until - now) / (h.until - h.at) * 100)}${choices}</div>`;

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
      label: `${assetIcon(`icons/${ing.id}`,`<i class="swatch" style="background:${ing.color}"></i>`)}<span class="cb-ing-name">${esc(ing.name)}</span><small>${Math.max(0, left)}</small>` });
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
  const capacity=cafeCapacity(state);
  for (const o of Object.values(state.orders)) if (o.status === 'waiting') waitingBy[o.menuId] = (waitingBy[o.menuId] || 0) + 1;
  const stations = Object.entries(state.stations).map(([sid, st]) => {
    const cur = runningJobs(st).map(job=>`<div class="kitchen-job" data-job="${job.id}"><b>${esc(MENUS[job.menuId].name)}</b> ${fmtTime(job.durationMs-job.progressMs)}${bar(job.progressMs/job.durationMs*100)}${btn({action:'cook.cancel',args:{job:job.id},label:'이 조리 취소 · 재료 반환'})}</div>`).join('') || '<span class="muted">비어 있음</span>';
    const next = queuedJobs(st).map(job=>`<div class="row"><span class="grow">대기: ${esc(MENUS[job.menuId].name)} (재료 아직 안 씀)</span>${btn({action:'cook.cancel',args:{job:job.id},label:'이 대기 취소'})}</div>`).join('')||'<div class="small muted">다음: 없음</div>';
    const held = stationItems(st).map(it=>`<div class="small warn">완성 · ${esc(MENUS[it.menuId].name)} 보관 중</div>`).join('');
    return `<div class="card station-card">${assetIcon(`objects/${sid}`)}<b>${STATION_NAMES[sid]}</b><div>${cur}</div>${next}${held}</div>`;
  }).join('');
  const menus = MENU_ORDER.map(id => {
    const m = MENUS[id];
    const ings = Object.entries(m.ingredients).map(([i, n]) => `${INGREDIENTS[i].name} ${state.stock[i] || 0}/${n}`).join(' · ');
    if (!state.learned[id]) {
      const how = m.nominationOnly ? `${m.huntStage}단계 이상 사냥에서 전용 재료 획득 · 지명 접대 손님 전용 판매` : m.farm ? '연이의 농장에서 해당 작물을 수확하면 배워요' : m.combo ? `조합대에서 발견 · 재료 ${Object.values(m.ingredients).reduce((a, b) => a + b, 0)}가지 · ${STATION_NAMES[m.station]}` : m.special ? '퀘스트 보상 또는 조합대에서 발견' : '퀘스트로 레시피를 배워야 합니다';
      return `<div class="item"><i class="swatch" style="background:#bbb"></i><div class="meta grow"><b>❓ ${m.combo ? '???' : esc(m.name)}</b><span>${how}</span></div></div>`;
    }
    const sc = stockCheck(state, id);
    const w = waitingBy[id] ? ` · 대기 주문 ${waitingBy[id]}` : '';
    return `<div class="item">${assetIcon(`icons/${m.id}`,`<i class="swatch" style="background:${m.color}"></i>`)}<div class="meta grow"><b>${esc(m.name)} · ${won(menuPrice(state,m))}</b><span>${m.nominationOnly?'지명 손님 전용 · ':''}${STATION_NAMES[m.station]} ${Math.round(m.cookMs / 1000)}초 · ${ings}${w}</span></div>
      ${state.mode !== 'shift' ? '' : btn({ action: 'cook', args: { menu: id }, cls: waitingBy[id] ? 'primary' : '', disabled: !sc.ok, title: sc.ok ? `${m.name} 만들기` : sc.reason, label: '만들기' })}</div>`;
  }).join('');
  const found = MENU_ORDER.filter(id => state.learned[id]).length;
  const autoLine = automationRow(state, 'hall') + automationRow(state, 'hall_neo') + automationRow(state, 'kitchen');
  if (state.mode !== 'shift') return `${head('주방 · 루나 언니')}<p class="small">설비당 동시 ${capacity.stationSlots}건${capacity.stationSlots===1?' · 같은 손님 2건은 병렬':''} · 픽업 ${capacity.traySlots}칸</p><p class="small">카페 Lv.${cafeProgress(state).level} · 레벨에 맞춰 메뉴 판매가가 올라가요.</p>${serviceBanner('kitchen','LUNA’S KITCHEN','따끈한 한 잔, 한 접시','재료를 고르면 제가 맛있게 준비할게요.')}${autoLine}${comboBench(state, ui)}<h3>레시피 노트 ${found}/${MENU_ORDER.length}</h3><div class="list">${menus}</div>`;
  return `${head('주방 · 루나 언니')}<p class="small">설비당 동시 ${capacity.stationSlots}건${capacity.stationSlots===1?' · 같은 손님 2건은 병렬':''} · 픽업 ${capacity.traySlots}칸</p><p class="small">카페 Lv.${cafeProgress(state).level} · 레벨에 맞춰 메뉴 판매가가 올라가요.</p>${serviceBanner('kitchen','LUNA’S KITCHEN','따끈한 한 잔, 한 접시','포장 주문은 더 빠르게 준비해요.')}${autoLine}${comboBench(state, ui)}${stations}<h3>레시피 노트 ${found}/${MENU_ORDER.length} (재료는 조리 시작 때 사용)</h3><div class="list">${menus}</div>`;
}

// ── 재료: 모카 식재료점(마을) 또는 영업 중 모카 긴급 배달(배달비 포함). 값 계산은 economy.buy 와 같은 식.
function ingredientRows(state, delivery) {
  const cost = (ing, n) => ing.price * n + (delivery ? Math.ceil(TEMP.DELIVERY_FEE) : 0);
  return Object.values(INGREDIENTS).filter(ing => ing.basic || ing.shop).map(ing => {
    const c1 = cost(ing, 1), c5 = cost(ing, 5);
    return `<div class="item">${assetIcon(`icons/${ing.id}`,`<i class="swatch" style="background:${ing.color}"></i>`)}<div class="meta grow"><b>${esc(ing.name)} ${state.stock[ing.id] || 0}개</b><span>개당 ${won(ing.price)}${ing.shop ? ' · 모카 특별 재료' : ''}</span></div>
      ${btn({ action: 'shop.buy', args: { id: ing.id, qty: 1 }, disabled: state.gold < c1, label: `+1 (${c1})` })}${btn({ action: 'shop.buy', args: { id: ing.id, qty: 5 }, disabled: state.gold < c5, label: `+5 (${c5})` })}</div>`;
  }).join('');
}

function shopSheet(state) {
  if (state.mode !== 'shift') return `${head('🧺 재료')}<p class="small">재료는 마을 「모카 식재료점」에서 사요.</p><div class="stack">${btn({ action: 'sheet.open', args: { sheet: 'town', tab: 'moka' }, cls: 'primary', label: '🏘 마을 나가기' })}</div>`;
  return `${head('모카의 긴급 배달')}${serviceBanner('delivery','MOKA DELIVERY','부족한 재료, 지금 배달','가게는 맡겨 둬. 신선한 재료로 가져올게!')}<p class="small">보유 ${won(state.gold)} · 영업 중에는 가게를 비울 수 없어 배달비 ${TEMP.DELIVERY_FEE}G가 붙어요 (괄호 안이 낼 돈)</p><div class="list">${ingredientRows(state, true)}</div>`;
}

// ── 마을 나가기(영업 준비 중에만): 월드 맵. 장소를 누르면 연이가 그곳으로 가고, 그 장소의 동료·가게가 아래에 열린다.
// 장소 이름은 연이가 걷는 월드맵과 공유하고, 시트는 상세 기능만 표시한다.
const placeOf = id => WORLD_PLACES.find(p => p.id === id) || WORLD_PLACES[0];
const bondAt = place => BOND_IDS.find(id => BONDS[id].place === place);
const MYSTERY_FACE = '<span class="mystery-silhouette" aria-hidden="true">?</span>';

function townSheet(state, tab = 'atelier', ui = {}) {
  const here = placeOf(tab);
  const chk = townCheck(state);
  const bid = bondAt(here.id);
  const lock = placeLock(state, here.id);
  const body = !chk.ok ? `<p class="warn">${esc(chk.reason)}</p>` : lock ? lockedRoom(lock)
    : placeBody(state, here.id, ui) + (bid ? `<h3 class="shop-bond-head">${esc(withWa(bondName(state, bid)))}의 인연</h3>${bondCard(state, bid)}` : '');
  return `${head(here.name)}${shopWallet(state)}${body}`;
}

// 상점 공통 지갑 줄: 창을 내려도 위에 붙어 있다. 행동력은 대화·사냥 출발에만 쓴다
const shopWallet = state => `<div class="shop-wallet" aria-label="보유 재화"><span>${won(state.gold)}</span><span>🌙 ${(state.moonstone || 0).toLocaleString('ko-KR')}</span><span title="대화와 사냥 출발에만 써요">행동력 ${state.ap.left}</span></div>`;

// 열리기 전 장소 안내(잠금 이유만 보이고 조작은 없다)
const lockedRoom = reason => `<div class="locked-room"><b>🔒 아직 닫혀 있어요</b><p>${esc(reason)}</p></div>`;

function placeBody(state, id, ui = {}) {
  switch (id) {
    case 'moka': return mokaShop(state);
    case 'luna': return lunaShelter(state);
    case 'finance': return financeCenter(state, ui);
    case 'gear': return gearStall(state);
    case 'expand': return expandShop(state);
    case 'hunt': {
      const hc = huntCheck(state);
      return `<p class="small muted">강 건너 달그늘. 검은 손은 달이 갈수록 단단해진다. 정예·보스를 쓰러뜨리면 월정석이 많이 나온다.</p>
        <div class="stack">${btn({ action: 'sheet.open', args: {sheet:'hunt'}, cls: 'primary', disabled: !hc.ok, title: hc.ok ? '영냥이 월정석 생존 사냥' : hc.reasons.join(' / '), label: '🐾 사냥 준비하기 · 행동력 1' })}</div>`;
    }
    default: return `<p class="small muted">계산대는 연이 자리. 동료와 대화하면 행동력 1, 선물은 순마다 한 사람에게 한 번씩 줄 수 있어요.</p>`;
  }
}

// 인연 카드(페르소나식): 아르카나·랭크 10칸·다음 랭크까지 남은 점수·능력 해방 목록·대화(행동력 1)·선물
function bondCard(state, id) {
  const b = BONDS[id], v = state.affinity[id] || 0, r = bondRank(state, id), R = TEMP.BONDS.RANKS, P = TEMP.BONDS.PERK_RANKS;
  const wait = rankWaits(state, id), ready = bondReady(state, id) && !wait, lo = r ? R[r - 1] : 0, hi = R[r], [num, arc] = ARCANA[id] || ['?', ''];
  const n = P.findIndex(x => x > r);
  const status = r >= MAX_RANK ? '인연 MAX · 모든 능력이 해방됐어요'
    : wait ? '✦ 이번 달에는 이미 인연이 깊어졌어요 · 다음 달 대화에서 랭크 업'
    : ready ? '✦ 인연이 깊어질 것 같다 · 다음 대화에서 랭크 업'
    : `다음 랭크까지 ${hi - v}점 · 대화·선물·함께 일하기로 쌓여요`;
  const pips = Array.from({ length: MAX_RANK }, (_, i) => `<i class="${i < r ? 'on' : ''}${P.includes(i + 1) ? ' perk' : ''}"></i>`).join('');
  const perks = b.perks.map((p, i) => `<li class="${r >= P[i] ? 'open' : i === n ? 'next' : ''}"><b>Rank ${P[i]}</b><span>${esc(p.label)}</span><small>${r >= P[i] ? '해방' : i === n ? '다음' : '잠김'}</small></li>`).join('');
  const talked = state.ap.talked[id], gifted = state.ap.gifted[id];
  const talkBtn = btn({ action: 'bond.talk', args: { id }, cls: 'primary' + (ready && !talked ? ' rank-ready' : ''), disabled: talked || state.ap.left < 1 || !townCheck(state).ok, title: talked ? '이번 순에 이미 이야기했어요' : state.ap.left < 1 ? '행동력이 없어요 · 영업을 마치면 채워져요' : '', label: talked ? '💬 이야기함' : ready ? '✦ 랭크 업 대화 (행동력 1)' : '💬 대화 (행동력 1)' });
  const giftBtn = g => btn({ action: 'bond.gift', args: { id, gift: g.id }, disabled: gifted || state.gold < g.cost || !townCheck(state).ok, title: gifted ? '이번 순에 이미 선물했어요' : state.gold < g.cost ? `골드가 부족합니다 (${g.cost}G)` : '', label: `${esc(g.name)} · ${won(g.cost)}<small>인연 +${g===b.gift?TEMP.BONDS.GIFT_LIKED:TEMP.BONDS.GIFT_COMMON}</small>` });
  const sp = SPEAKERS[b.speaker]?.name || b.name, masked = bondMasked(state, id);
  const title = masked ? '??? · 붉은 봉인의 손님' : sp === b.name ? b.name : `${b.name} · ${sp}`;
  return `<div class="bond-card"><div class="bc-top"><span class="bond-face">${masked ? MYSTERY_FACE : assetIcon('badges/'+(SPEAKERS[b.speaker]?.portrait||b.speaker||id))}</span><div class="bond-name"><b>${esc(title)}</b><small class="arcana">${masked ? '?' : num} · ${masked ? '???' : esc(arc)}</small></div><span class="bond-rank${ready ? ' ready' : ''}" aria-label="인연 Rank ${r} / ${MAX_RANK}"><small>RANK</small><b>${r >= MAX_RANK ? 'MAX' : r}</b></span></div>
    <div class="rank-pips" aria-hidden="true">${pips}</div>${bar(r >= MAX_RANK || ready ? 100 : ((v - lo) / (hi - lo)) * 100, 'bond')}<span class="small bond-status${ready ? ' ready' : ''}">${status}</span>${DEST1NOVA_IDS.includes(id) && !masked ? `<span class="small bond-fans">인기 「${esc(fanTierName(state, id))}」 · 팬 ${fansOf(state, id).toLocaleString('ko-KR')}명${nextTierAt(state, id) ? ` / ${nextTierAt(state, id).toLocaleString('ko-KR')}명` : ''} · 단계마다 지명과 팁이 늘어요</span>` : ''}
    <ul class="bond-perks" aria-label="인연 능력">${b.rankFx?`<li class="${r?'open':'next'}"><b>매 랭크</b><span>${esc(b.rankFx.label)} · 지금 −${Math.round(b.rankFx.fx.cookSpeed*r*100)}%</span><small>${r?'적용':'다음'}</small></li>`:''}${perks}</ul>
    <p class="small bond-gift-status">${gifted?'이번 순 선물을 전했어요. 다음 순에 다시 전할 수 있어요.':'좋아하는 물건은 구매 후 바로 선물해요.'}</p><div class="row">${btn({action:'gift.open',args:{id},cls:'primary',disabled:gifted||!townCheck(state).ok,label:'보유 음식 선물 · '+(state.foodGifts?.items.length||0)+'개'})}${giftBtn(b.gift)}${giftBtn(COMMON_GIFT)}${talkBtn}</div><details class="bond-story-library"><summary>인연 이야기 · 4장</summary>${b.perks.map((perk,index)=>btn({action:'bond.read',args:{id,tier:index+1},disabled:state.mode!=='prep'||!state.ledger.story['bond:'+id+':'+(index+1)],label:'Rank '+P[index]+' · '+(state.ledger.story['bond:'+id+':'+(index+1)]?'이야기 다시 읽기':'인연을 쌓으면 열려요')})).join('')}</details></div>`;
}

// 랭크 업 카드: 대화가 끝난 직후 한 장. 능력이 해방되면 크게, 다음 해방까지의 목표를 함께 보여 준다.
function rankUpSheet(state, up) {
  const masked = bondMasked(state, up.id), [num, arc] = up.arcana || ['?', ''], P = TEMP.BONDS.PERK_RANKS, b = BONDS[up.id];
  const pips = Array.from({ length: MAX_RANK }, (_, i) => `<i class="${i < up.rank ? 'on' : ''}${i === up.rank - 1 ? ' new' : ''}${P.includes(i + 1) ? ' perk' : ''}"></i>`).join('');
  const face = masked ? MYSTERY_FACE : assetIcon('badges/' + (SPEAKERS[b.speaker]?.portrait || b.speaker || up.id));
  return `<section class="rankup-card${up.perk ? ' perk' : ''}" role="status"><p class="rankup-kicker">RANK UP</p>
    <div class="rankup-arcana"><span class="bond-face">${face}</span><small>${masked ? '?' : num}</small><b>${masked ? '???' : esc(arc)}</b></div>
    <h2>${esc(withWa(bondName(state, up.id)))}의 인연 · Rank ${up.rank >= MAX_RANK ? 'MAX' : up.rank}</h2><div class="rank-pips" aria-hidden="true">${pips}</div>
    ${up.perk ? `<div class="rankup-perk"><small>능력 해방</small><b>${esc(up.perk)}</b>${up.story ? '<span>이 랭크의 인연 이야기가 이어집니다</span>' : ''}</div>` : '<p class="small">함께 보낸 시간이 인연이 되었어요.</p>'}
    <p class="small muted">${up.next ? `다음 해방 · Rank ${up.next.rank} ${esc(up.next.label)}` : '모든 능력이 해방됐어요'}</p>
    ${btn({ action: 'rankup.close', cls: 'primary', label: up.story ? '이야기 보기' : '계속하기' })}</section>`;
}

function mokaShop(state) {
  return `<p class="small">🦦 모카: "신선도 별 다섯 개짜리만 들여놨어. 밤이슬은 오늘 별 네 개 반, 그래도 이 동네 최고."</p><div class="list">${ingredientRows(state, false)}</div>${supplyShop(state)}`;
}

function gearStall(state) {
  return `<p class="small muted">윤달이 손질하는 장비 좌판 · 장비는 사냥 능력치만 바꿔요.</p>${btn({action:'sheet.open',args:{sheet:'armory'},cls:'primary',label:'윤달의 무기 공방 · 강화와 회복'})}${gearList(state)}`;
}

// 인수 빚 이자율: 지금 이율·이번 달 예상 이자·다음 인상(청토끼 일정, creditor.js)
function interestCard(state) {
  const m = monthOfDay(state.day), next = isEnded(state) ? null : nextHike(state, m);
  const pct = r => `${Math.round(r * 100)}%`;
  const when = next ? `${1 + Math.floor(next.monthIdx / 12)}년차 ${monthName(next.monthIdx)} → ${pct(next.rate)}` : '더 오르지 않아요';
  return `<section class="card kv interest-card" aria-label="인수 빚 이자율"><span>인수 빚 월 이자</span><b>${pct(interestRate(state, m))}</b><span>이번 달 하순 예상</span><b>${won(interestDue(state, m))}</b><span>다음 인상</span><b>${esc(when)}</b></section>`;
}

// 청토끼 약속·경고·통첩(6-1). 옛 180순 저장·결말 뒤에는 없다
function creditorCard(state) {
  const v = creditorView(state);
  if (!v) return '';
  const when = m => `${1 + Math.floor(m / 12)}년차 ${monthName(m)} 하순`;
  const head = v.ultimatum
    ? `<span>청토끼 통첩</span><b class="bad">${won(v.ultimatum.need)} 더 갚기 · ${v.ultimatum.turnsLeft}순 남음</b>`
    : `<span>청토끼 경고</span><b${v.warnings ? ' class="warn"' : ''}>${v.warnings ? `${v.warnings}회 · 다음 하순엔 붙은 이자보다 더 갚아 주세요` : '없음'}</b>`;
  const ms = v.milestone ? `<span>다음 약속</span><b>${esc(when(v.milestone.monthIdx))}까지 누적 상환 ${Math.round(v.milestone.share * 100)}% · ${v.milestone.need ? `${won(v.milestone.need)} 남음` : '달성'}</b>` : '';
  return `<section class="card kv creditor-card" aria-label="청토끼 약속과 통첩">${head}${ms}</section>`;
}

// 환전: 개수 고르기(10·100·1000·전부, ±1, 직접 입력) → 받을 골드 미리보기 → 한 버튼으로 실행
function financeCenter(state, ui = {}) {
  const m = state.moonstone || 0, rate = exchangeRate(state);
  const credit=creditView(state);
  const want = Math.max(0, Math.floor(Number(ui.exchangeQty ?? 100)) || 0), q = Math.min(want, m), gold = Math.floor(q * rate);
  const chips = [10, 100, 1000].map(n => btn({ action: 'exchange.pick', args: { qty: n }, cls: q === n ? 'on' : '', disabled: m < n, label: `${n.toLocaleString()}개` })).join('')
    + btn({ action: 'exchange.pick', args: { qty: 'all' }, cls: m > 0 && q === m ? 'on' : '', disabled: m < 1, label: '전부' });
  const exchange = `<section class="exchange-card" aria-labelledby="exchange-title">
    <header><h3 id="exchange-title">월정석 → 골드 환전</h3><span class="exchange-rate">1개 = ${won(rate)}</span></header>
    <p class="exchange-own">보유 월정석 <b>🌙 ${m.toLocaleString()}개</b></p>
    <div class="exchange-chips" role="group" aria-label="환전 개수 빠르게 고르기">${chips}</div>
    <div class="exchange-input">${btn({ action: 'exchange.step', args: { d: -1 }, disabled: q <= 1, label: '−', title: '1개 줄이기' })}<input id="exchange-qty" type="number" inputmode="numeric" min="1" max="${m}" step="1" value="${q || ''}" placeholder="개수" aria-label="환전할 월정석 개수 직접 입력"><span>개</span>${btn({ action: 'exchange.step', args: { d: 1 }, disabled: q >= m, label: '+', title: '1개 늘리기' })}</div>
    ${want > m && m > 0 ? `<p class="small warn">보유한 ${m.toLocaleString()}개까지만 바꿀 수 있어요.</p>` : ''}
    <div class="exchange-preview"><span>🌙 ${q.toLocaleString()}개</span><i aria-hidden="true">→</i><b>+${won(gold)}</b><small>환전 뒤 월정석 ${(m - q).toLocaleString()}개 · 골드 ${won(state.gold + gold)}</small></div>
    ${btn({ action: 'moonstone.exchange', args: { qty: q }, cls: 'primary exchange-go', disabled: q < 1, label: m < 1 ? '바꿀 월정석이 없어요' : `${q.toLocaleString()}개 환전하기` })}
    <p class="small muted">윤달 공방 강화와 기술 상한 해방은 월정석으로 해요. 강화에 쓸 몫은 남겨 두세요.</p>
  </section>`;
  const debt = `<section class="exchange-debt"><span>남은 빚 <b>${won(state.debt)}</b></span>${btn({action:'sheet.open',args:{sheet:'debt'},label:'빚 상환하기'})}</section>${interestCard(state)}${creditorCard(state)}`;
  return `<div class="finance-host">${assetIcon('badges/cheongtokki')}<div><h3>청토끼 금융 센터</h3><p>환전 · 운영 대출 · 골드와 월정석 상환</p></div></div><p class="small">청토끼: "어머~ 월정석 하나에 ${won(rate)}이에요. 강화에 쓸 몫은 꼭 남겨 두시고요~"</p>
    ${exchange}${debt}${financeLoanHtml(state,credit)}`;
}

function expandShop(state) {
  const ex = nextExpansion(state);
  const tables = state.interior.furniture.filter(f => FURNITURE[f.defId].table).length;
  const tableRow = ex
    ? `<div class="item"><div class="meta grow"><b>🪑 ${esc(ex.label)}</b><span>지금 테이블 ${tables}개 · 빈자리에 바로 놓여요</span></div>${btn({ action: 'expand.table', cls: 'primary', disabled: state.gold < ex.cost, label: won(ex.cost) })}</div>`
    : `<div class="item"><div class="meta grow"><b>🪑 테이블 ${tables}개</b><span>지금 들일 수 있는 테이블을 모두 들였어요</span></div></div>`;
  const themes = [...new Set(Object.keys(TEMP.DECOR_PRICES).map(id=>FURNITURE[id].theme || '기본 가구'))];
  const decor = themes.map(theme=>`<details class="decor-theme"><summary>${esc(theme)}</summary><div class="list">${Object.entries(TEMP.DECOR_PRICES).filter(([def])=>(FURNITURE[def].theme || '기본 가구')===theme).map(([def]) => {
    const f = FURNITURE[def],price=decorPrice(state,def);
    return `<div class="item">${assetIcon(`objects/${def}`,`<i class="swatch" style="background:${f.color}"></i>`)}<div class="meta grow"><b>${esc(f.name)}</b><span>${f.width}×${f.height} · ${f.area}칸 · ${f.layer==='floor'?'바닥 · 가구와 겹침 가능':'통로를 막는 가구'}<br>${f.grade || '기본'} · 분위기 +${f.ambience} (면적 기본 ${f.baseScore} + 대형 ${f.largeBonus})${f.table?' · 의자 별도, 손님 1명':def==='long_cabinet'?' · 장식용 수납, 조리 설비 아님':''}</span></div>${btn({ action: 'expand.decor', args: { def }, disabled: state.gold < price, label: won(price) })}</div>`;
  }).join('')}</div></details>`).join('');
  const open = state.interior.areas || [];
  const cost = areaPrice(state);
  const areaRows = AREAS.filter(a=>areaAvailable(state,a)).map(a => open.includes(a.id)
    ? `<div class="item"><div class="meta grow"><b>🔓 ${esc(a.name)}</b><span>연 구역 · 인테리어에서 가구를 놓을 수 있어요</span></div></div>`
    : `<div class="item"><div class="meta grow"><b>🔒 ${esc(a.name)}</b><span>증축할수록 다음 구역이 비싸져요</span></div>${btn({ action: 'expand.area', args: { id: a.id }, disabled: cost == null || state.gold < cost, label: won(cost) })}</div>`).join('');
  const host = `<div class="finance-host">${assetIcon('badges/museong')}<div><h3>무성의 가구·꽃 상점</h3><p>테이블 · 구역 증축 · 꽃과 식물 · 장식</p></div></div><p class="small">무성: "손님이 오래 머무는 자리는 넓이보다 빛과 초록이 정한다. 골라라."</p>`;
  return `${host}<div class="list">${tableRow}</div><h3>구역 증축</h3><div class="list">${areaRows}</div><h3>장식 들이기</h3><div class="list">${decor}</div>`;
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
  return `${head('연이의 부탁 노트')}${serviceBanner('quests','YEONI’S JOURNAL','작은 부탁이 인연으로','하나씩 해내면 우리 가게도 자라날 거야.')}<div class="list">${rows}</div>`;
}

// ── 기타
function moreSheet(state, ui) {
  const off = estimateOfflineIncome(state, Date.now());
  const inShift = state.mode === 'shift' || state.mode === 'hunt';
  const dev = ui.dev ? `<div class="card"><b><span class="tag dev">DEV</span> 개발 기능</b>
      <p class="small muted">별도 저장 키를 씁니다. 배속은 저장하지 않으며 일반 플레이에는 없습니다. 정규 영업 길이(10:00)는 그대로입니다.</p>
      <div class="btns">${[1, 10, 60].map(sp => btn({ action: 'dev.speed', args: { speed: sp }, cls: ui.speed === sp ? 'on' : '', label: `×${sp}` })).join('')}
      ${btn({ action: 'dev.skip', disabled: !inShift || state.paused, label: '+60초 진행' })}</div></div>` : '';
  return `${head('영냥이의 안내 데스크')}${serviceBanner('more','YEONGNYANGI’S DESK','오늘의 판을 정리해 볼까','저장부터 동료와 음악까지, 여기서 챙겨.')}<div class="grid2">${btn({action:'sheet.open',args:{sheet:'tutorial'},label:'튜토리얼'})}${btn({action:'sheet.open',args:{sheet:'audio'},label:'음악과 효과음'})}${btn({action:'sheet.open',args:{sheet:'armory'},label:'윤달의 무기 공방'})}</div>
    <div class="list">
      ${btn({ action: 'sheet.open', args: { sheet: 'debt' }, label: `💳 빚 상환 (남은 빚 ${won(state.debt)})` })}
      ${btn({ action: 'sheet.open', args: { sheet: 'companions' }, label: '👥 동료' })}
      ${btn({ action: 'sheet.open', args: { sheet: 'outfits' }, label: '👗 의상' })}
      ${btn({ action: 'story.replay', disabled: inShift, label: isEnded(state) ? '📖 결말 다시 보기' : '📖 이번 달 이야기 다시 보기' })}
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
  return `${head('💳 빚 상환')}<div class="debt-ledger-art" aria-hidden="true"></div>
    <div class="card kv"><span>남은 빚</span><b>${won(state.debt)}</b><span>갚은 총액</span><b>${won(state.repaidTotal)}</b><span>보유 골드</span><b>${won(state.gold)}</b>
      <span>상환 단계</span><b>${esc(ds.label)}${ds.need ? ` ${won(ds.paid)} / ${won(ds.need)}` : ''}</b></div>
    ${ds.need ? bar(ds.paid / ds.need * 100) : ''}
    ${interestCard(state)}${creditorCard(state)}
    <p class="small muted">💡 다음 영업 재료비로 ${won(TEMP.KEEP_FOR_INGREDIENTS_HINT)} 정도는 남겨 두는 것을 권장합니다.</p>
    ${can ? '' : '<p class="small warn">상환은 영업 전이나 마감 후에 할 수 있습니다.</p>'}
    <div class="btns debt-actions">${amounts.map(([a, l], i) => btn({ action: 'debt.repay', args: { amount: a }, cls: i === 2 ? 'primary' : '', disabled: !can || a <= 0 || state.gold < a || state.debt <= 0, label: l })).join('')}</div>`;
}

// ── 동료
const companionPortrait = id => `<canvas class="companion-portrait" data-talking-portrait="${esc(id)}" width="192" height="192" aria-hidden="true"></canvas>`;
// 루나의 쉼터: 골드로 한 사람씩 쉬게 한다(마을 행동력 안 씀, 순마다 한 사람 한 번). 판정은 엔진 stress.shelter.
function lunaShelter(state) {
  const rows = stressCrew(state).map(id => {
    const v = Math.round(stressOf(state, id)), used = !!state.ap.sheltered?.[id];
    const why = used ? '이번 순에 이미 쉬었어요' : v <= 0 ? '지금 충분히 편안해요' : state.gold < TEMP.SHELTER_COST ? `골드가 모자라요 (${won(TEMP.SHELTER_COST)})` : '';
    return `<div class="item">${companionPortrait(id)}<div class="meta grow"><b>${esc(personName(state, id))}</b><span class="stress-line ${stressStage(state, id)}">스트레스 <meter min="0" max="100" value="${v}">${v}</meter> ${v}/100</span></div>${btn({ action: 'stress.shelter', args: { id }, cls: why ? '' : 'primary', disabled: !!why, title: why || `${won(TEMP.SHELTER_COST)} · 스트레스 ${Math.abs(TEMP.NEO_STRESS.shelter)} 회복`, label: used ? '쉬었어요' : `쉬게 하기 · ${won(TEMP.SHELTER_COST)}` })}</div>`;
  }).join('');
  return `<p>루나 자매가 차를 내리고 담요를 덮어 줘요. 지친 동료를 쉬게 하면 스트레스가 ${Math.abs(TEMP.NEO_STRESS.shelter)} 줄어요. 마을 행동력은 쓰지 않아요.</p><div class="list">${rows}</div><p class="small muted">월정석 환전과 빚 상환은 청토끼 금융 센터에서 도와줘요.</p>`;
}

// 인연으로 여는 자동화 한 줄: 잠겼으면 무엇을 해야 열리는지, 열렸으면 켜기/끄기와 멈춘 사유
export function automationRow(state, ability) {
  const st = automationStatus(state, ability), a = ABILITIES[ability], permission=abilityCheck(state,ability);
  const state_ = st.locked ? '🔒 잠김' : st.on ? (st.running ? '켜짐' : '멈춤') : '꺼짐';
  const control = st.locked ? '<span class="small muted">🔒</span>'
    : btn({ action: 'automation.toggle', args: { ability }, cls: st.on ? 'on' : '', title: st.on ? '끄고 직접 하기' : '켜기', label: st.on ? '자동 켜짐' : '자동 꺼짐' });
  return `<div class="row automation-row${st.locked ? ' locked' : ''}"><span class="grow small"><b>${esc(a.label)}</b> · 지금 Rank ${permission.current} / 필요 Rank ${permission.need} · ${state_}${st.reason && !(st.on && st.running && st.reason === '돌아가는 중') ? ` · ${esc(st.reason)}` : ''}</span>${control}</div>`;
}

// 직원 한 명의 스트레스 막대와 다음 영업 휴무(준비 중에만)
function stressLine(state, id) {
  if (!stressCrew(state).includes(id)) return '';
  const v = Math.round(stressOf(state, id)), stage = stressStage(state, id);
  const off = state.mode === 'prep' ? btn({ action: 'staff.dayOff', args: { id }, cls: state.dayOff?.[id] ? 'on' : '', title: '다음 영업 하루 쉬게 하기 · 결산 때 크게 회복', label: state.dayOff?.[id] ? '휴무 예정' : '휴무 주기' }) : '';
  return `<span class="stress-line ${stage}">스트레스 <meter min="0" max="100" value="${v}">${v}</meter> ${v}/100 · ${esc(isResting(state, id) ? '쉬는 중' : stressLabel(state, id))}</span>${off}`;
}

function companionSheet(state,ui) {
  const neoStats = STAT_KEYS.map(k => `${STAT_LABELS[k]} ${hostStats(state, 'neo')[k]}`).join(' · ');
  const neoStatus = personBusyReason(state, 'neo') || (state.mode === 'shift' ? staffStatusText(state, 'neo') : state.people.neo.activity === 'hunting' ? '영냥이 모습으로 월정석 사냥 중' : '대기');
  const rows = [
    `<div class="item">${companionPortrait('yeoni')}<div class="meta grow"><b>연이 · 사장</b><span>계산·농장 담당 · 동료들과 함께 가게를 꾸려요${state.mode === 'shift' ? ` · ${esc(staffStatusText(state, 'yeoni'))}` : ''}</span></div></div>`,
    `<div class="item">${companionPortrait('neo')}<div class="meta grow"><b>네오 · ${state.hostbar.open ? '대화 담당' : '손님맞이 담당'}</b>${state.hostbar.open ? `<span>${neoStats}</span>` : ''}<span>${esc(PEOPLE.neo.profile)}</span><span>${esc(PEOPLE.neo.specialty)}</span><span>상태: ${esc(neoStatus)} · 고양이 모습일 때 이름은 영냥이(같은 사람)</span>${stressLine(state, 'neo')}</div></div>`,
    ...STAFF_CREW.map(id => `<div class="item">${companionPortrait(id)}<div class="meta grow"><b>${PEOPLE[id].name} · ${PEOPLE[id].work === 'baker' ? '굽기 담당' : '서빙·정리 담당'}</b><span>빚을 갚을 때까지 처음부터 일을 돕는다${state.mode === 'shift' ? ` · ${esc(staffStatusText(state, id))}` : ''}</span>${stressLine(state, id)}</div></div>`),
  ];
  for (const r of recruitView(state)) {
    const def = personDef(state, r.id);
    if(r.id === 'seohanbi' && !state.roster.seohanbi) {
      const quest = hiddenGuestQuest(state);if(!quest.revealed)continue;
      rows.push(`<article class="hidden-guest"><div class="mystery-silhouette" aria-label="정체를 알 수 없는 손님">?</div><h3>??? · 붉은 봉인의 손님</h3><p>달그늘 깊은 곳에서 붉은 눈의 그림자가 네오를 지켜보고 있어요. 네오로 단계를 깊이 클리어할수록 단서가 이어져요.</p><ul>${quest.steps.map((step,i)=>`<li>${step.done?'✓':i===quest.next?'◇':'·'} ${esc(step.done||i===quest.next?step.text:'아직 읽히지 않는 문장')}</li>`).join('')}</ul>${btn({action:'recruit.event',args:{id:r.id},disabled:!quest.ready || state.mode!=='prep',cls:'primary',label:quest.ready?'봉인된 초대장 열기':'단서를 더 모으기'})}</article>`);
      continue;
    }
    const tag = r.devOnly ? '<span class="tag dev">DEV 임시</span> ' : '';
    let right, sub;
    if (r.status === 'recruited') {
      const usable = isUsableHost(state, r.id);
      sub = !state.hostbar.open ? '가게에 새로운 친구가 생겼어요' : usable ? '대화 가능' : `${dateLabel(state, r.usableFrom)} 영업부터 대화 가능`;
      right = '<span class="small ok">✅ 함께함</span>';
    } else if (r.status === 'available') {
      sub = '만남 조건 충족';
      right = btn({ action: 'recruit.event', args: { id: r.id }, cls: 'primary', disabled: state.mode !== 'prep', title: state.mode === 'prep' ? '만남 이벤트 보기' : '영업 준비 중에만 진행할 수 있습니다', label: '만남 이벤트 보기' });
    } else {
      sub = r.id==='yun'?'윤달의 공방 거래 → 영냥이의 보스 토벌 부탁':r.id==='museong'?'영냥이 성장 Lv.8 이상, 사냥에서 90초 생존하면 만남':r.condition.debtFree ? `빚 완납 + 보유금 ${won(r.condition.wealth)} · 담당 접대 수입 +35%` : r.condition.month ? `운영 ${r.condition.year || 1}년차 ${r.condition.month}월부터 만남 · 놓치면 3개월 뒤 다시 찾아와요${r.condition.neoAffinity ? ` · 네오 인연 ${r.condition.neoAffinity} 필요` : ''}` : `조건: 정규 영업 ${Math.min(state.stats.shiftsCompleted, r.condition.shiftsCompleted)}/${r.condition.shiftsCompleted}회 · 상환 ${Math.min(state.stats.repayCount, r.condition.repaidAtLeast)}/${r.condition.repaidAtLeast}회`;
      right = '<span class="small muted">🔒 잠김</span>';
    }
    const stats = def?.stats ? STAT_KEYS.map(k => `${STAT_LABELS[k]} ${def.stats[k]}`).join(' · ') : '';
    const followup = r.status === 'recruited' && def?.followup ? btn({ action: 'cast.read', args: { id: r.id }, disabled: state.mode !== 'prep' || state.day <= state.recruitment[r.id].at, title: '함께 영업한 뒤 영업 준비 중에 열려요', label: state.ledger.story[`cast:${r.id}`] ? '이야기 다시 보기' : '함께한 이야기' }) : '';
    // 미영입 동료는 검은 실루엣과 합류 힌트만. 마을 지도에 가게가 있는 윤달·무성만 이름을 보인다.
    if (r.status !== 'recruited') { rows.push(`<article class="card locked-cast"><div class="row">${companionPortrait(r.id).replace('companion-portrait', 'companion-portrait silhouette')}<b class="grow">${tag}${['yun', 'museong'].includes(r.id) ? esc(r.name) : '???'}</b>${right}</div><p class="small muted">${esc(sub)}</p></article>`); continue; }
    rows.push(`<article class="card"><div class="row">${companionPortrait(r.id)}<b class="grow">${tag}${esc(r.name)}</b>${right}</div><p>${esc(def?.profile || '')}</p><p class="small">${esc(def?.specialty || '')}<br>${stats}</p><p class="small muted">${esc(sub)}</p>${followup}</article>`);
  }
  const available=BOND_IDS.filter(id=>bondOpen(state,id));
  const selected=available.includes(ui.companionId)?ui.companionId:available.find(id=>!state.ap.gifted[id])||available[0];
  const bondRows=`<div class="companion-picker" aria-label="선물할 동료">${available.map(id=>btn({action:'companion.select',args:{id},cls:id===selected?'selected':'',pressed:id===selected,label:(bondMasked(state,id)?MYSTERY_FACE:assetIcon('badges/'+id))+`<b>${esc(bondName(state,id))}</b><small class="pick-rank">${bondReady(state,id)?'✦ ':''}Rank ${bondRank(state,id)}</small><small>${state.ap.gifted[id]?'선물 완료':'선물 가능'}</small>`})).join('')}</div>${bondCard(state,selected)}`;
  for (let i = 0; i < LOCKED_SLOT_COUNT; i++) rows.push('<div class="item"><span class="swatch" style="background:#ddd"></span><div class="meta grow"><b>🔒 새로운 인연</b><span>퀘스트로 영입 (아직 정해진 동료 없음)</span></div></div>');
  return `${head('동료와 인연')}<section class="companion-gifts"><p class="companion-intro">마음을 전할 동료를 골라 주세요.</p><div class="companion-wallet"><span>보유 ${won(state.gold)}</span><span>완성 음식 ${state.foodGifts?.items.length||0}개</span><span>행동력 ${state.ap.left}</span></div><p class="small muted">선물은 행동력 없이, 동료마다 한 순에 한 번 전해요.</p>${bondRows}</section><details class="companion-profiles"><summary>동료 소개 · 근무 · 새로운 만남</summary><p class="small">네오·루나 자매는 창업 동료로 무급입니다. 새 동료는 월 ${won(TEMP.PAYROLL_BASE)}(근무 순 비례) + 근무 중 매출·팁의 ${TEMP.PAYROLL_SHARE*100}%를 월말에 지급해요. 이번 달 예상 ${won(payrollView(state).accrued)} · 미지급 ${won(payrollView(state).arrears)}</p><div class="list">${rows.join('')}</div></details>`;

}

// ── 오버레이(우선순위: 확인 > 타이틀 > 사냥 결과 > 결산 > 일시정지 > 레벨업 > 만남 이벤트)
export function overlayHtml(state, ui) {
  if(ui.gameRoom)return `<div class="dialog game-room-dialog">${gameRoomSheet('game.room.close')}</div>`;
  if(ui.exited)return `<div class="dialog"><h2>오늘도 함께해서 고마워요</h2><p>게임과 음악을 멈췄어요. 이제 창을 닫아도 괜찮아요.</p>${btn({action:'game.wake',label:'메인 화면으로'})}</div>`;
  if (ui.confirm) return confirmDialog(ui.confirm);
  if (!state) return titleDialog(ui);
  if (state.mode === 'hunt' && state.hunt && state.hunt.status !== 'running') return huntResult(state);
  if (state.mode === 'settlement' && state.lastSettlement) return settlementScreen(state);
  if (state.paused && (state.mode === 'shift' || state.mode === 'hunt')) return pausedDialog(state);
  if (state.mode === 'hunt' && state.hunt?.status === 'running' && state.hunt.picks?.length) return levelUpDialog(state);
  if (state.mode === 'hunt' && state.hunt?.status === 'running' && state.hunt.chests?.length) return chestDialog(state);
  if (state.mode === 'hunt' && state.hunt?.status === 'running' && state.hunt.stageChoice) return stageClearDialog(state);
  if (ui.discovery && MENUS[ui.discovery]) return discoveryDialog(state,ui.discovery);
  // Recruitment is played in the illustrated novel layer.
  if (ui.credits) return creditsScreen(state, ENDINGS[state.calendar?.endingId]?.title);
  if (ui.ending && ENDINGS[ui.ending]) return endingDialog(state, ui.ending);
  return '';
}

function confirmDialog(cf) {
  return `<div class="dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-copy">${cf.art?`<div class="confirm-art" style="${assetStyle(cf.art)}" role="img" aria-label="꽃돼지 연이와 영냥이가 새 카페의 문을 열어요"></div>`:''}<div class="confirm-content"><h2 id="confirm-title">${esc(cf.title)}</h2><p id="confirm-copy">${esc(cf.text)}</p>
    <div class="stack">${btn({action:'confirm.yes',cls:'primary',label:esc(cf.yesLabel||'확인')})}${btn({action:'confirm.no',label:esc(cf.noLabel||'취소')})}</div></div></div>`;
}

function titleDialog(ui) {
 return `<section class="title-screen" role="dialog" aria-modal="true" aria-labelledby="game-title" style="${assetStyle('backgrounds/title')}"><div class="title-wordmark"><div class="title-emblem" aria-hidden="true">${pixelIcon("cup")}</div><h1 id="game-title"><span>연이의</span><strong>아틀리에</strong></h1><p>차 한 잔에서 시작되는 우리의 이야기</p></div><div class="title-cast" role="img" aria-label="인간형 연이와 네오, 루나 자매와 모카"><div class="title-friends">${['luna_sis','moka','luna'].map(id=>`<span class="title-friend ${id}">${assetIcon('portraits/'+id)}</span>`).join('')}</div><span class="title-lead neo">${assetIcon('portraits/neo')}</span><span class="title-lead yeoni">${assetIcon('portraits/yeoni')}</span><span class="title-flower left">${assetIcon('ui/botanical_left')}</span><span class="title-flower right">${assetIcon('ui/botanical_right')}</span></div><div class="title-menu px-menu">${ui.hasSave?pxBtn('game.continue','px-main','cup','이야기 이어하기','arrow'):pxBtn('game.new','px-main','cup','나의 카페 열기','arrow')}${ui.hasSave?pxBtn('game.new','px-sub','spark','새로운 이야기'):''}${pxBtn('game.prologue',ui.hasSave?'px-sub':'px-sub px-wide','book','처음 만나는 이야기')}${titleGameRoom()}${pxBtn('game.install','px-sub px-sage','home','홈 화면에 추가')}${pxBtn('game.exit','px-sub','moon','종료하기')}<details class="title-options px-options"><summary>${pixelIcon('note')}<span>음악 · 저장 설정</span></summary><div class="px-options-row">${audioQuickButton()}${btn({action:'game.reset',disabled:!ui.hasSave,label:'저장 초기화'})}</div></details>${!ui.storageOk?'<p role="status">브라우저 저장이 제한되어 새로고침하면 진행이 사라져요.</p>':''}${ui.hostDemo?'<small>호스트 체험 · 5월 개업 완료 · 본편/개발 저장과 별도</small>':ui.dev?'<small>개발 모드 · 일반 저장과 분리</small>':''}</div></section>`;
}

function pausedDialog(state) {
  const what = state.mode === 'hunt'
    ? `🐾 생존 시간 ${fmtTime(state.hunt.elapsedMs)}`
    : `⏱ 영업 남은 시간 ${fmtTime(remainingShift(state))}`;
  const hosting = state.mode === 'shift' ? Object.values(state.visits).filter(v => v.acceptAt != null && !v.settled)
    .map(v => `<li>${v.tableNo}번 접대 ${fmtTime(v.endAt - state.shift.elapsedMs)} 남음</li>`).join('') : '';
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>⏸ 일시정지</h2><p><b>${what}</b></p>
    ${hosting ? `<ul class="small">${hosting}</ul>` : ''}<p class="small muted">시간이 멈춰 있습니다. 같은 손님, 같은 남은 시간으로 이어집니다.</p>
    <div class="stack">${btn({ action: 'resume', cls: 'primary', label: '▶ 계속하기' })}${btn({ action: 'game.title', label: '💾 저장하고 타이틀로' })}</div></div>`;
}

// ── 결말(게임 오리지널 외전). 닫으면 후일담 자유 영업으로 이어진다.
const BOND_NAMES = { neo: '네오', luna: '루나', luna_sis: '루나 언니', moka: '모카' };
const ENDING_HINT = {
  grand: '빚도 갚고, 모두와 깊은 인연을 맺었습니다. 최고의 결말이에요!',
  clear: `빚을 다 갚았습니다. 동료 친밀도 합계가 ${TEMP.CALENDAR.ENDING_BOND_BEST} 이상이면 또 다른 결말이 기다려요(임시 기준).`,
  close: '빚을 60% 넘게 갚았습니다. 남은 빚을 모두 갚으면 다른 결말이 열려요.',
  extend: '빚이 많이 남았습니다. 가게 확장·사냥·동료 친밀도로 다음 회차를 노려 보세요.',
  bad: '청토끼 통첩 기한을 넘겨 가게를 내줬습니다. 다음에는 약속 달마다 누적 상환을 채우고, 하순마다 붙는 이자보다 더 갚아 보세요.',
};
function endingDialog(state, id) {
  const e = ENDINGS[id];
  const bonds = Object.entries(state.affinity || {}).map(([k, v]) => `${BOND_NAMES[k] || k} ${v}`).join(' · ');
  return `<div class="dialog ending" role="dialog" aria-modal="true"><p class="small muted">꿀꿀 운세 외전 · 게임 오리지널 결말</p><h2>📜 ${esc(e.title)}</h2>
    <div class="kv"><span>마지막 결산 남은 빚</span><b>${won(state.calendar.endedDebt ?? state.debt)}</b><span>갚은 총액</span><b>${won(state.repaidTotal)}</b><span>동료 친밀도</span><b>${esc(bonds)}</b></div>
    <p class="small">${esc(ENDING_HINT[id] || '')}</p>
    <div class="stack">${id === 'bad' ? '' : btn({ action: 'ending.close', cls: 'primary', label: '☕ 후일담 영업 계속하기' })}${btn({ action: 'credits.open', cls: id === 'bad' ? 'primary' : '', label: '🎬 크레딧 보기' })}${btn({ action: 'story.replay', label: '📖 결말 다시 보기' })}${btn({ action: 'game.new', label: '🌱 새 게임' })}</div></div>`;
}

// 사냥 대화상자 제목 위 장식(초승달·꽃잎·금 가는 선). 이미지 에셋 없이 인라인 SVG

// 레벨업 카드 3장. 고르는 동안 사냥 시간이 멈춘다(엔진이 멈춤, UI는 고른 번호만 보낸다).
function levelUpDialog(state) {
  const h = state.hunt;
  const cards = h.picks[0].map((o, i) => {
    const d = describeOption(h, o);
    return btn({ action: 'hunt.pick', args: { index: i }, cls: `lv-card k-${o.kind}${d.evo ? ' evo' : ''}`,
      label: `<span class="lv-icon" aria-hidden="true">${assetIcon(o.kind === 'pouch' ? 'icons/moonstone' : `skills/${o.id || 'heal'}`,esc(d.icon))}</span><span class="lv-body"><b>${esc(d.name)}</b><span class="lv-tag">${esc(d.tag)}${d.cap ? ` · 상한 Lv ${d.cap}` : ''}</span><span class="small">${esc(d.text)}</span></span>` });
  }).join('');
  const more = (h.picks.length > 1 ? `<p class="small muted">남은 선택 ${h.picks.length - 1}번</p>` : '')
    + (Object.values(h.caps || {}).some(c => !c) ? '<p class="small muted">윤달 공방에서 기술을 더 배울 수 있어요</p>' : '');
  return `<div class="dialog levelup night" role="dialog" aria-modal="true">${NIGHT_ORN}<h2>레벨 ${h.level} · 하나를 고르세요</h2>
    <p class="small muted">고르는 동안 시간이 멈춰 있어요.</p><div class="lv-cards">${cards}</div>${more}</div>`;
}

// 희귀 상자: 결과는 주운 순간 엔진이 정해 저장했다. 룰렛은 저장된 칸에 멈추는 연출일 뿐이다(움직임 줄이기면 바로 결과)
function chestDialog(state) {
  const h = state.hunt, c = h.chests[0], k = c.moon / CHEST_WHEEL[c.slot];
  const cells = [0, 1, 2].flatMap(() => CHEST_WHEEL).map(v => `<span>🌙 ${Math.round(v * k)}</span>`).join('');
  const still = c.upgrade && describeOption(h, c.upgrade);
  const up = c.upgrade ? `<span class="lv-icon" aria-hidden="true">${assetIcon(`skills/${c.upgrade.id}`)}</span><b>${esc(still.name)}</b> 한 단계 강화` : `보유 기술이 모두 최대라 월정석 +${CHEST_FALLBACK}개로 바꿔요`;
  return `<div class="dialog chest-roll night" role="dialog" aria-modal="true">${NIGHT_ORN}<h2>희귀 상자</h2>
    <p class="small muted">상자를 주운 순간 결과가 정해졌어요. 여는 동안 시간이 멈춰 있어요.</p>
    <div class="chest-wheel" aria-hidden="true"><div class="cw-strip" style="--stop:${12 + c.slot}">${cells}</div></div>
    <p class="chest-result" aria-live="polite">🌙 월정석 +${c.moon}<br>${up}</p>
    <div class="stack">${btn({ action: 'hunt.chest', cls: 'primary', label: h.chests.length > 1 ? `받기 · 남은 상자 ${h.chests.length - 1}개` : '받기' })}</div></div>`;
}

// 한 번 출발에 3단계를 마친 사냥꾼의 한마디
export const tiredLine = id => id === 'seohanbi' ? '오늘 사냥은 여기까지. 무리하면 내일이 무뎌져' : id === 'yeoni_pig' ? '오늘 운동운은 별 다섯! 이제 행운의 간식 먹으러 가자!' : '또 나만 뛰었네. 연이 얼굴 보고 쉬어야겠다.';

// 단계 클리어: 다음 단계로 이어 가거나 귀환해 정산한다. 고르는 동안 시간이 멈춘다
function stageClearDialog(state) {
  const h = state.hunt, c = h.stageChoice;
  const story = h.hunterId === 'neo' && c.first && HANBI_STAGES.includes(c.stage) && !state.roster.seohanbi;
  return `<div class="dialog stage-clear night" role="dialog" aria-modal="true">${NIGHT_ORN}<h2>${c.stage}단계 클리어</h2>
    <p>${c.first ? `첫 클리어 보너스 · 월정석 +${c.bonus}개를 가방에 담았어요.` : '이미 클리어한 단계예요. 첫 클리어 보너스는 한 번만 받아요.'}</p>
    ${story ? '<p class="ok">달그늘 깊은 곳에서 무언가가 지켜보고 있었어요. 귀환하면 이야기가 이어져요.</p>' : ''}
    <div class="kv"><span>가방 월정석</span><b>${h.bag.moonstone || 0}</b><span>처치</span><b>${h.kills}</b><span>남은 체력</span><b>${Math.ceil(h.hp)} / ${h.maxHp}</b><span>열린 단계</span><b>${state.hunter.maxStage} / 100</b></div>
    <p class="small muted">이어 가면 체력과 이번 사냥의 기술이 그대로 이어져요. 쓰러져도 모은 월정석은 가져와요.</p>
    ${c.tired ? `<p class="ok">${tiredLine(h.hunterId)}</p><p class="small muted">다음 출발에서 ${c.stage + 1}단계부터 이어 갈 수 있어요.</p>` : ''}
    <div class="stack">${c.next ? btn({ action: 'hunt.next', cls: 'primary', label: `다음 단계로 · ${c.stage + 1}단계` }) : c.tired ? '' : '<p class="ok">달그늘 100단계를 모두 정복했어요!</p>'}${btn({ action: 'hunt.retreat', cls: c.next ? '' : 'primary', label: c.tired ? '귀환' : '귀환해서 정산하기' })}</div></div>`;
}

function huntResult(state) {
  const h = state.hunt;
  const bonus=survivalReward(h), name=hunterName(h.hunterId);
  const head2 = h.status === 'down' ? `${name}, 지쳐서 돌아왔어` : h.status === 'retreat' ? (h.cleared ? `${h.cleared}개 단계를 클리어하고 돌아왔어요` : '일찍 돌아왔어요') : '사냥 완료';
  const bag = Object.entries(h.bag).filter(([id, n]) => id === 'moonstone' || n > 0).map(([id, n]) => `<span>${id === 'moonstone' ? '🌙 월정석' : esc(INGREDIENTS[id]?.name || id)}</span><b>${n}</b>`).join('');
  return `<div class="dialog night hunt-result" role="dialog" aria-modal="true">${NIGHT_ORN}<h2>${head2}</h2>${h.hunterId==='neo'?`<div class="hunt-return-art">${assetIcon('ui/neo_cat_tired')}</div>`:''}
    <div class="kv">${bag}<span>생존 추가 월정석</span><b>+${bonus.moonstone}</b><span>생존 재료</span><b>${Object.entries(bonus.items).map(([id,n])=>`${INGREDIENTS[id]?.name} ${n}`).join(' · ')||'1분부터 지급'}</b><span>클리어한 단계</span><b>${h.cleared ? `${h.cleared}개 · ${state.hunter.maxStage}단계까지 열림` : '보스를 쓰러뜨리면 클리어'}</b><span>처치</span><b>${h.kills}</b><span>이번 사냥 레벨</span><b>${h.level ?? 1}</b><span>탐사 성장 경험치</span><b>+${h.careerXP || 0}</b><span>보스 처치</span><b>${h.bossKills || 0}</b><span>사냥 시간</span><b>${fmtTime(h.elapsedMs)}</b></div>
    <p class="small muted">지쳐도 사냥꾼과 모은 보상은 사라지지 않아요. 귀환 보상은 한 번만 받고, 다음 출발 때 체력을 회복해요. 마을 「청토끼 금융 센터」에서 골드로 바꿀 수 있어요.</p>
    <div class="stack">${btn({ action: 'hunt.finish', cls: 'primary', label: '월정석 받고 가게로' })}</div></div>`;
}

function discoveryDialog(state,id) {
  const m = MENUS[id];
  const ings = Object.entries(m.ingredients).map(([i, k]) => `${INGREDIENTS[i].name}${k > 1 ? ` ×${k}` : ''}`).join(' + ');
  return `<div class="dialog discovery" role="dialog" aria-modal="true">
    <div class="disc-burst" aria-hidden="true"><i style="background:${m.color}"></i></div>
    <h2>✨ 새 레시피 발견!</h2><p class="disc-name">${esc(m.name)}</p>
    <div class="kv"><span>재료</span><b>${esc(ings)}</b><span>조리</span><b>${STATION_NAMES[m.station]} ${Math.round(m.cookMs / 1000)}초</b><span>판매가</span><b>${won(menuPrice(state,m))}</b></div>
    <p class="small muted">이제 손님이 이 메뉴를 주문할 수 있어요. 가격과 시간은 임시값입니다.</p>
    <div class="stack">${btn({ action: 'discovery.close', cls: 'primary', label: '레시피 노트에 적기' })}</div></div>`;
}

function recruitDialog(state, id) {
  const r = recruitView(state).find(x => x.id === id);
  if (!r) return '';
  return `<div class="dialog" role="dialog" aria-modal="true"><h2>${r.devOnly ? '<span class="tag dev">DEV</span> ' : ''}${esc(r.meetEvent.title)}</h2>
    ${r.meetEvent.lines.map(l => `<p class="line">${esc(l)}</p>`).join('')}
    <p class="small muted">보상(1회): ${esc(rewardText(r.reward || {}))} · ${state.hostbar.open ? '완료하면 다음 영업부터 함께 대화할 수 있어요' : '카페에 새로운 인연이 생겨요'}</p>
    <div class="stack">${btn({ action: 'recruit.complete', args: { id }, cls: 'primary', label: '이벤트 완료' })}${btn({ action: 'recruit.close', label: '나중에' })}</div></div>`;
}

function financeLoanHtml(state,c){
 return `<h3>확장을 앞당기는 운영 대출</h3><p class="small">청토끼: “기회는 빌려줄게. 이자까지 챙기는 건 네 몫이지!”</p><div class="kv"><span>대출 한도 / 사용 중</span><b>${won(c.limit)} / ${won(c.balance)}</b><span>월 이율</span><b>${c.rate*100}% · 복리</b><span>다음 하순 예상 이자</span><b>${won(c.nextInterest)}</b></div><p class="small muted">월말 하순에 이자를 내며, 못 낸 이자는 대출 잔액에 더해져요. 마감 직전 빌려도 한 달 이자가 발생해요. 본래 인수 빚은 별도이며 지금 월 ${Math.round(interestRate(state)*100)}%입니다. 시설 확장 후 늘어날 수익과 비교하세요.</p><div class="btns">${[10000,50000,200000,1000000].map(amount=>btn({action:'finance.borrow',args:{amount},disabled:c.available<amount,label:`${won(amount)} 빌리기`})).join('')}</div><h3>골드 · 월정석으로 상환</h3>${[['inheritance','인수 빚',state.debt],['loan','운영 대출',c.balance]].map(([target,name,debt])=>`<div class="card"><b>${name} ${won(debt)}</b><div class="btns">${btn({action:'finance.repay',args:{target,currency:'gold',amount:Math.min(debt,state.gold)},disabled:!debt||!state.gold,label:'가진 골드로 갚기'})}${btn({action:'finance.repay',args:{target,currency:'moonstone',amount:Math.min(state.moonstone,Math.ceil(debt/exchangeRate(state)))},disabled:!debt||!state.moonstone,label:'월정석으로 갚기'})}</div></div>`).join('')}<p class="small muted">월정석은 우대 환율까지 동일하게 적용해요. 빚보다 많이 환산된 잔액은 골드로 돌려드려요.</p>`;
}

function manageSheet(state){return `${head('카페 수첩')}<div class="notebook-menu">${[['gameroom','연이와 네오의 게임방','함께 즐기는 두 가지 미니게임','skills/bell'],['staffing','직원 배치','넓어진 공간에 영입 동료 배치','skills/bell'],['branches','지점 관리','본점에서 5호점까지','objects/basic_table'],['quests','퀘스트','연이와 오늘의 목표','farm/seeds'],['companions','동료와 인연','함께할 친구들의 이야기','skills/bell'],['outfits','드레스룸','오늘은 어떤 모습으로 만날까','icons/vest_night'],['debt','장부와 상환','빚과 이번 달의 계획','ui/ledger'],['audio','달빛 음악실','음악과 효과음','skills/bell'],['tutorial','튜토리얼','기능별 안내 다시 보기','farm/seeds'],['more','기타','저장·음악·튜토리얼','skills/hat']].map(([id,title,line,icon])=>btn({action:'sheet.open',args:{sheet:id},cls:'notebook-link',label:`${assetIcon(icon)}<span><b>${title}</b><small>${line}</small></span><span aria-hidden="true">›</span>`})).join('')}</div><div class="title-secondary">${btn({action:'game.title',label:'메인 화면으로'})}${btn({action:'game.exit',label:'저장하고 종료'})}</div><div class="manage-auto">${automationRow(state, 'hall')}${automationRow(state, 'hall_neo')}${automationRow(state, 'kitchen')}</div>`;}
