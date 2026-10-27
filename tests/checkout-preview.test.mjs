import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {preview} from '../src/game/interior.js';
import {serialize,deserialize} from '../src/core/save.js';
import {cafeLayout} from '../src/data/layout.js';
import {cafeCapacity} from '../src/game/capacity.js';
import {customerLeave,checkout,checkoutQueue} from '../src/game/cafe.js';
import {seat,enableAutomation} from './helpers.mjs';
import {switchBranch,ensureBranches} from '../src/game/branches.js';
const fresh=()=>createGame({dev:true});
const run=(s,type,args={})=>dispatch(s,{type,...args});
test('계산대 미리보기·반복 진입·취소·재로드는 원본 저장과 경제를 바꾸지 않는다',()=>{
 const s=fresh(),before=serialize(s),ids=s.interior.furniture.map(f=>f.uid);
 assert.ok(run(s,'interior.checkoutPreview').ok);assert.equal(cafeLayout(s).id,'legacy');assert.equal(cafeLayout(s,true).id,'entrance');
 assert.equal(serialize(s),before);assert.ok(run(s,'interior.checkoutPreview').duplicate);
 assert.equal(run(s,'shift.start').ok,false);assert.equal(run(s,'decor.buy',{id:'plant'}).ok,false);tick(s,10000);assert.equal(serialize(s),before);
 const loaded=deserialize(serialize(s)).state;assert.equal(loaded.interior.draft,null);assert.equal(cafeLayout(loaded).id,'legacy');assert.deepEqual(loaded.interior.furniture.map(f=>f.uid),ids);
 assert.ok(run(s,'interior.cancel').ok);assert.equal(serialize(s),before);assert.ok(run(s,'interior.checkoutPreview').ok);assert.equal(serialize(s),before);
});
test('충돌2가구는 자동 이동하지 않고 사용자가 각각 조정한 뒤만 원자적으로 적용한다',()=>{
 const s=fresh(),t=s.interior.furniture.find(f=>f.uid==='table1'),c=s.interior.furniture.find(f=>f.uid==='table1-chair');t.x=7;t.y=13;c.x=7;c.y=14;
 const before=serialize(s),count=s.interior.furniture.length,goods=s.gold;
 run(s,'interior.checkoutPreview');const issues=preview(s);assert.equal(issues.ok,false);assert.deepEqual([...new Set(issues.problems.map(p=>p.uid).filter(Boolean))].sort(),['table1','table1-chair']);
 assert.equal(run(s,'interior.apply').ok,false);assert.equal(serialize(s),before);
 run(s,'interior.pick',{uid:t.uid});run(s,'interior.move',{uid:t.uid,x:2,y:4});assert.ok(run(s,'interior.confirmItem').ok);assert.equal(preview(s).ok,false);
 run(s,'interior.pick',{uid:c.uid});run(s,'interior.move',{uid:c.uid,x:2,y:5});assert.ok(run(s,'interior.confirmItem').ok);assert.ok(preview(s).ok);assert.equal(serialize(s),before);
 assert.ok(run(s,'interior.apply').ok);assert.equal(cafeLayout(s).id,'entrance');assert.equal(s.gold,goods);assert.equal(s.interior.furniture.length,count);assert.equal(cafeCapacity(s).seats,5);
 const applied=serialize(s);assert.equal(run(s,'interior.apply').ok,false);assert.equal(serialize(s),applied);
 const restored=deserialize(applied).state;assert.equal(cafeLayout(restored).id,'entrance');assert.deepEqual(restored.interior.furniture,s.interior.furniture);
});
test('입구·다중셀·변경된 원본·영업중 미리보기를 거절하고 실패 때 원본을 보존한다',()=>{
 const s=fresh();s.interior.furniture.push({uid:'large-test',defId:'grand_table',x:7,y:13,rot:0,tableNo:6});
 const before=serialize(s);run(s,'interior.checkoutPreview');assert.ok(preview(s).problems.some(p=>p.uid==='large-test'));assert.equal(run(s,'interior.apply').ok,false);assert.equal(serialize(s),before);run(s,'interior.cancel');
 s.interior.furniture.pop();s.interior.furniture.find(f=>f.uid==='shelf1').x=4;s.interior.furniture.find(f=>f.uid==='shelf1').y=14;
 run(s,'interior.checkoutPreview');assert.ok(preview(s).problems.some(p=>p.code==='reserved'));run(s,'interior.cancel');
 s.interior.furniture.find(f=>f.uid==='shelf1').x=null;s.interior.furniture.find(f=>f.uid==='shelf1').y=null;
 run(s,'interior.checkoutPreview');s.interior.furniture.find(f=>f.uid==='plant1').y=9;const concurrent=serialize(s);assert.equal(run(s,'interior.apply').ok,false);assert.equal(serialize(s),concurrent);run(s,'interior.cancel');
 assert.ok(run(s,'shift.start').ok);const shift=serialize(s);assert.equal(run(s,'interior.checkoutPreview').ok,false);assert.equal(serialize(s),shift);
});
test('기존 편집 초안은 덮지 않고 이전 위치와 확장 지점의 배치를 각각 보존한다',()=>{
 const s=fresh();run(s,'interior.begin');run(s,'interior.move',{uid:'plant1',x:0,y:9});const d=JSON.stringify(s.interior.draft);assert.equal(run(s,'interior.checkoutPreview').ok,false);assert.equal(JSON.stringify(s.interior.draft),d);run(s,'interior.cancel');
 s.interior.areas=['window','salon','terrace','east_wing','garden_wing'];const furniture=JSON.stringify(s.interior.furniture),seats=cafeCapacity(s).seats;
 run(s,'interior.checkoutPreview');assert.ok(preview(s).ok);run(s,'interior.apply');assert.equal(JSON.stringify(s.interior.furniture),furniture);assert.equal(cafeCapacity(s).seats,seats);
 ensureBranches(s);s.branches.owned[2]={id:2,snapshot:null};assert.ok(switchBranch(s,2).ok);assert.equal(cafeLayout(s).id,'legacy');assert.ok(switchBranch(s,1).ok);assert.equal(cafeLayout(s).id,'entrance');assert.equal(JSON.stringify(s.interior.furniture),furniture);
});
test('적용한 입구 계산대는 고객 오른쪽·연이 왼쪽, 독립 대기칸과 결제1회를 유지한다',()=>{
 let s=fresh();enableAutomation(s,['hall','kitchen']);run(s,'interior.checkoutPreview');run(s,'interior.apply');run(s,'shift.start');s.shift.scriptIndex=99;s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;
 assert.equal(s.staff.yeoni.facing,'left');assert.deepEqual(s.staff.yeoni.home,{x:8,y:14});
 const guests=[seat(s,{kind:'regular'}),seat(s,{kind:'regular'}),seat(s,{kind:'regular'})];
 for(const g of guests){s.visits[g.vid].bill=100;customerLeave(s,s.customers[g.cid],'식사 완료');}
 const before=s.gold;let seen=false,saved=false;
 for(let i=0;i<2000&&Object.keys(s.customers).length;i++){
  tick(s,50);const q=checkoutQueue(s),pay=q.filter(c=>c.payAt!=null);assert.ok(pay.length<=1);
  const resting=q.filter(c=>!c.path.length&&!c.standing);assert.equal(new Set(resting.map(c=>c.x+','+c.y)).size,resting.length);
  if(pay.length){seen=true;assert.equal(pay[0].facing,'right');assert.equal(s.staff.yeoni.facing,'left');if(!saved){s=deserialize(serialize(s)).state;run(s,'resume');saved=true;}}
 }
 assert.ok(seen&&saved);assert.equal(Object.keys(s.customers).length,0);assert.equal(s.gold,before+300);for(const g of guests)assert.equal(checkout(s,s.visits[g.vid]),false);
});

test('결제 대기열이 가득 찬 손님은 의자 예약과 앉은 자세를 유지한다',async()=>{
 const {customerPose}=await import('../src/render/customer-pose.js');
 const s=fresh();run(s,'interior.checkoutPreview');run(s,'interior.apply');run(s,'shift.start');s.shift.scriptIndex=99;s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;
 const g=seat(s,{kind:'regular'}),c=s.customers[g.cid],table=s.tables.find(t=>t.customerId===c.id);
 s.visits[g.vid].bill=100;customerLeave(s,c,'식사 완료');c.checkoutJoinedAt=100;
 for(let i=0;i<8;i++){s.visits['queue-visit-'+i]={...s.visits[g.vid],id:'queue-visit-'+i};s.customers['queue-test-'+i]={...c,id:'queue-test-'+i,visitId:'queue-visit-'+i,tableNo:null,checkoutJoinedAt:i,standing:null,path:[],x:6.5,y:14.5};}
 tick(s,50);assert.ok(c.checkoutWaiting);assert.equal(table.customerId,c.id);assert.equal(customerPose(s,c).seated,true);assert.equal(customerPose(s,c).state,'idle');
 for(let i=0;i<8;i++)delete s.customers['queue-test-'+i];
 tick(s,50);assert.equal(c.checkoutWaiting,false);assert.ok(c.standing.until>s.shift.elapsedMs);assert.equal(table.customerId,c.id);
});
