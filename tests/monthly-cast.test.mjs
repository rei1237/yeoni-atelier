import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { recruitView } from '../src/game/economy.js';
import { MONTHLY_CAST } from '../src/data/monthly-cast.js';
import { DEST1NOVA_CAST } from '../src/data/dest1nova-cast.js';
import { validateLayout } from '../src/game/space.js';
import { serialize, deserialize } from '../src/core/save.js';

test('윤달·모카·서한비·무성의 지정 월 이벤트는 1회 영입, 놓친 월은 다음 해 재등장', () => {
  for (const c of [...MONTHLY_CAST, ...DEST1NOVA_CAST]) {
    let s = createGame();
    assert.equal(dispatch(s, { type: 'recruit.complete', id: c.id }).ok, false);
    const day = 1 + ((c.month + 9) % 12) * 3;
    s.day = day + 36*((c.condition.year||1)-1); unlock(s);
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
    const nextYear = createGame(); nextYear.day = day + 36*(c.condition.year||1);unlock(nextYear);
    assert.equal(recruitView(nextYear).find(v => v.id === c.id).status, 'available');
  }
});
test('아홉 접대 동료가 모두 영입되어도 가게 안의 통로에서 출근한다', () => {
  const s = createGame();
  for (const c of [...MONTHLY_CAST, ...DEST1NOVA_CAST]) {
    s.day = 1 + ((c.month + 9) % 12) * 3 + 36*((c.condition.year||1)-1);unlock(s);
    assert.ok(dispatch(s, { type: 'recruit.complete', id: c.id }).ok);
  }
  s.day = 180; s.hostbar.open = true;
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  assert.ok(validateLayout(s.interior.furniture, []).ok);
  for (const id of Object.keys(s.roster)) {
    assert.ok(s.staff[id]);
    assert.ok(s.staff[id].x >= 0 && s.staff[id].x < 12 && s.staff[id].y >= 0 && s.staff[id].y < 16);
  }
});
test('개별 능력치·이야기가 다르고 새 게임의 활동 명단은 네오만이다', () => {
  assert.deepEqual(Object.keys(createGame().roster), ['neo']);
  assert.equal(new Set(MONTHLY_CAST.map(c => JSON.stringify(c.stats))).size, 4);
  for (const c of MONTHLY_CAST) { assert.ok(c.profile && c.meetEvent.lines.length && c.followup.lines.length); }
});

function unlock(s){s.yunQuest={gold:10000,moonstone:0,status:'complete'};s.museongEncounter=true;s.affinity.neo=500;s.farm.xp=9999;s.stats.longestHuntMs=300000;s.stats.huntBosses=3;for(const n of [30,40,50,70,100])s.ledger.story['hanbi:'+n]=true;}
