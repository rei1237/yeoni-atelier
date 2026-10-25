import test from 'node:test';
import assert from 'node:assert/strict';
import { quietShift, seat, tickTo } from './helpers.mjs';
import { dispatch, tick } from '../src/game/engine.js';
import { serialize, deserialize } from '../src/core/save.js';
import { RULES, NEO_STATS } from '../src/config/rules.js';
import { TEMP } from '../src/config/balance.temp.js';
import { bestHelpChoice, HELP_SCENES } from '../src/data/help.js';
import { acceptCheck } from '../src/game/nomination.js';
import { hostStats } from '../src/game/state.js';

function hosting() {
  const s = quietShift(); s.neoStress = 40;
  const { vid, tableNo } = seat(s);
  assert.ok(dispatch(s, { type: 'nomination.accept', tableNo }).ok);
  return { s, v: s.visits[vid] };
}
test('SOS 정답·오답·시간 만료와 중복 응답은 스트레스·대화에 한 번만 반영', () => {
  for (const result of ['good', 'wrong', 'missed']) {
    const { s, v } = hosting();
    const h = v.help[0]; tickTo(s, h.at);
    const before = s.neoStress;
    if (result === 'missed') tickTo(s, h.until);
    else {
      const best = bestHelpChoice(h.kind, v.prefs);
      const choice = result === 'good' ? best : HELP_SCENES[h.kind].choices.find(([id]) => id !== best)[0];
      assert.ok(dispatch(s, { type: 'help.respond', visitId: v.id, index: 0, choice }).ok);
      const after = s.neoStress;
      assert.equal(dispatch(s, { type: 'help.respond', visitId: v.id, index: 0, choice }).ok, false);
      assert.equal(s.neoStress, after);
    }
    assert.equal(s.neoStress, before + TEMP.NEO_STRESS[result]);
    assert.equal(v.talkBonus, result === 'good' ? TEMP.HELP_GAIN_GOOD : TEMP.HELP_MISS);
    assert.deepEqual(hostStats(s, 'neo'), NEO_STATS);
    assert.equal(deserialize(serialize(s)).state.neoStress, s.neoStress);
  }
});
test('한계는 영업 끝까지 새 지명을 막고 진행 접대는 종료 시각에 정상 정산', () => {
  const s = quietShift(); s.neoStress = 96;
  const first = seat(s);
  dispatch(s, { type: 'nomination.accept', tableNo: first.tableNo });
  assert.equal(s.neoStress, 100); assert.equal(s.neoResting, true);
  const v = s.visits[first.vid];
  tickTo(s, v.help[0].at);
  dispatch(s, { type: 'help.respond', visitId: v.id, index: 0, choice: bestHelpChoice(v.help[0].kind, v.prefs) });
  assert.ok(s.neoStress < 100);
  tickTo(s, v.endAt - 1); assert.equal(v.settled, false);
  tick(s, 1); assert.equal(v.settled, true);
  const next = seat(s);
  assert.ok(acceptCheck(s, next.tableNo).reasons.some(r => r.includes('한계')));
  const restored = deserialize(serialize(s)).state;
  assert.equal(restored.neoResting, true);
  tickTo(s, RULES.SHIFT_MS); const stress = s.neoStress;
  dispatch(s, { type: 'settlement.close' });
  assert.equal(s.neoResting, false);
  assert.equal(s.neoStress, Math.max(0, stress + TEMP.NEO_STRESS.settle));
});
