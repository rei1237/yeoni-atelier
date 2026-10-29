// 사냥 단계: 단계별 적 종류, 보스 보장·클리어 1회, 희귀 상자 고정, 후퇴 카드 보존, 보스 페이즈
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/hunt-kit.js';
import { stageDef, stageAllows, bossFor } from '../src/data/hunt-stages.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { getHuntWorld, spawnEnemy, findBoss, optionsFor, mods, describeOption } from '../src/game/hunt.js';
import { skillCost, skillRank, techLevel, evoKnown } from '../src/game/moka-armory.js';
import { placeLock } from '../src/game/unlocks.js';
import { hunterProgress, huntMoonReward } from '../src/game/hunt-growth.js';
import { TEMP } from '../src/config/balance.temp.js';
import { stepBoss, initBoss, BOSS_TASKS, warnMs, bossPhaseOf, isEnraged, zoneHits } from '../src/game/hunt-boss.js';
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
function untilClear(s, maxMs = 600000, input = { x: 0.4, y: 0.2 }) {
  const end = s.hunt.elapsedMs + maxMs;
  while (s.hunt.status === 'running' && !s.hunt.stageChoice && s.hunt.elapsedMs < end) {
    tick(s, 500, { input });
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
  // 끝없는 들판이라 한 방향으로만 달리면 보스가 못 따라온다. 제자리에서 상대한다
  untilClear(s, 600000, { x: 0, y: 0 });
  assert.ok(s.hunt.stageChoice?.first);
  const moon = s.hunt.bag.moonstone;
  assert.equal(s.hunter.maxStage, 2);
  // 같은 단계를 다시 깨면 해금·보상이 겹치지 않는다
  dispatch(s, { type: 'hunt.retreat' }); dispatch(s, { type: 'hunt.finish' });
  const again = roundTrip(s);
  again.day++; again.ap.left = 3; // 다음 게임 날짜의 재도전
  assert.ok(dispatch(again, { type: 'hunt.start', depth: 1 }).ok);
  again.hunt.hp = again.hunt.maxHp = 1e9;
  again.hunt.stageMs = stageDef(1).prepMs;
  untilClear(again, 600000, { x: 0, y: 0 });
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
  s.day++; s.ap.left = 3; // 다음 게임 날짜의 재도전
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

test('기술 단련: 새 게임은 기본 4종만, 단련 상한까지만 오르고 상한이면 회복 대신 월정석 주머니', () => {
  const s = start(1);
  const ids = optionsFor(s.hunt).map(o => o.id);
  assert.ok(ids.length && ids.every(id => ['bolt', 'orbit', 'paw', 'fish_stock'].includes(id)), ids.join());
  assert.equal(s.hunt.caps.bolt, 3, '공용 상한 기본 → 무기 Lv3까지'); assert.equal(s.hunt.caps.paw, 2, '보조 Lv2까지');
  s.hunt.weapons = [{ id: 'bolt', level: 3, evo: false }, { id: 'orbit', level: 3, evo: false }];
  s.hunt.passives = { paw: 2, fish_stock: 2 }; // 테스트 준비: 모두 상한
  assert.deepEqual(optionsFor(s.hunt), []);
  s.hunt.xp = s.hunt.xpNext - 1; const w = getHuntWorld(s);
  w.drops.items[w.drops.count++] = { kind: 'gem', id: '', v: 5, x: w.player.x, y: w.player.y, speed: 0, magnet: false };
  tick(s, 200, { input: { x: 0, y: 0 } });
  assert.deepEqual(s.hunt.picks[0], [{ kind: 'pouch' }]);
  const m = s.hunt.bag.moonstone, hp = s.hunt.hp;
  assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
  assert.equal(s.hunt.bag.moonstone, m + huntMoonReward(TEMP.HUNT_SKILLS.POUCH, s.hunt.scale));
  assert.ok(s.hunt.hp <= hp, '회복하지 않는다');
  assert.ok(!TEMP.HUNT.POWER_DROP.some(d => d.id === 'fish'), '10-28: 회복 생선은 일반 적이 떨구지 않는다');
});

test('공방 연구: armory.learn은 배우기만, armory.tech는 무기·보조 상한을 공용으로 올리고 진화 비전은 무기마다 열며 잠김·부족·도달 단계·끝을 거절한다', () => {
  const s = createGame({ seed: 5 }); s.huntUnlocked = true;
  s.moonstone = 99999;
  assert.equal(dispatch(s, { type: 'armory.learn', id: 'crescent' }).reason, placeLock(s, 'gear'));
  assert.equal(dispatch(s, { type: 'armory.tech', line: 'forge' }).reason, placeLock(s, 'gear'));
  s.hunter.maxStage = 7; s.moonstone = skillCost('crescent') - 1; // 테스트 준비: 6단계를 클리어해 공방이 열렸다
  assert.equal(dispatch(s, { type: 'armory.learn', id: 'crescent' }).ok, false);
  assert.equal(s.moonstone, skillCost('crescent') - 1, '실패 시 차감 없음');
  s.moonstone += 1;
  const r = dispatch(s, { type: 'armory.learn', id: 'crescent' });
  assert.ok(r.ok && r.rank === 1 && s.moonstone === 0 && r.cost === TEMP.HUNT_SKILLS.LEARN.crescent);
  assert.ok(r.events.some(e => e.type === 'skillLearned'));
  assert.ok(TEMP.HUNT_SKILLS.LEARN.tarot < 4000, '10-28: 배우기 값을 낮췄다');
  s.moonstone = 1e6;
  assert.equal(dispatch(s, { type: 'armory.learn', id: 'crescent' }).ok, false, '이미 배운 기술');
  assert.ok(dispatch(s, { type: 'armory.learn', id: 'bell' }).ok);
  const T = TEMP.HUNT_SKILLS.TECH, before = s.moonstone, up = dispatch(s, { type: 'armory.tech', line: 'forge' });
  assert.ok(up.ok && up.level === 1 && s.moonstone === before - T.forge.cost[0]);
  assert.ok(up.events.some(e => e.type === 'techResearched' && e.weapon === 4 && e.passive === 2), '무기 상한만 오른다');
  assert.match(dispatch(s, { type: 'armory.tech', line: 'forge' }).reason, /12단계/, '도달 단계가 모자라면 거절');
  assert.match(dispatch(s, { type: 'armory.tech', line: 'evo', id: 'bolt' }).reason, /무기 상한 해방/, '진화 비전은 무기 상한을 끝까지 연 뒤');
  s.hunter.maxStage = 14; // 테스트 준비: 13단계까지 클리어
  assert.ok(dispatch(s, { type: 'armory.tech', line: 'forge' }).ok); assert.ok(dispatch(s, { type: 'armory.tech', line: 'charm' }).ok);
  assert.equal(dispatch(s, { type: 'armory.tech', line: 'forge' }).ok, false, '끝까지 연구');
  assert.match(dispatch(s, { type: 'armory.tech', line: 'evo', id: 'tarot' }).reason, /배워/, '못 배운 무기의 진화는 거절');
  const m = s.moonstone, ev = dispatch(s, { type: 'armory.tech', line: 'evo', id: 'crescent' });
  assert.ok(ev.ok && s.moonstone === m - T.evo.cost[0] && evoKnown(s, 'crescent') && !evoKnown(s, 'bolt'));
  assert.match(dispatch(s, { type: 'armory.tech', line: 'evo', id: 'bolt' }).reason, new RegExp(`${T.evo.stage[1]}단계`), '두 번째 비전은 더 깊은 단계');
  assert.ok(T.evo.cost.every((c, i) => !i || c > T.evo.cost[i - 1]), '진화 비전은 갈수록 비싸다');
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 1 }).ok);
  assert.equal(s.hunt.caps.crescent, 5); assert.equal(s.hunt.caps.bolt, 5); assert.equal(s.hunt.caps.bell, 3); assert.equal(s.hunt.caps.tarot, 0);
  assert.ok(s.hunt.evoOk.crescent && !s.hunt.evoOk.bolt);
  assert.ok(optionsFor(s.hunt).some(o => o.id === 'crescent') && !optionsFor(s.hunt).some(o => o.id === 'tarot'));
});

test('진화 비전이 없는 무기는 Lv 최대와 짝 보조 능력이 있어도 진화하지 않는다', () => {
  const s = createGame({ seed: 8 }); s.huntUnlocked = true; s.hunter.maxStage = 7;
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 1 }).ok);
  const hs = s.hunt; hs.caps.bolt = 5; hs.caps.bell = 3; hs.weapons = [{ id: 'bolt', level: 4, evo: false }]; hs.passives = { bell: 1 };
  assert.match(describeOption(hs, { kind: 'weapon', id: 'bolt' }).text, /진화 비전/);
  hs.picks = [[{ kind: 'weapon', id: 'bolt' }]];
  assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
  assert.equal(hs.weapons[0].level, 5); assert.equal(hs.weapons[0].evo, false);
});

test('기술 단련 이전 저장: 빌드에 있던 기술·레벨은 그만큼 단련된 것으로 남고, 성장 보너스는 Lv10에서 멈춘다', () => {
  const s = createGame({ seed: 6 }); s.huntUnlocked = true;
  s.hunter.builds = { neo: { level: 9, xp: 0, weapons: [{ id: 'bolt', level: 5, evo: true }, { id: 'tarot', level: 3, evo: false }], passives: { bell: 2 }, picks: [], stage: 4 } };
  delete s.armory.skills; delete s.armory.tech; // 테스트 준비: 단련·공용 상한 이전 저장
  const r = deserialize(serialize(s)).state;
  assert.equal(skillRank(r, 'bolt'), 4); assert.equal(skillRank(r, 'tarot'), 2); assert.equal(skillRank(r, 'bell'), 2); assert.equal(skillRank(r, 'orbit'), 1);
  assert.equal(techLevel(r, 'forge'), 2, '기술별로 풀어 둔 가장 높은 상한(무기 Lv5)을 무기 상한 연구로 이어받는다');
  assert.equal(techLevel(r, 'charm'), 1); assert.ok(evoKnown(r, 'bolt') && evoKnown(r, 'tarot'), '진화를 허용하던 옛 상한은 배운 무기의 진화 비전으로 이어진다');
  assert.ok(dispatch(r, { type: 'hunt.start', depth: 1 }).ok);
  assert.equal(r.hunt.weapons.find(w => w.id === 'tarot').level, 3, '빼앗지 않음');
  const gearAt = xp => { const g = createGame({ seed: 6 }); g.huntUnlocked = true; g.hunter.xp = xp; dispatch(g, { type: 'hunt.start', depth: 1 }); return g.hunt.maxHp; };
  const xpFor = lv => { let x = 0; while (hunterProgress(x).level < lv) x += 50; return x; };
  assert.equal(gearAt(xpFor(20)), gearAt(xpFor(10)));
  assert.ok(gearAt(xpFor(10)) > gearAt(0));
});

test('모카의 회복 수프는 3개까지만 챙긴다', () => {
  const s = createGame({ seed: 8 }); s.moonstone = 1000;
  for (let i = 0; i < 3; i++) assert.ok(dispatch(s, { type: 'armory.buy', id: 'tonic' }).ok);
  const m = s.moonstone, r = dispatch(s, { type: 'armory.buy', id: 'tonic' });
  assert.equal(r.ok, false); assert.equal(r.reason, '회복 수프는 3개까지만 챙길 수 있어요');
  assert.equal(s.moonstone, m); assert.equal(s.armory.supplies.tonic, 3);
});

test('한 번 출발에 3단계까지: 3단계 클리어 뒤 다음 단계는 거절되고 귀환·정산은 한 번', () => {
  const s = start(1);
  s.hunt.hp = s.hunt.maxHp = 1e9; // 테스트 준비
  for (let n = 1; n <= TEMP.HUNT.STAGES_PER_RUN; n++) {
    s.hunt.stageMs = stageDef(n).prepMs;
    untilClear(s, 600000, { x: 0, y: 0 });
    assert.equal(s.hunt.stageChoice?.stage, n);
    if (n < TEMP.HUNT.STAGES_PER_RUN) assert.ok(dispatch(s, { type: 'hunt.next' }).ok);
  }
  assert.equal(s.hunt.stageChoice.tired, true);
  assert.equal(s.hunt.stageChoice.next, false);
  const r = dispatch(s, { type: 'hunt.next' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, '오늘은 여기까지 · 다음 출발에 이어 가요');
  assert.equal(s.hunt.depth, 3);
  assert.equal(s.hunter.maxStage, 4, '다음 출발은 4단계부터 고를 수 있다');
  assert.ok(dispatch(s, { type: 'hunt.retreat' }).ok);
  const moon0 = s.moonstone, bag = s.hunt.bag.moonstone;
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  const paid = s.moonstone;
  assert.ok(paid >= moon0 + bag, '가방 월정석은 모두 받는다');
  assert.equal(dispatch(s, { type: 'hunt.finish' }).ok, false);
  assert.equal(s.moonstone, paid, '정산은 한 번');
  assert.deepEqual([1, 2, 3].map(n => s.ledger.rewards[`stage:neo:${n}`]), [true, true, true]);
});

// 보스 패턴 공정성: 예고 1.0초 이상, 격노 전환, 도넛 안쪽 안전, 탄막 빈틈
const BOSSES = Object.entries(ENEMIES).filter(([, d]) => d.boss);
test('모든 보스 패턴 예고는 격노·두 번째 돌진까지 1.0초 이상이다', () => {
  for (const [id, def] of BOSSES) def.phases.forEach((ph, n) => {
    for (const task of ph.tasks) {
      assert.ok(BOSS_TASKS[task], `${id} ${task}`);
      assert.ok(warnMs(def, n, task) >= 1000, `${id} ${n} ${task}`);
      if (BOSS_TASKS[task].warn2) assert.ok(warnMs(def, n, task, true) >= 1000, `${id} ${task} 2nd`);
    }
  });
});
test('일반 보스는 체력 50% 아래에서 격노 페이즈로 바뀐다', () => {
  for (const [id, def] of BOSSES.filter(([id]) => id !== 'boss_hanbi')) {
    assert.equal(bossPhaseOf(def, .51), 0, id);
    const n = bossPhaseOf(def, .49);
    assert.ok(n > 0 && isEnraged(def, n), id);
  }
});
test('ring 구역은 안쪽 r0 에서 피해가 없고 고리 띠에서만 맞는다', () => {
  const z = { kind: 'ring', x: 0, y: 0, r0: 130, r: 250 };
  assert.equal(zoneHits(z, 0, 0), false);
  assert.equal(zoneHits(z, 100, 0), false);
  assert.equal(zoneHits(z, 190, 0), true);
  assert.equal(zoneHits(z, 300, 0), false);
});
test('fan·barrage 탄막에는 지나갈 빈틈이 있다', () => {
  const s = createGame({ seed: 7 });
  const fire = (task, idx) => {
    const w = { player: { x: 0, y: 600 }, hostile: [], zones: [], fx: [], enemies: { count: 0, items: [] } };
    const e = { type: 'boss_core', x: 0, y: 0, hp: 100, maxHp: 100 };
    initBoss(e, 0); e.taskIdx = idx;
    stepBoss(s, w, e, 2200, 16, () => {});
    assert.equal(e.task, task);
    stepBoss(s, w, e, 2200 + warnMs(ENEMIES.boss_core, 0, task), 16, () => {});
    return w.hostile.map(b => Math.atan2(b.vy, b.vx)).sort((a, b) => a - b);
  };
  const fan = fire('fan', 3), F = BOSS_TASKS.fan;
  assert.equal(fan.length, F.slots - F.gaps);
  const bar = fire('barrage', 0), B = BOSS_TASKS.barrage;
  assert.ok(bar.length <= B.slots - B.gaps * 2);
  const gaps = bar.map((a, i) => ((bar[(i + 1) % bar.length] - a) + Math.PI * 2) % (Math.PI * 2));
  assert.ok(Math.max(...gaps) >= Math.PI * 2 / B.slots * 2.5, '원형 탄막 빈틈');
});

test('개다래 열매: 주우면 정해진 시간 동안 공격력·이동 속도가 오르고 끝나면 돌아온다', () => {
  const s = start(1); const w = getHuntWorld(s), p = w.player, C = TEMP.HUNT.CATNIP;
  assert.ok(TEMP.HUNT.POWER_DROP.some(d => d.id === 'catnip') && !TEMP.HUNT.POWER_DROP.some(d => d.id === 'magnet'));
  w.enemies.count = 0; const base = mods(s.hunt);
  Object.assign(w.drops.spawn(), { kind: 'catnip', id: 'catnip', v: 0, x: p.x, y: p.y, speed: 0, magnet: false });
  tick(s, 100, { input: { x: 0, y: 0 } });
  const up = mods(s.hunt);
  assert.ok(Math.abs(up.dmg - base.dmg * (1 + C.dmg)) < 1e-9 && Math.abs(up.speed - base.speed * (1 + C.speed)) < 1e-9);
  s.hunt.elapsedMs = s.hunt.catnipUntil; // 테스트 준비: 시간 만료
  assert.equal(mods(s.hunt).dmg, base.dmg);
});

test('멀리 달아난 플레이어에게 보스는 예고 원 뒤 순간 도약해 거리를 없앤다', () => {
  const s = start(1);
  const w = { player: { x: 0, y: 900, hurtUntil: 0 }, hostile: [], zones: [], fx: [], enemies: { count: 0, items: [] } };
  const e = { type: 'boss_core', x: 0, y: 0, hp: 100, maxHp: 100, uid: 1 };
  initBoss(e, 0); e.taskPhase = 'recover'; e.taskUntil = 9e9;
  let t = 0;
  for (; t < BOSS_TASKS.blink.farMs; t += 50) stepBoss(s, w, e, t, 50, () => {});
  assert.equal(e.task, 'blink');
  assert.ok(w.zones.some(z => z.kind === 'circle' && z.x === 0 && z.y === 900 && z.dmg > 0), '착지 자리에 피해 예고 원');
  assert.ok(warnMs(ENEMIES.boss_core, 0, 'blink') >= 1000, '피할 시간은 남긴다');
  stepBoss(s, w, e, e.taskUntil, 16, () => {});
  assert.ok(Math.hypot(e.x - 0, e.y - 900) < 1, '한순간에 플레이어 자리로');
});
