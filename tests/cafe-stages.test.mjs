import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreStage,atmosphere,arrivalMultiplier} from '../src/game/cafe-growth.js';
import {createGame} from '../src/game/state.js';

test('평판·분위기 단계는 경계·하락·최고점·잘못된 입력에 일관된다',()=>{
 for(const [kind,a,b] of [['reputation',40,70],['atmosphere',20,60]]){
  assert.equal(scoreStage(kind,-1).level,1);assert.equal(scoreStage(kind,NaN).value,0);
  assert.equal(scoreStage(kind,a-.1).level,1);assert.equal(scoreStage(kind,a).level,2);
  assert.equal(scoreStage(kind,b-.1).level,2);assert.equal(scoreStage(kind,b).level,3);
  assert.equal(scoreStage(kind,b-1).remaining,1);assert.equal(scoreStage(kind,b).next,null);
  assert.equal(scoreStage(kind,b+1000).progress,1);assert.equal(scoreStage(kind,a-1).level,1);
 }
 assert.equal(scoreStage('reputation',1000).value,999);assert.equal(scoreStage('atmosphere',1000).value,100);
});
test('외부에 배치한 소품과 리모델링이 분위기에 반영되고 상한을 지킨다',()=>{
 const s=createGame();const before=atmosphere(s);s.outdoor={items:[{id:'plant',x:1,y:1}]};s.exterior={theme:'salon'};
 assert.ok(atmosphere(s)>before);s.interior.furniture.push(...Array.from({length:100},(_,i)=>({uid:'extra'+i,defId:'plant',x:1,y:1})));assert.equal(atmosphere(s),100);
 const base=arrivalMultiplier(s);s.reputation=999;assert.ok(arrivalMultiplier(s)>base);
});
