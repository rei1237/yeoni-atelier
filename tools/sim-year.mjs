// 자동 시계 봇 검증. 사람 플레이테스트가 아니며 실제 엔진 명령만 사용한다.
// 72순(2년) 세 가지 봇(10-28 경제 개편):
//  ideal   = 피버 게이지가 차면 무대 공연 우선, 매달 콘서트, 매달 사냥, 대출로 테이블 증축, 합류 동료와 대화
//  average = 무대는 가끔(격순), 콘서트는 격월, 네오 대화는 격순, 대출 없이 남는 골드로만 증축
//  idle    = 무대·피버·콘서트·사냥 없이 자동 영업만
// 10-29 계산대 한마디: ideal은 부탁마다 바로 응대(좋음), average는 절반만, idle은 응대하지 않는다
// 사용: node tools/sim-year.mjs --bot ideal|average|idle [--seeds 7,42]
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
import { concertCheck, totalFans } from '../src/game/fans.js';
import { TEMP } from '../src/config/balance.temp.js';
import { openDemands } from '../src/game/counter-demand.js';
import { yeoniProgress } from '../src/game/yeoni-growth.js';
const arg=k=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:null;};
const bot=arg('--bot')||'ideal', seeds=(arg('--seeds')||'7,42,20261025').split(',').map(Number);
const P={ideal:{hunt:true,loan:true,expand:true,stage:()=> 'stage',concert:()=>true,talk:()=>true,talkAll:true,counter:()=>true},
 average:{hunt:true,loan:false,expand:true,stage:t=>t%2?'stage':'fever',concert:m=>m%2===0,talk:t=>t%2===1,talkAll:false,counter:n=>n%2===0},
 idle:{hunt:false,loan:false,expand:false,stage:()=> 'off',concert:()=>false,talk:()=>false,talkAll:false,counter:()=>false}}[bot];
if(!P)throw Error('알 수 없는 봇: '+bot);
const RESERVE=1600, rows = [];
const talk=(s,id)=>{const q=bondQuestion(s,id);if(!q)return;const a=q.answers.reduce((b,x)=>(x.gain||0)>(b.gain||0)?x:b,q.answers[0]);dispatch(s,{type:'bond.talk',id,choiceId:a.id,token:q.token});};
for (const seed of seeds) {
 const s = createGame({seed}); const sum={purchases:0,sales:0,hostFees:0,tips:0,stageTips:0,stages:0,concertGold:0,concerts:0,hostings:0,interest:0,payroll:0,huntGold:0,borrowed:0,loanInterest:0,expansions:0,demands:0,answered:0};let clearedDay=null;const seen=new Set();
 for(let turn=1;turn<=TEMP.CALENDAR.TOTAL_TURNS && !s.calendar.endingId;turn++) {
  for(let id;(id=pendingStory(s));) dispatch(s,{type:'story.seen',id});
  const month=Math.floor((turn-1)/TEMP.CALENDAR.TURNS_PER_MONTH);
  if(P.concert(month)&&concertCheck(s).ok){const r=dispatch(s,{type:'concert.hold'});if(r.ok){sum.concertGold+=r.gold;sum.concerts++;}}
  // 사냥터는 첫 영업 뒤 「돈 벌어 와, 네오!」로 열리므로 2순부터 3순마다
  if(P.hunt && s.huntUnlocked && turn%TEMP.CALENDAR.TURNS_PER_MONTH===2){botHunt(s,maxHuntDepth(s));if(s.moonstone){const ex=dispatch(s,{type:'moonstone.exchange',qty:s.moonstone});sum.huntGold+=ex.gold||0;}}
  if(P.talk(turn)&&s.ap.left>0)talk(s,'neo');
  if(P.talkAll)for(const id of Object.keys(s.roster).filter(id=>id!=='neo'))if(s.ap.left>0)talk(s,id);
  for(const c of recruitView(s).filter(c=>c.status==='available')) dispatch(s,{type:'recruit.complete',id:c.id});
  for(const [index,p] of s.farm.plots.entries()) {
   if(p && p.growth>=CROPS[p.cropId].turns) dispatch(s,{type:'farm.harvest',index,cropInstanceId:p.id});
   if(!s.farm.plots[index]) {
    const cropId=Object.keys(CROPS).find(id=>CROPS[id].level<=farmLevel(s.farm)&&CROPS[id].seasons.includes(farmSeason(s.day, s.calendar?.turnsPerMonth || 3)));
    dispatch(s,{type:'farm.plant',index,cropId});
   }
   dispatch(s,{type:'farm.water',index}); dispatch(s,{type:'farm.tend',index});
  }
  // 대출 활용: 이율이 높은 운영 대출부터 갚고(마을 일이라 준비 중에만), 모자란 만큼만 빌려 테이블을 늘린다
  if(P.loan&&s.finance?.balance>0&&s.gold>RESERVE)dispatch(s,{type:'finance.repay',target:'loan',currency:'gold',amount:Math.min(s.finance.balance,s.gold-RESERVE)});
  if(P.expand){const ex=nextExpansion(s),need=ex?ex.cost+RESERVE-s.gold:0;
   if(ex&&(need<=0||(P.loan&&need<=creditView(s).available))){if(need>0){const r=dispatch(s,{type:'finance.borrow',amount:need,requestId:`bot:loan:${seed}:${turn}`});if(r.ok)sum.borrowed+=need;}if(dispatch(s,{type:'expand.table'}).ok)sum.expansions++;}}
  for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
   const qty=Math.min(12-(s.stock[ingredientId]||0),Math.floor(s.gold/ing.price));
   if(qty>0) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty}); if(r.ok)sum.purchases+=r.cost;}
  }
  dispatch(s,{type:'shift.start'}); dispatch(s,{type:'auto.toggle',on:true,sim:true,fever:P.stage(turn)});
  while(s.mode==='shift') {
   // 긴급 배달도 실제 가격을 지불한다. 현금/재고를 주입하지 않는다.
   for(const [ingredientId,ing] of Object.entries(INGREDIENTS).filter(([,i])=>i.basic)) {
    if((s.stock[ingredientId]||0)<2) {const r=dispatch(s,{type:'shop.buy',ingredientId,qty:5});if(r.ok)sum.purchases+=r.cost;}
   }
   for(const v of openDemands(s))if(!seen.has(v.id)){seen.add(v.id);sum.demands++;if(P.counter(sum.demands)&&dispatch(s,{type:'counter.respond',visitId:v.id}).ok)sum.answered++;}
   tick(s,1000);
  }
  const st=s.lastSettlement;sum.sales+=st.sales;sum.hostFees+=st.hostFees||0;sum.tips+=st.baseTips+st.feverTips;sum.stageTips+=st.stageTips||0;sum.stages+=st.stages||0;sum.hostings+=st.hostings.length;sum.interest+=st.interest?.due||0;sum.payroll+=st.payroll?.closed?st.payroll.paid:0;
  if(turn<=6 && st.hostings.length) throw Error('3·4월 지명 발생');
  for(const q of questView(s)) if(q.claimable)dispatch(s,{type:'quest.claim',questId:q.id});
  sum.loanInterest+=st.loanInterest?.due||0;
  // 대출이 남아 있으면 골드를 모아 다음 준비 때 대출부터 갚는다
  if(s.gold>RESERVE&&!(P.loan&&s.finance?.balance>0))dispatch(s,{type:'debt.repay',amount:s.gold-RESERVE,requestId:`bot:${seed}:${turn}`});
  if(s.debt<=0&&clearedDay==null)clearedDay=turn;
  dispatch(s,{type:'settlement.close'});
  if(process.env.SIM_TRACE&&turn%6===0)console.error(bot,seed,turn,'debt',s.debt,'gold',Math.round(s.gold),'repaid',s.repaidTotal,'warn',s.creditor?.warnings,'ult',s.creditor?.ultimatum?.dueMonth??'-','fans',totalFans(s));
 }
 rows.push({seed,turns:s.stats.shiftsCompleted,clearedDay,yeoniLevel:yeoniProgress(s).level,yeoniXp:yeoniProgress(s).xp,debt:s.debt,gold:s.gold,ending:s.calendar.endingId,fans:s.fans,tables:tableCount(s),...sum,repaid:s.repaidTotal,loanLeft:s.finance?.balance||0,dun:Object.values(s.ledger.creditor||{}).map(r=>r.scene).filter(Boolean)});
}
console.log(JSON.stringify({method:`${TEMP.CALENDAR.TOTAL_TURNS}주 자동 시계 봇(${bot}) / 인간 플레이테스트 아님`,bot,rows},null,2));
