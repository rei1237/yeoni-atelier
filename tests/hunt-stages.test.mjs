// 사냥 단계: 단계별 적 종류, 보스 보장·클리어 1회, 희귀 상자 고정, 후퇴 카드 보존, 보스 페이즈
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/hunt-kit.js';
import { stageDef, stageAllows, bossFor } from '../src/data/hunt-stages.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { getHuntWorld, spawnEnemy, findBoss } from '../src/game/hunt.js';
import { stepBoss, initBoss } from '../src/game/hunt-boss.js';
import { serialize, deserialize } from '../src/core/save.js';
import { pendingStory, calendarOf } from '../src/game/calendar.js';
import { hiddenGuestQuest } from '../src/game/hidden-guest.js';
import { recruitView } from '../src/game/economy.js';
import { HANBI_STORIES } from '../src/story/hanbi.js';

// 저장 → 불러오기 → 이어하기(사냥 중 저장은 일시정지로 열린다)
const roundTrip = s => { const r = deserialize(serialize(s)); assert.ok(r.ok, r.reason); dispatch(r.state, { type: 'resume' }); return r.state; };
function start(depth = 1, seed = 3) {
  const s = createGame({ seed });
  s.hostbar.open = true; s.huntUnlocked = true; s.hunter.maxStage = Math.max(depth, 1); // 테스트 준비
  assert.ok(dispatch(s, { type: 'hunt.start', depth }).ok);
  return s;
}
const alive = s => { const w = getHuntWorld(s); return w.enemies.items.slice(0, w.enemies.count); };
// 카드는 첫 장, 상자는 바로 열며 클리어 선택이 뜰 때까지 진행
function untilClear(s, maxMs = 600000) {
  const end = s.hunt.elapsedMs + maxMs;
  while (s.hunt.status === 'running' && !s.hunt.stageChoice && s.hunt.elapsedMs < end) {
    tick(s, 500, { input: { x: 0.4, y: 0.2 } });
    while (s.hunt.picks.length) dispatch(s, { type: 'hunt.pick', index: 0 });
    while (s.hunt.chests.length) dispatch(s, { type: 'hunt.chest' });
  }
}

test('적 종류는 경과 시간이 아니라 단계로만 열린다(모든 생성 경로 공통)', () => {
  const gates = { 1: ['shade_hand', 'rabbit_scout'], 2: ['shade_bat'], 6: ['shade_blob'], 21: ['blue_rabbit', 'elite_hand'], 40: ['moon_bomber'], 80: ['shade_thorn'], 85: ['heukwol_fragment'] };
  for (const n of [1, 2, 5, 20, 40, 79, 80, 100]) {
    const s = start(n);
    s.hunt.elapsedMs = 3_600_000; // 한 시간이 지나도 단계 밖 적은 나오지 않는다
    const w = getHuntWorld(s);
    for (const [from, types] of Object.entries(gates)) for (const type of types) {
      assert.equal(stageAllows(n, type), n >= +from, `${n}단계 ${type}`);
      const e = spawnEnemy(s, w, type, 0, 0);
      assert.equal(!!e, n >= +from, `${n}단계 생성 ${type}`);
    }
  }
  // 깊은 단계를 실제로 돌려도(사건·보스 소환 포함) 허용 종류만 있다
  const s = start(40);
  s.hunt.hp = s.hunt.maxHp = 1e9; // 테스트 준비
  for (let k = 0; k < 400; k++) {
    tick(s, 500, { input: { x: 0, y: 0 } });
    while (s.hunt.picks.length) dispatch(s, { type: 'hunt.pick', index: 0 });
    while (s.hunt.chests.length) dispatch(s, { type: 'hunt.chest' });
    if (s.hunt.stageChoice) break;
    const mobs = alive(s).filter(e => !ENEMIES[e.type].boss);
    assert.ok(mobs.every(e => stageAllows(40, e.type)), mobs.map(e => e.type).join());
    assert.ok(mobs.length <= stageDef(40).cap + 2, `상한 ${mobs.length}`);
  }
});

test('준비 시간이 끝나면 보스가 반드시 나오고, 처치해야 클리어(첫 클리어 보상은 한 번만)', () => {
  const s = start(1);
  s.hunt.hp = s.hunt.maxHp = 1e9; // 테스트 준비
  // 잡몹이 상한까지 차 있어도 보스는 나온다
  const w = getHuntWorld(s);
  for (let k = 0; k < 40; k++) spawnEnemy(s, w, 'shade_hand', 2000 + k, 2000);
  s.hunt.stageMs = stageDef(1).prepMs - 10;
  tick(s, 100, { input: { x: 0, y: 0 } });
  assert.ok(findBoss(w) >= 0, '보스 생성');
  assert.equal(alive(s).find(e => ENEMIES[e.type].boss).type, bossFor(1));
  assert.ok(s.hunt.boss && s.hunt.boss.hp > 0);
  untilClear(s);
  assert.ok(s.hunt.stageChoice?.first);
  const moon = s.hunt.bag.moonstone;
  assert.equal(s.hunter.maxStage, 2);
  // 같은 단계를 다시 깨면 해금·보상이 겹치지 않는다
  dispatch(s, { type: 'hunt.retreat' }); dispatch(s, { type: 'hunt.finish' });
  const again = roundTrip(s);
  again.ap.left = 3; // 테스트 준비
  assert.ok(dispatch(again, { type: 'hunt.start', depth: 1 }).ok);
  again.hunt.hp = again.hunt.maxHp = 1e9;
  again.hunt.stageMs = stageDef(1).prepMs;
  untilClear(again);
  assert.equal(again.hunt.stageChoice.first, false);
  assert.equal(again.hunt.stageChoice.bonus, 0);
  assert.equal(again.hunter.maxStage, 2);
  assert.ok(moon > 0);
});

test('보스 HP 와 페이즈는 이어하기로 전장을 새로 만들어도 유지된다', () => {
  const s = start(1);
  s.hunt.hp = s.hunt.maxHp = 1e9;
  s.hunt.stageMs = stageDef(1).prepMs;
  tick(s, 100, { input: { x: 0, y: 0 } });
  s.hunt.boss.hp = 123; // 테스트 준비: 깎인 HP
  const r = roundTrip(s);
  tick(r, 100, { input: { x: 0, y: 0 } });
  const b = alive(r).find(e => ENEMIES[e.type].boss);
  assert.ok(b && b.hp <= 123 && b.maxHp === s.hunt.boss.maxHp);
});

test('희귀 상자: 줍는 순간 결과가 정해져 저장되고, 보유 무기만 강화하며 최대면 월정석으로 바꾼다', () => {
  const s = start(1);
  const w = getHuntWorld(s), p = w.player;
  Object.assign(w.drops.spawn(), { kind: 'chest', id: 'chest', v: 0, x: p.x, y: p.y, speed: 0, magnet: false });
  tick(s, 100, { input: { x: 0, y: 0 } });
  assert.equal(s.hunt.chests.length, 1);
  const c = structuredClone(s.hunt.chests[0]);
  assert.deepEqual(c.upgrade, { kind: 'weapon', id: 'bolt' }, '보유한 것만 고른다');
  const t0 = s.hunt.elapsedMs; tick(s, 1000, { input: { x: 0, y: 0 } });
  assert.equal(s.hunt.elapsedMs, t0, '열기 전에는 시간이 멈춘다');
  const r = roundTrip(s);
  assert.deepEqual(r.hunt.chests[0], c, '재접속해도 다시 뽑지 않는다');
  const lv = r.hunt.weapons[0].level, moon = r.hunt.bag.moonstone || 0;
  const res = dispatch(r, { type: 'hunt.chest' });
  assert.ok(res.ok);
  assert.equal(r.hunt.weapons[0].level, lv + 1);
  assert.equal(r.hunt.bag.moonstone, moon + c.moon);
  // 고른 무기가 그 사이 최대가 되면 월정석으로 바꾼다
  r.hunt.chests.push({ ...c, id: 'x' }); r.hunt.weapons[0].level = 8;
  const m2 = r.hunt.bag.moonstone;
  dispatch(r, { type: 'hunt.chest' });
  assert.equal(r.hunt.weapons[0].level, 8);
  assert.ok(r.hunt.bag.moonstone > m2 + c.moon - 1);
});

test('후퇴해도 고르지 않은 레벨업 카드는 다음 사냥으로 넘어가고, 정산은 한 번만', () => {
  const s = start(1);
  s.hunt.picks.push([{ kind: 'passive', id: 'paw' }]);
  assert.ok(dispatch(s, { type: 'hunt.retreat' }).ok);
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(dispatch(s, { type: 'hunt.finish' }).ok, false);
  assert.equal(s.hunter.builds.neo.picks.length, 1);
  s.ap.left = 3; // 테스트 준비
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.equal(s.hunt.picks.length, 1);
  assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
  assert.equal(s.hunt.passives.paw, 1);
});

test('보스 페이즈가 바뀌면 남은 예고·탄을 지우고 회복 시간을 둔다', () => {
  const s = start(1);
  const w = { player: { x: 0, y: 0, hurtUntil: 0 }, hostile: [{ x: 1 }], zones: [{ kind: 'circle', x: 0, y: 0, r: 10, at: 0, until: 9e9, dmg: 5 }], fx: [], enemies: { count: 0, items: [] } };
  const e = { type: 'boss_hanbi', x: 900, y: 900, hp: 2600 * .5, maxHp: 2600, uid: 1 };
  initBoss(e, 0);
  const phase = stepBoss(s, w, e, 100, 34, () => null);
  assert.equal(phase, 1);
  assert.equal(w.hostile.length, 0);
  assert.equal(w.zones.length, 0);
  assert.equal(e.taskPhase, 'recover');
  assert.ok(e.taskUntil >= 100 + 2000);
});

test('검은 호랑이 사건은 네오 클리어 순서대로만 열리고, 100단계 뒤에야 이름이 드러나며 영입은 한 번', () => {
  let s = createGame();
  s.huntUnlocked = true; s.ledger.story['ev:hunt'] = true; s.ledger.story['m' + calendarOf(s.day).monthIdx] = true; // 테스트 준비: 달 이야기는 이미 봤다
  const seen = id => dispatch(s, { type: 'story.seen', id }).ok;
  assert.equal(pendingStory(s), null);
  s.ledger.rewards['stage:seohanbi:30'] = true;
  assert.equal(pendingStory(s), null, '네오가 아닌 클리어로는 열리지 않는다');
  s.ledger.rewards['stage:neo:30'] = s.ledger.rewards['stage:neo:40'] = true;
  assert.equal(pendingStory(s), 'hanbi:30');
  assert.equal(seen('hanbi:40'), false, '순서를 건너뛸 수 없다');
  assert.ok(seen('hanbi:30')); assert.equal(pendingStory(s), 'hanbi:40'); assert.ok(seen('hanbi:40'));
  for (const n of [50, 70]) { s.ledger.rewards['stage:neo:' + n] = true; assert.ok(seen('hanbi:' + n)); }
  assert.equal(hiddenGuestQuest(s).ready, false);
  assert.equal(recruitView(s).find(v => v.id === 'seohanbi').status, 'locked');
  assert.equal(dispatch(s, { type: 'recruit.complete', id: 'seohanbi' }).ok, false);
  // 100단계 전 사건·단서에는 이름과 사람 모습이 없다
  const early = [30, 40, 50, 70].flatMap(n => HANBI_STORIES[n]);
  assert.ok(early.every(b => !/서한비/.test(JSON.stringify(b)) && b.s !== 'seohanbi' && !/(^|")seohanbi:/.test(JSON.stringify(b))));
  assert.ok(hiddenGuestQuest(s).steps.every(x => !/서한비/.test(x.text)));
  s.ledger.rewards['stage:neo:100'] = true;
  assert.ok(seen('hanbi:100'));
  assert.ok(HANBI_STORIES[100].some(b => b.s === 'seohanbi'));
  assert.ok(hiddenGuestQuest(s).ready);
  assert.equal(recruitView(s).find(v => v.id === 'seohanbi').status, 'available', '연차와 무관하게 100단계 사건 뒤 영입');
  assert.ok(dispatch(s, { type: 'recruit.complete', id: 'seohanbi' }).ok);
  s = deserialize(serialize(s)).state;
  assert.equal(dispatch(s, { type: 'recruit.complete', id: 'seohanbi' }).ok, false, '영입은 한 번');
  assert.ok(s.roster.seohanbi);
  assert.equal(pendingStory(s)?.startsWith('hanbi:') ?? false, false);
  assert.equal(bossFor(100, 'neo', true), 'boss_core', '합류 뒤 100단계는 흑월의 핵');
});
