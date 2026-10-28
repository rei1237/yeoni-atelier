import {gainYeoni} from './yeoni-growth.js';
// 친밀도: 대화(행동력 1, 순마다 한 사람 한 번)·선물(골드, 순마다 한 사람 한 번)·함께 일하기로 오른다.
// 단계가 열리면 능력(data/bonds.js)이 더해지고 인연 이야기가 한 번 나온다. 수치는 모두 임시값(TEMP.BONDS).

import { TEMP } from '../config/balance.temp.js';
import { BONDS, COMMON_GIFT, bondTier } from '../data/bonds.js';
import { bondQuestion } from '../data/bond-dialogues.js';
import { emit } from './state.js';
import { apCheck, spendAp } from './calendar.js';
import { townCheck } from './town.js';
import { changeStress } from './stress.js';

const B = TEMP.BONDS;

export function gainBond(state, id, v) {
  const before = state.affinity[id] || 0;
  const after = Math.min(B.MAX, before + v);
  state.affinity[id] = after;
  const t0 = bondTier(before), t1 = bondTier(after);
  if (t1 > t0) emit('bondUp', { id, tier: t1, label: BONDS[id].perks[t1 - 1].label });
  return after - before;
}

// 대화를 열 수 있는가(상태를 바꾸지 않는다). 화면은 이것으로 소설을 열고, 답을 고른 순간에만 talk 가 행동력을 쓴다.
export function talkCheck(state, id) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const b = BONDS[id];
  if (!b) return { ok: false, reason: '없는 동료입니다' };
  if (b.requiresRecruit && !state.roster[id]) return { ok: false, reason: '먼저 만남 이벤트로 영입해 주세요' };
  if (state.ap.talked[id]) return { ok: false, reason: `${b.name}와(과)는 이번 순에 이미 이야기했어요` };
  return apCheck(state, 1);
}

export function talk(state, id, choiceId, token) {
  const chk = talkCheck(state, id);
  if (!chk.ok) return chk;
  const question=bondQuestion(state,id), answer=question?.answers.find(a=>a.id===choiceId);
  if(!answer || token!==question.token)return {ok:false,reason:'대화에서 답을 골라 주세요'};
  spendAp(state, 1);
  changeStress(state, 'talk', id);
  state.ap.talked = { ...state.ap.talked, [id]: true };
  const v = gainBond(state, id, answer.gain);
  const speaker=id, line=answer.response;
  gainYeoni(state,'talk');emit('bondTalk', { id, speaker, line, gain: v });
  return { ok: true, gain: v, speaker, line };
}

export function gift(state, id, giftId) {
  const chk = townCheck(state);
  if (!chk.ok) return chk;
  const b = BONDS[id];
  if (!b) return { ok: false, reason: '없는 동료입니다' };
  if (b.requiresRecruit && !state.roster[id]) return { ok: false, reason: '먼저 만남 이벤트로 영입해 주세요' };
  const g = giftId === b.gift.id ? b.gift : giftId === COMMON_GIFT.id ? COMMON_GIFT : null;
  if (!g) return { ok: false, reason: '없는 선물입니다' };
  if (state.ap.gifted[id]) return { ok: false, reason: `${b.name}에게는 이번 순에 이미 선물했어요` };
  if (state.gold < g.cost) return { ok: false, reason: `골드가 부족합니다 (${g.cost} 필요, 보유 ${state.gold})` };
  state.gold -= g.cost;
  state.ap.gifted = { ...state.ap.gifted, [id]: true };
  const v = gainBond(state, id, g === b.gift ? B.GIFT_LIKED : B.GIFT_COMMON);
  changeStress(state, 'gift', id);
  gainYeoni(state,'gift');emit('bondGift', { id, giftId: g.id, gain: v, liked: g === b.gift });
  return { ok: true, gain: v, liked: g === b.gift };
}

// 함께 일한 몫: 영업 마감(루나·루나 언니), 사냥 마침(네오), 준비 중 재료 구매(모카, 순마다 한 번)
export function workShift(state) {
  gainBond(state, 'luna', B.WORK_SHIFT);
  gainBond(state, 'luna_sis', B.WORK_SHIFT);
  for (const id of Object.keys(state.roster)) if (BONDS[id]?.requiresRecruit && state.roster[id].usableFrom <= state.day) gainBond(state, id, B.WORK_SHIFT);
}

export function workHunt(state, done, who='neo') {
  gainBond(state, who, done ? B.WORK_HUNT : B.WORK_HUNT_DOWN);
}

export function workShop(state) {
  if (state.mode !== 'prep' || state.ap.shopped) return;
  state.ap.shopped = true;
  gainBond(state, 'moka', B.WORK_SHOP);
}
