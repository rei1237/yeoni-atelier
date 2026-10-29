// 10-29 남자 손님·대부호 할아버지·부호 팁: 외형은 부유도로 정하고, 매우 만족한 통큰·대부호는 계산할 때 팁(원장 1회)을 둔다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {TEMP} from '../src/config/balance.temp.js';
import {checkout} from '../src/game/cafe.js';
import {pickLook,ELDER_LOOKS,MALE_LOOKS,customerLook} from '../src/data/customer-looks.js';
import {ASSETS} from '../src/render/assets.js';

test('할아버지 외형은 대부호일 때 훨씬 자주 나오고, 나머지 손님에 남자 손님이 섞인다',()=>{
 const P=TEMP.PATRON,grid=n=>Array.from({length:n},(_,i)=>(i+.5)/n),count=(w,f)=>grid(200).flatMap(a=>grid(10).map(b=>pickLook(P,w,a,b))).filter(f).length/2000;
 assert.ok(count('tycoon',l=>ELDER_LOOKS.includes(l))>.5);
 assert.ok(count('ordinary',l=>ELDER_LOOKS.includes(l))<.05);
 const male=count('ordinary',l=>MALE_LOOKS.includes(l));assert.ok(male>.35&&male<.5,String(male));
 for(const l of [8,9]){assert.equal(customerLook({look:l}),l);for(const k of ['customer@look','customer_seated@look','customer_transition@look'])assert.ok(ASSETS.actors[k+l]?.path,k+l);}
});

test('매우 만족한 통큰·대부호 손님은 계산 때 늘 팁을 두고, 한 번만 결산 팁 줄에 들어간다',()=>{
 for(const w of ['generous','tycoon']){
  const s=quietShift(),{vid}=seat(s,{kind:'regular'}),v=s.visits[vid];v.wealthId=w;v.bill=400;v.reviewScore=80;
  const gold=s.gold,tips=s.shift.baseTips,R=TEMP.PATRON.tip[w],tip=Math.min(R.cap,Math.round(400*R.rate));
  checkout(s,v);
  assert.equal(s.ledger.patronTips[v.id],tip,w);
  assert.equal(s.gold,gold+400+tip);assert.equal(s.shift.baseTips,tips+tip);
  assert.equal(checkout(s,v),false);assert.equal(s.shift.baseTips,tips+tip);
 }
});

test('만족 이하 통큰·대부호 손님은 팁을 두지 않는다',()=>{
 const s=quietShift();
 for(const score of [79,null]){const {vid}=seat(s,{kind:'regular'}),v=s.visits[vid];v.wealthId='tycoon';v.bill=400;v.reviewScore=score;checkout(s,v);assert.equal(s.ledger.patronTips?.[vid],undefined,String(score));}
});

test('검소·평범 손님과 지명 손님은 계산 팁을 두지 않는다',()=>{
 const s=quietShift();
 for(const w of ['frugal','ordinary']){const {vid}=seat(s,{kind:'regular'}),v=s.visits[vid];v.wealthId=w;v.bill=300;v.reviewScore=100;checkout(s,v);assert.equal(s.ledger.patronTips?.[vid],undefined);}
 const {vid}=seat(s,{kind:'nomination'}),v=s.visits[vid];v.wealthId='tycoon';v.bill=300;v.reviewScore=100;checkout(s,v);assert.equal(s.ledger.patronTips?.[vid],undefined);
});
