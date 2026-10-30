import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {startHunt,getHuntWorld,spawnEnemy,mods,useSupply} from '../src/game/hunt.js';
import {damageHunter} from '../src/game/enemy-behaviors.js';
import {gearBonus,GEAR} from '../src/data/gear.js';
import {serialize,deserialize} from '../src/core/save.js';
import {branchOffer,buyBranch} from '../src/game/branches.js';
import {branchesSheet} from '../src/ui/branches.js';
import {branchStory} from '../src/story/branches.js';
import {huntPrepSheet} from '../src/ui/hunt-prep.js';

test('같은 적은 더 높은 사냥 단계에서 체력과 피해가 증가한다',()=>{
 const game=depth=>{const s=createGame();s.huntUnlocked=true;s.hunter.maxStage=10;assert.ok(startHunt(s,depth).ok);const w=getHuntWorld(s),e=spawnEnemy(s,w,'shade_hand',700,700);const hp=s.hunt.hp;assert.ok(damageHunter(s,w,20,1));return {s,e,damage:hp-s.hunt.hp};};
 const a=game(1),b=game(10);assert.ok(b.e.maxHp>a.e.maxHp);assert.ok(b.damage>a.damage);assert.match(huntPrepSheet(b.s,{huntMenu:'depart',huntStage:10}),/적 Lv\.10/);
});
test('수집 향은 보유 수량과 지속 시간을 저장하고 범위 안의 아이템을 끌어당긴다',async()=>{
 const {tick}=await import('../src/game/engine.js');let s=createGame();s.huntUnlocked=true;s.armory.supplies.magnet=2;assert.ok(startHunt(s,1).ok);let w=getHuntWorld(s);w.enemies.clear();const p=w.player;Object.assign(w.drops.spawn(),{kind:'moon',v:1,x:p.x+220,y:p.y,speed:0,magnet:false});const baseline=mods(s.hunt).magnet;assert.ok(useSupply(s,'magnet').ok);assert.equal(mods(s.hunt).magnet,baseline*2);tick(s,100);assert.equal(w.drops.items[0].magnet,true);s=deserialize(serialize(s)).state;assert.equal(s.armory.supplies.magnet,1);assert.ok(mods(s.hunt).magnet>baseline);assert.ok(s.hunt.collectIncenseUntil>s.hunt.elapsedMs);
});
test('수집 장신구와 무기 가격은 장착과 구입 데이터에 반영된다',()=>{
 assert.equal(gearBonus({charm:'churu_magnet'}).magnet,1.35);assert.equal(gearBonus({charm:'churu_magnet'}).speed,1);assert.equal(GEAR.claw_glove.cost.gold,9000);assert.equal(GEAR.crescent_wand.cost.gold,25000);
});
test('2호점 제안 조건과 월정석 안내, 이전 제안·구입 기록은 보존한다',()=>{
 let s=createGame();s.ledger.sales.a=300000;s.day=12;assert.equal(branchOffer(s),null);s.day=13;s.ledger.sales.a=299999;assert.equal(branchOffer(s),null);s.ledger.sales.a=300000;assert.equal(branchOffer(s).id,2);
 s.ledger.story['branch:2']=true;s.moonstone=999;let html=branchesSheet(s,{sheet:{preview:2}});assert.match(html,/월정석 1,000개/);assert.match(html,/잔액 부족/);assert.equal(buyBranch(s,2,true).ok,false);assert.match(branchStory(2).map(b=>b.t||'').join(' '),/월정석 1,000개/);
 s.moonstone=1000;const gold=s.gold;assert.ok(buyBranch(s,2,true).ok);assert.equal(s.moonstone,0);assert.equal(s.gold,gold);s=deserialize(serialize(s)).state;assert.ok(s.branches.owned[2]);assert.equal(branchOffer(s),null);assert.equal(buyBranch(s,2,true).duplicate,true);
 const legacy=createGame();legacy.ledger.story['branch:2']=true;legacy.ledger.sales.a=20000;assert.equal(branchOffer(legacy).id,2);
});
