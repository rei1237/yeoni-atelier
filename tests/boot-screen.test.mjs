import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../world-island.css',import.meta.url),'utf8');
test('로딩 화면은 걷기 없이 정면 대기 시트 한 장으로 움직인다',()=>{
 const boot=html.match(/<div id="boot-screen"[\s\S]*?<\/div><h1>(.*?)<\/h1>/);assert.ok(boot);assert.match(boot[0],/class="boot-yeoni"/);assert.doesNotMatch(boot[1],/걷/);
 assert.doesNotMatch(css,/boot-walking|boot-yeoni-walk/);
 assert.deepEqual([...new Set(css.match(/\.boot-[^{]*\{[^}]*url\('([^']+)'/g)?.map(m=>m.match(/url\('([^']+)'/)[1]))],['assets/illustrated/actors/yeoni_idle.webp']);
});
test('동작 줄이기에서는 로딩 화면 애니메이션을 모두 끈다',()=>{
 const reduce=css.match(/@media\(prefers-reduced-motion:reduce\)\{([^@]*?\.boot-yeoni[^@]*?)\}\s*$/m)?.[1]||'';
 assert.match(reduce,/\.boot-yeoni::before,\.boot-yeoni::after,\.boot-yeoni-body\{animation:none/);assert.match(reduce,/\.boot-yeoni i\{display:none\}/);
});
