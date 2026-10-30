import test from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS, MONTH_STORIES } from '../src/story/months.js';
import { ASSETS } from '../src/render/assets.js';
import { fortuneSheet } from '../src/ui/fortune-sheet.js';
import { overlayHtml } from '../src/ui/sheets.js';
import { createGame } from '../src/game/state.js';

test('호스트 개업과 다섯 결말은 서로 다른 등록 원화를 사용한다',()=>{
 assert.ok(MONTH_STORIES[2].some(b=>b.bg==='host_opening'));
 const paths=new Set();
 for(const [id,ending] of Object.entries(ENDINGS)){
  const key='ending_'+id;assert.equal(ending.beats[0].bg,key);
  assert.equal(ending.beats.at(-1).bg,key);
  const asset=ASSETS.backgrounds[key];assert.ok(asset);paths.add(asset.path);
  const s=createGame();s.calendar.endingId=id;s.calendar.ended=true;
  assert.ok(overlayHtml(s,{ending:id}).includes(id==='bad'?'assets/illustrated/backgrounds/ending_bad_cast.webp':asset.path));
 }
 assert.equal(paths.size,5);
});

test('미래 생일은 풀이하지 않고 수정 안내를 제공한다',()=>{
 const html=fortuneSheet({fortuneBirth:'2099-12-31',fortuneFlip:true},new Date(2026,9,29));
 assert.match(html,/aria-invalid="true"/);assert.match(html,/생년월일을 확인/);
 assert.doesNotMatch(html,/사주 · 내 일간과 오늘/);
 assert.match(html,/전체 명반은 이 수첩에서 계산하지 않는다/);
});
