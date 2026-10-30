import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {quietShift,seat} from './helpers.mjs';
import {spawnCustomer,placeOrder,checkout} from '../src/game/cafe.js';
import {MENUS,INGREDIENTS} from '../src/data/menus.js';
import {menuPrice,cafeProgress,wealthWeights,atmosphere} from '../src/game/cafe-growth.js';
import {creditView,chargeLoanInterest,exchangeRate} from '../src/game/finance.js';
import {accruePayroll} from '../src/game/payroll.js';
import {serialize,deserialize} from '../src/core/save.js';
import {upgradeCost} from '../src/game/moka-armory.js';
import {survivalReward} from '../src/game/hunt-rewards.js';
import {TEMP} from '../src/config/balance.temp.js';

test('수동 전환은 이전 전체 자동도 끄고 새 주문을 임의로 조리하지 않는다',()=>{
 const s=quietShift();assert.equal(dispatch(s,{type:'auto.toggle',on:true}).ok,false,'전체 자동은 시뮬 표시 없이 켜지지 않는다');
 assert.equal(dispatch(s,{type:'automation.toggle',ability:'kitchen',on:true}).ok,false,'인연으로 열기 전 주방 자동은 거절');
 assert.equal(s.auto,false);assert.equal(s.automation.kitchen,false);seat(s,{kind:'regular'});tick(s,30000);
 assert.ok(Object.values(s.orders).length);assert.ok(Object.values(s.stations).every(st=>!st.current&&!st.next));assert.ok(s.tray.every(x=>!x));
});
test('포장은 테이블과 서빙 없이 빠른 조리 후 카운터에서 한 번 결제한다',()=>{
 const s=quietShift();const c=spawnCustomer(s,{kind:'takeaway'}),v=s.visits[c.visitId];
 for(let i=0;i<400&&!v.orderIds.length;i++)tick(s,100);
 assert.equal(s.tables.filter(t=>t.state!=='empty').length,0);
 const o=s.orders[v.orderIds[0]],before=s.gold;assert.ok(dispatch(s,{type:'order.quick',orderId:o.id}).ok);
 const job=s.stations[MENUS[o.menuId].station].current;assert.ok(job.durationMs<MENUS[o.menuId].cookMs);
 for(let i=0;i<1000&&!v.paid;i++){for(const id of v.orderIds){const pending=s.orders[id];if(pending.status==='waiting')dispatch(s,{type:'order.quick',orderId:id});}tick(s,100);}
 assert.equal(o.status,'served');assert.ok(v.paid);assert.equal(s.tasks.filter(t=>t.type==='deliver').length,0);assert.equal(s.gold,before+v.bill);assert.equal(checkout(s,v),false);
 const back=deserialize(serialize(s)).state;assert.equal(checkout(back,back.visits[v.id]),false);assert.equal(back.gold,s.gold);
});
test('운명 찻집은 지명 없이 조리 가능하지만 지명 수락 고객에게만 판매한다',()=>{
 const s=quietShift(),m=MENUS.lotus_moon;s.learned[m.id]=true;for(const [id,n]of Object.entries(m.ingredients))s.stock[id]=n*5;
 assert.ok(dispatch(s,{type:'cook',menuId:m.id}).ok);
 const reg=seat(s,{kind:'regular'});assert.equal(placeOrder(s,s.visits[reg.vid],m.id),null);
 const nom=seat(s);assert.equal(placeOrder(s,s.visits[nom.vid],m.id),null);dispatch(s,{type:'nomination.accept',tableNo:nom.tableNo});assert.ok(placeOrder(s,s.visits[nom.vid],m.id));
 for(const id of Object.keys(m.ingredients).filter(id=>INGREDIENTS[id].huntOnly)){assert.ok(!INGREDIENTS[id].shop&&!INGREDIENTS[id].basic);assert.equal(dispatch(s,{type:'shop.buy',ingredientId:id,qty:1}).ok,false);}
});
test('카페 성장과 분위기는 방문 등급과 판매가에 반영되고 초기 빚은 사용자 지정액',()=>{
 const s=createGame();assert.equal(TEMP.INITIAL_DEBT,100_000_000);assert.equal(s.debt,TEMP.INITIAL_DEBT);assert.equal(s.startingDebt,TEMP.INITIAL_DEBT);const w=wealthWeights(s),price=menuPrice(s,MENUS.fortune_latte);
 s.stats.served=1000;assert.ok(cafeProgress(s).level>1);assert.equal(wealthWeights(s).tycoon,0,"레벨만 올려도 대부호는 오지 않는다");assert.ok(menuPrice(s,MENUS.fortune_latte)>price);assert.ok(atmosphere(s)>=0);
});
test('새 빚 1억은 새 게임에만: 기존 저장의 남은 빚·원금은 그대로 이어진다',()=>{
 const old=createGame();old.debt=87_654;old.startingDebt=120000;
 const back=deserialize(serialize(old)).state;assert.equal(back.debt,87_654);assert.equal(back.startingDebt,120000);
 const legacy=JSON.parse(serialize(createGame()));legacy.debt=99_999_999;delete legacy.startingDebt;
 const b2=deserialize(JSON.stringify(legacy)).state;assert.equal(b2.debt,99_999_999);assert.equal(b2.startingDebt,120000);
});
test('월급은 창업 동료 제외, 영입 후 근무 순만 발생하며 월말·저장 복원 중복 지급 방지',()=>{
 let s=createGame();s.gold=100000;s.roster.moka={usableFrom:2};
 const base={sales:10000,baseTips:0,feverTips:0};s.day=1;accruePayroll(s,{...base,id:'s1',day:1});s.day=2;accruePayroll(s,{...base,id:'s2',day:2});s.day=4;
 const rec=accruePayroll(s,{...base,id:'s3',day:4});assert.deepEqual(Object.keys(rec.staff),['moka']);assert.equal(rec.due,2*Math.ceil(TEMP.PAYROLL_BASE/4+10000*TEMP.PAYROLL_SHARE));
 const gold=s.gold;s=deserialize(serialize(s)).state;accruePayroll(s,{...base,id:'s3',day:4});assert.equal(s.gold,gold);
});
test('운영 대출은 한도·중복·월 8% 복리와 월정석 상환 잔돈을 검증한다',()=>{
 let s=createGame(),g=s.gold;assert.ok(dispatch(s,{type:'finance.borrow',amount:10000,requestId:'a'}).ok);assert.equal(s.gold,g+10000);
 assert.equal(dispatch(s,{type:'finance.borrow',amount:10000,requestId:'a'}).ok,false);assert.equal(dispatch(s,{type:'finance.borrow',amount:creditView(s).limit,requestId:'b'}).ok,false);
 s.gold=0;const rec=chargeLoanInterest(s,{day:4});assert.equal(rec.due,800);assert.equal(s.finance.balance,10800);chargeLoanInterest(s,{day:4});assert.equal(s.finance.balance,10800);
 s=deserialize(serialize(s)).state;const need=Math.ceil(10800/exchangeRate(s));s.moonstone=need+3;const before=s.moonstone,r=dispatch(s,{type:'finance.repay',target:'loan',amount:need+3,currency:'moonstone'}); // 테스트 준비: 환율(TEMP)이 바뀌어도 잔액을 넘기는 월정석assert.ok(r.ok);assert.equal(s.finance.balance,0);assert.equal(s.moonstone,before-Math.ceil(10800/exchangeRate(s)));assert.equal(s.gold,r.change);
});
test('강화는 캐릭터별로 저장되고 높은 레벨에도 계속되며 비용이 오른다',()=>{
 const s=createGame();s.moonstone=1000000;s.armory.upgrades.neo={power:100};const cost=upgradeCost(s,'neo','power');
 assert.ok(dispatch(s,{type:'armory.enhance',who:'neo',id:'power'}).ok);assert.equal(s.armory.upgrades.neo.power,101);assert.ok(upgradeCost(s,'neo','power')>cost);assert.equal(dispatch(s,{type:'armory.enhance',who:'seohanbi',id:'power'}).ok,false);
});
test('깊은 사냥 생존 보상에는 전용 재료와 추가 월정석이 포함된다',()=>{
 const a=survivalReward({elapsedMs:300000,depth:1}),b=survivalReward({elapsedMs:300000,depth:100});assert.ok(b.moonstone>a.moonstone);assert.ok(b.items.heukwol_grain>0);assert.ok(!a.items.heukwol_grain);
});
