// 사냥터 적의 좌우 시선: 옆모습 한 줄 그림은 가는 쪽으로 뒤집고, 왼쪽 행이 있는 시트(검은 호랑이)는 뒤집지 않는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { getHuntWorld, spawnEnemy } from '../src/game/hunt.js';
import { stepEnemyBehaviors } from '../src/game/enemy-behaviors.js';
import { stepBoss, initBoss } from '../src/game/hunt-boss.js';
import { ENEMIES } from '../src/data/hunt-kit.js';
import { enemyFlipX } from '../src/render/hunt-view.js';

test('박쥐가 세로로 비스듬히 왼쪽으로 가도 왼쪽을 보도록 뒤집힌다', () => {
  const s = createGame({ seed: 3 }); s.hostbar.open = true; s.huntUnlocked = true;
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 1 }).ok);
  const w = getHuntWorld(s), p = w.player;
  while (w.enemies.count) w.enemies.release(0);
  s.hunt.depth = 2; const e = spawnEnemy(s, w, 'shade_bat', p.x + 60, p.y - 300); // 테스트 준비: 박쥐가 나오는 2단계, 위쪽 조금 오른편에서 내려온다
  for (let t = 0; t < 300; t += 16) stepEnemyBehaviors(s, w, t, 16);
  assert.equal(e.facing, 'down');
  assert.equal(enemyFlipX(e, ENEMIES.shade_bat), true);
});

test('검은 호랑이는 왼쪽 행을 쓰니 뒤집지 않고, 돌진 방향을 그대로 본다', () => {
  const s = createGame({ seed: 3 });
  const w = { player: { x: 600, y: 0, hurtUntil: 1e12 }, hostile: [], zones: [], fx: [], enemies: { count: 0, items: [] } };
  const e = { type: 'boss_hanbi', x: 0, y: 0, hp: 3200, maxHp: 3200, uid: 1 };
  initBoss(e, 0);
  Object.assign(e, { taskPhase: 'act', task: 'charge', taskUntil: 1e9, aimX: -1, aimY: 0 }); // 테스트 준비: 플레이어 반대쪽(왼쪽)으로 돌진 중
  stepBoss(s, w, e, 100, 16, () => null);
  assert.equal(e.faceX, -1);
  assert.equal(e.facing, 'left');
  assert.equal(enemyFlipX(e, ENEMIES.boss_hanbi), false);
});
