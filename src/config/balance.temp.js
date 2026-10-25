// 임시 구현 결정값. 기획서에 수치가 없어서 이번 프로토타입이 정한 값이다.
// 확정 규칙도, 기획서 제안 수치도 아니다. 플레이테스트로 바꾼다.

export const TEMP = Object.freeze({
  // ── 시뮬레이션
  SIM_STEP_MS: 100,           // 한 틱의 최대 시뮬레이션 간격
  FRAME_DT_CAP_MS: 250,       // 프레임 끊김 시 한 번에 진행할 최대 실제 시간
  AUTOSAVE_MS: 5000,          // 영업 중 자동 저장 간격(활성 시간 기준)

  // ── 손님
  SPAWN_FIRST_MS: 4000,
  SPAWN_INTERVAL_MS: Object.freeze([16000, 30000]),
  LAST_SEATING_ELAPSED_MS: 1680 * 1000, // 28:00 이후 새 손님 입장 없음
  NOMINATE_CHANCE: 0.38,
  ORDER_THINK_MS: 3000,       // 착석 후 주문까지
  EAT_MS: 26000,              // 일반 손님 식사 시간
  FOOD_PATIENCE_MS: 150000,   // 주문 후 이 시간 안에 못 받으면 떠남(매출 없음)
  NOMINATION_PATIENCE_MS: 45000, // 지명 요청을 이 시간 동안 처리 안 하면 일반 식사로 전환
  SERVE_BUFFER_MS: 10000,     // 늦은 주문 판단: 조리 시간 + 이 값이 남은 시간보다 길면 주문 안 함

  // ── 지명 대기 불만(0~20 범위 안의 임시 규칙)
  WAIT_PENALTY_GRACE_MS: 8000,
  WAIT_PENALTY_PER_MS: 3000,  // 유예 후 3초마다 1점

  // ── 접대 도움 요청(대화 보정 -5~+5 범위 안)
  HELP_AT_MS: Object.freeze([95000, 135000, 170000]), // 수락 기준
  HELP_WINDOW_MS: 15000,
  HELP_GAIN_GOOD: 2,
  HELP_GAIN_OK: 1,
  HELP_MISS: -1,
  EXTRA_ORDER_AT_MS: 190000,  // 추가 주문 시점(수락 기준)
  FEVER_EVAL_AT_MS: 60000,    // 방문당 첫 유효 평가 시점(수락 기준)

  // ── 이동
  WALK_TILES_PER_S: 3.2,
  CUSTOMER_TILES_PER_S: 2.4,

  // ── 경제
  START_GOLD: 600,
  START_STOCK: Object.freeze({ bean: 14, milk: 20, tea: 10, flour: 12, egg: 10, sugar: 18 }), // 첫 영업에서 30주문 안팎
  FIRST_REPAY_SUGGEST: 1000,  // 기획서 1단계 상환액과 같다
  KEEP_FOR_INGREDIENTS_HINT: 500,

  // ── 영입(임시 조건: 정규 영업 2회 완료 + 첫 상환)
  RECRUIT_CONDITION: Object.freeze({ shiftsCompleted: 2, repaidAtLeast: 1 }),

  // ── 월정석 사냥(영냥이). 사냥은 재료가 아니라 월정석을 떨어뜨리고, 재료는 마을 모카 식재료점에서 산다.
  HUNT: Object.freeze({
    // 무기·보조 능력·적 수치는 src/data/hunt-kit.js (모두 임시)
    PLAYER_SPEED: 165,        // px/s (필드 좌표)
    PLAYER_HP: 100,
    HURT_IFRAME_MS: 700,
    SUB_STEP_MS: 34,          // 탄이 적을 뚫고 지나가지 않도록 탐색 안에서 더 잘게 나눈다
    SPAWN_RATE_START: 0.7,    // 초당 생성 수(시간에 따라 선형 증가)
    SPAWN_RATE_END: 3.2,
    DENSITY_START: 5,         // 이 수보다 적으면 생성 속도 2배
    DENSITY_END: 45,
    MAX_ENEMIES: 90,
    HP_GROWTH: 1.7,           // 3분 끝에서 적 HP 배율 +170%
    MONTH_HP: 0.08,           // 달이 지날 때마다 적 HP +8% (3월 0, 다음 해 2월 +88%)
    MONTH_DMG: 0.04,          // 달마다 접촉 피해 +4%
    SPAWN_DIST: Object.freeze([380, 470]),
    XP_BASE: 5,               // 다음 레벨 필요 경험치 = XP_BASE + (L-1)×XP_STEP + (L-1)²×XP_CURVE (반올림)
    XP_STEP: 3,
    XP_CURVE: 0.6,
    CRIT_BASE: 0.05,
    CRIT_MULT: 2,
    KNOCKBACK: 140,
    MAGNET_RADIUS: 95,
    PICKUP_RADIUS: 26,
    GEM_CAP: 140,             // 넘으면 새 별조각을 기존 별조각에 합친다
    HEAL_FISH: 30,
    BOMB_RADIUS: 280,
    BOMB_DAMAGE: 200,
    POWER_DROP: Object.freeze([ // 일반 적 처치 시 확률
      { id: 'fish', chance: 0.012 },
      { id: 'magnet', chance: 0.005 },
      { id: 'bomb', chance: 0.005 },
    ]),
    MOON_DROP: Object.freeze({ chance: 0.06, elite: 10, boss: 60 }), // 일반 적 확률 1개, 정예·보스는 고정 개수(임시)
    FIELD_W: 1400,
    FIELD_H: 1800,
  }),

  // ── 마을(임시). 월정석 환전·모카 긴급 배달·가게 확장
  MOONSTONE_GOLD: 35,         // 루나의 저울: 월정석 1개 = 35G
  DELIVERY_FEE_RATE: 0.25,    // 영업 중 모카 긴급 배달 = 재료값 +25%
  TABLE_PRICE_BASE: 2500,     // 4번 테이블 값. 한 개 들일 때마다 ×1.6 (2,500 → 4,000 → 6,400 …)
  TABLE_PRICE_GROWTH: 1.6,
  MAX_TABLES: 10,
  AREA_COSTS: Object.freeze([6000, 18000, 40000]), // 공방 증축: 연 구역 수에 따라 오른다
  SPAWN_TABLE_BASE: 3,        // 테이블이 이보다 많으면 손님 간격이 테이블 수에 비례해 짧아진다
  DECOR_PRICES: Object.freeze({ plant: 400, lamp: 700, bookshelf: 1200, rug: 1500 }),

  // ── 달력·이자·행동력(임시). 영업 1회 = 한 순, 3순 = 한 달. 3월부터 12달(36순) 뒤 결말.
  CALENDAR: Object.freeze({
    START_MONTH: 3,
    TURNS_PER_MONTH: 3,
    TOTAL_TURNS: 36,
    INTEREST_RATE: 0.02,      // 하순 마감 때 남은 빚 × 2% (올림)
    AP_PER_TURN: 2,           // 사냥 1 · 대화 1
    ENDING_BOND_BEST: 520,    // 빚을 다 갚고 친밀도 합이 이 이상이면 최고 결말(일만으로는 ~320, 대화·선물이 더 필요)
  }),

  // ── 친밀도(임시). 단계 문턱을 넘을 때마다 능력이 열린다(data/bonds.js).
  BONDS: Object.freeze({
    TIERS: Object.freeze([40, 100, 180, 280]),
    MAX: 300,
    TALK: 6, TALK_RAND: 2,    // 대화 1회 +6~8 (행동력 1, 순마다 한 사람 한 번)
    GIFT_LIKED: 14,           // 좋아하는 선물 (순마다 한 사람 한 번)
    GIFT_COMMON: 6,           // 달빵
    WORK_SHIFT: 2,            // 영업 마감: 루나·루나 언니
    WORK_HUNT: 3, WORK_HUNT_DOWN: 1, // 사냥 마침(3분 버팀/쓰러짐·후퇴): 네오
    WORK_SHOP: 2,             // 준비 중 모카 식재료점 구매(순마다 한 번): 모카
  }),

  // ── 자동 운영
  AUTO_DECIDE_MS: 600,
});
