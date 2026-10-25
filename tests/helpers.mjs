// 테스트 공용 도우미(테스트 파일이 아님: *.test.mjs 가 아니므로 직접 실행되지 않는다)
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { spawnCustomer } from '../src/game/cafe.js';

// 영업을 시작하고 대본·무작위 입장을 끈다. 손님은 테스트가 직접 들여보낸다.
// 주방 자동(선택 시 켜짐)도 끈다: 조리·서빙을 테스트가 명령으로 직접 낸다. 자동을 보는 테스트는 kitchen=true.
export function quietShift({ dev = false, kitchen = false, beforeStart = () => {} } = {}) {
  const s = createGame({ dev });
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.autoKitchen = kitchen;
  beforeStart(s);
  const r = dispatch(s, { type: 'shift.start' });
  assert.ok(r.ok, r.reason);
  s.shift.scriptIndex = 99;
  s.shift.nextSpawnAt = Number.MAX_SAFE_INTEGER; // JSON 왕복에도 유지되는 값
  return s;
}

// 손님을 들여보내고 자리에 앉을 때까지(입장 중이 끝날 때까지) 활성 시간을 진행한다
export function seat(s, { kind = 'nomination', profileId = 'looks', nominee = 'neo' } = {}) {
  const c = spawnCustomer(s, { kind, nominee: kind === 'nomination' ? nominee : undefined, profileId });
  assert.ok(c, '빈 테이블이 없다');
  for (let i = 0; s.customers[c.id].state === 'entering'; i++) {
    assert.ok(i < 600, '손님이 60초 안에 자리에 앉지 못했다');
    tick(s, 100);
  }
  return { cid: c.id, vid: c.visitId, tableNo: c.tableNo };
}

// 영업 경과 시간을 target 까지 진행(엔진 tick 만 사용)
export function tickTo(s, target) {
  const dt = target - s.shift.elapsedMs;
  if (dt > 0) tick(s, dt);
  assert.equal(s.shift?.elapsedMs ?? target, target);
}

export const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);
