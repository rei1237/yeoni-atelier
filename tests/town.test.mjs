// 마을 나가기: 루나의 저울(월정석 환전) · 무인 장비 좌판 · 가게 확장 · 모카 식재료점/긴급 배달
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { GEAR } from '../src/data/gear.js';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { questView } from '../src/game/economy.js';
import { validateLayout } from '../src/game/space.js';
import { serialize, deserialize } from '../src/core/save.js';
import { quietShift, seat } from './helpers.mjs';

test('루나의 저울: 월정석을 고정 환율로 골드로 바꾸고, 부족하면 거절', () => {
  const s = createGame();
  s.moonstone = 12; // 테스트 준비
  const g0 = s.gold;
  const r = dispatch(s, { type: 'moonstone.exchange', qty: 10 });
  assert.ok(r.ok, r.reason);
  assert.equal(s.gold, g0 + 10 * TEMP.MOONSTONE_GOLD);
  assert.equal(s.moonstone, 2);
  assert.equal(s.stats.moonstonesExchanged, 10);
  assert.equal(dispatch(s, { type: 'moonstone.exchange', qty: 3 }).ok, false);
  assert.equal(s.moonstone, 2);
});

test('마을은 영업 준비 중에만: 영업 중에는 환전·장비·확장 불가', () => {
  const s = quietShift();
  s.moonstone = 5;
  for (const cmd of [{ type: 'moonstone.exchange', qty: 1 }, { type: 'gear.buy', id: 'claw_glove' }, { type: 'expand.table' }, { type: 'expand.decor', defId: 'plant' }]) {
    assert.equal(dispatch(s, cmd).ok, false, cmd.type);
  }
  assert.equal(s.moonstone, 5);
});

test('무인 장비 좌판: 사면 빈 칸에 장착되고, 사냥 시작 때 효과가 적용된다', () => {
  const s = createGame();
  s.gold = 5000; // 테스트 준비
  assert.ok(dispatch(s, { type: 'gear.buy', id: 'scale_vest' }).ok);
  assert.equal(s.gold, 5000 - GEAR.scale_vest.cost.gold);
  assert.equal(s.gear.equipped.armor, 'scale_vest');
  assert.equal(dispatch(s, { type: 'gear.buy', id: 'scale_vest' }).ok, false, '같은 장비는 두 번 못 산다');
  assert.equal(dispatch(s, { type: 'gear.buy', id: 'crescent_wand' }).ok, false, '월정석이 없으면 못 산다');
  assert.equal(dispatch(s, { type: 'gear.equip', slot: 'weapon', id: 'scale_vest' }).ok, false, '칸이 다르면 못 낀다');
  const r = dispatch(s, { type: 'hunt.start' });
  assert.ok(r.ok, r.reason);
  assert.equal(s.hunt.maxHp, TEMP.HUNT.PLAYER_HP + GEAR.scale_vest.fx.hp);
  assert.equal(dispatch(s, { type: 'gear.equip', slot: 'armor', id: null }).ok, false, '사냥 중에는 장비를 못 바꾼다');
});

test('모카 식재료점: 준비 중엔 재료값만, 영업 중엔 긴급 배달비가 붙는다 · 밤이슬 퀘스트 진행', () => {
  const s = createGame();
  s.gold = 1000;
  const r = dispatch(s, { type: 'shop.buy', ingredientId: 'night_dew', qty: 1 });
  assert.ok(r.ok, r.reason);
  assert.equal(r.fee, 0);
  assert.equal(s.gold, 1000 - 90);
  assert.equal(s.stats.nightDewObtained, 1);
  assert.ok(questView(s).find(q => q.id === 'q_special_ingredient').claimable);

  const t = quietShift();
  t.gold = 1000;
  const r2 = dispatch(t, { type: 'shop.buy', ingredientId: 'night_dew', qty: 2 });
  assert.ok(r2.ok, r2.reason);
  assert.equal(r2.fee, Math.ceil(180 * TEMP.DELIVERY_FEE_RATE));
  assert.equal(t.gold, 1000 - 180 - r2.fee);
});

test('가게 확장: 4·5번 테이블이 규칙에 맞는 빈자리에 놓이고, 다음 영업에서 손님이 앉는다', () => {
  const s = createGame();
  s.gold = 20000;
  assert.ok(dispatch(s, { type: 'expand.table' }).ok);
  assert.ok(dispatch(s, { type: 'expand.table' }).ok);
  assert.equal(dispatch(s, { type: 'expand.table' }).ok, false, '임시 데이터의 확장은 두 단계까지');
  assert.equal(s.gold, 20000 - TEMP.EXPANSION.reduce((a, e) => a + e.cost, 0));
  assert.equal(s.stats.expansions, 2);
  assert.ok(validateLayout(s.interior.furniture).ok);

  s.autoKitchen = false;
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99;
  s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  assert.deepEqual(s.tables.map(t => t.no).sort(), [1, 2, 3, 4, 5]);
  const seated = [1, 2, 3, 4, 5].map(() => seat(s, { kind: 'normal' }).tableNo);
  assert.deepEqual(seated.sort(), [1, 2, 3, 4, 5]);
});

test('장식 들이기는 보관함으로 오고, 월정석·장비는 저장 후에도 그대로', () => {
  const s = createGame();
  s.gold = 2000;
  s.moonstone = 40;
  const n0 = s.interior.furniture.length;
  assert.ok(dispatch(s, { type: 'expand.decor', defId: 'lamp' }).ok);
  const added = s.interior.furniture[n0];
  assert.equal(added.defId, 'lamp');
  assert.equal(added.x, null);
  assert.ok(dispatch(s, { type: 'gear.buy', id: 'crescent_wand' }).ok);
  const r = deserialize(serialize(s));
  assert.ok(r.ok, r.reason);
  assert.equal(r.state.moonstone, 0);
  assert.equal(r.state.gear.equipped.weapon, 'crescent_wand');
  assert.equal(r.state.interior.furniture.length, n0 + 1);
});
