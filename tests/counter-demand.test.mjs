// 계산대 한마디(10-29 손님 요구): 계산 줄의 부탁에 연이가 계산대에서 응대하면 경험치, 일찍 받으면 감사 팁. 방문마다 한 번만.
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {TEMP} from '../src/config/balance.temp.js';
import {maybeDemand,openDemands} from '../src/game/counter-demand.js';
import {newTalk,prepTalk,stepTalk,PREP_FIRST,PREP_LINE} from '../src/ui/cafe-talk.js';
import {prepSpots,computeView} from '../src/render/cafe-view.js';
import {tableBadgesHtml} from '../src/ui/table-ui.js';

function asking(s,{bill=200,ago=0}={}){
 const {cid,vid}=seat(s,{kind:'regular'}),v=s.visits[vid],at=s.shift.elapsedMs-ago;
 s.customers[cid].state='checkout';v.bill=bill;v.demand={kind:'stamp',at,until:at+TEMP.DEMAND.windowMs};
 return v;
}

test('게이지 절반 전에 응대하면 좋음: 계산서 팁·경험치를 한 번만 준다',()=>{
 const s=quietShift(),v=asking(s),tips=s.shift.baseTips,xp=s.yeoniGrowth?.xp||0;
 assert.deepEqual(openDemands(s).map(x=>x.id),[v.id]);
 const r=dispatch(s,{type:'counter.respond',visitId:v.id});
 assert.ok(r.ok,r.reason);
 const tip=Math.min(TEMP.DEMAND.tipCap,Math.round(200*TEMP.DEMAND.tipRate));
 assert.equal(r.result,'good');assert.equal(r.tip,tip);
 assert.equal(v.bill,200+tip);assert.equal(s.shift.baseTips,tips+tip);
 assert.equal(s.yeoniGrowth.xp,xp+1);
 assert.deepEqual(s.ledger.demands[v.id],{kind:'stamp',result:'good',tip});
 assert.equal(dispatch(s,{type:'counter.respond',visitId:v.id}).ok,false,'같은 방문은 두 번 받지 않는다');
 assert.equal(s.shift.baseTips,tips+tip);
});

test('늦게 응대하면 보통: 팁 없이 경험치만',()=>{
 const s=quietShift(),v=asking(s,{ago:TEMP.DEMAND.windowMs*.8}),tips=s.shift.baseTips;
 const r=dispatch(s,{type:'counter.respond'});
 assert.equal(r.result,'ok');assert.equal(r.tip,0);assert.equal(s.shift.baseTips,tips);
 assert.equal(s.ledger.demands[v.id].result,'ok');
});

test('지명 손님과 마감 직전에는 부탁을 꺼내지 않는다',()=>{
 const s=quietShift(),{vid}=seat(s,{kind:'nomination'});
 maybeDemand(s,s.visits[vid]);assert.equal(s.visits[vid].demand,undefined);
 const {vid:r}=seat(s,{kind:'regular'});s.shift.elapsedMs=s.shift.durationMs-TEMP.DEMAND.closeMs+1;
 maybeDemand(s,s.visits[r]);assert.equal(s.visits[r].demand,undefined);
});

test('영업 준비 화면에서 연이와 동료가 장면 하나를 주고받는다',()=>{
 const s=createGame({}),talk=newTalk();
 assert.equal(prepTalk(talk,s,0),false,'처음엔 잠깐 기다린다');
 assert.ok(prepTalk(talk,s,PREP_FIRST));
 const here=prepSpots(s),first=stepTalk(talk,s,PREP_FIRST+10);
 assert.equal(first.length,1);assert.ok(here[first[0].who],'자리에 있는 사람이 말한다');
 const next=stepTalk(talk,s,PREP_FIRST+PREP_LINE+10).map(i=>i.who);
 assert.equal(next.length,2);assert.notEqual(next[0],next[1],'다른 사람이 받아 준다');
 s.mode='shift';assert.equal(prepTalk(newTalk(),s,PREP_FIRST),false);
});

test('부탁한 계산대 손님 머리 위 말풍선으로 바로 팁을 받는다',()=>{
 const s=quietShift(),v=asking(s),html=tableBadgesHtml(s,computeView(1180,700));
 assert.match(html,new RegExp(`data-action="counter.respond" data-visit="${v.id}"[^>]*>.*팁 받기`));
 dispatch(s,{type:'counter.respond',visitId:v.id});
 assert.doesNotMatch(tableBadgesHtml(s,computeView(1180,700)),/counter\.respond/,'받고 나면 말풍선이 사라진다');
});
