import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS, loadAssetImages } from '../src/render/assets.js';
import { drawActor, drawPortrait } from '../src/render/sprite-renderer.js';

test('고해상도 시트는 방향·동작 셀을 읽고 작은 화면 크기로 축소한다', async () => {
  const originalFetch=globalThis.fetch,originalImage=globalThis.Image;
  try {
    const requests=[];
    globalThis.fetch=async()=>({ok:true,json:async()=>({ready:['actors/neo','portraits/neo','actors/neo@vest_night','portraits/neo@vest_night']})});
    globalThis.Image=class {
      set src(path){requests.push(path);this.width=path.includes('portraits')?768:384;this.height=path.includes('portraits')?768:1152;queueMicrotask(()=>this.onload());}
    };
    await loadAssetImages();
    assert.equal(requests.length,2,'기본 의상 별칭은 이미지 요청과 디코딩을 공유한다');
    const calls=[],ctx={imageSmoothingEnabled:false,filter:'none',drawImage(...a){calls.push(a);},clearRect(){}};
    drawActor(ctx,'neo',{x:50,y:70,size:32,state:'walk',facing:'right',t:200});
    assert.deepEqual(calls[0].slice(1,5),[192,672,96,96]);
    assert.deepEqual(calls[0].slice(5),[34,40,32,32]);
    assert.equal(ctx.imageSmoothingQuality,'high');
    drawPortrait(ctx,'neo','serious',96,96,{frame:2});
    assert.deepEqual(calls[1].slice(1),[384,384,192,192,0,0,96,96]);
    for(const def of [...Object.values(ASSETS.actors),...Object.values(ASSETS.enemies)]) {
      for(const [state,animation] of Object.entries(def.states)) {
        if(!animation)continue;
        assert.ok(def.stateRows[state]<def.directionRows);
        assert.ok(animation.frames<=def.columns);
      }
    }
  } finally {globalThis.fetch=originalFetch;globalThis.Image=originalImage;}
});
