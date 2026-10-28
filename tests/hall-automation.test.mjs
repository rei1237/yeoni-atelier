import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {abilityCheck,automationOn} from '../src/game/permissions.js';
import {automationStatus} from '../src/game/auto.js';
import {serialize,deserialize} from '../src/core/save.js';
import {quietShift,seat,enableAutomation} from './helpers.mjs';
import {placeOrder} from '../src/game/cafe.js';
import {automationChips} from '../src/ui/hud.js';
const toggle=(s,key,on)=>dispatch(s,{type:'automation.toggle',ability:key,on});
test('루나와 네오 Rank 6 문턱·각자 이야기·독립 토글은 서로의 권한을 열지 않는다',()=>{
 for(const [key,id,other] of [['hall','luna','hall_neo'],['hall_neo','neo','hall']]){
  const s=createGame();s.bondRank[id]=5;s.ledger.story[`bond:${id}:2`]=true;assert.equal(abilityCheck(s,key).ok,false);
  s.bondRank[id]=6;delete s.ledger.story[`bond:${id}:2`];assert.match(abilityCheck(s,key).reason,/이야기/);
  s.ledger.story[`bond:${id}:2`]=true;assert.ok(toggle(s,key,true).ok);assert.equal(automationOn(s,key),true);assert.equal(automationOn(s,other),false);assert.equal(toggle(s,other,true).ok,false);
  const back=deserialize(serialize(s)).state;assert.equal(automationOn(back,key),true);assert.equal(automationOn(back,other),false);assert.ok(toggle(back,key,false).ok);assert.equal(automationOn(back,key),false);
 }
 const s=createGame();s.affinity.luna_sis=280;s.bondRank.luna_sis=10;s.ledger.story['bond:luna_sis:2']=true;assert.equal(abilityCheck(s,'hall').ok,false);assert.equal(abilityCheck(s,'hall_neo').ok,false);
});
test('옛 홀 자동 저장은 루나만 계승하고 무권한 저장은 실행되지 않는다',()=>{
 const s=createGame();enableAutomation(s,['hall']);delete s.automation.hall_neo;
 let back=deserialize(serialize(s)).state;assert.equal(back.automation.hall,true);assert.equal(back.automation.hall_neo,false);assert.equal(automationOn(back,'hall'),true);
 back.bondRank.luna=0;back=deserialize(serialize(back)).state;assert.equal(automationOn(back,'hall'),false);assert.equal(automationOn(back,'hall_neo'),false);
});
test('한쪽만 켜면 그 직원만 자동 청소하고 둘 다 켜면 서로 다른 작업을 맡는다',()=>{
 for(const keys of [[],['hall'],['hall_neo'],['hall','hall_neo']]){
  const s=quietShift();enableAutomation(s,keys);s.tables.slice(0,3).forEach(t=>t.state='dirty');tick(s,200);
  const ids=s.tasks.filter(t=>t.assignedTo).map(t=>t.assignedTo);assert.equal(ids.length,keys.length);assert.deepEqual(new Set(ids),new Set(keys.map(k=>k==='hall'?'luna':'neo')));
  assert.equal(new Set(s.tasks.map(t=>t.tableNo)).size,s.tasks.length);
  if(keys.length){tick(s,20000);assert.equal(s.tables.filter(t=>t.state==='dirty'||t.state==='cleaning').length,0);}
 }
});
test('자동 서빙은 허용된 직원만 배정하고 주문·음식 예약을 중복하지 않는다',()=>{
 for(const key of ['hall','hall_neo']){
  const s=quietShift();enableAutomation(s,[key]);const g=seat(s,{kind:'regular'}),v=s.visits[g.vid];s.customers[g.cid].state='waiting_food';const o=placeOrder(s,v,'fortune_latte');s.tray[0]={id:'served-one',menuId:o.menuId,orderId:o.id};s.shift.autoAt=0;tick(s,200);
  const task=s.tasks.find(t=>t.orderId===o.id);assert.equal(task.assignedTo,key==='hall'?'luna':'neo');assert.equal(dispatch(s,{type:'serve',itemId:'served-one',tableNo:g.tableNo}).ok,false);
  const back=deserialize(serialize(s)).state;dispatch(back,{type:'resume'});tick(back,20000);assert.equal(back.orders[o.id].status,'served');assert.equal(Object.keys(back.ledger.sales).filter(id=>id===o.id).length,1);
 }
});
test('접대 중 네오는 자동 홀 일을 맡지 않고 모두 끄면 미배정 자동 예약만 푼다',()=>{
 const s=quietShift();enableAutomation(s,['hall_neo']);s.people.neo.activity='hosting';s.tables[0].state='dirty';tick(s,200);assert.equal(s.tasks.length,0);assert.match(automationStatus(s,'hall_neo').reason,/접대/);
 s.people.neo.activity='idle';s.tables.slice(0,3).forEach(t=>t.state='dirty');s.shift.autoAt=0;tick(s,200);const active=s.tasks.find(t=>t.assignedTo);assert.ok(active);toggle(s,'hall_neo',false);assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].id,active.id);assert.equal(s.tables.filter(t=>t.cleanQueued).length,1);
 const html=automationChips(s);for(const id of ['hall','hall_neo','kitchen'])assert.match(html,new RegExp('data-ability="'+id+'"'));assert.match(html,/네오/);assert.match(html,/루나 언니/);assert.match(html,/지금 Rank 6 \/ 필요 Rank 6/);
});
