import test from 'node:test';
import assert from 'node:assert/strict';
import {trafficStep,ACTOR_GAP,cafeActors} from '../src/game/cafe-traffic.js';
import {createHostDemo} from '../src/game/host-demo.js';
import {dispatch,tick} from '../src/game/engine.js';
import {RECRUITABLE} from '../src/data/companions.js';
import {seat} from './helpers.mjs';
import {spawnCustomer} from '../src/game/cafe.js';
test('좁은 통로에서 마주 오는 두 캐릭터는 간격을 지키고 서로 지나간다',()=>{
 const a={x:.5,y:1.5},b={x:.5,y:4.5},actors=[a,b],walk=(x,y)=>x>=0&&x<1&&y>=0&&y<6;let min=99;
 for(let i=0;i<500;i++){for(const [e,target] of [[a,{x:.5,y:4.5}],[b,{x:.5,y:1.5}]]){const p=trafficStep(e,target,.04,actors,walk);if(p)Object.assign(e,p);}min=Math.min(min,Math.hypot(a.x-b.x,a.y-b.y));}
 assert.ok(min>=ACTOR_GAP-.002,min);assert.ok(a.y>4&&b.y<2,JSON.stringify(actors));
});
test('동시에 입장한 손님은 입구에서 겹쳐 생성되지 않고 순서대로 들어온다',()=>{
 const s=createHostDemo();dispatch(s,{type:'shift.start'});s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;
 const a=spawnCustomer(s,{kind:'regular'}),b=spawnCustomer(s,{kind:'regular'});assert.equal(a.enterWaiting,false);assert.equal(b.enterWaiting,true);assert.ok(!cafeActors(s).includes(b));tick(s,10000);assert.equal(b.enterWaiting,false);
});
for(const id of ['neo',...RECRUITABLE.map(x=>x.id)])test(id+' 출근·서빙·정리·지명·복귀가 같은 직원 한 명으로 이어진다',()=>{
 const s=createHostDemo();s.roster[id]={id,usableFrom:1};s.people[id]={activity:'idle',form:'human',visitId:null,tableNo:null,endAt:null};s.staffing={selected:[id]};s.automation.hall=false;s.dayOff.luna=true;dispatch(s,{type:'shift.start'});s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;s.shift.scriptIndex=99;
 assert.ok(s.staff[id]);const guest=seat(s,{kind:'regular'});tick(s,5000);const o=Object.values(s.orders).find(x=>x.visitId===guest.vid);assert.ok(o);if(!s.tray.some(x=>x?.menuId===o.menuId))dispatch(s,{type:'cook',menuId:o.menuId});
 for(let i=0;i<400&&!s.tray.some(x=>x?.menuId===o.menuId);i++)tick(s,100);
 const item=s.tray.find(x=>x?.menuId===o.menuId);assert.ok(item);assert.ok(dispatch(s,{type:'serve',itemId:item.id,tableNo:guest.tableNo}).ok);
 let worked=false;for(let i=0;i<600&&s.orders[o.id].status!=='served';i++){tick(s,100);worked ||= s.staff[id].job?.kind==='deliver';}assert.ok(worked);assert.equal(s.orders[o.id].status,'served');
 for(let i=0;i<700&&s.tables.find(t=>t.no===guest.tableNo).state!=='dirty';i++)tick(s,100);
 assert.ok(dispatch(s,{type:'clean',tableNo:guest.tableNo}).ok);for(let i=0;i<500&&s.tables.find(t=>t.no===guest.tableNo).state!=='empty';i++)tick(s,100);assert.equal(s.tables.find(t=>t.no===guest.tableNo).state,'empty');
 const host=seat(s,{nominee:id});assert.ok(dispatch(s,{type:'nomination.accept',tableNo:host.tableNo}).ok);tick(s,60000);assert.equal(s.people[id].activity,'idle');for(let i=0;i<300&&s.staff[id].path.length;i++)tick(s,100);assert.equal(s.staff[id].path.length,0);assert.equal(s.shift.hostings.at(-1).nominee,id);
});
