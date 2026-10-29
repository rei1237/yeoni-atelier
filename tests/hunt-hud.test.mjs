import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {topbarHtml} from '../src/ui/hud.js';

test('사냥 상단은 실제 체력·원정 경험치·획득량을 읽고 상태를 변경하지 않는다',()=>{
 const s=createGame();s.huntUnlocked=true;assert.ok(dispatch(s,{type:'hunt.start',depth:1}).ok);
 Object.assign(s.hunt,{hp:21,maxHp:100,xp:9,xpNext:18,level:3,elapsedMs:65000});s.hunt.bag.moonstone=1234;
 const before=JSON.stringify(s),html=topbarHtml(s,{dev:false});
 assert.match(html,/영냥이의 사냥터/);assert.match(html,/체력 낮음/);assert.match(html,/체력 21 \/ 100/);
 assert.match(html,/원정 경험치 9 \/ 18/);assert.match(html,/01:05/);assert.match(html,/1,234/);
 assert.equal(JSON.stringify(s),before);
 s.paused=true;assert.match(topbarHtml(s,{}),/사냥 계속하기/);
});

test('전체화면 단추는 지원하는 브라우저에서만 보이고, 켜진 상태를 알린다',()=>{
 const s=createGame();s.huntUnlocked=true;assert.ok(dispatch(s,{type:'hunt.start',depth:1}).ok);
 assert.doesNotMatch(topbarHtml(s,{}),/hunt\.fullscreen/);
 assert.match(topbarHtml(s,{canFullscreen:true}),/data-action="hunt\.fullscreen"[^>]*aria-label="전체화면으로 보기" aria-pressed="false"/);
 assert.match(topbarHtml(s,{canFullscreen:true,fullscreen:true}),/aria-label="전체화면 끝내기" aria-pressed="true"/);
});
