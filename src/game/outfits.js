import { OUTFITS } from '../data/outfits.js';
import { emit } from './state.js';
export function grantOutfit(state, id) {
  if (!OUTFITS[id] || state.outfits.owned.includes(id) || state.ledger.rewards[`outfit:${id}`]) return false;
  state.outfits.owned.push(id); state.ledger.rewards[`outfit:${id}`] = true;
  emit('outfitUnlocked', { id, name: OUTFITS[id].name });
  return true;
}
export function grantEventOutfits(state, eventKey) {
  for (const item of Object.values(OUTFITS)) if (item.unlock?.type === 'event' && item.unlock.key === eventKey) grantOutfit(state, item.id);
}
export function unlockOutfit(state, id) {
  if (state.mode !== 'prep') return { ok: false, reason: '의상은 영업 준비 중에 해금할 수 있어요' };
  const item = OUTFITS[id];
  if (!item) return { ok: false, reason: '없는 의상이에요' };
  if (state.outfits.owned.includes(id) || state.ledger.rewards[`outfit:${id}`]) return { ok: false, reason: '이미 보유한 의상이에요' };
  if (item.unlock?.type !== 'moonstone') return { ok: false, reason: item.hint || '이야기로 만나는 의상이에요' };
  if (state.moonstone < item.unlock.cost) return { ok: false, reason: `월정석 ${item.unlock.cost}개가 필요해요` };
  state.moonstone -= item.unlock.cost;
  grantOutfit(state, id);
  return { ok: true };
}
