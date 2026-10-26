import { drawPortrait } from '../render/sprite-renderer.js';
const clocks = new WeakMap();
export function portraitFrame({ now, talking = false, blinking = false, pauseUntil = 0, reduced = false }) {
  if (reduced) return 0;
  if (blinking) return 1;
  return talking && now >= pauseUntil ? [2, 3, 2, 0][Math.floor(now / 110) % 4] : 0;
}
// 소설·드레스룸·SOS·토스트 공용. 받은 표시 정보만 사용하고 게임 상태에 접근하지 않는다.
export function paintTalkingPortrait(canvas, { key, expression = 'normal', talking = false, now = performance.now(), pauseUntil = 0, reduced = false }) {
  let clock = clocks.get(canvas);
  if (!clock) { clock = { blinkAt: now + 2000 + Array.from(key).reduce((sum,c)=>sum+c.charCodeAt(0),0)%3000, last: -Infinity }; clocks.set(canvas, clock); }
  if (now - clock.last < 100) return;
  clock.last = now;
  if (now > clock.blinkAt + 160) clock.blinkAt = now + 2000 + Array.from(key).reduce((sum,c)=>sum+c.charCodeAt(0),0)%3000;
  const frame = portraitFrame({ now, talking, blinking: now >= clock.blinkAt && now < clock.blinkAt + 160, pauseUntil, reduced });
  drawPortrait(canvas.getContext('2d'), key, expression, canvas.width, canvas.height, { frame, talkingSheet:true });
}
