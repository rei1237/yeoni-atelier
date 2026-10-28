import {yeoniEffects} from './yeoni-growth.js';
import {pendingBranchStory} from './branches.js';
// 달력: 정규 영업 1회 = 한 순(상순·중순·하순). 3순이 한 달, 3월에서 시작해 정해진 달까지 간다(프린세스 메이커식 월 단위 진행).
// 하순 영업을 마치면 청토끼 금융 이자가 나간다. 마지막 순을 마치면 결말이 정해지고, 그 뒤로는 후일담(자유 영업)이다.
// 순 수·시작 달·이자율·행동력은 모두 임시값(TEMP.CALENDAR). 달·이자·결말은 게임 오리지널 설정이다.

import { TEMP } from '../config/balance.temp.js';
import { PDF } from '../config/balance.pdf.js';
import { emit } from './state.js';
import { giftSupply, giftFreeEnhance } from './moka-armory.js';
import { BONDS, BOND_IDS, bondFx, perkTier } from '../data/bonds.js';
import { advanceFarm } from './farm.js';
import { cafeProgress } from './cafe-growth.js';
import { grantEventOutfits } from './outfits.js';
import { HANBI_STAGES } from '../data/hunt-stages.js';
import { placeLock, PLACE_NAMES, bondOpen, bondMasked } from './unlocks.js';
import { interestDue, pendingRateStory, grantHikeGrowth } from './creditor.js';

const C = TEMP.CALENDAR;
export const PARTS = Object.freeze(['상순', '중순', '하순']);
// 양력 달의 대략적인 월지(절기 기준 근사). 사주 세계관 분위기용 표시.
const BRANCH = Object.freeze({ 1: '축', 2: '인', 3: '묘', 4: '진', 5: '사', 6: '오', 7: '미', 8: '신', 9: '유', 10: '술', 11: '해', 12: '자' });

// day(1부터) → 달력 위치
export function calendarOf(day) {
  const i = Math.max(0, day - 1);
  const monthIdx = Math.floor(i / C.TURNS_PER_MONTH);
  const m0 = C.START_MONTH - 1 + monthIdx;
  return { turn: i, monthIdx, part: i % C.TURNS_PER_MONTH, month: (m0 % 12) + 1, year: 1 + Math.floor(m0 / 12) };
}

// 운영 기간은 저장마다 기록한다(새 게임 2년 72순, 옛 저장은 180순일 수 있다)
export const totalTurns = state => state?.calendar?.totalTurns || C.TOTAL_TURNS;
export const totalMonths = state => Math.ceil(totalTurns(state) / C.TURNS_PER_MONTH);
export const turnsLeft = state => Math.max(0, totalTurns(state) - (state.day - 1));
export const isEnded = state => !!state.calendar?.ended;

export function dateLabel(state, day = state.day) {
  if (isEnded(state)) return `후일담 ${day - totalTurns(state)}일째`;
  const c = calendarOf(day);
  return `운영 ${1 + Math.floor(c.monthIdx / 12)}년차 ${c.month}월(${BRANCH[c.month]}월) ${PARTS[c.part]}`;
}

export function monthName(monthIdx) {
  const m0 = C.START_MONTH - 1 + monthIdx;
  return `${(m0 % 12) + 1}월`;
}

// ── 행동력(AP): 순마다 채워진다. 사냥·대화에 쓴다.
export const maxActionPoints = state => C.AP_PER_TURN + Math.floor((cafeProgress(state).level - 1) / 3) + bondFx(state).ap + yeoniEffects(state).ap;
export function apCheck(state, cost = 1) {
  if ((state.ap?.left ?? 0) < cost) return { ok: false, reason: `행동력이 부족합니다 (이번 순 남은 행동력 ${state.ap?.left ?? 0}) · 영업을 마치면 다시 채워져요` };
  return { ok: true };
}

export function spendAp(state, cost = 1) {
  state.ap.left -= cost;
}

// ── 하순 영업 마감 때 한 번: 이자 = 남은 빚 × 이자율(올림). 골드로 내고 모자라면 빚에 붙는다.
export function chargeInterest(state, sh) {
  if (isEnded(state)) return null;
  const c = calendarOf(sh.day);
  if (c.part !== C.TURNS_PER_MONTH - 1) return null;
  const key = `m${c.monthIdx}`;
  if (state.ledger.interest[key]) return state.ledger.interest[key];
  // 이자율은 청토끼 인상 일정(creditor.js)을 따르고, 루나의 검산(친밀도 능력)만큼 줄어든다
  const due = interestDue(state, c.monthIdx);
  const paid = Math.min(due, Math.max(0, state.gold));
  const added = due - paid;
  state.gold -= paid;
  state.debt += added;
  const rec = { month: c.month, due, paid, added, debt: state.debt };
  state.ledger.interest[key] = rec;
  if (due > 0) emit('interestCharged', rec);
  return rec;
}

// ── 결말: 남은 빚과 동료 친밀도로 고른다. 청토끼·서한비·윤달의 결말은 쓰지 않는다(원작 방침).
export function decideEnding(state) {
  const start = state.startingDebt || PDF.INITIAL_DEBT;
  const bonds = Object.values(state.affinity || {}).reduce((a, b) => a + b, 0);
  if (state.debt <= 0 && !(state.payroll?.arrears>0) && !(state.finance?.balance>0)) return bonds >= C.ENDING_BOND_BEST ? 'grand' : 'clear';
  if (state.debt <= start * 0.4) return 'close';
  return 'extend';
}

// 결산을 닫고 다음 순으로 넘어갈 때(shift.closeSettlement 에서 부른다)
export function advanceTurn(state) {
  advanceFarm(state);
  const fx = bondFx(state);
  state.ap = { left: maxActionPoints(state), talked: {}, gifted: {}, shopped: false, delegated: {}, sheltered: {}, neoTask: null };
  // 모카 ♥3: 순마다 밤이슬
  if (fx.dailyDew > 0) {
    state.stock.night_dew = (state.stock.night_dew || 0) + fx.dailyDew;
    state.stats.nightDewObtained += fx.dailyDew;
  }
  if (!isEnded(state) && state.day > totalTurns(state)) {
    const endingId = decideEnding(state);
    state.calendar = { ...state.calendar, ended: true, endingId, endedDebt: state.debt };
    emit('gameEnded', { endingId });
  }
}

// 이번 순에 아직 안 본 달 이야기(매달 상순 준비 때 한 번). id 는 UI 가 story.seen 으로 기록한다.
import {pendingBloomStory} from './hunt-cast.js';

export function pendingStory(state) {
  if (state.mode !== 'prep') return null;
  // 후일담: 결말을 본 뒤에도 인연 이야기는 이어진다
  if (isEnded(state)) return state.calendar.endingId && !state.ledger.story[`ending:${state.calendar.endingId}`] ? `ending:${state.calendar.endingId}` : pendingHanbiStory(state) || pendingBloomStory(state) || pendingBondStory(state) || pendingBranchStory(state);
  const c = calendarOf(state.day);
  const id = `m${c.monthIdx}`;
  if (!state.ledger.story[id]) return id;
  const rate = pendingRateStory(state); // 청토끼 이자율 인상은 그달 이야기 바로 다음
  if (rate) return rate;
  // 첫 영업을 마친 뒤에야 「돈 벌어 와, 네오!」가 나온다
  if (!state.huntUnlocked && !state.ledger.story['ev:hunt'] && state.stats.shiftsCompleted >= 1) return 'ev:hunt';
  // 첫 원정에서 돌아오면 네오의 투정 → 청토끼 환전, 그다음 윤달 공방의 첫 강화로 이어진다
  if (state.ledger.story['ev:hunt'] && !state.ledger.story['ev:return'] && state.stats.huntsCompleted >= 1) return 'ev:return';
  if (state.ledger.story['ev:return'] && !state.ledger.story['ev:forge'] && !placeLock(state, 'gear')) return 'ev:forge';
  return pendingHanbiStory(state) || pendingBloomStory(state) || pendingBondStory(state) || pendingBranchStory(state);
}

// 네오가 30·40·50·70·100단계를 처음 클리어하면 귀환 뒤 검은 호랑이 사건을 순서대로 하나씩 튼다(건너뛸 수 없다)
export function pendingHanbiStory(state) {
  if (state.roster.seohanbi) return null;
  for (const n of HANBI_STAGES) {
    if (state.ledger.story[`hanbi:${n}`]) continue;
    return state.ledger.rewards[`stage:neo:${n}`] ? `hanbi:${n}` : null;
  }
  return null;
}

// 아직 안 본 인연 이야기 id(낮은 단계부터). 달 이야기를 본 뒤에 나온다.
export function pendingBondStory(state) {
  for (const id of BOND_IDS) {
    if (!bondOpen(state, id) || bondMasked(state, id)) continue; // 정체를 밝히기 전 서한비의 인연 이야기는 영입 뒤에
    const t = perkTier(state, id);
    for (let k = 1; k <= t; k++) if (!state.ledger.story[`bond:${id}:${k}`]) return `bond:${id}:${k}`;
  }
  return null;
}

export function markStory(state, id) {
  // 프롤로그는 새 게임의 도입부이며 달 이야기·보상과 별도로 기록한다.
  if(id==='prologue'){if(state.ledger.story.prologue)return {ok:true,duplicate:true};if(state.mode!=='prep')return {ok:false,reason:'영업 준비 중에만 볼 수 있어요'};state.ledger.story.prologue=true;return {ok:true};}
  if (typeof id !== 'string' || !/^(m\d+|ending:\w+|ev:[a-z]+|bond:\w+:\d+|hanbi:\d+|rate:\d+|branch:[2-5])$/.test(id)) return { ok: false, reason: '없는 이야기입니다' };
  if (state.ledger.story[id]) return { ok: true, duplicate: true };
  if (state.mode !== 'prep' || pendingStory(state) !== id) return { ok: false, reason: '지금 볼 수 있는 이야기가 아닙니다' };
  const farmLocked = id === 'm1' && !!placeLock(state, 'farm');
  state.ledger.story[id] = true;
  if (farmLocked) emit('placeUnlocked', { id: 'farm', name: PLACE_NAMES.farm });
  if (id === 'm2') {
    state.hostbar = { open: true, openedDay: state.day };
    if (!state.ledger.rewards['outfit:host_first']) {
      state.ledger.rewards['outfit:host_first'] = true;
      if (!state.outfits.owned.includes('host_first')) state.outfits.owned.push('host_first');
      emit('outfitUnlocked', { id: 'host_first', name: '달빛 첫인사' });
    }
  }
  if (id === 'ev:hunt') {
    state.huntUnlocked = true;
    // 루나 언니의 도시락: 첫 원정은 회복 수프 1개를 들고 출발한다(원장 1회)
    if (!state.ledger.rewards['supply:first_lunch']) { state.ledger.rewards['supply:first_lunch'] = true; giftSupply(state, 'tonic', 1); emit('supplyGift', { id: 'tonic', label: '루나 언니의 도시락 · 회복 수프 1개를 챙겼어요' }); }
  }
  if (id === 'ev:forge' && !state.ledger.rewards['armory:first_free']) { state.ledger.rewards['armory:first_free'] = true; giftFreeEnhance(state); emit('supplyGift', { id: 'enhance', label: '윤달의 선물 · 첫 강화 1회 무료' }); }
  if (id.startsWith('rate:')) grantHikeGrowth(state, Number(id.slice(5)));
  grantEventOutfits(state, id);
  const destination = id === 'ev:hunt' ? (placeLock(state, 'hunt') ? null : 'hunt') : id === 'ev:return' ? 'finance' : id === 'ev:forge' ? 'gear' : null;
  return { ok: true, ...(destination ? { destination } : {}) };
}
