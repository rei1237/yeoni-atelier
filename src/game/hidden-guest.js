import { farmLevel } from '../data/farm.js';
// 서한비의 정체는 마지막 단서까지 숨긴다. 조건은 게임 오리지널이다.
export function hiddenGuestQuest(state) {
  const steps = [
    { text:'두 번째 봄을 맞이하기', done:state.day > 36 },
    { text:'농장 레벨 5 · 밤에도 피는 정원', done:farmLevel(state.farm) >= 5 },
    { text:'네오와 인연 3단계 · 믿을 만한 소개', done:(state.affinity.neo || 0) >= 180 },
    { text:'사냥에서 5분 생존 · 검은 발자국', done:(state.stats.longestHuntMs || 0) >= 300000 },
    { text:'거대한 검은 손 3회 처치 · 붉은 봉인', done:(state.stats.huntBosses || 0) >= 3 },
  ];
  return { steps, ready:steps.every(s=>s.done), known:!!state.roster.seohanbi };
}
