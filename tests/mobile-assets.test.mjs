import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileAssetTier} from '../src/render/assets.js';

test('작은 터치 화면만 모바일 에셋을 사용하고 회전에도 등급을 유지한다',()=>{
 const host=(width,height,coarse)=>({screen:{width,height},matchMedia:()=>({matches:coarse})});
 assert.equal(mobileAssetTier(host(384,832,true)),true);
 assert.equal(mobileAssetTier(host(832,384,true)),true);
 assert.equal(mobileAssetTier(host(1024,768,true)),false);
 assert.equal(mobileAssetTier(host(384,832,false)),false);
});
