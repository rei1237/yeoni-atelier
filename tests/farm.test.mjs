import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { advanceFarm } from '../src/game/farm.js';
import { CROPS, farmLevel, farmWeather, farmSeason } from '../src/data/farm.js';
import { serialize, deserialize } from '../src/core/save.js';
import { RULES } from '../src/config/rules.js';
const cmd = (s, type, args = {}) => dispatch(s, { type, ...args });
const tend = (s, index) => { cmd(s, 'farm.water', { index }); cmd(s, 'farm.tend', { index }); };

test('연이 농사 → 마감 성장 → 재고 → 실제 조리, 수확 중복 방지와 저장 왕복', () => {
  let s = createGame();
  s.autoKitchen = false; // 이 검증은 농장 재고만 추적한다.
  const start = s.stock.flour, gold = s.gold;
  assert.ok(cmd(s, 'farm.plant', { cropId: 'wheat', index: 0 }).ok);
  assert.equal(s.gold, gold - CROPS.wheat.seedCost);
  const id = s.farm.plots[0].id;
  assert.equal(cmd(s, 'farm.harvest', { index: 0, cropInstanceId: id }).ok, false);
  tend(s, 0);
  s = deserialize(serialize(s)).state;
  assert.ok(cmd(s, 'shift.start').ok);
  assert.equal(cmd(s, 'farm.plant', { cropId: 'wheat', index: 1 }).ok, false);
  tick(s, RULES.SHIFT_MS);
  assert.ok(cmd(s, 'settlement.close').ok);
  assert.equal(s.farm.plots[0].growth, 1);
  const r = cmd(s, 'farm.harvest', { index: 0, cropInstanceId: id });
  assert.ok(r.ok); assert.equal(r.qty, 5);
  assert.equal(s.stock.flour, start + 5);
  assert.equal(cmd(s, 'farm.harvest', { index: 0, cropInstanceId: id }).ok, false);
  assert.ok(cmd(s, 'shift.start').ok);
  const flour = s.stock.flour;
  assert.ok(cmd(s, 'cook', { menuId: 'flower_cookie' }).ok);
  assert.equal(s.stock.flour, flour - 1);
});

test('날씨는 저장 후 동일, 비 자동 급수·건조 돌봄·방치 성장 보류와 중복 마감 방지', () => {
  for (const weather of ['sun', 'rain', 'dry', 'frost']) {
    const s = createGame(); s.day = weather === 'frost' ? 28 : 1;
    while (farmWeather(s.farm, s.day) !== weather) s.farm.seed++;
    assert.equal(farmWeather(deserialize(serialize(s)).state.farm, s.day), weather);
    assert.ok(cmd(s, 'farm.plant', { cropId: 'wheat', index: 0 }).ok);
    cmd(s, 'farm.water', { index: 0 });
    s.day++; advanceFarm(s);
    assert.equal(s.farm.plots[0].growth, ['sun', 'rain'].includes(weather) ? 1 : 0);
    const growth = s.farm.plots[0].growth; advanceFarm(s);
    assert.equal(s.farm.plots[0].growth, growth);
    if (weather === 'dry' || weather === 'frost') {
      tend(s, 0); s.day++; advanceFarm(s); assert.equal(s.farm.plots[0].growth, 1);
    }
  }
});

test('농장 레벨 작물·확장·일괄 돌봄·온실, 수확 레시피와 과거 저장 호환', () => {
  const s = createGame();
  assert.equal(cmd(s, 'farm.expand').ok, false);
  assert.equal(cmd(s, 'farm.careAll').ok, false);
  assert.equal(cmd(s, 'farm.plant', { cropId: 'berry', index: 0 }).ok, false);
  s.farm.xp = 60; assert.equal(farmLevel(s.farm), 2);
  assert.ok(cmd(s, 'farm.expand').ok); assert.equal(s.farm.plots.length, 6);
  assert.ok(cmd(s, 'farm.plant', { cropId: 'berry', index: 0 }).ok);
  for (let i = 0; i < 2; i++) { tend(s, 0); s.day++; advanceFarm(s); }
  assert.ok(cmd(s, 'farm.harvest', { index: 0, cropInstanceId: s.farm.plots[0].id }).ok);
  assert.equal(s.learned.lotus_berry_tart, true); assert.ok(s.stock.berry > 0);
  s.day = 28; assert.equal(farmSeason(s.day), 'winter');
  assert.equal(cmd(s, 'farm.plant', { cropId: 'berry', index: 0 }).ok, false);
  s.farm.xp = 960; s.gold = 2000;
  assert.ok(cmd(s, 'farm.greenhouse').ok);
  assert.ok(cmd(s, 'farm.plant', { cropId: 'berry', index: 0 }).ok);
  assert.ok(cmd(s, 'farm.careAll').ok);
  const old = JSON.parse(serialize(s)); delete old.farm;
  const migrated = deserialize(JSON.stringify(old)).state;
  assert.equal(migrated.farm.plots.length, 4); assert.equal(migrated.farm.lastAdvancedDay, 28);
});
