// 명시적인 개발 체험 URL에서만 쓰는 독립 초기 상태. 일반 저장을 변경하지 않는다.
import {createGame} from './state.js';
import {dispatch} from './engine.js';
import {pendingStory} from './calendar.js';
import {ABILITIES} from './permissions.js';
import {TEMP} from '../config/balance.temp.js';
export const HOST_DEMO_SAVE_KEY='yeoni-atelier.host-demo.v1';
export function createHostDemo(){
 const s=createGame({seed:20261028});
 s.meta.hostDemo=true;s.day=7;s.gold=5000;s.affinity.neo=180;
 s.ledger.story.prologue=true;s.ledger.story.m0=true;s.ledger.story.m1=true;
 for(let i=0;i<20&&pendingStory(s);i++){
  const r=dispatch(s,{type:'story.seen',id:pendingStory(s)});if(!r.ok)throw Error(r.reason);
 }
 for(const key of Object.keys(s.stock))s.stock[key]=100;
 for(const ability of ['hall','kitchen']){
  const a=ABILITIES[ability];s.affinity[a.id]=TEMP.BONDS.TIERS[a.tier-1];
  for(let tier=1;tier<=a.tier;tier++)s.ledger.story[`bond:${a.id}:${tier}`]=true;
  const r=dispatch(s,{type:'automation.toggle',ability,on:true});if(!r.ok)throw Error(r.reason);
 }
 s.tutorials={firstday:true,firstdayintro:true,opening:true,cook:true,serve:true};
 return s;
}
