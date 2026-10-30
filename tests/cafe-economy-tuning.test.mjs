import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {INGREDIENTS,MENUS} from '../src/data/menus.js';
import {placeOrder} from '../src/game/cafe.js';
import {quietShift,seat} from './helpers.mjs';

test('재료와 메뉴의 새 기본값은 이익을 높이고 고급 차는 더 오래 걸린다',()=>{
 assert.equal(INGREDIENTS.bean.price,21);assert.equal(INGREDIENTS.night_dew.price,63);
 assert.equal(MENUS.americano.price,200);assert.equal(MENUS.fortune_latte.price,290);
 assert.equal(MENUS.americano.cookMs,7000);assert.ok(MENUS.americano.cookMs<MENUS.flower_cookie.cookMs);
 assert.ok(MENUS.flower_cookie.cookMs<MENUS.lucky_sand.cookMs);assert.ok(MENUS.lucky_sand.cookMs<MENUS.lotus_moon.cookMs);
});
test('연이의 기본 조리는 3초에 완성되고 재료와 완제품은 한 번만 처리된다',()=>{
 const s=createGame(),before=s.stock.bean;const r=dispatch(s,{type:'gift.cook',menuId:'americano',requestId:'three-seconds'});assert.ok(r.ok);assert.equal(s.foodGifts.job.durationMs,3000);
 tick(s,2999);assert.equal(s.foodGifts.items.length,0);tick(s,1);assert.equal(s.foodGifts.items.length,1);assert.equal(s.stock.bean,before-1);tick(s,3000);assert.equal(s.foodGifts.items.length,1);
});
test('새 조리와 가격 변경 전 저장의 취소는 각각 원래 기록된 재료비만 되돌린다',()=>{
 for(const legacy of [false,true]){
  let s=quietShift(),g=seat(s,{kind:'regular'}),v=s.visits[g.vid],o=placeOrder(s,v,'fortune_latte');const originalPrice=o.price;
  const r=dispatch(s,{type:'order.quick',orderId:o.id});assert.ok(r.ok);const job=s.stations.drink.current;
  if(legacy){delete job.ingredientCost;s.shift.ingredientCost=56;o.price=140;}
  s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});assert.equal(s.orders[o.id].price,legacy?140:originalPrice);
  assert.ok(dispatch(s,{type:'cook.cancel',jobId:r.jobId}).ok);assert.equal(s.shift.ingredientCost,0);
 }
});
