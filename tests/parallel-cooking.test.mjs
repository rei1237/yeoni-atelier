import {tablePopHtml} from '../src/ui/table-ui.js';
import {computeView} from '../src/render/cafe-view.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {dispatch,tick} from '../src/game/engine.js';
import {placeOrder,stationJobs,findServeTarget} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';

function twoOrders(kitchen=false){
 const s=quietShift({kitchen}),g=seat(s,{kind:'regular'}),v=s.visits[g.vid];
 s.customers[g.cid].state='waiting_food';
 const a=placeOrder(s,v,'fortune_latte'),b=placeOrder(s,v,'fortune_latte');
 return {s,g,a,b};
}
function start(s,o){const r=dispatch(s,{type:'order.quick',orderId:o.id});assert.ok(r.ok,r.reason);}
test('같은 손님·설비의 두 주문은 동시에 진행하고 한 건 취소·재로드는 다른 건을 보존한다',()=>{
 const {s,g,a,b}=twoOrders(),stock=structuredClone(s.stock);start(s,a);start(s,b);
 const st=s.stations.drink;assert.equal(st.current.orderId,a.id);assert.equal(st.parallel.orderId,b.id);
 assert.equal(st.current.startedAt,st.parallel.startedAt);assert.equal(s.stock.bean,stock.bean-2);
 assert.equal(dispatch(s,{type:'order.quick',orderId:b.id}).ok,false);assert.equal(s.stock.bean,stock.bean-2);
 tick(s,100);assert.equal(st.current.progressMs,st.parallel.progressMs);
 const id=st.current.id,progress=st.parallel.progressMs;
 assert.ok(dispatch(s,{type:'cook.cancel',jobId:id}).ok);assert.equal(st.current,null);assert.equal(st.parallel.progressMs,progress);
 assert.equal(s.stock.bean,stock.bean-1);assert.equal(dispatch(s,{type:'cook.cancel',jobId:id}).ok,false);assert.equal(s.stock.bean,stock.bean-1);
 const r=deserialize(serialize(s));assert.ok(r.ok);assert.equal(r.state.paused,true);dispatch(r.state,{type:'resume'});
 tick(r.state,15000);const items=r.state.tray.filter(Boolean);assert.equal(items.length,1);assert.equal(items[0].orderId,b.id);
 assert.ok(dispatch(r.state,{type:'serve',itemId:items[0].id,tableNo:g.tableNo}).ok);
 assert.equal(r.state.orders[b.id].status,'assigned');assert.equal(r.state.orders[a.id].status,'waiting');
});
test('병렬 완성 두 건은 선반이 가득 차도 각각 보관하고 저장 복원 뒤 한 번만 옮긴다',()=>{
 const {s,a,b}=twoOrders();s.tray=s.tray.map((_,i)=>({id:'full'+i,menuId:'flower_cookie',reservedFor:null}));start(s,a);start(s,b);tick(s,15000);
 assert.equal(s.stations.drink.held.orderId,a.id);assert.equal(s.stations.drink.parallelHeld.orderId,b.id);
 const r=deserialize(serialize(s));assert.ok(r.ok);dispatch(r.state,{type:'resume'});r.state.tray=[null,null,null];tick(r.state,100);tick(r.state,100);
 assert.deepEqual(r.state.tray.filter(Boolean).map(i=>i.orderId).sort(),[a.id,b.id].sort());assert.equal(stationJobs(r.state.stations.drink).length,0);
});
test('인연으로 연 자동 조리도 같은 손님 두 주문을 병렬로 시작한다',()=>{
 const {s,a,b}=twoOrders(true);tick(s,Math.max(0,s.shift.autoAt-s.shift.elapsedMs)+100);
 assert.deepEqual([s.stations.drink.current?.orderId,s.stations.drink.parallel?.orderId].sort(),[a.id,b.id].sort());
});

test('같은 메뉴 한 건만 완성되면 팝오버도 그 주문만 전달하고 다른 건 만들기를 유지한다',()=>{
 const {s,g,a,b}=twoOrders();s.tray[0]={id:'ready-b',jobId:'job-b',orderId:b.id,menuId:b.menuId,reservedFor:null};
 const html=tablePopHtml(s,computeView(390,500),{tablePop:{no:g.tableNo}});
 assert.equal((html.match(/data-action="serve"/g)||[]).length,1);assert.match(html,new RegExp('data-id="'+a.id+'"'));assert.match(html,/data-item="ready-b"/);
});

test('다른 손님보다 나중 주문한 음식도 정확한 주문의 테이블로 안내한다',()=>{
 const {s,g,a,b}=twoOrders();const other=seat(s,{kind:'regular'}),later=placeOrder(s,s.visits[other.vid],'fortune_latte');
 const food={id:'later-food',menuId:later.menuId,orderId:later.id,reservedFor:null};s.tray[0]=food;assert.equal(findServeTarget(s,food),other.tableNo);assert.ok(dispatch(s,{type:'serve',itemId:food.id,tableNo:findServeTarget(s,food)}).ok);assert.equal(a.status,'waiting');assert.equal(b.status,'waiting');assert.equal(later.status,'assigned');
});
test('자동 조리는 B 작업을 유지한 채 취소한 A만 다시 만들고 B를 중복 요청하지 않는다',()=>{
 const {s,a,b}=twoOrders(true);start(s,a);start(s,b);const bId=s.stations.drink.parallel.id;dispatch(s,{type:'cook.cancel',jobId:s.stations.drink.current.id});tick(s,Math.max(0,s.shift.autoAt-s.shift.elapsedMs)+100);assert.equal(s.stations.drink.current.orderId,a.id);assert.equal(s.stations.drink.parallel.id,bId);assert.equal(s.stations.drink.next,null);
});
