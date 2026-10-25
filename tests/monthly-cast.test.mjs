import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { recruitView } from '../src/game/economy.js';
import { MONTHLY_CAST } from '../src/data/monthly-cast.js';
import { serialize, deserialize } from '../src/core/save.js';

test('윤달·모카·서한비·무성의 지정 월 이벤트는 1회 영입, 놓친 월은 다음 해 재등장', () => {
  for (const c of MONTHLY_CAST) {
    let s = createGame();
    assert.equal(dispatch(s, { type: 'recruit.complete', id: c.id }).ok, false);
    const day = 1 + ((c.month + 9) % 12) * 3;
    s.day = day;
    assert.equal(recruitView(s).find(v => v.id === c.id).status, 'available');
    assert.ok(dispatch(s, { type: 'recruit.complete', id: c.id }).ok);
    const stock = structuredClone(s.stock);
    assert.equal(dispatch(s, { type: 'recruit.complete', id: c.id }).ok, false);
    assert.deepEqual(s.stock, stock);
    assert.equal(dispatch(s, { type: 'cast.story', id: c.id }).ok, false);
    s.day++;
    assert.ok(dispatch(s, { type: 'cast.story', id: c.id }).ok);
    s = deserialize(serialize(s)).state;
    assert.ok(s.roster[c.id]); assert.ok(s.ledger.story[`cast:${c.id}`]);
    const nextYear = createGame(); nextYear.day = day + 36;
    assert.equal(recruitView(nextYear).find(v => v.id === c.id).status, 'available');
  }
});
test('개별 능력치·이야기가 다르고 새 게임의 활동 명단은 네오만이다', () => {
  assert.deepEqual(Object.keys(createGame().roster), ['neo']);
  assert.equal(new Set(MONTHLY_CAST.map(c => JSON.stringify(c.stats))).size, 4);
  for (const c of MONTHLY_CAST) { assert.ok(c.profile && c.meetEvent.lines.length && c.followup.lines.length); }
});
