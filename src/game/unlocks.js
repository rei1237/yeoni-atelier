// 장소 개방 순서(게임 오리지널): 3월 첫 영업 → 「돈 벌어 와, 네오!」 → 사냥 1회 뒤 윤달의 무기 공방, 4월 이야기(m1) 뒤 농장.
// 잠겨 있으면 이유 문자열, 열려 있으면 ''. UI 잠금 표시와 엔진 거절이 같은 판정을 쓴다.
export const PLACE_NAMES = Object.freeze({ hunt:'달그늘 사냥터', gear:'윤달의 무기 공방', farm:'꽃돼지 연이의 농장' });
export function placeLock(state, id) {
  if (id === 'hunt') return state.huntUnlocked ? '' : state.stats.shiftsCompleted >= 1 ? '「돈 벌어 와, 네오!」 이야기를 보면 열려요' : '첫 영업을 마치면 사냥터 이야기가 열려요';
  // 기존 저장: 장비·강화 기록이 있으면 열린 것으로 본다
  if (id === 'gear') return state.stats.huntsCompleted >= 1 || state.gear?.owned?.length || Object.keys(state.armory?.upgrades || {}).length ? '' : '네오가 달그늘 사냥터에 한 번 다녀오면 열려요';
  // 기존 저장: 농사 경험이나 심은 밭이 있으면 열린 것으로 본다
  if (id === 'farm') return state.ledger.story.m1 || state.farm?.xp > 0 || state.farm?.plots?.some(Boolean) ? '' : '4월에 강가에 꽃이 피면 밭을 일궈요';
  return '';
}
