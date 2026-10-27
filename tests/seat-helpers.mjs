import assert from 'node:assert/strict';
import {dispatch} from '../src/game/engine.js';
import {buildGrid,validateLayout} from '../src/game/space.js';
import {GRID} from '../src/data/layout.js';
export function placePurchasedSeat(s,tableNo){
 assert.ok(dispatch(s,{type:'expand.decor',defId:'chair'}).ok);const chair=s.interior.furniture.at(-1),table=s.interior.furniture.find(f=>f.tableNo===tableNo);assert.equal(table.x,null);const grid=buildGrid(s.interior.furniture,s.interior.areas);let spot;
 for(let y=2;y<GRID.rows-1&&!spot;y++)for(let x=0;x<GRID.cols&&!spot;x++){if(!grid.walkable(x,y)||!grid.walkable(x,y+1))continue;const list=s.interior.furniture.map(f=>f.uid===table.uid?{...f,x,y}:f.uid===chair.uid?{...f,x,y:y+1}:f);if(validateLayout(list,s.interior.areas).ok)spot={x,y};}
 assert.ok(spot,'의자와 테이블의 실제 접근 가능한 자리');assert.ok(dispatch(s,{type:'interior.begin'}).ok);assert.ok(dispatch(s,{type:'interior.place',uid:table.uid,...spot}).ok);assert.ok(dispatch(s,{type:'interior.place',uid:chair.uid,x:spot.x,y:spot.y+1}).ok);assert.ok(dispatch(s,{type:'interior.apply'}).ok);
}
