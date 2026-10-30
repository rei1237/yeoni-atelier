import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {SUPPLIES,supplyPrice} from '../src/game/moka-armory.js';
import {supplyShop} from '../src/ui/armory.js';
import {serialize,deserialize} from '../src/core/save.js';
import {TEMP} from '../src/config/balance.temp.js';

test('모카 보급품은 골드만 차감하고 윤달 도구는 월정석을 사용한다',()=>{
 let s=createGame();s.gold=100000;s.moonstone=1000;const price=supplyPrice(SUPPLIES.tonic).amount;
 assert.match(supplyShop(s),new RegExp(price.toLocaleString()+'G'));assert.ok(dispatch(s,{type:'armory.buy',id:'tonic'}).ok);assert.equal(s.gold,100000-price);assert.equal(s.moonstone,1000);
 s.gold=0;const before=JSON.stringify(s);assert.equal(dispatch(s,{type:'armory.buy',id:'tonic'}).ok,false);assert.equal(JSON.stringify(s),before);
 s.day=10;s.hunter.maxStage=7;const m=s.moonstone;assert.ok(dispatch(s,{type:'armory.buy',id:'bomb'}).ok);assert.equal(s.moonstone,m-SUPPLIES.bomb.cost);assert.equal(s.gold,0);
 s=deserialize(serialize(s)).state;assert.equal(s.armory.supplies.tonic,1);assert.equal(s.armory.supplies.bomb,1);
});
test('무성의 일부 가구만 월정석 구매를 허용하며 기존 골드 선택도 유지한다',()=>{
 const s=createGame();s.day=10;s.gold=10000;s.moonstone=10;const count=s.interior.furniture.length;
 assert.ok(dispatch(s,{type:'expand.decor',defId:'moon_lamp',currency:'moonstone'}).ok);assert.equal(s.moonstone,10-TEMP.DECOR_MOONSTONE.moon_lamp);assert.equal(s.gold,10000);assert.equal(s.interior.furniture.length,count+1);
 const before=JSON.stringify(s);assert.equal(dispatch(s,{type:'expand.decor',defId:'plant',currency:'moonstone'}).ok,false);assert.equal(JSON.stringify(s),before);
 assert.ok(dispatch(s,{type:'expand.decor',defId:'moon_lamp'}).ok);assert.equal(s.gold,10000-TEMP.DECOR_PRICES.moon_lamp);
});
