import {trafficStep,cafeActors,ACTOR_GAP} from './cafe-traffic.js';
import {yeoniEffects} from './yeoni-growth.js';
import {cafeCapacity,assignedHosts} from './capacity.js';
import {activeSlotNames,heldKey,runningJobs,queuedJobs,stationJobs,stationItems} from './station-slots.js';
export {stationJobs,stationItems} from './station-slots.js';
import { HALL_ABILITIES, ABILITIES, hallAutomationOn } from './permissions.js';
import {qualityForTiming,qualityOf,foodScore} from '../data/cooking-quality.js';
import { customerLook } from '../data/customer-looks.js';
import {wealthEligible} from './cafe-growth.js';
import {changePopularity,guestChatter,waitingSatisfaction,reviewVisit} from './reputation.js';
import {cafeProgress,customerWealth,atmosphere,menuWeight,menuPrice} from './cafe-growth.js';
import {CUSTOMER_WEALTH,wealthAt,hostRevenueMultiplier} from '../data/customer-wealth.js';
// 카페 영업 루프: 입장 → 착석 → 주문 → 조리 → 완성 → 트레이 → 직원 운반 → 서빙 → 식사 → 퇴장 → 정리 → 빈 테이블
// 모든 변경은 엔진 명령(engine.js)이나 영업 틱(shift.js)에서만 일어난다.

import { RULES } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, MENU_ORDER, INGREDIENTS, ingredientCostOf } from '../data/menus.js';
import { SPOTS, FURNITURE, cafeSpots, cafeLayout } from '../data/layout.js';
import { PEOPLE, STAFF_CREW } from '../data/companions.js';
import { emit, nextId, remainingShift, usableHosts } from './state.js';
import { buildGrid, findPath, tableGeometry } from './space.js';
import { nextRandom, randRange, pick } from '../core/rng.js';
import { bondFx } from '../data/bonds.js';
import { changeStress, isResting } from './stress.js';

export const STATION_IDS = ['drink', 'oven'];
export const STATION_NAMES = { drink: '음료 머신', oven: '오븐' };

// ── 공간
const gridCache = new WeakMap();
export function getGrid(state) {
  const list = state.interior.furniture;
  const open = state.interior.areas || [];
  const sig = cafeLayout(state).id+'|'+open.join(',')+'|'+list.map(f=>[f.uid,f.defId,f.x,f.y,f.rot].join(':')).join(';');
  let g = gridCache.get(list);
  if (!g || g.sig !== sig) { g = buildGrid(list.filter(f => f.x != null), open,cafeLayout(state)); g.sig = sig; gridCache.set(list, g); }
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
    .map(f => ({ no: f.tableNo, uid: f.uid, ...tableGeometry(grid, f), state: 'empty', customerId: null, cleanQueued: false, cleanEndAt: null })).filter(t=>t.chair&&t.service);
  state.customers = {}; state.visits = {}; state.orders = {}; state.tasks = [];
  state.stations = { drink: { current: null, next: null, held: null }, oven: { current: null, next: null, held: null } };
  state.tray = Array(cafeCapacity(state).traySlots).fill(null);
  state.staff = {};
  const mk = (id, home) => ({ id, home, x: home.x + 0.5, y: home.y + 0.5, path: [], job: null, action: 'idle', facing: 'down', carry: null, actionUntil: 0 });
  state.staff.yeoni = mk('yeoni', { ...cafeSpots(state).yeoniHome });
  state.staff.yeoni.facing = cafeLayout(state).yeoniFacing; // 계산대 너머 입구를 본다
  const crewHome = { luna_sis: cafeSpots(state).sisHome, luna: cafeSpots(state).lunaHome };
  for (const id of STAFF_CREW) state.staff[id] = mk(id, { ...crewHome[id] });
  assignedHosts(state).forEach((id, i) => {
    const home = i === 0 ? { ...cafeSpots(state).neoHome } : nearestWalkable(grid, { x: 1 + ((i - 1) % 4) * 2, y: 2 + Math.floor((i - 1) / 4) * 4 });
    state.staff[id] = mk(id, home);
  });
  if(state.shift)state.shift.staffIds=Object.keys(state.staff);
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
  if (p && !p.length && Math.hypot(e.x - to.x - .5, e.y - to.y - .5) > .025) e.path = [[to.x, to.y]]; // 같은 칸이어도 중앙까지 걷는다(결제 판정은 칸 중앙에서)
  e.moving = true;
  e.trafficWait = 0; e.trafficBest = Infinity; e.trafficGhost = 0;
}

// 길을 비켜 주다 서로 막히면(같은 칸을 향하거나 좁은 길목에서 마주 서면) 아무도 못 움직인다.
// 남은 거리가 TRAFFIC_YIELD_MS 동안 줄지 않으면 다음 칸에 닿을 때까지 사람을 통과해 걷는다.
const remainOf=e=>e.path.length?Math.hypot(e.path[0][0]+.5-e.x,e.path[0][1]+.5-e.y)+e.path.length-1:0;
function moveAlong(state,e,dt,tilesPerS) {
 if(e.trafficGhost&&e.path.length<e.trafficGhost)e.trafficGhost=0;
 if(!e.trafficGhost&&e.path.length&&(e.trafficWait||0)>=TEMP.TRAFFIC_YIELD_MS)e.trafficGhost=e.path.length;
 let dist=tilesPerS*dt/1000;const grid=getGrid(state),actors=e.trafficGhost?[]:cafeActors(state);
 while(dist>1e-6&&e.path.length){
  const [tx,ty]=e.path[0],target={x:tx+.5,y:ty+.5},d=Math.hypot(target.x-e.x,target.y-e.y);
  if(e.path.length>1&&d<.8){e.path.shift();continue;}
  if(d<.025){e.x=target.x;e.y=target.y;e.path.shift();continue;}
  const here={x:Math.floor(e.x),y:Math.floor(e.y)},last=e.path.length===1;
  const next=trafficStep(e,target,Math.min(dist,.08),actors,(x,y)=>{const gx=Math.floor(x),gy=Math.floor(y);return grid.walkable(gx,gy)||(gx===here.x&&gy===here.y)||(last&&gx===tx&&gy===ty);});
  if(!next)break;
  const dx=next.x-e.x,dy=next.y-e.y,moved=Math.hypot(dx,dy);
  e.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  e.x=next.x;e.y=next.y;e.walkDistance=((e.walkDistance||0)+moved)%1024;dist-=moved;
 }
 const remain=remainOf(e);
 if(!e.path.length||remain<(e.trafficBest??Infinity)-.05){e.trafficBest=remain;e.trafficWait=0;}else e.trafficWait=(e.trafficWait||0)+dt;
 if(!e.path.length)e.trafficGhost=0;
 const arrived=e.moving&&e.path.length===0;if(arrived)e.moving=false;return arrived;
}

// ── 재고·조리
// 주문 말풍선 한 번: 완성 음식은 그 테이블로 보내고, 없으면 한 개만 조리 예약한다.
export function quickOrder(state, orderId, timing) {
  const order = state.orders[orderId];
  if (!order || order.status !== 'waiting') return { ok: false, reason: '이미 서빙 중이거나 끝난 주문이에요' };
  const item = state.tray.find(it => it && !it.reservedFor && it.menuId === order.menuId && (!it.orderId||it.orderId===orderId));
  if (item && state.visits[order.visitId]?.kind==='takeaway') {state.tray[state.tray.indexOf(item)]=null;recordServe(state,order,item);return {ok:true};}
  if (item) return serve(state, item.id, order.tableNo);
  const station = state.stations[MENUS[order.menuId].station];
  if ([...stationJobs(station),...stationItems(station)].some(job => job.orderId === orderId)) return { ok: false, reason: '이 주문은 만들고 있어요. 완성 트레이를 눌러 주세요' };
  const prepared = [...stationJobs(station),...stationItems(station)].filter(job => !job.orderId && job.menuId === order.menuId).length;
  const waiting = Object.values(state.orders).filter(o => o.status === 'waiting' && o.menuId === order.menuId);
  if (prepared > waiting.findIndex(o => o.id === orderId)) return { ok: false, reason: '이 주문은 만들고 있어요. 완성 트레이를 눌러 주세요' };
  const result = cook(state, order.menuId, order.id, timing);
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

function startJob(state, sid, job, slot='current') {
  const st = state.stations[sid];
  const chk = stockCheck(state, job.menuId);
  if (!chk.ok) { emit('cookCancelled', { station: sid, menuId: job.menuId, reason: chk.reason }); return false; }
  consume(state, job);
  st[slot] = { ...job, progressMs: 0, startedAt: state.shift.elapsedMs };
  emit('cookStart', { station: sid, menuId: job.menuId });
  return true;
}

export function cook(state, menuId, orderId=null, timing) {
  const m = MENUS[menuId];
  if (!m) return { ok: false, reason: '없는 메뉴입니다' };
  if (!state.learned[menuId]) return { ok: false, reason: `${m.name} 레시피를 아직 배우지 않았습니다` };
  const st = state.stations[m.station];
  if(orderId && (!state.orders[orderId] || state.orders[orderId].status!=='waiting' || state.orders[orderId].menuId!==menuId))return {ok:false,reason:'조리할 주문을 확인해 주세요'};
  if(orderId && [...stationJobs(st),...stationItems(st),...state.tray.filter(Boolean)].some(j=>j.orderId===orderId))return {ok:false,reason:'이미 준비 중인 주문입니다'};
  const chk = stockCheck(state, menuId);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  // 루나 언니 친밀도 능력: 조리 시간 단축
  const takeaway=state.visits[state.orders[orderId]?.visitId]?.kind==='takeaway';
  const job = { id: nextId(state, 'job'), menuId, orderId, quality:qualityForTiming(timing,menuId), durationMs: Math.round(m.cookMs * (1 - bondFx(state.affinity).cookSpeed)*(takeaway?.55:1)) };
  const capacity=cafeCapacity(state);
  const slots=['current','parallel',...Array.from({length:Math.max(0,capacity.stationSlots-2)},(_,i)=>'slot'+(i+2))];
  if(capacity.stationSlots>1){for(const slot of slots){if(!st[slot]&&!st[heldKey(slot)]&&!queuedJobs(st).length){startJob(state,m.station,job,slot);return {ok:true,started:true,jobId:job.id};}}}
  if (!st.current && !st.held && !queuedJobs(st).length) { startJob(state, m.station, job); return { ok: true, started: true, jobId:job.id }; }
  // 같은 손님의 두 주문은 같은 설비에서도 별도 슬롯에서 함께 조리한다.
  if(orderId && st.current?.orderId && state.orders[st.current.orderId]?.visitId===state.orders[orderId].visitId && !st.parallel && !st.parallelHeld){startJob(state,m.station,job,'parallel');return {ok:true,started:true,parallel:true,jobId:job.id};}
  if (!st.next) { st.next = job; emit('cookQueued', { station: m.station, menuId }); return { ok: true, queued: true, jobId:job.id }; }
  if(queuedJobs(st).length<capacity.stationSlots){(st.queue??=[]).push(job);return {ok:true,queued:true,jobId:job.id};}
  return { ok: false, reason: `${STATION_NAMES[m.station]} 대기열이 가득 찼습니다 (대기 ${capacity.stationSlots}건)` };
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
    const st=state.stations[sid];
    for(const held of activeSlotNames(st).map(heldKey))if(st[held]&&placeInTray(state,st[held])){emit('heldToTray',{station:sid});st[held]=null;}
    for(const slot of activeSlotNames(st)){
      const job=st[slot];if(!job)continue;
      job.progressMs+=dt;
      if(job.progressMs<job.durationMs)continue;
      const item={id:nextId(state,'item'),menuId:job.menuId,jobId:job.id,orderId:job.orderId||null,quality:job.quality||'good',reservedFor:null};
      const order=state.orders[job.orderId];
      const pickup=order?.status==='waiting'&&state.visits[order.visitId]?.kind==='takeaway'&&state.visits[order.visitId].status==='active';
      st[slot]=null;
      if(state.staff.luna_sis&&!isResting(state,'luna_sis'))changeStress(state,'cook','luna_sis');
      if(pickup){recordServe(state,order,item);emit('takeawayDone',{price:order.price});}
      else if(placeInTray(state,item))emit('cooked',{station:sid,menuId:item.menuId});
      else{st[heldKey(slot)]=item;emit('trayFull',{station:sid,menuId:item.menuId});}
    }
    const cap=cafeCapacity(state).stationSlots,slots=['current',...(cap>1?['parallel']:[]),...Array.from({length:Math.max(0,cap-2)},(_,i)=>'slot'+(i+2))];
    for(const slot of slots)if(!st[slot]&&!st[heldKey(slot)]){const job=st.next||(st.queue||[]).shift();if(job){if(st.next===job)st.next=(st.queue||[]).shift()||null;startJob(state,sid,job,slot);}}
  }
}

// 작업 하나만 취소한다. 이미 시작한 재료는 같은 작업에 한 번만 돌려준다.
export function cancelCook(state,jobId){
 for(const sid of STATION_IDS){
  const st=state.stations[sid],queued=(st.queue||[]).findIndex(j=>j.id===jobId);if(queued>=0){st.queue.splice(queued,1);return {ok:true};}
  const slot=[...activeSlotNames(st),'next'].find(k=>st[k]?.id===jobId);if(!slot)continue;
  const job=st[slot];state.ledger.cookRefunds??={};
  if(state.ledger.consumes[job.id]&&!state.ledger.cookRefunds[job.id]){
   for(const [id,n] of Object.entries(MENUS[job.menuId].ingredients))state.stock[id]=(state.stock[id]||0)+n;
   state.shift.ingredientCost-=ingredientCostOf(job.menuId);state.ledger.cookRefunds[job.id]=true;
  }
  st[slot]=null;emit('cookCancelled',{station:sid,menuId:job.menuId,reason:'선택한 조리 취소'});return {ok:true};
 }
 return {ok:false,reason:'취소할 조리가 없습니다'};
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
export function serve(state, itemId, tableNo, autoHall=false) {
  if(autoHall&&!HALL_ABILITIES.some(key=>hallAutomationOn(state,ABILITIES[key].id)))return {ok:false,reason:'켜진 홀 자동이 없어요'};
  const item = state.tray.find(it => it && it.id === itemId);
  if (!item) return { ok: false, reason: '트레이에 그 음식이 없습니다' };
  if (item.reservedFor) return { ok: false, reason: '이미 운반이 예약된 음식입니다' };
  const visit = visitAt(state, tableNo);
  const order = visit && openOrdersOfVisit(state, visit).find(o => o.status === 'waiting' && o.menuId === item.menuId && (!item.orderId||o.id===item.orderId));
  if (!order) {
    const right = Object.values(state.orders).find(o => o.status === 'waiting' && o.menuId === item.menuId && (!item.orderId||o.id===item.orderId));
    const name = MENUS[item.menuId].name;
    return { ok: false, reason: right ? `${name}은(는) ${right.tableNo}번 테이블 주문입니다. 음식은 트레이에 그대로 있어요.` : `${name}을(를) 기다리는 테이블이 없습니다. 음식은 트레이에 그대로 있어요.`, rightTable: right?.tableNo ?? null };
  }
  order.status = 'assigned';
  order.itemId = item.id;
  item.reservedFor = order.id;
  state.tasks.push({ id: nextId(state, 'task'), type: 'deliver', orderId: order.id, itemId: item.id, tableNo, assignedTo: null, autoHall:!!autoHall });
  emit('serveQueued', { tableNo, menuId: item.menuId });
  return { ok: true };
}

export function findServeTarget(state, item) {
  const o = Object.values(state.orders).find(x => x.status === 'waiting' && state.visits[x.visitId]?.kind!=='takeaway' && x.menuId === item.menuId && (!item.orderId||x.id===item.orderId));
  return o ? o.tableNo : null;
}

function recordServe(state, order, item) {
  if (state.ledger.sales[order.id] != null) return; // 같은 주문을 두 번 매출로 잡지 않는다
  const now = state.shift.elapsedMs;
  const visit = state.visits[order.visitId];
  const levelBefore=cafeProgress(state).level;
  const revenue = Math.floor(order.price * (1+yeoniEffects(state).revenue) * (visit.acceptAt != null ? hostRevenueMultiplier(visit.nominee) : 1)*(visit.motive==='atmosphere'?1+Math.min(.3,atmosphere(state)/200):1));
  state.ledger.sales[order.id] = revenue;
  visit.bill=(visit.bill||0)+revenue;
  state.shift.sales += revenue;
  state.shift.servedCount += 1;
  state.stats.served += 1;
  if(MENUS[order.menuId].reputationBonus)changePopularity(state,MENUS[order.menuId].reputationBonus);

  if (MENUS[order.menuId].special) state.stats.servedSpecial += 1;
  order.status = 'served';
  order.servedAt = now;
  visit.servedTotal += order.price;
  const waitS = (now - order.placedAt) / 1000;
  const quality=item?.quality||'good',rating=foodScore(waitS,ambience(state),quality),food=rating.score;
  Object.assign(order,{quality,qualityDelta:rating.qualityDelta,foodBase:rating.base,foodScore:food,jobId:item?.jobId||null,servedItemId:item?.id||order.itemId||null});
  visit.foodScores.push(food);
  const c = state.customers[visit.customerId];
  if (c) {
    c.action = 'eat'; c.actionUntil = now + TEMP.EAT_MS;
    if (visit.kind === 'regular' && !openOrdersOfVisit(state,visit).length) { c.state = 'eating'; c.eatEndAt = now + TEMP.EAT_MS; }
  }
  // 연이의 계산 동작은 실제 카운터 결제 때 실행한다.
  if(!openOrdersOfVisit(state,visit).length)guestChatter(state,visit,(state.shift.servedCount%7)/7,food>=70?'served':'late');
  emit('served', { tableNo: order.tableNo||null, menuId: order.menuId, price: revenue, quality:qualityOf(quality).label, foodScore:food, qualityDelta:rating.qualityDelta });
  // 마을 행동력은 순을 넘길 때 카페 Lv로 다시 채운다(calendar.maxActionPoints). 영업 중에는 쓸 곳이 없으니 여기서 더하지 않고 알리기만 한다.
  if(cafeProgress(state).level>levelBefore){const next=cafeProgress(state).level;emit('cafeLevelUp',{level:next,apGain:Math.floor((next-1)/3)-Math.floor((levelBefore-1)/3)});};
  if(visit.kind==='takeaway' && c && !openOrdersOfVisit(state,visit).length){state.stats.takeaways=(state.stats.takeaways||0)+1;customerLeave(state,c,'포장 수령');}

}

// ── 정리
export function requestClean(state, tableNo, autoHall=false) {
  if(autoHall&&!HALL_ABILITIES.some(key=>hallAutomationOn(state,ABILITIES[key].id)))return {ok:false,reason:'켜진 홀 자동이 없어요'};
  const t = tableByNo(state, tableNo);
  if (!t) return { ok: false, reason: '없는 테이블입니다' };
  if (t.state !== 'dirty') return { ok: false, reason: t.state === 'cleaning' ? '이미 정리 중입니다' : '정리할 필요가 없습니다' };
  if (t.cleanQueued) return { ok: false, reason: '정리가 이미 예약되어 있습니다' };
  t.cleanQueued = true;
  state.tasks.push({ id: nextId(state, 'task'), type: 'clean', tableNo, assignedTo: null, autoHall:!!autoHall });
  return { ok: true };
}

// ── 직원
export function staffAvailable(state, id) {
  const s = state.staff[id];
  if (!s || (s.job && s.job.kind !== 'home') || s.actionUntil > state.shift.elapsedMs || isResting(state, id)) return false;
  const work = PEOPLE[id]?.work;
  if (work) return work === 'runner'; // 연이(계산)·루나 언니(굽기)는 운반하지 않는다
  return state.people[id]?.activity === 'idle'; // 접대 중인 동료는 서빙·정리에 투입하지 않는다
}

export function staffStatusText(state, id) {
  const s = state.staff[id];
  if (!s) return '';
  const j = s.job;
  if (id === 'yeoni') return j?.kind === 'deliver' ? `${j.tableNo}번 대신 서빙` : j?.kind === 'clean' ? `${j.tableNo}번 대신 정리` : s.action === 'react' ? '계산 중' : '계산대';
  if (isResting(state, id)) return state.dayOff?.[id] ? '오늘은 휴무' : '지쳐서 쉬는 중';
  if (id === 'luna_sis') return j?.kind === 'station' && j.sid ? `${STATION_NAMES[j.sid]} 앞` : '대기';
  if (state.people[id]?.activity === 'hosting') return `${state.people[id].tableNo}번 접대 중`;
  if (!j || j.kind === 'home') return '대기';
  if (j.kind === 'deliver') return j.stage === 'return' ? '음식 되돌리는 중' : `${j.tableNo}번 서빙`;
  if (j.kind === 'clean') return `${j.tableNo}번 정리`;
  if (j.kind === 'host') return `${j.tableNo}번으로 이동`;
  return '';
}

// 한 직원의 배달 묶음(같은 테이블 주문들). 첫 번째가 손에 든 접시(s.carry), 나머지는 s.carryMore 순서와 같다.
export const jobTasks = j => j ? [j.taskId, ...(j.more || [])] : [];
const canTake = (state, task, id) => !task.autoHall || hallAutomationOn(state, id);
function assignTasks(state) {
  for (const task of state.tasks) {
    if (task.assignedTo) continue;
    if (task.type === 'deliver') {
      // 한 테이블에는 한 명만 간다: 이미 그 테이블로 나르는 직원이 있으면 출발 전엔 함께 들고, 출발했으면 돌아올 때까지 기다린다.
      const mate = Object.values(state.staff).find(m => m.job?.kind === 'deliver' && m.job.tableNo === task.tableNo);
      if (mate) { if (mate.job.stage === 'toPickup' && canTake(state, task, mate.id)) { (mate.job.more ??= []).push(task.id); task.assignedTo = mate.id; } continue; }
    }
    const t = tableByNo(state, task.tableNo);
    const target = task.type === 'deliver' ? cafeSpots(state).pickup : t.service;
    let best = null;
    for (const id of Object.keys(state.staff)) {
      if (!staffAvailable(state, id) || (task.autoHall && !hallAutomationOn(state,id))) continue;
      const s = state.staff[id];
      // 가까운 사람이 가되, 이번 영업에 일을 더 많이 맡은 사람은 그만큼 멀리 있는 셈 친다(한 명만 계속 일하지 않게)
      const d = Math.abs(s.x - target.x) + Math.abs(s.y - target.y) + (PEOPLE[id]?.work === 'runner' ? 0 : 0.5) + (s.jobsTaken || 0) * TEMP.STAFF_TURN_TILES;
      if (!best || d < best.d) best = { id, d };
    }
    // 계산 담당 연이는 홀 일을 대신하지 않는다. 주문은 가능한 직원이 맡을 때까지 보존한다.
    if (!best) continue;
    const s = state.staff[best.id];
    task.assignedTo = best.id;
    s.jobsTaken = (s.jobsTaken || 0) + 1;
    if (task.type === 'deliver') {
      const more = state.tasks.filter(o => o !== task && !o.assignedTo && o.type === 'deliver' && o.tableNo === task.tableNo && canTake(state, o, best.id));
      for (const o of more) o.assignedTo = best.id;
      s.job = { kind: 'deliver', taskId: task.id, more: more.map(o => o.id), tableNo: task.tableNo, stage: 'toPickup' };
      setPath(state, s, cafeSpots(state).pickup);
    } else {
      s.job = { kind: 'clean', taskId: task.id, tableNo: task.tableNo, stage: 'toTable' };
      setPath(state, s, t.service);
    }
  }
}

// 한계에 닿은 직원의 일을 다른 사람에게 넘긴다: 든 음식은 트레이(가득하면 그 기계 보관칸)로, 닦던 테이블은 다시 정리 대기로.
function handOver(state, s) {
  const j = s.job, task = state.tasks.find(t => t.id === j.taskId);
  if (j.kind === 'deliver') {
    const items = [s.carry, ...(s.carryMore || [])], kept = [];
    jobTasks(j).forEach((id, i) => {
      const tk = state.tasks.find(t => t.id === id), it = items[i];
      if (!tk) return;
      if (!it) { tk.assignedTo = null; return; } // 아직 집지 않은 주문은 다른 직원에게
      const st = state.stations[MENUS[it.menuId].station], order = state.orders[tk.orderId];
      if (placeInTray(state, it)) tk.assignedTo = null; // 예약은 그대로: 다른 직원이 트레이에서 이어 나른다
      else if (!st.held) { // 트레이가 가득하면 기계 보관칸에 두고 서빙 예약을 푼다(다시 눌러 서빙)
        it.reservedFor = null; st.held = it;
        if (order?.status === 'assigned') { order.status = 'waiting'; order.itemId = null; }
        state.tasks = state.tasks.filter(t => t !== tk);
      } else kept.push([id, it]);
    });
    if (kept.length) { // 둘 곳이 없으면 그 접시만 마저 나르고 쉰다
      s.carry = kept[0][1]; s.carryMore = kept.slice(1).map(k => k[1]); j.taskId = kept[0][0]; j.more = kept.slice(1).map(k => k[0]);
      return;
    }
    s.carry = null; s.carryMore = [];
  }
  if (j.kind === 'clean') {
    const t = tableByNo(state, j.tableNo);
    if (t.state === 'cleaning') { t.state = 'dirty'; t.cleanEndAt = null; }
  }
  if (task) task.assignedTo = null;
  s.action = 'idle';
  sendHome(state, s);
  emit('handOver', { id: s.id, kind: j.kind, tableNo: j.tableNo });
}

function finishTask(state, s) {
  const ids = jobTasks(s.job);
  state.tasks = state.tasks.filter(t => !ids.includes(t.id));
  s.job = null;
}

export function facingTarget(actor,target){
  const dx=target.x+.5-actor.x,dy=target.y+.5-actor.y;
  return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
}
export function sendHome(state, s) {
  s.servicePose=null;
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
  moveAlong(state, s, dt, TEMP.WALK_TILES_PER_S);
  if (isResting(state, s.id)) { // 쉬는 동안 조리는 기계에 그대로 남고, 연이(플레이어)가 이어서 만든다
    if (s.job?.kind !== 'home' && (Math.floor(s.x) !== s.home.x || Math.floor(s.y) !== s.home.y)) sendHome(state, s);
    s.action = s.path.length ? 'walk' : 'idle';
    if (!s.path.length) { s.facing = 'down'; s.job = null; }
    return;
  }
  const recent=id=>Math.max(...runningJobs(state.stations[id]).map(j=>j.startedAt||0));
  const busy = STATION_IDS.filter(id => runningJobs(state.stations[id]).length).sort((a,b)=>recent(b)-recent(a));
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
    if (isResting(state, s.id) && (s.job?.kind === 'deliver' || s.job?.kind === 'clean')) handOver(state, s);
    const arrived = moveAlong(state, s, dt, TEMP.WALK_TILES_PER_S);
    const j = s.job;
    if (s.actionUntil && now >= s.actionUntil) { s.actionUntil = 0; s.servicePose = null; if (s.action === 'serve' || s.action === 'react') s.action = 'idle'; }
    if (!j) {
      if (s.actionUntil > now) continue; // 내려놓기를 마치고 복귀한다.
      if (Math.floor(s.x) !== s.home.x || Math.floor(s.y) !== s.home.y) sendHome(state, s);
      else if (s.id !== 'yeoni') s.facing = 'down';
    } else if (j.kind === 'home') {
      if (arrived) { s.job = null; s.facing = s.id === 'yeoni' ? cafeLayout(state).yeoniFacing : 'down'; } // 제자리에 오면 등 돌리지 않고 홀을 본다
    } else if (j.kind === 'deliver') {
      const task = state.tasks.find(t => t.id === j.taskId);
      const order = task && state.orders[task.orderId];
      if (j.stage === 'toPickup' && arrived) {
        const items = [], kept = [];
        for (const id of jobTasks(j)) {
          const tk = state.tasks.find(t => t.id === id), o = tk && state.orders[tk.orderId], idx = tk ? state.tray.findIndex(it => it && it.id === tk.itemId) : -1;
          if (idx < 0 || !o || o.status !== 'assigned') { state.tasks = state.tasks.filter(t => t !== tk); continue; }
          items.push(state.tray[idx]); state.tray[idx] = null; kept.push(id);
        }
        if (!kept.length) { s.job = null; continue; }
        s.carry = items[0]; s.carryMore = items.slice(1);
        j.taskId = kept[0]; j.more = kept.slice(1);
        j.stage = 'toTable';
        setPath(state, s, tableByNo(state, j.tableNo).service);
      } else if (j.stage === 'toTable' && arrived) {
        const carried = [s.carry, ...(s.carryMore || [])], back = [];
        let served = null;
        jobTasks(j).forEach((id, i) => {
          const tk = state.tasks.find(t => t.id === id), o = tk && state.orders[tk.orderId], it = carried[i];
          if (!it) return;
          if (o && o.status === 'assigned') {
            served ??= it;
            recordServe(state, o, it);
            changeStress(state, 'deliver', s.id);
            state.tasks = state.tasks.filter(t => t !== tk);
          } else back.push([id, it]);
        });
        if (served) {
          s.facing = facingTarget(s, tableByNo(state, j.tableNo).table);
          s.servicePose = {kind:'serve', at:now, until:now+600, tableNo:j.tableNo, menuId:served.menuId};
          s.action = 'serve'; s.actionUntil = now + 600;
        }
        if (back.length) { // 손님이 떠난 접시만 들고 돌아간다
          s.carry = back[0][1]; s.carryMore = back.slice(1).map(b => b[1]); j.taskId = back[0][0]; j.more = back.slice(1).map(b => b[0]);
          j.stage = 'return';
          setPath(state, s, cafeSpots(state).pickup);
        } else { s.carry = null; s.carryMore = []; finishTask(state, s); }
      } else if (j.stage === 'return' && !s.path.length) {
        // 손님이 떠난 음식은 버리지 않고 트레이로 돌려놓는다. 자리가 날 때까지 서빙대 앞에서 기다린다.
        const left = [];
        for (const it of [s.carry, ...(s.carryMore || [])].filter(Boolean)) { it.reservedFor = null; if (!placeInTray(state, it)) left.push(it); }
        s.carry = left[0] || null; s.carryMore = left.slice(1);
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
        s.facing = facingTarget(s, t.table);
        s.servicePose = {kind:'clean',at:now,until:t.cleanEndAt,tableNo:t.no};
      } else if (j.stage === 'cleaning' && now >= t.cleanEndAt) {
        t.state = 'empty'; t.cleanQueued = false; t.cleanEndAt = null;
        s.action = 'idle'; s.servicePose = null;
        emit('cleaned', { tableNo: t.no });
        changeStress(state, 'clean', s.id);
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
        if (s?.job?.kind === 'deliver' && s.job.stage === 'toPickup' && jobTasks(s.job).includes(task.id)) {
          const ids = jobTasks(s.job).filter(id => id !== task.id);
          state.tasks = state.tasks.filter(t => t !== task);
          if (ids.length) { s.job.taskId = ids[0]; s.job.more = ids.slice(1); } else s.job = null;
        }
        // toTable 단계는 도착 시 주문 취소를 보고 음식을 트레이로 되돌린다
      }
    }
    o.status = 'cancelled';
    state.shift.lostOrders += 1;
  }
}

export function customerLeave(state, c, reason) {
  if(['checkout','leaving'].includes(c.state))return;
  const visit = state.visits[c.visitId];
  reviewVisit(state,visit,reason);
  if(visit.reviewScore>=65)guestChatter(state,visit,(state.shift.spawnCount%5)/5,'farewell');
  cancelVisitOrders(state, visit);
  const t = tableByNo(state, c.tableNo);
  const stand=t?.chair&&t.customerId===c.id&&!c.path?.length&&Math.hypot(c.x-t.chair.x-.5,c.y-t.chair.y-.5)<.08&&reason!=='영업 종료';
  if(stand)c.standing={at:state.shift.elapsedMs,until:state.shift.elapsedMs+640,facing:t.facing||c.facing};
  else if(t&&t.customerId===c.id){t.customerId=null;t.state='dirty';}
  visit.status = 'done';
  visit.leaveReason = reason;
  state.cafeGesture={kind:'bow',at:state.shift.elapsedMs};
  c.state = visit.bill>0 && !visit.paid ? 'checkout' : 'leaving';
  c.action = 'walk';c.payAt=null;c.checkoutJoinedAt=state.shift.elapsedMs;
  if(c.standing)c.path=[];else setPath(state,c,c.state==='checkout'?nearestWalkable(getGrid(state),cafeSpots(state).checkout):cafeSpots(state).entrance);
  emit('leave', { tableNo: c.tableNo, reason });
}

// 포장 손님은 계산 줄 칸·통로 예약 칸·입구에서 자리로 가는 길이 아닌, 다른 포장 손님과 겹치지 않는 칸에서 기다린다.
function takeawaySpot(state){
 const grid=getGrid(state),L=cafeLayout(state),sp=L.spots.checkout,k=p=>p.x+','+p.y;
 const walkway=state.tables.flatMap(t=>findPath(grid,L.spots.entrance,t.chair,{goalBlocked:true})||[]).map(([x,y])=>({x,y}));
 const busy=new Set([...(L.queue||[sp]),...(L.reserved||[]).map(([x,y])=>({x,y})),...walkway,...Object.values(state.customers).map(c=>c.takeawaySpot).filter(Boolean)].map(k));
 for(let r=1;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const p={x:sp.x+dx,y:sp.y+dy};
  if(grid.walkable(p.x,p.y)&&!busy.has(k(p))&&findPath(grid,L.spots.entrance,p))return p;
 }
 return nearestWalkable(grid,sp);
}

export function spawnCustomer(state, spec) {
  const entrance=cafeSpots(state).entrance;
  const enterWaiting=cafeActors(state).some(a=>Math.hypot(a.x-entrance.x-.5,a.y-entrance.y-.5)<ACTOR_GAP);
  if (!state.hostbar.open && spec.kind === 'nomination') spec = { ...spec, kind: 'regular', nominee: null };
  const empty = state.tables.filter(t => t.state === 'empty');
  const takeaway=spec.kind==='takeaway';
  if(Object.keys(state.customers).length>=cafeCapacity(state).guestLimit)return null;
  if(takeaway && Object.values(state.visits).filter(v=>v.kind==='takeaway'&&v.status==='active').length>=cafeCapacity(state).takeawayLimit)return null;
  if (!takeaway && !empty.length) return null;
  const t = takeaway?{no:0,chair:takeawaySpot(state)}:pick(state.rng, empty);
  const profile = spec.profileId ? PDF.PROFILES.find(p => p.id === spec.profileId) : pick(state.rng, PDF.PROFILES);
  const wealthId = CUSTOMER_WEALTH[spec.wealthId] && (state.meta.devData||wealthEligible(state,spec.wealthId)) ? spec.wealthId : customerWealth(state,nextRandom(state.rng));
  const cid = nextId(state, 'customer');
  const vid = nextId(state, 'visit');
  state.shift.spawnCount += 1;
  const c = {
    id: cid, visitId: vid, tableNo: t.no, wealthId, label: `${takeaway?'포장 · ':''}${CUSTOMER_WEALTH[wealthId].name} ${state.shift.spawnCount}`,
    x: cafeSpots(state).entrance.x + 0.5, y: cafeSpots(state).entrance.y + 0.5, path: [], moving: false, facing: 'up',
    enterWaiting, state: 'entering', action: 'walk', actionUntil: 0, orderAt: null, eatEndAt: null,
    hue: Math.floor(nextRandom(state.rng) * 360),
  };
  c.nominationGuest=spec.kind==='nomination';
  if(takeaway)c.takeawaySpot={...t.chair};
  c.look = customerLook(c);
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
  if(!state.cafeGesture||state.shift.elapsedMs-state.cafeGesture.at>1100)state.cafeGesture={kind:'welcome',at:state.shift.elapsedMs};
  emit('enter', { tableNo: t.no, kind: spec.kind });
  return c;
}

// 계산은 도착 순서대로 한 명씩. 줄의 위치만 바꾸고 손님을 순간 이동시키지 않는다.
export function checkoutQueue(state){
 return Object.values(state.customers).filter(c=>c.state==='checkout').sort((a,b)=>(a.checkoutJoinedAt??0)-(b.checkoutJoinedAt??0)||a.id.localeCompare(b.id,undefined,{numeric:true}));
}
function arrangeCheckout(state){
 const queue=checkoutQueue(state),grid=getGrid(state),route=findPath(grid,cafeSpots(state).checkout,cafeSpots(state).entrance)||[];
 const slots=cafeLayout(state).queue||[cafeSpots(state).checkout,...route.filter((_,i)=>i%2===1).map(([x,y])=>({x,y}))];
 queue.forEach((c,i)=>{
  const ahead=queue[i-1];
  if(ahead&&(!ahead.checkoutTarget||Math.hypot(ahead.x-ahead.checkoutTarget.x-.5,ahead.y-ahead.checkoutTarget.y-.5)>.1)){c.checkoutWaiting=true;c.path=[];delete c.checkoutTarget;return;}
  if(cafeLayout(state).queue&&i>=slots.length){c.checkoutWaiting=true;c.path=[];delete c.checkoutTarget;return;}
  if(c.checkoutWaiting){c.checkoutWaiting=false;if(c.standing){c.standing.at=state.shift.elapsedMs;c.standing.until=state.shift.elapsedMs+640;}}
  if(c.standing&&state.shift.elapsedMs<c.standing.until)return;const goal=slots[Math.min(i,slots.length-1)];
  if(c.checkoutTarget?.x!==goal.x||c.checkoutTarget?.y!==goal.y){c.checkoutTarget={...goal};setPath(state,c,goal);c.payAt=null;}
 });
 return queue[0]?.id;
}
export function stepCustomers(state, dt, hooks) {
  const now = state.shift.elapsedMs, payingId=arrangeCheckout(state);
  for (const c of Object.values(state.customers)) {
    if(c.enterWaiting){const en=cafeSpots(state).entrance;if(cafeActors(state).some(a=>a!==c&&Math.hypot(a.x-en.x-.5,a.y-en.y-.5)<ACTOR_GAP))continue;c.enterWaiting=false;}
    if(c.checkoutWaiting)continue;
    if(c.standing){
      if(now<c.standing.until)continue;
      const table=tableByNo(state,c.tableNo);if(table?.customerId===c.id){table.customerId=null;table.state='dirty';}
      c.standing=null;if(!c.path?.length)setPath(state,c,c.state==='checkout'?cafeSpots(state).checkout:cafeSpots(state).entrance);
    }
    const arrived = moveAlong(state, c, dt, TEMP.CUSTOMER_TILES_PER_S);
    const visit = state.visits[c.visitId];
    if (c.actionUntil && now >= c.actionUntil) { c.actionUntil = 0; if (c.action === 'eat' || c.action === 'react') c.action = 'idle'; }
    switch (c.state) {
      case 'entering':
        if (arrived) {
          c.action = 'idle';c.sitAt=now;
          c.facing = tableByNo(state,c.tableNo)?.facing||'up';
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
          const extraChance={frugal:.12,ordinary:.3,generous:.6,tycoon:.85}[visit.wealthId]||0;
          if(nextRandom(state.rng)<extraChance){const extra=chooseMenu(state,remainingShift(state),visit);if(extra)placeOrder(state,visit,extra);if(visit.wealthId==='tycoon'&&nextRandom(state.rng)<.4){const third=chooseMenu(state,remainingShift(state),visit);if(third)placeOrder(state,visit,third);}}
          c.state = 'waiting_food';
        }
        break;
      case 'waiting_food': {
        const open = openOrdersOfVisit(state, visit);
        const satisfaction=waitingSatisfaction(state,visit);
        if(satisfaction<55 && !visit.lateSpoken){visit.lateSpoken=true;guestChatter(state,visit,(state.shift.spawnCount%4)/4,'late');}
        else if(satisfaction<80 && !visit.waitSpoken){visit.waitSpoken=true;guestChatter(state,visit,(state.shift.spawnCount%4)/4,'waiting');}
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
        if(arrived||!c.path.length){
          c.action='idle';c.facing=cafeLayout(state).customerFacing;
          if(c.id!==payingId)break;
          const atCounter=Math.hypot(c.x-cafeSpots(state).checkout.x-.5,c.y-cafeSpots(state).checkout.y-.5)<.08;
          if(!atCounter)break;
          if(c.payAt==null){c.payAt=now+1040;state.cafeGesture={kind:'cashier',at:now,customerId:c.id};}
          if(now>=c.payAt){checkout(state,visit);c.state='leaving';c.action='walk';setPath(state,c,cafeSpots(state).entrance);}
        }
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
 const yeoni=state.staff.yeoni;if(yeoni){yeoni.action='react';yeoni.actionUntil=state.shift.elapsedMs+650;yeoni.facing=cafeLayout(state).yeoniFacing;}
 state.cafeGesture={kind:'bow',at:state.shift.elapsedMs};
 if(amount)emit('paidAtCounter',{amount});return true;
}

// 이전 영업 저장의 계산 동선만 새 고정 설비 위치로 연결한다.
export function migrateCounter(state){
 const version=state.interior?.checkoutLayout==='entrance-left'?4:state.interior?.checkoutLayout==='entrance'?3:2;
 if(state.cafeLayoutVersion===version)return;
 if(state.mode==='shift'&&state.staff?.yeoni){const s=state.staff.yeoni;s.home={...cafeSpots(state).yeoniHome};s.x=s.home.x+.5;s.y=s.home.y+.5;s.path=[];s.facing=cafeLayout(state).yeoniFacing;
  for(const c of Object.values(state.customers||{})){if(c.state==='checkout'){delete c.checkoutTarget;c.payAt=null;setPath(state,c,nearestWalkable(getGrid(state),cafeSpots(state).checkout));}else if(state.visits[c.visitId]?.kind==='takeaway'&&c.state==='entering'){c.takeawaySpot=null;c.takeawaySpot=takeawaySpot(state);setPath(state,c,c.takeawaySpot);}}
 }
 state.cafeLayoutVersion=version;
}
