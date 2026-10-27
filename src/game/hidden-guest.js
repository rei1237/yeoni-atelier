import { HANBI_STAGES } from '../data/hunt-stages.js';
// 서한비의 정체는 마지막 사건까지 숨긴다. 단서 = 네오로 달그늘 단계를 처음 클리어하고 본 사건(게임 오리지널).
const CLUES = Object.freeze({ 30:'검은 발자국', 40:'빌려준 적 없는 등', 50:'붉은 봉인의 편지', 70:'혼자 지키는 문', 100:'붉은 봉인이 풀리는 밤' });
export function hiddenGuestQuest(state) {
  const steps = HANBI_STAGES.map(n => ({ stage:n, text:`네오로 달그늘 ${n}단계 클리어 · ${CLUES[n]}`, done:!!state.ledger.story[`hanbi:${n}`] }));
  return { revealed:!!state.roster.seohanbi||!!state.ledger.story['hanbi:30'], steps, next:steps.findIndex(s=>!s.done), ready:steps.every(s=>s.done), known:!!state.roster.seohanbi };
}
