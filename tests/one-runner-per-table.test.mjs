// 한 테이블의 주문이 여러 개여도 서빙은 직원 한 명이 맡는다(묶어 들고 가거나, 돌아올 때까지 기다린다).
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {dispatch,tick} from '../src/game/engine.js';
import {placeOrder} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';
function setup(){const s=quietShift(),g=seat(s,{kind:'regular'});s.customers[g.cid].state='waiting_food';const v=s.visits[g.vid];
 const a=placeOrder(s,v,'americano'),b=placeOrder(s,v,'americano');
 for(const o of [a,b])assert.ok(dispatch(s,{type:'order.quick',orderId:o.id,timing:50}).ok);
 tick(s,10000);return {s,g,a,b};}
const runners=(s,no)=>Object.values(s.staff).filter(m=>m.job?.kind==='deliver'&&m.job.tableNo===no).map(m=>m.id);
const serveOf=(s,g,o)=>dispatch(s,{type:'serve',itemId:s.tray.find(x=>x?.orderId===o.id).id,tableNo:g.tableNo});

test('같은 테이블 두 접시는 한 직원이 한 번에 들고 간다',()=>{
 let {s,g,a,b}=setup();
 const mate=s.tray.find(x=>x?.orderId===b.id);assert.ok(serveOf(s,g,a).ok);assert.equal(mate.reservedFor,b.id,'한 번 누르면 같은 테이블 접시를 함께 예약한다');
 const seen=new Set();
 for(let i=0;i<200&&[a,b].some(o=>s.orders[o.id].status!=='served');i++){
  tick(s,100);const r=runners(s,g.tableNo);assert.ok(r.length<=1,`${r} 가 함께 갔다`);r.forEach(id=>seen.add(id));
  if(i===20){s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});} // 들고 가는 도중 저장해도 묶음이 유지된다
 }
 assert.equal(seen.size,1);
 assert.deepEqual([a,b].map(o=>s.orders[o.id].status),['served','served']);
 assert.equal(Object.values(s.staff).some(m=>m.carry||m.carryMore?.length),false);
});

test('이미 출발한 뒤 나온 주문은 다른 직원이 따로 가지 않고 기다린다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'});s.customers[g.cid].state='waiting_food';const v=s.visits[g.vid];
 const a=placeOrder(s,v,'americano');assert.ok(dispatch(s,{type:'order.quick',orderId:a.id,timing:50}).ok);tick(s,10000);
 assert.ok(serveOf(s,g,a).ok);
 for(let i=0;i<100&&!Object.values(s.staff).some(m=>m.job?.stage==='toTable');i++)tick(s,100);
 const b=placeOrder(s,v,'americano');assert.ok(dispatch(s,{type:'order.quick',orderId:b.id,timing:50}).ok);
 for(let i=0;i<100&&!s.tray.some(x=>x?.orderId===b.id);i++)tick(s,100);
 assert.ok(serveOf(s,g,b).ok);
 for(let i=0;i<300&&[a,b].some(o=>s.orders[o.id].status!=='served');i++){tick(s,100);assert.ok(runners(s,g.tableNo).length<=1);}
 assert.deepEqual([a,b].map(o=>s.orders[o.id].status),['served','served']);
});

test('서빙은 가장 가까운 한 사람만 도맡지 않고 홀 직원이 번갈아 맡는다',()=>{
 const s=quietShift(),by={};
 for(let k=0;k<4;k++){
  const g=seat(s,{kind:'regular'});s.customers[g.cid].state='waiting_food';const o=placeOrder(s,s.visits[g.vid],'americano');
  assert.ok(dispatch(s,{type:'order.quick',orderId:o.id,timing:50}).ok);tick(s,10000);assert.ok(serveOf(s,g,o).ok);
  for(let i=0;i<300&&s.orders[o.id].status!=='served';i++){for(const r of runners(s,g.tableNo))by[o.id]=r;tick(s,100);}
 }
 const counts=Object.values(by).reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
 assert.equal(Object.keys(counts).length,2,JSON.stringify(counts));
 assert.ok(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=1,JSON.stringify(counts));
});

test('함께 만든 테이블 주문은 동시에 완성되고, 설비에 남은 접시가 있으면 먼저 나온 접시도 기다렸다 한 번에 간다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'});s.customers[g.cid].state='waiting_food';const v=s.visits[g.vid];
 const a=placeOrder(s,v,'americano'),b=placeOrder(s,v,'fortune_latte');s.learned.fortune_latte=true;s.stock.bean=9;s.stock.milk=9;s.stock.moon_syrup=9;
 const r=dispatch(s,{type:'order.table',no:g.tableNo,timing:50});assert.ok(r.ok,r.reason);
 const jobs=Object.values(s.stations).flatMap(st=>[st.current,st.parallel,st.next,...(st.queue||[])]).filter(j=>j&&r.jobIds.includes(j.id));
 assert.equal(new Set(jobs.map(j=>j.durationMs)).size,1,'같은 조리 시간');
 const quick=quietShift(),qg=seat(quick,{kind:'regular'});quick.customers[qg.cid].state='waiting_food';const qv=quick.visits[qg.vid];
 const x=placeOrder(quick,qv,'americano'),y=placeOrder(quick,qv,'americano');
 assert.ok(dispatch(quick,{type:'order.quick',orderId:x.id,timing:50}).ok);tick(quick,10000);
 assert.ok(dispatch(quick,{type:'order.quick',orderId:y.id,timing:50}).ok);assert.ok(serveOf(quick,qg,x).ok);
 tick(quick,1000);assert.equal(runners(quick,qg.tableNo).length,0,'설비에 같은 테이블 음식이 있으면 출발하지 않는다');
 const seen=new Set();for(let i=0;i<300&&[x,y].some(o=>quick.orders[o.id].status!=='served');i++){tick(quick,100);runners(quick,qg.tableNo).forEach(id=>seen.add(id));}
 assert.deepEqual([x,y].map(o=>quick.orders[o.id].status),['served','served']);assert.equal(seen.size,1);
});
