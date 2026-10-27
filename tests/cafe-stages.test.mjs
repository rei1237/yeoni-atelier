import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreStage} from '../src/game/cafe-growth.js';

test('평판·분위기 단계는 경계·하락·최고점·잘못된 입력에 일관된다',()=>{
 for(const [kind,a,b] of [['reputation',40,70],['atmosphere',20,60]]){
  assert.equal(scoreStage(kind,-1).level,1);assert.equal(scoreStage(kind,NaN).value,0);
  assert.equal(scoreStage(kind,a-.1).level,1);assert.equal(scoreStage(kind,a).level,2);
  assert.equal(scoreStage(kind,b-.1).level,2);assert.equal(scoreStage(kind,b).level,3);
  assert.equal(scoreStage(kind,b-1).remaining,1);assert.equal(scoreStage(kind,b).next,null);
  assert.equal(scoreStage(kind,b+1000).progress,1);assert.equal(scoreStage(kind,a-1).level,1);
 }
 assert.equal(scoreStage('reputation',1000).value,100);assert.equal(scoreStage('atmosphere',1000).value,1000);
});
