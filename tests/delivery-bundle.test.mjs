// 10-29 모카 배달: 묶음 담기와 재료 소진 안내
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { shortIngredients, bundleItems, deliveryQuote } from '../src/game/delivery.js';
import { guideForContext } from '../src/ui/tutorials.js';
import { sheetHtml } from '../src/ui/sheets.js';

test('떨어진 재료 채우기는 모자란 판매 재료만 5개까지 담고, 묶음은 바로 주문할 수 있다', () => {
  const s = createGame(); s.stock.bean = 0; s.stock.milk = 1;
  assert.ok(shortIngredients(s).includes('bean')); assert.ok(!shortIngredients(s).includes('egg'), '넉넉한 재료는 빠진다');
  const refill = bundleItems(s, 'refill');
  assert.equal(refill.bean, 5);
  assert.ok(deliveryQuote(s, bundleItems(s, 'bakery')).ok);
  assert.match(sheetHtml(s, { sheet: { kind: 'delivery' }, deliveryCart: {} }), /data-action="delivery.qty" data-id="bean" data-delta="5"/, '재료마다 +5 버튼이 있다');
});

test('재료가 떨어지면 모카 배달 안내가 한 번 나오고, 본 뒤에는 배달 화면 안내를 다시 띄우지 않는다', () => {
  const s = createGame(); s.mode = 'prep'; s.day = 3;
  assert.notEqual(guideForContext(s, {}), 'restock');
  s.stock.bean = 0;
  assert.equal(guideForContext(s, {}), 'restock');
  s.tutorials = { ...s.tutorials, restock: true };
  assert.notEqual(guideForContext(s, {}), 'restock');
  assert.equal(guideForContext(s, { sheet: { kind: 'delivery' } }), null);
});
