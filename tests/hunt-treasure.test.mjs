// 사냥터 보물 상자: 아주 드물게 나오고, 월정석을 많이 주며, 회복 생선은 여기서만 가끔 나온다. 발견은 한 번만 알린다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { getHuntWorld, resolveMelee, mods } from '../src/game/hunt.js';
import { nearbyProps, fieldHash, isTreasure, CHUNK_SIZE } from '../src/game/hunt-field.js';
import { serialize, deserialize } from '../src/core/save.js';

test('보물 상자는 기물 자리 중 아주 드물고, 같은 자리 기물보다 월정석을 훨씬 많이 준다', () => {
  let slots = 0, treasure = 0;
  for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) { const h = fieldHash(x, y, 5); if (h % 10 < TEMP.HUNT.FIELD_PROP_SKIP) continue; slots++; if (isTreasure(h)) treasure++; }
  assert.ok(treasure > 0 && treasure / slots < 0.03, `${treasure}/${slots}`);
  const hs = { depth: 10, fieldSeed: 5 };
  for (let y = -20; y < 20; y++) for (let x = -20; x < 20; x++) for (const p of nearbyProps(hs, { x: x * CHUNK_SIZE * 5, y: y * CHUNK_SIZE * 5 })) {
    const h = fieldHash(...p.id.split(':').map(Number), 5), raw = (3 + h % 5) * (1 + 10 * .045) * TEMP.HUNT.FIELD_PROP_REWARD;
    assert.equal(p.kind === 'coffer', p.treasure, '상자 그림은 보물 상자만 쓴다');
    assert.equal(p.reward, Math.ceil(raw * (p.treasure ? TEMP.HUNT.TREASURE_REWARD : 1)));
    if (p.treasure) assert.ok(p.reward >= 30, '보물 상자는 월정석이 많다');
  }
});

test('보물 상자를 보면 한 번만 발견을 알리고, 부수면 월정석이 쏟아지며 회복 생선은 가끔만 나온다', () => {
  const s = createGame({ seed: 11 }); s.hostbar.open = true; s.huntUnlocked = true;
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 1 }).ok);
  const w = getHuntWorld(s), seed = s.hunt.fieldSeed;
  let spot = null;
  for (let r = 0; r < 200 && !spot; r++) for (let x = -r; x <= r && !spot; x++) { const h = fieldHash(x, r, seed); if (h % 10 >= TEMP.HUNT.FIELD_PROP_SKIP && isTreasure(h)) spot = { x, y: r }; }
  assert.ok(spot, '탐색 범위 안에 보물 상자가 있다');
  const prop = () => nearbyProps(s.hunt, w.player).find(p => p.id === `${spot.x}:${spot.y}`);
  Object.assign(w.player, { x: spot.x * CHUNK_SIZE + 200, y: spot.y * CHUNK_SIZE + 200, hurtUntil: 1e12 }); // 테스트 준비: 상자 곁으로 옮긴다
  const p = prop(); assert.ok(p.treasure);
  Object.assign(w.player, { x: p.x + 60, y: p.y });
  const ev = [...tick(s, 100, { input: { x: 0, y: 0 } }), ...tick(s, 100, { input: { x: 0, y: 0 } })];
  assert.equal(ev.filter(e => e.type === 'huntTreasureFound').length, 1);
  const back = deserialize(serialize(s)).state; assert.ok(back.hunt.foundTreasure[p.id], '발견 기록은 저장된다');

  let fish = 0, moon = 0;
  for (let i = 0; i < 40; i++) {
    const before = w.drops.count; delete s.hunt.brokenProps[p.id]; delete s.hunt.propDamage[p.id]; // 테스트 준비: 같은 상자를 다시 세운다
    while (w.enemies.count) w.enemies.release(0);
    w.props = [prop()];
    w.player.swing = { x: p.x + 30, y: p.y, angle: 0, radius: 120, halfArc: Math.PI, damage: 1e6, hitAt: 0 };
    resolveMelee(s, w, 1, mods(s.hunt));
    for (let k = before; k < w.drops.count; k++) { const d = w.drops.items[k]; if (d.kind === 'fish') fish++; if (d.kind === 'moon') moon += d.v; }
    w.drops.count = before;
  }
  assert.ok(moon >= 40 * p.reward, `${moon}`);
  assert.ok(fish > 0 && fish < 40, `생선 ${fish}/40`);
});

test('항아리를 부수면 드물게 구운 생선 조각이 나오고, 주우면 HP가 10 오른다', () => {
  const s = createGame({ seed: 11 }); s.hostbar.open = true; s.huntUnlocked = true;
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 1 }).ok);
  const w = getHuntWorld(s), seed = s.hunt.fieldSeed;
  let spot = null;
  for (let r = 1; r < 200 && !spot; r++) for (let x = -r; x <= r && !spot; x++) { const h = fieldHash(x, r, seed); if (h % 10 >= TEMP.HUNT.FIELD_PROP_SKIP && !isTreasure(h) && h % 2 === 1) spot = { x, y: r }; }
  const prop = () => nearbyProps(s.hunt, w.player).find(p => p.id === `${spot.x}:${spot.y}`);
  Object.assign(w.player, { x: spot.x * CHUNK_SIZE + 200, y: spot.y * CHUNK_SIZE + 200, hurtUntil: 1e12 }); // 테스트 준비: 항아리 곁으로 옮긴다
  const p = prop(); assert.equal(p.kind, 'urn');
  let snacks = 0, other = 0;
  for (let i = 0; i < 300; i++) {
    const before = w.drops.count; delete s.hunt.brokenProps[p.id]; delete s.hunt.propDamage[p.id]; // 테스트 준비: 같은 항아리를 다시 세운다
    w.props = [prop()];
    w.player.swing = { x: p.x + 30, y: p.y, angle: 0, radius: 120, halfArc: Math.PI, damage: 1e6, hitAt: 0 };
    resolveMelee(s, w, 1, mods(s.hunt));
    for (let k = before; k < w.drops.count; k++) { const d = w.drops.items[k]; if (d.kind === 'fish') d.v === TEMP.HUNT.URN_HEAL ? snacks++ : other++; }
    w.drops.count = before;
  }
  assert.equal(other, 0, '큰 회복 생선은 항아리에서 나오지 않는다');
  assert.ok(snacks > 0 && snacks < 60, `조각 ${snacks}/300`);
  w.drops.count = 0; while (w.enemies.count) w.enemies.release(0);
  s.hunt.hp = s.hunt.maxHp - 30;
  const it = w.drops.items[0]; Object.assign(it, { kind: 'fish', id: 'fish', v: TEMP.HUNT.URN_HEAL, x: w.player.x, y: w.player.y }); w.drops.count = 1;
  const ev = tick(s, 16, { input: { x: 0, y: 0 } });
  assert.equal(s.hunt.hp, s.hunt.maxHp - 20);
  assert.ok(ev.some(e => e.type === 'huntPower' && /조각/.test(e.label)));
});
