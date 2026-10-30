import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {calendarOf,chargeInterest,dateLabel} from '../src/game/calendar.js';
import {checkCreditor,creditorView} from '../src/game/creditor.js';
import {serialize,deserialize} from '../src/core/save.js';
import {creditorStory} from '../src/story/creditor.js';
import {sheetHtml} from '../src/ui/sheets.js';
test('새 저장은 네 주에 한 달이며 기존 저장은 세 순 달력을 유지한다',()=>{
 const s=createGame();assert.equal(s.calendar.turnsPerMonth,4);assert.equal(s.calendar.totalTurns,96);assert.equal(calendarOf(4,4).monthIdx,0);assert.equal(calendarOf(5,4).monthIdx,1);assert.match(dateLabel(s),/1주차/);
 const old=JSON.parse(serialize(s));delete old.calendar.turnsPerMonth;old.calendar.totalTurns=72;old.day=7;const restored=deserialize(JSON.stringify(old)).state;assert.equal(restored.calendar.turnsPerMonth,3);assert.match(dateLabel(restored),/5월/);
});
test('분기 전 독촉과 목표 미달 시 게임 오버, 목표 달성은 계속 운영한다',()=>{
 const a=createGame();assert.equal(creditorView(a).milestone.monthIdx,2);assert.equal(checkCreditor(a,0,{added:0}),null);const warn=checkCreditor(a,1,{added:0});assert.equal(warn.quarter,true);assert.equal(warn.need,200000);const end=checkCreditor(a,2,{added:0});assert.equal(end.bad,true);assert.equal(a.calendar.endingId,'bad');
 const b=createGame();b.repaidTotal=200000;const ok=checkCreditor(b,2,{added:0});assert.equal(ok.milestone,true);assert.equal(b.calendar.ended,false);
});
test('새 달력은 4주차에만 이자가 부과된다',()=>{
 const s=createGame();s.gold=10000000;assert.equal(chargeInterest(s,{day:3}),null);assert.ok(chargeInterest(s,{day:4}));assert.equal(Object.keys(s.ledger.interest).length,1);
});
test('분기 말 결산에서 부족분을 가진 골드로 한 번만 상환한다',()=>{
 const s=createGame();s.gold=250000;const first=checkCreditor(s,2,{added:0});assert.equal(first.paid,200000);assert.equal(s.gold,50000);assert.equal(s.repaidTotal,200000);assert.equal(first.milestone,true);
 assert.equal(checkCreditor(s,2,{added:0}),first);assert.equal(s.gold,50000);
});
test('이미 분기 목표를 채워도 다음 분기 장부를 확인하고 안내가 정확하다',()=>{
 const s=createGame();s.repaidTotal=200000;const notice=checkCreditor(s,1,{added:0});assert.equal(notice.need,0);assert.match(creditorStory(notice.scene,s.ledger).map(b=>b.t||'').join(' '),/상환 목표 달성/);
 const fresh=createGame(),html=sheetHtml(fresh,{sheet:{kind:'town',tab:'finance'}});assert.match(html,/0\.2%/);assert.match(html,/자동 상환/);
});

