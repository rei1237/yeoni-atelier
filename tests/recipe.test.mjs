// 조합대: 발견(재료 안 씀), 힌트, 영업 중 조리, 저장 유지, 모르는 메뉴는 주문되지 않음
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { chooseMenu } from '../src/game/cafe.js';
import { MENUS } from '../src/data/menus.js';
import { serialize, deserialize } from '../src/core/save.js';
import { quietShift } from './helpers.mjs';

const mix = (s, ingredients) => dispatch(s, { type: 'recipe.try', ingredients });

test('맞는 조합이면 레시피를 발견하고 재료는 줄지 않는다, 두 번째는 이미 앎', () => {
  const s = createGame();
  assert.equal(s.learned.moon_milk_tea, undefined);
  const before = { ...s.stock };
  const r = mix(s, ['sugar', 'tea', 'milk']); // 순서는 상관없다
  assert.ok(r.ok && r.discovered && r.menuId === 'moon_milk_tea');
  assert.ok(r.events.some(e => e.type === 'discovered' && e.menuId === 'moon_milk_tea'));
  assert.equal(s.learned.moon_milk_tea, true);
  assert.deepEqual(s.stock, before);
  const again = mix(s, ['tea', 'milk', 'sugar']);
  assert.ok(again.ok && again.known && !again.discovered);
  assert.deepEqual(s.stock, before);
});

test('맞지 않으면 힌트만 주고 상태는 그대로, 잘못된 입력은 거절', () => {
  const s = createGame();
  const learned = { ...s.learned }, stock = { ...s.stock };
  const r = mix(s, ['tea', 'milk']);
  assert.ok(r.ok && r.match === false);
  assert.equal(r.hint.overlap, 2);
  assert.match(r.hint.text, /모자라요/);
  assert.deepEqual(s.learned, learned);
  assert.deepEqual(s.stock, stock);
  assert.equal(mix(s, []).ok, false);
  assert.equal(mix(s, ['tea', 'milk', 'sugar', 'egg']).ok, false, '4개는 안 됨');
  assert.equal(mix(s, ['gold']).ok, false, '없는 재료');
  s.stock.tea = 0;
  assert.equal(mix(s, ['tea', 'milk', 'sugar']).ok, false, '재료가 없으면 시험도 못 한다');
  assert.equal(s.learned.moon_milk_tea, undefined);
});

test('영업 중 아는 레시피를 섞으면 조리가 시작되고 그때 재료를 쓴다', () => {
  const s = quietShift();
  const bean = s.stock.bean, milk = s.stock.milk;
  const r = mix(s, ['milk', 'bean']);
  assert.ok(r.ok && r.cooked && r.menuId === 'fortune_latte', r.reason);
  assert.equal(s.stations.drink.current.menuId, 'fortune_latte');
  assert.equal(s.stock.bean, bean - 1);
  assert.equal(s.stock.milk, milk - 1);
  // 영업 중 발견은 조리하지 않는다(재료 그대로)
  const flour = s.stock.flour;
  const d = mix(s, ['flour', 'egg', 'sugar']);
  assert.ok(d.ok && d.discovered && d.menuId === 'stardust_castella');
  assert.equal(s.stock.flour, flour);
  assert.equal(s.stations.oven.current, null);
});

test('발견한 레시피는 저장에 남고, 발견 전에는 손님이 주문하지 않는다', () => {
  const s = createGame();
  const comboIds = Object.values(MENUS).filter(m => m.combo).map(m => m.id);
  for (let i = 0; i < 300; i++) assert.ok(!comboIds.includes(chooseMenu(s, 1e9)));
  assert.ok(mix(s, ['bean', 'milk', 'sugar']).discovered);
  const r = deserialize(serialize(s));
  assert.ok(r.ok, r.reason);
  assert.equal(r.state.learned.oink_cream_latte, true);
  let seen = false;
  for (let i = 0; i < 300 && !seen; i++) seen = chooseMenu(r.state, 1e9) === 'oink_cream_latte';
  assert.ok(seen, '발견 뒤에는 주문 후보가 된다');
});
