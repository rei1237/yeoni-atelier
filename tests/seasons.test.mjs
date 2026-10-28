// 계절 소품(0.7): 24달 한 편씩, 중순 준비 때 한 번, 합류 전 동료 박자는 빠진다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { pendingStory, SEASON_MONTHS } from '../src/game/calendar.js';
import { SEASON_STORIES, seasonStory } from '../src/story/seasons.js';
import { SPEAKERS } from '../src/story/prologue.js';
import { ASSETS } from '../src/render/assets.js';
import { serialize, deserialize } from '../src/core/save.js';

test('계절 소품은 24편이고 대사는 두 문장 이하, 초상은 실제 에셋에 있다', () => {
  assert.equal(SEASON_STORIES.length, SEASON_MONTHS);
  for (const ep of SEASON_STORIES) {
    assert.equal(ep.filter(b => b.chapter).length, 1);
    for (const b of ep) {
      if (b.s && !['nar', 'sys', 'impact'].includes(b.s)) assert.ok(SPEAKERS[b.s], b.s);
      if (b.s && !['nar', 'sys', 'impact'].includes(b.s)) assert.ok(b.t.split(/(?<=[.!?])\s+/).length <= 2, b.t);
      if (b.t?.includes('(')) assert.equal(b.s, 'yeoni', '괄호 속마음은 연이만');
      for (const k of ['l', 'c', 'r']) if (b[k]) {
        const who = b[k].split(':')[0];
        assert.ok(ASSETS.portraits[who] || ASSETS.talking[who], b[k]);
      }
    }
    assert.ok(!(ep.some(b => b.s === 'neo') && ep.some(b => b.s === 'neo_cat')), '네오와 영냥이는 같은 사람');
  }
});

test('계절 소품: 그달 중순 준비 때 한 번, 상순에는 달 이야기만, 저장 뒤 중복 없음', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; s.ledger.story.prologue = true; // 테스트 준비
  assert.equal(pendingStory(s), 'm0');
  assert.ok(dispatch(s, { type: 'story.seen', id: 'm0' }).ok);
  assert.equal(pendingStory(s), null, '상순에는 계절 소품이 없다');
  assert.equal(dispatch(s, { type: 'story.seen', id: 'season:0' }).ok, false);
  s.day = 2; // 테스트 준비: 1년차 3월 중순
  assert.equal(pendingStory(s), 'season:0');
  assert.ok(dispatch(s, { type: 'story.seen', id: 'season:0' }).ok);
  const back = deserialize(serialize(s)).state;
  assert.notEqual(pendingStory(back), 'season:0');
  assert.equal(dispatch(back, { type: 'story.seen', id: 'season:0' }).duplicate, true);
});

test('합류하지 않은 동료의 박자는 빠지고, 합류하면 나온다', () => {
  const s = createGame();
  const idx = SEASON_STORIES.findIndex(ep => ep.some(b => b.need === 'solv'));
  assert.ok(!seasonStory(idx, s).some(b => b.s === 'solv'));
  s.roster.solv = { usableFrom: 1 }; // 테스트 준비: 솔브 합류
  assert.ok(seasonStory(idx, s).some(b => b.s === 'solv'));
  assert.ok(seasonStory(idx, s).every(b => !('need' in b)));
  assert.equal(seasonStory(SEASON_MONTHS, s), null);
});
