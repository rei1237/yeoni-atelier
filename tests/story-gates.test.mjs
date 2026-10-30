import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, shiftDuration } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory, maxActionPoints } from '../src/game/calendar.js';
import { questView } from '../src/game/economy.js';
import { TEMP } from '../src/config/balance.temp.js';
import { quietShift, seat, tickTo } from './helpers.mjs';
import { spawnCustomer } from '../src/game/cafe.js';
import { serialize, deserialize } from '../src/core/save.js';
import { RULES } from '../src/config/rules.js';
import { topbarHtml, panelHtml } from '../src/ui/hud.js';
import { sheetHtml, overlayHtml } from '../src/ui/sheets.js';
import { MONTH_STORIES } from '../src/story/months.js';
import { EVENT_STORIES } from '../src/story/events.js';
import { HANBI_STORIES } from '../src/story/hanbi.js';
import { PROLOGUE } from '../src/story/prologue.js';
import { BOND_STORIES } from '../src/story/bonds.js';
import { VISIT_STORIES } from '../src/story/visits.js';

test('개장 전 HUD·결산은 일반 카페이며 5월 이벤트 뒤 지명 조작을 공개한다', () => {
  const s = createGame(), ui = { dev:false, speed:1 };
  dispatch(s, { type:'shift.start' });
  const closed = topbarHtml(s,ui) + panelHtml(s,ui);
  assert.doesNotMatch(closed, /지명|피버|스트레스|fever.activate|hostcard/);
  assert.match(closed, /손님 주문 현황/);
  assert.match(sheetHtml(s,{sheet:{kind:'companions'}}), /손님맞이 담당/);
  tick(s,RULES.SHIFT_MS);
  assert.doesNotMatch(overlayHtml(s,ui), /지명|피버|스트레스/);
  dispatch(s,{type:'settlement.close'});s.day=9;
  assert.equal(s.hostbar.open,false);
  dispatch(s,{type:'story.seen',id:'m2'});
  dispatch(s,{type:'shift.start'});
  assert.match(topbarHtml(s,ui), /스트레스/);
  assert.match(panelHtml(s,ui), /fever.activate/);
  assert.match(MONTH_STORIES[2].map(b=>JSON.stringify(b)).join(' '), /오늘부터 호스트 카페!/);
  assert.doesNotMatch(MONTH_STORIES[2].map(b=>JSON.stringify(b)).join(' '), /호스트.?바/);
});

test('새 게임 이야기 순서 m0 → 첫 영업 → ev:hunt, 사냥 잠금·변신·복귀', () => {
  const s = createGame();
  assert.match(dispatch(s, { type: 'hunt.start' }).reason, /사냥터 이야기/);
  assert.equal(pendingStory(s), 'm0');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).ok, false);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm0' }).ok);
  // 첫 영업 전에는 「돈 벌어 와, 네오!」가 나오지 않는다
  assert.notEqual(pendingStory(s), 'ev:hunt');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).ok, false);
  assert.match(dispatch(s, { type: 'hunt.start' }).reason, /첫 영업/);
  dispatch(s, { type: 'shift.start' }); tick(s, RULES.SHIFT_MS);
  assert.ok(dispatch(s, { type: 'settlement.close' }).ok);
  assert.equal(pendingStory(s), 'ev:hunt');
  assert.match(EVENT_STORIES['ev:hunt'].map(b=>b.t).join(' '), /빚은 다 못 갚아/);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).ok);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'ev:hunt' }).duplicate);
  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.equal(s.people.neo.form, 'cat');
  dispatch(s, { type: 'hunt.retreat' });
  dispatch(s, { type: 'hunt.finish' });
  assert.equal(s.people.neo.form, 'human');
  assert.equal(deserialize(serialize(s)).state.huntUnlocked, true);
});

test('3·4월 일반 영업만, 5월 이야기 완료/건너뛰기 명령이 지명과 정장을 1회 해금', () => {
  for (const day of [1, 5]) {
    const s = createGame(); s.day = day;
    dispatch(s, { type: 'shift.start' }); dispatch(s, { type: 'auto.toggle', on: true, sim: true });
    tick(s, RULES.SHIFT_MS);
    assert.equal(s.lastSettlement.nominationVisits, 0);
    assert.equal(s.lastSettlement.hostings.length, 0);
  }
  const s = createGame(); s.day = 9;
  assert.equal(dispatch(s, { type: 'story.seen', id: 'm999' }).ok, false);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm2' }).ok);
  assert.equal(s.hostbar.open, true);
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm2' }).duplicate);
  assert.equal(s.outfits.owned.filter(id => id === 'host_first').length, 1);
  dispatch(s, { type: 'shift.start' });
  const c = spawnCustomer(s, { kind: 'nomination', nominee: 'neo', profileId: 'looks' });
  assert.equal(s.visits[c.visitId].kind, 'nomination');
});

test('v1 저장 이전: 월별 잠금·사냥 기록·진행 중 기존 시간과 구매내역 보존', () => {
  for (const day of [1, 2, 4, 7, 36]) {
    const old = createGame(); old.version = 1; old.day = day;
    delete old.hostbar; delete old.huntUnlocked;
    const s = deserialize(serialize(old)).state;
    assert.equal(s.hostbar.open, day >= 7);
    assert.equal(s.huntUnlocked, day > 1);
  }
  const old = createGame(); dispatch(old, { type: 'shift.start' });
  old.version = 1; delete old.shift.durationMs; delete old.shift.nominationMs;
  old.shift.elapsedMs = 900000;
  const s = deserialize(serialize(old)).state;
  assert.equal(shiftDuration(s), 1800000);
  assert.equal(s.shift.elapsedMs, 900000);
  assert.equal(s.shift.nominationMs, 300000);
  dispatch(s, { type: 'resume' }); tick(s, 900000);
  dispatch(s, { type: 'settlement.close' }); dispatch(s, { type: 'shift.start' });
  assert.equal(s.shift.durationMs, 600000);
  assert.equal(s.shift.nominationMs, 60000);
});

test('3월에는 드레스룸이 닫혀 있고, 5월 이야기 뒤에야 받은 정장을 입힌다', () => {
  const s = createGame(); s.moonstone = 1000;
  assert.match(dispatch(s, { type: 'outfit.unlock', id: 'crescent_tailcoat' }).reason, /5월/);
  assert.match(dispatch(s, { type: 'outfit.equip', who: 'neo', slot: 'outfit', itemId: 'host_first' }).reason, /5월/);
  assert.match(sheetHtml(s, { sheet: { kind: 'outfits' } }), /닫힌 드레스룸/);
  s.day = 9;
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm2' }).ok);
  assert.ok(dispatch(s, { type: 'outfit.equip', who: 'neo', slot: 'outfit', itemId: 'host_first' }).ok);
});

test('부탁 노트는 이야기 순서로 공개: 사냥 이야기 전엔 월정석 부탁이, 앞 부탁 전엔 뒤 부탁이 숨는다', () => {
  const s = createGame();
  const ids = () => questView(s).map(q => q.id);
  assert.ok(!ids().includes('q_first_moonstone') && !ids().includes('q_first_exchange'));
  assert.ok(!ids().includes('q_special_menu'));
  assert.match(dispatch(s, { type: 'quest.claim', questId: 'q_special_menu' }).reason, /열리지 않은/);
  s.huntUnlocked = true;
  assert.ok(ids().includes('q_first_moonstone'));
  s.quests.claimed.q_special_ingredient = true;
  assert.ok(ids().includes('q_special_menu'));
});

test('영업 중 카페 레벨이 올라도 그 자리에서 행동력을 더하지 않고, 다음 순 행동력에 반영한다', () => {
  const s = quietShift({ kitchen: true });
  s.stats.served = 239; // 다음 서빙 한 번으로 Lv.4(행동력 +1 구간)에 닿는다
  const ap = s.ap.left;
  seat(s, { kind: 'regular' });
  for (let i = 0; i < 1800 && s.stats.served < 240; i++) tick(s, 100);
  assert.ok(s.stats.served >= 240);
  assert.equal(s.ap.left, ap, '영업 중 행동력은 그대로');
  tickTo(s, RULES.SHIFT_MS);
  dispatch(s, { type: 'settlement.close' });
  assert.equal(s.ap.left, maxActionPoints(s));
  assert.ok(s.ap.left >= TEMP.CALENDAR.AP_PER_TURN + 1);
});

test('보스곡은 서한비 에피소드 전용: 모든 서한비 이야기는 boss로 시작하고 다른 이야기는 쓰지 않는다', () => {
  for (const [n, beats] of Object.entries(HANBI_STORIES)) assert.equal(beats[0].bgm, 'boss', `${n}단계 이야기`);
  const others = [PROLOGUE, ...Object.values(MONTH_STORIES), ...Object.values(EVENT_STORIES), ...Object.values(BOND_STORIES).flatMap(x => Array.isArray(x) ? [x] : Object.values(x)), ...Object.values(VISIT_STORIES)];
  for (const beats of others) assert.ok(!beats.flat(Infinity).some(b => b?.bgm === 'boss'));
});

test('월정석 원정은 챕터·변신·환전 설명이 한 번이며 마지막 시스템 안내를 보존한다', () => {
  const beats = EVENT_STORIES['ev:hunt'];
  assert.equal(beats.filter(b => b.chapter).length, 1);
  assert.equal(beats.filter(b => b.s === 'nar' && b.c?.startsWith('neo_cat')).length, 1);
  assert.equal(beats.filter(b => b.fx === 'transform').length, 1);
  assert.equal(beats.filter(b => b.s !== 'sys' && /골드로 바/.test(b.t || '')).length, 1);
  assert.ok(beats.slice(-2).every(b => b.s === 'sys'));
  assert.match(beats.map(b => b.t).join(' '), /도시락.*별 다섯/);
});
