// 저장·복원 중복 방지, 인테리어 취소·적용, 영입 흐름, 월정석 사냥 보상
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/config/rules.js';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame, isUsableHost, usableHosts } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { settleHosting } from '../src/game/nomination.js';
import { grant, recruitView } from '../src/game/economy.js';
import { validateLayout } from '../src/game/space.js';
import { serialize, deserialize, saveGame, loadGame, hasSave, resetSave, memoryStorage, SAVE_KEYS } from '../src/core/save.js';
import { quietShift, seat, tickTo, sum } from './helpers.mjs';

const roundTrip = s => {
  const r = deserialize(serialize(s));
  assert.ok(r.ok, r.reason);
  return r.state;
};

test('영업 중 저장 → 이어하기: 같은 손님·같은 남은 시간, 일시정지로 시작', () => {
  const s = quietShift();
  const { cid, vid, tableNo } = seat(s);
  dispatch(s, { type: 'nomination.accept', tableNo });
  tick(s, 42000);
  const r = roundTrip(s);
  assert.equal(r.paused, true);
  assert.equal(r.shift.elapsedMs, s.shift.elapsedMs);
  assert.equal(r.visits[vid].endAt, s.visits[vid].endAt);
  assert.equal(r.customers[cid].tableNo, tableNo);
  assert.equal(r.people.neo.activity, 'hosting');
  tick(r, 60000);
  assert.equal(r.shift.elapsedMs, s.shift.elapsedMs, '일시정지 중에는 흐르지 않는다');
});

test('[자동 시계] 영업 도중 저장·복원해도 매출·팁·재료가 중복되지 않는다 (저장 없는 진행과 결과 동일)', () => {
  const run = withSaveAt => {
    let s = createGame();
    dispatch(s, { type: 'shift.start' });
    dispatch(s, { type: 'auto.toggle', on: true, sim: true });
    tick(s, withSaveAt ?? 0);
    if (withSaveAt != null) {
      s = roundTrip(roundTrip(s)); // 두 번 왕복해도 같아야 한다
      dispatch(s, { type: 'resume' });
    }
    tick(s, RULES.SHIFT_MS - s.shift.elapsedMs);
    return s;
  };
  const plain = run(null);
  const saved = run(600000 + 37);
  assert.equal(plain.mode, 'settlement');
  assert.equal(saved.mode, 'settlement');
  assert.deepEqual(saved.lastSettlement, plain.lastSettlement);
  assert.equal(saved.gold, plain.gold);
  assert.deepEqual(saved.stock, plain.stock);
  // 장부 대조: 골드 = 시작 골드 + 매출 장부 + 팁 장부 (재료는 이미 산 재고에서 빠진다)
  assert.equal(saved.gold, TEMP.START_GOLD + sum(saved.ledger.sales) + sum(saved.ledger.tips));
  assert.equal(sum(saved.ledger.sales), saved.lastSettlement.sales);
});

test('정산·보상·상환·탐색 결과는 복원 뒤 다시 처리해도 한 번만 반영', () => {
  // 접대 정산
  const s = quietShift();
  const { vid, tableNo } = seat(s);
  dispatch(s, { type: 'nomination.accept', tableNo });
  s.visits[vid].servedTotal = 1000;
  tick(s, RULES.NOMINATION_MS);
  assert.equal(s.visits[vid].settled, true);
  const r = roundTrip(s);
  dispatch(r, { type: 'resume' });
  const gold = r.gold;
  settleHosting(r, r.visits[vid]);
  assert.equal(r.gold, gold);
  assert.equal(r.shift.hostings.length, 1);

  // 영업 마감 → 결산은 1회
  tickTo(r, RULES.SHIFT_MS);
  assert.equal(r.mode, 'settlement');
  const r2 = roundTrip(r);
  assert.equal(r2.stats.shiftsCompleted, 1);
  assert.ok(dispatch(r2, { type: 'settlement.close' }).ok);

  // 퀘스트 보상
  assert.ok(dispatch(r2, { type: 'quest.claim', questId: 'q_first_shift' }).ok);
  const r3 = roundTrip(r2);
  const g3 = r3.gold;
  assert.equal(dispatch(r3, { type: 'quest.claim', questId: 'q_first_shift' }).ok, false);
  assert.equal(grant(r3, 'quest:q_first_shift', { gold: 300 }), false);
  assert.equal(r3.gold, g3);

  // 상환(같은 요청 id)
  assert.ok(dispatch(r3, { type: 'debt.repay', amount: 100, requestId: 'repay-test-1' }).ok);
  const r4 = roundTrip(r3);
  const again = dispatch(r4, { type: 'debt.repay', amount: 100, requestId: 'repay-test-1' });
  assert.equal(again.duplicate, true);
  assert.equal(r4.debt, r3.debt);
  assert.equal(r4.gold, r3.gold);
  assert.equal(r4.stats.repayCount, 1);
});

// 탐색 시간을 ms 만큼 진행하며 레벨업 카드는 첫 장을 고르고 상자는 바로 연다.
// 단계를 클리어하면 next 일 때 다음 단계로, 아니면 멈춘다(카드·상자·선택이 남으면 시간이 흐르지 않으므로 경과 시간 기준으로 반복한다)
function huntRun(s, ms, input, step = 500, next = true) {
  const end = s.hunt.elapsedMs + ms;
  while (s.hunt.status === 'running' && s.hunt.elapsedMs < end) {
    tick(s, Math.min(step, end - s.hunt.elapsedMs), { input });
    while (s.hunt.picks.length) assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
    while (s.hunt.chests.length) assert.ok(dispatch(s, { type: 'hunt.chest' }).ok);
    if (s.hunt.stageChoice && !(next && dispatch(s, { type: 'hunt.next' }).ok)) return;
  }
}

test('월정석 사냥: 네오가 영냥이로 변하고, 모은 월정석은 저장·복원과 무관하게 1회 지급', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.deepEqual([s.people.neo.activity, s.people.neo.form], ['hunting', 'cat']);
  assert.equal(dispatch(s, { type: 'shift.start' }).ok, false, '사냥 중 영업 시작 불가');
  huntRun(s, 5000, { x: 1, y: 0 });
  assert.ok(dispatch(s, { type: 'hunt.retreat' }).ok);
  s.hunt.bag = { moonstone: 7, sugar: 1 }; // 수량을 고정해 지급만 확인(테스트 준비). sugar = 예전 저장의 재료 가방
  const before = { ...s.stock };
  const moon0 = s.moonstone;
  const r = roundTrip(s); // 결과 화면에서 저장
  dispatch(r, { type: 'resume' });
  assert.ok(dispatch(r, { type: 'hunt.finish' }).ok);
  assert.equal(r.moonstone, moon0 + 7);
  assert.equal(r.stats.moonstonesObtained, 7);
  assert.equal(r.stock.moonstone, undefined, '월정석은 재료 창고에 들어가지 않는다');
  assert.equal(r.stock.sugar, before.sugar + 1);
  assert.deepEqual([r.people.neo.activity, r.people.neo.form], ['idle', 'human']);
  assert.equal(dispatch(r, { type: 'hunt.finish' }).ok, false);
  const r2 = roundTrip(r);
  assert.equal(r2.moonstone, moon0 + 7);
  assert.equal(r2.stats.huntsCompleted, 1);
});

test('[자동 시계] 단계 사냥: 준비 시간 뒤 보스가 나오고, 쓰러뜨려야 클리어·다음 단계이며 3분 뒤에도 계속된다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  dispatch(s, { type: 'hunt.start' });
  s.hunt.hp = s.hunt.maxHp = 1e9; // 타이머만 떼어 보기 위해 HP 를 크게(테스트 준비)
  assert.equal(dispatch(s, { type: 'hunt.next' }).ok, false, '보스 처치 전에는 다음 단계 불가');
  huntRun(s, 59000, { x: 0.3, y: -0.2 });
  assert.equal(s.hunt.bossSpawned, false, '1단계 준비 60초 전에는 보스가 없다');
  huntRun(s, 240000, { x: 0.3, y: -0.2 }, 500, false);
  assert.ok(s.hunt.stageChoice, '보스를 쓰러뜨려 클리어 선택이 떴다');
  assert.equal(s.hunt.stageChoice.stage, 1);
  assert.equal(s.hunter.maxStage, 2);
  assert.equal(s.ledger.rewards['stage:neo:1'], true);
  const t0 = s.hunt.elapsedMs;
  tick(s, 5000, { input: { x: 0, y: 0 } });
  assert.equal(s.hunt.elapsedMs, t0, '선택 중에는 시간이 멈춘다');
  assert.ok(s.hunt.kills > 0 && s.hunt.level > 1);
  assert.ok(dispatch(s, { type: 'hunt.next' }).ok);
  assert.equal(s.hunt.depth, 2);
  assert.equal(dispatch(s, { type: 'hunt.next' }).ok, false, '2단계 보스 전에는 3단계로 못 간다');
  huntRun(s, Math.max(0, 200000 - s.hunt.elapsedMs), { x: 1, y: 0 });
  assert.equal(s.hunt.status, 'running');
  assert.ok(s.hunt.elapsedMs > 180000, '3분이 지나도 계속된다');
  dispatch(s, { type: 'hunt.retreat' });
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.equal(s.mode, 'prep');
  assert.ok(s.lastHunt.cleared >= 1);
});

test('[자동 시계] 탐색 중 HP 0 이면 3분 전에 쓰러짐으로 끝나고 결과 화면으로 간다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.hunter.maxStage = 40; // 테스트 준비: 깊은 단계(1단계는 가만히 있어도 버틸 만큼 잡몹이 적다)
  dispatch(s, { type: 'hunt.start', depth: 40 });
  huntRun(s, 180000, { x: 0, y: 0 }, 1000); // 가만히 서 있으면 포위당한다
  assert.equal(s.hunt.status, 'down');
  assert.equal(s.hunt.hp, 0);
  assert.ok(s.hunt.elapsedMs < 180000);
  assert.ok(dispatch(s, { type: 'hunt.finish' }).ok);
  assert.deepEqual([s.people.neo.activity, s.people.neo.form], ['idle', 'human']);
});

test('탐색 레벨업: 카드를 고르기 전에는 시간이 멈추고, 고른 카드가 적용되며 저장에도 남는다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  dispatch(s, { type: 'hunt.start' });
  s.hunt.xp = s.hunt.xpNext - 1; // 별조각 하나면 레벨업하도록(테스트 준비)
  s.hunt.picks.push([{ kind: 'weapon', id: 'orbit' }, { kind: 'passive', id: 'paw' }]); // 대기 카드를 직접 넣어 확인
  const t0 = s.hunt.elapsedMs;
  tick(s, 5000, { input: { x: 0, y: 0 } });
  assert.equal(s.hunt.elapsedMs, t0, '카드가 남아 있으면 시간이 흐르지 않는다');
  const r = roundTrip(s);
  dispatch(r, { type: 'resume' });
  assert.equal(r.hunt.picks.length, 1, '대기 카드는 저장된다');
  assert.equal(dispatch(r, { type: 'hunt.pick', index: 5 }).ok, false, '없는 카드');
  assert.ok(dispatch(r, { type: 'hunt.pick', index: 1 }).ok);
  assert.equal(r.hunt.passives.paw, 1);
  assert.equal(dispatch(r, { type: 'hunt.pick', index: 0 }).ok, false, '카드가 없으면 실패');
  tick(r, 1000, { input: { x: 0, y: 0 } });
  assert.ok(r.hunt.elapsedMs > t0);
});

test('탐색 진화: 진화 비전을 연 무기가 5레벨 + 짝 보조 능력이면 진화한다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; s.armory.tech.evo.bolt = 1; // 테스트 준비: 기능 개시·진화 비전 연구 후 동작
  dispatch(s, { type: 'hunt.start' });
  s.hunt.weapons = [{ id: 'bolt', level: 4, evo: false }]; // 테스트 준비
  s.hunt.picks.push([{ kind: 'weapon', id: 'bolt' }]);
  assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
  assert.equal(s.hunt.weapons[0].level, 5);
  assert.equal(s.hunt.weapons[0].evo, false, '짝 보조 능력(별 방울)이 없으면 진화하지 않는다');
  s.hunt.picks.push([{ kind: 'passive', id: 'bell' }]);
  assert.ok(dispatch(s, { type: 'hunt.pick', index: 0 }).ok);
  assert.equal(s.hunt.weapons[0].evo, true);
});

test('인테리어: 취소하면 원래 배치로, 적용한 배치는 통로가 유효, 영업 중 편집 불가', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  const original = structuredClone(s.interior.furniture);
  assert.ok(dispatch(s, { type: 'interior.begin' }).ok);
  dispatch(s, { type: 'interior.move', uid: 'plant1', x: 1, y: 9 });
  dispatch(s, { type: 'interior.rotate', uid: 'rug1' });
  dispatch(s, { type: 'interior.store', uid: 'plant2' });
  dispatch(s, { type: 'interior.place', uid: 'lamp1' });
  assert.equal(dispatch(s, { type: 'shift.start' }).ok, false, '편집 중 영업 시작 불가');
  assert.ok(dispatch(s, { type: 'interior.cancel' }).ok);
  assert.deepEqual(s.interior.furniture, original);
  assert.equal(s.interior.draft, null);

  // 입구 앞(통로)에 놓으면 적용 거절, 실제 배치는 그대로
  dispatch(s, { type: 'interior.begin' });
  dispatch(s, { type: 'interior.move', uid: 'plant1', x: 5, y: 14 });
  const bad = dispatch(s, { type: 'interior.apply' });
  assert.equal(bad.ok, false);
  assert.deepEqual(s.interior.furniture, original);
  dispatch(s, { type: 'interior.cancel' });

  // 올바른 이동 → 적용 → 검증 통과 → 영업에서 손님이 실제로 자리에 앉는다
  dispatch(s, { type: 'interior.begin' });
  assert.ok(dispatch(s, { type: 'interior.place', uid: 'lamp1' }).ok);
  assert.ok(dispatch(s, { type: 'interior.move', uid: 'plant1', x: 0, y: 10 }).ok);
  const ok = dispatch(s, { type: 'interior.apply' });
  assert.ok(ok.ok, ok.reasons?.join(' | '));
  assert.notDeepEqual(s.interior.furniture, original);
  assert.ok(validateLayout(s.interior.furniture).ok);
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  assert.equal(dispatch(s, { type: 'interior.begin' }).ok, false, '영업 중 편집 불가');
  s.shift.scriptIndex = 99; s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < 3; i++) seat(s, { kind: 'regular' }); // 세 테이블 모두 착석 가능
});

test('영입: 조건 전에는 사용 불가 → 이벤트 완료 → 보상 1회 → 다음 영업부터 접대 → 저장 유지', () => {
  // 일반 게임에는 확인된 월별 인물만 있으며 개발용 동료는 없다.
  assert.ok(recruitView(createGame()).every(c => !c.devOnly));

  const s = createGame({ dev: true });
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  // 개발용 임시 동료(정식 멤버 아님)
  const id = 'dev_temp_01';
  assert.equal(recruitView(s).find(c => c.id === id).status, 'locked');
  assert.equal(dispatch(s, { type: 'recruit.complete', id }).ok, false);
  assert.equal(isUsableHost(s, id), false);

  // 영입 전 영업: 지명 대상으로 추천할 수도 없다
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  s.shift.scriptIndex = 99; s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  assert.equal(s.staff[id], undefined);
  const { tableNo } = seat(s);
  assert.equal(dispatch(s, { type: 'nomination.propose', tableNo, personId: id }).ok, false);

  // 조건: 정규 영업 2회 + 상환 1회
  tickTo(s, RULES.SHIFT_MS);
  dispatch(s, { type: 'settlement.close' });
  assert.ok(dispatch(s, { type: 'debt.repay', amount: 100, requestId: 'r1' }).ok);
  assert.equal(recruitView(s).find(c => c.id === id).status, 'locked', '영업 1회로는 부족');
  assert.ok(dispatch(s, { type: 'shift.start' }).ok);
  tickTo(s, RULES.SHIFT_MS);
  dispatch(s, { type: 'settlement.close' });
  assert.equal(recruitView(s).find(c => c.id === id).status, 'available');
  assert.equal(isUsableHost(s, id), false, '이벤트 전에는 여전히 사용 불가');

  const gold = s.gold;
  assert.ok(dispatch(s, { type: 'recruit.complete', id }).ok);
  assert.equal(s.gold, gold + 300);
  assert.equal(dispatch(s, { type: 'recruit.complete', id }).ok, false);
  assert.equal(s.gold, gold + 300, '보상 1회');
  assert.equal(s.roster[id].usableFrom, s.day, '준비 중 day = 다음 영업 번호');

  const r = roundTrip(s);
  assert.equal(r.recruitment[id].status, 'recruited');
  assert.deepEqual(usableHosts(r).sort(), ['dev_temp_01', 'neo']);
  assert.ok(dispatch(r,{type:'staffing.select',id:'neo',on:false}).ok);
  assert.ok(dispatch(r,{type:'staffing.select',id,on:true}).ok);
  assert.ok(dispatch(r, { type: 'shift.start' }).ok);
  assert.ok(r.staff[id], '배치한 동료가 다음 영업에 출근');
  r.shift.scriptIndex = 99; r.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  const req = seat(r);
  assert.ok(dispatch(r, { type: 'nomination.propose', tableNo: req.tableNo, personId: id }).ok);
});

test('저장 키 분리와 초기화 확인', () => {
  assert.notEqual(SAVE_KEYS.normal, SAVE_KEYS.dev);
  const store = memoryStorage();
  assert.equal(hasSave(store, SAVE_KEYS.normal), false);
  saveGame(store, SAVE_KEYS.normal, createGame());
  assert.equal(hasSave(store, SAVE_KEYS.dev), false, '개발 저장과 섞이지 않는다');
  assert.equal(loadGame(store, SAVE_KEYS.normal).ok, true);
  assert.equal(resetSave(store, SAVE_KEYS.normal).ok, false, '확인 없이는 지우지 않는다');
  assert.equal(hasSave(store, SAVE_KEYS.normal), true);
  assert.equal(resetSave(store, SAVE_KEYS.normal, { confirmed: true }).ok, true);
  assert.equal(hasSave(store, SAVE_KEYS.normal), false);
  assert.equal(deserialize('{broken').ok, false);
});
