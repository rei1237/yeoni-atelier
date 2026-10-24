// 저장 가능한 시드 난수(mulberry32). 상태는 정수 하나라 저장·복원 후에도 같은 흐름을 낸다.

export function nextRandom(rngState) {
  let t = (rngState.seed = (rngState.seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randRange(rngState, min, max) {
  return min + (max - min) * nextRandom(rngState);
}

export function randInt(rngState, min, maxInclusive) {
  return Math.floor(randRange(rngState, min, maxInclusive + 1));
}

export function pick(rngState, list) {
  return list[Math.floor(nextRandom(rngState) * list.length)];
}
