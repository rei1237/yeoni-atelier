import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {placeOrder,chooseMenu} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';
import {MENUS,ingredientCostOf} from '../src/data/menus.js';
import {cookingDifficulty,qualityForTiming,foodScore} from '../src/data/cooking-quality.js';
function setup(){const s=quietShift(),g=seat(s,{kind:'regular'});s.customers[g.cid].state='waiting_food';return {s,g,v:s.visits[g.vid]};}
test('3단계 품질 경계와 대기·분위기 합성은 단조롭고 완벽도 긴 대기를 지우지 않는다',()=>{
 for(const id of ['americano','fortune_latte','black_moon_brown_rice']){const d=cookingDifficulty(id);assert.equal(qualityForTiming(d.min-.01,id),'normal');assert.equal(qualityForTiming(d.min,id),'good');assert.equal(qualityForTiming(d.perfectMin,id),'perfect');assert.equal(qualityForTiming(d.perfectMax,id),'perfect');assert.equal(qualityForTiming(d.perfectMax+.01,id),'good');assert.equal(qualityForTiming(d.max+.01,id),'normal');}
 const values=['normal','good','perfect'].map(q=>foodScore(80,0,q).score);assert.ok(values[0]<values[1]&&values[1]<values[2]);assert.ok(foodScore(200,0,'perfect').score<60);assert.equal(qualityForTiming(undefined,'americano'),'good');assert.equal(qualityForTiming(NaN,'americano'),'normal');
});
test('동일 손님 두 음식의 다른 품질은 작업·트레이·저장·서빙까지 따로 유지한다',()=>{
 let {s,g,v}=setup();const a=placeOrder(s,v,'americano'),b=placeOrder(s,v,'americano');
 const ar=dispatch(s,{type:'order.quick',orderId:a.id,timing:0}),br=dispatch(s,{type:'order.quick',orderId:b.id,timing:50});assert.ok(ar.ok&&br.ok);tick(s,10000);
 assert.deepEqual(s.tray.filter(Boolean).map(x=>x.quality),['normal','perfect']);s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});
 for(const id of [a.id,b.id]){const it=s.tray.find(x=>x?.orderId===id);assert.ok(dispatch(s,{type:'serve',itemId:it.id,tableNo:g.tableNo}).ok);assert.equal(dispatch(s,{type:'serve',itemId:it.id,tableNo:g.tableNo}).ok,false);tick(s,14000);}
 assert.equal(s.orders[a.id].quality,'normal');assert.equal(s.orders[b.id].quality,'perfect');assert.equal(s.orders[a.id].jobId,ar.jobId);assert.equal(s.orders[b.id].jobId,br.jobId);assert.equal(s.visits[v.id].foodScores.length,2);assert.equal(Object.keys(s.ledger.sales).filter(x=>[a.id,b.id].includes(x)).length,2);
});
test('취소된 완벽 작업은 음식·품질을 남기지 않고 재조리와 자동 조리는 새 결과를 쓴다',()=>{
 const {s,g,v}=setup(),o=placeOrder(s,v,'americano'),stock=s.stock.bean;
 const first=dispatch(s,{type:'order.quick',orderId:o.id,timing:50});assert.equal(s.stock.bean,stock-1);assert.ok(dispatch(s,{type:'cook.cancel',jobId:first.jobId}).ok);assert.equal(s.stock.bean,stock);assert.equal(s.tray.filter(Boolean).length,0);assert.equal(dispatch(s,{type:'cook.cancel',jobId:first.jobId}).ok,false);
 const second=dispatch(s,{type:'order.quick',orderId:o.id});assert.notEqual(first.jobId,second.jobId);tick(s,10000);const it=s.tray.find(Boolean);assert.equal(it.quality,'good');assert.equal(it.orderId,o.id);assert.equal(s.stock.bean,stock-1);
});
test('아메리카노는 처음부터 원두 1개만 소모하고 옛 저장·메뉴 생성·레시피 비용과 일치한다',()=>{
 assert.deepEqual(MENUS.americano.ingredients,{bean:1});assert.equal(ingredientCostOf('americano'),30);const old=createGame();delete old.learned.americano;const r=deserialize(serialize(old));assert.equal(r.state.learned.americano,true);
 const {s,g,v}=setup();s.learned=Object.fromEntries(Object.keys(MENUS).map(k=>[k,k==='americano']));s.stock=Object.fromEntries(Object.keys(s.stock).map(k=>[k,k==='bean'?5:0]));assert.equal(chooseMenu(s,60000,v),'americano');const o=placeOrder(s,v,'americano'),before=structuredClone(s.stock);const res=dispatch(s,{type:'order.quick',orderId:o.id,timing:50});assert.ok(res.ok);assert.equal(dispatch(s,{type:'order.quick',orderId:o.id,timing:0}).ok,false);assert.deepEqual(s.stock,{...before,bean:4});assert.equal(s.tray.filter(Boolean).length,0);tick(s,10000);assert.equal(s.tray.find(Boolean).menuId,'americano');assert.equal(s.tray.find(Boolean).quality,'perfect');
});
