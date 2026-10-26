// 사냥 난이도: 레벨업 곡선, 달이 지날수록 짙어지는 그늘, 보스 월정석
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { ENEMIES } from '../src/data/hunt-kit.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { xpNeeded, getHuntWorld } from '../src/game/hunt.js';

const H = TEMP.HUNT;

test('레벨업: 필요 별조각이 레벨마다 점점 더 크게 늘어난다', () => {
  const steps = [1, 2, 3, 4, 5, 6].map(xpNeeded);
  assert.equal(steps[0], H.XP_BASE);
  for (let i = 2; i < steps.length; i++) assert.ok(steps[i] - steps[i - 1] >= steps[i - 1] - steps[i - 2], `L${i + 1} 증가폭`);
  assert.ok(xpNeeded(12) - xpNeeded(11) > 2 * (xpNeeded(2) - xpNeeded(1)), '후반 레벨은 훨씬 무겁다');
});

test('달 배율: 늦은 달 사냥은 같은 적도 HP 가 높고, 보스 월정석은 정예보다 훨씬 많다', () => {
  const hpOf = day => {
    const s = createGame({ seed: 7 });
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
    s.day = day; // 테스트 준비
    assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
    s.hunt.hp = s.hunt.maxHp = 1e9; // 테스트 준비: 적 수치만 본다
    tick(s, 3000, { input: { x: 0, y: 0 } });
    const w = getHuntWorld(s);
    const e = w.enemies.items.slice(0, w.enemies.count).find(x => x.type === 'shade_hand');
    return { s, hp: e.maxHp };
  };
  const a = hpOf(1), b = hpOf(TEMP.CALENDAR.TOTAL_TURNS - 1);
  assert.deepEqual(a.s.hunt.scale, { hp: 1, dmg: 1, reward: 1 });
  assert.equal(b.s.hunt.scale.hp, 1 + H.MONTH_HP * 11);
  assert.ok(b.hp > a.hp * 1.5, `${b.hp} vs ${a.hp}`);
  // 후일담(마지막 달 넘어)에는 더 오르지 않는다
  const c = createGame();
  c.hostbar.open = true; c.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  c.day = TEMP.CALENDAR.TOTAL_TURNS + 30;
  assert.ok(dispatch(c, { type: 'hunt.start' }).ok);
  assert.equal(c.hunt.scale.hp, b.s.hunt.scale.hp);
  assert.ok(H.MOON_DROP.boss >= 3 * H.MOON_DROP.elite, '보스 월정석이 정예보다 훨씬 많다');
  assert.ok(ENEMIES.boss_hand.hp > ENEMIES.elite_hand.hp);
});
