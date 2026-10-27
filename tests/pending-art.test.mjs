import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cookingPose,staffCookingPose,cookingSockets} from '../src/render/cooking-pose.js';
import {remodelArt} from '../src/render/remodel-art.js';
import {REMODELS} from '../src/game/grounds.js';
import {ASSETS} from '../src/render/assets.js';
import {dispatch,tick} from '../src/game/engine.js';
import {quietShift} from './helpers.mjs';
import {AREAS} from '../src/data/layout.js';
import {runningJobs} from '../src/game/station-slots.js';
import {serialize,deserialize} from '../src/core/save.js';

test('외관 원본이 없으면 기존 건물과 장식, 준비되면 테마별 건물만 고른다',()=>{
 for(const theme of Object.values(REMODELS)){
  assert.deepEqual(remodelArt(theme,()=>false),{key:'ui/town-node-atelier',decor:theme.decor,ready:false});
  assert.deepEqual(remodelArt(theme,id=>id===theme.exterior),{key:theme.exterior,decor:null,ready:true});
 }
 for(const key of ['original','blossom','salon']){const def=ASSETS.buildings['cafe_'+key];assert.deepEqual(def.dimensions,[256,256]);const bytes=readFileSync(new URL('../'+def.path,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');}
 const ready=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url))).ready;
 for(const key of ['actors/luna_sis_cook','service/cook_bowl','service/cook_pitcher'])assert.ok(ready.includes(key),'실제 전달 원본을 정규화한 에셋을 로드한다');
});

test('조리 프레임은 실제 진행·경계·저장값에서 결정되고 감소 동작은 정지한다',()=>{
 const job={id:'one',menuId:'americano',durationMs:10000,progressMs:0};
 for(const [time,station,phase] of [[0,'drink','prepare'],[2199,'drink','prepare'],[2200,'drink','extract'],[8199,'oven','bake'],[8200,'oven','plate']]){
  const j={...job,progressMs:time},before=JSON.stringify(j),a=cookingPose(j,station);assert.equal(a.phase,phase);assert.ok(a.frame>=0&&a.frame<4);assert.equal(cookingPose(j,station,true).frame,0);assert.deepEqual(cookingPose(JSON.parse(before),station),a);assert.equal(JSON.stringify(j),before);
 }
 assert.equal(cookingPose({...job,progressMs:10000},'drink'),null);
 const long={...job,durationMs:1e13,progressMs:123456789012};assert.deepEqual(cookingPose(long,'drink'),cookingPose(structuredClone(long),'drink'));
});

test('실측하지 않은 손 소켓은 그리지 않고 검증한 소품·재료만 앞뒤 레이어로 전달한다',()=>{
 const pose={phase:'prepare',frame:2};assert.deepEqual(cookingSockets(ASSETS.actors.luna_sis_cook,pose),[]);
 const definition={cookSockets:{verified:true,prepare:[{},{},{bowl:{x:64,y:84,width:30,layer:'back'},ingredient:{x:68,y:72,width:14,layer:'front'},bad:{x:NaN,y:3,width:20,layer:'back'}}]}};
 assert.deepEqual(cookingSockets(definition,pose).map(([id])=>id),['bowl','ingredient']);assert.deepEqual(cookingSockets(definition,{phase:'extract',frame:0}),[]);
});

test('확장 설비 세 번째 이후 작업도 직원이 맡으며 취소·완료 후 대기로 돌아간다',()=>{
 let s=quietShift({beforeStart:s=>{s.interior.areas=AREAS.map(a=>a.id);s.stock.bean=30;}});const ids=[];
 for(let n=0;n<6;n++){const r=dispatch(s,{type:'cook',menuId:'americano'});assert.ok(r.ok,r.reason);ids.push(r.jobId);}
 dispatch(s,{type:'cook.cancel',jobId:ids[0]});dispatch(s,{type:'cook.cancel',jobId:ids[1]});tick(s,2000);
 assert.equal(s.staff.luna_sis.action,'cook');assert.equal(s.staff.luna_sis.job.sid,'drink');const before=staffCookingPose(s,s.staff.luna_sis);assert.ok(before);assert.ok(ids.slice(2).includes(before.jobId));
 s=deserialize(serialize(s)).state;assert.deepEqual(staffCookingPose(s,s.staff.luna_sis),before);dispatch(s,{type:'resume'});
 for(const j of runningJobs(s.stations.drink))dispatch(s,{type:'cook.cancel',jobId:j.id});tick(s,4000);assert.equal(s.staff.luna_sis.action,'idle');assert.equal(staffCookingPose(s,s.staff.luna_sis),null);
 assert.ok(dispatch(s,{type:'cook',menuId:'americano'}).ok);tick(s,14000);assert.equal(s.staff.luna_sis.action,'idle');assert.equal(staffCookingPose(s,s.staff.luna_sis),null);
});
