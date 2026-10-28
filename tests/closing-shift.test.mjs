// 마감 30초: 새 손님은 들어오지 않고, 끝까지 남은 손님의 주문은 영업 종료 때 한 번만 매출로 잡힌다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { tick } from '../src/game/engine.js';
import { shiftDuration } from '../src/game/state.js';
import { placeOrder } from '../src/game/cafe.js';
import { closingChore } from '../src/render/staff-motion.js';
import { quietShift, seat } from './helpers.mjs';

test('끝나기 30초 전부터는 손님이 들어오지 않고 마감 준비를 한 번만 알린다', () => {
  const s = quietShift();
  s.shift.elapsedMs = shiftDuration(s) - 60000; s.shift.nextSpawnAt = s.shift.elapsedMs; // 테스트 준비: 끝나기 1분 전 입장 예정
  tick(s, 200);
  assert.equal(Object.keys(s.customers).length, 1, '마감 준비 전까지는 손님이 온다');
  s.shift.elapsedMs = shiftDuration(s) - TEMP.CLOSING_MS - 1000; s.shift.nextSpawnAt = s.shift.elapsedMs + 2000; // 테스트 준비: 마감 직전에 입장 예정
  const before = Object.keys(s.customers).length;
  const ev = [...tick(s, 1000), ...tick(s, 1000), ...tick(s, 20000)];
  assert.equal(Object.keys(s.customers).length, before, '마감 준비 뒤에는 새 손님이 없다');
  assert.equal(ev.filter(e => e.type === 'closingStart').length, 1);
});

test('영업이 끝날 때 남은 주문은 계산서와 매출에 한 번만 들어가고 버린 음식으로 세지 않는다', () => {
  const s = quietShift();
  const g = seat(s, { kind: 'regular' }), v = s.visits[g.vid];
  s.shift.elapsedMs = shiftDuration(s) - 2000; // 테스트 준비: 마감 2초 전 주문
  s.customers[g.cid].state = 'waiting_food';
  const cooked = placeOrder(s, v, 'fortune_latte'), raw = placeOrder(s, v, 'fortune_latte');
  s.tray[0] = { id: 'ready-one', menuId: cooked.menuId, orderId: cooked.id, reservedFor: cooked.id }; // 테스트 준비: 다 만든 한 잔
  s.tray[1] = { id: 'stray', menuId: 'fortune_latte' }; // 주인 없는 한 잔은 그대로 버린 음식
  const salesBefore = s.shift.sales, shiftId = s.shift.id;
  tick(s, 3000);
  assert.notEqual(s.mode, 'shift');
  const set = s.ledger.settlements[shiftId];
  for (const o of [cooked, raw]) { assert.ok(s.ledger.sales[o.id] > 0); assert.equal(s.orders[o.id]?.status ?? 'served', 'served'); }
  const added = s.ledger.sales[cooked.id] + s.ledger.sales[raw.id];
  assert.equal(set.sales, salesBefore + added);
  assert.equal(s.ledger.checkouts[v.id], added, '손님 계산서로 한 번 결제');
  assert.equal(set.wasted, 1);
  assert.equal(set.lostOrders, 0);
});

test('마감 30초 동안 손이 빈 직원만 정리 시트를 쓴다', () => {
  const D = 600000, C = TEMP.CLOSING_MS, idle = { action: 'idle', path: [], job: null, carry: null };
  assert.equal(closingChore('luna', idle, D - C - 1, D, C), null);
  assert.deepEqual(closingChore('luna_sis', idle, D - C + 1000, D, C, true), { key: 'luna_sis_close', state: 'chore', frame: 0 });
  assert.equal(closingChore('neo', idle, D - 14000, D, C).state, 'tidy');
  assert.equal(closingChore('neo', idle, D - 3000, D, C).state, 'done');
  assert.equal(closingChore('luna', { ...idle, action: 'walk', path: [{ x: 1, y: 1 }] }, D - 5000, D, C), null);
  assert.equal(closingChore('luna', { ...idle, job: { kind: 'deliver' } }, D - 5000, D, C), null);
  assert.equal(closingChore('yeoni', idle, D - 5000, D, C), null, '연이는 계산만 한다');
});
