// 조합대: 재료 1~3개를 골라 섞는다. 재료 묶음이 레시피와 정확히 같으면
//  - 아직 모르는 레시피 → 발견(배움). 재료는 쓰지 않는다(시험 삼아 섞어 보는 것).
//  - 아는 레시피 + 영업 중 → 그 메뉴를 조리(cafe.cook 과 같은 규칙, 재료는 조리 시작 때 사용).
//  - 아는 레시피 + 영업 전 → 이미 안다고 알려 준다.
// 맞지 않으면 "몇 가지가 겹치는지" 힌트를 준다(마스터마인드식). 무작위는 쓰지 않는다.

import { MENUS, MENU_ORDER, INGREDIENTS } from '../data/menus.js';
import { cook } from './cafe.js';
import { emit } from './state.js';

export const COMBO_MAX = 3;

const countOf = list => {
  const c = {};
  for (const id of list) c[id] = (c[id] || 0) + 1;
  return c;
};
const sizeOf = obj => Object.values(obj).reduce((a, b) => a + b, 0);
const sameBag = (a, b) => {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => a[k] === b[k]);
};

export function findRecipe(ingredients) {
  const bag = countOf(ingredients);
  return MENU_ORDER.find(id => sameBag(MENUS[id].ingredients, bag)) || null;
}

// 모르는 레시피 중 가장 많이 겹치는 것을 기준으로 힌트(모두 알면 전체 기준)
export function comboHint(state, ingredients) {
  const bag = countOf(ingredients), k = ingredients.length;
  let pool = MENU_ORDER.filter(id => !state.learned[id]);
  if (!pool.length) pool = MENU_ORDER.slice();
  let best = { overlap: -1, size: 0 };
  for (const id of pool) {
    const ing = MENUS[id].ingredients, size = sizeOf(ing);
    let overlap = 0;
    for (const [i, n] of Object.entries(bag)) overlap += Math.min(n, ing[i] || 0);
    if (overlap > best.overlap || (overlap === best.overlap && size === k && best.size !== k)) best = { overlap, size };
  }
  let text;
  if (best.overlap <= 0) text = '이 재료들로는 아무 레시피도 떠오르지 않아요';
  else {
    text = `${best.overlap}가지는 어떤 레시피에 들어가요`;
    if (best.size > k) text += ' · 재료가 모자라요';
    else if (best.size < k) text += ' · 재료가 너무 많아요';
    else text += ' · 하나를 바꿔 보세요';
  }
  return { overlap: Math.max(0, best.overlap), need: best.size, text };
}

export function tryCombo(state, ingredients) {
  if (state.mode !== 'prep' && state.mode !== 'shift') return { ok: false, reason: '가게에 있을 때만 조합할 수 있습니다' };
  if (!Array.isArray(ingredients) || ingredients.length < 1 || ingredients.length > COMBO_MAX) return { ok: false, reason: `재료를 1~${COMBO_MAX}개 골라 주세요` };
  if (ingredients.some(id => !INGREDIENTS[id])) return { ok: false, reason: '없는 재료입니다' };
  for (const [id, n] of Object.entries(countOf(ingredients))) {
    const have = state.stock[id] || 0;
    if (have < n) return { ok: false, reason: `재료 부족: ${INGREDIENTS[id].name} ${have}/${n}` };
  }
  const menuId = findRecipe(ingredients);
  if (!menuId) {
    const hint = comboHint(state, ingredients);
    emit('comboMiss', { hint: hint.text });
    return { ok: true, match: false, hint };
  }
  const m = MENUS[menuId];
  if (!state.learned[menuId]) {
    state.learned[menuId] = true;
    emit('discovered', { menuId, name: m.name });
    return { ok: true, match: true, discovered: true, menuId };
  }
  if (state.mode === 'shift') {
    const r = cook(state, menuId);
    return r.ok ? { ...r, match: true, cooked: true, menuId } : r;
  }
  return { ok: true, match: true, known: true, menuId };
}
