import {personName,emit} from './state.js';
import {yeoniEffects} from './yeoni-growth.js';
import {CAFE_LINES,selectLine} from '../data/cafe-dialogue.js';
export const popularity=state=>Math.max(0,Math.min(999,state.reputation??25));
export function changePopularity(state,n){state.reputation=Math.max(0,Math.min(999,Math.round((popularity(state)+n)*10)/10));}
export function waitingSatisfaction(state,visit){
 const open=visit.orderIds.map(id=>state.orders[id]).filter(o=>o&&['waiting','assigned'].includes(o.status));
 if(!open.length)return visit.foodScores.length?Math.round(visit.foodScores.reduce((a,b)=>a+b,0)/visit.foodScores.length):100;
 const wait=Math.max(0,(state.shift.elapsedMs-Math.min(...open.map(o=>o.placedAt)))/1000);
 return Math.max(20,Math.round(100-Math.max(0,wait-30)*.8));
}
export function reviewVisit(state,visit,reason){
 if(visit.reviewed)return;
 visit.reviewed=true;
 const abandoned=reason.includes('오래 기다려')||reason.includes('주문할 수');
 const food=visit.foodScores.length?visit.foodScores.reduce((a,b)=>a+b,0)/visit.foodScores.length:null;
 const score=abandoned?20:food==null?null:Math.round(visit.finalH==null?food:food*.6+visit.finalH*.4);
 if(score==null)return;
 const delta=(score>=85?1:score>=65?.4:score>=45?-.4:-1.5)*(score>=65?1+yeoniEffects(state).review:1); // 좋은 후기만 연이 성장으로 커진다
 changePopularity(state,delta);visit.reviewScore=score;
 state.reviews??={count:0,total:0};state.reviews.count++;state.reviews.total+=score;
 emit('guestReview',{score,delta});
}
export function guestChatter(state,visit,roll,context='arrival'){
 let kind=context;
 const latest=Object.entries(state.recruitment).filter(([,r])=>r.status==='recruited'&&state.day-r.at<=6&&state.day>=r.at).sort((a,b)=>b[1].at-a[1].at)[0];
 let lines;
 if(context==='arrival'){
  if(latest&&roll<.25)lines=[`${personName(state,latest[0])} 님이 합류했다면서요? 소문 듣고 왔어요!`,`${personName(state,latest[0])} 님과 이 카페라니, 오늘이 기다려졌어요.`,`${personName(state,latest[0])} 님의 새로운 시작을 응원하러 왔어요.`];
  else kind=visit.kind==='takeaway'?'takeaway':visit.motive==='atmosphere'?'atmosphere':roll<.45&&CAFE_LINES[visit.wealthId]?visit.wealthId:popularity(state)>=70?'high':popularity(state)<20?'low':'arrival';
 }
 state.dialogueRecent??=[];
 const line=selectLine(lines||CAFE_LINES[kind]||CAFE_LINES.arrival,roll,state.dialogueRecent);
 state.dialogueRecent=[...state.dialogueRecent.slice(-11),line];
 visit.chatter=line;emit('guestChatter',{line,wealthId:visit.wealthId,tableNo:visit.tableNo,kind:visit.kind,context,topic:kind,customerId:visit.customerId});return line;
}
