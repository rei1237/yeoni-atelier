import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {hunterUnlocked,pendingBloomStory,selectedHunter} from '../src/game/hunt-cast.js';
import {huntPrepSheet} from '../src/ui/hunt-prep.js';
import {getHuntWorld} from '../src/game/hunt.js';
import {createPetalCharge,chargePetal,spendPetal} from '../src/game/kfp-petal-charge.js';
function ready(){const s=createGame();s.huntUnlocked=true;s.ledger.story.m0=true;return s;}
function completed(){const s=ready();s.ledger.rewards['stage:neo:100']=true;for(const n of [30,40,50,70,100])s.ledger.story['hanbi:'+n]=true;return s;}
test('새 게임 잠긴 두 동료는 실루엣만 보이고 UI 이전 선택·엔진 모두 출전을 막는다',()=>{
 const s=ready(),html=huntPrepSheet(s,{huntMenu:'depart',hunterId:'yeoni_pig'});
 assert.equal((html.match(/hunter-locked/g)||[]).length,2);
 assert.doesNotMatch(html,/>서한비|>꽃돼지 연이|title="서한비|title="꽃돼지/);
 for(const id of ['seohanbi','yeoni_pig']){assert.equal(selectedHunter(s,id),'neo');assert.equal(dispatch(s,{type:'hunt.start',hunterId:id}).ok,false);}
 s.roster.seohanbi={usableFrom:1};s.people.seohanbi={activity:'idle'};assert.ok(hunterUnlocked(s,'seohanbi'));
});
test('첫 스테이지는 해금하지 않고 정규 최종 클리어 뒤 이야기 완료가 정확히 한 번 해금한다',()=>{
 let s=ready();s.ledger.rewards['stage:neo:1']=true;assert.equal(pendingBloomStory(s),null);assert.equal(dispatch(s,{type:'story.seen',id:'ev:bloom'}).ok,false);
 s=completed();assert.equal(pendingBloomStory(s),'ev:bloom');assert.equal(hunterUnlocked(s,'yeoni_pig'),false);
 s=deserialize(serialize(s)).state;assert.equal(pendingBloomStory(s),'ev:bloom');assert.ok(dispatch(s,{type:'story.seen',id:'ev:bloom'}).ok);assert.ok(hunterUnlocked(s,'yeoni_pig'));assert.ok(dispatch(s,{type:'story.seen',id:'ev:bloom'}).duplicate);
 s=deserialize(serialize(s)).state;assert.ok(hunterUnlocked(s,'yeoni_pig'));assert.equal(pendingBloomStory(s),null);
});
test('원본 꽃잎 충전은 같은 처치·자체 포격 처치로 중복 충전하지 않는다',()=>{
 const c=createPetalCharge();assert.ok(chargePetal(c,{killCount:1}));assert.equal(c.charge,5);assert.equal(chargePetal(c,{killCount:1}),false);assert.equal(chargePetal(c,{killCount:2,cannonKill:true}),false);assert.equal(c.charge,5);
 for(let n=3;n<30;n++)chargePetal(c,{killCount:n});assert.equal(c.charge,100);assert.ok(spendPetal(c));assert.equal(spendPetal(c),false);assert.equal(c.charge,0);
});
test('꽃돼지의 산탄·꽃잎포는 실제 적을 공격하며 저장 복원·연타·귀환으로 충전과 보상을 복제하지 않는다',()=>{
 let s=completed();dispatch(s,{type:'story.seen',id:'ev:bloom'});assert.ok(dispatch(s,{type:'hunt.start',hunterId:'yeoni_pig'}).ok);assert.equal(s.people.yeoni.form,'pig');
 let w=getHuntWorld(s);const e=w.enemies.spawn();Object.assign(e,{uid:999,type:'shade_hand',x:w.player.x+200,y:w.player.y,hp:99999,maxHp:99999,speed:0,kx:0,ky:0});tick(s,50);assert.ok(w.kfp.shots.filter(x=>x.id==='shotgun').length>=5);
 s.hunt.petal.charge=100;s=deserialize(serialize(s)).state;dispatch(s,{type:'resume'});assert.equal(s.hunt.petal.charge,100);w=getHuntWorld(s);const target=w.enemies.spawn();Object.assign(target,{uid:1000,type:'shade_hand',x:w.player.x+50,y:w.player.y,hp:10,maxHp:10,speed:0,kx:0,ky:0});
 assert.ok(dispatch(s,{type:'hunt.petal'}).ok);assert.equal(w.enemies.count,0);assert.equal(s.hunt.petal.charge,0);assert.equal(dispatch(s,{type:'hunt.petal'}).ok,false);
 dispatch(s,{type:'hunt.retreat'});assert.ok(dispatch(s,{type:'hunt.finish'}).ok);assert.equal(s.people.yeoni.form,'human');assert.equal(s.people.yeoni.activity,'idle');assert.equal(dispatch(s,{type:'hunt.start',hunterId:'yeoni_pig'}).ok,false);
});
