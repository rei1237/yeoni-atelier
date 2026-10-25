import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, tick } from '../src/game/engine.js';
import { quietShift, seat } from './helpers.mjs';
import { MENUS } from '../src/data/menus.js';

test('수동은 주문을 기다리며, 한 번 조리·한 번 서빙 후 이동과 정리만 보조한다', () => {
  const s = quietShift();
  const guest = seat(s, { kind: 'regular' });
  while (!s.visits[guest.vid].orderIds.length) tick(s, 100);
  const order = s.orders[s.visits[guest.vid].orderIds[0]];
  tick(s, 1000);
  assert.equal(s.stations[MENUS[order.menuId].station].current, null);
  assert.ok(dispatch(s, { type: 'order.quick', orderId: order.id }).ok);
  const stock = structuredClone(s.stock);
  assert.equal(dispatch(s, { type: 'order.quick', orderId: order.id }).ok, false);
  assert.deepEqual(s.stock, stock);
  tick(s, MENUS[order.menuId].cookMs + 200);
  assert.equal(order.status, 'waiting'); assert.ok(s.tray.some(Boolean));
  assert.ok(dispatch(s, { type: 'order.quick', orderId: order.id }).ok);
  assert.equal(dispatch(s, { type: 'order.quick', orderId: order.id }).ok, false);
  for (let i = 0; i < 1500 && s.tables.find(t => t.no === guest.tableNo).state !== 'empty'; i++) tick(s, 100);
  assert.equal(order.status, 'served');
  assert.equal(s.tables.find(t => t.no === guest.tableNo).state, 'empty');
  assert.equal(s.staff.yeoni.job, null);
});
