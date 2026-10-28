import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostDemo} from '../src/game/host-demo.js';
import {dispatch,tick} from '../src/game/engine.js';
import {hostFeeQuote} from '../src/game/host-fees.js';
import {settleHosting} from '../src/game/nomination.js';
import {checkout} from '../src/game/cafe.js';
import {serialize,deserialize} from '../src/core/save.js';
import {seat} from './helpers.mjs';
import {TEMP} from '../src/config/balance.temp.js';
const B=TEMP.HOST_FEE_BASE; // 10-28 튜닝값(임시)
function fixture(){const s=createHostDemo();dispatch(s,{type:'shift.start'});s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;s.shift.scriptIndex=99;const a=seat(s);return {s,a,v:s.visits[a.vid]};}
test('지명료는 기본 지명료(TEMP)부터 등급별 고수익이며 카페 성장에 맞춰 오른다',()=>{
 const s=createHostDemo();s.reputation=0;s.interior.furniture=[];assert.deepEqual(['frugal','ordinary','generous','tycoon'].map(wealthId=>hostFeeQuote(s,{wealthId})),[B,B*1.5,B*3,B*6]);s.stats.served=100;assert.ok(hostFeeQuote(s,{wealthId:'frugal'})>B);
});
test('60초 완료 지명료는 수락 견적을 보존하고 계산대에서 음식·팁과 별도로 한 번만 받는다',()=>{
 const {s,a,v}=fixture();v.wealthId='frugal';s.reputation=0;s.interior.furniture=[];dispatch(s,{type:'nomination.accept',tableNo:a.tableNo});assert.equal(v.hostFeeQuote,B);const saved=deserialize(serialize(s));assert.equal(saved.state.visits[v.id].hostFeeQuote,B);
 s.stats.served=500;tick(s,59000);assert.equal(s.shift.hostFees,0);assert.equal(v.settled,false);tick(s,1000);assert.equal(v.hostFee,B);assert.equal(s.shift.hostFees,B);const bill=v.bill,before=s.gold;checkout(s,v);assert.equal(s.gold-before,bill);settleHosting(s,v);checkout(s,v);assert.equal(s.gold,before+bill);assert.equal(s.shift.hostFees,B);
});
test('거절·미완료 접대에는 지명료가 없고 기존 저장의 과거 수락에 새 요금을 소급하지 않는다',()=>{
 let {s,a,v}=fixture();dispatch(s,{type:'nomination.decline',tableNo:a.tableNo});assert.equal(v.hostFeeQuote,undefined);assert.equal(s.shift.hostFees,0);
 ({s,a,v}=fixture());dispatch(s,{type:'nomination.accept',tableNo:a.tableNo});tick(s,1000);settleHosting(s,v);assert.equal(v.hostFee,0);assert.equal(s.shift.hostFees,0);
 ({s,a,v}=fixture());dispatch(s,{type:'nomination.accept',tableNo:a.tableNo});delete v.hostFeeQuote;tick(s,60000);assert.equal(v.hostFee,0);
});

test('인기도와 배치 가구 분위기가 각각 지명료를 올린다',()=>{const s=createHostDemo(),v={wealthId:'ordinary'};s.reputation=0;const furniture=s.interior.furniture;s.interior.furniture=[];const base=hostFeeQuote(s,v);s.reputation=100;assert.equal(hostFeeQuote(s,v),base*2);s.interior.furniture=furniture;assert.ok(hostFeeQuote(s,v)>base*2);});
