import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../world-island.css',import.meta.url),'utf8');
test('로딩 화면에서 연이와 꽃돼지가 함께 인사하고 고밀도 시트를 사용한다',()=>{
 assert.match(html,/class="boot-yeoni"/);assert.doesNotMatch(html.match(/<h1>(.*?)<\/h1>/)[1],/걷/);
 assert.doesNotMatch(css,/boot-walking|boot-yeoni-walk/);
 assert.match(html,/class="boot-pig"/);assert.match(html,/연이와 꽃돼지/);
 assert.match(css,/yeoni_pig\.webp/);assert.match(css,/yeoni_pig_hd\.webp/);
 assert.match(css,/@keyframes boot-welcome/);assert.match(css,/@keyframes boot-pig-hop/);
 assert.match(css,/image-set\(url\('assets\/illustrated\/actors\/yeoni_idle\.webp'\) 1x,url\('assets\/illustrated\/actors\/yeoni_idle_hd\.webp'\) 2x\)/);
});
test('적 이미지는 시작을 막지 않고 사냥 출발 시 준비한다',async()=>{
 const {BOOT_ASSETS}=await import('../src/render/assets.js');
 assert.ok(!BOOT_ASSETS.some(id=>id.startsWith('enemies/')));
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(app,/'hunt\.depart':[\s\S]*?loadAssetImages\(undefined,\{keys\}\)/);
});
test('동작 줄이기에서는 로딩 화면 애니메이션을 모두 끈다',()=>{
 const reduce=css.match(/@media\(prefers-reduced-motion:reduce\)\{([^@]*?\.boot-yeoni[^@]*?)\}\s*$/m)?.[1]||'';
 assert.match(reduce,/\.boot-yeoni::before,\.boot-yeoni::after,\.boot-yeoni-body\{animation:none/);assert.match(reduce,/\.boot-yeoni i\{display:none\}/);
});

test('동작 줄이기에서는 꽃돼지도 정지한다',()=>{assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.boot-pig,\.boot-pig-body\{animation:none\}/);});
