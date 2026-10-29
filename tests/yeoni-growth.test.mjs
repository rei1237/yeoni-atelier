import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {yeoniProgress,yeoniEffects,yeoniThreshold,yeoniTitles} from '../src/game/yeoni-growth.js';
import {bondQuestion} from '../src/data/bond-dialogues.js';
import {maxActionPoints} from '../src/game/calendar.js';
import {cafeLayout} from '../src/data/layout.js';
import {validateLayout} from '../src/game/space.js';
import {quietShift,seat} from './helpers.mjs';
import {placeOrder,foodPatienceMs,checkoutQueue} from '../src/game/cafe.js';
import {reviewVisit} from '../src/game/reputation.js';
import {cafeSpots} from '../src/data/layout.js';
import {TEMP} from '../src/config/balance.temp.js';
const run=(s,type,x={})=>dispatch(s,{type,...x});
const cook=(s,id)=>run(s,'gift.cook',{menuId:'americano',requestId:id,timing:50});

test('첫날 세 번 조리, 중복·실패·취소 무경험치, 행동력과 완제품 저장',()=>{
 let s=createGame(),stock=s.stock.bean;
 const first=cook(s,'cancel');assert.ok(first.ok);assert.equal(s.ap.left,2);assert.equal(s.yeoniGrowth.xp,0);
 assert.equal(cook(s,'cancel').ok,false);assert.ok(run(s,'gift.cancel',{id:first.jobId}).ok);assert.equal(s.ap.left,3);assert.equal(s.stock.bean,stock);assert.equal(s.yeoniGrowth.xp,0);
 assert.equal(run(s,'gift.cancel',{id:first.jobId}).ok,false);
 for(let i=0;i<3;i++){assert.ok(cook(s,'cook'+i).ok);if(i===0){tick(s,5000);s=deserialize(serialize(s)).state;}tick(s,20000);}
 assert.equal(s.ap.left,0);assert.equal(s.yeoniGrowth.xp,36);assert.equal(s.foodGifts.items.length,3);assert.equal(s.stock.bean,stock-3);assert.equal(yeoniProgress(s).level,2);
 const before=serialize(s);assert.equal(cook(s,'empty').ok,false);tick(s,60000);assert.equal(serialize(s),before);
 const saved=deserialize(serialize(s)).state;assert.equal(saved.yeoniGrowth.xp,36);assert.equal(saved.foodGifts.items.length,3);
});
test('직접 농장·대화·선물의 성공만 성장하고 대행과 재실행은 제외',()=>{
 const s=createGame();s.ledger.story.m1=true;
 assert.ok(run(s,'farm.plant',{cropId:'tea',index:0}).ok);assert.equal(s.yeoniGrowth.xp,4);
 assert.equal(run(s,'farm.plant',{cropId:'tea',index:0}).ok,false);assert.equal(s.yeoniGrowth.xp,4);
 const q=bondQuestion(s,'luna');assert.ok(run(s,'bond.talk',{id:'luna',choiceId:q.answers[0].id,token:q.token}).ok);assert.equal(s.yeoniGrowth.xp,14);
 assert.equal(run(s,'bond.talk',{id:'luna',choiceId:q.answers[0].id,token:q.token}).ok,false);
 assert.ok(cook(s,'gift').ok);tick(s,20000);const item=s.foodGifts.items[0];assert.ok(run(s,'gift.food',{id:'luna',itemId:item.id}).ok);assert.equal(s.yeoniGrowth.xp,32);
 assert.equal(run(s,'gift.food',{id:'luna',itemId:item.id}).ok,false);assert.equal(s.yeoniGrowth.xp,32);
 const h=createGame();h.ledger.story.m1=true;h.affinity.neo=100;h.bondRank.neo=6;run(h,'farm.plant',{cropId:'tea',index:0});const xp=h.yeoniGrowth.xp;
 assert.ok(run(h,'farm.tend',{index:0,helperId:'neo'}).ok);assert.equal(h.yeoniGrowth.xp,xp);
});
test('레벨별 효과·칭호 잠금·선택·행동력은 상한과 저장을 지킨다',()=>{
 let s=createGame();const base=maxActionPoints(s);assert.equal(run(s,'yeoni.title',{id:'master'}).ok,false);
 s.yeoniGrowth={xp:yeoniThreshold(25),counts:{cook:10,farm:20,bond:15},title:'beginner'};
 assert.equal(yeoniTitles(s).length,6);assert.ok(run(s,'yeoni.title',{id:'master'}).ok);assert.equal(maxActionPoints(s),base+2);assert.equal(s.ap.left,3);
 const slow=createGame();cook(slow,'slow');cook(s,'fast');assert.equal(s.foodGifts.job.durationMs,Math.round(slow.foodGifts.job.durationMs*.8),'선물 요리 시간은 레벨마다 줄고 −20%에서 멈춘다');
 s=deserialize(serialize(s)).state;assert.equal(s.yeoniGrowth.title,'master');s.yeoniGrowth.xp=1e9;assert.equal(yeoniProgress(s).level,50);assert.deepEqual(yeoniEffects(s),{revenue:.25,cookSpeed:.2,checkout:.4,patience:.2,review:.4,ap:2});
});
test('성장 매출은 실제 주문 서빙 원장에 한 번만 반영한다',()=>{
 function revenue(level){const s=quietShift(),g=seat(s,{kind:'regular'});s.yeoniGrowth.xp=yeoniThreshold(level);s.customers[g.cid].state='waiting_food';const o=placeOrder(s,s.visits[g.vid],'americano');run(s,'order.quick',{orderId:o.id,timing:50});tick(s,10000);const item=s.tray.find(i=>i?.orderId===o.id);assert.ok(run(s,'serve',{itemId:item.id,tableNo:g.tableNo}).ok);tick(s,14000);const result=s.ledger.sales[o.id];assert.ok(result>0);assert.equal(run(s,'serve',{itemId:item.id,tableNo:g.tableNo}).ok,false);assert.equal(s.ledger.sales[o.id],result);return result;}
 assert.equal(revenue(26),Math.floor(revenue(1)*1.25));
});
test('새 카운터와 이전 저장의 안전한 이전은 가구·지갑을 보존한다',()=>{
 const s=createGame();assert.equal(cafeLayout(s).id,'entrance-left');assert.ok(validateLayout(s.interior.furniture,[],cafeLayout(s)).ok);
 delete s.interior.checkoutLayout;const furniture=structuredClone(s.interior.furniture),gold=s.gold;const restored=deserialize(serialize(s)).state;
 assert.equal(cafeLayout(restored).id,'entrance-left');assert.deepEqual(restored.interior.furniture,furniture);assert.equal(restored.gold,gold);
 s.interior.furniture.find(f=>f.uid==='plant1').x=2;s.interior.furniture.find(f=>f.uid==='plant1').y=14;
 const blocked=deserialize(serialize(s)).state;assert.equal(cafeLayout(blocked).id,'legacy');assert.deepEqual(blocked.interior.furniture,s.interior.furniture);
});
test('연이 레벨은 계산 시간·손님 기다림·좋은 후기 인기도를 늘리고 상한에서 멈춘다',()=>{
 const at=level=>{const s=quietShift();s.yeoniGrowth.xp=yeoniThreshold(level);return s;};
 const pay=level=>{const s=at(level),g=seat(s,{kind:'regular'}),c=s.customers[g.cid],sp=cafeSpots(s).checkout;s.visits[g.vid].bill=100;c.state='checkout';c.x=sp.x+.5;c.y=sp.y+.5;c.path=[];c.checkoutTarget={...sp};assert.equal(checkoutQueue(s)[0].id,c.id);tick(s,16);return c.payAt-s.shift.elapsedMs;};
 assert.ok(Math.abs(pay(21)-pay(1)*.6)<=20,'계산 시간 −40%');
 assert.equal(foodPatienceMs(at(11)),Math.round(TEMP.FOOD_PATIENCE_MS*1.1));assert.equal(foodPatienceMs(at(40)),foodPatienceMs(at(21)));
 const review=(level,food)=>{const s=at(level);s.reputation=50;s.visits.v={orderIds:[],foodScores:[food]};reviewVisit(s,s.visits.v,'식사 완료');return Math.round((s.reputation-50)*10)/10;};
 assert.equal(review(1,95),1);assert.equal(review(21,95),1.4);assert.equal(review(21,30),review(1,30),'나쁜 후기는 그대로');
});
