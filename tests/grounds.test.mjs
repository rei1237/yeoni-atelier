import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {groundSize,validateGround,REMODELS} from '../src/game/grounds.js';
import {groundsSheet} from '../src/ui/grounds.js';
test('가구·바닥·외관 구매는 잔액을 검증하고 같은 상품은 한 번만 차감한다',()=>{
 const s=createGame();s.gold=0;assert.equal(dispatch(s,{type:'grounds.buy',id:'plant'}).ok,false);assert.equal(dispatch(s,{type:'remodel.buy',id:'salon'}).ok,false);s.gold=20000;
 for(const cmd of [{type:'grounds.buy',id:'plant'},{type:'grounds.floor.buy',id:'wood'},{type:'remodel.buy',id:'salon'}]){const old=s.gold;assert.ok(dispatch(s,cmd).ok);assert.ok(s.gold<old);const paid=s.gold;assert.equal(dispatch(s,cmd).duplicate,true);assert.equal(s.gold,paid);}
 assert.equal(dispatch(s,{type:'remodel.apply',id:'blossom'}).ok,false);assert.ok(dispatch(s,{type:'remodel.apply',id:'salon'}).ok);assert.equal(s.exterior.theme,'salon');assert.notEqual(REMODELS.salon.interior,REMODELS.original.interior);
});
test('외부 배치 초안의 취소·저장은 원래 배치를 보존하고 문과 길 막힘은 적용하지 않는다',()=>{
 const s=createGame();s.gold=20000;dispatch(s,{type:'grounds.buy',id:'plant'});dispatch(s,{type:'grounds.begin'});dispatch(s,{type:'grounds.move',id:'plant',x:5,y:3});assert.equal(dispatch(s,{type:'grounds.apply'}).ok,false);assert.equal(s.outdoor.items[0].x,null);
 dispatch(s,{type:'grounds.move',id:'plant',x:1,y:4});dispatch(s,{type:'grounds.rotate',id:'plant'});assert.equal(s.outdoor.draft.items[0].rot,2);assert.equal(deserialize(serialize(s)).state.outdoor.draft,null);assert.equal(deserialize(serialize(s)).state.outdoor.items[0].x,null);dispatch(s,{type:'grounds.cancel'});assert.equal(s.outdoor.items[0].x,null);
 dispatch(s,{type:'grounds.begin'});dispatch(s,{type:'grounds.move',id:'plant',x:1,y:4});assert.ok(dispatch(s,{type:'grounds.apply'}).ok);assert.equal(deserialize(serialize(s)).state.outdoor.items[0].x,1);
 const wall=Array.from({length:12},(_,x)=>({id:'plant',x,y:4}));assert.equal(validateGround(s,wall).ok,false);assert.equal(validateGround(s,wall.filter(x=>x.x!==5)).ok,true);
});
test('부지 확장은 확인·예상 단계가 일치해야 하며 재시도·영업 중 요청은 차감하지 않는다',()=>{
 const s=createGame();s.gold=100000;const before=s.gold;assert.equal(dispatch(s,{type:'grounds.expand',level:1}).ok,false);assert.equal(s.gold,before);assert.ok(dispatch(s,{type:'grounds.expand',level:1,confirmed:true}).ok);assert.equal(groundSize(s).rows,10);const paid=s.gold;assert.equal(dispatch(s,{type:'grounds.expand',level:1,confirmed:true}).ok,false);assert.equal(s.gold,paid);s.mode='shift';assert.equal(dispatch(s,{type:'grounds.begin'}).ok,false);assert.equal(dispatch(s,{type:'remodel.apply',id:'original'}).ok,false);
});
test('미리보기만으로 구매·장착·게임 상태가 바뀌지 않는다',()=>{
 const s=createGame(),before=serialize(s);assert.match(groundsSheet(s,{sheet:{kind:'grounds'},groundTab:1,remodelPreview:'salon'}),/구매 전 미리보기/);assert.equal(serialize(s),before);
});
