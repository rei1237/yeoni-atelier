// 저장·불러오기. 연이의 아틀리에 전용 키만 쓴다(killerflowerpig 의 kfp.* 키는 읽지도 쓰지도 않는다).
// 개발 모드는 별도 키를 쓰므로 일반 저장을 건드리지 않는다.

import { SAVE_VERSION, createGame } from '../game/state.js';
import { newFarm } from '../data/farm.js';

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
  const copy = { ...state, interior: { ...state.interior, draft: null } };
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
  const base = createGame({ dev: !!data.meta?.devData });
  if (!data.farm) data.farm = { ...newFarm(data.rng?.seed), lastAdvancedDay: data.day };
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  for (const k of ['ledger', 'stats', 'seq', 'quests', 'outfits', 'fever', 'offline', 'gear', 'calendar', 'ap', 'affinity']) data[k] = { ...base[k], ...data[k] };
  data.neoStress = Math.max(0, Math.min(100, Math.floor(Number(data.neoStress) || 0)));
  if (legacy && data.hostbar.open && !data.ledger.rewards['outfit:host_first']) {
    data.ledger.rewards['outfit:host_first'] = true;
    if (!data.outfits.owned.includes('host_first')) data.outfits.owned.push('host_first');
  }
  data.interior.areas ||= []; // 증축 구역 이전 저장
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
