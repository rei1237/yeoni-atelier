// 재료 구매·부채 상환·퀘스트·영입·의상. 보상은 모두 원장(ledger) id 로 한 번만 지급한다.

import { PDF } from '../config/balance.pdf.js';
import { INGREDIENTS, MENUS } from '../data/menus.js';
import { QUESTS } from '../data/quests.js';
import { OUTFITS, OUTFIT_SLOTS, OUTFIT_WEARERS } from '../data/outfits.js';
import { emit, recruitables } from './state.js';

// ── 재료 구매(기본 재료만). 영업 중에도 살 수 있다. 탐색 화면에서는 살 수 없다.
export function buy(state, ingredientId, qty) {
  if (state.mode === 'hunt') return { ok: false, reason: '탐색을 마친 뒤 구매할 수 있습니다' };
  const ing = INGREDIENTS[ingredientId];
  if (!ing || !ing.basic) return { ok: false, reason: '살 수 없는 재료입니다 (특별 재료는 탐색으로만 얻습니다)' };
  const n = Math.floor(qty);
  if (!(n > 0 && n <= 99)) return { ok: false, reason: '수량은 1~99 사이여야 합니다' };
  const cost = ing.price * n;
  if (state.gold < cost) return { ok: false, reason: `골드가 부족합니다 (${cost} 필요, 보유 ${state.gold})` };
  state.gold -= cost;
  state.stock[ingredientId] = (state.stock[ingredientId] || 0) + n;
  emit('bought', { ingredientId, qty: n, cost });
  return { ok: true, cost };
}

// ── 부채 상환. requestId 로 같은 요청을 두 번 처리하지 않는다(더블 탭·저장 복원 대비).
export function repay(state, amount, requestId) {
  if (!requestId) return { ok: false, reason: '상환 요청 id 가 없습니다' };
  if (state.ledger.repay[requestId] != null) return { ok: true, duplicate: true };
  if (state.mode === 'shift') return { ok: false, reason: '상환은 영업 전이나 마감 후에 할 수 있습니다' };
  const n = Math.floor(amount);
  if (!(n > 0)) return { ok: false, reason: '상환 금액을 입력해 주세요' };
  if (state.debt <= 0) return { ok: false, reason: '갚을 빚이 없습니다' };
  const pay = Math.min(n, state.debt);
  if (state.gold < pay) return { ok: false, reason: `골드가 부족합니다 (보유 ${state.gold})` };
  state.gold -= pay;
  state.debt -= pay;
  state.repaidTotal += pay;
  state.stats.repayCount += 1;
  state.ledger.repay[requestId] = pay;
  emit('repaid', { amount: pay, debt: state.debt });
  return { ok: true, amount: pay };
}

// 기획서 상환 단계(제안값)의 진행 표시
export function debtStage(state) {
  let acc = 0;
  for (let i = 0; i < PDF.DEBT_STAGES.length; i++) {
    const st = PDF.DEBT_STAGES[i];
    if (state.repaidTotal < acc + st.amount) return { index: i, label: st.label, paid: state.repaidTotal - acc, need: st.amount };
    acc += st.amount;
  }
  return { index: PDF.DEBT_STAGES.length, label: '완납', paid: 0, need: 0 };
}

// ── 보상(1회)
function grant(state, rewardId, reward) {
  if (state.ledger.rewards[rewardId]) return false;
  state.ledger.rewards[rewardId] = true;
  if (reward.gold) state.gold += reward.gold;
  if (reward.items) for (const [id, n] of Object.entries(reward.items)) state.stock[id] = (state.stock[id] || 0) + n;
  if (reward.learn) state.learned[reward.learn] = true;
  emit('reward', { rewardId, reward });
  return true;
}

// ── 퀘스트
export function questView(state) {
  const anyRecruitable = recruitables(state).length > 0;
  return QUESTS.filter(q => !q.hiddenUntilRecruitable || anyRecruitable).map(q => {
    const progress = Math.min(q.goal, state.stats[q.stat] || 0);
    const locked = q.requires && !state.quests.claimed[q.requires];
    const claimed = !!state.quests.claimed[q.id];
    return { ...q, progress, locked: !!locked, claimed, claimable: !claimed && !locked && progress >= q.goal };
  });
}

export function claimQuest(state, questId) {
  const q = questView(state).find(x => x.id === questId);
  if (!q) return { ok: false, reason: '없는 퀘스트입니다' };
  if (q.claimed) return { ok: false, reason: '이미 받은 보상입니다' };
  if (q.locked) return { ok: false, reason: '먼저 앞 퀘스트를 완료해 주세요' };
  if (q.progress < q.goal) return { ok: false, reason: `진행 ${q.progress}/${q.goal}` };
  state.quests.claimed[questId] = true;
  grant(state, `quest:${questId}`, q.reward);
  if (q.reward.learn) emit('learned', { menuId: q.reward.learn, name: MENUS[q.reward.learn].name });
  return { ok: true };
}

// ── 영입: 잠김 → 조건 충족(이벤트 가능) → 이벤트 완료 → 보상 1회 → 명단 추가 → 다음 영업부터 사용
export function recruitView(state) {
  return recruitables(state).map(c => {
    const r = state.recruitment[c.id] || { status: 'locked' };
    const cond = c.condition;
    const met = state.stats.shiftsCompleted >= cond.shiftsCompleted && state.stats.repayCount >= cond.repaidAtLeast;
    const status = r.status === 'recruited' ? 'recruited' : met ? 'available' : 'locked';
    return { id: c.id, name: c.name, devOnly: !!c.devOnly, status, condition: cond, meetEvent: c.meetEvent, reward: c.reward, usableFrom: state.roster[c.id]?.usableFrom ?? null };
  });
}

export function completeRecruit(state, id) {
  const v = recruitView(state).find(x => x.id === id);
  if (!v) return { ok: false, reason: '영입 대상이 아닙니다' };
  if (v.status === 'recruited') return { ok: false, reason: '이미 함께하는 동료입니다' };
  if (v.status !== 'available') return { ok: false, reason: `조건 미충족: 정규 영업 ${v.condition.shiftsCompleted}회 + 상환 ${v.condition.repaidAtLeast}회` };
  if (state.mode !== 'prep') return { ok: false, reason: '만남 이벤트는 영업 준비 중에만 진행할 수 있습니다' };
  state.recruitment[id] = { status: 'recruited', at: state.day };
  // 영업 준비 중의 day 는 "다음 영업 번호"이므로 다음 영업부터 접대에 쓸 수 있다
  state.roster[id] = { usableFrom: state.day };
  state.people[id] = { activity: 'idle', form: 'human', visitId: null, tableNo: null, endAt: null };
  state.stats.recruited += 1;
  grant(state, `recruit:${id}`, v.reward || {});
  emit('recruited', { id, name: v.name });
  return { ok: true };
}

// ── 의상(능력치 효과 없음)
export function equip(state, who, slot, itemId) {
  if (!OUTFIT_WEARERS.includes(who)) return { ok: false, reason: '의상을 입을 수 없는 대상입니다' };
  if (!OUTFIT_SLOTS.includes(slot)) return { ok: false, reason: '없는 칸입니다' };
  const eq = state.outfits.equipped[who];
  if (itemId == null) { eq[slot] = null; return { ok: true }; }
  const item = OUTFITS[itemId];
  if (!item || !state.outfits.owned.includes(itemId)) return { ok: false, reason: '가지고 있지 않은 의상입니다' };
  if ((slot === 'outfit') !== (item.slot === 'outfit')) return { ok: false, reason: slot === 'outfit' ? '의상 칸에는 옷만 넣을 수 있습니다' : '액세서리 칸에는 액세서리만 넣을 수 있습니다' };
  const other = slot === 'acc1' ? 'acc2' : slot === 'acc2' ? 'acc1' : null;
  if (other && eq[other] === itemId) eq[other] = null;
  eq[slot] = itemId;
  return { ok: true };
}

export { grant };
