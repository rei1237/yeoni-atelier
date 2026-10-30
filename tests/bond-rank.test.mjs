// 페르소나식 인연 랭크: 점수는 문턱만 채우고 랭크는 대화로 하나씩 오른다, 능력은 랭크 3·6·8·10에서 해방
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMP } from '../src/config/balance.temp.js';
import { createGame } from '../src/game/state.js';
import { dispatch } from '../src/game/engine.js';
import { serialize, deserialize } from '../src/core/save.js';
import { bondQuestion } from '../src/data/bond-dialogues.js';
import { bondRank, bondReady, perkTier, bondFx, withWa } from '../src/data/bonds.js';
import { sheetHtml } from '../src/ui/sheets.js';

const R = TEMP.BONDS.RANKS;
const talkTo = (s, id) => { s.ap.left = 4; s.ap.talked = {}; s.bondRankAt = {}; const q = bondQuestion(s, id); return dispatch(s, { type: 'bond.talk', id, choiceId: q.answers[0].id, token: q.token }); }; // 테스트 준비: 순마다 한 번 제한을 풀어 연달아 대화

test('점수만으로는 랭크가 오르지 않고, 문턱을 넘는 순간 한 번만 알린다', () => {
  const s = createGame(); s.gold = 10000;
  s.affinity.moka = R[0] - 1; // 테스트 준비
  const r = dispatch(s, { type: 'bond.gift', id: 'moka', giftId: 'moon_bun' });
  assert.ok(r.ok, r.reason);
  assert.equal(bondRank(s, 'moka'), 0); assert.ok(bondReady(s, 'moka'));
  assert.equal(r.events.filter(e => e.type === 'bondReady').length, 1);
  s.affinity.moka = R[5]; // 테스트 준비: 점수가 여러 문턱을 넘어도
  assert.equal(bondRank(s, 'moka'), 0, '랭크는 대화 전까지 그대로');
});

test('문턱을 채운 동료와 대화하면 랭크가 하나 오르고, 랭크 3에서 첫 능력이 해방된다', () => {
  const s = createGame();
  s.affinity.neo = R[5]; // 테스트 준비: 랭크 6까지 채울 점수
  for (let k = 1; k <= 2; k++) { const r = talkTo(s, 'neo'); assert.ok(r.ok, r.reason); assert.equal(r.rankUp.rank, k); assert.equal(r.rankUp.perk, null); }
  assert.equal(perkTier(s, 'neo'), 0); assert.equal(bondFx(s).huntHp, 0);
  const up = talkTo(s, 'neo');
  assert.equal(up.rankUp.rank, 3); assert.ok(up.rankUp.perk); assert.equal(up.rankUp.next.rank, 6);
  assert.ok(up.events.some(e => e.type === 'bondRankUp' && e.rank === 3));
  assert.equal(perkTier(s, 'neo'), 1); assert.ok(bondFx(s).huntHp > 0);
  s.affinity.neo = R[2]; // 테스트 준비: 랭크 3 문턱만 채운 점수
  const plain = talkTo(s, 'neo');
  assert.equal(plain.rankUp, null, '문턱을 채우지 못한 대화는 점수만 쌓는다'); assert.equal(bondRank(s, 'neo'), 3);
});

test('랭크 이전 저장은 점수만큼의 랭크로 이어져 열려 있던 능력을 잃지 않는다', () => {
  const s = createGame(); s.affinity.luna_sis = TEMP.BONDS.LEGACY_RANKS[7]; // 옛 ♥3(180점)
  const data = JSON.parse(serialize(s)); delete data.bondRank;
  const back = deserialize(JSON.stringify(data)).state;
  assert.equal(bondRank(back, 'luna_sis'), 8); assert.equal(perkTier(back, 'luna_sis'), 3);
});

test('인연 카드는 아르카나·랭크·다음 랭크까지 남은 점수·능력 목록을 보여 준다', () => {
  const s = createGame(); s.affinity.neo = R[0] - 5; // 테스트 준비
  let html = sheetHtml(s, { sheet: { kind: 'companions' }, companionId: 'neo' });
  assert.match(html, /VIII · 힘/); assert.match(html, /RANK/); assert.match(html, /다음 랭크까지 5점/); assert.match(html, /Rank 3[\s\S]*Rank 6[\s\S]*Rank 8[\s\S]*Rank 10/);
  s.affinity.neo = R[0]; html = sheetHtml(s, { sheet: { kind: 'companions' }, companionId: 'neo' });
  assert.match(html, /랭크 업 대화/);
  html = sheetHtml(s, { sheet: { kind: 'rankup', up: { id: 'neo', rank: 3, arcana: ['VIII', '힘'], perk: '사냥 시작 HP +40', next: { rank: 6, label: '다음' }, story: true } } });
  assert.match(html, /RANK UP/); assert.match(html, /능력 해방/); assert.match(html, /네오와의 인연 · Rank 3/);
  assert.equal(withWa('윤달'), '윤달과'); assert.equal(withWa('루나'), '루나와');
});

test('조건을 채우면 같은 달에도 랭크가 오르고 저장해도 이미 오른 랭크는 내리지 않는다', () => {
  let s = createGame();
  const talkOnce = (st, id) => { st.ap.left = 4; st.ap.talked = {}; const q = bondQuestion(st, id); return dispatch(st, { type: 'bond.talk', id, choiceId: q.answers[0].id, token: q.token }); }; // 테스트 준비: 순마다 한 번 제한만 푼다
  s.affinity.neo = R[5]; // 테스트 준비: 랭크 6까지 채울 점수
  assert.equal(talkOnce(s, 'neo').rankUp.rank, 1);
  s = deserialize(serialize(s)).state;
  const same = talkOnce(s, 'neo');
  assert.equal(same.rankUp.rank, 2); assert.equal(bondRank(s, 'neo'), 2);
  assert.doesNotMatch(sheetHtml(s, { sheet: { kind: 'companions' }, companionId: 'neo' }), /다음 달 대화에서 랭크 업/);
  const old = createGame(); old.affinity.neo = 300; old.bondRank.neo = 10; // 옛 상한 300에서 이미 랭크 10
  const back = deserialize(serialize(old)).state;
  assert.equal(bondRank(back, 'neo'), 10); assert.equal(perkTier(back, 'neo'), 4);
});

test('네오는 어떤 답도 가능하고 다른 동료는 마음이 통하는 답이 랭크 조건이다',()=>{
  const s=createGame();s.affinity.neo=R[0];s.affinity.luna=R[0];
  const choose=(id,gain)=>{s.ap.left=4;s.ap.talked={};const q=bondQuestion(s,id),a=q.answers.find(x=>x.gain===gain);return dispatch(s,{type:'bond.talk',id,choiceId:a.id,token:q.token});};
  assert.equal(choose('neo',2).rankUp.rank,1);
  assert.equal(choose('luna',2).rankUp,null);
  assert.equal(choose('luna',6).rankUp.rank,1);
});
