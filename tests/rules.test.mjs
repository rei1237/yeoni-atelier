// 공식·상한·시작 명단 (순수 함수 + 새 게임 상태)
import test from 'node:test';
import assert from 'node:assert/strict';
import { NEO_STATS, CORE_CAP } from '../src/config/rules.js';
import { PDF } from '../src/config/balance.pdf.js';
import { hostingScore, gradeOf, tipFor, feverGainFor, assertGradeInvariant } from '../src/game/satisfaction.js';
import { createGame, usableHosts, isUsableHost } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';

const prefs = id => PDF.PROFILES.find(p => p.id === id).prefs;

test('새 게임: 접대 가능한 동료는 네오 한 명', () => {
  for (const dev of [false, true]) {
    const s = createGame({ dev });
    assert.deepEqual(Object.keys(s.roster), ['neo']);
    assert.deepEqual(usableHosts(s), ['neo']);
    assert.equal(s.people.neo.activity, 'idle');
    assert.equal(s.people.neo.form, 'human');
    assert.ok(dispatch(s, { type: 'shift.start' }).ok);
    assert.deepEqual(Object.keys(s.staff).sort(), ['neo', 'yeoni']);
  }
  // 개발용 임시 동료는 일반 게임의 영입 후보에도 없다
  const normal = createGame();
  assert.equal(isUsableHost(normal, 'dev_temp_01'), false);
  assert.deepEqual(normal.recruitment, {});
});

test('외모 중심(10/25/5/60) + 네오 → M = 92, H = 92, 매우 만족', () => {
  assert.deepEqual(prefs('looks'), { empathy: 10, talk: 25, fun: 5, looks: 60 });
  const r = hostingScore({ stats: NEO_STATS, prefs: prefs('looks') });
  assert.equal(r.M, 92);
  assert.equal(r.H, 92);
  assert.equal(r.capped, false);
  assert.equal(gradeOf(r.H).label, '매우 만족');
});

test('재미 60% 요청은 H ≤ 39 (대화 보정 최대여도)', () => {
  const r = hostingScore({ stats: NEO_STATS, prefs: prefs('fun'), talkBonus: 5 });
  assert.equal(r.capped, true);
  assert.deepEqual(r.failures, ['fun']);
  assert.ok(r.H <= CORE_CAP.H_MAX, `H=${r.H}`);
});

test('혼합(0/30/40/30): M = 60 이지만 재미 40% 핵심 조건 미충족 → H ≤ 39', () => {
  assert.deepEqual(prefs('funmix'), { empathy: 0, talk: 30, fun: 40, looks: 30 });
  const r = hostingScore({ stats: NEO_STATS, prefs: prefs('funmix'), talkBonus: 5 });
  assert.equal(r.M, 60);
  assert.equal(r.capped, true);
  assert.equal(r.H, 39);
  assert.notEqual(gradeOf(r.H).id, 'good');
});

test('음식·의상·인테리어·피버 값을 넘겨도 상한은 그대로 (공식에 입력 경로 없음)', () => {
  const base = hostingScore({ stats: NEO_STATS, prefs: prefs('funmix') });
  const withExtras = hostingScore({ stats: NEO_STATS, prefs: prefs('funmix'), food: 100, outfit: 'vest_night', ambience: 99, fevered: true });
  assert.deepEqual(withExtras, base);
  // 피버는 팁만 두 배로 만들고, 상한에 걸린 H 로는 팁 자체가 0
  assert.deepEqual(tipFor({ servedTotal: 5000, H: base.H, completedFull: true, fevered: true }), { base: 0, feverExtra: 0, total: 0 });
});

test('지명 대기 불만은 0~20, 대화 보정은 -5~5 로 잘린다', () => {
  const r = hostingScore({ stats: NEO_STATS, prefs: prefs('looks'), talkBonus: 50, waitPenalty: 99 });
  assert.equal(r.talkBonus, 5);
  assert.equal(r.waitPenalty, 20);
  assert.equal(r.H0, 92 + 5 - 20);
});

test('판정 구간 80/60/40, 팁·피버 적립 공식', () => {
  assert.equal(gradeOf(80).id, 'great');
  assert.equal(gradeOf(79.9).id, 'good');
  assert.equal(gradeOf(60).id, 'good');
  assert.equal(gradeOf(59.9).id, 'meh');
  assert.equal(gradeOf(40).id, 'meh');
  assert.equal(gradeOf(39).id, 'bad');
  assert.doesNotThrow(() => assertGradeInvariant());
  assert.throws(() => assertGradeInvariant({ great: 80, good: 35, meh: 20 }));

  // floor(served × 0.4 × (H-50)/50): 1000원, H 92 → floor(1000×0.4×0.84) = 336
  assert.deepEqual(tipFor({ servedTotal: 1000, H: 92, completedFull: true, fevered: false }), { base: 336, feverExtra: 0, total: 336 });
  assert.deepEqual(tipFor({ servedTotal: 1000, H: 92, completedFull: true, fevered: true }), { base: 336, feverExtra: 336, total: 672 });
  assert.equal(tipFor({ servedTotal: 1000, H: 92, completedFull: false, fevered: true }).total, 0, '300초 미달 → 팁 없음');
  assert.equal(tipFor({ servedTotal: 1000, H: 59, completedFull: true, fevered: false }).total, 0, 'H < 60 → 팁 없음');

  assert.equal(feverGainFor(92), 24);
  assert.equal(feverGainFor(85), 20);
  assert.equal(feverGainFor(60), 12);
  assert.equal(feverGainFor(59), 0);
});
