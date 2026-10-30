import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch, tick} from '../src/game/engine.js';
import {abilityCheck, museongKitchenActive} from '../src/game/permissions.js';
import {cook, staffAvailable} from '../src/game/cafe.js';
import {propose} from '../src/game/nomination.js';
import {serialize, deserialize} from '../src/core/save.js';
import {authoredCastBondStory} from '../src/story/cast-bond-scenes.js';
import {quietShift, seat} from './helpers.mjs';

test('무성 주방 보조는 영입과 Rank 3 이야기 이후 열리고 역할 충돌 없이 조리를 돕는다',()=>{
 const s=createGame();s.bondRank.museong=3;s.ledger.story['bond:museong:1']=true;
 assert.match(abilityCheck(s,'museong_kitchen').reason,/영입/);
 s.roster.museong={usableFrom:s.day};s.people.museong={activity:'idle',form:'human',visitId:null,tableNo:null,endAt:null};
 delete s.ledger.story['bond:museong:1'];assert.match(abilityCheck(s,'museong_kitchen').reason,/이야기/);
 s.ledger.story['bond:museong:1']=true;assert.ok(dispatch(s,{type:'automation.toggle',ability:'museong_kitchen',on:true}).ok);
 assert.ok(authoredCastBondStory('museong',1).some(x=>x.t?.includes('취미')));
});

test('출근한 무성은 조리 시간을 줄이고 지명과 홀 업무를 맡지 않으며 저장된다',()=>{
 const prepare=s=>{s.roster.museong={usableFrom:s.day};s.people.museong={activity:'idle',form:'human',visitId:null,tableNo:null,endAt:null};s.bondRank.museong=3;s.ledger.story['bond:museong:1']=true;s.staffing={selected:['neo','museong']};};
 const base=quietShift({beforeStart:prepare});assert.ok(cook(base,'americano').ok);const original=base.stations.drink.current.durationMs;
 const s=quietShift({beforeStart:s=>{prepare(s);assert.ok(dispatch(s,{type:'automation.toggle',ability:'museong_kitchen',on:true}).ok);}});
 assert.ok(museongKitchenActive(s));assert.equal(staffAvailable(s,'museong'),false);assert.ok(cook(s,'americano').ok);assert.equal(s.stations.drink.current.durationMs,Math.round(original*.9));
 tick(s,100);assert.equal(s.staff.museong.job.kind,'station');assert.equal(dispatch(s,{type:'automation.toggle',ability:'museong_kitchen',on:false}).ok,false);
 const guest=seat(s,{nominee:'neo'});assert.match(propose(s,guest.tableNo,'museong').reason,/주방/);
 const restored=deserialize(serialize(s));assert.ok(restored.ok);assert.equal(restored.state.automation.museong_kitchen,true);assert.ok(museongKitchenActive(restored.state));
});

