import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { hunterProgress, maxHuntDepth, huntMoonReward, depthScale } from '../src/game/hunt-growth.js';
import { deserialize, serialize } from '../src/core/save.js';

test('영냥이 영구 레벨은 50을 넘어 성장하고 깊은 적·월정석 보상이 함께 증가', () => {
  assert.deepEqual(hunterProgress(500), { level: 2, totalXP: 500, xp: 0, xpNext: 650 });
  assert.ok(hunterProgress(1000000).level > 50);
  const s = createGame(); s.huntUnlocked = true;
  assert.equal(dispatch(s, { type: 'hunt.start', depth: 2 }).ok, false);
  assert.equal(s.ap.left, 2);
  s.hunter.xp = 4000;
  assert.equal(maxHuntDepth(s), 2);
  const before = depthScale(1, { hp: 1, dmg: 1 }, 0), after = depthScale(2, { hp: 1, dmg: 1 }, 0);
  assert.ok(after.hp > before.hp && after.dmg > before.dmg);
  for (const base of [1, 10, 60]) assert.ok(huntMoonReward(base, after) > huntMoonReward(base, before));
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 2 }).ok);
  assert.equal(s.hunt.careerLevel, 6); assert.equal(s.hunt.level, 1);
  assert.equal(s.hunt.maxHp, 120, '기본 HP 100 + 영구 성장 5레벨 ×4');
});

test('사냥 성장 보상은 저장 왕복·재처리에도 1회, 다음 사냥에서 능력으로 반영', () => {
  let s = createGame(); s.huntUnlocked = true;
  dispatch(s, { type: 'hunt.start' });
  const hp = s.hunt.maxHp, damage = s.hunt.gear.dmg;
  // 전투 처치 결과 fixture. 수령 경로와 복원 중복 처리 검증.
  s.hunt.careerXP = 600; s.hunt.kills = 300;
  dispatch(s, { type: 'hunt.retreat' });
  const oldHunt = structuredClone(s.hunt);
  s = deserialize(serialize(s)).state; dispatch(s, { type: 'resume' });
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(s.hunter.xp, 600); assert.equal(s.hunter.kills, 300);
  s.mode = 'hunt'; s.hunt = oldHunt;
  dispatch(s, { type: 'hunt.finish' });
  assert.equal(s.hunter.xp, 600); assert.equal(s.hunter.kills, 300);
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.ok(s.hunt.maxHp > hp); assert.ok(s.hunt.gear.dmg > damage);
  assert.equal(s.hunt.level, 1); assert.equal(s.hunt.careerLevel, 2);
  const old = JSON.parse(serialize(s)); delete old.hunter;
  assert.deepEqual(deserialize(JSON.stringify(old)).state.hunter, { xp: 0, kills: 0 });
});
