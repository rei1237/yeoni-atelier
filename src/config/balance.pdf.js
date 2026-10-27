// 기획서 v2.0의 "제안 수치". 플레이테스트로 조정한다.
// 확정 규칙(rules.js)과 섞지 않는다. 각 값 옆에 기획서 쪽수를 남긴다.

export const PDF = Object.freeze({
  // p.8 조리 시간: 음료 12~18초 / 디저트 18~25초 / 따뜻한 음식 25~30초
  COOK_RANGE_MS: Object.freeze({
    drink: [12000, 18000],
    dessert: [18000, 25000],
    meal: [25000, 30000],
  }),
  // p.8 테이블 정리 8초. 정리 중에는 새 손님을 앉히지 않는다.
  CLEAN_MS: 500, // 2026-10-26 사용자 결정: 도착 후 0.5초 닦기
  // p.8 설비: 음료 머신 1, 오븐 1, 각 현재 1 + 다음 1, 완성 트레이 3칸

  // p.11 만족 판정 구간(설정 가능). 단, 핵심 조건 상한(39) < 만족 기준이어야 한다.
  GRADE: Object.freeze({ great: 80, good: 60, meh: 40 }),

  // p.10 손님 선호 유형(공감/화술/재미/외모, 합 100)
  PROFILES: Object.freeze([
    { id: 'looks', label: '외모 중심', prefs: { empathy: 10, talk: 25, fun: 5, looks: 60 } },
    { id: 'talk', label: '화술 중심', prefs: { empathy: 15, talk: 60, fun: 5, looks: 20 } },
    { id: 'empathy', label: '공감 중심', prefs: { empathy: 60, talk: 15, fun: 15, looks: 10 } },
    { id: 'fun', label: '재미 중심', prefs: { empathy: 15, talk: 15, fun: 60, looks: 10 } },
    { id: 'funmix', label: '재미 요구 혼합형', prefs: { empathy: 0, talk: 30, fun: 40, looks: 30 } },
  ]),

  // p.9 접대 리듬(수락 기준 경과 ms)
  HOSTING_RHYTHM_MS: Object.freeze({
    greet: [0, 30000],
    talk: [30000, 90000],
    help: [90000, 180000],
    extraOrder: [180000, 270000],
    wrap: [270000, 300000],
  }),

  // p.19 경제 검산 예시의 가정(목표치가 아니다. 가격 범위의 참고값으로만 사용)
  REF_REGULAR_ORDER: 160,
  REF_NOMINATED_ORDER: 300,
  REF_INGREDIENT_RATIO: 0.4,
  REF_REGULAR_STAY_MS: 90000,

  // p.20 부채와 상환 단계
  INITIAL_DEBT: 120000,
  DEBT_STAGES: Object.freeze([
    { amount: 1000, label: '첫 장부' },
    { amount: 9000, label: '가게 정상화' },
    { amount: 15000, label: '특별 메뉴' },
    { amount: 25000, label: '입소문' },
    { amount: 30000, label: '데스티노바의 명소' },
    { amount: 40000, label: '완납' },
  ]),

  // p.17 재료 사냥: 약 3분, 특별 메뉴 약 6~10회분
  HUNT_MS: 180000,
  HUNT_SPECIAL_SERVINGS: Object.freeze([6, 10]),
});
