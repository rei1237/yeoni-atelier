import {changePopularity,guestChatter} from './reputation.js';
import {cafeProgress,customerWealth,atmosphere,menuWeight,menuPrice} from './cafe-growth.js';
import {CUSTOMER_WEALTH,wealthAt,hostRevenueMultiplier} from '../data/customer-wealth.js';
// 카페 영업 루프: 입장 → 착석 → 주문 → 조리 → 완성 → 트레이 → 직원 운반 → 서빙 → 식사 → 퇴장 → 정리 → 빈 테이블
// 모든 변경은 엔진 명령(engine.js)이나 영업 틱(shift.js)에서만 일어난다.

import { RULES } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, MENU_ORDER, INGREDIENTS, ingredientCostOf } from '../data/menus.js';
import { SPOTS, FURNITURE } from '../data/layout.js';
import { PEOPLE, STAFF_CREW } from '../data/companions.js';
import { emit, nextId, remainingShift, usableHosts } from './state.js';
import { buildGrid, findPath, tableGeometry } from './space.js';
import { nextRandom, randRange, pick } from '../core/rng.js';
import { bondFx } from '../data/bonds.js';

export const STATION_IDS = ['drink', 'oven'];
export const STATION_NAMES = { drink: '음료 머신', oven: '오븐' };

// ── 공간
const gridCache = new WeakMap();
export function getGrid(state) {
  const list = state.interior.furniture;
  const open = state.interior.areas || [];
  const sig = open.join(',');
  let g = gridCache.get(list);
  if (!g || g.sig !== sig) { g = buildGrid(list.filter(f => f.x != null), open); g.sig = sig; gridCache.set(list, g); }
  return g;
}

export function ambience(state) {
  return state.interior.furniture.filter(f => f.x != null).reduce((s, f) => s + (FURNITURE[f.defId].ambience || 0), 0);
}

function nearestWalkable(grid, spot) {
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (grid.walkable(spot.x + dx, spot.y + dy)) return { x: spot.x + dx, y: spot.y + dy };
    }
  }
  return { ...spot };
}

export function setupWorld(state) {
  const grid = getGrid(state);
  state.tables = state.interior.furniture
    .filter(f => FURNITURE[f.defId].table && f.x != null)
    .sort((a, b) => a.tableNo - b.tableNo)
    .map(f => ({ no: f.tableNo, uid: f.uid, ...tableGeometry(grid, f), state: 'empty', customerId: null, cleanQueued: false, cleanEndAt: null }));
  state.customers = {}; state.visits = {}; state.orders = {}; state.tasks = [];
  state.stations = { drink: { current: null, next: null, held: null }, oven: { current: null, next: null, held: null } };
  state.tray = Array(RULES.TRAY_SLOTS).fill(null);
  state.staff = {};
  const mk = (id, home) => ({ id, home, x: home.x + 0.5, y: home.y + 0.5, path: [], job: null, action: 'idle', facing: 'down', carry: null, actionUntil: 0 });
  state.staff.yeoni = mk('yeoni', { ...SPOTS.yeoniHome });
  state.staff.yeoni.facing = 'right'; // 계산대 너머 입구를 본다
  const crewHome = { luna_sis: SPOTS.sisHome, luna: SPOTS.lunaHome };
  for (const id of STAFF_CREW) state.staff[id] = mk(id, { ...crewHome[id] });
  usableHosts(state).forEach((id, i) => {
    const home = i === 0 ? { ...SPOTS.neoHome } : nearestWalkable(grid, { x: 1 + ((i - 1) % 4) * 2, y: 2 + Math.floor((i - 1) / 4) * 4 });
    state.staff[id] = mk(id, home);
  });
}

export const tableByNo = (state, no) => state.tables.find(t => t.no === no) || null;
export const customerAt = (state, no) => {
  const t = tableByNo(state, no);
  return t && t.customerId ? state.customers[t.customerId] : null;
};
export const visitAt = (state, no) => {
  const c = customerAt(state, no);
  return c ? state.visits[c.visitId] : null;
};
export function openOrdersOfVisit(state, visit) {
  return visit.orderIds.map(id => state.orders[id]).filter(o => o && (o.status === 'waiting' || o.status === 'assigned'));
}

// ── 이동
function setPath(state, e, to, opts) {
  const p = findPath(getGrid(state), { x: Math.floor(e.x), y: Math.floor(e.y) }, to, opts);
  e.path = p || []; // 검증된 배치에서는 항상 길이 있다. 없으면 제자리 도착으로 처리해 진행이 멈추지 않게 한다.
  e.moving = true;
}

function moveAlong(e, dt, tilesPerS) {
  let dist = tilesPerS * dt / 1000;
  while (dist > 0 && e.path.length) {
    const [tx, ty] = e.path[0];
    const cx = tx + 0.5, cy = ty + 0.5;
    const dx = cx - e.x, dy = cy - e.y;
    const d = Math.hypot(dx, dy);
    if (d > 1e-6) e.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (d <= dist) { e.x = cx; e.y = cy; e.path.shift(); dist -= d; } else { e.x += dx / d * dist; e.y += dy / d * dist; dist = 0; }
  }
  const arrived = e.moving && e.path.length === 0;
  if (arrived) e.moving = false;
  return arrived;
}

// ── 재고·조리
// 주문 말풍선 한 번: 완성 음식은 그 테이블로 보내고, 없으면 한 개만 조리 예약한다.
export function quickOrder(state, orderId) {
  const order = state.orders[orderId];
  if (!order || order.status !== 'waiting') return { ok: false, reason: '이미 서빙 중이거나 끝난 주문이에요' };
  const item = state.tray.find(it => it && !it.reservedFor && it.menuId === order.menuId);
  if (item && state.visits[order.visitId]?.kind==='takeaway') {state.tray[state.tray.indexOf(item)]=null;recordServe(state,order);return {ok:true};}
  if (item) return serve(state, item.id, order.tableNo);
  const station = state.stations[MENUS[order.menuId].station];
  if ([station.current, station.next].some(job => job?.orderId === orderId)) return { ok: false, reason: '이 주문은 만들고 있어요. 완성 트레이를 눌러 주세요' };
  const prepared = [station.current, station.next, station.held].filter(job => job?.menuId === order.menuId).length;
  const waiting = Object.values(state.orders).filter(o => o.status === 'waiting' && o.menuId === order.menuId);
  if (prepared > waiting.findIndex(o => o.id === orderId)) return { ok: false, reason: '이 주문은 만들고 있어요. 완성 트레이를 눌러 주세요' };
  const result = cook(state, order.menuId, order.id);
  if (result.ok) (result.started ? station.current : station.next).orderId = orderId;
  return result;
}

export function stockCheck(state, menuId) {
  const m = MENUS[menuId];
  for (const [id, n] of Object.entries(m.ingredients)) {
    const have = state.stock[id] || 0;
    if (have < n) return { ok: false, reason: `재료 부족: ${INGREDIENTS[id].name} ${have}/${n}` };
  }
  return { ok: true };
}

function consume(state, job) {
  if (state.ledger.consumes[job.id]) return; // 같은 작업의 재료를 두 번 빼지 않는다
  for (const [id, n] of Object.entries(MENUS[job.menuId].ingredients)) state.stock[id] -= n;
  state.ledger.consumes[job.id] = true;
  if (state.shift) state.shift.ingredientCost += ingredientCostOf(job.menuId);
}

function startJob(state, sid, job) {
  const st = state.stations[sid];
  const chk = stockCheck(state, job.menuId);
  if (!chk.ok) { emit('cookCancelled', { station: sid, menuId: job.menuId, reason: chk.reason }); return false; }
  consume(state, job);
  st.current = { ...job, progressMs: 0, startedAt: state.shift.elapsedMs };
  emit('cookStart', { station: sid, menuId: job.menuId });
  return true;
}

export function cook(state, menuId, orderId=null) {
  const m = MENUS[menuId];
  if (!m) return { ok: false, reason: '없는 메뉴입니다' };
  if (!state.learned[menuId]) return { ok: false, reason: `${m.name} 레시피를 아직 배우지 않았습니다` };
  const st = state.stations[m.station];
  const chk = stockCheck(state, menuId);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  // 루나 언니 친밀도 능력: 조리 시간 단축
  const takeaway=state.visits[state.orders[orderId]?.visitId]?.kind==='takeaway';
  const job = { id: nextId(state, 'job'), menuId, orderId, durationMs: Math.round(m.cookMs * (1 - bondFx(state.affinity).cookSpeed)*(takeaway?.55:1)) };
  if (!st.current && !st.held && !st.next) { startJob(state, m.station, job); return { ok: true, started: true }; }
  if (!st.next) { st.next = job; emit('cookQueued', { station: m.station, menuId }); return { ok: true, queued: true }; }
  return { ok: false, reason: `${STATION_NAMES[m.station]} 대기열이 가득 찼습니다 (현재 1 + 다음 1)` };
}

// 시작 전인 다음 작업 취소: 재료를 아직 쓰지 않았으므로 돌려줄 것도 없다
export function cancelNext(state, sid) {
  const st = state.stations[sid];
  if (!st?.next) return { ok: false, reason: '취소할 다음 작업이 없습니다' };
  emit('cookCancelled', { station: sid, menuId: st.next.menuId, reason: '다음 작업 취소' });
  st.next = null;
  return { ok: true };
}

function placeInTray(state, item) {
  const i = state.tray.indexOf(null);
  if (i < 0) return false;
  state.tray[i] = item;
  return true;
}

export function stepStations(state, dt) {
  for (const sid of STATION_IDS) {
    const st = state.stations[sid];
    if (st.held && placeInTray(state, st.held)) { emit('heldToTray', { station: sid }); st.held = null; }
    if (st.current) {
      st.current.progressMs += dt;
      if (st.current.progressMs >= st.current.durationMs) {
        const item = { id: nextId(state, 'item'), menuId: st.current.menuId, reservedFor: null };
        const order=state.orders[st.current.orderId];
        const pickup=order?.status==='waiting' && state.visits[order.visitId]?.kind==='takeaway' && state.visits[order.visitId].status==='active';
        st.current = null;
        if(pickup){recordServe(state,order);emit('takeawayDone',{price:order.price});}
        else if (placeInTray(state, item)) emit('cooked', { station: sid, menuId: item.menuId });
        else { st.held = item; emit('trayFull', { station: sid, menuId: item.menuId }); }
      }
    }
    if (!st.current && !st.held && st.next) {
      const job = st.next; st.next = null;
      startJob(state, sid, job);
    }
  }
}

// ── 메뉴 선택(늦은 주문 제한 포함)
function menuAvailable(state, menuId) {
  if (!state.learned[menuId]) return false;
  if (stockCheck(state, menuId).ok) return true;
  return state.tray.some(it => it && it.menuId === menuId && !it.reservedFor);
}

export function chooseMenu(state, limitMs, visit=null) {
  const list = MENU_ORDER.filter(id => menuAvailable(state, id) && MENUS[id].cookMs + TEMP.SERVE_BUFFER_MS <= limitMs && menuWeight(state,visit,MENUS[id])>0);
  if (!list.length) return null;
  const weights = list.map(id => menuWeight(state,visit,MENUS[id]));
  let r = nextRandom(state.rng) * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r < 0) return list[i]; }
  return list[list.length - 1];
}

export function placeOrder(state, visit, menuId) {
  const m = MENUS[menuId];
  if(!m || (m.nominationOnly && (visit.kind!=='nomination'||visit.acceptAt==null)))return null;
  const order = { id: nextId(state, 'order'), visitId: visit.id, tableNo: visit.tableNo, menuId, price: menuPrice(state,m), placedAt: state.shift.elapsedMs, status: 'waiting', itemId: null, servedAt: null };
  state.orders[order.id] = order;
  visit.orderIds.push(order.id);
  emit('order', { tableNo: visit.tableNo, menuId });
  return order;
}

// ── 서빙
export function serve(state, itemId, tableNo) {
  const item = state.tray.find(it => it && it.id === itemId);
  if (!item) return { ok: false, reason: '트레이에 그 음식이 없습니다' };
  if (item.reservedFor) return { ok: false, reason: '이미 운반이 예약된 음식입니다' };
  const visit = visitAt(state, tableNo);
  const order = visit && openOrdersOfVisit(state, visit).find(o => o.status === 'waiting' && o.menuId === item.menuId);
  if (!order) {
    const right = Object.values(state.orders).find(o => o.status === 'waiting' && o.menuId === item.menuId);
    const name = MENUS[item.menuId].name;
    return { ok: false, reason: right ? `${name}은(는) ${right.tableNo}번 테이블 주문입니다. 음식은 트레이에 그대로 있어요.` : `${name}을(를) 기다리는 테이블이 없습니다. 음식은 트레이에 그대로 있어요.`, rightTable: right?.tableNo ?? null };
  }
  order.status = 'assigned';
  order.itemId = item.id;
  item.reservedFor = order.id;
  state.tasks.push({ id: nextId(state, 'task'), type: 'deliver', orderId: order.id, itemId: item.id, tableNo, assignedTo: null });
  emit('serveQueued', { tableNo, menuId: item.menuId });
  return { ok: true };
}

export function findServeTarget(state, item) {
  const o = Object.values(state.orders).find(x => x.status === 'waiting' && state.visits[x.visitId]?.kind!=='takeaway' && x.menuId === item.menuId);
  return o ? o.tableNo : null;
}

function recordServe(state, order) {
  if (state.ledger.sales[order.id] != null) return; // 같은 주문을 두 번 매출로 잡지 않는다
  const now = state.shift.elapsedMs;
  const visit = state.visits[order.visitId];
  const levelBefore=cafeProgress(state).level;
  const revenue = Math.floor(order.price * (visit.acceptAt != null ? hostRevenueMultiplier(visit.nominee) : 1)*(visit.motive==='atmosphere'?1+Math.min(.3,atmosphere(state)/200):1));
  state.ledger.sales[order.id] = revenue;
  visit.bill=(visit.bill||0)+revenue;
  state.shift.sales += revenue;
  state.shift.servedCount += 1;
  state.stats.served += 1;
  changePopularity(state,.3);
  if (MENUS[order.menuId].special) state.stats.servedSpecial += 1;
  order.status = 'served';
  order.servedAt = now;
  visit.servedTotal += order.price;
  const waitS = (now - order.placedAt) / 1000;
  const food = Math.max(30, Math.min(100, 100 - Math.max(0, waitS - 30) * 0.8)) + Math.min(10, ambience(state));
  visit.foodScores.push(Math.min(100, Math.round(food)));
  const c = state.customers[visit.customerId];
  if (c) {
    c.action = 'eat'; c.actionUntil = now + TEMP.EAT_MS;
    if (visit.kind === 'regular') { c.state = 'eating'; c.eatEndAt = now + TEMP.EAT_MS; }
  }
  // 연이의 계산 동작은 실제 카운터 결제 때 실행한다.
  emit('served', { tableNo: order.tableNo||null, menuId: order.menuId, price: revenue });
  if(cafeProgress(state).level>levelBefore)emit('cafeLevelUp',{level:cafeProgress(state).level});
  if(visit.kind==='takeaway' && c){state.stats.takeaways=(state.stats.takeaways||0)+1;customerLeave(state,c,'포장 수령');}

}

// ── 정리
export function requestClean(state, tableNo) {
  const t = tableByNo(state, tableNo);
  if (!t) return { ok: false, reason: '없는 테이블입니다' };
  if (t.state !== 'dirty') return { ok: false, reason: t.state === 'cleaning' ? '이미 정리 중입니다' : '정리할 필요가 없습니다' };
  if (t.cleanQueued) return { ok: false, reason: '정리가 이미 예약되어 있습니다' };
  t.cleanQueued = true;
  state.tasks.push({ id: nextId(state, 'task'), type: 'clean', tableNo, assignedTo: null });
  return { ok: true };
}

// ── 직원
export function staffAvailable(state, id) {
  const s = state.staff[id];
  if (!s || (s.job && s.job.kind !== 'home')) return false;
  const work = PEOPLE[id]?.work;
  if (work) return work === 'runner'; // 연이(계산)·루나 언니(굽기)는 운반하지 않는다
  return state.people[id]?.activity === 'idle'; // 접대 중인 동료는 서빙·정리에 투입하지 않는다
}

export function staffStatusText(state, id) {
  const s = state.staff[id];
  if (!s) return '';
  const j = s.job;
  if (id === 'yeoni') return s.action === 'react' ? '계산 중' : '계산대';
  if (id === 'luna_sis') return j?.kind === 'station' && j.sid ? `${STATION_NAMES[j.sid]} 앞` : '대기';
  if (state.people[id]?.activity === 'hosting') return `${state.people[id].tableNo}번 접대 중`;
  if (!j || j.kind === 'home') return '대기';
  if (j.kind === 'deliver') return j.stage === 'return' ? '음식 되돌리는 중' : `${j.tableNo}번 서빙`;
  if (j.kind === 'clean') return `${j.tableNo}번 정리`;
  if (j.kind === 'host') return `${j.tableNo}번으로 이동`;
  return '';
}

function assignTasks(state) {
  for (const task of state.tasks) {
    if (task.assignedTo) continue;
    const t = tableByNo(state, task.tableNo);
    const target = task.type === 'deliver' ? SPOTS.pickup : t.service;
    let best = null;
    for (const id of Object.keys(state.staff)) {
      if (!staffAvailable(state, id)) continue;
      const s = state.staff[id];
      const d = Math.abs(s.x - target.x) + Math.abs(s.y - target.y) + (PEOPLE[id]?.work === 'runner' ? 0 : 0.5);
      if (!best || d < best.d) best = { id, d };
    }
    if (!best) continue;
    const s = state.staff[best.id];
    task.assignedTo = best.id;
    if (task.type === 'deliver') {
      s.job = { kind: 'deliver', taskId: task.id, tableNo: task.tableNo, stage: 'toPickup' };
      setPath(state, s, SPOTS.pickup);
    } else {
      s.job = { kind: 'clean', taskId: task.id, tableNo: task.tableNo, stage: 'toTable' };
      setPath(state, s, t.service);
    }
  }
}

function finishTask(state, s) {
  state.tasks = state.tasks.filter(t => t.id !== s.job.taskId);
  s.job = null;
}

export function sendHome(state, s) {
  s.job = { kind: 'home' };
  setPath(state, s, s.home);
}

export function sendHostToTable(state, personId, tableNo) {
  const s = state.staff[personId];
  if (!s) return;
  const t = tableByNo(state, tableNo);
  s.job = { kind: 'host', tableNo, stage: 'toTable' };
  const grid=getGrid(state);
  const beside=[{x:t.chair.x+1,y:t.chair.y},{x:t.chair.x-1,y:t.chair.y}].find(p=>grid.walkable(p.x,p.y)&&findPath(grid,{x:Math.floor(s.x),y:Math.floor(s.y)},p));
  setPath(state, s, beside||t.service);
}

// 루나 언니: 굽는 중인 기계 앞으로 가서 굽는다(가장 최근에 시작한 쪽). 없으면 대기 자리.
const STATION_FRONT = { drink: SPOTS.drinkFront, oven: SPOTS.ovenFront };
function stepBaker(state, s, dt) {
  moveAlong(s, dt, TEMP.WALK_TILES_PER_S);
  const busy = STATION_IDS.filter(id => state.stations[id].current)
    .sort((a, b) => state.stations[b].current.startedAt - state.stations[a].current.startedAt);
  const sid = busy[0] || null;
  const goal = sid ? STATION_FRONT[sid] : s.home;
  const j = s.job;
  if (!j || j.kind !== 'station' || j.goal.x !== goal.x || j.goal.y !== goal.y) {
    s.job = { kind: 'station', sid, goal: { ...goal } };
    setPath(state, s, goal);
  }
  if (s.path.length) s.action = 'walk';
  else { s.action = sid ? 'cook' : 'idle'; s.facing = sid ? 'up' : 'down'; }
}

export function stepStaff(state, dt) {
  const now = state.shift.elapsedMs;
  assignTasks(state);
  for (const s of Object.values(state.staff)) {
    if (PEOPLE[s.id]?.work === 'baker') { stepBaker(state, s, dt); continue; }
    const arrived = moveAlong(s, dt, TEMP.WALK_TILES_PER_S);
    const j = s.job;
    if (s.actionUntil && now >= s.actionUntil) { s.actionUntil = 0; if (s.action === 'serve' || s.action === 'react') s.action = 'idle'; }
    if (!j) {
      if (Math.floor(s.x) !== s.home.x || Math.floor(s.y) !== s.home.y) sendHome(state, s);
    } else if (j.kind === 'home') {
      if (arrived) s.job = null;
    } else if (j.kind === 'deliver') {
      const task = state.tasks.find(t => t.id === j.taskId);
      const order = task && state.orders[task.orderId];
      if (j.stage === 'toPickup' && arrived) {
        const idx = state.tray.findIndex(it => it && it.id === task.itemId);
        if (idx < 0 || !order || order.status !== 'assigned') { finishTask(state, s); continue; }
        s.carry = state.tray[idx];
        state.tray[idx] = null;
        j.stage = 'toTable';
        setPath(state, s, tableByNo(state, j.tableNo).service);
      } else if (j.stage === 'toTable' && arrived) {
        if (order && order.status === 'assigned') {
          recordServe(state, order);
          s.carry = null;
          s.action = 'serve'; s.actionUntil = now + 600;
          finishTask(state, s);
        } else {
          j.stage = 'return';
          setPath(state, s, SPOTS.pickup);
        }
      } else if (j.stage === 'return' && !s.path.length) {
        // 손님이 떠난 음식은 버리지 않고 트레이로 돌려놓는다. 자리가 날 때까지 서빙대 앞에서 기다린다.
        if (s.carry) { s.carry.reservedFor = null; if (placeInTray(state, s.carry)) s.carry = null; }
        if (!s.carry) finishTask(state, s);
      }
    } else if (j.kind === 'clean') {
      const t = tableByNo(state, j.tableNo);
      if (j.stage === 'toTable' && arrived) {
        j.stage = 'cleaning';
        t.state = 'cleaning';
        t.cleanMs = PDF.CLEAN_MS;
        t.cleanEndAt = now + t.cleanMs;
        s.action = 'clean';
      } else if (j.stage === 'cleaning' && now >= t.cleanEndAt) {
        t.state = 'empty'; t.cleanQueued = false; t.cleanEndAt = null;
        s.action = 'idle';
        emit('cleaned', { tableNo: t.no });
        finishTask(state, s);
      }
    } else if (j.kind === 'host') {
      if (j.stage === 'toTable' && arrived) { j.stage = 'hosting'; s.action = 'host'; const tb = tableByNo(state, j.tableNo); s.facing = tb.table.x < s.x - 0.5 ? 'left' : tb.table.x > s.x - 0.5 ? 'right' : (tb.table.y < s.y - 0.5 ? 'up' : 'down'); }
    }
    if (!s.job && !s.actionUntil) s.action = 'idle';
    if (s.path.length) s.action = 'walk';
    else if (s.action === 'walk') s.action = s.job?.kind === 'host' && s.job.stage === 'hosting' ? 'host' : 'idle';
  }
}

// ── 손님
function cancelVisitOrders(state, visit) {
  for (const o of openOrdersOfVisit(state, visit)) {
    if (o.status === 'assigned') {
      const task = state.tasks.find(t => t.orderId === o.id);
      const item = state.tray.find(it => it && it.id === o.itemId);
      if (item) item.reservedFor = null;
      if (task && !task.assignedTo) state.tasks = state.tasks.filter(t => t !== task);
      else if (task) {
        const s = state.staff[task.assignedTo];
        if (s?.job?.taskId === task.id && s.job.stage === 'toPickup') { finishTask(state, s); }
        // toTable 단계는 도착 시 주문 취소를 보고 음식을 트레이로 되돌린다
      }
    }
    o.status = 'cancelled';
    state.shift.lostOrders += 1;
  }
}

export function customerLeave(state, c, reason) {
  const visit = state.visits[c.visitId];
  cancelVisitOrders(state, visit);
  const t = tableByNo(state, c.tableNo);
  if (t && t.customerId === c.id) { t.customerId = null; t.state = 'dirty'; }
  visit.status = 'done';
  visit.leaveReason = reason;
  if(reason.includes('오래 기다려')||reason.includes('주문할 수'))changePopularity(state,-1.5);
  c.state = visit.bill>0 && !visit.paid ? 'checkout' : 'leaving';
  c.action = 'walk';c.payAt=null;
  setPath(state,c,c.state==='checkout'?nearestWalkable(getGrid(state),{x:5,y:14}):SPOTS.entrance);
  emit('leave', { tableNo: c.tableNo, reason });
}

export function spawnCustomer(state, spec) {
  if (!state.hostbar.open && spec.kind === 'nomination') spec = { ...spec, kind: 'regular', nominee: null };
  const empty = state.tables.filter(t => t.state === 'empty');
  const takeaway=spec.kind==='takeaway';
  if(takeaway && Object.values(state.visits).filter(v=>v.kind==='takeaway'&&v.status==='active').length>=2)return null;
  if (!takeaway && !empty.length) return null;
  const t = takeaway?{no:0,chair:nearestWalkable(getGrid(state),{x:5,y:14})}:pick(state.rng, empty);
  const profile = spec.profileId ? PDF.PROFILES.find(p => p.id === spec.profileId) : pick(state.rng, PDF.PROFILES);
  const wealthId = CUSTOMER_WEALTH[spec.wealthId] ? spec.wealthId : customerWealth(state,nextRandom(state.rng));
  const cid = nextId(state, 'customer');
  const vid = nextId(state, 'visit');
  state.shift.spawnCount += 1;
  const c = {
    id: cid, visitId: vid, tableNo: t.no, wealthId, label: `${takeaway?'포장 · ':''}${CUSTOMER_WEALTH[wealthId].name} ${state.shift.spawnCount}`,
    x: SPOTS.entrance.x + 0.5, y: SPOTS.entrance.y + 0.5, path: [], moving: false, facing: 'up',
    state: 'entering', action: 'walk', actionUntil: 0, orderAt: null, eatEndAt: null,
    hue: Math.floor(nextRandom(state.rng) * 360),
  };
  const visit = {
    id: vid, customerId: cid, tableNo: t.no, kind: spec.kind, motive:spec.motive || (spec.kind==='regular' && nextRandom(state.rng)<Math.min(.55,.1+atmosphere(state)/140)?'atmosphere':'menu'), wealthId, profileId: profile.id, prefs: { ...profile.prefs },
    nominee: spec.kind === 'nomination' ? spec.nominee : null, requestedNominee: spec.kind === 'nomination' ? spec.nominee : null,
    requestAt: null, acceptAt: null, endAt: null, waitPenalty: 0, talkBonus: 0, help: [],
    feverEvalDone: false, feverSpecialDone: false, fevered: false, extraOrderDone: false,
    orderIds: [], servedTotal: 0, foodScores: [], finalH: null, tip: null, settled: false, status: 'active', outcome: null, gag: null,
  };
  state.customers[cid] = c;
  state.visits[vid] = visit;
  t.state = 'occupied';
  t.customerId = cid;
  setPath(state, c, t.chair, { goalBlocked: true });
  if (spec.kind !== 'nomination') state.shift.regularVisits += 1; else state.shift.nominationVisits += 1;
  visit.chatter=guestChatter(state,visit,nextRandom(state.rng));
  emit('enter', { tableNo: t.no, kind: spec.kind });
  return c;
}

export function stepCustomers(state, dt, hooks) {
  const now = state.shift.elapsedMs;
  for (const c of Object.values(state.customers)) {
    const arrived = moveAlong(c, dt, TEMP.CUSTOMER_TILES_PER_S);
    const visit = state.visits[c.visitId];
    if (c.actionUntil && now >= c.actionUntil) { c.actionUntil = 0; if (c.action === 'eat' || c.action === 'react') c.action = 'idle'; }
    switch (c.state) {
      case 'entering':
        if (arrived) {
          c.action = 'idle';
          c.facing = 'up';
          if (visit.kind === 'nomination') {
            c.state = 'requesting';
            visit.requestAt = now; // 요청만 생긴다. 예약도 300초 타이머도 시작하지 않는다.
            emit('nominationRequest', { tableNo: c.tableNo, nominee: visit.nominee });
          } else {
            c.state = 'thinking';
            c.orderAt = now + TEMP.ORDER_THINK_MS;
          }
        }
        break;
      case 'thinking':
        if (now >= c.orderAt) {
          const menuId = chooseMenu(state, remainingShift(state),visit);
          if (!menuId) { customerLeave(state, c, remainingShift(state) < 60000 ? '마감이 가까워 주문하지 않음' : '주문할 수 있는 메뉴가 없음'); break; }
          placeOrder(state, visit, menuId);
          c.state = 'waiting_food';
        }
        break;
      case 'waiting_food': {
        const open = openOrdersOfVisit(state, visit);
        if (open.length && now - open[0].placedAt >= TEMP.FOOD_PATIENCE_MS * (1 + bondFx(state.affinity).patience)) customerLeave(state, c, '음식을 오래 기다려 떠남');
        break;
      }
      case 'eating':
        if (now >= c.eatEndAt) customerLeave(state, c, '식사 완료');
        break;
      case 'requesting':
        hooks.onRequesting(state, c, visit, now);
        break;
      case 'checkout':
        if(arrived||!c.path.length){c.action='idle';c.facing='left';c.payAt??=now+650;if(now>=c.payAt){checkout(state,visit);c.state='leaving';c.action='walk';setPath(state,c,SPOTS.entrance);}}
        break;
      case 'leaving':
        if (arrived || !c.path.length) delete state.customers[c.id];
        break;
      default:
        break;
    }
  }
}

// 매출은 서빙 기록에 쌓고, 실제 골드는 연이의 계산대에서 한 번만 받는다.
export function checkout(state,visit){
 if(!visit || visit.paid)return false;
 state.ledger.checkouts ||= {};
 if(state.ledger.checkouts[visit.id]!=null){visit.paid=true;return false;}
 const amount=Math.max(0,visit.bill||0);state.ledger.checkouts[visit.id]=amount;visit.paid=true;state.gold+=amount;
 const yeoni=state.staff.yeoni;if(yeoni){yeoni.action='react';yeoni.actionUntil=state.shift.elapsedMs+650;yeoni.facing='right';}
 if(amount)emit('paidAtCounter',{amount});return true;
}
