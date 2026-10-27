import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {serialize,deserialize} from '../src/core/save.js';
import {SPOTS,FIXTURES} from '../src/data/layout.js';
test('옛 계산대 저장은 주문과 지갑을 보존하고 결제 손님 경로만 새 계산대로 잇는다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'}),c=s.customers[g.cid];
 delete s.cafeLayoutVersion;c.state='checkout';c.x=5.5;c.y=14.5;c.path=[[4,14]];
 s.staff.yeoni.home={x:4,y:14};s.staff.yeoni.x=4.5;s.staff.yeoni.y=14.5;
 const before={gold:s.gold,orders:structuredClone(s.orders),visits:structuredClone(s.visits)};
 const r=deserialize(serialize(s));assert.ok(r.ok,r.reason);const n=r.state;
 assert.deepEqual(n.staff.yeoni.home,SPOTS.yeoniHome);assert.equal(n.staff.yeoni.facing,'right');assert.equal(n.cafeLayoutVersion,2);
 assert.deepEqual(n.customers[g.cid].path.at(-1),[SPOTS.checkout.x,SPOTS.checkout.y]);assert.equal(n.gold,before.gold);assert.deepEqual(n.orders,before.orders);assert.deepEqual(n.visits,before.visits);
 const again=deserialize(serialize(n));assert.deepEqual(again.state.customers[g.cid].path,n.customers[g.cid].path);
 assert.ok(!FIXTURES.some(f=>f.cells.some(([x,y])=>x===SPOTS.entrance.x&&y===SPOTS.entrance.y)));
});
