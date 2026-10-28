import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {panelHtml,automationChips} from '../src/ui/hud.js';
import {createTrip,advanceTrip} from '../src/ui/world-travel.js';
import {unlockAutomation} from './helpers.mjs';
test('재성의 섬은 카페에서 직접 열고 UI 렌더가 저장 상태를 바꾸지 않는다',()=>{
 const s=createGame(),before=JSON.stringify(s),html=panelHtml(s,{});
 assert.match(html,/data-action="sheet.open" data-sheet="town"/);assert.match(html,/재성의 섬/);
 assert.doesNotMatch(html,/data-tab="menu"/);assert.match(html,/카페 수첩/);
 assert.equal(JSON.stringify(s),before);
});
test('동료 조건 안내는 인연과 이야기 조건을 구분하고 네오 해금을 루나에 전파하지 않는다',()=>{
 const s=createGame();unlockAutomation(s,['hall_neo']);const html=automationChips(s);
 assert.match(html,/data-ability="hall_neo" data-locked="false"/);
 assert.match(html,/data-ability="hall" data-locked="true"/);
 assert.match(html,/현재 ♥0 \/ 필요 ♥2/);assert.match(html,/동료와 대화/);
 delete s.ledger.story['bond:neo:2'];assert.match(automationChips(s),/이 단계의 인연 이야기/);
});
test('지도 보행은 모서리 경로를 따라 걷고 도착은 단 한 번만 반환한다',()=>{
 const points=[{x:0,y:0},{x:10,y:0},{x:10,y:20}],t=createTrip('moka',points);
 points[0].x=99;assert.equal(t.path[0].x,0);
 let p=advanceTrip(t,100);assert.equal(p.y,0);assert.equal(p.facing,'right');
 let arrivals=0;for(let i=0;i<40;i++){p=advanceTrip(t,100);if(p?.arrived)arrivals++;}
 assert.equal(arrivals,1);assert.equal(t.distance,t.total);assert.equal(advanceTrip(t,100),null);
});
test('즉시 도착·감소 모션은 정면 정지이며 잘못된 좌표와 음수 시간은 이동하지 않는다',()=>{
 assert.equal(createTrip('x',[{x:NaN,y:0},{x:1,y:1}]),null);
 const t=createTrip('luna',[{x:1,y:2},{x:1,y:12}]);advanceTrip(t,-100);assert.equal(t.distance,0);
 const p=advanceTrip(t,0,true);assert.deepEqual(p,{x:1,y:12,facing:'down',frame:0,arrived:true});
});
