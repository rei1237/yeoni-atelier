// 청토끼 금융: 이자율 인상 일정·인상 장면·네오 성장(게임 오리지널, 수치 TEMP)
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame, hostStats } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { interestRate, nextHike, neoHikeBonus } from '../src/game/creditor.js';
import { serialize, deserialize } from '../src/core/save.js';
import { tickTo } from './helpers.mjs';

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
