import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_NAV} from '../src/ui/world-navigation-data.js';
import {worldRoute,createWorldTrip,advanceTrip} from '../src/ui/world-travel.js';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';

test('8개 장소가 정본 길을 따라 연결되고 카페 지붕을 가로지르지 않는다',()=>{
 assert.ok(Object.keys(WORLD_NAV.waypoints).length>15);assert.ok(WORLD_NAV.edges.every(([a,b])=>WORLD_NAV.waypoints[a]&&WORLD_NAV.waypoints[b]));
 for(const a of WORLD_NAV.destinations)for(const b of WORLD_NAV.destinations){const path=worldRoute(WORLD_NAV,a.id,b.id);assert.ok(path);assert.deepEqual(path[0],{x:a.arrival[0]*100,y:a.arrival[1]*100});assert.deepEqual(path.at(-1),{x:b.arrival[0]*100,y:b.arrival[1]*100});}
 assert.equal(WORLD_NAV.edges.some(e=>e.includes('northcenter')&&e.includes('atelier')),false);
});
test('길 이동은 실제 비율로 보행하고 즉시 도착은 한 번만 완료된다',()=>{
 const t=createWorldTrip('moka',worldRoute(WORLD_NAV,'atelier','moka'));const first=advanceTrip(t,100);assert.equal(first.arrived,false);assert.equal(t.distance,18);const end=advanceTrip(t,0,true);assert.equal(end.arrived,true);assert.equal(end.facing,'down');assert.equal(advanceTrip(t,100),null);
});
test('잠긴 장소는 위치 저장을 거절하고 열린 장소만 저장 및 복원한다',()=>{
 const s=createGame(),before=JSON.stringify(s);assert.equal(dispatch(s,{type:'world.arrive',place:'farm'}).ok,false);assert.equal(JSON.stringify(s),before);assert.equal(dispatch(s,{type:'world.arrive',place:'moka'}).ok,true);assert.equal(deserialize(serialize(s)).state.worldLocation,'moka');assert.equal(dispatch(s,{type:'world.arrive',place:'center'}).ok,false);
});


test('무성 상점은 첫해 5월부터 열리고 기존 가구는 그대로 남는다',()=>{
 const s=createGame();s.gold=100000;const original=structuredClone(s.interior.furniture),gold=s.gold;
 for(const type of ['expand.table','expand.area','expand.decor']){const cmd={type,id:'east_wing',defId:'plant'};assert.equal(dispatch(s,cmd).ok,false);}
 assert.equal(dispatch(s,{type:'town.visit',place:'expand'}).ok,false);assert.equal(dispatch(s,{type:'world.arrive',place:'expand'}).ok,false);assert.deepEqual(s.interior.furniture,original);assert.equal(s.gold,gold);
 s.day=9;assert.equal(dispatch(s,{type:'town.visit',place:'expand'}).ok,true);assert.equal(dispatch(s,{type:'expand.decor',defId:'plant'}).ok,true);
});
