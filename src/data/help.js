// SOS의 정답은 손님 선호로 결정한다. 선택지 데이터와 판정은 UI·자동 운영에서 함께 쓴다.
import { STAT_KEYS } from '../config/rules.js';
import { TOPICS } from './lines.js';

export const HELP_SCENES = Object.freeze({
  topic: { prompt: '어떤 이야기를 꺼내면 좋을까?', choices: Object.entries(TOPICS) },
  listen: { prompt: '손님이 말을 멈췄어. 어떻게 기다릴까?', choices: [['listen', '말을 꺼낼 때까지 기다리기'], ['interrupt', '곧바로 다른 이야기하기'], ['rush', '빨리 말해 달라고 하기']] },
  photo: { prompt: '손님이 사진을 부탁했어.', choices: [['photo', '원하는 구도를 먼저 묻기'], ['rush', '서둘러 한 장 찍기'], ['refuse', '설명 없이 거절하기']] },
  refill: { prompt: '잔이 비었어. 홀의 도움이 필요해.', choices: [['luna', '루나에게 리필 요청하기'], ['delay', '조금 기다려 달라고 알리기'], ['ignore', '못 본 척 대화 이어가기']] },
  trouble: { prompt: '손님의 요구가 다른 테이블을 방해하고 있어.', choices: [['boundary', '정중하게 이용 범위 안내하기'], ['agree', '모든 요구를 들어주기'], ['ignore', '아무 말 없이 자리를 피하기']] },
  compliment: { prompt: '손님이 오늘의 응대를 칭찬했어.', choices: [['thanks', '고맙다고 차분하게 답하기'], ['return', '손님의 센스도 칭찬하기'], ['boast', '당연하다는 듯 받아들이기']] },
});
const top = prefs => STAT_KEYS.reduce((a, k) => prefs[k] > prefs[a] ? k : a, STAT_KEYS[0]);
export function bestHelpChoice(kind, prefs) {
  if (kind === 'topic') return top(prefs);
  if (kind === 'compliment') return ['talk', 'looks'].includes(top(prefs)) ? 'return' : 'thanks';
  return { listen: 'listen', photo: 'photo', refill: 'luna', trouble: 'boundary' }[kind];
}
export function helpQuality(kind, prefs, choice) {
  if (!HELP_SCENES[kind]?.choices.some(([id]) => id === choice)) return null;
  if (bestHelpChoice(kind, prefs) === choice) return 'good';
  if ((kind === 'refill' && choice === 'delay') || (kind === 'compliment' && choice !== 'boast')) return 'okay';
  return 'wrong';
}
export const HELP_REACTIONS = Object.freeze({
  good: ['고마워. 덕분에 자연스럽게 이어 갔어.', '편하게 이야기할 수 있어서 좋네요.'],
  okay: ['응, 일단 내가 이어 가 볼게.', '네, 잠시 기다릴게요.'],
  wrong: ['잠깐, 지금은 다른 방법이 좋겠어.', '제 이야기를 조금 더 들어 주세요.'],
});
