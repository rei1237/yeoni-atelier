import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {completeStory} from '../src/ui/story-completion.js';
import {huntVisitReason} from '../src/game/hunt-visits.js';
import {TEMP} from '../src/config/balance.temp.js';
import {SUPPLIES} from '../src/game/moka-armory.js';
import {EVENT_STORIES} from '../src/story/events.js';
import {getHuntWorld} from '../src/game/hunt.js';
function ready(){const s=createGame();s.huntUnlocked=true;s.ledger.story.m0=true;s.stats.huntsCompleted=1;s.moonstone=1000;return s;}
test('첫 사냥 이야기만 준비 화면으로 안내하고 재완료·저장·재생은 재이동하지 않는다',()=>{
 let s=createGame();s.ledger.story.m0=true;s.stats.shiftsCompleted=1;assert.equal(dispatch(s,{type:'story.seen',id:'ev:hunt'}).destination,'hunt');assert.equal(s.mode,'prep');assert.equal(s.hunt,null);assert.equal(s.huntUnlocked,true);assert.equal(dispatch(s,{type:'story.seen',id:'ev:hunt'}).destination,undefined);s=deserialize(serialize(s)).state;assert.equal(dispatch(s,{type:'story.seen',id:'ev:hunt'}).destination,undefined);assert.ok(EVENT_STORIES['ev:hunt'].some(b=>b.t?.includes('월드맵의 영냥이의 사냥터에서 다음 날 다시 도전')));
 const locked=createGame();assert.equal(dispatch(locked,{type:'story.seen',id:'ev:hunt'}).ok,false);
});
test('폭탄은 공방에서 1개만 구매하고 소비 뒤 재구매하며 옛 초과 보유는 보존한다',()=>{
 let s=ready();const price=SUPPLIES.bomb.cost;s.moonstone=price-1;assert.equal(dispatch(s,{type:'armory.buy',id:'bomb'}).ok,false);s.moonstone=price*3;assert.ok(dispatch(s,{type:'armory.buy',id:'bomb'}).ok);assert.equal(dispatch(s,{type:'armory.buy',id:'bomb'}).ok,false);assert.equal(s.moonstone,price*2);s=deserialize(serialize(s)).state;assert.equal(s.armory.supplies.bomb,1);
 assert.ok(dispatch(s,{type:'hunt.start'}).ok);assert.ok(dispatch(s,{type:'hunt.supply',id:'bomb'}).ok);assert.equal(dispatch(s,{type:'hunt.supply',id:'bomb'}).ok,false);assert.equal(s.armory.supplies.bomb,0);dispatch(s,{type:'hunt.retreat'});dispatch(s,{type:'hunt.finish'});assert.ok(dispatch(s,{type:'armory.buy',id:'bomb'}).ok);
 s.armory.supplies.bomb=4;s=deserialize(serialize(s)).state;assert.equal(s.armory.supplies.bomb,4);assert.equal(dispatch(s,{type:'armory.buy',id:'bomb'}).ok,false);assert.equal(s.armory.supplies.bomb,4);assert.ok(!JSON.stringify(TEMP.HUNT).includes('"id":"bomb"'));
});
test('체력 소진은 보상 1회 귀환이며 저장 후 가게 조작과 회복 재도전이 가능하다',()=>{
 let s=ready();dispatch(s,{type:'hunt.start'});s.hunt.hp=0;s.hunt.bag.moonstone=17;tick(s,50);assert.equal(s.hunt.status,'down');s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});const before=s.moonstone;assert.ok(dispatch(s,{type:'hunt.finish'}).ok);assert.equal(s.moonstone,before+17);assert.equal(s.mode,'prep');assert.equal(s.people.neo.activity,'idle');assert.equal(s.people.neo.form,'human');assert.equal(dispatch(s,{type:'hunt.finish'}).ok,false);assert.equal(s.moonstone,before+17);assert.equal(dispatch(s,{type:'hunt.start'}).ok,false);s.day++;assert.ok(dispatch(s,{type:'hunt.start'}).ok);assert.equal(s.hunt.hp,s.hunt.maxHp);
});

test('이벤트 정상 완료는 1회 실제 진입, 건너뛰기는 전투 없이 준비 화면이며 실패는 횟수를 안 쓴다',()=>{
 const s=createGame();s.ledger.story.m0=true;s.stats.shiftsCompleted=1;const r=completeStory('ev:hunt',cmd=>dispatch(s,cmd));assert.ok(r.entry.ok);assert.equal(s.mode,'hunt');assert.ok(s.ledger.huntVisits['neo:1']);const id=s.hunt.id;completeStory('ev:hunt',cmd=>dispatch(s,cmd));assert.equal(s.hunt.id,id);
 let saved=deserialize(serialize(s)).state;assert.equal(saved.hunt.id,id);dispatch(saved,{type:'resume'});dispatch(saved,{type:'hunt.retreat'});dispatch(saved,{type:'hunt.finish'});assert.ok(huntVisitReason(saved));assert.equal(dispatch(saved,{type:'hunt.start'}).ok,false);saved.day++;assert.ok(dispatch(saved,{type:'hunt.start'}).ok);
 const skip=createGame();skip.ledger.story.m0=true;skip.stats.shiftsCompleted=1;completeStory('ev:hunt',cmd=>dispatch(skip,cmd),{skip:true});assert.equal(skip.mode,'prep');assert.equal(huntVisitReason(skip),'');assert.ok(dispatch(skip,{type:'hunt.start'}).ok);
 const fail=ready();fail.ap.left=0;assert.equal(dispatch(fail,{type:'hunt.start'}).ok,false);assert.equal(huntVisitReason(fail),'');fail.ap.left=1;assert.ok(dispatch(fail,{type:'hunt.start'}).ok);assert.equal(dispatch(fail,{type:'hunt.start'}).ok,false);assert.equal(fail.ap.left,0);
});
test('기존 진행 사냥·오늘 귀환 저장은 방문을 보존하고 지점 전환으로 초기화되지 않는다',()=>{
 let s=ready();s.ap.neoTask='hunt';delete s.ledger.huntVisits;s=deserialize(serialize(s)).state;assert.ok(huntVisitReason(s));s.gold=1e6;s.ledger.sales.fixture=20000;s.ledger.story['branch:2']=true;dispatch(s,{type:'branch.buy',id:2,confirmed:true});dispatch(s,{type:'branch.switch',id:2});assert.ok(huntVisitReason(s));assert.equal(dispatch(s,{type:'hunt.start'}).ok,false);
});

test('결과 화면 저장을 불러온 일시정지 상태에서도 귀환 버튼은 1회 정산한다',()=>{
 let s=ready();dispatch(s,{type:'hunt.start'});s.hunt.hp=0;s.hunt.bag.moonstone=7;tick(s,50);s=deserialize(serialize(s)).state;assert.equal(s.paused,true);const before=s.moonstone;
 assert.ok(dispatch(s,{type:'hunt.finish'}).ok);assert.equal(s.mode,'prep');assert.equal(s.paused,false);assert.equal(s.moonstone,before+7);assert.equal(dispatch(s,{type:'hunt.finish'}).ok,false);
 const running=ready();dispatch(running,{type:'hunt.start'});dispatch(running,{type:'pause'});assert.equal(dispatch(running,{type:'hunt.finish'}).ok,false);assert.equal(running.mode,'hunt');
});
