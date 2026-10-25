// 마을 나가기(영업 준비 중에만): 루나의 저울(월정석 환전) · 무인 장비 좌판(영냥이 장비) · 가게 확장(테이블·장식 들이기).
// 모카 식재료점 구매는 economy.buy 를 그대로 쓴다. 가격·환율은 모두 임시값(balance.temp.js, data/gear.js).
// 장소 이름과 역할(루나의 저울, 무인 좌판)은 게임 오리지널 설정이다.

import { TEMP } from '../config/balance.temp.js';
import { GEAR } from '../data/gear.js';
import { FURNITURE } from '../data/layout.js';
import { validateLayout } from './space.js';
import { emit, nextId } from './state.js';

export function townCheck(state) {
  if (state.mode === 'shift') return { ok: false, reason: '영업 중에는 가게를 비울 수 없습니다 (재료는 모카 긴급 배달로 살 수 있어요)' };
  if (state.mode === 'hunt') return { ok: false, reason: '사냥을 마친 뒤 마을에 나갈 수 있습니다' };
  if (state.mode !== 'prep') return { ok: false, reason: '영업 준비 중에만 마을에 나갈 수 있습니다' };
  return { ok: true };
}

// ── 루나의 저울: 월정석 → 골드
export function exchange(state, qty) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const n = Math.floor(qty);
  if (!(n > 0)) return { ok: false, reason: '환전할 개수를 골라 주세요' };
  if ((state.moonstone || 0) < n) return { ok: false, reason: `월정석이 부족합니다 (보유 ${state.moonstone || 0}개)` };
  const gold = n * TEMP.MOONSTONE_GOLD;
  state.moonstone -= n;
  state.gold += gold;
  state.stats.moonstonesExchanged += n;
  emit('exchanged', { qty: n, gold });
  return { ok: true, gold };
}

// ── 무인 장비 좌판
export function buyGear(state, id) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const g = GEAR[id];
  if (!g) return { ok: false, reason: '없는 장비입니다' };
  if (state.gear.owned.includes(id)) return { ok: false, reason: '이미 가진 장비입니다' };
  if (g.cost.gold && state.gold < g.cost.gold) return { ok: false, reason: `골드가 부족합니다 (${g.cost.gold}G 필요)` };
  if (g.cost.moonstone && (state.moonstone || 0) < g.cost.moonstone) return { ok: false, reason: `월정석이 부족합니다 (${g.cost.moonstone}개 필요)` };
  if (g.cost.gold) state.gold -= g.cost.gold;
  if (g.cost.moonstone) state.moonstone -= g.cost.moonstone;
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

// ── 가게 확장
export function nextExpansion(state) {
  const have = new Set(state.interior.furniture.map(f => f.uid));
  return TEMP.EXPANSION.find(e => !have.has(e.id)) || null;
}

function expandCheck(state) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  if (state.interior.draft) return { ok: false, reason: '인테리어 편집을 먼저 마쳐 주세요' };
  return { ok: true };
}

export function buyExpansion(state) {
  const chk = expandCheck(state);
  if (!chk.ok) return chk;
  const ex = nextExpansion(state);
  if (!ex) return { ok: false, reason: '지금 들일 수 있는 테이블을 모두 들였습니다' };
  if (state.gold < ex.cost) return { ok: false, reason: `골드가 부족합니다 (${ex.cost}G 필요)` };
  const furniture = state.interior.furniture;
  const tableNo = Math.max(0, ...furniture.filter(f => FURNITURE[f.defId].table).map(f => f.tableNo)) + 1;
  const piece = { uid: ex.id, defId: 'table_set', x: null, y: null, rot: 0, tableNo };
  const list = [...furniture, piece];
  // 테이블은 보관할 수 없으니 문제없는 첫 빈자리에 바로 놓는다. 자리가 없으면 돈을 받지 않는다.
  let spot = null;
  for (let y = 2; y <= 10 && !spot; y++) {
    for (let x = 0; x <= 8 && !spot; x++) {
      piece.x = x; piece.y = y;
      if (validateLayout(list).ok) spot = { x, y };
    }
  }
  if (!spot) return { ok: false, reason: '테이블을 놓을 빈자리가 없습니다. 인테리어에서 장식을 보관해 자리를 만들어 주세요' };
  state.gold -= ex.cost;
  furniture.push({ ...piece, ...spot });
  state.stats.expansions += 1;
  emit('expanded', { tableNo, label: ex.label });
  return { ok: true, tableNo };
}

// 장식 들이기: 보관함으로 들어온다(인테리어에서 놓으면 분위기 보너스)
export function buyDecor(state, defId) {
  const chk = expandCheck(state);
  if (!chk.ok) return chk;
  const price = TEMP.DECOR_PRICES[defId];
  if (!price || !FURNITURE[defId]) return { ok: false, reason: '팔지 않는 장식입니다' };
  if (state.gold < price) return { ok: false, reason: `골드가 부족합니다 (${price}G 필요)` };
  state.gold -= price;
  state.interior.furniture.push({ uid: nextId(state, 'decor'), defId, x: null, y: null, rot: 0 });
  emit('decorBought', { defId, name: FURNITURE[defId].name });
  return { ok: true };
}
