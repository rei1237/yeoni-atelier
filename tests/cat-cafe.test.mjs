import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostDemo} from '../src/game/host-demo.js';
import {dispatch,tick} from '../src/game/engine.js';
import {catCafeActive} from '../src/game/cat-cafe-rules.js';
import {isResting,changeStress} from '../src/game/stress.js';
import {staffAvailable} from '../src/game/cafe.js';
import {personName} from '../src/game/state.js';
import {serialize,deserialize} from '../src/core/save.js';
import {seat} from './helpers.mjs';
test('인연 문턱과 휴무를 지키며 높은 스트레스의 영냥이가 서빙과 지명을 돕는다',()=>{
 const s=createHostDemo();s.bondRank.neo=7;assert.equal(dispatch(s,{type:'neo.cafeForm'}).ok,false);s.bondRank.neo=8;
 s.dayOff.neo=true;assert.equal(dispatch(s,{type:'neo.cafeForm'}).ok,false);s.dayOff.neo=false;
 s.stress.neo=100;s.resting.neo=true;assert.ok(dispatch(s,{type:'neo.cafeForm',on:true}).ok);assert.ok(catCafeActive(s));assert.equal(personName(s,'neo'),'영냥이');assert.equal(isResting(s,'neo'),false);
 assert.ok(dispatch(s,{type:'shift.start'}).ok);assert.ok(staffAvailable(s,'neo'));changeStress(s,'deliver','neo');assert.equal(isResting(s,'neo'),false);assert.equal(s.stress.neo,100);
 s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;const a=seat(s);assert.ok(dispatch(s,{type:'nomination.accept',tableNo:a.tableNo}).ok);assert.equal(dispatch(s,{type:'neo.cafeForm',on:false}).ok,false);
 assert.equal(dispatch(s,{type:'hunt.start'}).ok,false);assert.equal(Object.keys(s.staff).filter(k=>k==='neo'||k==='neo_cat').length,1);
 const loaded=deserialize(serialize(s));assert.ok(loaded.ok);assert.ok(catCafeActive(loaded.state));tick(s,60000);assert.equal(s.people.neo.activity,'idle');
 s.stress.neo=100;assert.ok(dispatch(s,{type:'neo.cafeForm',on:false}).ok);assert.equal(catCafeActive(s),false);assert.equal(isResting(s,'neo'),true);
});
test('운반 중 모습 변경은 음식과 담당 동료를 보존하고 거절한다',()=>{
 const s=createHostDemo();dispatch(s,{type:'shift.start'});s.staff.neo.job={kind:'deliver',tableNo:1};const before=JSON.stringify(s.staff.neo);
 assert.equal(dispatch(s,{type:'neo.cafeForm'}).ok,false);assert.equal(JSON.stringify(s.staff.neo),before);
});
