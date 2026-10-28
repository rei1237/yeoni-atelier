import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostDemo,HOST_DEMO_SAVE_KEY} from '../src/game/host-demo.js';
import {createGame} from '../src/game/state.js';
import {dispatch,tick} from '../src/game/engine.js';
import {SAVE_KEYS,serialize,deserialize,memoryStorage,saveGame} from '../src/core/save.js';
import {seat} from './helpers.mjs';
import {hostDeskHtml} from '../src/ui/host-desk.js';
import {worldCastSheet} from '../src/ui/world-cast.js';
import {guideForContext} from '../src/ui/tutorials.js';
import {ensureRecordPlayer} from '../src/game/music-furniture.js';
import {validateLayout} from '../src/game/space.js';
import {cafeLayout} from '../src/data/layout.js';
import {bestHelpChoice} from '../src/data/help.js';
import {customerLook,NOMINATION_LOOKS} from '../src/data/customer-looks.js';

test('호스트 체험은 일반·개발 저장과 분리되고 정규 10분과 60초 전담을 유지한다',()=>{
 const s=createHostDemo(),storage=memoryStorage();storage.setItem(SAVE_KEYS.normal,'original');storage.setItem(SAVE_KEYS.dev,'development');
 assert.notEqual(HOST_DEMO_SAVE_KEY,SAVE_KEYS.normal);saveGame(storage,HOST_DEMO_SAVE_KEY,s);assert.equal(storage.getItem(SAVE_KEYS.normal),'original');assert.equal(storage.getItem(SAVE_KEYS.dev),'development');
 assert.ok(s.hostbar.open);assert.equal(s.auto,false);assert.ok(s.automation.hall&&s.automation.kitchen);assert.ok(dispatch(s,{type:'shift.start'}).ok);assert.equal(s.shift.durationMs,600000);assert.equal(s.shift.nominationMs,60000);
});
test('기존 카페의 첫 호스트 개업도 지명 소개 손님 순서를 사용한다',()=>{
 const s=createHostDemo();s.stats.shiftsCompleted=6;assert.ok(dispatch(s,{type:'shift.start'}).ok);assert.equal(s.shift.scriptIndex,0);assert.ok(s.hostbar.introShiftStarted);
 const loaded=deserialize(serialize(s));assert.ok(loaded.ok);assert.equal(loaded.state.hostbar.introShiftStarted,true);
});
test('실제 지명 요청에서 튜토리얼·수락·SOS·60초 정산·동료 해제가 이어진다',()=>{
 const s=createHostDemo();dispatch(s,{type:'shift.start'});s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;s.shift.scriptIndex=99;
 const a=seat(s);assert.equal(guideForContext(s,{}),'host');assert.match(hostDeskHtml(s),/지명 [0-9,]+G/);
 assert.ok(dispatch(s,{type:'nomination.accept',tableNo:a.tableNo}).ok);const v=s.visits[a.vid];assert.equal(v.endAt-v.acceptAt,60000);assert.match(hostDeskHtml(s),/접대 60초/);
 assert.equal(dispatch(s,{type:'nomination.accept',tableNo:a.tableNo}).ok,false);
 tick(s,12000);assert.match(hostDeskHtml(s),/SOS/);const h=v.help.find(h=>h.status==='open');assert.ok(h);
 const answer={type:'help.respond',visitId:v.id,index:h.index,choice:bestHelpChoice(h.kind,v.prefs)};
 assert.ok(dispatch(s,answer).ok);assert.equal(h.result,'good');assert.equal(dispatch(s,answer).ok,false);
 tick(s,48000);assert.ok(v.settled);assert.notEqual(s.people.neo.activity,'hosting');const ledger=JSON.stringify(s.ledger.tips);tick(s,2000);assert.equal(JSON.stringify(s.ledger.tips),ledger);
});
test('LP 가구는 기존 가구를 이동하지 않고 한 번 추가되며 안전한 통로를 유지한다',()=>{
 const s=createGame();assert.ok(validateLayout(s.interior.furniture,s.interior.areas,cafeLayout(s)).ok);
 s.interior.furniture=s.interior.furniture.filter(f=>f.defId!=='record_player');const original=structuredClone(s.interior.furniture);
 ensureRecordPlayer(s);ensureRecordPlayer(s);assert.equal(s.interior.furniture.filter(f=>f.defId==='record_player').length,1);assert.deepEqual(s.interior.furniture.slice(0,original.length),original);assert.ok(validateLayout(s.interior.furniture,s.interior.areas,cafeLayout(s)).ok);
 const loaded=deserialize(serialize(s));assert.ok(loaded.ok);assert.equal(loaded.state.interior.furniture.filter(f=>f.defId==='record_player').length,1);
});
test('월드 멤버 초대장은 기존 영입 조건을 표시하고 렌더링으로 해금하지 않는다',()=>{
 const s=createGame(),before=JSON.stringify(s),html=worldCastSheet(s);assert.match(html,/호스트 개업/);assert.doesNotMatch(html,/world-cast-person/);assert.match(html,/아직 도착하지 않은 초대장/);assert.equal(JSON.stringify(s),before);
});
test('지명 손님은 여성 외형만 사용하고 일반 손님 다양성과 저장을 보존한다',()=>{
 for(let look=0;look<8;look++){assert.ok(NOMINATION_LOOKS.includes(customerLook({look,nominationGuest:true})));assert.equal(customerLook({look}),look);}
 const s=createHostDemo();dispatch(s,{type:'shift.start'});s.shift.nextSpawnAt=Number.MAX_SAFE_INTEGER;const a=seat(s);assert.ok(NOMINATION_LOOKS.includes(s.customers[a.cid].look));
 s.customers[a.cid].look=7;delete s.customers[a.cid].nominationGuest;
 const loaded=deserialize(serialize(s));assert.ok(loaded.ok);assert.ok(NOMINATION_LOOKS.includes(loaded.state.customers[a.cid].look));assert.equal(loaded.state.visits[a.vid].kind,'nomination');
});
