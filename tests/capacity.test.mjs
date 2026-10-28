import {placePurchasedSeat} from './seat-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,usableHosts} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {cafeCapacity,assignedHosts} from '../src/game/capacity.js';
import {AREAS} from '../src/data/layout.js';
import {MONTHLY_CAST} from '../src/data/monthly-cast.js';
import {DEST1NOVA_CAST} from '../src/data/dest1nova-cast.js';
import {spawnCustomer,placeOrder} from '../src/game/cafe.js';
import {stationJobs,runningJobs,queuedJobs} from '../src/game/station-slots.js';
import {serialize,deserialize} from '../src/core/save.js';
import {validateLayout} from '../src/game/space.js';
function large(){const s=createGame({dev:true});s.gold=1e10;s.hostbar.open=true;s.huntUnlocked=true;s.interior.areas=AREAS.map(a=>a.id);for(const c of [...MONTHLY_CAST,...DEST1NOVA_CAST]){s.roster[c.id]={usableFrom:1};s.people[c.id]={activity:'idle',form:'human'};}return s;}
test('실제 열린 면적에서 지점별 테이블·직원·조리·픽업 한도가 함께 증가한다',()=>{
 const s=createGame(),base=cafeCapacity(s);assert.equal(base.tiles,135);assert.equal(base.hostSlots,1);assert.equal(base.traySlots,3);assert.equal(assignedHosts(s).length,1);
 let prior=base;for(let b=1;b<=5;b++){s.interior.areas=AREAS.filter(a=>!a.branchMin||a.branchMin<=b).map(a=>a.id);const cap=cafeCapacity(s);assert.equal(cap.tiles,20*(20+b*4));for(const k of ['tableLimit','hostSlots','traySlots','stationSlots'])assert.ok(cap[k]>=prior[k]);prior=cap;}
 assert.equal(prior.tableLimit,57);assert.equal(prior.stationSlots,6);assert.equal(prior.traySlots,11);assert.equal(prior.staffSlots,17);assert.deepEqual(Object.keys(s.roster),['neo']);
});
test('영입과 배치는 별개이며 배치 한도·저장·지점 전환을 지킨다',()=>{
 let s=large();s.interior.areas=[];const id=usableHosts(s).find(id=>id!=='neo');assert.equal(dispatch(s,{type:'staffing.select',id,on:true}).ok,false);assert.ok(dispatch(s,{type:'staffing.select',id:'neo',on:false}).ok);assert.ok(dispatch(s,{type:'staffing.select',id,on:true}).ok);assert.equal(dispatch(s,{type:'staffing.select',id:'unknown',on:true}).ok,false);
 s=deserialize(serialize(s)).state;assert.deepEqual(assignedHosts(s),[id]);s.ledger.story['branch:2']=true;s.ledger.sales.fixture=20000;assert.ok(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).ok);assert.ok(dispatch(s,{type:'branch.switch',id:2}).ok);assert.deepEqual(assignedHosts(s),['neo']);assert.ok(dispatch(s,{type:'branch.switch',id:1}).ok);assert.deepEqual(assignedHosts(s),[id]);assert.ok(dispatch(s,{type:'shift.start'}).ok);assert.equal(dispatch(s,{type:'staffing.select',id:'neo',on:true}).ok,false);assert.equal(s.staff.neo,undefined);assert.ok(s.staff[id]);
});
test('최대 공간 57테이블·63손님·영입 직원은 통로를 보존하며 실제로 이동한다',()=>{
 let s=large();s.day=7;while(cafeCapacity(s).seats<57){const r=dispatch(s,{type:'expand.table'});assert.ok(r.ok,r.reason);placePurchasedSeat(s,r.tableNo);}assert.equal(dispatch(s,{type:'expand.table'}).ok,false);assert.ok(validateLayout(s.interior.furniture,s.interior.areas).ok);assert.ok(dispatch(s,{type:'shift.start'}).ok);s.shift.scriptIndex=99;s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;
 assert.equal(s.tables.length,57);assert.equal(s.tray.length,11);assert.equal(Object.keys(s.staff).length,usableHosts(s).length+3);
 for(let n=0;n<57;n++)assert.ok(spawnCustomer(s,{kind:'regular'}));assert.equal(spawnCustomer(s,{kind:'regular'}),null);for(let n=0;n<6;n++)assert.ok(spawnCustomer(s,{kind:'takeaway'}));assert.equal(spawnCustomer(s,{kind:'takeaway'}),null);assert.equal(Object.keys(s.customers).length,63);
 const ids=Object.keys(s.customers);tick(s,2000);assert.ok(ids.some(id=>s.customers[id]?.y!==15.5));s=deserialize(serialize(s)).state;assert.equal(Object.keys(s.customers).length,63);dispatch(s,{type:'resume'});tick(s,30000);assert.ok(Object.values(s.customers).filter(c=>c.state!=='entering').length>45);assert.equal(new Set(s.tables.map(t=>t.customerId)).size,57);assert.ok(s.tables.every(t=>t.service));
});
test('6개 동시 조리와 6개 대기는 개별 취소·재료·품질·저장을 보존한다',()=>{
 let s=large();s.stock.bean=100;dispatch(s,{type:'shift.start'});s.shift.scriptIndex=99;s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;const c=spawnCustomer(s,{kind:'regular'}),v=s.visits[c.visitId];c.state='waiting_food';c.path=[];
 const jobs=[];for(let i=0;i<12;i++){const o=placeOrder(s,v,'americano');const r=dispatch(s,{type:'order.quick',orderId:o.id,timing:i%2?50:0});assert.ok(r.ok);jobs.push(r.jobId);}assert.equal(runningJobs(s.stations.drink).length,6);assert.equal(queuedJobs(s.stations.drink).length,6);assert.equal(s.stock.bean,94);
 const extra=placeOrder(s,v,'americano');assert.equal(dispatch(s,{type:'order.quick',orderId:extra.id}).ok,false);assert.ok(dispatch(s,{type:'cook.cancel',jobId:jobs[10]}).ok);assert.equal(s.stock.bean,94);assert.ok(dispatch(s,{type:'cook.cancel',jobId:jobs[2]}).ok);assert.equal(s.stock.bean,95);assert.equal(dispatch(s,{type:'cook.cancel',jobId:jobs[2]}).ok,false);
 s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});tick(s,21000);assert.equal(s.tray.filter(Boolean).length,10);assert.equal(s.stock.bean,90);assert.equal(new Set(s.tray.filter(Boolean).map(i=>i.orderId)).size,10);assert.ok(s.tray.some(i=>i?.quality==='normal')&&s.tray.some(i=>i?.quality==='perfect'));assert.equal(stationJobs(s.stations.drink).length,0);
});
