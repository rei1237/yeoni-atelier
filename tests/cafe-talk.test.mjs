// 카페 대화: 손님 한마디는 그 손님 머리 위에, 이어서 연이·직원이 받아 준다. 말풍선은 최대 두 개.
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift} from './helpers.mjs';
import {withEvents} from '../src/game/state.js';
import {spawnCustomer} from '../src/game/cafe.js';
import {CAFE_REPLIES} from '../src/data/cafe-dialogue.js';
import {newTalk,guestTalk,staffTalk,stepTalk,talkPoint,REPLY_DELAY,STAFF_GAP,TALK_MAX,TALK_MS} from '../src/ui/cafe-talk.js';
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
