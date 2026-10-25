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
export const maxHuntDepth = state => 1 + Math.floor((hunterProgress(state.hunter.xp).level - 1) / C.levelsPerDepth);
export function depthScale(depth, calendarScale, monthIdx) {
  return { hp: calendarScale.hp * (1 + C.depthHp * (depth - 1)), dmg: calendarScale.dmg * (1 + C.depthDamage * (depth - 1)), reward: 1 + C.depthReward * (depth - 1) + C.monthReward * Math.min(11, monthIdx) };
}
export const huntMoonReward = (base, scale) => Math.max(base, Math.ceil(base * (scale?.reward ?? 1)));
