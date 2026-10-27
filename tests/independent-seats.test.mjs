import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {START_FURNITURE,splitFurniture} from '../src/data/layout.js';
import {serialize,deserialize} from '../src/core/save.js';
import {cafeCapacity} from '../src/game/capacity.js';
import {spawnCustomer} from '../src/game/cafe.js';
test('구형 5세트는 독립 테이블 5개·의자 5개로 한 번만 이전하고 회전·소유를 보존한다',()=>{
 const old=createGame();old.interior.furniture=structuredClone(START_FURNITURE);old.interior.furniture[0].rot=1;const list=splitFurniture(old.interior.furniture);assert.equal(list.filter(f=>f.defId==='table').length,5);assert.equal(list.filter(f=>f.defId==='chair').length,5);assert.deepEqual(list.find(f=>f.uid==='table1-chair'),{uid:'table1-chair',defId:'chair',x:1,y:4,rot:1});assert.deepEqual(splitFurniture(list),list);const a=deserialize(serialize(old)).state,b=deserialize(serialize(a)).state;assert.deepEqual(a.interior.furniture,b.interior.furniture);
});
test('독립 의자 방향·접근·보관에서 실제 좌석을 파생하고 영업 중 이동은 거절한다',()=>{
 const s=createGame();assert.equal(cafeCapacity(s).seats,5);dispatch(s,{type:'interior.begin'});dispatch(s,{type:'interior.rotate',uid:'table1-chair'});dispatch(s,{type:'interior.apply'});assert.equal(cafeCapacity(s).seats,4);dispatch(s,{type:'interior.begin'});dispatch(s,{type:'interior.store',uid:'table2-chair'});dispatch(s,{type:'interior.apply'});assert.equal(cafeCapacity(s).seats,3);assert.ok(s.interior.furniture.some(f=>f.uid==='table2-chair'&&f.x===null));dispatch(s,{type:'shift.start'});s.shift.scriptIndex=99;s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;assert.equal(s.tables.length,3);assert.equal(dispatch(s,{type:'interior.begin'}).ok,false);for(let n=0;n<3;n++)assert.ok(spawnCustomer(s,{kind:'regular'}));assert.equal(spawnCustomer(s,{kind:'regular'}),null);tick(s,30000);assert.ok(Object.values(s.customers).every(c=>c.facing==='up'));assert.equal(new Set(s.tables.map(t=>t.chairUid)).size,3);
});
test('선택 미리보기·개별 취소·확정 단위 되돌리기·전체 취소는 저장 원본을 보존한다',()=>{
 const s=createGame(),original=structuredClone(s.interior.furniture);dispatch(s,{type:'interior.begin'});dispatch(s,{type:'interior.pick',uid:'plant1'});dispatch(s,{type:'interior.move',uid:'plant1',x:5,y:15});assert.equal(dispatch(s,{type:'interior.confirmItem'}).ok,false);assert.equal(dispatch(s,{type:'interior.apply'}).ok,false);assert.deepEqual(deserialize(serialize(s)).state.interior.furniture,original);dispatch(s,{type:'interior.cancelItem'});assert.deepEqual(s.interior.draft.furniture,original);
 dispatch(s,{type:'interior.pick',uid:'plant1'});dispatch(s,{type:'interior.move',uid:'plant1',x:1,y:9});assert.ok(dispatch(s,{type:'interior.confirmItem'}).ok);assert.equal(s.interior.draft.undo.length,1);assert.ok(dispatch(s,{type:'interior.undo'}).ok);assert.deepEqual(s.interior.draft.furniture,original);dispatch(s,{type:'interior.cancel'});assert.deepEqual(s.interior.furniture,original);
});
test('테이블 구매는 의자를 지급하지 않고 별도 의자는 보관함으로 온다',()=>{
 const s=createGame();s.gold=100000;const chairs=s.interior.furniture.filter(f=>f.defId==='chair').length;const r=dispatch(s,{type:'expand.table'});assert.ok(r.ok);assert.equal(s.interior.furniture.filter(f=>f.defId==='chair').length,chairs);assert.equal(cafeCapacity(s).seats,5);assert.equal(s.interior.furniture.find(f=>f.tableNo===r.tableNo).x,null);assert.ok(dispatch(s,{type:'expand.decor',defId:'chair'}).ok);assert.equal(s.interior.furniture.at(-1).x,null);assert.equal(s.interior.furniture.at(-1).defId,'chair');
});
