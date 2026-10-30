import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';import {dispatch} from '../src/game/engine.js';import {serialize,deserialize} from '../src/core/save.js';import {MENUS,menuUnlocked,ingredientCostOf} from '../src/data/menus.js';import {findRecipe} from '../src/game/recipe.js';import {sheetHtml} from '../src/ui/sheets.js';import {quietShift,seat} from './helpers.mjs';import {placeOrder} from '../src/game/cafe.js';
const menus=['luna_crescent_latte','luna_berry_mille','luna_pumpkin_quiche'];
test('루나 언니 인연 메뉴는 랭크에서만 해금되고 저장 복원과 주방 안내에 반영된다',()=>{
 let s=createGame();for(const [i,id] of menus.entries()){const m=MENUS[id];s.bondRank.luna_sis=m.lunaRank-1;assert.equal(menuUnlocked(s,id),false);assert.match(sheetHtml(s,{sheet:{kind:'kitchen'}}),new RegExp(`Rank ${m.lunaRank}에서 해금`));s.bondRank.luna_sis=m.lunaRank;assert.equal(menuUnlocked(s,id),true);assert.match(sheetHtml(s,{sheet:{kind:'kitchen'}}),new RegExp(m.name));assert.equal(s.learned[id],undefined);s=deserialize(serialize(s)).state;assert.equal(menuUnlocked(s,id),true);}
});
test('잠긴 상위 메뉴는 조합으로 배우거나 조리할 수 없고 해금 후 주문·조리할 수 있다',()=>{
 const s=quietShift(),g=seat(s,{kind:'regular'});const id=menus[0],m=MENUS[id];assert.equal(findRecipe(['bean','bean','milk']),null);assert.equal(dispatch(s,{type:'cook',menuId:id}).ok,false);s.bondRank.luna_sis=3;const o=placeOrder(s,s.visits[g.vid],id);assert.equal(o.price,m.price);assert.ok(dispatch(s,{type:'order.quick',orderId:o.id}).ok);
});
test('상위 메뉴는 재료 원가 대비 일반 메뉴보다 높은 판매 이익률을 가진다',()=>{
 const margin=id=>(MENUS[id].price-ingredientCostOf(id))/MENUS[id].price;
 assert.ok(margin(menus[0])>margin('fortune_latte'));assert.ok(margin(menus[1])>margin('lotus_berry_tart'));assert.ok(margin(menus[2])>margin('golden_pumpkin_soup'));
});
