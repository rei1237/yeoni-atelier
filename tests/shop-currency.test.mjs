import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {SUPPLIES,supplyPrice} from '../src/game/moka-armory.js';
import {supplyShop} from '../src/ui/armory.js';
import {serialize,deserialize} from '../src/core/save.js';
import {TEMP} from '../src/config/balance.temp.js';

test('모카 사냥 보급품 가격은 기존 환산가의 약 3분의 1이다',()=>{
 const prices={tonic:6000,magnet:10000,shield:15000,nova:21700};
 const s=createGame();s.bondRank.moka=10;s.gold=100000;s.moonstone=1000;
 for(const [id,amount] of Object.entries(prices)){
  assert.deepEqual(supplyPrice(SUPPLIES[id]),{currency:'gold',amount});
  assert.match(supplyShop(s),new RegExp(amount.toLocaleString()+'G'));
  const gold=s.gold;assert.ok(dispatch(s,{type:'armory.buy',id}).ok);assert.equal(s.gold,gold-amount);assert.equal(s.moonstone,1000);
 }
 assert.deepEqual(supplyPrice(SUPPLIES.bomb),{currency:'gold',amount:1200});
});

test('모카 보급품과 윤달 도구는 골드만 차감한다',()=>{
 let s=createGame();s.gold=100000;s.moonstone=1000;const price=supplyPrice(SUPPLIES.tonic).amount;
 assert.match(supplyShop(s),new RegExp(price.toLocaleString()+'G'));assert.ok(dispatch(s,{type:'armory.buy',id:'tonic'}).ok);assert.equal(s.gold,100000-price);assert.equal(s.moonstone,1000);
 s.gold=0;const before=JSON.stringify(s);assert.equal(dispatch(s,{type:'armory.buy',id:'tonic'}).ok,false);assert.equal(JSON.stringify(s),before);
 s.day=10;s.hunter.maxStage=7;s.gold=SUPPLIES.bomb.cost;const m=s.moonstone;assert.ok(dispatch(s,{type:'armory.buy',id:'bomb'}).ok);assert.equal(s.moonstone,m);assert.equal(s.gold,0);
 s=deserialize(serialize(s)).state;assert.equal(s.armory.supplies.tonic,1);assert.equal(s.armory.supplies.bomb,1);
});
test('무성의 일부 가구만 월정석 구매를 허용하며 기존 골드 선택도 유지한다',()=>{
 const s=createGame();s.day=10;s.gold=10000;s.moonstone=10;const count=s.interior.furniture.length;
 assert.ok(dispatch(s,{type:'expand.decor',defId:'moon_lamp',currency:'moonstone'}).ok);assert.equal(s.moonstone,10-TEMP.DECOR_MOONSTONE.moon_lamp);assert.equal(s.gold,10000);assert.equal(s.interior.furniture.length,count+1);
 const before=JSON.stringify(s);assert.equal(dispatch(s,{type:'expand.decor',defId:'plant',currency:'moonstone'}).ok,false);assert.equal(JSON.stringify(s),before);
 assert.ok(dispatch(s,{type:'expand.decor',defId:'moon_lamp'}).ok);assert.equal(s.gold,10000-TEMP.DECOR_PRICES.moon_lamp);
});

test('윤달 공방은 강화와 상한·진화 비전에 월정석을 쓰고 상품은 골드를 쓴다',async()=>{
 const {armorySheet}=await import('../src/ui/armory.js');const {GEAR}=await import('../src/data/gear.js');const {upgradeCost,skillCost,techNext}=await import('../src/game/moka-armory.js');
 const s=createGame();s.hunter.maxStage=20;s.moonstone=10000;s.gold=100000;
 assert.ok(Object.values(GEAR).every(g=>g.cost.gold&&!g.cost.moonstone));
 assert.equal(upgradeCost(s,'neo','power'),45);assert.equal(upgradeCost(s,'neo','vitality'),35);assert.equal(upgradeCost(s,'neo','stride'),40);
 assert.equal(techNext(s,'forge').currency,'moonstone');assert.equal(techNext(s,'charm').currency,'moonstone');
 let moon=s.moonstone,gold=s.gold;assert.ok(dispatch(s,{type:'armory.learn',id:'crescent'}).ok);assert.equal(s.gold,gold-skillCost('crescent'));assert.equal(s.moonstone,moon);
 gold=s.gold;assert.ok(dispatch(s,{type:'gear.buy',id:'crescent_wand'}).ok);assert.equal(s.gold,gold-GEAR.crescent_wand.cost.gold);assert.equal(s.moonstone,moon);
 assert.ok(dispatch(s,{type:'armory.tech',line:'forge'}).ok);assert.ok(dispatch(s,{type:'armory.tech',line:'forge'}).ok);moon=s.moonstone;gold=s.gold;
 assert.ok(dispatch(s,{type:'armory.tech',line:'evo',id:'crescent'}).ok);assert.equal(s.gold,gold);assert.equal(s.moonstone,moon-TEMP.HUNT_SKILLS.TECH.evo.cost[0]);
 const html=armorySheet(s,{armoryTab:'upgrade'});assert.match(html,/달빛 발걸음/);assert.doesNotMatch(html,/월광 수집기/);
});

test('달빛 발걸음은 이동 속도를 높이고 기존 수집기 강화 단계를 이어받는다',async()=>{
 const {enhancementBonus}=await import('../src/game/moka-armory.js');const s=createGame();s.huntUnlocked=true;s.hunter.maxStage=7;s.moonstone=1000;s.armory.upgrades.neo={magnet:3};
 assert.equal(enhancementBonus(s,'neo').magnet,0);assert.equal(enhancementBonus(s,'neo').speed,.045);
 assert.ok(dispatch(s,{type:'armory.enhance',who:'neo',id:'stride'}).ok);assert.equal(enhancementBonus(s,'neo').speed,.06);
 const re=deserialize(serialize(s)).state;assert.equal(enhancementBonus(re,'neo').magnet,enhancementBonus(s,'neo').magnet);assert.equal(enhancementBonus(re,'neo').speed,.06);
 assert.ok(dispatch(re,{type:'hunt.start'}).ok);assert.ok(Math.abs(re.hunt.gear.speed-1.06)<1e-8);
 const capped=createGame();capped.hunter.maxStage=7;capped.moonstone=100000;capped.armory.upgrades.neo={stride:40};const before=capped.moonstone;assert.equal(dispatch(capped,{type:'armory.enhance',who:'neo',id:'stride'}).ok,false);assert.equal(capped.moonstone,before);
});
