import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {tick,dispatch} from '../src/game/engine.js';
import {stepStaff,sendHome,staffAvailable,facingTarget} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';

test('쉬는 조리 직원은 이동 방향을 유지하고 집에 도착한 뒤만 정면을 본다',()=>{
 const s=quietShift(),b=s.staff.luna_sis;s.resting.luna_sis=true;
 b.x=b.home.x+.5;b.y=b.home.y+3.5;sendHome(s,b);
 tick(s,100);assert.equal(b.action,'walk');assert.equal(b.facing,'up');
 for(let i=0;i<30&&b.path.length;i++)tick(s,100);
 assert.equal(b.facing,'down');assert.equal(b.action,'idle');assert.equal(b.job,null);
});
test('내려놓는 동안에는 복귀·다음 작업을 시작하지 않고 저장 후에도 유지한다',()=>{
 let s=quietShift(),b=s.staff.luna;b.x=3.5;b.y=3.5;b.action='serve';b.actionUntil=s.shift.elapsedMs+600;
 b.servicePose={kind:'serve',at:s.shift.elapsedMs,until:b.actionUntil,tableNo:1};b.facing='left';b.job=null;
 assert.equal(staffAvailable(s,'luna'),false);s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});b=s.staff.luna;
 tick(s,200);assert.equal(b.x,3.5);assert.equal(b.y,3.5);assert.equal(b.facing,'left');assert.equal(b.action,'serve');
 tick(s,500);assert.equal(b.job.kind,'home');assert.equal(b.servicePose,null);
 for(let i=0;i<100&&b.job;i++)tick(s,100);assert.equal(b.facing,'down');
});
test('서빙은 테이블을 보고 끝낸 뒤 복귀하며 음식은 한 번만 전달된다',()=>{
 const s=quietShift({kitchen:true}),g=seat(s,{kind:'regular'});let found=null;
 for(let i=0;i<1500&&!found;i++){tick(s,50);found=Object.values(s.staff).find(x=>x.action==='serve');}
 assert.ok(found);const t=s.tables.find(t=>t.no===found.servicePose.tableNo);
 assert.equal(found.facing,facingTarget(found,t.table));const count=s.visits[g.vid].servedTotal;
 const xy=[found.x,found.y];tick(s,200);assert.deepEqual([found.x,found.y],xy);assert.equal(s.visits[g.vid].servedTotal,count);
});
test('다른 직원이 쉬어도 연이는 계산대를 떠나 정리하지 않는다',()=>{
 const s=quietShift();for(const id of Object.keys(s.staff))if(id!=='yeoni')s.resting[id]=true;
 s.tables[0].state='dirty';dispatch(s,{type:'clean',tableNo:s.tables[0].no});const y=s.staff.yeoni,xy=[y.x,y.y];
 for(let i=0;i<20;i++)tick(s,100);assert.deepEqual([y.x,y.y],xy);assert.notEqual(y.job?.kind,'clean');assert.equal(s.tables[0].state,'dirty');
});
