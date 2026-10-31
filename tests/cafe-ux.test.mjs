import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {quietShift,seat} from './helpers.mjs';
import {spawnCustomer,placeOrder} from '../src/game/cafe.js';
import {customerLook} from '../src/data/customer-looks.js';
import {worldScreenHtml} from '../src/ui/world-screen.js';
import {tableBadgesHtml,tablePopHtml,orderChipsHtml,cafeTasks} from '../src/ui/table-ui.js';
import {panelHtml,automationChips} from '../src/ui/hud.js';
import {computeView,canvasDpr} from '../src/render/cafe-view.js';

test('지도·의뢰를 그리는 것만으로 행동력·보상·난수는 바뀌지 않는다',()=>{
 const s=createGame(),before=serialize(s);
 for(const screen of ['world','quests'])assert.ok(worldScreenHtml(s,{screen}).length>100);
 assert.equal(serialize(s),before);
 assert.match(worldScreenHtml(s,{screen:'world',worldPlace:'hunt',worldCardOpen:true}),/첫 영업을 마치면/);
 assert.match(worldScreenHtml(s,{screen:'quests'}),/data-key="quest-portrait-luna"/);
});
test('의뢰 보상 버튼은 엔진의 1회 수령과 저장 복원을 따른다',()=>{
 const s=createGame();s.stats.served=1;const gold=s.gold;
 assert.match(worldScreenHtml(s,{screen:'quests',questId:'q_first_serve'}),/보상 받기/);
 assert.ok(dispatch(s,{type:'quest.claim',questId:'q_first_serve'}).ok);
 assert.equal(s.gold,gold+200);const saved=deserialize(serialize(s));assert.ok(saved.ok);
 assert.equal(dispatch(saved.state,{type:'quest.claim',questId:'q_first_serve'}).ok,false);
 assert.equal(saved.state.gold,s.gold);assert.match(worldScreenHtml(saved.state,{screen:'quests',questId:'q_first_serve'}),/보상 수령 완료/);
});
test('테이블 정리·주문·서빙 행동이 실제 상태에 맞게 노출된다',()=>{
 const s=quietShift(),v=computeView(390,500),t=s.tables[0];t.state='dirty';
 assert.match(tableBadgesHtml(s,v),/data-action="clean"/);assert.match(tablePopHtml(s,v,{tablePop:{no:t.no}}),/정리하기/);t.state='empty';
 assert.doesNotMatch(tablePopHtml(s,v,{tablePop:{no:t.no}}),/data-action="sheet.open"/);
 const guest=seat(s,{kind:'regular'});for(let i=0;i<100&&!s.visits[guest.vid].orderIds.length;i++)tick(s,100);
 const o=s.orders[s.visits[guest.vid].orderIds[0]];assert.ok(o);
 assert.match(tablePopHtml(s,v,{tablePop:{no:guest.tableNo}}),/data-action="order.quick"/);
 s.tray[0]={id:'qa-dish',menuId:o.menuId};assert.match(tablePopHtml(s,v,{tablePop:{no:guest.tableNo}}),/data-action="serve"/);
});
test('한 손님이 여러 개 주문해도 팝오버·말풍선·주문 칩에 전부 상태별로 보인다',()=>{
 const s=quietShift(),guest=seat(s,{kind:'regular'}),visit=s.visits[guest.vid];
 const os=['fortune_latte','yeoni_rose_mille','yeoni_garden_quiche','yeoni_garden_quiche','americano'].map(id=>placeOrder(s,visit,id));
 os[0].status='served';os[1].status='assigned';
 for(const [w,h] of [[390,500],[1280,640]]){
  const v=computeView(w,h),pop=tablePopHtml(s,v,{tablePop:{no:guest.tableNo}});
  assert.equal((pop.match(/<li class="table-order/g)||[]).length,5);assert.match(pop,/남은 주문 4 \/ 5/);
  assert.match(pop,/st-done/);assert.match(pop,/st-carry/);assert.equal((pop.match(/data-action="order.quick"/g)||[]).length,3);
  assert.ok(Number(pop.match(/max-height:(\d+)px/)[1])<=v.h,'팝오버는 무대 높이를 넘지 않는다');
  assert.match(tableBadgesHtml(s,v),new RegExp(`data-no="${guest.tableNo}"[^>]*aria-label="[^"]*남은 주문 4개"`));
 }
 const chips=orderChipsHtml(s,visit);assert.equal((chips.match(/class="order-chip/g)||[]).length,4);assert.match(chips,/×2/);assert.match(chips,/st-done/);
});
test('주방 설비는 한 번만 나오고 잠긴 자동화에는 인연 조건이 있다',()=>{
 const s=quietShift();assert.equal((panelHtml(s,{selectedSlot:null}).match(/class="station-dock"/g)||[]).length,1);
 const html=automationChips(s);assert.match(html,/aria-describedby="auto-tip-kitchen"/);assert.match(html,/루나 언니/);assert.match(html,/Rank 6/);
 assert.equal(dispatch(s,{type:'automation.toggle',ability:'kitchen'}).ok,false);assert.equal(s.automation.kitchen,false);
});
test('같은 시드의 손님 옷색은 같고 저장 왕복과 옛 hue를 보존한다',()=>{
 const a=quietShift(),b=quietShift();const ca=spawnCustomer(a,{kind:'regular'}),cb=spawnCustomer(b,{kind:'regular'});
 assert.equal(ca.look,cb.look);assert.equal(a.rng.seed,b.rng.seed);
 assert.equal(deserialize(serialize(a)).state.customers[ca.id].look,ca.look);
 delete ca.look;ca.hue=270;const rng=a.rng.seed,restored=deserialize(serialize(a)).state;
 assert.equal(restored.customers[ca.id].look,6);assert.equal(restored.rng.seed,rng);
 assert.deepEqual(Array.from({length:8},(_,i)=>customerLook({hue:i*45})),[0,1,2,3,4,5,6,7]);
});

test('부탁 노트 사연은 기존 완료 원장을 따르고 전용 정지 초상을 쓴다',()=>{
 const s=createGame();s.stats.served=1;
 const before=worldScreenHtml(s,{screen:'quests',questId:'q_first_serve'});
 assert.match(before,/부탁을 남긴 이유/);assert.match(before,/첫 접시/);assert.doesNotMatch(before,/data-talking-portrait/);
 assert.ok(dispatch(s,{type:'quest.claim',questId:'q_first_serve'}).ok);const gold=s.gold;
 const after=worldScreenHtml(s,{screen:'quests',questId:'q_first_serve'});
 assert.match(after,/함께 남긴 이야기/);assert.match(after,/빈 접시/);
 assert.equal(s.ledger.rewards['quest:q_first_serve'],true);
 assert.equal(dispatch(s,{type:'quest.claim',questId:'q_first_serve'}).ok,false);assert.equal(s.gold,gold);
 assert.match(worldScreenHtml(deserialize(serialize(s)).state,{screen:'quests',questId:'q_first_serve'}),/빈 접시/);
});

test('지금 머무는 장소를 다시 눌러도 그 장소 창으로 들어갈 수 있다',()=>{
 const s=createGame();s.worldLocation='moka';
 const html=worldScreenHtml(s,{screen:'world',worldPlace:'moka',worldAt:'moka',worldCardOpen:true});
 const enter=html.match(/<button[^>]*data-action="world\.enter"[^>]*data-id="moka"[^>]*>/)?.[0]||html.match(/<button[^>]*data-id="moka"[^>]*data-action="world\.enter"[^>]*>/)?.[0];
 assert.ok(enter,'입장 버튼이 있다');
 assert.doesNotMatch(enter,/disabled/);
 assert.match(html,/다시 들어가기/);
});
test('지금 할 일은 전달→정리→만들기 순이고 완성 접시는 말풍선 한 번으로 전달한다',()=>{
 const s=quietShift(),v=computeView(1180,860),guest=seat(s,{kind:'regular'});for(let i=0;i<100&&!s.visits[guest.vid].orderIds.length;i++)tick(s,100);
 const o=s.orders[s.visits[guest.vid].orderIds[0]];s.tables.find(t=>!t.customerId).state='dirty';
 let kinds=cafeTasks(s).map(k=>k.kind);assert.equal(kinds[0],'clean');assert.ok(kinds.includes('make'));assert.match(panelHtml(s,{}),/지금 할 일/);
 s.tray[0]={id:'qa-dish',menuId:o.menuId,quality:'good'};kinds=cafeTasks(s).map(k=>k.kind);assert.deepEqual(kinds.slice(0,2),['serve','clean']);
 assert.match(tableBadgesHtml(s,v),new RegExp(`data-action="serve" data-no="${guest.tableNo}" data-item="qa-dish"`));
 assert.ok(dispatch(s,{type:'serve',itemId:'qa-dish',tableNo:guest.tableNo}).ok);assert.ok(!cafeTasks(s).some(k=>k.kind==='serve'));
});

test('영업 중에는 재성의 섬 버튼이 잠기고, 영업 준비 때는 열린다', () => {
 const island=html=>html.match(/<button[^>]*data-sheet="town"[^>]*>/)?.[0]||'';
 const shift=island(panelHtml(quietShift(),{}));
 assert.match(shift,/aria-disabled="true"/);assert.match(shift,/영업 중에는 재성의 섬에 갈 수 없어요/);
 assert.doesNotMatch(island(panelHtml(createGame(7),{})),/aria-disabled/);
 const s=quietShift();assert.equal(dispatch(s,{type:'world.arrive',place:'moka'}).ok,false,'영업 중 도착 명령도 거절');
});

test('캔버스 배율은 3배 화면 휴대폰에서 3, 큰 화면에서는 예전처럼 2까지만 쓴다',()=>{
 assert.equal(canvasDpr(390,844,3),3);assert.equal(canvasDpr(360,640,2),2);assert.equal(canvasDpr(1920,1080,1),1);
 assert.equal(canvasDpr(1920,1080,2),2);assert.equal(canvasDpr(1440,900,3),2);assert.equal(canvasDpr(390,844,undefined),1);
 const d=canvasDpr(800,900,3);assert.ok(d>2&&d<3&&800*900*d*d<=4e6+1);assert.equal(canvasDpr(1000,1300,3),2);
 assert.equal(canvasDpr(390,844,3,true),2);assert.equal(canvasDpr(390,844,1,true),1);
});
