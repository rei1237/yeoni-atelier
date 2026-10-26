// 인연으로 여는 자동화·전 직원 스트레스·네오 농장 맡기기·인연 대화 취소(3단계 우선순위)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { serialize, deserialize } from '../src/core/save.js';
import { TEMP } from '../src/config/balance.temp.js';
import { RULES } from '../src/config/rules.js';
import { CROPS } from '../src/data/farm.js';
import { automationStatus } from '../src/game/auto.js';
import { talkCheck } from '../src/game/bonds.js';
import { bondQuestion } from '../src/data/bond-dialogues.js';
import { BOND_STORIES } from '../src/story/bonds.js';
import { quietShift, seat, tickTo, unlockAutomation, enableAutomation } from './helpers.mjs';

const cmd = (s, type, args = {}) => dispatch(s, { type, ...args });

test('잠긴 자동화는 엔진이 거절하고, 인연 단계와 그 단계 이야기를 모두 채우면 켜지며 저장 후에도 유지된다', () => {
  const s = createGame();
  let r = cmd(s, 'automation.toggle', { ability: 'kitchen', on: true });
  assert.equal(r.ok, false); assert.match(r.reason, /♥2/);
  s.affinity.luna_sis = TEMP.BONDS.TIERS[1];
  r = cmd(s, 'automation.toggle', { ability: 'kitchen', on: true });
  assert.equal(r.ok, false, '단계만 올라도 이야기를 보기 전에는 잠김'); assert.match(r.reason, /이야기/);
  unlockAutomation(s, ['kitchen']);
  assert.equal(automationStatus(s, 'kitchen').on, false, '열려도 기본은 꺼짐');
  assert.ok(cmd(s, 'automation.toggle', { ability: 'kitchen', on: true }).ok);
  const back = deserialize(serialize(s)).state;
  assert.equal(back.automation.kitchen, true);
  assert.equal(back.automation.hall, false);
  assert.equal(cmd(s, 'auto.toggle', { on: true }).ok, false, '전체 자동은 플레이어 명령으로 켜지지 않는다');
});

test('예전 저장의 자동 켜짐과 네오 스트레스는 권한 없이 꺼진 채로 옮겨진다', () => {
  const s = createGame();
  const old = JSON.parse(serialize(s));
  delete old.automation; delete old.stress; delete old.resting; delete old.dayOff;
  Object.assign(old, { autoKitchen: true, auto: true, neoStress: 55, neoResting: true });
  const m = deserialize(JSON.stringify(old)).state;
  assert.deepEqual(m.automation, { hall: false, kitchen: false, farm: false });
  assert.equal(m.auto, false);
  assert.equal(m.stress.neo, 55); assert.equal(m.resting.neo, true);
  assert.ok(!('neoStress' in m) && !('autoKitchen' in m));
});

test('주방 자동은 루나 언니가 쉬면 멈추고 사유를 알려 준다', () => {
  const s = quietShift({ kitchen: true });
  s.resting.luna_sis = true;
  const st = automationStatus(s, 'kitchen');
  assert.equal(st.running, false); assert.match(st.reason, /쉬는 중/);
  seat(s, { kind: 'regular' });
  tick(s, 20000);
  assert.ok(Object.values(s.stations).every(x => !x.current && !x.next), '쉬는 동안 자동 조리 없음');
});

test('서빙 중 한계에 닿은 직원은 음식을 넘기고, 주문은 사라지지 않고 다른 사람이 마무리한다', () => {
  const s = quietShift({ kitchen: true });
  const reg = seat(s, { kind: 'regular' });
  let carrier = null;
  for (let i = 0; i < 1200 && !carrier; i++) {
    tick(s, 100);
    carrier = Object.values(s.staff).find(st => st.id !== 'yeoni' && st.job?.kind === 'deliver' && st.carry);
  }
  assert.ok(carrier, '누군가 음식을 들고 간다');
  s.resting[carrier.id] = true;
  tick(s, 100);
  assert.notEqual(s.staff[carrier.id].job?.kind, 'deliver', '쉬는 직원은 일을 내려놓는다');
  assert.equal(s.staff[carrier.id].carry, null, '들고 있던 음식은 트레이·보관칸으로 넘어갔다');
  for (let i = 0; i < 1800 && s.customers[reg.cid]; i++) tick(s, 100);
  assert.ok(s.visits[reg.vid].servedTotal > 0, '넘긴 음식도 결국 손님에게 간다');
});

test('스트레스 한계 직원은 그 영업을 쉬고, 휴무를 주면 다음 결산에서 크게 회복한다', () => {
  const s = createGame(); s.hostbar.open = true;
  s.stress.luna = 70;
  assert.ok(cmd(s, 'staff.dayOff', { id: 'luna' }).ok);
  assert.ok(cmd(s, 'shift.start').ok);
  assert.equal(s.resting.luna, true, '휴무 직원은 영업에 나오지 않는다');
  assert.equal(cmd(s, 'staff.dayOff', { id: 'luna' }).ok, false, '영업 중에는 휴무를 바꾸지 않는다');
  tickTo(s, RULES.SHIFT_MS);
  const before = s.stress.luna;
  cmd(s, 'settlement.close');
  assert.ok(s.stress.luna < before + TEMP.NEO_STRESS.settle, '휴식 회복이 더해진다');
  assert.deepEqual(s.resting, {}); assert.deepEqual(s.dayOff, {});
});

test('루나의 쉼터는 골드만 쓰고 마을 행동력은 그대로, 순마다 한 사람 한 번', () => {
  const s = createGame(); s.stress.neo = 50; s.gold = 1000;
  const ap = s.ap.left;
  const r = cmd(s, 'stress.shelter', { id: 'neo' });
  assert.ok(r.ok, r.reason);
  assert.equal(s.ap.left, ap); assert.equal(s.gold, 1000 - TEMP.SHELTER_COST);
  assert.ok(s.stress.neo < 50);
  assert.equal(cmd(s, 'stress.shelter', { id: 'neo' }).ok, false);
  s.gold = 0; s.stress.luna = 30;
  assert.match(cmd(s, 'stress.shelter', { id: 'luna' }).reason, /골드/);
});

function farmReady() {
  const s = createGame(); s.huntUnlocked = true; s.gold = 1000;
  unlockAutomation(s, ['farm']);
  s.farm.plots[0] = { id: 'crop-t-1', cropId: 'wheat', growth: CROPS.wheat.turns, careTurns: 0, wateredDay: null, caredDay: null };
  return s;
}

test('네오에게 농장 맡기기: 잠겨 있으면 거절, 수확·다시 심기에 씨앗값·농장 행동력을 쓰고 순마다 한 번', () => {
  assert.equal(cmd(createGame(), 'farm.delegate').ok, false);
  const s = farmReady(), energy = s.farm.energy, gold = s.gold;
  const r = cmd(s, 'farm.delegate');
  assert.ok(r.ok, r.reason);
  assert.equal(r.harvested, 1); assert.equal(r.planted, 1);
  assert.ok(s.stock.flour > TEMP.START_STOCK.flour - 1);
  assert.equal(s.gold, gold - CROPS.wheat.seedCost);
  assert.equal(s.farm.energy, energy - (r.harvested + r.planted + r.cared));
  assert.equal(cmd(s, 'farm.delegate').ok, false, '같은 순 두 번째 맡기기는 거절');
  const back = deserialize(serialize(s)).state;
  assert.equal(cmd(back, 'farm.delegate').ok, false, '저장 왕복 뒤에도 다시 지급하지 않는다');
});

test('네오는 같은 순에 농장과 사냥을 함께 할 수 없다', () => {
  const a = farmReady();
  assert.ok(cmd(a, 'farm.delegate').ok);
  const h = cmd(a, 'hunt.start', { depth: 1 });
  assert.equal(h.ok, false); assert.ok(h.reasons.some(x => x.includes('농장')));
  const b = farmReady();
  assert.ok(cmd(b, 'hunt.start', { depth: 1 }).ok);
  cmd(b, 'hunt.retreat'); cmd(b, 'hunt.finish');
  assert.equal(b.mode, 'prep');
  assert.match(cmd(b, 'farm.delegate').reason, /사냥/);
});

test('인연 대화는 답을 고를 때만 행동력을 쓰고, 답 순서는 다시 열어도 같다', () => {
  const s = createGame();
  const ap = s.ap.left;
  assert.ok(talkCheck(s, 'luna').ok);
  const q1 = bondQuestion(s, 'luna'), q2 = bondQuestion(s, 'luna');
  assert.deepEqual(q1.answers.map(a => a.id), q2.answers.map(a => a.id));
  assert.equal(s.ap.left, ap, '대화를 열고 닫는 것만으로는 행동력을 쓰지 않는다');
  assert.equal(cmd(s, 'bond.talk', { id: 'luna', choiceId: q1.answers[0].id, token: 'old' }).ok, false);
  assert.ok(cmd(s, 'bond.talk', { id: 'luna', choiceId: q1.answers[0].id, token: q1.token }).ok);
  assert.equal(s.ap.left, ap - 1);
  assert.equal(talkCheck(s, 'luna').ok, false);
});

test('자동화를 여는 인연 이야기는 그 해금을 알리고, 이야기 속 선택지마다 이어지는 대답이 있다', () => {
  for (const a of Object.values(TEMP.AUTOMATION)) {
    const beats = BOND_STORIES[a.id][a.tier - 1];
    assert.ok(beats.some(b => b.s === 'sys' && b.t.includes('해금')), `${a.id} ♥${a.tier} 해금 고지`);
  }
  for (const id of ['neo', 'luna', 'luna_sis']) for (const beats of BOND_STORIES[id]) {
    const picks = beats.filter(b => b.choices);
    assert.equal(picks.length, 1, `${id} 단계마다 선택 한 번`);
    assert.ok(picks[0].choices.length >= 2 && picks[0].choices.every(c => c.beats.length > 0));
  }
});
