import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {getHuntWorld,spawnEnemy} from '../src/game/hunt.js';
import {KFP_WEAPONS as W,KFP_PASSIVES as P,FUSION_RECIPES,kfpOptions,kfpEvolutions,applyKfpOption,kfpFusionPreview,activeKfpCores,kfpPlayerStats} from '../src/game/kfp-loadout.js';
import {kfpWeaponStats} from '../src/game/kfp-stats.js';
import {stepKfp,KFP_LIMITS} from '../src/game/kfp-combat.js';
import {damageHunter} from '../src/game/enemy-behaviors.js';
function game(){const s=createGame();s.huntUnlocked=true;s.ledger.story.m0=true;s.ledger.rewards['stage:neo:100']=true;s.ledger.story['ev:bloom']=true;assert.ok(dispatch(s,{type:'hunt.start',hunterId:'yeoni_pig'}).ok);return s;}
test('원본 기본 9종·진화 9종·패시브 12종과 14개 조합은 유한 능력치를 유지한다',()=>{
 const s=game(),h=s.hunt;assert.equal(Object.values(W).filter(x=>!x.fusionOnly).length,9);assert.equal(Object.keys(P).length,12);assert.equal(FUSION_RECIPES.length,14);
 for(const id of Object.keys(P))for(let i=0;i<5;i++)assert.ok(applyKfpOption(h,{kind:'kfpPassive',id}));
 for(const id of Object.keys(P))assert.equal(applyKfpOption(h,{kind:'kfpPassive',id}),false);
 for(const id of Object.keys(W))for(const level of [1,8])for(const evolved of [false,true]){const stats=kfpWeaponStats({id,level,evolved},kfpPlayerStats(h));for(const [key,value] of Object.entries(stats))if(typeof value==='number')assert.ok(Number.isFinite(value),`${id}.${key}`);assert.ok(stats.cd>0);}
});
test('모든 14개 조합은 재료를 한 번 소비하고 진화 코어를 계승하며 저장 후 재획득·이중 확정하지 않는다',()=>{
 for(const r of FUSION_RECIPES){let s=game(),h=s.hunt;h.kfp.weapons=r.inputs.map(i=>({id:i.id,level:8,evolved:true}));const p=kfpFusionPreview(h,r.id);assert.ok(p.ok,r.id);
 assert.ok(dispatch(s,{type:'hunt.fuse',id:r.id,revision:p.revision}).ok);assert.equal(dispatch(s,{type:'hunt.fuse',id:r.id,revision:p.revision}).ok,false);assert.deepEqual(h.kfp.weapons.map(w=>w.id),[r.output]);assert.equal(activeKfpCores(h).length,1+r.inputs.length);
 s=deserialize(serialize(s)).state;assert.equal(s.hunt.kfp.weapons[0].id,r.output);assert.ok(kfpOptions(s.hunt).every(o=>o.kind!=='kfpWeapon'||!r.inputs.some(i=>i.id===o.id)));}
 const s=game(),r=FUSION_RECIPES[0];s.hunt.kfp.weapons=r.inputs.map(i=>({id:i.id,level:8,evolved:true}));const p=kfpFusionPreview(s.hunt,r.id);applyKfpOption(s.hunt,{kind:'kfpPassive',id:'heart'});assert.equal(dispatch(s,{type:'hunt.fuse',id:r.id,revision:p.revision}).ok,false);
});
test('진화는 Lv8와 짝 패시브 및 희귀 상자를 모두 요구한다',()=>{
 const s=game(),h=s.hunt;h.kfp.weapons=[{id:'shotgun',level:7,evolved:false}];h.kfp.passives[W.shotgun.evolve.with]=1;assert.equal(kfpEvolutions(h).length,0);applyKfpOption(h,{kind:'kfpWeapon',id:'shotgun'});assert.equal(h.kfp.weapons[0].evolved,false);assert.equal(kfpEvolutions(h).length,1);const w=getHuntWorld(s);Object.assign(w.drops.spawn(),{kind:'chest',id:'chest',v:0,x:w.player.x,y:w.player.y,speed:0,magnet:false});tick(s,100);assert.equal(h.chests[0].upgrade.kind,'kfpEvolve');assert.ok(dispatch(s,{type:'hunt.chest'}).ok);assert.equal(h.kfp.weapons[0].evolved,true);
});
test('23개 기본·조합 공격은 실제 적에게 피해를 주며 투사체와 지속 장판이 제한을 지킨다',()=>{
 for(const id of Object.keys(W)){const s=game(),h=s.hunt,w=getHuntWorld(s);h.kfp.weapons=[{id,level:8,evolved:!W[id].fusionOnly}];w.player.dirX=1;w.player.dirY=0;
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,e=spawnEnemy(s,w,'shade_hand',w.player.x+Math.cos(a)*55,w.player.y+Math.sin(a)*55);if(e){e.hp=e.maxHp=1e9;e.speed=0;}}
 let total=0;for(let t=0;t<5000;t+=50){h.elapsedMs=t;stepKfp(s,w,50,(i,d)=>{assert.ok(Number.isFinite(d)&&d>0,id);total+=d;w.enemies.items[i].hp-=d;});}
 assert.ok(total>0,id);assert.ok(w.kfp.shots.length<=KFP_LIMITS.shots);assert.ok(w.kfp.fields.length<=KFP_LIMITS.fields);assert.ok(w.kfp.beams.length<=3);assert.ok(w.kfp.orbits.length<=32);}
});
test('보호막은 무적 중 소모되지 않고 주변 밀치기·재충전이 한 번 작동한다',()=>{
 const s=game(),w=getHuntWorld(s);s.hunt.kfp.passives.pollen=1;const e=spawnEnemy(s,w,'shade_hand',w.player.x+50,w.player.y);w.player.hurtUntil=1000;const before=s.hunt.kfp.pollenAt;
 assert.equal(damageHunter(s,w,10,500),false);assert.equal(s.hunt.kfp.pollenAt,before);assert.equal(damageHunter(s,w,10,1001),false);assert.equal(s.hunt.kfp.pollenAt,13001);assert.ok(e.kx>0);const hp=s.hunt.hp;assert.ok(damageHunter(s,w,10,1002));assert.ok(s.hunt.hp<hp);
});
test('풀 재사용은 이전 적의 출혈·둔화·기절을 전염시키지 않는다',()=>{
 const s=game(),w=getHuntWorld(s),e=spawnEnemy(s,w,'shade_hand',0,0);Object.assign(e,{kfpBleed:50,kfpBleedUntil:99999,kfpStunUntil:99999,kfpSlowUntil:99999});w.enemies.release(0);const fresh=spawnEnemy(s,w,'shade_hand',0,0);assert.equal(fresh.kfpBleed,0);assert.equal(fresh.kfpStunUntil,0);assert.equal(fresh.kfpSlowUntil,0);
});

test('초기 꽃돼지 저장의 기술·패시브·남은 선택지를 보존하고 새 선택지는 KFP로 제공한다',()=>{
 let s=game();delete s.hunt.kfp;s.hunt.level=4;s.hunt.weapons=[{id:'bolt',level:3,evo:false}];s.hunt.passives={paw:2};s.hunt.picks=[[{kind:'weapon',id:'bolt'}]];
 s=deserialize(serialize(s)).state;assert.equal(s.hunt.kfp.legacy,true);dispatch(s,{type:'resume'});assert.ok(dispatch(s,{type:'hunt.pick',index:0}).ok);assert.equal(s.hunt.weapons[0].level,4);assert.equal(s.hunt.passives.paw,2);assert.ok(kfpOptions(s.hunt).every(o=>o.kind.startsWith('kfp')));
 const w=getHuntWorld(s),e=spawnEnemy(s,w,'shade_hand',w.player.x+30,w.player.y);e.hp=e.maxHp=10000;tick(s,100);assert.ok(e.hp<10000);assert.ok(w.kfp.shots.length>0);
 s=deserialize(serialize(s)).state;assert.equal(s.hunt.weapons[0].level,4);assert.equal(s.hunt.kfp.legacy,true);
});
test('진행 중 KFP 재사용 시계는 복원하고 새 출발에서는 시계만 초기화한다',()=>{
 let s=game();Object.assign(s.hunt.kfp,{cool:{shotgun:20000},thorns:{x:9000},pollenAt:18000});s.hunt.elapsedMs=10000;s=deserialize(serialize(s)).state;assert.equal(s.hunt.kfp.cool.shotgun,20000);assert.equal(s.hunt.kfp.pollenAt,18000);dispatch(s,{type:'resume'});dispatch(s,{type:'hunt.retreat'});assert.ok(dispatch(s,{type:'hunt.finish'}).ok);s.day++;
 assert.ok(dispatch(s,{type:'hunt.start',hunterId:'yeoni_pig'}).ok);assert.deepEqual(s.hunt.kfp.cool,{});assert.deepEqual(s.hunt.kfp.thorns,{});assert.equal(s.hunt.kfp.pollenAt,0);assert.equal(s.hunt.kfp.weapons[0].id,'shotgun');
});
