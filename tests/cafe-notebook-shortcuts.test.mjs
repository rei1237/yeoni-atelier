import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {panelHtml} from '../src/ui/hud.js';
import {GUIDES,tutorialSheet} from '../src/ui/tutorials.js';

test('카페 수첩 바로가기의 사냥터와 운세는 잠금 조건을 알리고 사냥은 영업 중 잠긴다',()=>{
 const s=createGame();let html=panelHtml(s,{});assert.match(html,/cafe-notebook-shortcuts/);assert.match(html,/첫 영업을 마치면 사냥터 이야기가 열려요/);assert.match(html,/두 번째 영업을 마치면 열려요/);
 s.huntUnlocked=true;html=panelHtml(s,{});assert.match(html,/영냥이의 원정 준비/);assert.match(html,/data-sheet="hunt"/);
 s.mode='shift';html=panelHtml(s,{});assert.match(html,/영업을 마친 뒤 갈 수 있어요/);
 assert.doesNotMatch(panelHtml(s,{cafeDrawer:'crew'}),/cafe-notebook-shortcuts/);
});
test('섬 산책·목표·음악 안내는 각 장면에 맞는 그림을 사용한다',()=>{
 for(const id of ['world','quests','music']){assert.equal(GUIDES[id].image,id);assert.match(tutorialSheet({guideId:id,guideStep:0}),new RegExp('guides/'+id+'-v2.webp'));}
 assert.equal(new Set(Object.values(GUIDES).map(g=>g.image)).size,Object.keys(GUIDES).length);
 for(const [id,g] of Object.entries(GUIDES)) assert.match(tutorialSheet({guideId:id,guideStep:0}),new RegExp('guides/'+(g.image.startsWith('tutorial_')?'tutorial-'+id:g.image+'-v2')+'\\.webp'));
});
