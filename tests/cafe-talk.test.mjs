// 카페 대화: 손님 한마디는 그 손님 머리 위에, 이어서 연이·직원이 받아 준다. 말풍선은 최대 두 개.
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift} from './helpers.mjs';
import {withEvents} from '../src/game/state.js';
import {spawnCustomer} from '../src/game/cafe.js';
import {CAFE_REPLIES,STAFF_SITUATIONS} from '../src/data/cafe-dialogue.js';
import {newTalk,guestTalk,staffTalk,stepTalk,talkPoint,sayTalk,placeBubbles,situationTalk,shiftSituation,REPLY_DELAY,STAFF_GAP,SITU_GAP,TALK_MAX,TALK_MS} from '../src/ui/cafe-talk.js';
const NAMES_OK=['yeoni','luna','luna_sis','neo'];
const view={w:2000,h:2000,tile:40,ox:0,oy:0,scale:1};

test('들어온 손님의 한마디에 연이가 이어서 답하고, 말풍선은 말한 사람 위에 뜬다',()=>{
 const s=quietShift(),{result:c,events}=withEvents(()=>spawnCustomer(s,{kind:'regular'}));
 const ev=events.find(e=>e.type==='guestChatter');
 assert.equal(ev?.customerId,c.id);
 const talk=newTalk();
 assert.ok(guestTalk(talk,s,ev,0));
 assert.deepEqual(stepTalk(talk,s,10).map(i=>i.who),['c:'+c.id]);
 assert.ok(talkPoint(s,view,'c:'+c.id).y<c.y*view.tile,'머리 위에 뜬다');
 assert.equal(staffTalk(talk,s,'luna',100),false,'손님 대화 중엔 직원 잡담을 끼우지 않는다');
 const items=stepTalk(talk,s,REPLY_DELAY+10);
 assert.deepEqual(items.map(i=>i.who),['c:'+c.id,'yeoni']);
 assert.ok(items.length<=TALK_MAX);
 assert.equal(stepTalk(talk,s,REPLY_DELAY+TALK_MS+20).length,0);
});

test('직원 한마디는 간격을 두고, 대답 문장은 말할 수 있는 사람만 두 문장 이하로',()=>{
 const s=quietShift(),talk=newTalk();
 assert.ok(staffTalk(talk,s,'luna',0));
 assert.equal(staffTalk(talk,s,'luna_sis',TALK_MS+10),false);
 assert.ok(staffTalk(talk,s,'luna_sis',STAFF_GAP+10));
 for(const [topic,by] of Object.entries(CAFE_REPLIES))for(const [who,lines] of Object.entries(by)){
  assert.ok(['yeoni','luna','luna_sis','neo'].includes(who),`${topic}:${who}`);
  for(const l of lines)assert.ok(l.split(/[.!?…]+\s*/).filter(Boolean).length<=2,l);
 }
});

test('마감 한마디는 잡담 간격과 상관없이 루나 언니 머리 위에 바로 뜬다',()=>{
 const s=quietShift(),talk=newTalk();
 assert.ok(staffTalk(talk,s,'luna',0));
 assert.ok(sayTalk(talk,s,'luna_sis','설거지랑 청소, 시작할게요. 괜찮아요.',10));
 assert.deepEqual(stepTalk(talk,s,20).map(i=>i.who),['luna','luna_sis']);
 assert.equal(sayTalk(talk,s,'nobody','...',30),false);
});

test('겹치는 말풍선은 서로 비켜서고 화면 밖으로 나가지 않는다',()=>{
 const W=844,H=390,list=[{x:420,y:200,w:220,h:58},{x:430,y:210,w:220,h:58},{x:5,y:20,w:220,h:58}];
 const out=placeBubbles(list,{width:W,height:H}),box=(p,b)=>({l:p.x-b.w/2,r:p.x+b.w/2,t:p.y-b.h,b:p.y});
 const bs=out.map((p,i)=>box(p,list[i]));
 for(const b of bs)assert.ok(b.l>=0&&b.r<=W&&b.t>=0&&b.b<=H,JSON.stringify(b));
 for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i],b=bs[j];assert.ok(!(a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b),`${i}-${j} 겹침`);}
 assert.equal(out[0].moved,false);assert.equal(out[1].moved,true);
});

test('오래 기다리는 손님이 있으면 직원이 먼저 짚고, 같은 상황은 간격을 둔다',()=>{
 const s=quietShift(),talk=newTalk();
 assert.equal(shiftSituation(s),null);
 s.tables.slice(0,2).forEach(t=>t.state='dirty');
 assert.equal(shiftSituation(s),'dirty');
 const {result:c}=withEvents(()=>spawnCustomer(s,{kind:'regular'})),v=s.visits[c.visitId];
 c.state='waiting_food';s.orders.qa={id:'qa',status:'waiting',placedAt:0,menuId:'americano'};v.orderIds=['qa'];s.shift.elapsedMs=120000;
 assert.equal(shiftSituation(s),'waitLong','급한 상황이 먼저');
 assert.ok(situationTalk(talk,s,'waitLong',0,0));
 const [said]=stepTalk(talk,s,10);
 assert.ok(STAFF_SITUATIONS.waitLong.some(([w,l])=>w===said.who&&l===said.line));
 assert.equal(situationTalk(talk,s,'waitLong',SITU_GAP-1,0),false,'같은 상황은 간격 안에 반복하지 않는다');
 assert.ok(situationTalk(talk,s,'angryLeave',20,0),'손님이 화나서 떠나면 바로 말한다');
 for(const lines of Object.values(STAFF_SITUATIONS))for(const [w,l] of lines){assert.ok(NAMES_OK.includes(w));assert.ok(l.split(/[.!?…]+\s*/).filter(Boolean).length<=2,l);}
});
