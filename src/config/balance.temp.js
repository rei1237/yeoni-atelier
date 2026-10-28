// 임시 구현 결정값. 기획서에 수치가 없어서 이번 프로토타입이 정한 값이다.
// 확정 규칙도, 기획서 제안 수치도 아니다. 플레이테스트로 바꾼다.

import { DECOR_CATALOG,LARGE_CATALOG } from '../data/decor-catalog.js';
export const TEMP = Object.freeze({
  HOST_FEE_BASE: 5000, // 60초 전담의 고수익 지명료. 음식·팁과 별도, 임시 밸런스
  HOST_FEE_WEALTH: Object.freeze({frugal:1,ordinary:1.5,generous:3,tycoon:6}),
  INITIAL_DEBT: 100_000_000, // 사용자 결정 2026-10-26: 1억 골드, 외전 속 현실 약 10억 원 규모
  CAFE_PRICE_GROWTH: 1.45, // 레벨별 메뉴 가격 배율(임시). 2년 운영에서도 올리지 않는다(빚은 공연·피버·인기로 갚는다)
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
  CLOSING_MS: 30000,          // TEMP 사용자 요청 2026-10-28: 끝나기 30초 전부터 입장 마감, 직원은 설거지·청소로 마무리
  NOMINATE_CHANCE: 0.38,
  ORDER_THINK_MS: 3000,       // 착석 후 주문까지
  EAT_MS: 26000,              // 일반 손님 식사 시간
  FOOD_PATIENCE_MS: 150000,   // 주문 후 이 시간 안에 못 받으면 떠남(매출 없음)
  NOMINATION_PATIENCE_MS: 45000, // 지명 요청을 이 시간 동안 처리 안 하면 일반 식사로 전환
  SERVE_BUFFER_MS: 10000,     // 접대 손님의 늦은 주문 판단: 조리 시간 + 이 값이 남은 접대 시간보다 길면 주문 안 함

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
  TRAFFIC_YIELD_MS: 1500, // 서로 막혀 이만큼 못 나아가면 다음 칸까지 사람을 통과해 걷는다(카페가 멈추지 않게)
  STAFF_TURN_TILES: 6, // 홀 일 나누기: 맡은 일 1건 = 6칸 더 먼 셈(가까운 사람 우선이되 번갈아 일한다)
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
    POWER_DROP: Object.freeze([ // 일반 적 처치 시 확률. 10-28: 회복 생선은 보물 상자에서만 나온다
      { id: 'magnet', chance: 0.005 },
    ]),
    // 일반 적 확률 1개, 정예·보스는 고정 개수(임시). 10-28: 일반 0.16→0.22, 보스 20→45(보스 퇴치 보상이 적다는 피드백)
    MOON_DROP: Object.freeze({ chance: 0.22, elite: 6, boss: 45 }),
    ELITE_CHEST: 0.12,        // 정예가 별 상자를 떨굴 확률(10-28: 항상 → 드물게). 안 떨구면 월정석만
    FIELD_PROP_SKIP: 3,       // 필드 기물: 청크 10칸 중 이만큼은 비운다(10-28: 2→3, 약 80%→70%)
    FIELD_PROP_REWARD: 0.8,   // 필드 기물 월정석 배율(10-28: 조금 줄임)
    // TEMP 사용자 요청 2026-10-28: 보물 상자는 매우 드물고, 월정석을 많이 주며, 회복 생선은 여기서만 가끔 나온다
    TREASURE_PER_MIL: 15,     // 기물 자리 1000곳 중 보물 상자 수(약 1.5%)
    TREASURE_REWARD: 10,      // 보물 상자 월정석 = 같은 자리 기물 보상 × 이 값
    TREASURE_HEAL_CHANCE: 0.35, // 보물 상자에서 구운 생선이 함께 나올 확률
    TREASURE_SPOT_RADIUS: 320,  // 이 거리 안에 들어오면 발견으로 친다
    FIELD_W: 1400,
    FIELD_H: 1800,
  }),

  // ── 마을(임시). 월정석 환전·모카 긴급 배달·가게 확장
  MOONSTONE_GOLD: 500,          // 청토끼 금융 센터 기본 환율(임시). 10-26: 단계 사냥 수급 증가로 1,200→500
  DELIVERY_FEE: 200,    // 영업 중 모카 긴급 배달 = 주문당 기본 200G
  TABLE_PRICE_BASE: 2500,     // 6번 테이블 값. 한 개 들일 때마다 ×1.6 (2,500 → 4,000 → 6,400 …)
  TABLE_PRICE_GROWTH: 1.6,
  MAX_TABLES: 24,
  AREA_COSTS: Object.freeze([6000, 18000, 40000, 85000, 160000]), // 공방 증축: 연 구역 수에 따라 오른다
  SPAWN_TABLE_BASE: 5,        // 시작 5테이블은 기본 입장 간격. 증축 이후에만 비례 단축(임시)
  DECOR_PRICES: Object.freeze({ chair:600, plant: 400, lamp: 700, bookshelf: 1200, rug: 1500, ...Object.fromEntries([...DECOR_CATALOG,...LARGE_CATALOG].map(d => [d.id, d.price])) }),

  // ── 달력·이자·행동력(임시). 영업 1회 = 한 순, 3순 = 한 달. 3월부터 24개월(72순), 2년 운영 뒤 결말.
  // 10-28 이전 저장 중 첫 6개월(18순)을 넘긴 저장은 옛 5년 180순을 그대로 쓴다(save.js, calendar.totalTurns).
  CALENDAR: Object.freeze({
    START_MONTH: 3,
    TURNS_PER_MONTH: 3,
    TOTAL_TURNS: 72,
    LEGACY_TOTAL_TURNS: 180,
    LEGACY_CUTOFF_DAY: 18,    // 이 순까지 진행한 옛 저장만 2년 규칙으로 옮긴다
    RECRUIT_RETRY_MONTHS: 3,  // 놓친 영입 초대는 이 개월 수마다 다시 온다(2년 안에 전원 합류)
    INTEREST_RATE: 0.02,      // 하순 마감 때 남은 빚 × 2% (올림). 옛 180순 저장은 끝까지 이 값
    // 10-28 청토끼 이자율 인상(위기): 솔브·밤비·루네·레이븐이 합류하는 달 상순에 올린다(game/creditor.js)
    RATE_HIKES: Object.freeze([
      Object.freeze({ monthIdx: 5, rate: 0.03 }), Object.freeze({ monthIdx: 8, rate: 0.04 }),
      Object.freeze({ monthIdx: 14, rate: 0.05 }), Object.freeze({ monthIdx: 18, rate: 0.06 }),
    ]),
    // 인상 장면을 볼 때마다 네오가 버티며 자란다(원장 hike:<달>:neo 1회). 호스트 능력치는 10이 상한
    HIKE_NEO: Object.freeze({ empathy: 1, talk: 1, fun: 2, looks: 1, huntHp: 30, huntDmg: 0.08 }),
    AP_PER_TURN: 3,           // 사냥 1 · 대화 1
    ENDING_BOND_BEST: 1500,   // 빚을 다 갚고 친밀도 합이 이 이상이면 최고 결말(72순 봇: 일+네오 대화만으로는 ~1270, 여러 동료와의 대화·선물이 더 필요)
  }),

  // ── 친밀도(임시). 단계 문턱을 넘을 때마다 능력이 열린다(data/bonds.js).
  BONDS: Object.freeze({
    TIERS: Object.freeze([70, 190, 295, 420]), // 능력 해방 랭크 3·6·8·10의 점수(=RANKS[2·5·7·9])
    // 페르소나식 인연 랭크: 점수는 다음 랭크의 문턱만 채우고, 랭크는 대화(함께 보내는 시간)에서 하나씩 오른다.
    // RANKS[r]는 랭크 r+1에 필요한 점수. 10-28: 2년 운영에 맞춰 문턱을 올리고, 랭크는 한 사람당 한 달(3순)에 하나만 오른다.
    // 목표: 네오를 꾸준히(순마다 ~6점) 챙기면 2년차 말 랭크 10, 일과 가끔의 대화로 만난 동료는 6~8.
    RANKS: Object.freeze([15, 40, 70, 105, 145, 190, 240, 295, 355, 420]),
    LEGACY_RANKS: Object.freeze([10, 25, 40, 60, 80, 100, 140, 180, 230, 280]), // 랭크 기록이 없는 옛 저장 이전용
    PERK_RANKS: Object.freeze([3, 6, 8, 10]),
    COOK_SLOT_CAP: 9,         // TEMP: 구역 확장(최대 6) + 루나 언니 인연(최대 +5) 합의 설비당 동시 조리 상한
    MAX: 450,
    TALK: 6, TALK_RAND: 2,    // 기존 저장 호환 상수. 현재 선택지 대화는 bond-dialogues.js의 +12/+6/+2
    GIFT_LIKED: 14,           // 좋아하는 선물 (순마다 한 사람 한 번)
    GIFT_COMMON: 6,           // 달빵
    WORK_SHIFT: 2,            // 영업 마감: 루나·루나 언니
    WORK_HUNT: 3, WORK_HUNT_DOWN: 1, // 사냥 마침(3분 버팀/쓰러짐·후퇴): 네오
    WORK_SHOP: 2,             // 준비 중 모카 식재료점 구매(순마다 한 번): 모카
  }),

  // ── 연이 선물 요리(준비 중). 10-28 요청: 어떤 메뉴든 5초 만에 완성, 조리 장면만 보여 준다. TEMP
  GIFT_COOK_MS: 5000,

  // ── 멤버 인기·무대 공연·정기 콘서트(10-28 경제 개편, 모두 임시). 공식은 game/fans.js
  FANS: Object.freeze({
    TIERS: Object.freeze([40, 140, 360, 800]),  // 인기 단계 1~4의 팬 수
    NAMES: Object.freeze(['새내기', '동네 화제', '단골 지명', '카페 스타', '달빛 아이돌']),
    HOST_GREAT: 6, HOST_GOOD: 3,                 // 접대 정산 만족도 80+ / 60+ 팬
    TIP_PER_TIER: 0.15,                          // 단계당 팁·지명료 배율 +15%
    NOMINATE_WEIGHT_PER_TIER: 0.5,               // 지명 대상 가중치(단계당)
    NOMINATE_CHANCE_PER_TIER: 0.01, NOMINATE_CHANCE_MAX: 0.55, // 지명 확률(접대 동료 단계 합당)
  }),
  STAGE: Object.freeze({
    DURATION_MS: 30 * 1000,                      // 영업 600초 안의 공연 구간
    THROW_EVERY_MS: 3000, THROW_BASE: 60,        // 자리 손님이 3초마다 던지는 꽃잎 지폐·금화(× 가격 성장 × 공연 세기 × 부유도)
    PER_MEMBER: 0.25, PER_TIER: 0.15, PER_OUTFIT: 0.1, DECOR_PER: 100, DECOR_CAP: 0.5, RECORD_PLAYER: 0.1,
    ARRIVAL_MULT: 1.8, FIRST_GUEST_MS: 1500,     // 공연 중 손님 입장 배율
    HOST_TIP_RATE: 1,                            // 접대 팁 추가 = 기본 팁 × (세기 - 1)
    FANS: 8, FANS_PER_GUEST: 1, POPULARITY: 1,   // 공연을 마친 멤버마다 팬(× 세기)
    GAUGE_PER_SERVE: 2,                          // 멤버 합류 뒤 서빙 1회당 피버 게이지(손님 응원)
  }),
  CONCERT: Object.freeze({
    AP: 1, TICKET: 300, TIER_BONUS: 0.1, SEATS_BASE: 40, SEATS_PER_TABLE: 8, // 티켓 수입 = 좌석 × 티켓값(× 가격 성장 × 멤버 단계)
    FANS: 25, POPULARITY: 2,
  }),
  // ── 자동 운영
  AUTO_DECIDE_MS: 600,
  HUNT_CAREER: Object.freeze({ xpBase: 1100, xpStep: 350, hpPerLevel: 4, damagePerLevel: 0.06, levelsPerDepth: 5, depthHp: 0.35, depthDamage: 0.18, depthReward: 0.1, monthReward: 0.06, xpNormal: 2, xpElite: 20, xpBoss: 100, statCap: 10 }), // statCap: 이 레벨 뒤로는 체력·피해 보너스가 오르지 않는다(레벨·경험치는 계속)
  // 기술 단련(윤달 공방). 단련 단계가 사냥 중 오를 수 있는 레벨 상한을 정한다. 가격은 월정석, 모두 임시
  HUNT_SKILLS: Object.freeze({
    START: Object.freeze(['bolt', 'orbit', 'paw', 'fish_stock']), // 처음부터 1단계
    // 10-28 사용자 요청: 기술마다 사던 상한 해방을 공용 상한 한 줄로 합치고 월정석을 낮춘다(TEMP)
    LEARN: Object.freeze({ hat: 500, whisker: 500, crescent: 900, bell: 900, aura: 1500, luck: 1500, tarot: 2400 }), // 배우기 값(800~4000 → 약 0.6배)
    CAP_BASE: Object.freeze({ weapon: 3, passive: 2 }), // 공용 상한 0단계(기본) 사냥 중 최대 Lv. 예전 기본(무기 Lv2·보조 Lv1)보다 한 단계 위
    CAP_COST: Object.freeze([900, 2200]),              // 공용 상한 1·2단계 값. 2단계면 무기 Lv5·진화, 보조 Lv3
    POUCH: 12,                                        // 상한에 다 닿았을 때 레벨업 카드 「월정석 주머니」(10-28: 3→12, 단계 보상 배율 적용)
  }),
  // 사냥터 업적 보상 월정석(1회, ledger.achievements). 모두 임시
  HUNT_ACHIEVE_MOON: Object.freeze({ first_boss: 30, triple: 60, no_tonic: 60, stage10: 60, stage30: 120, stage50: 200, stage100: 400, kills1000: 50, kills10000: 150, evolve: 80, evolve_all: 300, bestiary10: 50, hanbi: 100 }),
});
