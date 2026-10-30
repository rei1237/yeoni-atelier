import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize,saveGame,loadGame,memoryStorage,SAVE_KEYS} from '../src/core/save.js';
import {pendingStory} from '../src/game/calendar.js';
import { PROLOGUE } from '../src/story/prologue.js';
import { TEMP } from '../src/config/balance.temp.js';

test('확장 프롤로그는 현재 기간·빚을 설정에서 읽는다',()=>{
 const notice=PROLOGUE.find(b=>b.campaignNotice);
 assert.ok(notice.t.includes(`${TEMP.CALENDAR.TOTAL_TURNS/TEMP.CALENDAR.TURNS_PER_MONTH}개월`));
 assert.ok(PROLOGUE.find(b=>b.debtNotice).t.includes(`${TEMP.INITIAL_DEBT/100000000}억 골드`));
 assert.doesNotMatch(PROLOGUE.map(b=>b.t||'').join('\n'),/오 년|십이만|120,000|5분 동안|몸부터 갚/);
 assert.equal(PROLOGUE.filter(b=>b.transform==='human').length,1);
 assert.ok(PROLOGUE.some(b=>b.s==='yeoni_pig'));
});

test('새 게임 프롤로그 완료는 한 번 기록하고 첫 달 이야기와 보상은 건드리지 않는다',()=>{
 const s=createGame(),before=structuredClone(s);
 assert.equal(s.ledger.story.prologue,undefined);
 assert.ok(dispatch(s,{type:'story.seen',id:'prologue'}).ok);
 assert.equal(dispatch(s,{type:'story.seen',id:'prologue'}).duplicate,true);
 assert.equal(s.ledger.story.prologue,true);
 assert.equal(pendingStory(s),'m0');
 assert.equal(s.gold,before.gold);assert.deepEqual(s.ledger.rewards,before.ledger.rewards);
});
test('구형 저장 이어하기·재로드는 프롤로그만 생략하며 미완료 이야기와 퀘스트를 보존한다',()=>{
 const s=createGame();s.day=4;s.ledger.story.m0=true;s.quests.claimed.q_first_serve=true;
 s.storyProgress={id:'m1',index:3};
 const storage=memoryStorage();saveGame(storage,SAVE_KEYS.normal,s);
 const a=loadGame(storage,SAVE_KEYS.normal);assert.ok(a.ok);assert.equal(a.state.ledger.story.prologue,true);
 assert.equal(pendingStory(a.state),'m1');assert.equal(a.state.ledger.story.m1,undefined);
 assert.deepEqual(a.state.storyProgress,s.storyProgress);assert.deepEqual(a.state.quests,s.quests);
 assert.equal(a.state.gold,s.gold);assert.equal(a.state.rng.seed,s.rng.seed);
 saveGame(storage,SAVE_KEYS.normal,a.state);
 const b=loadGame(storage,SAVE_KEYS.normal);assert.ok(b.ok);assert.deepEqual(b.state.ledger,a.state.ledger);
 assert.deepEqual(b.state.storyProgress,s.storyProgress);
});
test('도입부 중간 저장도 이어하기에서는 생략하고 새 게임 객체에는 전파되지 않는다',()=>{
 const s=createGame(),r=deserialize(serialize(s));assert.ok(r.ok);
 assert.equal(r.state.ledger.story.prologue,true);assert.equal(createGame().ledger.story.prologue,undefined);
});
