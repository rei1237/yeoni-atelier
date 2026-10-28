import {ensureRecordPlayer} from '../game/music-furniture.js';
import {validateLayout} from '../game/space.js';
import {cafeLayout} from '../data/layout.js';
import {normalizeKfp} from '../game/kfp-loadout.js';
import {migrateFurniture} from '../data/layout.js';
import {migrateHuntVisits} from '../game/hunt-visits.js';
import {migrateCounter} from '../game/cafe.js';
import {ensureBranches} from '../game/branches.js';
import { customerLook } from '../data/customer-looks.js';
import { pointsRank } from '../data/bonds.js';
import { TEMP } from '../config/balance.temp.js';
// 저장·불러오기. 연이의 아틀리에 전용 키만 쓴다(killerflowerpig 의 kfp.* 키는 읽지도 쓰지도 않는다).
// 개발 모드는 별도 키를 쓰므로 일반 저장을 건드리지 않는다.

import { SAVE_VERSION, createGame } from '../game/state.js';
import { newFarm, maxFarmEnergy } from '../data/farm.js';
import { legacySkillRanks, legacyCapTier } from '../game/moka-armory.js';
import { legacyCodex, checkAchievements } from '../game/hunt-codex.js';

export const SAVE_KEYS = Object.freeze({ normal: 'yeoni-atelier.save.v1', dev: 'yeoni-atelier.dev-save.v1' });

export function memoryStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

export function browserStorage() {
  try {
    const ls = globalThis.localStorage;
    const probe = '__yeoni_probe__';
    ls.setItem(probe, '1'); ls.removeItem(probe);
    return ls;
  } catch { return null; }
}

// 저장하지 않는 칸: 인테리어 초안(편집 중 취소와 같은 효과), 사냥 전장(이어하기 때 새로 생성)
export function serialize(state) {
  const copy = { ...state, outdoor:state.outdoor?{...state.outdoor,draft:null}:undefined, interior: { ...state.interior, draft: null } };
  return JSON.stringify(copy);
}

const REQUIRED = ['version', 'meta', 'rng', 'mode', 'day', 'gold', 'debt', 'stock', 'roster', 'people', 'ledger', 'stats', 'interior', 'seq'];

function migrate(data) {
  // v1 이 첫 버전이다. 이후 버전이 생기면 여기서 단계별로 올린다.
  const legacy = data.version < 2;
  if (legacy) {
    data.hostbar ??= { open: data.day >= 7, openedDay: data.day >= 7 ? 7 : null };
    data.huntUnlocked ??= data.day > 1 || (data.stats?.huntsCompleted || 0) > 0 || !!data.hunt || !!data.lastHunt;
    if (data.huntUnlocked) (data.ledger.story ||= {})['ev:hunt'] = true;
    if (data.shift) { data.shift.durationMs ??= 1800000; data.shift.nominationMs ??= 300000; }
  }
  // 10-28 첫 귀환 이야기(ev:return·ev:forge) 추가: 이미 여러 번 사냥한 저장은 첫 귀환 장면을, 6단계를 넘긴 저장은 공방 첫 이야기도 건너뛴다
  if (data.ledger?.story?.['ev:hunt'] && (data.stats?.huntsCompleted || 0) >= 3) { data.ledger.story['ev:return'] ??= true; if ((data.hunter?.maxStage || 1) > 6) data.ledger.story['ev:forge'] ??= true; }
  ensureBranches(data);
  migrateFurniture(data);
  if(data.mode==='prep'&&(!data.interior.checkoutLayout||data.interior.checkoutLayout==='entrance')){
    const candidate={...data,interior:{...data.interior,checkoutLayout:'entrance-left'}};
    if(validateLayout(data.interior.furniture,data.interior.areas||[],cafeLayout(candidate)).ok)data.interior.checkoutLayout='entrance-left';
  }
  migrateCounter(data);
  ensureRecordPlayer(data);
  data.startingDebt ??= 120000; // 이전 저장의 원금과 상환 진척은 보존
  if (data.armory && !data.armory.skills) data.armory.skills = legacySkillRanks(data); // 기술 단련 이전 저장
  if (data.armory && data.armory.capTier == null) data.armory.capTier = legacyCapTier(data.armory.skills); // 10-28 공용 상한 이전 저장
  data.huntCodex ??= legacyCodex(data); // 수집 도감 이전 저장: 깬 단계로 소급
  const base = createGame({ dev: !!data.meta?.devData });
  data.learned??={};data.learned.americano??=true; // 새 기본 메뉴는 옛 저장에서도 사용한다
  if (!data.farm) data.farm = { ...newFarm(data.rng?.seed), lastAdvancedDay: data.day };
  data.farm.energy = Number.isFinite(data.farm.energy) ? Math.max(0,Math.min(data.farm.energy,maxFarmEnergy(data.farm))) : maxFarmEnergy(data.farm);
  // 인연 랭크 이전 저장: 점수로 열려 있던 능력이 그대로 남도록 점수만큼의 랭크로 시작한다
  if (data.bondRank === undefined) data.bondRank = Object.fromEntries(Object.entries(data.affinity || {}).map(([id, v]) => [id, pointsRank(v || 0, TEMP.BONDS.LEGACY_RANKS)]));
  // 10-28 2년 운영: 첫 6개월 안의 옛 저장만 72순으로 옮기고, 그 뒤 저장은 옛 180순을 유지한다(결말·벌칙 소급 없음)
  data.calendar ||= {};
  if (data.calendar.totalTurns == null) data.calendar.totalTurns = !data.calendar.ended && data.day <= TEMP.CALENDAR.LEGACY_CUTOFF_DAY ? TEMP.CALENDAR.TOTAL_TURNS : TEMP.CALENDAR.LEGACY_TOTAL_TURNS;
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  for (const k of ['ledger', 'stats', 'seq', 'quests', 'outfits', 'fever', 'offline', 'gear', 'calendar', 'ap', 'affinity']) data[k] = { ...base[k], ...data[k] };
  // 네오 전용 스트레스 → 전 직원 스트레스. 예전 자동 켜짐은 권한이 아니므로 모두 끈다(인연으로 다시 연다).
  if ('neoStress' in data || 'neoResting' in data) {
    data.stress = { ...data.stress, neo: data.stress?.neo ?? data.neoStress };
    if (data.neoResting) data.resting = { ...data.resting, neo: true };
    delete data.neoStress; delete data.neoResting;
  }
  for (const k of ['stress', 'resting', 'dayOff']) if (!data[k] || typeof data[k] !== 'object') data[k] = {};
  for (const [id, v] of Object.entries(data.stress)) data.stress[id] = Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
  if ('autoKitchen' in data) { delete data.autoKitchen; data.auto = false; }
  data.automation = { hall: false, hall_neo: false, kitchen: false, farm: false, ...(data.automation || {}) };
  for (const k of Object.keys(data.automation)) data.automation[k] = data.automation[k] === true;
  if (legacy && data.hostbar.open && !data.ledger.rewards['outfit:host_first']) {
    data.ledger.rewards['outfit:host_first'] = true;
    if (!data.outfits.owned.includes('host_first')) data.outfits.owned.push('host_first');
  }
  if (data.version < 3 && data.day <= 180 && data.calendar.ended) {
    data.calendar.previousEnding = { id:data.calendar.endingId, debt:data.calendar.endedDebt };
    data.calendar.ended = false; data.calendar.endingId = null; data.calendar.endedDebt = null;
    // 예전 결말의 추억은 별도 보존하되 5년 결말은 새로 볼 수 있다.
    for (const key of Object.keys(data.ledger.story)) if (key.startsWith('ending:')) { data.ledger.story['previous:'+key]=true; delete data.ledger.story[key]; }
  }
  data.outfits.equipped = {...base.outfits.equipped,...data.outfits.equipped};
  for(const id of Object.keys(data.roster)) { const outfit=`${id}_formal`; if(['yun','museong','solv','bambi','lune','raven'].includes(id) && !data.outfits.owned.includes(outfit)){data.outfits.owned.push(outfit);data.ledger.rewards[`outfit:${outfit}`]=true;data.outfits.equipped[id].outfit=outfit;} }
  for (const c of Object.values(data.customers || {})) {c.nominationGuest ||= data.visits?.[c.visitId]?.kind==='nomination';c.look = customerLook(c);}
  // 기존 저장에는 도입부 기록이 없다. 이어하기는 프롤로그를 생략하고 다른 이야기 기록은 보존한다.
  data.ledger.story = {...data.ledger.story, prologue:true};
  migrateHuntVisits(data);
  if(data.hunt)normalizeKfp(data.hunt);
  data.interior.areas ||= []; // 증축 구역 이전 저장
  // 꾸미기 통합 이전 저장: 옛 실내·증축·정원 안내 중 하나라도 봤으면 통합 안내도 본 것으로 친다
  if (data.tutorials && (data.tutorials.interior || data.tutorials.expand || data.tutorials.grounds)) data.tutorials.decorate = true;
  checkAchievements(data, { quiet: true }); // 업적 소급(원장으로 보상 1회)
  return data;
}

export function deserialize(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, reason: '저장 데이터를 읽을 수 없습니다(손상됨)' }; }
  if (!data || typeof data !== 'object') return { ok: false, reason: '저장 데이터 형식이 아닙니다' };
  if (typeof data.version !== 'number' || data.version > SAVE_VERSION) return { ok: false, reason: `지원하지 않는 저장 버전입니다 (${data.version})` };
  for (const k of REQUIRED) if (data[k] === undefined) return { ok: false, reason: `저장 데이터에 ${k} 항목이 없습니다` };
  if (!data.roster.neo) return { ok: false, reason: '저장 데이터의 동료 명단이 올바르지 않습니다' };
  const state = migrate(data);
  state.version = SAVE_VERSION;
  state.interior.draft = null;
  // 영업·사냥 중 저장을 이어하면 일시정지 상태로 시작한다(같은 손님·같은 남은 시간)
  if (state.mode === 'shift' || state.mode === 'hunt') state.paused = true;
  return { ok: true, state };
}

export function saveGame(storage, key, state) {
  if (!storage) return { ok: false, reason: '이 브라우저에서는 저장소를 쓸 수 없습니다' };
  try { storage.setItem(key, serialize(state)); return { ok: true }; } catch (e) { return { ok: false, reason: `저장 실패: ${e.message}` }; }
}

export function loadGame(storage, key) {
  if (!storage) return { ok: false, reason: '저장소를 쓸 수 없습니다' };
  const text = storage.getItem(key);
  if (text == null) return { ok: false, reason: '저장된 게임이 없습니다', empty: true };
  return deserialize(text);
}

export function hasSave(storage, key) {
  return !!storage && storage.getItem(key) != null;
}

// 초기화는 사용자가 고르고 확인했을 때만(confirmed === true) 한다.
export function resetSave(storage, key, { confirmed } = {}) {
  if (confirmed !== true) return { ok: false, reason: '초기화 확인이 필요합니다' };
  storage?.removeItem(key);
  return { ok: true };
}
