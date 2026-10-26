import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, tick } from '../src/game/engine.js';
import { quietShift, seat } from './helpers.mjs';
import { MENUS } from '../src/data/menus.js';
import { panelHtml } from '../src/ui/hud.js';
import { newCraft, mixCraft, craftShortage, craftingSheet, deliverable } from '../src/ui/crafting.js';

test('수동은 주문을 기다리며, 한 번 조리·한 번 서빙 후 이동만 보조하고 정리는 플레이어가 누른다', () => {
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
  const table = s.tables.find(t => t.no === guest.tableNo);
  for (let i = 0; i < 1500 && table.state !== 'dirty'; i++) tick(s, 100);
  assert.equal(order.status, 'served');
  tick(s, 20000);
  assert.equal(table.state, 'dirty', '수동에서 저절로 정리되면 안 된다');
  assert.equal(s.tasks.filter(t => t.type === 'clean').length, 0);
  assert.match(panelHtml(s, {}), new RegExp(`data-action="clean"[^>]*data-no="${table.no}"|data-no="${table.no}"[^>]*data-action="clean"`));
  assert.ok(dispatch(s, { type: 'clean', tableNo: table.no }).ok);
  assert.equal(dispatch(s, { type: 'clean', tableNo: table.no }).ok, false, '같은 테이블 중복 정리 예약');
  for (let i = 0; i < 600 && table.state !== 'empty'; i++) tick(s, 100);
  assert.equal(table.state, 'empty');
  assert.equal(s.staff.yeoni.job, null);
});

test('주방 자동을 켠 영업은 빈 테이블 정리도 맡는다', () => {
  const s = quietShift({ kitchen: true });
  const guest = seat(s, { kind: 'regular' });
  const table = s.tables.find(t => t.no === guest.tableNo);
  let dirty = false;
  for (let i = 0; i < 3000 && !(dirty && table.state === 'empty'); i++) { tick(s, 100); dirty ||= table.state !== 'occupied' && table.state !== 'empty'; }
  assert.ok(dirty); assert.equal(table.state, 'empty');
});

test('수동 포장 손님은 플레이어가 만들 때까지 기다리고, 완성되면 카운터에서 받아 간다', () => {
  const s = quietShift();
  const guest = seat(s, { kind: 'takeaway' });
  while (!s.visits[guest.vid].orderIds.length) tick(s, 100);
  const order = s.orders[s.visits[guest.vid].orderIds[0]];
  tick(s, 3000);
  assert.equal(order.status, 'waiting');
  assert.ok(Object.values(s.stations).every(st => !st.current), '수동에서 저절로 조리하면 안 된다');
  assert.ok(dispatch(s, { type: 'order.quick', orderId: order.id }).ok);
  for (let i = 0; i < 600 && order.status !== 'served'; i++) tick(s, 100);
  assert.equal(order.status, 'served');
  assert.ok(!s.tray.some(it => it?.menuId === order.menuId), '포장 음식이 서빙대에 유령으로 남았다');
});

test('조리 화면은 두 번 탭이고, 재료가 모자라면 모카 배달로 채운 만큼만 산다', () => {
  const s = quietShift();
  const id = Object.keys(MENUS).find(k => Object.keys(MENUS[k].ingredients || {}).length && Object.keys(MENUS[k].ingredients).every(deliverable));
  const rare = Object.keys(MENUS).find(k => Object.keys(MENUS[k].ingredients || {}).some(i => !deliverable(i)));
  const [ing, need] = Object.entries(MENUS[id].ingredients)[0];
  s.stock[ing] = 0;
  const ui = { craft: newCraft(id) };
  assert.deepEqual(craftShortage(s, id)[ing], need);
  assert.match(craftingSheet(s, ui), /craft.restock/);
  assert.doesNotMatch(craftingSheet(s, ui), /craft.mix/);
  const gold = s.gold;
  assert.ok(dispatch(s, { type: 'shop.buy', ingredientId: ing, qty: need }).ok);
  assert.ok(s.gold < gold);
  assert.equal(craftShortage(s, id)[ing], undefined);
  assert.match(craftingSheet(s, ui), /craft.mix/);
  assert.ok(mixCraft(ui.craft, 0)); assert.equal(mixCraft(ui.craft, 0), false);
  assert.match(craftingSheet(s, ui), /craft.heat/);
  // 가게에 없는 재료(사냥·농장)는 배달 버튼 대신 구할 곳을 알린다
  for (const i of Object.keys(MENUS[rare].ingredients)) s.stock[i] = 0;
  const sheet = craftingSheet(s, { craft: newCraft(rare) });
  assert.doesNotMatch(sheet, /craft.restock|craft.mix/); assert.match(sheet, /사냥이나 농장/);
});
