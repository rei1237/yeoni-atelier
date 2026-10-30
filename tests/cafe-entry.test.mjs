import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {cafeLayout} from '../src/data/layout.js';
import {validateLayout} from '../src/game/space.js';
import {sheetHtml} from '../src/ui/sheets.js';
import {prepSpots} from '../src/render/cafe-view.js';

test('새 카페는 입구 계산대와 유효한 서빙 통로로 시작한다',()=>{
 const s=createGame(),layout=cafeLayout(s);
 assert.equal(layout.id,'entrance-left');
 assert.ok(validateLayout(s.interior.furniture,s.interior.areas,layout).ok);
 assert.ok(dispatch(s,{type:'shift.start'}).ok);
 assert.deepEqual(s.staff.yeoni.home,layout.spots.yeoniHome);
});

test('준비 중 저장은 다시 불러와도 계산대 배치와 가구를 보존한다',()=>{
 for(const layout of [undefined,'legacy','entrance','entrance-left']){
  const s=createGame();if(layout===undefined)delete s.interior.checkoutLayout;else s.interior.checkoutLayout=layout;
  const furniture=structuredClone(s.interior.furniture),gold=s.gold,expected=cafeLayout(s).id;
  const n=deserialize(serialize(s)).state;
  assert.equal(cafeLayout(n).id,expected);assert.deepEqual(n.interior.furniture,furniture);assert.equal(n.gold,gold);
  assert.deepEqual(cafeLayout(n).spots.yeoniHome,cafeLayout(s).spots.yeoniHome);
  const home=cafeLayout(n).spots.yeoniHome;assert.deepEqual(prepSpots(n).yeoni,{x:home.x+.5,y:home.y+.5});
 }
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
 s.day=9;
 const html=sheetHtml(s,{sheet:{kind:'town',tab:'expand'}});
 assert.match(html,/expand.area/);assert.match(html,/expand.decor/);
});
