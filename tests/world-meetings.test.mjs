import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {calendarOf} from '../src/game/calendar.js';
import {worldMeetingAccess} from '../src/game/world-meetings.js';
import {worldCastSheet} from '../src/ui/world-cast.js';
const eventDay=Array.from({length:180},(_,i)=>i+1).find(d=>{const c=calendarOf(d);return 1+Math.floor(c.monthIdx/12)===1&&c.month===8;});
test('처음부터 함께하는 네오는 데스티노바 만남 잠금을 풀지 않는다',()=>{const s=createGame();assert.ok(s.roster.neo);assert.equal(worldMeetingAccess(s).unlocked,false);assert.match(worldCastSheet(s),/아직 도착하지 않은 초대장/);assert.doesNotMatch(worldCastSheet(s),/world-cast-person/);});
test('기존 솔브 이벤트의 연차·월·인연 조건이 모두 맞아야 초대장이 열린다',()=>{const s=createGame();s.hostbar.open=true;s.affinity.neo=30;assert.equal(worldMeetingAccess(s).unlocked,false);s.day=eventDay;s.affinity.neo=29;assert.equal(worldMeetingAccess(s).unlocked,false);s.affinity.neo=30;const access=worldMeetingAccess(s);assert.equal(access.available[0].id,'solv');assert.ok(access.unlocked);assert.match(worldCastSheet(s),/만남 이야기 시작/);s.day+=4;assert.equal(worldMeetingAccess(s).unlocked,false);s.day+=8;assert.ok(worldMeetingAccess(s).unlocked);});
test('기존 영입 이벤트 완료 후에는 다른 달에도 만남 화면을 유지하고 보상은 중복되지 않는다',()=>{const s=createGame();s.hostbar.open=true;s.day=eventDay;s.affinity.neo=30;assert.ok(dispatch(s,{type:'recruit.complete',id:'solv'}).ok);const gold=s.gold;s.day+=4;assert.ok(worldMeetingAccess(s).unlocked);assert.equal(dispatch(s,{type:'recruit.complete',id:'solv'}).ok,false);assert.equal(s.gold,gold);assert.match(worldCastSheet(s),/대화 · 선물/);});

test('호스트 개업 전에는 날짜와 인연을 채워도 합류 이벤트를 완료할 수 없다',()=>{const s=createGame();s.day=eventDay;s.affinity.neo=1000;assert.equal(worldMeetingAccess(s).unlocked,false);assert.equal(dispatch(s,{type:'recruit.complete',id:'solv'}).ok,false);});
