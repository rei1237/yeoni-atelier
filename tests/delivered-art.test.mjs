import test from 'node:test';
import assert from 'node:assert/strict';
import {customerPose} from '../src/render/customer-pose.js';
import {ASSETS} from '../src/render/assets.js';
import {craftProduction} from '../src/ui/crafting.js';
import {serialize,deserialize} from '../src/core/save.js';
import {quietShift,seat} from './helpers.mjs';

test('착석 그림은 실제 의자 도착과 주문 음식·음료에 맞고 이동하면 걷기 그림으로 돌아간다',()=>{
 const s=quietShift(),{cid}=seat(s,{kind:'regular'}),c=s.customers[cid],tb=s.tables.find(t=>t.customerId===cid);
 c.action='eat';s.orders.a={id:'a',visitId:c.visitId,menuId:'americano',status:'served'};
 for(const facing of ['down','left','right','up']){tb.facing=facing;const before=JSON.stringify(s),pose=customerPose(s,c);assert.equal(pose.seated,true);assert.equal(pose.facing,facing);assert.equal(pose.state,'drink');assert.equal(JSON.stringify(s),before);}
 s.orders.a.menuId='cookie';assert.equal(customerPose(s,c).state,'eat');
 c.path=[{x:1,y:1}];assert.equal(customerPose(s,c).seated,false);c.path=[];c.state='checkout';assert.equal(customerPose(s,c).seated,false);
 const loaded=deserialize(serialize(s)).state;assert.deepEqual(customerPose(loaded,loaded.customers[cid]),customerPose(s,c));
});

test('손님 8외형은 4개 정본과 옷 전용 마스크를 공유하고 착석 각 열은 고정 자세다',()=>{
 const paths=new Set();for(let i=0;i<8;i++){
  const walk=ASSETS.actors['customer@look'+i],sit=ASSETS.actors['customer_seated@look'+i];paths.add(walk.path);
  assert.deepEqual(sit.directions,['down','left','right','up']);assert.equal(sit.anchor.y,93);
  for(const [n,id] of ['idle','eat','drink','react'].entries()){assert.equal(sit.states[id].frameOffset,n);assert.equal(sit.states[id].frames,1);}
  assert.ok(ASSETS.service[sit.clothesMask.split('/')[1]]);assert.equal(!!walk.clothesHue,i>=4);
 }assert.equal(paths.size,4);
 const chairs=['up','right','down','left'].map(x=>ASSETS.objects['chair_'+x].path);assert.equal(new Set(chairs).size,4);
});

test('조리 화면의 직원 프레임은 해당 작업에서 읽고 취소·완성 뒤 남지 않는다',()=>{
 const s=quietShift(),c={menuId:'americano',jobId:'visual'};s.stations.drink.current={id:'visual',menuId:'americano',durationMs:10000,progressMs:4000};
 assert.equal(craftProduction(s,c).pose.phase,'extract');s.stations.drink.current=null;assert.equal(craftProduction(s,c).pose,undefined);
 s.tray[0]={jobId:'visual',menuId:'americano'};assert.equal(craftProduction(s,c).status,'ready');assert.equal(craftProduction(s,c).pose,undefined);
});
