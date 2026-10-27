// 임시 구현 결정값. 기획서에 수치가 없어서 이번 프로토타입이 정한 값이다.
// 확정 규칙도, 기획서 제안 수치도 아니다. 플레이테스트로 바꾼다.

import { DECOR_CATALOG,LARGE_CATALOG } from '../data/decor-catalog.js';
export const TEMP = Object.freeze({
  INITIAL_DEBT: 100_000_000, // 사용자 결정 2026-10-26: 1억 골드, 외전 속 현실 약 10억 원 규모
  CAFE_PRICE_GROWTH: 1.45, // 레벨별 메뉴 가격 배율(임시, 5년 시뮬레이션 기준)
  LOAN_RATE: .08, // 청토끼 신규 운영 대출: 월 8%, 미납 이자는 원금에 가산
  PAYROLL_BASE: 1000, // 월 정액, 근무 순 비례
  PAYROLL_SHARE: .015, // 새 동료 1인 월 매출의 1.5%

  // ── 시뮬레이션
  SIM_STEP_MS: 100,           // 한 틱의 최대 시뮬레이션 간격
  FRAME_DT_CAP_MS: 250,       // 프레임 끊김 시 한 번에 진행할 최대 실제 시간
  AUTOSAVE_MS: 5000,          // 영업 중 자동 저장 간격(활성 시간 기준)

  // ── 손님
  SPAWN_FIRST_MS: 4000,
  SPAWN_INTERVAL_MS: Object.freeze([16000, 30000]),
  LAST_SEATING_ELAPSED_MS: 520 * 1000, // 08:40 이후 새 손님 입장 없음
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
  HELP_AT_MS: Object.freeze([12000, 28000, 44000]), // 수락 기준
  HELP_WINDOW_MS: 10000,
  HELP_GAIN_GOOD: 2,
  HELP_GAIN_OK: 1,
  HELP_MISS: -1,
  // 직원 스트레스(0~100, 모두 임시). 접대(accept~good)는 네오·호스트, 서빙·정리·굽기는 그 일을 한 직원에게 쌓인다.
  // 회복: 결산(settle)·하루 휴무(rest)·대화(talk)·선물(gift)·루나의 쉼터(shelter, 골드·행동력 무소모).
  NEO_STRESS: Object.freeze({ accept: 4, missed: 12, wrong: 8, good: -10, settle: -25, talk: -8, deliver: 1, clean: 1, cook: 1, rest: -40, gift: -10, shelter: -35 }),
  SHELTER_COST: 300,          // 루나의 쉼터 한 사람 한 번(순마다)
  // 자동화 권한(임시): 그 동료의 인연 단계와, 같은 단계 인연 이야기(ledger.story['bond:<id>:<단계>'])를 본 기록이 함께 있어야 연다.
  AUTOMATION: Object.freeze({
    hall: Object.freeze({ id: 'luna', tier: 2, label: '루나 홀 자동 · 서빙·정리' }),
    hall_neo: Object.freeze({ id: 'neo', tier: 2, label: '네오 홀 자동 · 서빙·정리' }), // TEMP: 홀 보조는 루나와 같은 ♥2, 농장 ♥3과 별개
    kitchen: Object.freeze({ id: 'luna_sis', tier: 2, label: '주방 자동 · 대기 주문 조리' }),
    farm: Object.freeze({ id: 'neo', tier: 3, label: '농장 맡기기 · 수확·재파종·물·돌봄' }),
  }),
  EXTRA_ORDER_AT_MS: 20000,  // 추가 주문 시점(수락 기준)
  FEVER_EVAL_AT_MS: 10000,    // 방문당 첫 유효 평가 시점(수락 기준)

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

  // ── 월정석 사냥(영냥이). 필드 월정석과 생존 보상 재료를 얻는다. 일반 재료는 모카 상점·농장, 희귀 차 재료는 깊은 사냥.
  HUNT: Object.freeze({
    // 무기·보조 능력·적 수치는 src/data/hunt-kit.js (모두 임시)
    PLAYER_SPEED: 165,        // px/s (필드 좌표)
    PLAYER_HP: 100,
    HURT_IFRAME_MS: 600,
    DEPTH_HP0: 1.15,          // 1단계 적 체력 배율(단계마다 hunt-growth.js depthScale 로 오른다)
    DEPTH_DMG0: 1.2,          // 1단계 받는 피해 배율
    DEPTH_DMG_STEP: 0.025,     // 단계당 받는 피해 증가
    SUB_STEP_MS: 34,          // 탄이 적을 뚫고 지나가지 않도록 탐색 안에서 더 잘게 나눈다
    // 단계별 준비 시간·밀도·동시 상한은 src/data/hunt-stages.js. 생성은 밀도 목표보다 모자랄 때만 한다
    SPAWN_RATE_MIN: 1.35,    // 초당 생성 수 = min(MAX, MIN + PER_MISSING × 모자란 수)
    SPAWN_RATE_MAX: 3.3,
    SPAWN_RATE_PER_MISSING: 0.45,
    STAGES_PER_RUN: 3,        // 한 번 출발에 클리어할 수 있는 단계 수(다음 출발에 이어 간다)
    BOSS_DENSITY: 0.35,       // 보스가 있는 동안 잡몹 밀도 배율
    MAX_ENEMIES: 140,         // 안전 상한(단계 상한이 먼저 걸린다)
    MONTH_HP: 0.08,           // 달이 지날 때마다 적 HP +8% (3월 0, 다음 해 2월 +88%)
    MONTH_DMG: 0.04,          // 달마다 접촉 피해 +4%
    SPAWN_DIST: Object.freeze([380, 470]),
    XP_BASE: 18,               // 다음 레벨 필요 경험치 = XP_BASE + (L-1)×XP_STEP + (L-1)²×XP_CURVE (반올림)
    XP_STEP: 10,
    XP_CURVE: 1.8,
    CRIT_BASE: 0.05,
    CRIT_MULT: 2,
    KNOCKBACK: 140,
    MAGNET_RADIUS: 150,
    PICKUP_RADIUS: 42,
    GEM_CAP: 140,             // 넘으면 새 별조각을 기존 별조각에 합친다
    HEAL_FISH: 24,
    BOMB_RADIUS: 280,
    BOMB_DAMAGE: 200,
    POWER_DROP: Object.freeze([ // 일반 적 처치 시 확률
      { id: 'magnet', chance: 0.005 },
    ]),
    MOON_DROP: Object.freeze({ chance: 0.16, elite: 6, boss: 20 }), // 일반 적 확률 1개, 정예·보스는 고정 개수(임시). 단계마다 보스가 나와 보스 75→20·정예 14→6으로 낮춤
    FIELD_W: 1400,
    FIELD_H: 1800,
  }),

  // ── 마을(임시). 월정석 환전·모카 긴급 배달·가게 확장
  MOONSTONE_GOLD: 500,          // 청토끼 금융 센터 기본 환율(임시). 10-26: 단계 사냥 수급 증가로 1,200→500
  DELIVERY_FEE_RATE: 0.25,    // 영업 중 모카 긴급 배달 = 재료값 +25%
  TABLE_PRICE_BASE: 2500,     // 6번 테이블 값. 한 개 들일 때마다 ×1.6 (2,500 → 4,000 → 6,400 …)
  TABLE_PRICE_GROWTH: 1.6,
  MAX_TABLES: 24,
  AREA_COSTS: Object.freeze([6000, 18000, 40000, 85000, 160000]), // 공방 증축: 연 구역 수에 따라 오른다
  SPAWN_TABLE_BASE: 5,        // 시작 5테이블은 기본 입장 간격. 증축 이후에만 비례 단축(임시)
  DECOR_PRICES: Object.freeze({ chair:600, plant: 400, lamp: 700, bookshelf: 1200, rug: 1500, ...Object.fromEntries([...DECOR_CATALOG,...LARGE_CATALOG].map(d => [d.id, d.price])) }),

  // ── 달력·이자·행동력(임시). 영업 1회 = 한 순, 3순 = 한 달. 3월부터 60개월(180순), 5년 운영 뒤 결말.
  CALENDAR: Object.freeze({
    START_MONTH: 3,
    TURNS_PER_MONTH: 3,
    TOTAL_TURNS: 180,
    INTEREST_RATE: 0.02,      // 하순 마감 때 남은 빚 × 2% (올림)
    AP_PER_TURN: 3,           // 사냥 1 · 대화 1
    ENDING_BOND_BEST: 520,    // 빚을 다 갚고 친밀도 합이 이 이상이면 최고 결말(일만으로는 ~320, 대화·선물이 더 필요)
  }),

  // ── 친밀도(임시). 단계 문턱을 넘을 때마다 능력이 열린다(data/bonds.js).
  BONDS: Object.freeze({
    TIERS: Object.freeze([40, 100, 180, 280]),
    MAX: 300,
    TALK: 6, TALK_RAND: 2,    // 기존 저장 호환 상수. 현재 선택지 대화는 bond-dialogues.js의 +12/+6/+2
    GIFT_LIKED: 14,           // 좋아하는 선물 (순마다 한 사람 한 번)
    GIFT_COMMON: 6,           // 달빵
    WORK_SHIFT: 2,            // 영업 마감: 루나·루나 언니
    WORK_HUNT: 3, WORK_HUNT_DOWN: 1, // 사냥 마침(3분 버팀/쓰러짐·후퇴): 네오
    WORK_SHOP: 2,             // 준비 중 모카 식재료점 구매(순마다 한 번): 모카
  }),

  // ── 자동 운영
  AUTO_DECIDE_MS: 600,
  HUNT_CAREER: Object.freeze({ xpBase: 1100, xpStep: 350, hpPerLevel: 4, damagePerLevel: 0.06, levelsPerDepth: 5, depthHp: 0.35, depthDamage: 0.18, depthReward: 0.1, monthReward: 0.06, xpNormal: 2, xpElite: 20, xpBoss: 100, statCap: 10 }), // statCap: 이 레벨 뒤로는 체력·피해 보너스가 오르지 않는다(레벨·경험치는 계속)
  // 기술 단련(윤달 공방). 단련 단계가 사냥 중 오를 수 있는 레벨 상한을 정한다. 가격은 월정석, 모두 임시
  HUNT_SKILLS: Object.freeze({
    START: Object.freeze(['bolt', 'orbit', 'paw', 'fish_stock']), // 처음부터 1단계
    LEARN: Object.freeze({ hat: 800, whisker: 800, crescent: 1500, bell: 1500, aura: 2500, luck: 2500, tarot: 4000 }), // 배우기(1단계) 값
    TRAIN_BASE: 600,                                  // 기본 4종의 단련 기준값
    TRAIN_MULT: Object.freeze([1, 1.6, 2.6, 4.2]),    // 1·2·3·4단계 값 = 기준값 × 배율
    POUCH: 3,                                         // 상한에 다 닿았을 때 레벨업 카드 「월정석 주머니」
  }),
  // 사냥터 업적 보상 월정석(1회, ledger.achievements). 모두 임시
  HUNT_ACHIEVE_MOON: Object.freeze({ first_boss: 30, triple: 60, no_tonic: 60, stage10: 60, stage30: 120, stage50: 200, stage100: 400, kills1000: 50, kills10000: 150, evolve: 80, evolve_all: 300, bestiary10: 50, hanbi: 100 }),
});
