import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyVisualSize,sajuPhase} from '../src/render/hunt-visuals.js';
import {ENEMIES,WEAPONS} from '../src/data/hunt-kit.js';
test('소형 적 시인성은 화면 배율에 맞게 보정하되 원래 전투 데이터와 보스 크기는 보존한다',()=>{
 const before=JSON.stringify(ENEMIES);for(const scale of [.5,.75,.93,1.4,2]){const size=enemyVisualSize(ENEMIES.shade_bat,scale);assert.ok(size>=34*1.25&&size<=34*1.8);assert.equal(enemyVisualSize(ENEMIES.boss_hand,scale),ENEMIES.boss_hand.size);}
 assert.equal(JSON.stringify(ENEMIES),before);assert.equal(ENEMIES.shade_bat.r,11);assert.equal(WEAPONS.bolt.base.cooldown,850);
});
test('성광 준비·절정·소멸은 실제 swing 시간에서 파생하고 감소 동작은 입자를 없앤다',()=>{
 const s={at:100,hitAt:190,until:460,radius:96,halfArc:1.4},before=JSON.stringify(s);
 assert.equal(sajuPhase(s,99),null);assert.equal(sajuPhase(s,100).windup,true);assert.equal(sajuPhase(s,190).windup,false);assert.equal(sajuPhase(s,190).alpha,1);assert.ok(sajuPhase(s,450).alpha<.2);assert.equal(sajuPhase(s,460),null);
 for(let t=100;t<460;t+=15){const p=sajuPhase(s,t,true);assert.equal(p.particles,0);assert.equal(p.sweep,.5);assert.ok(p.alpha>=0&&p.alpha<=1);assert.deepEqual(sajuPhase(s,t),sajuPhase(structuredClone(s),t));}assert.equal(JSON.stringify(s),before);
});
