import { TEMP } from '../config/balance.temp.js';
const C = TEMP.HUNT_CAREER;
// run/build 레벨과 분리한 누적 성장. 원작 참고 구현의 50레벨 상한은 적용하지 않는다.
export function hunterProgress(totalXP = 0) {
  const total = Number.isSafeInteger(totalXP) && totalXP >= 0 ? totalXP : 0;
  const a = C.xpStep / 2, b = C.xpBase - a;
  const completed = Math.floor((Math.sqrt(b * b + 4 * a * total) - b) / (2 * a));
  const spent = a * completed * completed + b * completed;
  return { level: completed + 1, totalXP: total, xp: total - spent, xpNext: C.xpBase + C.xpStep * completed };
}
// 갈 수 있는 단계 = 보스를 쓰러뜨려 연 단계까지(사냥꾼 레벨로는 열리지 않는다). 옛 저장의 maxStage 는 그대로 둔다
export const maxHuntDepth = state => Math.min(100, Math.max(state.hunter.maxStage || 1, 1));
export const stageName = depth => depth >= 85 ? '흑월의 균열' : depth >= 55 ? '변이 청토끼의 회랑' : depth >= 35 ? '청토끼의 밤길' : '달그늘';
export function depthScale(depth, calendarScale, monthIdx) {
  return { hp: calendarScale.hp * (1 + .08 * (depth - 1) + .0015 * (depth - 1) ** 2), dmg: calendarScale.dmg * (1 + .025 * (depth - 1)), reward: 1 + C.depthReward * (depth - 1) + C.monthReward * Math.min(11, monthIdx) };
}
export const huntMoonReward = (base, scale) => Math.max(base, Math.ceil(base * (scale?.reward ?? 1)));
