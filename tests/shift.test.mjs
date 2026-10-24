// 영업 흐름: 지명 300초 잠금, 25:00 / 30:00 경계, 피버, 일시정지, 자동 운영.
// 모든 시간은 엔진 tick(활성 시간)으로 진행한다. "자동 시계" 표시가 붙은 테스트는 사람이 하는 30분 플레이테스트가 아니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { acceptCheck, addFever, feverCandidates } from '../src/game/nomination.js';
import { huntCheck } from '../src/game/hunt.js';
import { autoAcceptDecision } from '../src/game/auto.js';
import { tipFor } from '../src/game/satisfaction.js';
import { quietShift, seat, tickTo } from './helpers.mjs';

const N = RULES.NOMINATION_MS;

test('일반 손님은 접대 없이 주문·식사하고 떠난다', () => {
  const s = quietShift();
  dispatch(s, { type: 'auto.toggle', on: true }); // 조리·서빙만 사람과 같은 명령으로 대신 누름
  const { cid, vid, tableNo } = seat(s, { kind: 'regular' });
  assert.equal(s.customers[cid].state, 'thinking');
  assert.equal(acceptCheck(s, tableNo).ok, false);
  for (let i = 0; i < 1800 && s.customers[cid]; i++) {
    tick(s, 100);
    assert.equal(s.people.neo.activity, 'idle', '일반 손님 때문에 네오가 잠기면 안 된다');
  }
  const v = s.visits[vid];
  assert.equal(s.customers[cid], undefined, '손님이 식사를 마치고 떠났다');
  assert.equal(v.kind, 'regular');
  assert.equal(v.acceptAt, null);
  assert.ok(v.servedTotal > 0, '서빙을 받았다');
  assert.equal(s.shift.hostings.length, 0);
});

test('지명 요청만으로는 300초가 시작되지 않고, 수락 시점부터 시작된다', () => {
  const s = quietShift();
  const { cid, vid, tableNo } = seat(s);
  const v = s.visits[vid];
  assert.equal(s.customers[cid].state, 'requesting');
  assert.ok(v.requestAt != null);
  tick(s, 5000);
  assert.equal(v.acceptAt, null);
  assert.equal(v.endAt, null);
  assert.equal(s.people.neo.activity, 'idle');
  const t0 = s.shift.elapsedMs;
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  assert.equal(v.acceptAt, t0);
  assert.equal(v.endAt, t0 + N);
  assert.deepEqual({ a: s.people.neo.activity, t: s.people.neo.tableNo, e: s.people.neo.endAt }, { a: 'hosting', t: tableNo, e: t0 + N });
});

test('접대 중 두 번째 지명·탐색 거절, 299초까지 잠금, 300초에 1회 정산 후 해제', () => {
  const s = quietShift();
  const first = seat(s);
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo: first.tableNo }).ok);
  const t0 = s.shift.elapsedMs;

  const second = seat(s, { profileId: 'talk' });
  const chk = acceptCheck(s, second.tableNo);
  assert.equal(chk.ok, false);
  const busy = chk.reasons.find(r => r.includes(`${first.tableNo}번 테이블 접대 중`));
  assert.ok(busy && /\d\d:\d\d 남음/.test(busy), chk.reasons.join(' | '));
  assert.equal(dispatch(s, { type: 'nomination.accept', tableNo: second.tableNo }).ok, false);

  const hunt = dispatch(s, { type: 'hunt.start' });
  assert.equal(hunt.ok, false);
  assert.ok(huntCheck(s).reasons.some(r => r.includes('접대 중')));

  const goldBefore = s.gold;
  tickTo(s, t0 + N - 1000); // 299초
  const v = s.visits[first.vid];
  assert.equal(v.settled, false);
  assert.equal(s.people.neo.activity, 'hosting');
  assert.equal(s.ledger.tips[v.id], undefined);

  tickTo(s, t0 + N); // 300초
  assert.equal(v.settled, true);
  assert.equal(s.people.neo.activity, 'idle');
  assert.equal(s.people.neo.endAt, null);
  assert.ok(s.ledger.tips[v.id] != null);
  const goldAfter = s.gold;
  assert.equal(goldAfter - goldBefore, s.ledger.tips[v.id]); // 자동 운영을 켜지 않았으므로 매출 없음
  tick(s, 30000);
  const records = s.shift.hostings.filter(h => h.visitId === v.id);
  assert.equal(records.length, 1, '정산 기록은 한 번만');
  assert.equal(s.gold, goldAfter, '팁이 다시 들어오지 않는다');
});

function requestAround(elapsedMs, profileId = 'looks') {
  const s = quietShift();
  s.shift.elapsedMs = elapsedMs - 20000;
  const seated = seat(s, { profileId });
  assert.ok(s.shift.elapsedMs <= elapsedMs, '요청이 목표 시각 전에 생겨야 한다');
  return { s, ...seated };
}

test('25:00 정각 수락은 허용, 25:00 이후는 거절', () => {
  const ok = requestAround(RULES.LAST_ACCEPT_ELAPSED_MS);
  tickTo(ok.s, RULES.LAST_ACCEPT_ELAPSED_MS);
  assert.equal(acceptCheck(ok.s, ok.tableNo).ok, true);
  assert.ok(dispatch(ok.s, { type: 'nomination.accept', tableNo: ok.tableNo }).ok);
  assert.equal(ok.s.visits[ok.vid].endAt, RULES.SHIFT_MS);

  const late = requestAround(RULES.LAST_ACCEPT_ELAPSED_MS + 100);
  tickTo(late.s, RULES.LAST_ACCEPT_ELAPSED_MS + 100);
  const chk = acceptCheck(late.s, late.tableNo);
  assert.equal(chk.ok, false);
  assert.ok(chk.reasons.some(r => r.includes('25:00')), chk.reasons.join(' | '));
  assert.equal(dispatch(late.s, { type: 'nomination.accept', tableNo: late.tableNo }).ok, false);
});

test('30:00: 마지막 접대를 먼저 정산하고 영업을 닫는다', () => {
  const { s, tableNo, vid } = requestAround(RULES.LAST_ACCEPT_ELAPSED_MS);
  tickTo(s, RULES.LAST_ACCEPT_ELAPSED_MS);
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  dispatch(s, { type: 'auto.toggle', on: true }); // 주문 조리·서빙
  tickTo(s, RULES.SHIFT_MS - 100);
  assert.equal(s.mode, 'shift');
  assert.equal(s.people.neo.activity, 'hosting');
  const v = s.visits[vid];
  assert.ok(v.servedTotal > 0, '접대 손님 주문이 서빙되었다');

  tick(s, 100);
  assert.equal(s.mode, 'settlement');
  assert.equal(s.shift.elapsedMs, RULES.SHIFT_MS);
  const st = s.ledger.settlements[s.shift.id];
  const rec = st.hostings.filter(h => h.visitId === vid);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].tip, tipFor({ servedTotal: rec[0].servedTotal, H: rec[0].H, completedFull: true, fevered: false }).total);
  assert.ok(rec[0].tip > 0, '300초를 다 채운 정산이므로 팁이 나왔다');
  assert.equal(s.people.neo.activity, 'idle');
  assert.equal(s.stats.shiftsCompleted, 1);
  tick(s, 60000); // 결산 중에는 시간이 흐르지 않는다
  assert.equal(s.stats.shiftsCompleted, 1);
});

test('피버: 접대 테이블 1개로도 사용 가능, 팁만 2배', () => {
  const s = quietShift();
  const { vid, tableNo } = seat(s);
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  const t0 = s.shift.elapsedMs;
  tickTo(s, t0 + 60000); // 첫 평가: H 92 ≥ 90 → +24
  assert.equal(s.fever.gauge, 24);
  assert.equal(dispatch(s, { type: 'fever.activate' }).ok, false, '게이지 100 미만');
  addFever(s, 100, 'test');
  const r = dispatch(s, { type: 'fever.activate' });
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.tables, [tableNo]);
  assert.equal(s.fever.gauge, 0, '게이지를 모두 쓴다');
  tick(s, RULES.FEVER_DURATION_MS);
  assert.equal(s.fever.activeUntil, null, '20초 뒤 종료');
  const v = s.visits[vid];
  v.servedTotal = 1000; // 팁 계산만 떼어 보기 위해 서빙 합계를 고정(테스트 준비)
  tickTo(s, t0 + N);
  assert.equal(v.settled, true);
  assert.equal(v.tip.feverExtra, v.tip.base);
  assert.ok(v.tip.base > 0);
});

test('피버·음식·의상으로도 상한(≤39) 고객은 만족·팁 불가', () => {
  const s = quietShift();
  assert.ok(dispatch(s, { type: 'outfit.equip', who: 'neo', slot: 'outfit', itemId: 'vest_night' }).ok);
  assert.ok(dispatch(s, { type: 'outfit.equip', who: 'neo', slot: 'acc1', itemId: 'pin_star' }).ok);
  const { vid, tableNo } = seat(s, { profileId: 'funmix' });
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  const v = s.visits[vid];
  v.servedTotal = 5000;
  v.foodScores.push(100, 100);
  addFever(s, 100, 'test');
  assert.equal(feverCandidates(s).length, 0, '상한 고객은 피버 대상이 아니다');
  assert.equal(dispatch(s, { type: 'fever.activate' }).ok, false);
  v.fevered = true; // 강제로 켜도
  tick(s, N);
  assert.equal(v.settled, true);
  assert.ok(v.finalH <= 39, `H=${v.finalH}`);
  assert.equal(v.tip.total, 0);
});

test('일시정지(탭 전환 포함)는 영업·접대 남은 시간을 그대로 둔다', () => {
  const s = quietShift();
  const { vid, tableNo } = seat(s);
  dispatch(s, { type: 'nomination.accept', tableNo });
  tick(s, 10000);
  const before = { el: s.shift.elapsedMs, end: s.visits[vid].endAt };
  assert.ok(dispatch(s, { type: 'pause' }).ok); // 화면의 visibilitychange/pagehide 도 이 명령을 보낸다
  tick(s, 120000);
  assert.deepEqual({ el: s.shift.elapsedMs, end: s.visits[vid].endAt }, before);
  assert.equal(dispatch(s, { type: 'cook', menuId: 'americano' }).ok, false, '일시정지 중 명령 거절');
  assert.ok(dispatch(s, { type: 'resume' }).ok);
  tick(s, 1000);
  assert.equal(s.shift.elapsedMs, before.el + 1000);
  assert.equal(s.visits[vid].endAt, before.end);
});

test('자동 운영 수락 판단: 예상 H ≥ 60·남은 300초 이상만, 재미 중심은 수락 안 함', () => {
  const s = quietShift();
  const looks = seat(s, { profileId: 'looks' });
  const fun = seat(s, { profileId: 'fun' });
  const mix = seat(s, { profileId: 'funmix' });
  assert.equal(autoAcceptDecision(s, looks.tableNo).accept, true);
  assert.equal(autoAcceptDecision(s, fun.tableNo).accept, false);
  assert.equal(autoAcceptDecision(s, mix.tableNo).accept, false);

  const late = requestAround(RULES.LAST_ACCEPT_ELAPSED_MS + 100);
  tickTo(late.s, RULES.LAST_ACCEPT_ELAPSED_MS + 100);
  assert.equal(autoAcceptDecision(late.s, late.tableNo).accept, false);
});

test('[자동 시계] 30분 정규 영업 전체를 자동 운영으로 진행 — 마감·정산 1회', () => {
  const s = createGame();
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  dispatch(s, { type: 'auto.toggle', on: true });
  for (let t = 0; t < RULES.SHIFT_MS - 100; t += 60000) tick(s, Math.min(60000, RULES.SHIFT_MS - 100 - s.shift.elapsedMs));
  assert.equal(s.shift.elapsedMs, RULES.SHIFT_MS - 100);
  assert.equal(s.mode, 'shift', '30:00 전에는 닫히지 않는다');
  tick(s, 100);
  assert.equal(s.mode, 'settlement');
  const st = s.lastSettlement;
  assert.equal(Object.keys(s.ledger.settlements).length, 1);
  assert.ok(st.servedCount > 0);
  assert.ok(st.hostings.length > 0);
  const ids = st.hostings.map(h => h.visitId);
  assert.equal(new Set(ids).size, ids.length, '방문당 정산 1회');
  assert.ok(st.hostings.every(h => h.profileId !== 'fun' && h.profileId !== 'funmix'), '재미 중심 요청은 자동 수락 안 함');
  assert.equal(st.result, st.sales + st.baseTips + st.feverTips - st.ingredientCost);
  assert.equal(s.people.neo.activity, 'idle');
  console.log(`  [자동 시계] 매출 ${st.sales} · 재료비 ${st.ingredientCost} · 팁 ${st.baseTips}+${st.feverTips} · 서빙 ${st.servedCount} · 접대 ${st.hostings.length}건`);
});
