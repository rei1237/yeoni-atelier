// 영업 마감 화면: 원장의 실제 결과·서빙률·동료 홀 일 건수로만 그린다
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { overlayHtml } from '../src/ui/sheets.js';
import { settlementView } from '../src/ui/settlement.js';
import { won } from '../src/ui/hud.js';

function playShift(s) {
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  dispatch(s, { type: 'auto.toggle', on: true, sim: true }); // 조리·서빙만 사람과 같은 명령으로 대신 누름
  for (let t = 0; t < RULES.SHIFT_MS && s.mode === 'shift'; t += 250) tick(s, 250);
  assert.equal(s.mode, 'settlement');
  return s.lastSettlement;
}

test('마감 화면은 실제 영업 결과·서빙률·동료별 홀 일 건수를 보여 준다', () => {
  const s = createGame({ seed: 3 });
  const st = playShift(s);
  assert.ok(st.servedCount > 0);
  const crew = Object.values(st.crew);
  assert.ok(crew.length >= 1 && crew.reduce((a, b) => a + b, 0) > 0, JSON.stringify(st.crew));
  assert.ok(!('yeoni' in st.crew), '계산 담당 연이는 홀 일 집계에서 뺀다');
  const html = overlayHtml(s, { dev: false });
  assert.match(html, /영업 마감/);
  assert.ok(html.includes(`data-countup="${st.result}"`));
  assert.ok(html.includes(won(Math.abs(st.result))));
  const v = settlementView(s);
  assert.equal(v.rate, st.servedCount / (st.servedCount + st.lostOrders));
  assert.ok(html.includes(`${Math.round(v.rate * 100)}%`));
  assert.ok(v.first, '첫 영업');
  assert.match(html, /첫 영업 완료/);
  assert.match(html, /settlement\.close/);
  assert.doesNotMatch(html, /지명|피버|스트레스/, '개장 전 일반 카페 결산은 접대 용어를 숨긴다');
});

test('이전 결산보다 결과가 높을 때만 최고 기록, 서빙률로 도장이 정해진다', () => {
  const s = createGame({ seed: 3 });
  const st = playShift(s);
  s.ledger.settlements['shift-old'] = { ...st, shiftId: 'shift-old', result: st.result - 1 }; // 테스트 준비: 조금 낮은 지난 결산
  assert.equal(settlementView(s).best, st.result > 0);
  s.ledger.settlements['shift-old'].result = st.result; // 같으면 최고 기록이 아니다
  assert.equal(settlementView(s).best, false);
  const grade = (served, lost) => { s.lastSettlement = { ...st, servedCount: served, lostOrders: lost }; return settlementView(s).grade; };
  assert.equal(grade(19, 1), 'perfect');
  assert.equal(grade(8, 2), 'great');
  assert.equal(grade(6, 4), 'good');
  assert.equal(grade(1, 4), 'tough');
  assert.equal(grade(0, 0), 'quiet');
  s.lastSettlement = { ...st, crew: { neo: 5, luna: 5 } };
  assert.equal(settlementView(s).mvp, null, '같은 건수면 MVP 없음');
  s.lastSettlement = { ...st, crew: { neo: 4, luna: 6 } };
  assert.equal(settlementView(s).mvp, 'luna');
});
