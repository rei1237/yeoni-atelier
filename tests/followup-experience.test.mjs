import test from 'node:test';
import assert from 'node:assert/strict';
import {BOND_STORIES} from '../src/story/bonds.js';
import {castBondStory} from '../src/story/career.js';
import {BONDS,BOND_IDS} from '../src/data/bonds.js';
import {createGame} from '../src/game/state.js';
import {mapScreenHtml} from '../src/ui/world-screen.js';
import {sheetHtml} from '../src/ui/sheets.js';
import {PROLOGUE,SPEAKERS} from '../src/story/prologue.js';
import {FURNITURE} from '../src/data/layout.js';
function flatten(beats){return beats.flatMap(b=>[b,...(b.choices||[]).flatMap(c=>flatten(c.beats||[]))]);}
test('11명 44개 인연 장면은 개별 사건·대사·기존 능력 고지를 갖추고 대사 길이를 지킨다',()=>{
 const titles=new Set();for(const id of BOND_IDS)for(let tier=1;tier<=4;tier++){
 const scene=BOND_STORIES[id]?.[tier-1]||castBondStory(id,tier);assert.ok(scene.length>=14,id+':'+tier);titles.add(scene[0].chapter[1]);assert.equal(scene.filter(b=>b.chapter).length,1);assert.ok(scene.at(-1).s==='sys');
 for(const b of flatten(scene)){if(!b.s)continue;assert.ok(['nar','sys'].includes(b.s)||SPEAKERS[b.s],b.s);if(!['nar','sys'].includes(b.s))assert.ok(b.t.split(/(?<=[.!?])\s+/).length<=2,id+':'+b.t);}
 }assert.equal(titles.size,44);assert.doesNotMatch(JSON.stringify(PROLOGUE),/빚도 같이 샀/);
});
test('이동 중 지도는 상태 안내 하나만 렌더하고 화면 열기는 저장을 바꾸지 않는다',()=>{
 const s=createGame(),before=JSON.stringify(s);const html=mapScreenHtml(s,{worldTrip:{id:'moka'},worldZoom:1});assert.match(html,/world-travel-tools/);assert.doesNotMatch(html,/class="world-map-hint"/);assert.equal(JSON.stringify(s),before);
});
test('동료 선택은 직접 선물·횟수·음식 수량을 보여 주고 미영입 동료를 숨긴다',()=>{
 const s=createGame(),before=JSON.stringify(s);const html=sheetHtml(s,{sheet:{kind:'companions'},companionId:'moka'});assert.match(html,/보유 음식 선물 · 0개/);assert.match(html,/data-action="companion.select" data-id="moka"/);assert.doesNotMatch(html,/data-action="companion.select" data-id="seohanbi"/);assert.match(html,/동료 소개 · 근무 · 새로운 만남/);assert.equal(JSON.stringify(s),before);
});
test('큰 가구 입면은 점유 칸보다 높고 기존 바닥 크기를 보존한다',()=>{
 assert.equal(FURNITURE.bookshelf.cells.length,2);assert.ok(FURNITURE.bookshelf.renderSize.h>=3.5);assert.equal(FURNITURE.long_cabinet.cells.length,6);assert.ok(FURNITURE.long_cabinet.renderSize.w>=3.5);
});
