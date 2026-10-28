import {cafeCapacity} from './capacity.js';
import {areaAvailable} from './branches.js';
// 마을 나가기(영업 준비 중에만): 청토끼 금융 센터(월정석 환전) · 윤달의 무기 공방(영냥이 장비) · 무성의 가구·꽃 상점(테이블·구역·장식).
// 모카 식재료점 구매는 economy.buy 를 그대로 쓴다. 가격·환율은 모두 임시값(balance.temp.js, data/gear.js).
// 장소 이름과 역할(청토끼 금융 센터, 윤달 무기 공방, 무성 가구·꽃 상점)은 게임 오리지널 설정이다.

import {recordYunTrade} from './yun-quest.js';
import { TEMP } from '../config/balance.temp.js';
import { RULES } from '../config/rules.js';
import { GEAR } from '../data/gear.js';
import { FURNITURE, GRID, AREAS } from '../data/layout.js';
import { validateLayout, buildGrid } from './space.js';
import { emit, nextId } from './state.js';
import { bondFx } from '../data/bonds.js';
import { placeLock } from './unlocks.js';

export function townCheck(state) {
  if (state.mode === 'shift') return { ok: false, reason: '영업 중에는 가게를 비울 수 없습니다 (재료는 모카 긴급 배달로 살 수 있어요)' };
  if (state.mode === 'hunt') return { ok: false, reason: '사냥을 마친 뒤 마을에 나갈 수 있습니다' };
  if (state.mode !== 'prep') return { ok: false, reason: '영업 준비 중에만 마을에 나갈 수 있습니다' };
  return { ok: true };
}

// 가게를 처음 찾은 기록(첫 방문 이야기 한 번). 지급하는 보상은 없고 행동력도 쓰지 않는다.
export const VISIT_PLACES = Object.freeze(['moka', 'luna', 'finance', 'gear', 'expand']);
export function markVisit(state, place) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  if (!VISIT_PLACES.includes(place)) return { ok: false, reason: '없는 장소입니다' };
  const lock = placeLock(state, place); if (lock) return { ok: false, reason: lock };
  const key = `visit:${place}`;
  if (state.ledger.story[key]) return { ok: true, duplicate: true };
  state.ledger.story[key] = true;
  return { ok: true };
}

// ── 청토끼 금융 센터: 월정석 → 골드
export function exchange(state, qty) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const n = Math.floor(qty);
  if (!(n > 0)) return { ok: false, reason: '환전할 개수를 골라 주세요' };
  if ((state.moonstone || 0) < n) return { ok: false, reason: `월정석이 부족합니다 (보유 ${state.moonstone || 0}개)` };
  // 루나 언니 ♥3: 저울 손질로 환전 우대
  const gold = Math.floor(n * TEMP.MOONSTONE_GOLD * (1 + bondFx(state).moonRate));
  state.moonstone -= n;
  state.gold += gold;
  state.stats.moonstonesExchanged += n;
  emit('exchanged', { qty: n, gold });
  return { ok: true, gold };
}

// ── 윤달의 무기 공방
export function buyGear(state, id) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const lock = placeLock(state, 'gear'); if (lock) return { ok: false, reason: lock };
  const g = GEAR[id];
  if (!g) return { ok: false, reason: '없는 장비입니다' };
  if (state.gear.owned.includes(id)) return { ok: false, reason: '이미 가진 장비입니다' };
  if (g.cost.gold && state.gold < g.cost.gold) return { ok: false, reason: `골드가 부족합니다 (${g.cost.gold}G 필요)` };
  if (g.cost.moonstone && (state.moonstone || 0) < g.cost.moonstone) return { ok: false, reason: `월정석이 부족합니다 (${g.cost.moonstone}개 필요)` };
  if (g.cost.gold) state.gold -= g.cost.gold;
  if (g.cost.moonstone) state.moonstone -= g.cost.moonstone;
  recordYunTrade(state,g.cost.gold||0,g.cost.moonstone||0);
  state.gear.owned.push(id);
  if (!state.gear.equipped[g.slot]) state.gear.equipped[g.slot] = id; // 빈 칸이면 바로 장착
  emit('gearBought', { id, name: g.name });
  return { ok: true };
}

// id 가 null 이면 그 칸을 비운다. 사냥 중에는 바꿀 수 없다(출발할 때 효과를 고정한다).
export function equipGear(state, slot, id) {
  if (state.mode === 'hunt') return { ok: false, reason: '사냥 중에는 장비를 바꿀 수 없습니다' };
  if (!(slot in state.gear.equipped)) return { ok: false, reason: '없는 장비 칸입니다' };
  if (id != null) {
    if (!state.gear.owned.includes(id)) return { ok: false, reason: '가지고 있지 않은 장비입니다' };
    if (GEAR[id].slot !== slot) return { ok: false, reason: '그 칸에 낄 수 없는 장비입니다' };
  }
  state.gear.equipped[slot] = id;
  return { ok: true };
}

// ── 가게 확장(공방): 테이블 세트는 들일수록 비싸지고, 자리가 모자라면 잠긴 구역을 증축한다. 가격은 모두 임시.
export const tableCount = state => state.interior.furniture.filter(f => FURNITURE[f.defId].table).length;

export function tablePrice(count) {
  return Math.round(TEMP.TABLE_PRICE_BASE * TEMP.TABLE_PRICE_GROWTH ** Math.max(0, Math.min(count,12) - RULES.TABLE_COUNT) * (1+Math.max(0,count-12)*.12) / 100) * 100;
}

export function nextExpansion(state) {
  const n = tableCount(state);
  if (n >= cafeCapacity(state).tableLimit) return null;
  const tableNo = Math.max(0, ...state.interior.furniture.filter(f => FURNITURE[f.defId].table).map(f => f.tableNo)) + 1;
  return { id: `table${tableNo}`, tableNo, label: `${tableNo}번 테이블 (의자 별도)`, cost: tablePrice(n) };
}

// 다음 증축 가격: 연 구역 수에 따라 오른다
export function areaPrice(state) {
  const n=(state.interior.areas||[]).length;return n<AREAS.length?(TEMP.AREA_COSTS[n]??Math.round(TEMP.AREA_COSTS.at(-1)*1.5**(n-TEMP.AREA_COSTS.length+1))):null;
}

function expandCheck(state) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const lock = placeLock(state, 'expand'); if (lock) return { ok:false, reason:lock };
  return { ok: true }; // 꾸미기 초안 중에도 산다. 구매는 즉시 확정되고 초안에도 함께 들어간다.
}

export function buyExpansion(state) {
  const chk = expandCheck(state);
  if (!chk.ok) return chk;
  const ex = nextExpansion(state);
  if (!ex) return { ok: false, reason: `테이블은 ${cafeCapacity(state).tableLimit}개까지 들일 수 있습니다` };
  if (state.gold < ex.cost) return { ok: false, reason: `골드가 부족합니다 (${ex.cost}G 필요)` };
  const furniture = state.interior.furniture;
  const areas = state.interior.areas || [];
  const piece = { uid: ex.id, defId: 'table', x: null, y: null, rot: 0, tableNo: ex.tableNo };
  state.gold -= ex.cost;
  furniture.push(piece);
  if (state.interior.draft) state.interior.draft.furniture.push({ ...piece });
  state.stats.expansions += 1;
  emit('expanded', { tableNo: ex.tableNo, label: ex.label, uid: piece.uid });
  return { ok: true, tableNo: ex.tableNo, uid: piece.uid };
}

// 공방 증축: 잠긴 구역을 연다(가구는 인테리어·테이블 들이기로 채운다)
export function buyArea(state, id) {
  const chk = expandCheck(state);
  if (!chk.ok) return chk;
  const area = AREAS.find(a => a.id === id);
  if (!area) return { ok: false, reason: '없는 구역입니다' };
  if(!areaAvailable(state,area))return {ok:false,reason:'이 지점의 최대 면적이에요. 다음 지점을 확인해 주세요'};
  if(area.branchMin && !(state.interior.areas||[]).includes(area.branchMin===2?'garden_wing':'branch_annex_'+(area.branchMin-2)))return {ok:false,reason:'연결된 앞 구역부터 증축해 주세요'};
  const areas = state.interior.areas || (state.interior.areas = []);
  if (areas.includes(id)) return { ok: false, reason: '이미 연 구역입니다' };
  const cost = areaPrice(state);
  if (cost == null) return { ok: false, reason: '더 넓힐 구역이 없습니다' };
  if (state.gold < cost) return { ok: false, reason: `골드가 부족합니다 (${cost}G 필요)` };
  state.gold -= cost;
  areas.push(id);
  state.stats.areasOpened = (state.stats.areasOpened || 0) + 1;
  emit('areaOpened', { id, name: area.name, cost });
  return { ok: true, cost };
}

// 장식 들이기: 보관함으로 들어온다(인테리어에서 놓으면 분위기 보너스)
export function decorPrice(state,defId){const d=FURNITURE[defId],base=TEMP.DECOR_PRICES[defId];return d?.table?Math.max(base||0,tablePrice(tableCount(state))*d.area):base;}
export function buyDecor(state, defId) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const lock = placeLock(state, 'expand'); if (lock) return { ok:false, reason:lock };
  const price = decorPrice(state,defId);
  if (!price || !FURNITURE[defId]) return { ok: false, reason: '팔지 않는 장식입니다' };
  if (state.gold < price) return { ok: false, reason: `골드가 부족합니다 (${price}G 필요)` };
  const table=FURNITURE[defId].table,ex=table?nextExpansion(state):null;if(table&&!ex)return {ok:false,reason:'이 지점의 테이블 수용 한도예요'};
  state.gold -= price;
  const bought={uid:nextId(state,'decor'),defId,x:null,y:null,rot:0,...(table?{tableNo:ex.tableNo}:{})};
  state.interior.furniture.push(bought);if(state.interior.draft)state.interior.draft.furniture.push({...bought});
  if(table)state.stats.expansions+=1;
  emit('decorBought', { defId, name: FURNITURE[defId].name, uid: bought.uid });
  return { ok: true, uid: bought.uid };
}
