// 달력: 순·달 진행, 하순 이자, 마지막 순 뒤 결말, 행동력
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame as newGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { calendarOf as newCalendarOf, dateLabel, decideEnding, pendingStory } from '../src/game/calendar.js';
import { serialize, deserialize } from '../src/core/save.js';
import { tickTo } from './helpers.mjs';

const C = {...TEMP.CALENDAR,TURNS_PER_MONTH:3,TOTAL_TURNS:72};
const createGame = (...args) => {const s=newGame(...args);s.calendar.turnsPerMonth=3;s.calendar.totalTurns=72;return s;};
const calendarOf = day => newCalendarOf(day,3);

// 손님 없이 한 순을 끝까지 돌리고 결산을 닫는다
function quietTurn(s) {
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99;
  s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  tickTo(s, RULES.SHIFT_MS);
  assert.ok(dispatch(s, { type: 'settlement.close' }).ok);
}

test('달력: 3순이 한 달, 3월 상순에서 시작해 2년 뒤 2월 하순(72순)이 마지막 순', () => {
  assert.equal(C.TOTAL_TURNS, 72);
  assert.equal(createGame().calendar.totalTurns, 72);
  assert.deepEqual(calendarOf(1), { turn: 0, monthIdx: 0, part: 0, month: 3, year: 1 });
  assert.deepEqual(calendarOf(C.TOTAL_TURNS), { turn: 71, monthIdx: 23, part: 2, month: 2, year: 3 });
  assert.equal(dateLabel(createGame()), '운영 1년차 3월(묘월) 상순');
});

test('이자: 하순 영업을 마칠 때 한 번만, 남은 빚 × 이자율(올림)이 골드에서 나간다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  quietTurn(s);
  quietTurn(s);
  assert.deepEqual(s.ledger.interest, {}, '상순·중순에는 이자가 없다');
  const debt0 = s.debt;
  s.gold = 10000000; // 테스트 준비
  quietTurn(s);
  const rec = s.ledger.interest.m0;
  assert.equal(rec.due, Math.ceil(debt0 * C.INTEREST_RATE));
  assert.equal(rec.paid, rec.due);
  assert.equal(s.debt, debt0);
  // 같은 달은 다시 안 걷는다: 저장 왕복 후에도 원장 유지
  const back = deserialize(serialize(s));
  assert.ok(back.ok, back.reason);
  assert.deepEqual(back.state.ledger.interest.m0, rec);
});

test('이자: 골드가 모자라면 모자란 만큼 빚에 붙는다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.day = 3; // 테스트 준비: 3월 하순
  s.gold = 0;
  const debt0 = s.debt;
  quietTurn(s);
  const rec = s.ledger.interest.m0;
  assert.equal(rec.paid, 0);
  assert.equal(s.debt, debt0 + rec.due);
});

test('결말: 마지막 순 결산을 닫으면 한 번 정해지고, 이후는 후일담 영업', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.day = C.TOTAL_TURNS; // 테스트 준비: 2년차 2월 하순
  quietTurn(s);
  assert.equal(s.calendar.ended, true);
  assert.equal(s.calendar.endingId, 'extend');
  assert.equal(pendingStory(s), 'ending:extend');
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ending:extend' }).ok);
  assert.equal(pendingStory(s), null);
  assert.match(dateLabel(s), /^후일담/);
  // 후일담에는 이자도, 결말 재판정도 없다
  quietTurn(s);
  assert.equal(s.calendar.endingId, 'extend');
  assert.equal(Object.keys(s.ledger.interest).length, 1);
  // 후일담에도 인연 이야기는 열린다
  s.affinity.neo = TEMP.BONDS.TIERS[0]; s.bondRank.neo = TEMP.BONDS.PERK_RANKS[0]; // 테스트 준비
  assert.equal(pendingStory(s), 'bond:neo:1');

  const t = createGame();
  t.hostbar.open = true; t.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  t.debt = 0;
  assert.equal(decideEnding(t), 'clear');
  t.affinity = { neo: 420, luna: 400, luna_sis: 380, moka: 300 }; // 합계 1500(ENDING_BOND_BEST)
  assert.equal(decideEnding(t), 'grand');
});

test('행동력과 별개로 영냥이 사냥은 게임 날짜마다 1번, 결산을 닫아야 다시 열린다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.ok(dispatch(s, { type: 'hunt.retreat' }).ok);
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(s.ap.left,C.AP_PER_TURN-1);
  const r = dispatch(s, { type: 'hunt.start' });
  assert.equal(r.ok, false);
  assert.match(r.reason, /오늘 다녀왔어/);
  quietTurn(s);
  assert.equal(s.ap.left, C.AP_PER_TURN);
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
});

test('달 이야기: 매달 상순 준비 때 한 번, 잘못된 id 는 거절', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  assert.equal(pendingStory(s), 'm0');
  assert.equal(dispatch(s, { type: 'story.seen', id: '<script>' }).ok, false);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm0' }).ok);
  assert.equal(pendingStory(s), null);
  for (let i = 0; i < C.TURNS_PER_MONTH; i++) quietTurn(s);
  assert.equal(pendingStory(s), 'm1');
});

test('2년 이전: 첫 6개월 안의 옛 저장만 72순, 그 뒤 옛 저장은 180순을 유지하고 불러오자마자 결말이 나지 않는다', () => {
  const load = day => { const s = createGame(); s.day = day; delete s.calendar.totalTurns; const r = deserialize(serialize(s)); assert.ok(r.ok, r.reason); return r.state; };
  assert.equal(load(10).calendar.totalTurns, 72);
  const old = load(100); // 테스트 준비: 72순을 이미 넘긴 진행 중 저장
  assert.equal(old.calendar.totalTurns, C.LEGACY_TOTAL_TURNS);
  assert.equal(old.calendar.ended, false);
  assert.match(dateLabel(old), /^운영 3년차/);
  old.hostbar.open = true; old.huntUnlocked = true; // 테스트 준비
  quietTurn(old);
  assert.equal(old.calendar.ended, false, '옛 저장은 180순까지 이어 간다');
  const back = deserialize(serialize(old));
  assert.equal(back.state.calendar.totalTurns, C.LEGACY_TOTAL_TURNS, '한 번 정한 기간은 저장 왕복 후에도 같다');
});
