import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {MENUS} from '../src/data/menus.js';
import {yeoniThreshold} from '../src/game/yeoni-growth.js';
import {deliveryQuote} from '../src/game/delivery.js';
import {firstDayStep} from '../src/game/first-day.js';
import {GUIDES,FEATURE_GUIDES,guideForContext} from '../src/ui/tutorials.js';
import {quietShift,seat} from './helpers.mjs';
import {placeOrder} from '../src/game/cafe.js';
import {tableCookingOrders} from '../src/game/table-cooking.js';
import {stationJobs} from '../src/game/station-slots.js';
const run=(s,type,args={})=>dispatch(s,{type,...args});
test('묶음 배달은 기본 200G 한 번, 원자적 비용·재료 반영, 저장 후 재실행 방지',()=>{
 let s=createGame(),ap=s.ap.left,bean=s.stock.bean,milk=s.stock.milk;const items={bean:2,milk:3};const q=deliveryQuote(s,items);assert.equal(q.fee,200);assert.equal(q.base,96);
 assert.ok(run(s,'shop.deliver',{items,requestId:'one'}).ok);assert.equal(s.gold,600-296);assert.equal(s.stock.bean,bean+2);assert.equal(s.stock.milk,milk+3);assert.equal(s.ap.left,ap);
 s=deserialize(serialize(s)).state;const before=serialize(s);assert.ok(run(s,'shop.deliver',{items,requestId:'one'}).duplicate);assert.equal(serialize(s),before);
 assert.equal(run(s,'shop.deliver',{items:{bean:99},requestId:'poor'}).ok,false);assert.equal(serialize(s),before);
 assert.equal(run(s,'shop.deliver',{items:{bean:1,pumpkin:1},requestId:'invalid'}).ok,false);assert.equal(serialize(s),before);
 const shop=createGame();const r=run(shop,'shop.buy',{ingredientId:'bean',qty:2});assert.equal(r.fee,0);assert.equal(shop.gold,558);
});
test('특별 메뉴는 레벨·직접 완성을 모두 충족한 뒤 등록, 저장·중복과 실제 판매 인기도',()=>{
 let s=createGame();const id='yeoni_moon_latte';assert.equal(run(s,'gift.cook',{menuId:id,requestId:'locked'}).ok,false);
 s.yeoniGrowth.xp=yeoniThreshold(3);assert.equal(run(s,'yeoni.menu.register',{menuId:id}).ok,false);
 assert.ok(run(s,'gift.cook',{menuId:id,requestId:'first',timing:50}).ok);tick(s,20000);assert.equal(s.learned[id],undefined);assert.equal(s.yeoniGrowth.recipes[id],1);
 s=deserialize(serialize(s)).state;const count=s.foodGifts.items.length;assert.ok(run(s,'yeoni.menu.register',{menuId:id}).ok);assert.ok(s.learned[id]);assert.equal(s.foodGifts.items.length,count);assert.ok(run(s,'yeoni.menu.register',{menuId:id}).duplicate);
 const game=quietShift({beforeStart:s=>s.learned[id]=true});const g=seat(game,{kind:'regular'});const o=placeOrder(game,game.visits[g.vid],id);run(game,'order.quick',{orderId:o.id,timing:50});tick(game,20000);const item=game.tray.find(it=>it?.orderId===o.id),pop=game.reputation;
 assert.ok(run(game,'serve',{itemId:item.id,tableNo:g.tableNo}).ok);tick(game,15000);assert.ok(game.reputation>=pop+MENUS[id].reputationBonus);const after=game.reputation;assert.equal(run(game,'serve',{itemId:item.id,tableNo:g.tableNo}).ok,false);assert.equal(game.reputation,after);
});
test('첫날 안내는 실제 행동력과 완성 상태를 따라가며 안내 읽기만으로 소모하지 않는다',()=>{
 let s=createGame();assert.equal(firstDayStep(s).id,'decorate');const before=s.ap.left;run(s,'tutorial.seen',{id:'decorate'});assert.equal(firstDayStep(s).id,'cook');run(s,'tutorial.seen',{id:'personal'});assert.equal(s.ap.left,before);
 run(s,'gift.cook',{menuId:'americano',requestId:'day1'});assert.equal(firstDayStep(s).id,'cooking');tick(s,10000);assert.equal(firstDayStep(s).id,'talk');
 s=deserialize(serialize(s)).state;assert.equal(firstDayStep(s).id,'talk');s.ap.talked.luna=true;s.ap.left=1;assert.equal(firstDayStep(s).id,'cook');s.ap.left=0;assert.equal(firstDayStep(s).id,'open');s.day=2;assert.equal(firstDayStep(s),null);
 for(const id of Object.values(FEATURE_GUIDES))assert.ok(GUIDES[id]?.steps.length>=2);
 assert.equal(guideForContext(null,{}),null);assert.equal(guideForContext(s,{sheet:{kind:'craft'},craft:{tableNo:1}}),'batch');assert.equal(guideForContext(s,{sheet:{kind:'delivery'}}),'delivery');
});
test('한 테이블의 두 음료는 한 명령으로 동시 시작, 재료 부족·중복은 무변경',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'});placeOrder(s,s.visits[g.vid],'americano');placeOrder(s,s.visits[g.vid],'fortune_latte');assert.equal(tableCookingOrders(s,g.tableNo).length,2);
 const bean=s.stock.bean;s.stock.milk=0;const before=serialize(s);assert.equal(run(s,'order.table',{no:g.tableNo,timing:50}).ok,false);assert.equal(serialize(s),before);s.stock.milk=2;
 const result=run(s,'order.table',{no:g.tableNo,timing:50});assert.ok(result.ok,result.reason);assert.equal(result.count,2);assert.equal(result.queued,0);assert.equal(stationJobs(s.stations.drink).length,2);assert.equal(s.stock.bean,bean-2);assert.equal(s.stock.milk,1);
 const done=serialize(s);assert.equal(run(s,'order.table',{no:g.tableNo,timing:50}).ok,false);assert.equal(serialize(s),done);
});
