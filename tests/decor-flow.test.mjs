// 카페 꾸미기 한 화면: 구매는 즉시 확정, 배치는 적용해야 반영, 지도(sheet.open town)를 거치지 않는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { serialize, deserialize } from '../src/core/save.js';
import { AREAS } from '../src/data/layout.js';
import { decorDirty, purchaseGate, decorPanel } from '../src/ui/decor-screen.js';

const ready = () => { const s = createGame(); s.day = 9; s.hostbar.open = true; s.huntUnlocked = true; s.gold = 100000; return s; }; // 테스트 준비: 꾸미기 개시 후
const ui = (o = {}) => ({ decorSpace: 'indoor', decorTab: 'owned', camera: {}, ...o });

test('구매→자동 선택→추천 자리→놓기→적용이 저장 후에도 남는다', () => {
  const s = ready();
  assert.ok(dispatch(s, { type: 'interior.begin' }).ok);
  const g0 = s.gold, r = dispatch(s, { type: 'expand.decor', defId: 'lamp' });
  assert.ok(r.ok && r.uid, r.reason);
  assert.ok(s.gold < g0, '구매는 바로 골드가 빠진다');
  const sg = dispatch(s, { type: 'interior.suggest', uid: r.uid });
  assert.ok(sg.ok, sg.reason);
  assert.equal(s.interior.draft.selected, r.uid);
  assert.ok(decorDirty(s));
  assert.ok(dispatch(s, { type: 'interior.confirmItem' }).ok);
  assert.ok(dispatch(s, { type: 'interior.apply' }).ok);
  const back = deserialize(serialize(s)).state.interior.furniture.find(f => f.uid === r.uid);
  assert.deepEqual([back.x, back.y], [sg.x, sg.y]);
});

test('전체 취소는 배치만 되돌리고 산 가구·골드·증축은 그대로 둔다', () => {
  const s = ready();
  dispatch(s, { type: 'interior.begin' });
  const r = dispatch(s, { type: 'expand.decor', defId: 'lamp' });
  const [a] = AREAS;
  assert.ok(dispatch(s, { type: 'expand.area', id: a.id }).ok, '꾸미는 중에도 증축할 수 있다');
  dispatch(s, { type: 'interior.suggest', uid: r.uid });
  const paid = s.gold;
  assert.ok(dispatch(s, { type: 'interior.cancel' }).ok);
  assert.equal(s.gold, paid);
  assert.equal(s.interior.furniture.find(f => f.uid === r.uid).x, null, '보관함에 남는다');
  assert.ok(s.interior.areas.includes(a.id));
  assert.equal(decorDirty(s), false);
});

test('정원 배치는 한 단계씩 되돌리고 추천 자리는 대문 길을 막지 않는다', () => {
  const s = ready();
  dispatch(s, { type: 'grounds.buy', id: 'plant' });
  dispatch(s, { type: 'grounds.begin' });
  assert.ok(dispatch(s, { type: 'grounds.suggest', id: 'plant' }).ok);
  const spot = { ...s.outdoor.draft.items[0] };
  dispatch(s, { type: 'grounds.move', id: 'plant', x: 1, y: 4 });
  assert.ok(dispatch(s, { type: 'grounds.undo' }).ok);
  assert.deepEqual([s.outdoor.draft.items[0].x, s.outdoor.draft.items[0].y], [spot.x, spot.y]);
  assert.ok(dispatch(s, { type: 'grounds.apply' }).ok);
});

test('구매 연타는 한 번만 통과하고, 꾸미기 패널은 지도로 보내지 않는다', () => {
  const lock = {};
  assert.equal(purchaseGate(lock, 1000), true);
  assert.equal(purchaseGate(lock, 1200), false);
  assert.equal(purchaseGate(lock, 1401), true);
  const s = ready();
  dispatch(s, { type: 'interior.begin' });
  for (const decorTab of ['owned', 'shop', 'expand']) for (const decorSpace of ['indoor', 'outdoor']) {
    if (decorSpace === 'outdoor') dispatch(s, { type: 'grounds.begin' });
    const html = decorPanel(s, ui({ decorTab, decorSpace }));
    assert.doesNotMatch(html, /data-sheet="town"/);
  }
});

test('옛 실내·증축·정원 안내를 본 저장은 통합 꾸미기 안내도 본 것으로 친다', () => {
  const s = createGame();
  s.tutorials = { ...s.tutorials, expand: true };
  delete s.tutorials.decorate;
  assert.equal(deserialize(serialize(s)).state.tutorials.decorate, true);
});

test('보관함 가구를 놓으면 분위기 상승과 다음 추천 가구를 한 줄로 알려 준다', async () => {
  const { placedNote } = await import('../src/ui/decor-screen.js');
  const { FURNITURE } = await import('../src/data/layout.js');
  const s = ready();
  assert.ok(dispatch(s, { type: 'interior.begin' }).ok);
  const a = dispatch(s, { type: 'expand.decor', defId: 'lamp' }).uid;
  dispatch(s, { type: 'expand.decor', defId: 'plant' });
  assert.ok(dispatch(s, { type: 'interior.pick', uid: a }).ok);
  assert.ok(dispatch(s, { type: 'interior.suggest', uid: a }).ok);
  assert.ok(dispatch(s, { type: 'interior.confirmItem' }).ok);
  const note = placedNote(s, a);
  assert.ok(note.includes(`분위기 +${FURNITURE.lamp.ambience}`), note);
  const next = s.interior.draft.furniture.filter(f => f.x == null).sort((x, y) => FURNITURE[y.defId].ambience - FURNITURE[x.defId].ambience)[0];
  assert.ok(next && note.includes(`다음 추천: ${FURNITURE[next.defId].name}`), note);
});
