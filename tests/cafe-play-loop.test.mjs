import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {tick,dispatch} from '../src/game/engine.js';
import {checkout,customerLeave,checkoutQueue} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';
import {computeView,cellToPx} from '../src/render/cafe-view.js';
import {customerPose} from '../src/render/customer-pose.js';
import {SPOTS} from '../src/data/layout.js';

test('모바일 기본 카메라는 입구와 다섯 좌석을 동시에 포함한다',()=>{
 const s=quietShift();for(const width of [360,390,768,1280]){const v=computeView(width,640,{});
 for(const spot of [SPOTS.entrance,SPOTS.checkout,...s.tables.map(t=>t.chair)]){const p=cellToPx(v,spot.x+.5,spot.y+.5);assert.ok(p.x>=0&&p.x<=v.w&&p.y>=0&&p.y<=v.h,JSON.stringify({width,spot,p}));}}
});
test('식사 전체 동안 음료/음식 자세를 유지하고 결제 때 서 있는 자세로 돌아간다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'}),c=s.customers[g.cid];c.action='idle';c.state='eating';
 s.orders.example={visitId:g.vid,status:'served',menuId:'americano'};
 assert.equal(customerPose(s,c).state,'drink');c.state='checkout';assert.equal(customerPose(s,c).seated,false);
});
test('두 손님의 계산 줄은 한 명씩 결제하고 저장 복원·재호출로 돈이 중복되지 않는다',()=>{
 let s=quietShift();const guests=[seat(s,{kind:'regular'}),seat(s,{kind:'regular'})];
 guests.forEach((g,i)=>{s.visits[g.vid].bill=100+i*50;customerLeave(s,s.customers[g.cid],'식사 완료');});
 const gold=s.gold;assert.equal(checkoutQueue(s).length,2);let hadPayment=false;
 for(let i=0;i<800&&checkoutQueue(s).length;i++){
  tick(s,50);const paying=checkoutQueue(s).filter(c=>c.payAt!=null);assert.ok(paying.length<=1);
  if(paying.length&&!hadPayment){hadPayment=true;assert.equal(s.cafeGesture.kind,'cashier');s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});}
 }
 assert.ok(hadPayment);assert.equal(checkoutQueue(s).length,0);assert.equal(s.gold,gold+250);
 for(const g of guests){assert.equal(checkout(s,s.visits[g.vid]),false);assert.equal(s.ledger.checkouts[g.vid],s.visits[g.vid].bill);}
 assert.equal(s.gold,gold+250);
});
