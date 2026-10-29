import {cafeBounds} from '../src/render/cafe-view.js';
import {validateLayout} from '../src/game/space.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch} from '../src/game/engine.js';
import {serialize,deserialize} from '../src/core/save.js';
import {BRANCHES,earnedRevenue,branchOffer,activeBranch,pendingBranchStory,branchLock} from '../src/game/branches.js';
import {sheetHtml} from '../src/ui/sheets.js';
import {pendingStory} from '../src/game/calendar.js';
function offer(s,id){s.ledger.sales['fixture-'+id]=BRANCHES[id-1].revenue;s.ledger.story['branch:'+id]=true;}
test('제안은 잔액이 아닌 누적 매출, 개점 확인과 비용은 한 번만',()=>{
 const s=createGame();s.gold=1e7;assert.equal(branchOffer(s),null);s.ledger.sales.a=20000;assert.equal(earnedRevenue(s),20000);assert.equal(pendingBranchStory(s),'branch:2');
 const before=s.gold;assert.equal(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).ok,false);s.ledger.story['branch:2']=true;assert.equal(dispatch(s,{type:'branch.buy',id:2}).ok,false);assert.equal(s.gold,before);
 assert.equal(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).ok,true);assert.equal(s.gold,before-8000);assert.equal(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).duplicate,true);assert.equal(s.gold,before-8000);
});
test('이전 1호점 저장과 지점별 가구·주문·설비·평판을 독립 보존한다',()=>{
 let s=createGame();s.gold=1e6;s.interior.furniture[0].x=3;s.orders.old={id:'old'};s.reputation=66;offer(s,2);assert.ok(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).ok);assert.ok(dispatch(s,{type:'branch.switch',id:2}).ok);assert.deepEqual(s.orders,{});assert.equal(s.reputation,25);s.interior.furniture[0].x=7;s.exterior={theme:'x'};
 s=deserialize(serialize(s)).state;assert.equal(activeBranch(s),2);assert.ok(dispatch(s,{type:'branch.switch',id:1}).ok);assert.equal(s.interior.furniture[0].x,3);assert.equal(s.orders.old.id,'old');assert.equal(s.reputation,66);assert.equal(s.exterior,undefined);assert.ok(dispatch(s,{type:'branch.switch',id:2}).ok);assert.equal(s.interior.furniture[0].x,7);assert.equal(s.exterior.theme,'x');
 const legacy=createGame();const restored=deserialize(serialize(legacy)).state;assert.equal(activeBranch(restored),1);assert.deepEqual(restored.interior,legacy.interior);
});
test('부족한 잔액·영업·편집 중 전환을 거절하고 4→5 이후 6호점은 없다',()=>{
 const s=createGame();offer(s,2);s.gold=0;assert.equal(dispatch(s,{type:'branch.buy',id:2,confirmed:true}).ok,false);s.gold=1e7;
 for(let id=2;id<=5;id++){offer(s,id);assert.ok(dispatch(s,{type:'branch.buy',id,confirmed:true}).ok);assert.ok(dispatch(s,{type:'branch.switch',id}).ok);}
 assert.equal(branchOffer(s),null);assert.equal(dispatch(s,{type:'branch.buy',id:6,confirmed:true}).ok,false);assert.equal(dispatch(s,{type:'branch.switch',id:6}).ok,false);
 s.mode='shift';assert.equal(dispatch(s,{type:'branch.switch',id:1}).ok,false);s.mode='prep';s.interior.draft={};assert.equal(dispatch(s,{type:'branch.switch',id:1}).ok,false);
 assert.equal(new Set(BRANCHES.map(b=>b.maxRows)).size,5);
});
test('청토끼 제안은 정상 이야기 원장에서 완료되고 로드 뒤 반복하지 않는다',()=>{
 const s=createGame();s.ledger.story.m0=true;s.ledger.sales.fixture=20000;assert.equal(pendingStory(s),'branch:2');assert.ok(dispatch(s,{type:'story.seen',id:'branch:2'}).ok);assert.equal(dispatch(s,{type:'story.seen',id:'branch:2'}).duplicate,true);assert.equal(pendingBranchStory(deserialize(serialize(s)).state),null);
});

test('후속 지점 별관은 앞 구역부터만 열리며 본점 최대 면적과 저장 배치를 보존한다',()=>{
 const s=createGame();s.day=7;s.gold=1e8;s.hostbar.open=true;s.huntUnlocked=true;
 assert.equal(dispatch(s,{type:'expand.area',id:'branch_annex_1'}).ok,false);
 for(const id of ['east_wing','garden_wing','window','salon','terrace'])assert.ok(dispatch(s,{type:'expand.area',id}).ok);
 assert.deepEqual(cafeBounds(s),{cols:20,rows:24});
 for(let id=2;id<=5;id++){offer(s,id);dispatch(s,{type:'branch.buy',id,confirmed:true});dispatch(s,{type:'branch.switch',id});
  assert.equal(dispatch(s,{type:'expand.area',id:'branch_annex_1'}).ok,false);
  for(const area of ['east_wing','garden_wing','window','salon','terrace'])assert.ok(dispatch(s,{type:'expand.area',id:area}).ok);
  for(let n=1;n<id;n++)assert.ok(dispatch(s,{type:'expand.area',id:'branch_annex_'+n}).ok);
  assert.equal(cafeBounds(s).rows,BRANCHES[id-1].maxRows);assert.ok(validateLayout(s.interior.furniture,s.interior.areas).ok);
 }
});

test('지점 관리는 첫 지점 이야기 전까지 잠겨 보이고, 이야기를 보면 열린다', () => {
  const s = createGame();
  assert.ok(branchLock(s));
  assert.match(sheetHtml(s, { sheet: { kind: 'branches' } }), /아직 닫혀 있어요/);
  assert.match(sheetHtml(s, { sheet: { kind: 'manage' } }), /지점 이야기 뒤에 열려요/);
  s.ledger.story['branch:2'] = true; // 테스트 준비: 청토끼의 제안을 봤다
  assert.equal(branchLock(s), '');
  assert.doesNotMatch(sheetHtml(s, { sheet: { kind: 'branches' } }), /아직 닫혀 있어요/);
});
