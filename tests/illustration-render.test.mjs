import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS, loadAssetImages } from '../src/render/assets.js';
import { drawActor, drawPortrait, cafeIdlePose } from '../src/render/sprite-renderer.js';

test('고해상도 시트는 방향·동작 셀을 읽고 작은 화면 크기로 축소한다', async () => {
  const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
  try {
    const requests=[];
    globalThis.fetch=async()=>({ok:true,json:async()=>({ready:['actors/neo','portraits/neo','actors/neo@vest_night','portraits/neo@vest_night']})});
    globalThis.Image=class {
      set src(path){requests.push(path);this.width=path.includes('portraits')?384:512;this.height=path.includes('portraits')?576:512;queueMicrotask(()=>this.onload());}
    };
    await loadAssetImages();
    assert.equal(requests.length,3,'서로 다른 의상은 각각 로드하고 동일 초상화 별칭은 디코딩을 공유한다');
    const calls=[],ctx={imageSmoothingEnabled:false,filter:'none',drawImage(...a){calls.push(a);},clearRect(){}};
    drawActor(ctx,'neo',{x:50,y:70,size:32,state:'walk',facing:'right',t:200});
    assert.deepEqual(calls[0].slice(1,5),[128,256,128,128]);
    assert.deepEqual(calls[0].slice(5),[34,40,32,32]);
    assert.equal(ctx.imageSmoothingQuality,'high');
    drawPortrait(ctx,'neo','serious',96,96,{frame:2});
    assert.deepEqual(calls[1].slice(1,5),[0,0,384,403.20000000000005]);
    assert.ok(calls[1][5]>=0 && calls[1][7]<=96 && calls[1][8]<=96);
    drawPortrait(ctx,'neo','serious',96,96,{frame:0});
    assert.deepEqual(calls[1],calls[2],'대화 중 초상화는 프레임에 따라 흔들리지 않는다');
    for(const def of [...Object.values(ASSETS.actors),...Object.values(ASSETS.enemies)]) {
      for(const [state,animation] of Object.entries(def.states)) {
        if(!animation)continue;
        assert.ok(def.stateRows[state]<def.directionRows);
        assert.ok(animation.frames<=def.columns);
      }
    }
  } finally {globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
});

test('카페 대기 동작은 인물마다 다르고 보행·축소 모션·대화 초상화에는 적용하지 않는다',()=>{
 const opts={x:120,y:80,t:1000,state:'idle',idleMotion:true};
 const a=cafeIdlePose('neo',opts),b=cafeIdlePose('luna',opts),later=cafeIdlePose('neo',{...opts,t:1900});
 assert.notDeepEqual(a,b);assert.notDeepEqual(a,later);
 assert.ok(Math.abs(a.scaleY-1)<=.022 && Math.abs(a.angle)<=.014);
 assert.equal(cafeIdlePose('neo',{...opts,state:'walk'}),null);
 assert.equal(cafeIdlePose('neo',{...opts,reducedMotion:true}),null);
 assert.equal(cafeIdlePose('neo',{...opts,idleMotion:false}),null);
 assert.equal(cafeIdlePose('neo',{state:'idle',t:1000}),null);
});
