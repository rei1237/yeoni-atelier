// 마을 나가기: 루나의 저울(월정석 환전) · 무인 장비 좌판 · 가게 확장 · 모카 식재료점/긴급 배달
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { GEAR } from '../src/data/gear.js';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { questView } from '../src/game/economy.js';
import { validateLayout } from '../src/game/space.js';
import { tablePrice, areaPrice } from '../src/game/town.js';
import { AREAS } from '../src/data/layout.js';
import { DECOR_CATALOG } from '../src/data/decor-catalog.js';
import { serialize, deserialize } from '../src/core/save.js';
import { quietShift, seat } from './helpers.mjs';

test('루나의 저울: 월정석을 고정 환율로 골드로 바꾸고, 부족하면 거절', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
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
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
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
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
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

test('가게 확장: 테이블 값은 들일수록 오르고, 6·7번 테이블에도 다음 영업에서 손님이 앉는다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.gold = 20000;
  const p4 = tablePrice(5), p5 = tablePrice(6);
  assert.equal(p4, TEMP.TABLE_PRICE_BASE);
  assert.ok(p5 > p4, '두 번째 테이블이 더 비싸다');
  assert.ok(dispatch(s, { type: 'expand.table' }).ok);
  assert.ok(dispatch(s, { type: 'expand.table' }).ok);
  assert.equal(s.gold, 20000 - p4 - p5);
  assert.equal(s.stats.expansions, 2);
  assert.ok(validateLayout(s.interior.furniture, s.interior.areas).ok);

  s.autoKitchen = false;
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99;
  s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  assert.deepEqual(s.tables.map(t => t.no).sort(), [1, 2, 3, 4, 5, 6, 7]);
  const seated = [1, 2, 3, 4, 5, 6, 7].map(() => seat(s, { kind: 'normal' }).tableNo);
  assert.deepEqual(seated.sort(), [1, 2, 3, 4, 5, 6, 7]);
});

test('공방 증축: 잠긴 구역에는 가구를 못 놓고, 열 때마다 다음 구역이 비싸진다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  const [a] = AREAS;
  const [x, y] = a.rect;
  const plant = s.interior.furniture.find(f => f.uid === 'plant1');
  const moved = s.interior.furniture.map(f => (f === plant ? { ...f, x, y } : f));
  assert.ok(validateLayout(moved, []).problems.some(p => p.code === 'locked'));

  s.gold = 100000;
  const c1 = areaPrice(s);
  assert.ok(dispatch(s, { type: 'expand.area', id: a.id }).ok);
  assert.equal(dispatch(s, { type: 'expand.area', id: a.id }).ok, false, '같은 구역은 한 번만');
  assert.ok(areaPrice(s) > c1);
  assert.equal(s.gold, 100000 - c1);
  assert.ok(validateLayout(moved, s.interior.areas).ok, '연 구역에는 놓을 수 있다');
  // 저장 왕복에도 연 구역 유지
  const back = deserialize(serialize(s));
  assert.ok(back.ok, back.reason);
  assert.deepEqual(back.state.interior.areas, [a.id]);
});

test('장식 들이기는 보관함으로 오고, 월정석·장비는 저장 후에도 그대로', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.gold = 2000;
  s.moonstone = GEAR.crescent_wand.cost.moonstone;
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
test('네 테마의 새 장식 16종은 정해진 가격으로 보관함에 오고 저장 후 유지된다', () => {
  const s=createGame();s.ap.left=20;s.gold=50000;const before=s.gold;
  for(const d of DECOR_CATALOG)assert.ok(dispatch(s,{type:'expand.decor',defId:d.id}).ok);
  assert.equal(s.gold,before-DECOR_CATALOG.reduce((sum,d)=>sum+d.price,0));
  const back=deserialize(serialize(s)).state;
  for(const d of DECOR_CATALOG)assert.ok(back.interior.furniture.some(f=>f.defId===d.id&&f.x===null));
  assert.equal(new Set(DECOR_CATALOG.map(d=>d.theme)).size,4);
});
