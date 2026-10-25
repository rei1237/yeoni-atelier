import test from 'node:test';
import assert from 'node:assert/strict';
import {panelHtml} from '../src/ui/hud.js';
import {quietShift,seat} from './helpers.mjs';
import {dispatch,tick} from '../src/game/engine.js';
import {createGame} from '../src/game/state.js';
import {MENUS} from '../src/data/menus.js';
import {huntCheck} from '../src/game/hunt.js';
import {depthScale,maxHuntDepth} from '../src/game/hunt-growth.js';
const ui={selectedSlot:null,dev:false};
test('주문 현황은 빈 칸 대신 고민·메뉴명·조리·운반 상태를 나타낸다',()=>{
 const s=quietShift();const {vid}=seat(s,{kind:'regular'});const v=s.visits[vid],c=s.customers[v.customerId];
 c.state='thinking';v.orderIds=[];let html=panelHtml(s,ui);assert.ok(html.includes('메뉴 고르는 중'));assert.ok(!html.includes('빈 칸'));
 s.stations.drink.current={menuId:'starlight_tea',progressMs:0,durationMs:1000};
 assert.ok(panelHtml(s,ui).includes('메뉴 고르는 중'));s.stations.drink.current=null;
 for(let i=0;i<100&&!v.orderIds.length;i++)tick(s,100);
 const o=s.orders[v.orderIds[0]];assert.ok(o);html=panelHtml(s,ui);assert.ok(html.includes(MENUS[o.menuId].name));assert.ok(html.includes('눌러서 만들기'));
 assert.ok(dispatch(s,{type:'order.quick',orderId:o.id}).ok);assert.ok(panelHtml(s,ui).includes('조리 중'));
 s.stations[MENUS[o.menuId].station].current=null;o.status='assigned';assert.ok(panelHtml(s,ui).includes('직원이 가져가는 중'));
 o.status='served';c.state='eating';html=panelHtml(s,ui);assert.ok(html.includes(MENUS[o.menuId].name));assert.ok(html.includes('맛있게 먹는 중'));
 c.state='checkout';assert.ok(panelHtml(s,ui).includes('연이에게 결제 중'));
});
test('히든 사냥꾼은 영입 전 금지, 영입 후 같은 조건에서 영냥이보다 강하다',()=>{
 const a=createGame(),b=createGame();for(const s of [a,b])s.huntUnlocked=true;
 assert.equal(huntCheck(a,'seohanbi').ok,false);b.roster.seohanbi={usableFrom:1};b.people.seohanbi={activity:'idle'};
 assert.ok(dispatch(a,{type:'hunt.start',depth:1,hunterId:'neo'}).ok);
 assert.ok(dispatch(b,{type:'hunt.start',depth:1,hunterId:'seohanbi'}).ok);
 assert.ok(b.hunt.maxHp>a.hunt.maxHp);assert.ok(b.hunt.gear.dmg>a.hunt.gear.dmg);
 assert.equal(b.hunt.durationMs,null);
});
test('단계 해금은 100에서 멈추며 최상위 적의 체력·공격·보상 모두 초입보다 크다',()=>{
 const s=createGame();s.hunter.maxStage=10000;assert.equal(maxHuntDepth(s),100);
 const a=depthScale(1,{hp:1,dmg:1},0),b=depthScale(100,{hp:1,dmg:1},0);
 assert.ok(b.hp>a.hp*20);assert.ok(b.dmg>a.dmg*3);assert.ok(b.reward>a.reward*40);
});
