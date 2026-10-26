// 자동 시계 봇 검증. 사람 플레이테스트가 아니며 실제 엔진 명령만 사용한다.
import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { recruitView, questView } from '../src/game/economy.js';
import {bondQuestion} from '../src/data/bond-dialogues.js';
import { INGREDIENTS } from '../src/data/menus.js';
import { CROPS, farmLevel, farmSeason } from '../src/data/farm.js';
import { botHunt } from './sim-hunt.mjs';
import { maxHuntDepth } from '../src/game/hunt-growth.js';
import { nextExpansion, tableCount } from '../src/game/town.js';
import { creditView } from '../src/game/finance.js';
const withHunt=process.argv.includes('--with-hunt'), withLoan=process.argv.includes('--loan');
const rows = [];
for (const seed of [7,42,20261025]) {
 const s = createGame({seed}); let purchases=0, sales=0, tips=0, hostings=0, interest=0,payroll=0,huntGold=0,clearedDay=null,borrowed=0,loanInterest=0,expansions=0;
 for(let turn=1;turn<=180;turn++) {
  for(let id;(id=pendingStory(s));) dispatch(s,{type:'story.seen',id});
  if(withHunt && turn%3===1){botHunt(s,maxHuntDepth(s));if(s.moonstone){const ex=dispatch(s,{type:'moonstone.exchange',qty:s.moonstone});huntGold+=ex.gold||0;}}
  if(s.ap.left>0){const q=bondQuestion(s,'neo');dispatch(s,{type:'bond.talk',id:'neo',choiceId:q.answers.find(a=>a.gain===12).id,token:q.token});}
  for(const c of recruitView(s).filter(c=>c.status==='available')) dispatch(s,{type:'recruit.complete',id:c.id});
  for(const [index,p] of s.farm.plots.entries()) {
   if(p && p.growth>=CROPS[p.cropId].turns) dispatch(s,{type:'farm.harvest',index,cropInstanceId:p.id});
   if(!s.farm.plots[index]) {
    const cropId=Object.keys(CROPS).find(id=>CROPS[id].level<=farmLevel(s.farm)&&CROPS[id].seasons.includes(farmSeason(s.day)));
    dispatch(s,{type:'farm.plant',index,cropId});
   }
   dispatch(s,{type:'farm.water',index}); dispatch(s,{type:'farm.tend',index});
  }
  // 대출 활용: 이율이 높은 운영 대출부터 갚고(마을 일이라 준비 중에만), 모자란 만큼만 빌려 테이블을 늘린다(운영 자금 1600G는 남긴다)
  if(withLoan&&s.finance?.balance>0&&s.gold>1600)dispatch(s,{type:'finance.repay',target:'loan',currency:'gold',amount:Math.min(s.finance.balance,s.gold-1600)});
  if(withLoan){const ex=nextExpansion(s),need=ex?ex.cost+1600-s.gold:0;
   if(ex&&need<=creditView(s).available){if(need>0){const r=dispatch(s,{type:'finance.borrow',amount:need,requestId:`bot:loan:${seed}:${turn}`});if(r.ok)borrowed+=need;}if(dispatch(s,{type:'expand.table'}).ok)expansions++;}}
  // 운영 자금을 먼저 확보하고 기본 재료를 12개까지 보충한다.
  for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
   const qty=Math.min(12-(s.stock[ingredientId]||0),Math.floor(s.gold/ing.price));
   if(qty>0) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty}); if(r.ok)purchases+=r.cost;}
  }
  dispatch(s,{type:'shift.start'}); dispatch(s,{type:'auto.toggle',on:true,sim:true});
  while(s.mode==='shift') {
   // 긴급 배달도 실제 가격을 지불한다. 현금/재고를 주입하지 않는다.
   for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
    if((s.stock[ingredientId]||0)<2) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty:5});if(r.ok)purchases+=r.cost;}
   }
   tick(s,1000);
  }
  const st=s.lastSettlement;sales+=st.sales;tips+=st.baseTips+st.feverTips;hostings+=st.hostings.length;interest+=st.interest?.due||0;payroll+=st.payroll?.closed?st.payroll.paid:0;
  if(turn<=6 && st.hostings.length) throw Error('3·4월 지명 발생');
  for(const q of questView(s)) if(q.claimable)dispatch(s,{type:'quest.claim',questId:q.id});
  loanInterest+=st.loanInterest?.due||0;
  // 대출이 남아 있으면 골드를 모아 다음 준비 때 대출부터 갚는다
  if(s.gold>1600&&!(withLoan&&s.finance?.balance>0))dispatch(s,{type:'debt.repay',amount:s.gold-1600,requestId:`bot:${seed}:${turn}`});
  if(s.debt<=0&&clearedDay==null)clearedDay=turn;
  dispatch(s,{type:'settlement.close'});
 }
 rows.push({seed,turns:s.stats.shiftsCompleted,sales,tips,purchases,hostings,interest,payroll,huntGold,clearedDay,repaid:s.repaidTotal,debt:s.debt,gold:s.gold,ending:s.calendar.endingId,farmXP:s.farm.xp,...(withLoan?{borrowed,loanInterest,loanLeft:s.finance?.balance||0,expansions,tables:tableCount(s)}:{})});
}
console.log(JSON.stringify({method:`180순 자동 시계 봇 / 인간 플레이테스트 아님 / ${withHunt?'매달 사냥 1회+':'사냥 없이 '}경영+농사 / ${withLoan?'운영 대출로 테이블 증축':'5테이블'}`,rows},null,2));
