import test from 'node:test';
import assert from 'node:assert/strict';
import {staffMotion} from '../src/render/staff-motion.js';
import {ASSETS} from '../src/render/assets.js';
import {cookingSockets} from '../src/render/cooking-pose.js';
test('홀 모션은 실제 작업에만 연결되고 정면 대기와 의상을 보존한다',()=>{
 for(const id of ['luna','neo']){
  assert.equal(staffMotion(id,{state:'idle',facing:'down'}),null);
  assert.equal(staffMotion(id,{carry:{menuId:'americano'},outfitId:'custom'}),null);
  const o={state:'walk',carry:{menuId:'americano'},t:320};const before=JSON.stringify(o);
  assert.deepEqual(staffMotion(id,o),{key:id+'_tray_walk',frame:2});assert.equal(JSON.stringify(o),before);
  assert.equal(staffMotion(id,{...o,reducedMotion:true}).frame,0);
  for(const [progress,frame] of [[0,0],[.3,1],[.6,2],[.9,3],[1,3]]){
   assert.deepEqual(staffMotion(id,{servicePose:{kind:'serve',progress}}),{key:id+'_place_plate',frame});
   assert.deepEqual(staffMotion(id,{cleaning:true,servicePose:{kind:'clean',progress}}),{key:id+'_wipe',frame});
  }
 }
 assert.equal(staffMotion('yeoni',{cleaning:true}),null);
});
test('새 직원 시트는 네 방향과 포함 소품을 명시하고 조리 소켓은 셀 내부에 있다',()=>{
 for(const id of ['luna','neo'])for(const k of ['tray_walk','place_plate','wipe']){
  const d=ASSETS.actors[id+'_'+k];assert.deepEqual(d.directions,['down','left','right','up']);assert.equal(d.embeddedWorkProp,true);assert.deepEqual(d.anchor,{x:64,y:122});
 }
 const d=ASSETS.actors.luna_sis_cook;assert.deepEqual(d.dimensions,[512,384]);
 for(const phase of ['prepare','extract','bake','plate'])for(let frame=0;frame<4;frame++)for(const [,s]of cookingSockets(d,{phase,frame}))assert.ok(s.x>0&&s.x<128&&s.y>0&&s.y<128);
 assert.equal(cookingSockets(d,{phase:'plate',frame:0})[0][0],'dish');
});

test('쟁반 보행은 실제 이동량을 따르고 정지·저장복원·줄인 동작에서 프레임이 안정적이다',()=>{
 const o={state:'walk',carry:{menuId:'americano'},walkDistance:.6,t:10};
 assert.equal(staffMotion('neo',o).frame,2);
 assert.equal(staffMotion('neo',{...o,t:90000}).frame,2);
 assert.equal(staffMotion('neo',JSON.parse(JSON.stringify(o))).frame,2);
 assert.equal(staffMotion('neo',{...o,walkDistance:.8}).frame,3);
 assert.equal(staffMotion('neo',{...o,state:'idle'}).frame,0);
 assert.equal(staffMotion('neo',{...o,reducedMotion:true}).frame,0);
});

test('접시를 내려놓는 동안 막 전한 메뉴가 그 프레임의 접시 위에 있고 끝에는 손을 비운다',async()=>{
 const {loadAssetImages}=await import('../src/render/assets.js'),{drawActor}=await import('../src/render/sprite-renderer.js');
 const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>({ready:['actors/neo','actors/neo_place_plate','icons/americano']})});
  globalThis.Image=class{set src(p){this.src_=p;this.width=this.height=512;queueMicrotask(()=>this.onload());}get src(){return this.src_;}};
  await loadAssetImages('assets/manifest.json',{keys:['actors/neo','actors/neo_place_plate','icons/americano']});
  const food=progress=>{const calls=[];drawActor({drawImage(img,...a){if(img.src?.includes('americano'))calls.push(a);},getTransform:()=>({a:1})},'neo',{x:200,y:300,size:128,facing:'left',state:'serve',t:0,servicePose:{kind:'serve',menuId:'americano',progress}});return calls;};
  const [x,y]=ASSETS.actors.neo_place_plate.trayFrames.left[1];
  assert.deepEqual(food(.3)[0].slice(0,3),[200+x-64-8,300+y-122-16*.88,16]);
  assert.equal(food(.8).length,0);
 }finally{globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
});
