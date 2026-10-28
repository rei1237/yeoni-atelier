// 영입 전 인연(윤달·무성·가면의 서한비), 6단계 뒤 공방 이야기의 봉인 대사, 상한 해방 문구, 갈림길 공격 이름
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { bondOpen, bondMasked, bondName, placeLock } from '../src/game/unlocks.js';
import { bondQuestion } from '../src/data/bond-dialogues.js';
import { sheetHtml } from '../src/ui/sheets.js';
import { armorySheet } from '../src/ui/armory.js';
import { EVENT_STORIES } from '../src/story/events.js';
import { TRAILS, stepTrail, trailState } from '../src/game/hunt-trails.js';

const talkTo = (s, id) => { const q = bondQuestion(s, id); return dispatch(s, { type: 'bond.talk', id, choiceId: q.answers[0].id, token: q.token }); };

test('윤달은 공방이, 무성은 가구·꽃 상점이 열리면 영입 전에도 대화로 인연을 쌓는다', () => {
  const s = createGame(); s.huntUnlocked = true;
  assert.equal(bondOpen(s, 'yun'), false); assert.equal(bondOpen(s, 'museong'), false);
  assert.equal(talkTo(s, 'yun').ok, false);
  s.hunter.maxStage = 7; s.day = 7; // 테스트 준비: 6단계 클리어, 5월(가구·꽃 상점 개방)
  assert.equal(placeLock(s, 'gear'), ''); assert.equal(placeLock(s, 'expand'), '');
  for (const id of ['yun', 'museong']) {
    assert.ok(!s.roster[id] && bondOpen(s, id), id);
    const r = talkTo(s, id);
    assert.ok(r.ok, r.reason); assert.ok(s.affinity[id] > 0, id);
  }
  assert.match(sheetHtml(s, { sheet: { kind: 'companions' } }), /윤달[\s\S]*무성|무성[\s\S]*윤달/);
});

test('서한비는 첫 검은 호랑이 이야기 뒤 ??? 로만 인연을 쌓고, 해라체로 답한다', () => {
  const s = createGame(); s.huntUnlocked = true;
  assert.equal(bondOpen(s, 'seohanbi'), false);
  s.ledger.story['hanbi:30'] = true; // 테스트 준비: 첫 검은 호랑이 사건을 봤다
  assert.ok(bondOpen(s, 'seohanbi') && bondMasked(s, 'seohanbi'));
  assert.equal(bondName(s, 'seohanbi'), '???');
  const html = sheetHtml(s, { sheet: { kind: 'companions' }, companionId: 'seohanbi' });
  assert.match(html, /\?\?\?/); assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /서한비/, '보이는 글자에 이름이 없다');
  const r = talkTo(s, 'seohanbi');
  assert.ok(r.ok, r.reason); assert.equal(r.speaker, 'shadow_tiger'); assert.ok(s.affinity.seohanbi > 0);
  s.roster.seohanbi = { usableFrom: s.day }; // 테스트 준비: 영입했다
  assert.equal(bondMasked(s, 'seohanbi'), false); assert.equal(bondName(s, 'seohanbi'), '서한비');
});

test('공방 이야기는 6단계 클리어 뒤 네오의 봉인된 힘을 알아보고, 공방은 상한 해방이라 부른다', () => {
  const text = EVENT_STORIES['ev:forge'].map(b => b.t || '').join(' ');
  assert.match(text, /힘을 봉인하고 있군/); assert.match(text, /힘숨찐/); assert.match(text, /6단계/); assert.match(text, /상한 해방/);
  const s = createGame(); s.huntUnlocked = true; s.hunter.maxStage = 7;
  const html = armorySheet(s, { armoryTab: 'skills' });
  assert.match(html, /상한 해방/); assert.doesNotMatch(html, /단련/);
  s.moonstone = 1e6;
  const up = dispatch(s, { type: 'armory.cap' });
  assert.ok(up.ok, up.reason); assert.ok(up.events.find(e => e.type === 'skillCapRaised').weapon > 3);
});

test('첫 갈림길 위험은 지명이 아니라 공격 이름으로 알린다', () => {
  assert.equal(TRAILS[0].attack, '초승달 일섬');
  const s = createGame(); s.huntUnlocked = true; s.hunter.maxStage = 3;
  assert.ok(dispatch(s, { type: 'hunt.start', depth: 2 }).ok);
  const h = s.hunt, w = { player: { x: 0, y: 0 } };
  trailState(h).nextAt = 0; h.stageMs = 1;
  stepTrail(s, w);
  assert.match(w.banner.label, /^초승달 일섬 · /);
});
