// 10-29 큰 화면 2배 시트: 128px 셀보다 크게 그릴 때만 _hd.webp 를 받고, 같은 자리에 같은 크기로 그린다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS, loadAssetImages } from '../src/render/assets.js';
import { drawActor } from '../src/render/sprite-renderer.js';

test('크게 그릴 때만 2배 시트를 받아 원본 셀 좌표를 두 배로 읽는다', async () => {
  const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
  try {
    const requests=[],path=ASSETS.actors.neo.path;
    globalThis.fetch=async()=>({ok:true,json:async()=>({ready:['actors/neo'],hd:[path]})});
    globalThis.Image=class {
      set src(p){requests.push(p);this.src_=p;this.width=this.height=p.endsWith('_hd.webp')?1024:512;queueMicrotask(()=>this.onload());}
      get src(){return this.src_;}
    };
    await loadAssetImages('assets/manifest.json',{keys:['actors/neo']});
    const calls=[],ctx={imageSmoothingEnabled:false,filter:'none',drawImage(...a){calls.push(a);},getTransform:()=>({a:1})};
    const o={x:200,y:300,state:'walk',facing:'right',t:200};
    drawActor(ctx,'neo',{...o,size:96});
    assert.ok(!requests.some(p=>p.endsWith('_hd.webp')),'셀보다 작게 그리면 받지 않는다');
    drawActor(ctx,'neo',{...o,size:256});
    assert.deepEqual(calls[1].slice(1,5),[128,256,128,128],'받기 전에는 기본 시트');
    await new Promise(r=>setTimeout(r));
    drawActor(ctx,'neo',{...o,size:256});
    assert.equal(requests.filter(p=>p.endsWith('_hd.webp')).length,1);
    assert.deepEqual(calls[2].slice(1,5),[256,512,256,256]);
    assert.deepEqual(calls[2].slice(5),calls[1].slice(5),'화면 위치·크기는 그대로');
  } finally {globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
});
