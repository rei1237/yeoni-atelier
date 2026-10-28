// 첫 원정 도시락 → 귀환 이야기 → 청토끼 환전 → 윤달 공방 첫 강화, 정예 드롭과 환전 화면
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { getHuntWorld, spawnEnemy } from '../src/game/hunt.js';
import { nearbyProps, fieldHash } from '../src/game/hunt-field.js';
import { upgradeCost } from '../src/game/moka-armory.js';
import { serialize, deserialize } from '../src/core/save.js';
import { sheetHtml } from '../src/ui/sheets.js';
import { TEMP } from '../src/config/balance.temp.js';

test('첫 원정은 도시락(회복 수프 1개)을 들고, 돌아오면 귀환 → 금융 센터 → 공방 첫 무료 강화로 이어진다', () => {
  const s = createGame(); s.ledger.story.m0 = true; s.stats.shiftsCompleted = 1; // 테스트 준비: 첫 영업을 마쳤다
  const lunch = dispatch(s, { type: 'story.seen', id: 'ev:hunt' });
  assert.equal(s.armory.supplies.tonic, 1);
  assert.ok(lunch.events.some(e => e.type === 'supplyGift'));
  assert.notEqual(pendingStory(s), 'ev:return', '아직 다녀오지 않았다');
  s.stats.huntsCompleted = 1; // 테스트 준비: 첫 사냥을 마치고 돌아왔다
  assert.equal(pendingStory(s), 'ev:return');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'ev:return' }).destination, 'finance');
  assert.equal(pendingStory(s), 'ev:forge');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'ev:forge' }).destination, 'gear');
  assert.equal(s.armory.supplies.tonic, 1, '도시락은 한 번만');
  s.moonstone = 0;
  const free = dispatch(s, { type: 'armory.enhance', who: 'neo', id: 'power' });
  assert.ok(free.ok, free.reason); assert.equal(free.cost, 0); assert.equal(s.moonstone, 0);
  assert.equal(dispatch(s, { type: 'armory.enhance', who: 'neo', id: 'power' }).ok, false, '무료는 한 번');
  s.moonstone = upgradeCost(s, 'neo', 'vitality');
  assert.ok(dispatch(s, { type: 'armory.enhance', who: 'neo', id: 'vitality' }).ok); assert.equal(s.moonstone, 0);
  const again = deserialize(serialize(s)).state;
  assert.ok(again.ledger.story['ev:forge']); assert.equal(again.armory.freeEnhance, 0);
});

test('여러 번 사냥한 기존 저장은 첫 귀환 장면을 건너뛴다', () => {
  const s = createGame(); s.ledger.story.m0 = true; s.ledger.story['ev:hunt'] = true; s.huntUnlocked = true; s.stats.huntsCompleted = 5;
  const r = deserialize(serialize(s)).state;
  assert.ok(r.ledger.story['ev:return'] && r.ledger.story['ev:forge']);
  assert.ok(!['ev:return', 'ev:forge'].includes(pendingStory(r)));
});

test('정예는 월정석과 함께 대개 구운 생선을, 드물게 별 상자를 남기고 필드 기물은 조금 줄었다', () => {
  const s = createGame({ seed: 7 }); s.hostbar.open = true; s.huntUnlocked = true; s.hunter.maxStage = 21; // 테스트 준비: 정예가 나오는 21단계까지 열었다
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 21 }).ok);
  const w = getHuntWorld(s), seen = { chest: 0, fish: 0, moon: 0 }, made = [];
  const spawn = w.drops.spawn.bind(w.drops); w.drops.spawn = () => { const d = spawn(); made.push(d); return d; }; // 줍기 전에 떨어진 것을 센다
  for (let i = 0; i < 40; i++) {
    made.length = 0;
    const e = spawnEnemy(s, w, 'elite_hand', w.player.x + 30, w.player.y); e.hp = 1; // 테스트 준비: 한 대면 쓰러진다
    w.player.hurtUntil = 1e12; for (let k = 0; k < 40 && w.enemies.items.slice(0, w.enemies.count).includes(e) && e.hp > 0; k++) tick(s, 100, { input: { x: 0, y: 0 } });
    for (const d of made) if (d.kind in seen) seen[d.kind] += 1;
    while (s.hunt.picks.length) dispatch(s, { type: 'hunt.pick', index: 0 });
    while (s.hunt.chests.length) dispatch(s, { type: 'hunt.chest' });
  }
  assert.ok(seen.moon >= 30, JSON.stringify(seen));
  assert.ok(seen.fish > seen.chest * 3, JSON.stringify(seen));
  assert.equal(TEMP.HUNT.MOON_DROP.boss, 45);
  // 필드 기물: 10칸 중 3칸은 비우고, 보상은 예전의 0.8배
  const hs = { depth: 10, fieldSeed: 3 }, props = nearbyProps(hs, { x: 0, y: 0 });
  for (const p of props) { const [x, y] = p.id.split(':').map(Number), h = fieldHash(x, y, 3); assert.ok(h % 10 >= 3); assert.equal(p.reward, Math.ceil((3 + h % 5) * (1 + 10 * .045) * .8)); }
  assert.ok(props.length < 25 && props.length > 0);
});

test('청토끼 환전은 10·100·1000·전부와 직접 입력, 받을 골드 미리보기를 보여 준다', () => {
  const s = createGame(); s.moonstone = 868;
  const html = sheetHtml(s, { sheet: { kind: 'town', tab: 'finance' }, exchangeQty: 100 });
  for (const label of ['10개', '100개', '1,000개', '전부']) assert.ok(html.includes(`>${label}<`), label);
  assert.match(html, /id="exchange-qty"[^>]*value="100"/);
  assert.match(html, /100개 환전하기/);
  const over = sheetHtml(s, { sheet: { kind: 'town', tab: 'finance' }, exchangeQty: 5000 });
  assert.match(over, /868개까지만/);
  const g = s.gold, r = dispatch(s, { type: 'moonstone.exchange', qty: 250 });
  assert.ok(r.ok); assert.equal(s.moonstone, 618); assert.equal(s.gold - g, r.gold);
});
