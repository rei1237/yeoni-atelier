import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { serialize, deserialize } from '../src/core/save.js';
import { validateLayout } from '../src/game/space.js';
import { nextExpansion, tableCount } from '../src/game/town.js';

test('시작 5테이블의 입구·주방·좌석 경로와 6번째 구매 가격', () => {
  const s = createGame();
  assert.equal(tableCount(s), 5);
  assert.ok(validateLayout(s.interior.furniture, []).ok);
  assert.equal(nextExpansion(s).tableNo, 6);
  assert.equal(nextExpansion(s).cost, 2500);
});

test('기존 3테이블 저장과 이미 구매한 4번 테이블 배치를 덮어쓰지 않는다', () => {
  for (const count of [3, 4]) {
    const s = createGame();
    s.interior.furniture = s.interior.furniture.filter(f => !f.tableNo || f.tableNo <= count);
    s.stats.expansions = count - 3;
    const before = structuredClone(s.interior.furniture);
    const r = deserialize(serialize(s));
    assert.ok(r.ok);
    assert.deepEqual(r.state.interior.furniture, before);
    assert.equal(tableCount(r.state), count);
    assert.equal(r.state.stats.expansions, count - 3);
  }
});
