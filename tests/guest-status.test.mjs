// 자리로 가는 중·계산하러 가는 중·나가는 중인 손님은 테이블 배지에 '주문'·'메뉴 고르는 중'으로 보이지 않는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {quietShift,seat} from './helpers.mjs';
import {spawnCustomer,placeOrder,customerLeave} from '../src/game/cafe.js';
import {tableBadgesHtml,guestMotion} from '../src/ui/table-ui.js';
const view={w:2000,h:2000,tile:40,ox:0,oy:0,scale:1};

test('들어오는 손님과 떠나는 손님의 상태 문구',()=>{
 const s=quietShift(),c=spawnCustomer(s,{kind:'regular'});
 assert.equal(guestMotion(s.customers[c.id]),'자리로 가는 중');
 const g=seat(s,{kind:'regular'}),v=s.visits[g.vid];placeOrder(s,v,'americano');
 assert.equal(guestMotion(s.customers[g.cid]),'');
 customerLeave(s,s.customers[g.cid],'음식을 오래 기다려 떠남');
 const html=tableBadgesHtml(s,view);
 assert.match(html,/나가는 중|계산하러 가는 중/);
 assert.doesNotMatch(html,new RegExp(`${g.tableNo}번 테이블 (메뉴 고르는 중|아메리카노)`));
});
