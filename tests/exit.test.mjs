// 10-29 종료 인사: 꽃돼지 연이가 배웅하고, 실제로 저장했을 때만 저장 완료를 보여 준다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { overlayHtml } from '../src/ui/sheets.js';

test('종료 화면은 연이 인사와 운세 링크를 보여 주고, 저장 표시는 저장했을 때만 붙는다', () => {
  const saved = overlayHtml(null, { exited: true, exitSaved: true });
  assert.match(saved, /exit-pig/);
  assert.match(saved, /연이: [^<]*꿀악!/);
  assert.match(saved, /저장 완료/);
  assert.match(saved, /code-destiny\.com/);
  assert.doesNotMatch(overlayHtml(null, { exited: true }), /저장 완료/, '타이틀에서 바로 종료하면 저장했다고 말하지 않는다');
});
