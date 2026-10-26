import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS } from '../src/render/assets.js';
import { actorSocket } from '../src/data/actor-sockets.js';
import { talkingKey, talkingFrame } from '../src/render/sprite-renderer.js';
import { PEOPLE, STAFF_CREW, RECRUITABLE } from '../src/data/companions.js';
import { dispatch, tick } from '../src/game/engine.js';
import { quietShift, seat } from './helpers.mjs';
import { MENUS } from '../src/data/menus.js';

const DIRS = ['down', 'left', 'right', 'up'];

test('나를 수 있는 모든 배우·의상 시트는 네 방향 손 위치가 있고, 위를 볼 때만 쟁반이 몸 뒤에 간다', () => {
  const carriers = new Set(['yeoni', 'neo', 'moka', ...STAFF_CREW, ...Object.keys(PEOPLE), ...RECRUITABLE.map(r => r.id)]);
  const keys = Object.keys(ASSETS.actors).filter(k => carriers.has(k.split('@')[0]));
  assert.ok(keys.length >= 40, `배우 시트 ${keys.length}개`);
  for (const k of keys) for (const d of DIRS) {
    const s = actorSocket(k, d);
    assert.ok(s, `${k} ${d} 손 위치 없음`);
    assert.ok(s.x > 0 && s.x < 128 && s.y > 40 && s.y < 122 && s.w > 0, `${k} ${d} 셀 밖`);
    assert.equal(s.layer, d === 'up' ? 'back' : 'front');
  }
  for (const d of DIRS) {
    const tray = ASSETS.service[`tray-${d}`], cloth = ASSETS.service[`cloth-${d}`];
    assert.deepEqual(tray.handSockets, [[42, 114], [214, 114]]);
    assert.deepEqual([tray.anchor, tray.itemSocket, cloth.anchor], [[128, 112], [128, 99], [128, 112]]);
  }
});

test('대화 시트 16종과 같은 키의 배지가 있고, 네오는 무대 정장일 때만 무대 시트를 쓴다', () => {
  const talking = Object.keys(ASSETS.talking);
  assert.equal(talking.length, 16);
  for (const k of talking) {
    assert.deepEqual(ASSETS.talking[k].dimensions, [1280, 384], k);
    assert.deepEqual(ASSETS.badges[k]?.dimensions, [192, 192], `${k} 배지`);
  }
  assert.equal(talkingKey('neo@host_first'), 'neo_stage');
  assert.equal(talkingKey('neo@crescent_tailcoat:serious'), 'neo_stage');
  assert.equal(talkingKey('neo@neo_swim'), 'neo');
  assert.equal(talkingKey('neo@winter_coat'), 'neo');
  assert.equal(talkingKey('yun@yun_moon'), 'yun');
  assert.equal(talkingKey('neo_cat'), 'neo_cat');
});

test('직원이 든 음식은 언제나 그 배달이 가리키는 주문의 메뉴다', () => {
  const s = quietShift();
  const guest = seat(s, { kind: 'regular' });
  while (!s.visits[guest.vid].orderIds.length) tick(s, 100);
  const order = s.orders[s.visits[guest.vid].orderIds[0]];
  assert.ok(dispatch(s, { type: 'order.quick', orderId: order.id }).ok);
  tick(s, MENUS[order.menuId].cookMs + 200);
  assert.ok(dispatch(s, { type: 'order.quick', orderId: order.id }).ok);
  let carried = 0;
  for (let i = 0; i < 1500 && order.status !== 'served'; i++) {
    tick(s, 100);
    for (const st of Object.values(s.staff)) if (st.carry) {
      carried++;
      const task = s.tasks.find(t => t.id === st.job?.taskId);
      assert.equal(st.carry.menuId, s.orders[task.orderId].menuId);
    }
  }
  assert.equal(order.status, 'served');
  assert.ok(carried > 0, '운반 장면이 한 번도 없었다');
});

test('루나·루나 언니는 입 벌림 칸 대신 기본 칸으로 말하고 깜빡임은 유지한다', () => {
  assert.equal(talkingFrame('luna', 2), 0);
  assert.equal(talkingFrame('luna_sis', 3), 0);
  assert.equal(talkingFrame('luna', 1), 1);
  assert.equal(talkingFrame('yeoni', 2), 2);
});
