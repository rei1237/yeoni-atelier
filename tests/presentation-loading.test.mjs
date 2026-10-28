import test from 'node:test';
import assert from 'node:assert/strict';
import {drawActor,drawPortrait} from '../src/render/sprite-renderer.js';
import {overlayHtml} from '../src/ui/sheets.js';
import {MINI_GAMES} from '../src/ui/game-room.js';
test('이미지 준비 전 캐릭터·적·초상화는 임시 도형을 그리지 않는다',()=>{const calls=[];const ctx=new Proxy({clearRect(){}},{get:(o,k)=>o[k]||((...v)=>calls.push([k,...v]))});for(const key of ['neo','museong','shade_blob'])drawActor(ctx,key,{x:10,y:20,size:96,state:'idle',t:0});drawPortrait(ctx,'museong','normal',320,384);assert.deepEqual(calls,[]);});
test('메인 화면 게임방은 버튼으로 열고 외부 게임은 별도 창으로 연결한다',()=>{const html=overlayHtml(null,{hasSave:true});assert.match(html,/이야기 이어하기/);assert.match(html,/data-action="game.room"/);assert.doesNotMatch(html,/호스트 체험 이어하기/);const room=overlayHtml(null,{gameRoom:true});for(const g of MINI_GAMES)assert.ok(room.includes(g.url));assert.match(room,/target="_blank" rel="noopener noreferrer"/);assert.match(room,/game.room.close/);});
