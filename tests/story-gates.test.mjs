import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, shiftDuration } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { spawnCustomer } from '../src/game/cafe.js';
import { serialize, deserialize } from '../src/core/save.js';
import { RULES } from '../src/config/rules.js';

test('새 게임 이야기 순서 m0 → ev:hunt, 사냥 잠금·변신·복귀', () => {
  const s = createGame();
  assert.match(dispatch(s, { type: 'hunt.start' }).reason, /사냥터 이야기/);
  assert.equal(pendingStory(s), 'm0');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).ok, false);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm0' }).ok);
  assert.equal(pendingStory(s), 'ev:hunt');
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).ok);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).duplicate);
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.equal(s.people.neo.form, 'cat');
  dispatch(s, { type: 'hunt.retreat' });
  dispatch(s, { type: 'hunt.finish' });
  assert.equal(s.people.neo.form, 'human');
  assert.equal(deserialize(serialize(s)).state.huntUnlocked, true);
});

test('3·4월 일반 영업만, 5월 이야기 완료/건너뛰기 명령이 지명과 정장을 1회 해금', () => {
  for (const day of [1, 4]) {
    const s = createGame(); s.day = day;
    dispatch(s, { type: 'shift.start' }); dispatch(s, { type: 'auto.toggle', on: true });
    tick(s, RULES.SHIFT_MS);
    assert.equal(s.lastSettlement.nominationVisits, 0);
    assert.equal(s.lastSettlement.hostings.length, 0);
  }
  const s = createGame(); s.day = 7;
  assert.equal(dispatch(s, { type: 'story.seen', id: 'm999' }).ok, false);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm2' }).ok);
  assert.equal(s.hostbar.open, true);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm2' }).duplicate);
  assert.equal(s.outfits.owned.filter(id => id === 'host_first').length, 1);
  dispatch(s, { type: 'shift.start' });
  const c = spawnCustomer(s, { kind: 'nomination', nominee: 'neo', profileId: 'looks' });
  assert.equal(s.visits[c.visitId].kind, 'nomination');
});

test('v1 저장 이전: 월별 잠금·사냥 기록·진행 중 기존 시간과 구매내역 보존', () => {
  for (const day of [1, 2, 4, 7, 36]) {
    const old = createGame(); old.version = 1; old.day = day;
    delete old.hostbar; delete old.huntUnlocked;
    const s = deserialize(serialize(old)).state;
    assert.equal(s.hostbar.open, day >= 7);
    assert.equal(s.huntUnlocked, day > 1);
  }
  const old = createGame(); dispatch(old, { type: 'shift.start' });
  old.version = 1; delete old.shift.durationMs; delete old.shift.nominationMs;
  old.shift.elapsedMs = 900000;
  const s = deserialize(serialize(old)).state;
  assert.equal(shiftDuration(s), 1800000);
  assert.equal(s.shift.elapsedMs, 900000);
  assert.equal(s.shift.nominationMs, 300000);
  dispatch(s, { type: 'resume' }); tick(s, 900000);
  dispatch(s, { type: 'settlement.close' }); dispatch(s, { type: 'shift.start' });
  assert.equal(s.shift.durationMs, 600000);
  assert.equal(s.shift.nominationMs, 60000);
});
