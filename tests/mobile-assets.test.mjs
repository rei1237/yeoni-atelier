import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSETS,mobileAssetTier,responsiveAssetPath} from '../src/render/assets.js';
import {MOBILE_PATHS} from '../src/render/mobile-paths.js';
import {readFileSync,existsSync} from 'node:fs';

test('작은 터치 화면만 모바일 에셋을 사용하고 회전에도 등급을 유지한다',()=>{
 const host=(width,height,coarse)=>({screen:{width,height},matchMedia:()=>({matches:coarse})});
 assert.equal(mobileAssetTier(host(384,832,true)),true);
 assert.equal(mobileAssetTier(host(832,384,true)),true);
 assert.equal(mobileAssetTier(host(1024,768,true)),false);
 assert.equal(mobileAssetTier(host(384,832,false)),false);
});
test('모바일 경량본은 등록된 경로에서만 선택하고 파일이 모두 존재한다',()=>{
 const mobile={screen:{width:390,height:844},matchMedia:()=>({matches:true})};
 const desktop={screen:{width:1440,height:900},matchMedia:()=>({matches:false})};
 const manifest=JSON.parse(readFileSync(new URL('../assets/mobile-manifest.json',import.meta.url),'utf8'));
 assert.equal(MOBILE_PATHS.size,manifest.length);
 for(const item of manifest){assert.ok(MOBILE_PATHS.has(item.path));assert.ok(item.mobile<item.original*.85);assert.ok(item.psnr>=35.5);const selected=responsiveAssetPath(item.path,mobile);assert.ok(existsSync(new URL('../'+selected,import.meta.url)),selected);assert.equal(responsiveAssetPath(item.path,desktop),item.path);}
 assert.equal(responsiveAssetPath('assets/no-such-image.webp',mobile),'assets/no-such-image.webp');
});
test('꽃돼지 대화 시트는 정의된 네 프레임의 경계를 유지한다',()=>{
 const d=ASSETS.talking.yeoni_pig;
 const manifest=JSON.parse(readFileSync(new URL('../assets/mobile-manifest.json',import.meta.url),'utf8'));
 const mobile=manifest.find(x=>x.path===d.path);
 assert.deepEqual([d.columns,d.frame.w,d.frame.h],[4,320,384]);
 assert.deepEqual(mobile.size,[d.dimensions[0]*.75,d.dimensions[1]*.75]);
 assert.equal(mobile.size[0]/d.columns,d.frame.w*.75);
});
