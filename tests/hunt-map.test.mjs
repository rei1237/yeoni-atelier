import test from 'node:test';
import assert from 'node:assert/strict';
import {huntMapPoints} from '../src/ui/hunt-map.js';

test('주변 지도는 실제 활성 적과 아이템, 보물상자만 플레이어 상대 위치로 표시한다',()=>{
 const world={player:{x:5000,y:-2000},enemies:{count:2,items:[{type:'boss_hand',x:5100,y:-2000},{type:'shade_hand',x:4900,y:-2200},{type:'shade_hand',x:5000,y:-2000}]},drops:{count:1,items:[{x:5100,y:-1900},{x:5000,y:-2000}]},props:[{treasure:true,x:5100,y:-2000},{treasure:true,x:9000,y:9000},{treasure:false,x:5000,y:-2000}]};
 const pts=huntMapPoints(world,1000);assert.deepEqual(pts.map(x=>x.kind),['item','chest','boss','enemy','player']);assert.equal(pts.find(x=>x.kind==='boss').x,.1);assert.equal(pts.find(x=>x.kind==='enemy').y,-.2);assert.equal(pts.at(-1).x,0);
});
