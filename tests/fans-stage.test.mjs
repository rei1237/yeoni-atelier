import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { serialize, deserialize } from '../src/core/save.js';
import { TEMP } from '../src/config/balance.temp.js';
import { RULES } from '../src/config/rules.js';
import { addFever } from '../src/game/nomination.js';
import { hostFeeQuote } from '../src/game/host-fees.js';
import { fanTier, fansOf, addFans, pickNominee, fanMultiplier, concertQuote } from '../src/game/fans.js';
import { pick } from '../src/core/rng.js';
import { quietShift, seat, tickTo } from './helpers.mjs';

// 저장 왕복: 영업 중 저장은 일시정지로 열리므로 계속하기를 누른다
const reload = s => { const r = deserialize(serialize(s)); assert.ok(r.ok, r.reason); if (r.state.paused) dispatch(r.state, { type: 'resume' }); return r.state; };
const join = (s, id) => { s.roster[id] = { usableFrom: 1 }; s.people[id] = { activity: 'idle', form: 'human', visitId: null, tableNo: null, endAt: null }; }; // 테스트 준비: 영입했다

test('멤버 인기: 팬 수로 단계가 오르고, 단계만큼 팁·지명료 배율과 지명 가중치가 오른다', () => {
  const s = createGame({ seed: 3 });
  assert.equal(fanTier(s, 'neo'), 0);
  addFans(s, 'neo', TEMP.FANS.TIERS[1]);
  assert.equal(fanTier(s, 'neo'), 2);
  assert.equal(fanMultiplier(s, 'neo'), 1 + 2 * TEMP.FANS.TIP_PER_TIER);
  const visit = { wealthId: 'ordinary', nominee: 'neo' };
  const base = hostFeeQuote({ ...s, fans: {} }, visit);
  assert.ok(Math.abs(hostFeeQuote(s, visit) - base * fanMultiplier(s, 'neo')) <= 1, '인기 단계가 지명료를 올린다');
  // 같은 단계면 예전 균등 선택과 같다(난수 1회), 단계가 높은 동료는 더 자주 지명된다
  const a = createGame({ seed: 9 }), b = createGame({ seed: 9 });
  const hosts = ['neo', 'solv'];
  const even = Array.from({ length: 40 }, () => pickNominee(a, hosts));
  assert.deepEqual(even, Array.from({ length: 40 }, () => pick(b.rng, hosts)));
  addFans(a, 'solv', TEMP.FANS.TIERS[3]);
  const picks = Array.from({ length: 400 }, () => pickNominee(a, hosts));
  assert.ok(picks.filter(id => id === 'solv').length > 240, '달빛 아이돌 단계는 지명이 몰린다');
});

test('접대 정산 팬은 방문당 한 번, 저장 뒤에도 늘지 않는다', () => {
  const s = quietShift();
  const { vid, tableNo } = seat(s);
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  s.visits[vid].servedTotal = 1000; // 팁 계산만 보기 위한 테스트 준비
  tickTo(s, s.visits[vid].endAt);
  assert.equal(s.visits[vid].settled, true);
  const H = s.visits[vid].finalH, got = fansOf(s, 'neo');
  assert.equal(got, H >= 80 ? TEMP.FANS.HOST_GREAT : H >= 60 ? TEMP.FANS.HOST_GOOD : 0);
  const r = reload(s);
  tick(r, 1000);
  assert.equal(fansOf(r, 'neo'), got);
});

test('무대 공연: 멤버 합류 전엔 잠기고, 게이지를 써서 30초 동안 손님이 금화를 던지며 끝나면 팬이 는다', () => {
  const s = quietShift();
  addFever(s, 100, 'test');
  assert.equal(dispatch(s, { type: 'stage.perform' }).ok, false, '멤버가 없으면 무대를 열 수 없다');
  join(s, 'solv');
  const { vid } = seat(s, { kind: 'regular' });
  const t0 = s.shift.elapsedMs;
  const r = dispatch(s, { type: 'stage.perform' });
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.performers, ['neo', 'solv']);
  assert.equal(s.fever.gauge, 0, '피버 게이지를 모두 쓴다');
  assert.equal(s.people.solv.activity, 'performing');
  assert.equal(dispatch(s, { type: 'fever.activate' }).ok, false, '공연 중엔 피버를 겹쳐 쓸 수 없다');
  tickTo(s, t0 + TEMP.STAGE.DURATION_MS);
  assert.equal(s.stage.activeUntil, null, '30초 뒤 끝난다');
  assert.equal(s.people.solv.activity, 'idle');
  const thrown = Object.values(s.visits).reduce((n, v) => n + (v.stageThrown || 0), 0); // 공연 소문에 들어온 손님 몫 포함
  assert.ok(s.visits[vid].stageThrown > 0, '자리 손님이 금화를 던졌다');
  assert.ok(Object.keys(s.visits).length > 1, '공연 중 손님이 더 들어왔다');
  assert.equal(s.shift.stageTips, thrown);
  assert.ok(s.visits[vid].bill >= s.visits[vid].stageThrown, '던진 금화는 계산서로 받는다');
  assert.ok(fansOf(s, 'solv') > 0 && fansOf(s, 'neo') > 0);
  assert.equal(s.shift.durationMs, RULES.SHIFT_MS, '영업 600초는 그대로');
  // 마감 결산에 공연 수입이 들어간다
  tickTo(s, RULES.SHIFT_MS);
  assert.equal(s.lastSettlement.stageTips, thrown);
  assert.equal(s.lastSettlement.stages, 1);
});

test('공연 중 마감이면 멤버를 돌려보내고 팬은 한 번만 정산한다', () => {
  const s = quietShift();
  join(s, 'lune');
  tickTo(s, RULES.SHIFT_MS - TEMP.STAGE.DURATION_MS);
  addFever(s, 100, 'test');
  assert.ok(dispatch(s, { type: 'stage.perform' }).ok);
  tickTo(s, RULES.SHIFT_MS - 1000);
  const r = reload(s);
  tick(r, 1000);
  assert.equal(r.mode, 'settlement');
  assert.equal(r.people.lune.activity, 'idle');
  const fans = fansOf(r, 'lune');
  assert.ok(fans > 0);
  dispatch(r, { type: 'settlement.close' });
  assert.equal(fansOf(r, 'lune'), fans);
});

test('정기 콘서트: 멤버 합류 뒤 한 달에 한 번, 행동력 1로 티켓 수입과 멤버 전원 팬', () => {
  const s = createGame({ seed: 5 });
  assert.equal(dispatch(s, { type: 'concert.hold' }).ok, false, '멤버 합류 전');
  join(s, 'bambi');
  const gold = s.gold, ap = s.ap.left, q = concertQuote(s);
  const r = dispatch(s, { type: 'concert.hold' });
  assert.ok(r.ok, r.reason);
  assert.equal(r.gold, q.gold);
  assert.equal(s.gold, gold + q.gold);
  assert.equal(s.ap.left, ap - TEMP.CONCERT.AP);
  assert.equal(fansOf(s, 'neo'), TEMP.CONCERT.FANS);
  assert.equal(fansOf(s, 'bambi'), TEMP.CONCERT.FANS);
  const again = dispatch(s, { type: 'concert.hold' });
  assert.equal(again.ok, false, '같은 달 두 번째는 거절');
  const back = reload(s);
  assert.equal(dispatch(back, { type: 'concert.hold' }).ok, false, '저장 뒤에도 이번 달은 열었다');
  assert.equal(back.gold, s.gold);
});

test('무대 그림: 네오가 가운데, 멤버는 공연 시트로 노래→춤→인사를 돌고 빈 계산대의 연이는 응원한다', async () => {
  const { stageLineup } = await import('../src/render/cafe-view.js');
  const { ASSETS } = await import('../src/render/assets.js');
  const s = quietShift();
  join(s, 'solv'); join(s, 'bambi');
  addFever(s, 100, 'test');
  assert.ok(dispatch(s, { type: 'stage.perform' }).ok);
  const yeoni = { key: 'yeoni', x: 10.5, y: 1.5, o: { state: 'idle', facing: 'right' } };
  const line = stageLineup(s, [yeoni], false);
  assert.equal(line[0].key, ASSETS.actors.neo_stage ? 'neo_stage' : 'neo');
  assert.equal(line[0].x, 6, '네오가 가운데');
  assert.deepEqual(line.map(a => a.x).sort((a, b) => a - b), [4.5, 6, 7.5]);
  for (const a of line) if (ASSETS.actors[a.key].states.sing) assert.equal(a.o.state, 'sing', '첫 3초는 노래');
  tickTo(s, s.shift.elapsedMs + 3200);
  for (const a of stageLineup(s, [], false)) if (ASSETS.actors[a.key].states.dance) assert.equal(a.o.state, 'dance');
  if (ASSETS.actors.yeoni_cheer) assert.equal(yeoni.key, 'yeoni_cheer', '계산대가 비면 연이가 응원한다');
  tickTo(s, s.stage.activeUntil);
  assert.equal(s.stage.activeUntil, null);
});
