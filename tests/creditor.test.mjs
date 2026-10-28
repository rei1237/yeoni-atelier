// 청토끼 금융: 이자율 인상 일정·인상 장면·네오 성장(게임 오리지널, 수치 TEMP)
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame, hostStats } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { interestRate, nextHike, neoHikeBonus, interestDue, checkCreditor, creditorView, pendingCreditorStory } from '../src/game/creditor.js';
import { serialize, deserialize } from '../src/core/save.js';
import { tickTo } from './helpers.mjs';
import { ENDINGS } from '../src/story/months.js';
import { creditsScreen } from '../src/ui/credits.js';

const C = TEMP.CALENDAR;

function quietTurn(s) {
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99;
  s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  tickTo(s, RULES.SHIFT_MS);
  assert.ok(dispatch(s, { type: 'settlement.close' }).ok);
}

// 테스트 준비: 그달 상순 준비 화면, 달 이야기까지 본 상태
function atMonth(monthIdx) {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true;
  s.day = monthIdx * C.TURNS_PER_MONTH + 1;
  for (let m = 0; m <= monthIdx; m++) s.ledger.story[`m${m}`] = true;
  return s;
}

test('이자율: 솔브·밤비·루네·레이븐 합류 달에 3·4·5·6%로 오르고, 옛 180순 저장은 2% 고정', () => {
  const s = createGame();
  assert.deepEqual([0, 4, 5, 7, 8, 13, 14, 17, 18, 23].map(m => interestRate(s, m)), [0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05, 0.05, 0.06, 0.06]);
  assert.deepEqual(nextHike(s, 5), { monthIdx: 8, rate: 0.04 });
  assert.equal(nextHike(s, 18), null);
  const legacy = atMonth(20);
  legacy.calendar.totalTurns = C.LEGACY_TOTAL_TURNS;
  assert.equal(interestRate(legacy, 20), C.INTEREST_RATE);
  assert.equal(pendingStory(legacy), null, '옛 저장에는 인상 장면이 없다');
});

test('인상 장면: 달 이야기 다음에 한 번, 본 순간 네오 능력치가 한 번 오른다(저장 왕복 후에도)', () => {
  const s = atMonth(5);
  const before = { ...hostStats(s, 'neo') };
  assert.equal(pendingStory(s), 'rate:5');
  assert.ok(dispatch(s, { type: 'story.seen', id: 'rate:5' }).ok);
  assert.equal(s.ledger.rewards['hike:5:neo'], true);
  const after = hostStats(s, 'neo');
  assert.equal(after.empathy, before.empathy + C.HIKE_NEO.empathy);
  assert.equal(after.fun, before.fun + C.HIKE_NEO.fun);
  assert.equal(after.looks, 10, '능력치 상한은 10');
  assert.equal(neoHikeBonus(s).huntHp, C.HIKE_NEO.huntHp);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'rate:5' }).duplicate);
  const back = deserialize(serialize(s)).state;
  assert.deepEqual(hostStats(back, 'neo'), after, '두 번 보거나 불러와도 한 번만');
  assert.notEqual(pendingStory(back), 'rate:5');
});

test('인상 달 하순 이자는 새 이자율로 걷는다', () => {
  const s = atMonth(5);
  s.day += 2; s.gold = 100000000;
  const debt0 = s.debt;
  quietTurn(s);
  assert.equal(s.ledger.interest.m5.due, Math.ceil(debt0 * 0.03));
});

// 6-1 독촉: 하순(그달 셋째 순)에 골드 0으로 영업을 마쳐 이자를 미납시킨다
function closeLate(s, monthIdx, gold = 0) {
  s.day = monthIdx * C.TURNS_PER_MONTH + C.TURNS_PER_MONTH; s.gold = gold;
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99; s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  const t = tick(s, RULES.SHIFT_MS - s.shift.elapsedMs);
  const r = dispatch(s, { type: 'settlement.close' }); assert.ok(r.ok);
  return { events: [...t, ...(r.events || [])], rec: s.ledger.creditor[`m${monthIdx}`] };
}
function toUltimatum() {
  const s = atMonth(4);
  closeLate(s, 4);
  assert.equal(s.creditor.warnings, 0, '첫 약속 달 전에는 경고가 없다');
  assert.equal(closeLate(s, 5).rec.scene, 'warn:5');
  assert.equal(s.creditor.warnings, 1);
  assert.equal(closeLate(s, 6).rec.scene, 'ultimatum:6');
  return s;
}

test('독촉: 약속 달부터 미납 1회 → 경고, 연속 → 통첩(목표·기한 9순), 저장 왕복 뒤에도 한 번만', () => {
  const s = toUltimatum();
  const u = s.creditor.ultimatum;
  assert.equal(u.dueMonth, 9);
  assert.equal(u.target, s.repaidTotal + Math.ceil(TEMP.INITIAL_DEBT * C.ULTIMATUM_SHARE));
  assert.deepEqual(creditorView(s).ultimatum, { need: u.target - s.repaidTotal, dueMonth: 9, turnsLeft: 9 });
  assert.equal(pendingCreditorStory(s), 'warn:5');
  const back = deserialize(serialize(s)).state;
  assert.deepEqual(back.creditor, s.creditor);
  const again = checkCreditor(back, 6, back.ledger.interest.m6);
  assert.equal(again, back.ledger.creditor.m6, '같은 달은 다시 판정하지 않는다');
  assert.equal(back.creditor.warnings, 2);
});

test('통첩: 기한 안에 목표만큼 갚으면 해제, 넘기면 배드 엔딩이 한 번', () => {
  const ok = toUltimatum();
  const need = creditorView(ok).ultimatum.need;
  ok.gold = need;
  assert.ok(dispatch(ok, { type: 'debt.repay', amount: need, requestId: 'ult' }).ok);
  assert.equal(ok.creditor.ultimatum, null);
  assert.equal(ok.creditor.warnings, 0);
  assert.equal(ok.ledger.creditor['relief:6'].scene, 'relief:6');

  const bad = toUltimatum();
  assert.equal(closeLate(bad, 7).rec.scene, null, '통첩 중에는 새 경고가 없다');
  assert.notEqual(bad.calendar.ended, true);
  const { events } = closeLate(bad, 9);
  assert.equal(bad.calendar.ended, true);
  assert.equal(bad.calendar.endingId, 'bad');
  assert.equal(events.filter(e => e.type === 'gameEnded').length, 1);
  assert.equal(pendingStory(bad), 'ending:bad');
  const back = deserialize(serialize(bad)).state;
  assert.equal(checkCreditor(back, 9, back.ledger.interest.m9), null, '끝난 뒤에는 다시 판정하지 않는다');
  assert.equal(back.calendar.endingId, 'bad');
});

test('약속 달성은 다음 달 이자를 깎고, 이전 저장·옛 180순 저장은 독촉으로 바로 끝나지 않는다', () => {
  const s = atMonth(5);
  s.repaidTotal = Math.ceil(TEMP.INITIAL_DEBT * 0.10);
  const { rec } = closeLate(s, 5, 100000000);
  assert.equal(rec.milestone, true);
  assert.equal(rec.scene, null);
  assert.equal(s.ledger.rewards['milestone:5'], true);
  assert.equal(interestDue(s, 6), Math.ceil(s.debt * 0.03 * (1 - C.MILESTONE_INTEREST_CUT)));

  const old = atMonth(5);
  delete old.creditor; delete old.ledger.creditor;
  const mig = deserialize(serialize(old)).state;
  assert.deepEqual(mig.creditor.ultimatum, null);
  closeLate(mig, 5); closeLate(mig, 6);
  assert.notEqual(mig.calendar.ended, true, '통첩은 와도 기한 전에는 끝나지 않는다');

  const legacy = atMonth(20);
  legacy.calendar.totalTurns = C.LEGACY_TOTAL_TURNS;
  closeLate(legacy, 20); closeLate(legacy, 21);
  assert.equal(legacy.creditor.warnings, 0);
  assert.equal(creditorView(legacy), null);
});

test('배드 엔딩: 결말 장면을 본 뒤 후일담 이야기·자유 영업이 없고, 크레딧에 출연·음악이 흐른다', () => {
  const s = toUltimatum();
  closeLate(s, 9);
  assert.equal(s.mode, 'prep');
  assert.ok(ENDINGS.bad.beats.length > 3);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ending:bad' }).ok);
  assert.equal(pendingStory(s), null, '가게를 내준 뒤에는 후일담이 없다');
  for (const type of ['shift.start', 'hunt.start', 'debt.repay']) assert.equal(dispatch(s, { type, amount: 1, requestId: 'x' }).ok, false, type);
  const html = creditsScreen(s, ENDINGS.bad.title);
  for (const t of ['연이', '네오', '청토끼', 'DEST1NOVA', '다시 시작', '건너뛰기', ENDINGS.bad.title]) assert.ok(html.includes(t), t);
});
