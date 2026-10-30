import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {FURNITURE} from '../src/data/layout.js';
import {furnitureMetrics} from '../src/data/furniture-metrics.js';
import {furnitureCells,buildGrid,validateLayout,tableGeometry} from '../src/game/space.js';
import {atmosphere} from '../src/game/cafe-growth.js';
import {serialize,deserialize} from '../src/core/save.js';
import {decorPrice} from '../src/game/town.js';

test('품목의 실제 칸과 회전 경계·겹침·바닥 레이어가 일치한다',()=>{
 const f={uid:'large',defId:'long_cabinet',x:4,y:5,rot:0};assert.equal(furnitureCells(f).length,6);
 for(let r=0;r<4;r++){const cs=furnitureCells({...f,rot:r});const w=Math.max(...cs.map(c=>c.x))-Math.min(...cs.map(c=>c.x))+1,h=Math.max(...cs.map(c=>c.y))-Math.min(...cs.map(c=>c.y))+1;assert.deepEqual([w,h],r%2?[2,3]:[3,2]);assert.equal(new Set(cs.map(c=>c.x+','+c.y)).size,6);}
 assert.ok(!validateLayout([{...f,x:19,y:6}],[]).ok);assert.ok(!validateLayout([f,{uid:'p',defId:'plant',x:5,y:5,rot:0}],[]).ok);
 assert.ok(validateLayout([f,{uid:'rug',defId:'rug',x:4,y:5,rot:0}],[]).ok);
 assert.ok(!validateLayout([{...f,x:4,y:13}],[]).ok);
});

test('다중 셀 테이블의 첫 칸이 아닌 가장자리 의자와 서빙 동선을 찾는다',()=>{
 const f={uid:'big',defId:'grand_table',x:3,y:6,rot:0,tableNo:6};
 for(const chair of [{x:4,y:8,rot:0},{x:2,y:7,rot:1},{x:4,y:5,rot:2},{x:5,y:7,rot:3}]){
  const c={uid:'seat',defId:'chair',...chair},grid=buildGrid([f,c],[]),g=tableGeometry(grid,f);assert.equal(g.chairUid,'seat');assert.ok(g.service);assert.ok(validateLayout([f,c],[]).ok);
  const rotated={...c,rot:(c.rot+2)%4};assert.equal(tableGeometry(buildGrid([f,rotated],[]),f).chair,null);
 }
});

test('면적 보너스는 같은 등급 단품 합보다 크고 보관·초안·중복 UID는 가산하지 않는다',()=>{
 const scores=[1,2,4,6].map(n=>furnitureMetrics({baseAmbience:2,cells:Array.from({length:n},(_,dx)=>({dx,dy:0,kind:'block'}))}));
 assert.deepEqual(scores.map(x=>x.ambience),[2,5,12,18]);
 const s=createGame();s.interior.furniture=s.interior.furniture.filter(f=>f.defId!=='record_player');s.day=9;assert.equal(atmosphere(s),16);const before=atmosphere(s);s.gold=1e6;assert.ok(dispatch(s,{type:'expand.decor',defId:'grand_planter'}).ok);const f=s.interior.furniture.at(-1);assert.equal(atmosphere(s),before);
 dispatch(s,{type:'interior.begin'});assert.ok(dispatch(s,{type:'interior.place',uid:f.uid,x:0,y:6}).ok);assert.equal(atmosphere(s),before);dispatch(s,{type:'interior.apply'});assert.equal(atmosphere(s),before+18);
 s.interior.furniture.push({...f,x:0,y:6});assert.equal(atmosphere(s),before+18);
});

test('편집 중 구매는 취소해도 보관하며 기존 저장의 위치·비용과 점수는 로드로 중복되지 않는다',()=>{
 const s=createGame(),initial=structuredClone(s.interior.furniture);s.day=9;s.gold=1e6;dispatch(s,{type:'interior.begin'});const cost=decorPrice(s,'grand_table');assert.ok(dispatch(s,{type:'expand.decor',defId:'grand_table'}).ok);
 const bought=s.interior.furniture.at(-1);assert.ok(bought.tableNo);assert.ok(s.interior.draft.furniture.some(f=>f.uid===bought.uid));assert.equal(s.gold,1e6-cost);dispatch(s,{type:'interior.cancel'});
 assert.equal(s.interior.furniture.at(-1).x,null);assert.deepEqual(s.interior.furniture.slice(0,initial.length),initial);
 const loaded=deserialize(serialize(s)).state;assert.deepEqual(loaded.interior.furniture,s.interior.furniture);assert.equal(atmosphere(loaded),atmosphere(s));assert.equal(loaded.gold,s.gold);
 dispatch(s,{type:'shift.start'});assert.equal(dispatch(s,{type:'interior.begin'}).ok,false);assert.equal(dispatch(s,{type:'expand.decor',defId:'grand_planter'}).ok,false);
});
