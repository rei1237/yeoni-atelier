// 친밀도: 대화·선물은 순마다 한 사람 한 번, 단계 능력은 실제 수치에 붙고 인연 이야기는 달 이야기 뒤에 한 번
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { BONDS, bondFx } from '../src/data/bonds.js';

const B = TEMP.BONDS;

test('대화: 행동력 1, 같은 순 같은 동료는 한 번 · 선물은 골드가 들고 순마다 한 번', () => {
  const s = createGame();
  const ap0 = s.ap.left;
  const r = dispatch(s, { type: 'bond.talk', id: 'luna' });
  assert.ok(r.ok, r.reason);
  assert.ok(r.gain >= B.TALK && r.gain <= B.TALK + B.TALK_RAND);
  assert.equal(s.ap.left, ap0 - 1);
  assert.equal(s.affinity.luna, r.gain);
  assert.match(dispatch(s, { type: 'bond.talk', id: 'luna' }).reason, /이미/);
  assert.equal(s.ap.left, ap0 - 1, '거절된 대화는 행동력을 쓰지 않는다');

  s.gold = 1000; // 테스트 준비
  const g = BONDS.moka.gift;
  assert.ok(dispatch(s, { type: 'bond.gift', id: 'moka', giftId: g.id }).ok);
  assert.equal(s.gold, 1000 - g.cost);
  assert.equal(s.affinity.moka, B.GIFT_LIKED);
  assert.match(dispatch(s, { type: 'bond.gift', id: 'moka', giftId: 'moon_bun' }).reason, /이미/);
  assert.equal(dispatch(s, { type: 'bond.gift', id: 'luna', giftId: 'nope' }).ok, false);
});

test('능력: 단계를 넘으면 재료값·환전·사냥 HP 에 붙고, 인연 이야기는 달 이야기 뒤에 나온다', () => {
  const s = createGame();
  s.gold = 10000; // 테스트 준비
  s.affinity = { neo: B.TIERS[0], luna: 0, luna_sis: B.TIERS[2], moka: B.TIERS[0] };
  const fx = bondFx(s.affinity);
  assert.equal(fx.huntHp, 20);
  assert.equal(fx.discount, 0.05);
  assert.equal(fx.moonRate, 0.1);

  const gold0 = s.gold;
  assert.ok(dispatch(s, { type: 'shop.buy', ingredientId: 'bean', qty: 10 }).ok);
  assert.equal(gold0 - s.gold, Math.ceil(30 * 10 * 0.95));
  assert.equal(s.affinity.moka, B.TIERS[0] + B.WORK_SHOP, '준비 중 첫 구매는 모카와 함께 일한 몫');
  dispatch(s, { type: 'shop.buy', ingredientId: 'bean', qty: 1 });
  assert.equal(s.affinity.moka, B.TIERS[0] + B.WORK_SHOP, '순마다 한 번');

  s.moonstone = 10;
  const r = dispatch(s, { type: 'moonstone.exchange', qty: 10 });
  assert.equal(r.gold, Math.floor(10 * TEMP.MOONSTONE_GOLD * 1.1));

  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.equal(s.hunt.maxHp, TEMP.HUNT.PLAYER_HP + 20);
  dispatch(s, { type: 'hunt.retreat' });
  dispatch(s, { type: 'hunt.finish' });

  assert.equal(pendingStory(s), 'm0', '달 이야기가 먼저');
  dispatch(s, { type: 'story.seen', id: 'm0' });
  assert.equal(pendingStory(s), 'bond:neo:1');
  dispatch(s, { type: 'story.seen', id: 'bond:neo:1' });
  assert.equal(pendingStory(s), 'bond:luna_sis:1');
});
