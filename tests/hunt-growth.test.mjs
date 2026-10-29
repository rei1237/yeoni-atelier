import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { hunterProgress, maxHuntDepth, huntMoonReward, depthScale } from '../src/game/hunt-growth.js';
import { deserialize, serialize } from '../src/core/save.js';

test('영냥이 영구 레벨은 50을 넘어 성장하고 깊은 적·월정석 보상이 함께 증가', () => {
  assert.deepEqual(hunterProgress(1100), { level: 2, totalXP: 1100, xp: 0, xpNext: 1450 });
  assert.ok(hunterProgress(1000000).level > 50);
  const s = createGame(); s.huntUnlocked = true;
  assert.equal(dispatch(s, { type: 'hunt.start', depth: 2 }).ok, false);
  assert.equal(s.ap.left, 3);
  s.hunter.xp = 9000; s.hunter.maxStage=2;
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
  s.hunt.careerXP = 1200; s.hunt.kills = 300;
  dispatch(s, { type: 'hunt.retreat' });
  const oldHunt = structuredClone(s.hunt);
  s = deserialize(serialize(s)).state; dispatch(s, { type: 'resume' });
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(s.hunter.xp, 1200); assert.equal(s.hunter.kills, 300);
  s.mode = 'hunt'; s.hunt = oldHunt;
  dispatch(s, { type: 'hunt.finish' });
  assert.equal(s.hunter.xp, 1200); assert.equal(s.hunter.kills, 300);
  s.day++;
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.ok(s.hunt.maxHp > hp); assert.ok(s.hunt.gear.dmg > damage);
  assert.equal(s.hunt.level, 1); assert.equal(s.hunt.careerLevel, 2);
  const old = JSON.parse(serialize(s)); delete old.hunter;
  assert.deepEqual(deserialize(JSON.stringify(old)).state.hunter, { xp: 0, kills: 0, maxStage:1 });
});

test('사냥터 업적은 귀환 정산 때 1회만 기록·지급되고 도감은 사냥마다 쌓인다', async () => {
  const { checkAchievements } = await import('../src/game/hunt-codex.js');
  const { achievementMoon } = await import('../src/data/hunt-achievements.js');
  let s = createGame(); s.huntUnlocked = true; s.ap.left = 9;
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  // 전투 결과 fixture: 보스 1회 처치·회복 수프 없이 1단계 클리어
  Object.assign(s.hunt, { bossKills: 1, cleared: 1, seen: { shade_hand: 5, boss_hand: 1 } });
  dispatch(s, { type: 'hunt.retreat' });
  const before = s.moonstone;
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(s.ledger.achievements.first_boss, true); assert.equal(s.ledger.achievements.no_tonic, true);
  assert.equal(s.moonstone, before + s.lastHunt.bag.moonstone + achievementMoon('first_boss') + achievementMoon('no_tonic'));
  const paid = s.moonstone;
  assert.deepEqual(checkAchievements(s), []);
  s = deserialize(serialize(s)).state;
  assert.equal(s.moonstone, paid, '불러오기 소급도 다시 주지 않는다');
  s.day++;
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  s.hunt.seen = { shade_hand: 3 }; s.hunt.weapons.push({ id: 'orbit', level: 5, evo: true }); s.hunt.tonicsUsed = 1;
  dispatch(s, { type: 'hunt.retreat' }); dispatch(s, { type: 'hunt.finish' });
  assert.equal(s.huntCodex.enemies.shade_hand, 8); assert.equal(s.huntCodex.evolved.orbit, true);
  assert.equal(s.ledger.achievements.evolve, true);
});

test('도감 이전 저장은 깬 단계로 도감·업적을 소급하고 보상은 한 번만 준다', () => {
  const s = createGame(); s.hunter.maxStage = 12; s.stats.huntBosses = 11;
  const old = JSON.parse(serialize(s)); delete old.huntCodex; delete old.ledger.achievements;
  const a = deserialize(JSON.stringify(old)).state;
  assert.equal(a.huntCodex.enemies.boss_hand, 0, '만남(처치 수는 모름)');
  assert.ok(a.ledger.achievements.first_boss && a.ledger.achievements.stage10);
  assert.equal(a.ledger.achievements.stage30, undefined);
  const b = deserialize(serialize(a)).state;
  assert.equal(b.moonstone, a.moonstone);
  assert.ok(a.moonstone > s.moonstone);
});

test('월정석 드랍은 깊은 단계일수록 확실히 많아진다', () => {
  const at = d => huntMoonReward(1, depthScale(d, { hp: 1, dmg: 1 }, 0));
  assert.ok(at(11) >= 3 && at(51) >= 11 && at(100) >= 20);
  assert.ok(at(51) > at(11) * 2);
});
