import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {cafeLayout} from '../src/data/layout.js';
import {validateLayout} from '../src/game/space.js';
import {sheetHtml} from '../src/ui/sheets.js';

test('새 카페는 입구 계산대와 유효한 서빙 통로로 시작한다',()=>{
 const s=createGame(),layout=cafeLayout(s);
 assert.equal(layout.id,'entrance-left');
 assert.ok(validateLayout(s.interior.furniture,s.interior.areas,layout).ok);
 assert.ok(dispatch(s,{type:'shift.start'}).ok);
 assert.deepEqual(s.staff.yeoni.home,layout.spots.yeoniHome);
});

test('준비 중 옛 저장은 가구 충돌이 없을 때만 입구 계산대로 옮긴다',()=>{
 const s=createGame();delete s.interior.checkoutLayout;
 const furniture=structuredClone(s.interior.furniture),gold=s.gold;
 let n=deserialize(serialize(s)).state;
 assert.equal(cafeLayout(n).id,'entrance-left');assert.deepEqual(n.interior.furniture,furniture);assert.equal(n.gold,gold);
 s.interior.furniture.push({uid:'entrance-plant',defId:'plant',x:2,y:14,rot:0});
 n=deserialize(serialize(s)).state;
 assert.equal(cafeLayout(n).id,'legacy');assert.deepEqual(n.interior.furniture,s.interior.furniture);
});

test('카페 및 보행 지도에서 상점 상세를 열어도 구형 지도가 재등장하지 않는다',()=>{
 const s=createGame(),before=serialize(s);
 for(const screen of [null,'world'])for(const tab of ['expand','moka','luna','finance','gear']){
  const html=sheetHtml(s,{screen,sheet:{kind:'town',tab}});
  assert.doesNotMatch(html,/class="town-map|class="tn |마을 지도/);
  assert.match(html,/sheet.close/);
  if(tab==='expand')assert.match(html,/5월부터/);
 }
 assert.equal(serialize(s),before);
 s.day=7;
 const html=sheetHtml(s,{sheet:{kind:'town',tab:'expand'}});
 assert.match(html,/expand.area/);assert.match(html,/expand.decor/);
});
