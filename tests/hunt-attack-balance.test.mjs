import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {getHuntWorld,spawnEnemy,mods,weaponStats,describeOption} from '../src/game/hunt.js';
import {serialize,deserialize} from '../src/core/save.js';
import {WEAPONS} from '../src/data/hunt-kit.js';

test('기존 자석 수염 레벨은 달빛 낙뢰로 이어지고 실제로 주변 적을 공격한다',()=>{
 let s=createGame();s.huntUnlocked=true;s.hunter.maxStage=7;s.armory.skills.whisker=1;assert.ok(dispatch(s,{type:'hunt.start'}).ok);s.hunt.weapons=[];s.hunt.passives={whisker:2};
 s=deserialize(serialize(s)).state;assert.equal(s.hunt.passives.whisker,2);assert.match(describeOption(s.hunt,{kind:'passive',id:'whisker'}).name,/달빛 낙뢰/);dispatch(s,{type:'resume'});
 const w=getHuntWorld(s),e=spawnEnemy(s,w,'shade_hand',w.player.x+100,w.player.y);e.hp=e.maxHp=10000;e.speed=0;
 for(let i=0;i<20&&e.hp===10000;i++)tick(s,50);assert.ok(e.hp<10000,'낙뢰가 실제 피해를 준다');const after=e.hp;
 for(let i=0;i<30;i++)tick(s,50);assert.equal(e.hp,after,'발동 대기시간 동안 중복 피해가 없다');
});

test('공격 기술의 강화 수치는 유한하며 사주 성광 외에도 성장한다',()=>{
 const s=createGame();s.huntUnlocked=true;dispatch(s,{type:'hunt.start'});const m=mods(s.hunt);
 for(const id of ['orbit','crescent','tarot']){const a=weaponStats({id,level:1,evo:false},m),b=weaponStats({id,level:5,evo:false},m);assert.ok(Number.isFinite(a.damage)&&a.damage>0);assert.ok(b.damage>a.damage);assert.ok(WEAPONS[id].evo);}
 assert.ok(WEAPONS.orbit.base.damage>=14);assert.ok(WEAPONS.crescent.base.damage>=30);assert.ok(WEAPONS.tarot.base.damage>=52);
});

test('진행 중인 옛 수집기 강화는 발걸음으로 한 번만 옮겨진다',()=>{
 const s=createGame();s.huntUnlocked=true;s.armory.upgrades.neo={magnet:3};assert.ok(dispatch(s,{type:'hunt.start'}).ok);
 const old=JSON.parse(serialize(s));delete old.hunt.legacyCollectorConverted;old.hunt.gear.magnet=1.105;old.hunt.gear.speed=1;
 const re=deserialize(JSON.stringify(old)).state;assert.ok(Math.abs(re.hunt.gear.magnet-1)<1e-8);assert.ok(Math.abs(re.hunt.gear.speed-1.045)<1e-8);
 const twice=deserialize(serialize(re)).state;assert.equal(twice.hunt.gear.speed,re.hunt.gear.speed);assert.equal(twice.hunt.gear.magnet,re.hunt.gear.magnet);
});
