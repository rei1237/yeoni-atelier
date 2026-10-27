import test from 'node:test';
import assert from 'node:assert/strict';
import {computeView,cellToPx,pxToCell} from '../src/render/cafe-view.js';
import {tableBadgesHtml} from '../src/ui/table-ui.js';
test('큰 지점은 읽을 수 있는 기본 크기와 별도 전체 보기를 제공한다',()=>{
 for(const [w,h] of [[390,272],[970,780]]){const v=computeView(w,h,{cols:20,rows:40});assert.ok(v.tile>=28);const q=cellToPx(v,5.5,8.5);assert.ok(q.x>=0&&q.x<w&&q.y>=0&&q.y<h);assert.deepEqual(pxToCell(v,q.x,q.y),{x:5,y:8});assert.ok(computeView(w,h,{cols:20,rows:40,overview:true}).tile<=v.tile);}
});
test('많은 테이블의 안내는 화면 밖과 겹침을 피하고 입장 말풍선을 생략한다',()=>{
 const tables=Array.from({length:50},(_,i)=>({no:i+1,table:{x:i%10,y:Math.floor(i/10)},state:'dirty'})),v={tile:28,ox:0,oy:60,w:390,h:300};
 const html=tableBadgesHtml({mode:'shift',tables,customers:{},visits:{},shift:{elapsedMs:0}},v);assert.ok((html.match(/class="table-badge/g)||[]).length<15);assert.match(html,/data-action="clean"/);
 const entering=tableBadgesHtml({mode:'shift',tables:tables.map(t=>({...t,state:'occupied',customerId:t.no})),customers:Object.fromEntries(tables.map(t=>[t.no,{state:'entering'}])),visits:{}},v);assert.equal(entering,'');
});
