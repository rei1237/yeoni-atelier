// 확정 규칙 — 사용자 요구사항과 기획서 v2.0의 "확정 조건".
// 밸런스 조정 대상이 아니다. 플레이테스트 중에도 바꾸지 않는다.
// (조정 가능한 값은 balance.pdf.js / balance.temp.js 에 있다.)

export const STAT_KEYS = Object.freeze(['empathy', 'talk', 'fun', 'looks']);
export const STAT_LABELS = Object.freeze({ empathy: '공감력', talk: '화술', fun: '재미', looks: '외모' });

export const RULES = Object.freeze({
  // 정규 영업: 활성 게임 시간 1,800초. 라운드로 나누지 않는다.
  SHIFT_MS: 1800 * 1000,
  // 지명: 수락 순간부터 정확히 300초. 이동 연출 포함.
  NOMINATION_MS: 300 * 1000,
  // 새 지명은 경과 25:00까지 수락 가능(= 잔여 300초 이상).
  LAST_ACCEPT_ELAPSED_MS: 1500 * 1000,

  STAT_MIN: 0,
  STAT_MAX: 10,
  PREF_TOTAL: 100,

  // H0 = clamp(M + 대화 보정 - 지명 대기 불만, 0, 100)
  TALK_BONUS_MIN: -5,
  TALK_BONUS_MAX: 5,
  WAIT_PENALTY_MIN: 0,
  WAIT_PENALTY_MAX: 20,

  // 기본 팁 = floor(실제 서빙 주문금액 × 0.4 × (H - 50) / 50), 최종 H ≥ 60 일 때만.
  TIP_RATE: 0.4,
  TIP_PIVOT: 50,
  TIP_MIN_H: 60,
  FEVER_TIP_MULTIPLIER: 2,

  // 피버
  FEVER_GAUGE_MAX: 100,
  FEVER_DURATION_MS: 20 * 1000,
  FEVER_MAX_TABLES: 3,
  FEVER_GAIN_H90: 24,
  FEVER_GAIN_H80: 20,
  FEVER_GAIN_H60: 12,
  FEVER_GAIN_SPECIAL: 8,

  // 첫 구성
  TABLE_COUNT: 5, // 사용자 결정 2026-10-25: 시작 테이블 세트 5개
  TRAY_SLOTS: 3,
  STATION_SLOTS: 2, // 현재 작업 1 + 다음 작업 1

  // 새 게임의 접대 가능 동료는 네오 한 명.
  STARTING_ROSTER: Object.freeze(['neo']),
});

// 네오의 고정 능력치(사용자 확정). 의상·음식·피버로 바뀌지 않는다.
export const NEO_STATS = Object.freeze({ empathy: 7, talk: 10, fun: 0, looks: 10 });

// 핵심 조건 상한(사용자 확정): 어떤 항목이든 선호 ≥ 40% 이고 능력치 < 3 이면 H = min(H0, 39).
export const CORE_CAP = Object.freeze({ PREF_MIN: 40, STAT_BELOW: 3, H_MAX: 39 });
