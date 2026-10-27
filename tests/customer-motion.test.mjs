import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {tick,dispatch} from '../src/game/engine.js';
import {customerLeave,requestClean,checkout} from '../src/game/cafe.js';
import {customerPose} from '../src/render/customer-pose.js';
import {serialize,deserialize} from '../src/core/save.js';
test('일어서는 동안 좌석을 예약하고 저장 복원 뒤 한 번만 비운다',()=>{
 let s=quietShift(),g=seat(s,{kind:'regular'}),c=s.customers[g.cid],t=s.tables.find(t=>t.no===g.tableNo);s.visits[g.vid].bill=100;
 customerLeave(s,c,'식사 완료');const at=c.standing.at;customerLeave(s,c,'식사 완료');assert.equal(c.standing.at,at);
 assert.equal(t.customerId,c.id);assert.equal(requestClean(s,t.no).ok,false);const xy=[c.x,c.y];
 tick(s,300);assert.deepEqual([c.x,c.y],xy);assert.equal(t.customerId,c.id);
 s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});c=s.customers[g.cid];t=s.tables.find(t=>t.no===g.tableNo);
 assert.ok(c.standing);tick(s,400);assert.equal(c.standing,null);assert.equal(t.customerId,null);assert.equal(t.state,'dirty');
 const gold=s.gold;for(let i=0;i<1000&&s.customers[g.cid];i++)tick(s,100);
 assert.equal(s.gold,gold+100);assert.equal(s.visits[g.vid].paid,true);assert.equal(checkout(s,s.visits[g.vid]),false);
});
test('착석·기립 프레임은 시간과 의자 방향에서 파생되고 렌더가 상태를 바꾸지 않는다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'}),c=s.customers[g.cid],t=s.tables.find(t=>t.no===g.tableNo);c.state='thinking';c.orderAt=Number.MAX_SAFE_INTEGER;
 for(const dir of ['down','left','right','up']){
  t.facing=dir;c.sitAt=s.shift.elapsedMs;
  for(let i=0;i<4;i++){
   s.shift.elapsedMs=c.sitAt+i*160;const before=JSON.stringify(s),pose=customerPose(s,c);
   assert.equal(pose.state,'transition');assert.equal(pose.animationFrame,i);assert.equal(pose.facing,dir);assert.equal(JSON.stringify(s),before);
  }
 }
 s.shift.elapsedMs=c.sitAt+700;assert.equal(customerPose(s,c).seated,true);
 c.standing={at:s.shift.elapsedMs,until:s.shift.elapsedMs+640,facing:'left'};c.state='checkout';assert.equal(customerPose(s,c).animationFrame,3);
 s.shift.elapsedMs+=320;assert.equal(customerPose(s,c).animationFrame,1);
});
test('결제 손동작은 계산 타이머만 따르고 이동 중에는 걷기를 유지한다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'}),c=s.customers[g.cid];c.state='checkout';c.payAt=s.shift.elapsedMs+1040;c.path=[];c.facing='left';
 assert.equal(customerPose(s,c).state,'pay');assert.equal(customerPose(s,c).flipX,true);
 tick(s,260);c.path=[];c.payAt=s.shift.elapsedMs+780;assert.equal(customerPose(s,c).animationFrame,1);
 assert.equal(customerPose(s,c,true).animationFrame,0);
 c.path=[[4,4]];assert.notEqual(customerPose(s,c).state,'pay');
});
