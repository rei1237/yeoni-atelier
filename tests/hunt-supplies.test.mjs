import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {getHuntWorld,supplyStatus,mods} from '../src/game/hunt.js';
import {SUPPLY_TEMP} from '../src/data/hunt-supplies.js';
import {huntSuppliesHtml} from '../src/ui/hunt-supplies.js';
function ready(){const s=createGame();s.huntUnlocked=true;s.ledger.story.m0=true;s.stats.huntsCompleted=1;s.hunter.maxStage=7;s.moonstone=10000;s.affinity.moka=10000;s.bondRank.moka=10;return s;}
function use(s,id){return dispatch(s,{type:'hunt.supply',id});}
test('모카 구매 → 간편 사용 → 재고·HP·재사용 대기 저장, 연타와 가득 찬 체력은 무효',()=>{
 let s=ready();s.gold=100000;for(let i=0;i<3;i++)assert.ok(dispatch(s,{type:'armory.buy',id:'tonic'}).ok);assert.equal(dispatch(s,{type:'armory.buy',id:'tonic'}).ok,false);assert.equal(s.moonstone,10000);assert.equal(s.gold,46000);dispatch(s,{type:'hunt.start'});
 assert.equal(use(s,'tonic').ok,false);assert.equal(s.armory.supplies.tonic,3);s.hunt.hp=10;assert.ok(use(s,'tonic').ok);assert.equal(s.hunt.hp,45);assert.equal(s.armory.supplies.tonic,2);assert.equal(use(s,'tonic').ok,false);
 s=deserialize(serialize(s)).state;assert.equal(use(s,'tonic').ok,false);dispatch(s,{type:'resume'});assert.equal(use(s,'tonic').ok,false);s.hunt.elapsedMs=SUPPLY_TEMP.cooldownMs.tonic;assert.ok(use(s,'tonic').ok);assert.equal(s.hunt.hp,80);assert.equal(s.armory.supplies.tonic,1);
 const html=huntSuppliesHtml(s);assert.match(html,/회복 수프/);assert.match(html,/8초/);assert.match(html,/aria-describedby/);assert.equal((html.match(/data-action="hunt.supply"/g)||[]).length,5);
});
test('보호막은 중첩·무한 연장이 없고 입력 공통 대기는 서로 다른 물품에도 적용',()=>{
 const s=ready();s.armory.supplies={shield:3,tonic:3};dispatch(s,{type:'hunt.start'});s.hunt.hp=1;assert.ok(use(s,'shield').ok);assert.equal(s.hunt.shieldUntil,8000);assert.equal(use(s,'shield').ok,false);assert.equal(use(s,'tonic').ok,false);s.hunt.elapsedMs=800;assert.ok(use(s,'tonic').ok);s.hunt.elapsedMs=8000;assert.equal(use(s,'shield').ok,false);s.hunt.elapsedMs=12000;assert.ok(use(s,'shield').ok);assert.equal(s.armory.supplies.shield,1);
});
test('기존 수집 향은 질주 향으로 이어지고 지속 중 중복 사용되지 않는다',()=>{
 const s=ready();s.armory.supplies={magnet:2,nova:2,tonic:2};dispatch(s,{type:'hunt.start'});const w=getHuntWorld(s);w.enemies.count=0;assert.equal(use(s,'nova').ok,false);
 const speed=mods(s.hunt).speed;assert.ok(use(s,'magnet').ok);assert.equal(mods(s.hunt).speed,speed*1.25);s.hunt.elapsedMs=4000;assert.equal(use(s,'magnet').ok,false);assert.equal(s.armory.supplies.magnet,1);
 s.hunt.elapsedMs=8000;assert.equal(mods(s.hunt).speed,speed);assert.equal(use(s,'magnet').ok,false);s.hunt.elapsedMs=12000;assert.ok(use(s,'magnet').ok);
 s.hunt.hp=0;assert.equal(use(s,'tonic').ok,false);s.hunt.hp=10;s.hunt.picks=[[]];assert.equal(use(s,'tonic').ok,false);s.hunt.picks=[];dispatch(s,{type:'hunt.retreat'});assert.equal(use(s,'tonic').ok,false);assert.equal(s.armory.supplies.tonic,2);
});
test('기존 폭탄 대기와 수량을 보존하고 무효 요청은 RNG·재고에 영향을 주지 않는다',()=>{
 const s=ready();s.armory.supplies={bomb:3};dispatch(s,{type:'hunt.start'});s.hunt.bombUsedAt=0;const rng=JSON.stringify(s.rng);assert.equal(use(s,'bomb').ok,false);assert.equal(use(s,'unknown').ok,false);assert.equal(JSON.stringify(s.rng),rng);assert.equal(s.armory.supplies.bomb,3);s.hunt.elapsedMs=1000;assert.ok(use(s,'bomb').ok);assert.equal(s.armory.supplies.bomb,2);assert.equal(supplyStatus(s,'bomb').leftMs,1000);
});
