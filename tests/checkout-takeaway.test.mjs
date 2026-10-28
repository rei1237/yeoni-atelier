// 회귀: 포장 손님이 계산 자리(줄 첫 칸)에 서서 결제 손님과 엉켜 영업 내내 못 나가던 문제
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { spawnCustomer } from '../src/game/cafe.js';
import { cafeLayout } from '../src/data/layout.js';
import { quietShift, enableAutomation } from './helpers.mjs';

test('포장 손님은 계산 대기칸이 아닌, 서로 다른 칸에서 기다린다', () => {
  for (const layout of ['entrance-left', 'entrance', 'legacy']) {
    const s = quietShift({ beforeStart: s => { s.interior.checkoutLayout = layout; } });
    const L = cafeLayout(s), queue = (L.queue || [L.spots.checkout]).map(p => p.x + ',' + p.y);
    const a = spawnCustomer(s, { kind: 'takeaway' }), b = spawnCustomer(s, { kind: 'takeaway' });
    for (const c of [a, b].filter(Boolean)) assert.ok(!queue.includes(c.path.at(-1).join(',')), `${layout}: 포장 손님이 계산 칸 ${c.path.at(-1)} 에서 기다린다`);
    if (a && b) assert.notDeepEqual(a.path.at(-1), b.path.at(-1));
  }
});

test('입구 계산대 영업에서 결제·퇴장 손님이 30초 넘게 멈추지 않는다', () => {
  for (const seed of [2, 24, 25, 29, 39]) {
    const s = createGame({ seed }); s.hostbar.open = true;
    for (const k of Object.keys(s.stock)) s.stock[k] = 100;
    enableAutomation(s, ['hall', 'kitchen']);
    assert.ok(dispatch(s, { type: 'shift.start' }).ok);
    const since = {};
    while (s.mode === 'shift' && s.shift.elapsedMs < 400000) {
      tick(s, 100);
      for (const c of Object.values(s.customers)) {
        if (!['checkout', 'leaving'].includes(c.state) || c.checkoutWaiting) continue;
        const k = c.id + c.state; since[k] ??= s.shift.elapsedMs;
        assert.ok(s.shift.elapsedMs - since[k] < 30000, `seed ${seed}: ${c.id} ${c.state} (${c.x.toFixed(2)},${c.y.toFixed(2)}) 이 30초 넘게 멈췄다`);
      }
    }
  }
});
