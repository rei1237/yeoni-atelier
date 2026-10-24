// 오프라인 운영 인터페이스(1단계: 지급 없음).
// 저장 칸 state.offline.lastWallMs 에 마지막 활동 시각만 기록한다. 임의의 시간당 골드를 주지 않는다.
// 나중에 규칙이 정해지면 estimateOfflineIncome 만 구현하면 된다.

export function recordWallClock(state, wallMs) {
  state.offline.lastWallMs = wallMs;
}

export function estimateOfflineIncome(state, wallMs) {
  const awayMs = state.offline.lastWallMs == null ? 0 : Math.max(0, wallMs - state.offline.lastWallMs);
  return { awayMs, gold: 0, implemented: false, note: '오프라인 수익은 1단계 범위 밖입니다(지급 없음)' };
}
