import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {quietShift,seat} from './helpers.mjs';
import {spawnCustomer} from '../src/game/cafe.js';
import {customerLook} from '../src/data/customer-looks.js';
import {worldScreenHtml} from '../src/ui/world-screen.js';
import {tableBadgesHtml,tablePopHtml} from '../src/ui/table-ui.js';
import {panelHtml,automationChips} from '../src/ui/hud.js';
import {computeView} from '../src/render/cafe-view.js';

test('지도·의뢰를 그리는 것만으로 행동력·보상·난수는 바뀌지 않는다',()=>{
 const s=createGame(),before=serialize(s);
 for(const screen of ['world','quests'])assert.ok(worldScreenHtml(s,{screen}).length>100);
 assert.equal(serialize(s),before);
 assert.match(worldScreenHtml(s,{screen:'world',worldPlace:'hunt',worldCardOpen:true}),/첫 영업을 마치면/);
 assert.match(worldScreenHtml(s,{screen:'quests'}),/data-static-portrait="luna"/);
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
test('주방 설비는 한 번만 나오고 잠긴 자동화에는 인연 조건이 있다',()=>{
 const s=quietShift();assert.equal((panelHtml(s,{selectedSlot:null}).match(/class="station-dock"/g)||[]).length,1);
 const html=automationChips(s);assert.match(html,/aria-describedby="auto-tip-kitchen"/);assert.match(html,/루나 언니/);assert.match(html,/♥2/);
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
