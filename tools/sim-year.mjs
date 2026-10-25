// 자동 시계 봇 검증. 사람 플레이테스트가 아니며 실제 엔진 명령만 사용한다.
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { recruitView, questView } from '../src/game/economy.js';
import { INGREDIENTS } from '../src/data/menus.js';
import { CROPS, farmLevel, farmSeason } from '../src/data/farm.js';
import { botHunt } from './sim-hunt.mjs';
import { maxHuntDepth } from '../src/game/hunt-growth.js';
const withHunt=process.argv.includes('--with-hunt');
const rows = [];
for (const seed of [7,42,20261025]) {
 const s = createGame({seed}); let purchases=0, sales=0, tips=0, hostings=0, interest=0;
 for(let turn=1;turn<=36;turn++) {
  for(let id;(id=pendingStory(s));) dispatch(s,{type:'story.seen',id});
  if(withHunt && turn%3===1){botHunt(s,maxHuntDepth(s));if(s.moonstone)dispatch(s,{type:'moonstone.exchange',qty:s.moonstone});}
  for(const c of recruitView(s).filter(c=>c.status==='available')) dispatch(s,{type:'recruit.complete',id:c.id});
  for(const [index,p] of s.farm.plots.entries()) {
   if(p && p.growth>=CROPS[p.cropId].turns) dispatch(s,{type:'farm.harvest',index,cropInstanceId:p.id});
   if(!s.farm.plots[index]) {
    const cropId=Object.keys(CROPS).find(id=>CROPS[id].level<=farmLevel(s.farm)&&CROPS[id].seasons.includes(farmSeason(s.day)));
    dispatch(s,{type:'farm.plant',index,cropId});
   }
   dispatch(s,{type:'farm.water',index}); dispatch(s,{type:'farm.tend',index});
  }
  // 운영 자금을 먼저 확보하고 기본 재료를 12개까지 보충한다.
  for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
   const qty=Math.min(12-(s.stock[ingredientId]||0),Math.floor(s.gold/ing.price));
   if(qty>0) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty}); if(r.ok)purchases+=r.cost;}
  }
  dispatch(s,{type:'shift.start'}); dispatch(s,{type:'auto.toggle',on:true});
  while(s.mode==='shift') {
   // 긴급 배달도 실제 가격을 지불한다. 현금/재고를 주입하지 않는다.
   for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
    if((s.stock[ingredientId]||0)<2) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty:5});if(r.ok)purchases+=r.cost;}
   }
   tick(s,1000);
  }
  const st=s.lastSettlement;sales+=st.sales;tips+=st.baseTips+st.feverTips;hostings+=st.hostings.length;interest+=st.interest?.due||0;
  if(turn<=6 && st.hostings.length) throw Error('3·4월 지명 발생');
  for(const q of questView(s)) if(q.claimable)dispatch(s,{type:'quest.claim',questId:q.id});
  if(s.gold>1600)dispatch(s,{type:'debt.repay',amount:s.gold-1600,requestId:`bot:${seed}:${turn}`});
  dispatch(s,{type:'settlement.close'});
 }
 rows.push({seed,turns:s.stats.shiftsCompleted,sales,tips,purchases,hostings,interest,repaid:s.repaidTotal,debt:s.debt,gold:s.gold,ending:s.calendar.endingId,farmXP:s.farm.xp});
}
console.log(JSON.stringify({method:`36순 자동 시계 봇 / 인간 플레이테스트 아님 / ${withHunt?'매달 사냥 1회+':'사냥 없이 '}경영+농사 / 5테이블`,rows},null,2));
