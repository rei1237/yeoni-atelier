import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {cafeLayout} from '../src/data/layout.js';
import {yeoniIdleFacing} from '../src/render/cafe-view.js';
const open=id=>{const s=createGame({dev:true});s.interior.checkoutLayout=id;dispatch(s,{type:'shift.start'});return s;};
const atCounter=s=>{const at=cafeLayout(s).spots.checkout;s.customers.qa={id:'qa',state:'checkout',x:at.x+.5,y:at.y+.5,path:[]};};
test('대기 중 연이는 정면을 보고, 상태 방향은 그대로다',()=>{
 for(const id of ['legacy','entrance-left']){const s=open(id),y=s.staff.yeoni;
  assert.equal(y.facing,'right');assert.equal(yeoniIdleFacing(s,y),'down');assert.equal(y.facing,'right');}
});
test('계산 손님이 계산 자리에 서거나 계산 몸짓 중이면 계산대 쪽을 본다',()=>{
 const s=open('legacy'),y=s.staff.yeoni;atCounter(s);assert.equal(yeoniIdleFacing(s,y),'right');
 delete s.customers.qa;s.cafeGesture={kind:'bow',at:s.shift.elapsedMs};assert.equal(yeoniIdleFacing(s,y),'right');
 s.cafeGesture={kind:'welcome',at:s.shift.elapsedMs};assert.equal(yeoniIdleFacing(s,y),'down');
 s.cafeGesture={kind:'bow',at:s.shift.elapsedMs-1100};assert.equal(yeoniIdleFacing(s,y),'down');
});
test('entrance 배치는 손님이 있어도 정면이다',()=>{
 const s=open('entrance'),y=s.staff.yeoni;assert.equal(yeoniIdleFacing(s,y),'down');atCounter(s);assert.equal(yeoniIdleFacing(s,y),'down');
});
