// 친밀도: 대화·선물은 순마다 한 사람 한 번, 단계 능력은 실제 수치에 붙고 인연 이야기는 달 이야기 뒤에 한 번
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { pendingStory } from '../src/game/calendar.js';
import { BONDS, bondFx } from '../src/data/bonds.js';
import { cafeCapacity } from '../src/game/capacity.js';
import { cook } from '../src/game/cafe.js';
import { runningJobs,queuedJobs } from '../src/game/station-slots.js';
import { serialize,deserialize } from '../src/core/save.js';
import { deliveryQuote } from '../src/game/delivery.js';
import { INGREDIENTS } from '../src/data/menus.js';
import { quietShift } from './helpers.mjs';

import {bondQuestion} from '../src/data/bond-dialogues.js';
const B = TEMP.BONDS;

test('대화: 행동력 1, 같은 순 같은 동료는 한 번 · 선물은 골드가 들고 순마다 한 번', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  const ap0 = s.ap.left;
  const q=bondQuestion(s,'luna'),answer=q.answers.find(a=>a.gain===12);
  const r = dispatch(s, { type: 'bond.talk', id: 'luna', choiceId:answer.id, token:q.token });
  assert.ok(r.ok, r.reason);
  assert.equal(r.gain,12);
  assert.equal(s.ap.left, ap0 - 1);
  assert.equal(s.affinity.luna, r.gain);
  assert.match(dispatch(s, { type: 'bond.talk', id: 'luna' }).reason, /이미/);
  assert.equal(s.ap.left, ap0 - 1, '거절된 대화는 행동력을 쓰지 않는다');

  s.gold = 1000; // 테스트 준비
  const g = BONDS.moka.gift;
  assert.ok(dispatch(s, { type: 'bond.gift', id: 'moka', giftId: g.id }).ok);
  assert.equal(s.gold, 1000 - g.cost);
  assert.equal(s.affinity.moka, B.GIFT_LIKED);
  assert.match(dispatch(s, { type: 'bond.gift', id: 'moka', giftId: 'moon_bun' }).reason, /이미/);
  assert.equal(dispatch(s, { type: 'bond.gift', id: 'luna', giftId: 'nope' }).ok, false);
});

test('능력: 단계를 넘으면 재료값·환전·사냥 HP 에 붙고, 인연 이야기는 달 이야기 뒤에 나온다', () => {
  const s = createGame();
  s.hostbar.open = true; s.huntUnlocked = true; // 테스트 준비: 기능 개시 후 동작
  s.gold = 10000; s.ap.left=4; // shopping x2, exchange, hunt // 테스트 준비
  s.affinity = { neo: B.TIERS[0], luna: 0, luna_sis: B.TIERS[2], moka: B.TIERS[0] };
  s.bondRank = { neo: 3, luna: 0, luna_sis: 8, moka: 3 }; // 테스트 준비: 랭크 3·8 = 능력 1·3단계
  const fx = bondFx(s);
  assert.equal(fx.huntHp, 40);
  assert.equal(fx.discount, 0.1);
  assert.equal(fx.moonRate, 0.1);

  const gold0 = s.gold;
  assert.ok(dispatch(s, { type: 'shop.buy', ingredientId: 'bean', qty: 10 }).ok);
  assert.equal(gold0 - s.gold, Math.ceil(30 * 10 * 0.9));
  assert.equal(s.affinity.moka, B.TIERS[0] + B.WORK_SHOP, '준비 중 첫 구매는 모카와 함께 일한 몫');
  dispatch(s, { type: 'shop.buy', ingredientId: 'bean', qty: 1 });
  assert.equal(s.affinity.moka, B.TIERS[0] + B.WORK_SHOP, '순마다 한 번');

  s.moonstone = 10;
  const r = dispatch(s, { type: 'moonstone.exchange', qty: 10 });
  assert.equal(r.gold, Math.floor(10 * TEMP.MOONSTONE_GOLD * 1.1));

  assert.ok(dispatch(s, { type: 'hunt.start' }).ok);
  assert.equal(s.hunt.maxHp, TEMP.HUNT.PLAYER_HP + 40);
  dispatch(s, { type: 'hunt.retreat' });
  dispatch(s, { type: 'hunt.finish' });

  assert.equal(pendingStory(s), 'm0', '달 이야기가 먼저');
  dispatch(s, { type: 'story.seen', id: 'm0' });
  assert.equal(pendingStory(s), 'bond:neo:1');
  dispatch(s, { type: 'story.seen', id: 'bond:neo:1' });
  assert.equal(pendingStory(s), 'bond:luna_sis:1');
});

test('루나 언니 인연은 설비마다 동시 조리를 늘리고, 모카 랭크 10은 배달비를 없앤다', () => {
  const s = quietShift(), base = cafeCapacity(s);
  s.bondRank = { ...(s.bondRank || {}), luna_sis: 3 }; // 테스트 준비: 랭크 3 = 첫 능력
  assert.equal(cafeCapacity(s).stationSlots, base.stationSlots + 1);
  s.bondRank.luna_sis = 10; // 테스트 준비: 네 능력 모두
  const cap = cafeCapacity(s);
  assert.equal(cap.stationSlots, Math.min(B.COOK_SLOT_CAP, base.stationSlots + 5)); assert.equal(cap.traySlots, base.traySlots + 2);
  for (const k of Object.keys(INGREDIENTS)) s.stock[k] = 99; s.learned.fortune_latte = true; // 테스트 준비: 재료 넉넉히
  for (let i = 0; i < cap.stationSlots; i++) assert.ok(cook(s, 'fortune_latte').started, `${i + 1}잔째도 바로 끓인다`);
  assert.equal(runningJobs(s.stations.drink).length, cap.stationSlots);
  s.bondRank.moka = 8; assert.equal(deliveryQuote(s, { bean: 1 }).fee, Math.ceil(TEMP.DELIVERY_FEE * 0.5));
  s.bondRank.moka = 10; const q = deliveryQuote(s, { bean: 2 });
  assert.equal(q.fee, 0); assert.equal(q.cost, q.base);
  assert.equal(bondFx(s).dailyDew, 2);
  const at = rank => { s.bondRank.luna_sis = rank; return bondFx(s).cookSpeed; }; // 테스트 준비
  for (const rank of [1, 2, 4, 5, 7, 9]) assert.ok(at(rank) > at(rank - 1), `Rank ${rank}에서도 조리가 빨라진다`);
});

test('루나 언니 인연 랭크가 오를 때 음료와 오븐 대기 공간이 늘고 저장과 순서를 보존한다',()=>{
 let s=quietShift();for(const k of Object.keys(INGREDIENTS))s.stock[k]=99;s.learned.yeoni_rose_mille=true;
 const caps=[];for(const rank of [0,1,3,10]){s.bondRank.luna_sis=rank;caps.push(cafeCapacity(s));}
 for(let i=1;i<caps.length;i++)assert.ok(caps[i].queueSlots>caps[i-1].queueSlots);
 s.bondRank.luna_sis=1;const cap=cafeCapacity(s);assert.equal(cap.queueSlots,cap.stationSlots+1);
 for(const [station,menu] of [['drink','americano'],['oven','yeoni_rose_mille']]){
  assert.ok(cook(s,menu).started);const before={...s.stock};const a=cook(s,menu),b=cook(s,menu);assert.ok(a.queued&&b.queued);assert.deepEqual(s.stock,before);assert.equal(queuedJobs(s.stations[station]).length,2);assert.equal(cook(s,menu).ok,false);
  assert.ok(dispatch(s,{type:'cook.cancel',jobId:a.jobId}).ok);assert.equal(queuedJobs(s.stations[station])[0].id,b.jobId);
  assert.ok(cook(s,menu).queued);assert.equal(queuedJobs(s.stations[station])[0].id,b.jobId);
 }
 const restored=deserialize(serialize(s));assert.ok(restored.ok);s=restored.state;assert.equal(cafeCapacity(s).queueSlots,cap.queueSlots);assert.equal(queuedJobs(s.stations.drink).length,2);assert.equal(queuedJobs(s.stations.oven).length,2);
});

test('합류한 윤달·무성·서한비·데스티노바는 매 인연 랭크마다 각자의 효과가 더해진다',async()=>{
 const {castBondStory}=await import('../src/story/career.js');const ids=['yun','museong','seohanbi','solv','bambi','lune','raven'];
 for(const id of ids){const s=createGame(),b=BONDS[id],key=Object.keys(b.rankFx.fx)[0],step=b.rankFx.fx[key];s.bondRank[id]=1;const before=bondFx(s)[key];
  s.roster[id]={usableFrom:s.day};const after=bondFx(s)[key];assert.ok(Math.abs(after-before-step)<1e-8,`${id} 합류 후 적용`);
  for(let rank=1;rank<=10;rank++){s.bondRank[id]=rank;const v=bondFx(s)[key];s.bondRank[id]=rank-1;assert.ok(bondFx(s)[key]<v,`${id} Rank ${rank}`);}
  for(let tier=1;tier<=4;tier++)assert.ok(castBondStory(id,tier)?.length>5,`${id} 이야기 ${tier}`);
 }
});
