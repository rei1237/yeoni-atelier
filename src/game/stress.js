// 임시 게임 수치. 능력치·만족도 공식과 분리하며 한계에 도달한 영업은 끝까지 쉬게 한다.
import { TEMP } from '../config/balance.temp.js';
import { emit } from './state.js';

export const stressStage = state => state.neoStress >= 100 || state.neoResting ? 'limit' : state.neoStress >= 60 ? 'tired' : 'calm';
export const stressLabel = state => ({ calm: '평온', tired: '지침', limit: '한계 · 이번 영업은 쉬어요' })[stressStage(state)];
export function changeStress(state, key) {
  const before = state.neoStress;
  state.neoStress = Math.max(0, Math.min(100, before + TEMP.NEO_STRESS[key]));
  if (state.mode === 'shift' && state.neoStress >= 100) state.neoResting = true;
  emit('neoStress', { before, value: state.neoStress, stage: stressStage(state) });
}
