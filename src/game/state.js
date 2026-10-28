// 게임 상태의 생성과 공용 도우미. 상태는 JSON 으로 그대로 저장할 수 있는 평범한 객체다.

import { RULES } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS } from '../data/menus.js';
import { START_FURNITURE, splitFurniture } from '../data/layout.js';
import { PEOPLE, RECRUITABLE } from '../data/companions.js';
import { DEV_RECRUITABLE } from '../data/dev-companions.js';
import { START_OUTFITS, OUTFIT_WEARERS } from '../data/outfits.js';
import { newFarm } from '../data/farm.js';

export const SAVE_VERSION = 3;

export function createGame({ dev = false, seed = 20261025 } = {}) {
  const learned = {};
  for (const m of Object.values(MENUS)) if (m.learned) learned[m.id] = true;
  const equipped = {};
  for (const who of OUTFIT_WEARERS) equipped[who] = { outfit: null, acc1: null, acc2: null };

  const state = {
    version: SAVE_VERSION,
    meta: { devData: !!dev, createdAt: Date.now() },
    rng: { seed: seed | 0 },
    mode: 'prep',           // prep(영업 전·마감 후) | shift | settlement | hunt
    day: 1,                 // 다음(또는 진행 중) 정규 영업 번호
    paused: false,
    auto: false,           // 전체 자동(접대 판단 포함) — 시뮬·테스트 전용
    automation: { hall: false, hall_neo: false, kitchen: false, farm: false }, // 인연으로 연 뒤에도 기본은 꺼짐(permissions.js)
    hostbar: { open: false, openedDay: null },
    huntUnlocked: false,
    stress: {},            // 직원 id → 0~100(stress.js). 없으면 0
    resting: {},           // 이번 영업을 쉬는 직원(한계·휴무). 결산 때 풀린다
    dayOff: {},            // 다음 영업을 쉬게 한 직원(준비 중 지정)
    shift: null,
    lastSettlement: null,
    reputation:25,
    gold: TEMP.START_GOLD,
    debt: TEMP.INITIAL_DEBT,
    startingDebt:TEMP.INITIAL_DEBT,
    payroll:{months:{},arrears:0},
    finance:{balance:0,requests:{},interest:{}},
    repaidTotal: 0,
    stock: { ...TEMP.START_STOCK, night_dew: 0 },
    moonstone: 0,          // 월정석: 사냥에서 얻고 청토끼 금융 센터에서 골드로 바꾼다
    farm: newFarm(seed),
    hunter: { xp: 0, kills: 0, maxStage:1 },
    huntCodex: { enemies: {}, evolved: {}, materials: {}, chests: 0, feats: {} }, // 사냥터 수집 도감(hunt-codex.js)
    armory: {upgrades:{},supplies:{},skills:Object.fromEntries(TEMP.HUNT_SKILLS.START.map(id=>[id,1]))},
    gear: { owned: [], equipped: { weapon: null, armor: null, charm: null } }, // 영냥이 장비(data/gear.js)
    learned,
    yeoniGrowth:{xp:0,counts:{},recipes:{},title:'beginner'},
    // 접대 가능한 명단: 새 게임은 네오 한 명
    roster: Object.fromEntries(RULES.STARTING_ROSTER.map(id => [id, { usableFrom: 1 }])),
    // 동일 인물 활동 잠금: 네오와 영냥이는 같은 id 'neo' 를 쓴다
    people: Object.fromEntries(RULES.STARTING_ROSTER.map(id => [id, { activity: 'idle', form: 'human', visitId: null, tableNo: null, endAt: null }])),
    recruitment: {},
    fever: { gauge: 0, activeUntil: null },
    interior: { checkoutLayout:'entrance-left', furniture: splitFurniture(START_FURNITURE), areas: [], draft: null },
    outfits: { owned: [...START_OUTFITS], equipped },
    quests: { claimed: {} },
    stats: { served: 0, servedSpecial: 0, shiftsCompleted: 0, repayCount: 0, nightDewObtained: 0, recruited: 0, huntsCompleted: 0, moonstonesObtained: 0, moonstonesExchanged: 0, expansions: 0, areasOpened: 0 },
    ledger: { sales: {}, tips: {}, settlements: {}, rewards: {}, consumes: {}, repay: {}, interest: {}, story: {}, achievements: {} },
    calendar: { ended: false, endingId: null, endedDebt: null }, // 달력(game/calendar.js): day 로 달·순을 계산한다
    ap: { left: TEMP.CALENDAR.AP_PER_TURN, talked: {}, gifted: {}, shopped: false, delegated: {}, sheltered: {}, neoTask: null }, // 이번 순 행동력
    affinity: { neo: 0, luna: 0, luna_sis: 0, moka: 0 }, // 친밀도(game/bonds.js)
    bondRank: {}, // 인연 랭크 0~10(대화로 오른다)
    hunt: null,
    lastHunt: null,
    seq: { order: 0, visit: 0, customer: 0, job: 0, item: 0, hunt: 0, task: 0 },
    offline: { lastWallMs: null }, // 오프라인 수익 인터페이스용 기록. 1단계는 지급하지 않는다.
    // 영업 중에만 채워지는 칸
    tables: [], customers: {}, visits: {}, orders: {},
    stations: emptyStations(), tray: Array(RULES.TRAY_SLOTS).fill(null),
    tasks: [], staff: {},
  };
  for (const c of recruitables(state)) state.recruitment[c.id] = { status: 'locked' };
  return state;
}

export function emptyStations() {
  return { drink: { current: null, next: null, held: null }, oven: { current: null, next: null, held: null } };
}

// 영입 후보: 공식 목록 + (개발 데이터 모드일 때만) 개발용 임시 동료
export function recruitables(state) {
  return state.meta.devData ? [...RECRUITABLE, ...DEV_RECRUITABLE] : [...RECRUITABLE];
}

export function personDef(state, id) {
  if (PEOPLE[id]) return PEOPLE[id];
  return recruitables(state).find(c => c.id === id) || null;
}

export function hostStats(state, id) {
  return personDef(state, id)?.stats ?? null;
}

export function personName(state, id) {
  const p = personDef(state, id);
  if (!p) return id;
  if (id === 'neo' && state.people.neo?.form === 'cat') return PEOPLE.neo.forms.cat.name;
  return p.name;
}

// 이번(또는 다음) 영업에서 접대에 쓸 수 있는가: 명단에 있고, 사용 시작 영업 번호가 지났다
export function isUsableHost(state, id) {
  const r = state.roster[id];
  return !!r && state.day >= r.usableFrom && !!personDef(state, id)?.stats;
}

export function usableHosts(state) {
  return Object.keys(state.roster).filter(id => isUsableHost(state, id));
}

export function nextId(state, kind) {
  state.seq[kind] = (state.seq[kind] || 0) + 1;
  return `${kind}-${state.day}-${state.seq[kind]}`;
}

export function elapsed(state) {
  return state.shift ? state.shift.elapsedMs : 0;
}

export function remainingShift(state) {
  return state.shift ? Math.max(0, shiftDuration(state) - state.shift.elapsedMs) : 0;
}

// ── 이벤트(화면 연출용). 저장하지 않는다.
let sink = null;
export function withEvents(fn) {
  const prev = sink;
  const events = [];
  sink = events;
  try { const result = fn(); return { result, events }; } finally { sink = prev; }
}
export function emit(type, data = {}) {
  if (sink) sink.push({ type, ...data });
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// 이미 진행 중이던 v1 저장은 그 영업만 기존 시간을 보존한다.
export const shiftDuration = state => state.shift?.durationMs ?? RULES.SHIFT_MS;
export const nominationDuration = state => state.shift?.nominationMs ?? RULES.NOMINATION_MS;
export const lastAcceptAt = state => shiftDuration(state) - nominationDuration(state);
