import test from 'node:test';
import assert from 'node:assert/strict';
import {craftDifficulty,craftHeat,craftQuality,newCraft,mixCraft,craftProduction} from '../src/ui/crafting.js';
import {createGame} from '../src/game/state.js';
test('단계가 높아질수록 판정 폭과 왕복 시간이 단조롭게 줄고 경계는 포함한다',()=>{
 const ids=['fortune_latte','lotus_berry_tart','moon_milk_tea','night_dew_latte','lotus_moon','honey_peach','star_black_tea','gold_cinnamon','white_lotus_healing','black_moon_brown_rice'];
 let previous={width:100,speedMs:1000};for(const id of ids){const d=craftDifficulty(id);assert.ok(d.width<=previous.width&&d.speedMs<=previous.speedMs);assert.ok(d.width>=18&&d.speedMs>=440);assert.equal(craftQuality(d.min,id),'좋음');assert.equal(craftQuality(d.max,id),'좋음');assert.equal(craftQuality(d.min-.01,id),'보통');assert.equal(craftQuality(d.perfectMin,id),'완벽');assert.equal(craftQuality(d.perfectMax,id),'완벽');previous=d;}
 assert.equal(craftDifficulty(ids[0]).width,80);
});
test('타이밍은 프레임 수에 독립적이고 두 주문과 접근성 도움 상태는 섞이지 않는다',()=>{
 const a=newCraft('fortune_latte','a'),b=newCraft('black_moon_brown_rice','b');mixCraft(a,100);mixCraft(b,500);const expected=craftHeat(a,1600);for(let t=100;t<1600;t+=16)craftHeat(a,t);assert.equal(craftHeat(a,1600),expected);assert.notEqual(craftHeat(a,1600),craftHeat(b,1600));b.assist=true;assert.equal(craftHeat(b,5000),50);assert.equal(a.assist,false);
});
test('조리 장면은 해당 작업 ID의 진행률과 픽업 상태만 표시한다',()=>{
 const s=createGame(),c={menuId:'fortune_latte',jobId:'job-1'};s.stations.drink.parallel={id:'job-1',durationMs:10000,progressMs:3000};assert.equal(craftProduction(s,c).remaining,7);s.stations.drink.parallel.progressMs=9000;assert.equal(craftProduction(s,c).label,'접시에 담아요');s.stations.drink.parallel=null;s.tray[0]={jobId:'job-1',menuId:c.menuId};assert.equal(craftProduction(s,c).status,'ready');
});
