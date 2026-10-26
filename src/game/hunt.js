import {nearbyProps,hitFieldProp} from './hunt-field.js';
import {withinMeleeArc,facingAngle} from './melee.js';
import {stepEnemyBehaviors,addBattleFx} from './enemy-behaviors.js';
// 영냥이 월정석 사냥(100단계). 단계마다 준비 시간 동안 잡몹을 상대하고, 준비 시간이 끝나면 나오는 보스를 쓰러뜨리면 클리어다.
// 클리어하면 "다음 단계/귀환"을 고르고, 사망·후퇴할 때까지 이어 간다. 정규 영업과 분리된 모드이며 네오와 같은 인물 잠금(people.neo)을 쓴다.
// 장비(data/gear.js) 효과는 출발할 때 hs.gear 로 고정해 사냥 중 바뀌지 않는다.
// 저장되는 것: 진행 시간·단계 시간·HP·가방·장비 효과·레벨·경험치·무기·보조 능력·대기 중인 레벨업 카드·상자 결과·보스 HP·지난 사건.
// 전장(적·탄·드롭 위치)은 저장하지 않고 이어하기 때 새로 만든다.
// killerflowerpig 에서 가져온 것: Pool(그대로), 조이스틱 입력(변형). 무기 레벨 누적·진화 배율·
// 밀도 목표 생성기·별조각 등급/합치기는 개념만 참고해 이 파일에서 새로 썼다(전투 로직 이식 아님).

import { enhancementBonus, SUPPLIES, SKILL_IDS, skillCap, skillRank } from './moka-armory.js';
import { survivalReward } from './hunt-rewards.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { INGREDIENTS,MENUS } from '../data/menus.js';
import { gearBonus } from '../data/gear.js';
import {
  WEAPONS, PASSIVES, ENEMIES,
  MAX_WEAPONS, MAX_PASSIVES, WEAPON_MAX_LV, PASSIVE_MAX_LV, EVO_MULT,
} from '../data/hunt-kit.js';
import { stageDef, stageAllows, stagePool, bossFor, stageEvents, firstClearMoon, HANBI_STAGES } from '../data/hunt-stages.js';
import { initBoss, stepBoss, stepZones, clearBossAttacks } from './hunt-boss.js';
import { Pool } from '../core/pool.js';
import { nextRandom, randRange } from '../core/rng.js';
import { emit, nextId } from './state.js';
import { personBusyReason } from './nomination.js';
import { apCheck, spendAp, calendarOf, totalMonths } from './calendar.js';
import { bondFx } from '../data/bonds.js';
import { placeLock, PLACE_NAMES } from './unlocks.js';
import { workHunt } from './bonds.js';
import { hunterProgress, maxHuntDepth, depthScale, huntMoonReward } from './hunt-growth.js';

const H = TEMP.HUNT;
const worlds = new WeakMap(); // state.hunt 객체 → 실행 중 전장(저장 안 함)
const POWER_NAMES = { fish: '구운 생선', magnet: '수염 자석', bomb: '달빛 폭탄', chest: '별 상자' };
// 희귀 상자 룰렛 칸(월정석, 단계 보상 배율을 곱한다). 임시
export const CHEST_WHEEL = Object.freeze([5, 8, 12, 20, 30, 50]);
export const CHEST_FALLBACK = 25; // 올릴 무기·보조 능력이 없으면 강화 대신 더 주는 월정석(임시)

export const xpNeeded = level => Math.round(H.XP_BASE + (level - 1) * H.XP_STEP + (level - 1) ** 2 * H.XP_CURVE);
// 달력이 흐를수록 그늘이 짙어진다: 사냥 시작 때 정해 사냥 내내 쓴다
export const monthScale = day => { const m = Math.min(calendarOf(day).monthIdx, 11); return { hp: 1 + H.MONTH_HP * m, dmg: 1 + H.MONTH_DMG * m }; };
export const gemTier = v => (v < 4 ? 0 : v < 20 ? 1 : 2);

export function huntCheck(state, hunterId = 'neo') {
  const reasons = [];
  if (!['neo','seohanbi'].includes(hunterId) || (hunterId === 'seohanbi' && !state.roster.seohanbi)) reasons.push('아직 함께 사냥할 수 없는 동료입니다');
  const lock = placeLock(state, 'hunt'); if (lock) reasons.push(lock);
  const busy = state.shift ? personBusyReason(state, hunterId) : null;
  if (busy) reasons.push(busy);
  else if (state.people[hunterId]?.activity !== 'idle') reasons.push('선택한 동료가 다른 활동 중입니다');
  if (hunterId === 'neo' && state.ap?.neoTask === 'farm') reasons.push('네오는 이번 순에 농장을 맡았어요 · 다음 순에 사냥을 떠날 수 있어요');
  if (state.mode === 'shift') reasons.push('정규 영업 중에는 사냥을 떠날 수 없습니다');
  else if (state.mode === 'settlement') reasons.push('결산을 닫은 뒤 떠날 수 있습니다');
  else if (state.mode === 'hunt') reasons.push('이미 사냥 중입니다');
  if (state.interior.draft) reasons.push('인테리어 편집을 먼저 마쳐 주세요');
  if (state.mode === 'prep') { const ap = apCheck(state, 1); if (!ap.ok) reasons.push(ap.reason); } // 사냥 = 행동력 1
  return { ok: reasons.length === 0, reasons };
}

export function startHunt(state, depth = 1, hunterId = 'neo') {
  const chk = huntCheck(state, hunterId);
  if (!chk.ok) return { ok: false, reason: chk.reasons[0], reasons: chk.reasons };
  if (!Number.isInteger(depth) || depth < 1 || depth > maxHuntDepth(state)) return { ok: false, reason: '아직 갈 수 없는 깊이입니다' };
  spendAp(state, 1);
  if (hunterId === 'neo') state.ap.neoTask = 'hunt';
  state.mode = 'hunt';
  state.paused = false;
  Object.assign(state.people[hunterId], { activity: 'hunting', form: hunterId === 'neo' ? 'cat' : 'tiger', visitId: null, tableNo: null, endAt: null });
  // 장비 + 네오 친밀도 능력(시작 HP·무기 피해·보스 월정석)
  const fx = bondFx(state.affinity);
  const gear = gearBonus(state.gear?.equipped);
  gear.hp += fx.huntHp;
  gear.dmg += fx.huntDmg;
  gear.bossMoon = fx.bossMoon;
  if(hunterId === 'seohanbi') { gear.hp += 120; gear.dmg += .8; gear.speed += .12; gear.magnet += .3; }
  const enhancement = enhancementBonus(state,hunterId); gear.hp += enhancement.hp; gear.dmg += enhancement.dmg; gear.magnet += enhancement.magnet;
  const careerLevel = hunterProgress(state.hunter.xp).level;
  const statLevel = Math.min(careerLevel, TEMP.HUNT_CAREER.statCap); // 성장 보너스는 Lv10에서 멈춘다
  gear.hp += (statLevel - 1) * TEMP.HUNT_CAREER.hpPerLevel;
  gear.dmg += (statLevel - 1) * TEMP.HUNT_CAREER.damagePerLevel;
  const saved=state.hunter.builds?.[hunterId];
  const hp = H.PLAYER_HP + gear.hp + (saved?.passives?.fish_stock||0)*20;
  state.hunt = normalizeHunt({
    id: nextId(state, 'hunt'), elapsedMs: 0, durationMs: null, hunterId, hp, maxHp: hp, gear,
    bag: { moonstone: 0 }, kills: 0, status: 'running', depth, careerLevel, careerXP: 0,
    caps: Object.fromEntries(SKILL_IDS.map(id => [id, skillCap(id, skillRank(state, id))])), // 출발 때 고정한 단련 상한
    scale: depthScale(depth, monthScale(state.day), calendarOf(state.day).monthIdx),
    fieldSeed:Math.floor(nextRandom(state.rng)*2147483647),brokenProps:{},propDamage:{},
    ...(saved?{level:saved.level,xp:saved.xp,weapons:structuredClone(saved.weapons),passives:{...saved.passives},picks:structuredClone(saved.picks||[])}:{}),
  });
  emit('huntStart', {});
  return { ok: true };
}

// 예전 저장(레벨 개념 전)의 사냥도 이어서 할 수 있게 빠진 칸을 채운다
export function normalizeHunt(hs) {
  if (!hs) return hs;
  hs.hunterId ??= 'neo'; hs.durationMs = null; hs.bossKills ??= 0;
  hs.level ??= 1;
  hs.xp ??= 0;
  hs.xpNext ??= xpNeeded(hs.level);
  hs.weapons ??= [{ id: 'bolt', level: 1, evo: false }];
  hs.passives ??= {};
  hs.picks ??= [];
  hs.gear ??= gearBonus();
  hs.fired ??= [];
  hs.bossDown ??= false;
  hs.scale ??= { hp: 1, dmg: 1 };
  hs.depth ??= 1; hs.careerLevel ??= 1; hs.careerXP ??= 0;
  hs.startDepth ??= hs.depth; hs.stageMs ??= 0; hs.boss ??= null; hs.bossSpawned ??= false;
  hs.cleared ??= 0; hs.stageChoice ??= null; hs.chests ??= [];
  hs.caps ??= Object.fromEntries(SKILL_IDS.map(id => [id, WEAPONS[id] ? WEAPON_MAX_LV : PASSIVE_MAX_LV])); // 단련 이전 사냥은 그대로
  return hs;
}

function makeWorld() {
  return {
    player: { x: H.FIELD_W / 2, y: H.FIELD_H / 2, facing: 'down', dirX: 0, dirY: 1, moving: false, hurtUntil: 0, action: 'idle', actionUntil: 0 },
    enemies: new Pool(() => ({ uid: 0, type: 'shade_hand', x: 0, y: 0, hp: 0, maxHp: 0, speed: 0, kx: 0, ky: 0, hitAt: 0, orbitAt: 0, cresAt: 0, vx: 0, vy: 0, life: 0, phase: 0 })),
    shots: new Pool(() => ({ kind: 'bolt', x: 0, y: 0, vx: 0, vy: 0, life: 0, dmg: 0, pierce: 0, lastHit: 0, ox: 0, oy: 0, out: true, dist: 0, range: 0 })),
    strikes: new Pool(() => ({ x: 0, y: 0, at: 0, r: 0, dmg: 0, boomUntil: 0 })),
    drops: new Pool(() => ({ kind: 'gem', id: '', v: 0, x: 0, y: 0, speed: 0, magnet: false })),
    texts: new Pool(() => ({ x: 0, y: 0, v: 0, crit: false, life: 0 })),
    hostile: [], fx: [], props: [], zones: [],
    cool: {},      // 무기별 다음 발사 시각
    orbitAngle: 0,
    auraAt: 0,
    spawnAcc: 0,
    uidSeq: 0,
    shakeUntil: 0,
    banner: null,  // { label, warn, until }
    guard: 0,      // 달빛 수호부 피해 감소
    cameo: null,   // 검은 호랑이 실루엣 { x, y, until }
  };
}

export function getHuntWorld(state) {
  if (!state.hunt) return null;
  normalizeHunt(state.hunt);
  let w = worlds.get(state.hunt);
  if (!w) { w = makeWorld(); worlds.set(state.hunt, w); }
  return w;
}

// ── 능력치(보조 능력 반영)
export function mods(hs) {
  const p = hs.passives;
  const g = hs.gear || gearBonus();
  return {
    dmg: g.dmg,
    speed: (1 + 0.1 * (p.paw || 0)) * g.speed,
    area: 1 + 0.15 * (p.hat || 0),
    cool: 1 - 0.08 * (p.bell || 0),
    magnet: (1 + 0.3 * (p.whisker || 0)) * g.magnet,
    crit: H.CRIT_BASE + 0.05 * (p.luck || 0),
  };
}

export function weaponStats(wp, m) {
  const def = WEAPONS[wp.id];
  const lv = wp.level;
  const s = { ...def.base };
  for (const [k, v] of Object.entries(def.per || {})) s[k] += v * (lv - 1);
  s.count = def.counts[lv - 1];
  if (def.pierceAt) for (const [at, v] of Object.entries(def.pierceAt)) if (lv >= +at) s.pierce += v;
  if (wp.evo) {
    s.damage *= EVO_MULT;
    if (wp.id === 'bolt') { s.radius *= 1.3; s.halfArc = Math.PI * .6; }
    if (wp.id === 'orbit') { s.count = 6; s.radius *= 1.25; }
    if (wp.id === 'crescent') { s.count += 2; s.range *= 1.3; }
    if (wp.id === 'aura') { s.heal *= 2; s.guard += .1; }
    if (wp.id === 'tarot') { s.count += 3; s.radius *= 1.3; }
  }
  if (s.radius) s.radius *= m.area;
  if (s.range) s.range *= m.area;
  if (s.cooldown) s.cooldown *= m.cool;
  if (s.tickMs) s.tickMs *= m.cool;
  if (s.damage) s.damage *= m.dmg || 1;
  return s;
}

// ── 레벨업 카드
// 윤달 공방 단련 상한(hs.caps) 아래 기술만 나온다. 못 배운 기술은 상한 0
export function optionsFor(hs) {
  const out = [], cap = id => hs.caps[id] || 0;
  for (const wp of hs.weapons) if (wp.level < Math.min(WEAPON_MAX_LV, cap(wp.id))) out.push({ kind: 'weapon', id: wp.id });
  if (hs.weapons.length < MAX_WEAPONS) for (const id of Object.keys(WEAPONS)) if (cap(id) && !hs.weapons.some(w => w.id === id)) out.push({ kind: 'weapon', id });
  const owned = Object.keys(hs.passives);
  for (const id of owned) if (hs.passives[id] < Math.min(PASSIVE_MAX_LV, cap(id))) out.push({ kind: 'passive', id });
  if (owned.length < MAX_PASSIVES) for (const id of Object.keys(PASSIVES)) if (cap(id) && !owned.includes(id)) out.push({ kind: 'passive', id });
  return out;
}

function rollOffer(state, n = 3) {
  const all = optionsFor(state.hunt);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(nextRandom(state.rng) * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const pick = all.slice(0, n);
  return pick.length ? pick : [{ kind: 'pouch' }]; // 모두 단련 상한이면 회복 대신 월정석
}

export function describeOption(hs, o) {
  if (o.kind === 'heal') return { icon: '🐟', name: '간식 시간', text: `HP ${H.HEAL_FISH} 회복`, tag: '회복' }; // 옛 저장의 남은 카드
  if (o.kind === 'pouch') return { icon: '☾', name: '월정석 주머니', text: `모든 기술이 단련 상한이에요 · 월정석 +${TEMP.HUNT_SKILLS.POUCH}`, tag: '보너스' };
  const cap = hs.caps?.[o.id];
  if (o.kind === 'passive') {
    const d = PASSIVES[o.id], lv = hs.passives[o.id] || 0;
    return { icon: d.icon, name: d.name, text: d.desc, tag: lv ? `Lv ${lv} → ${lv + 1}` : '새 보조 능력', cap };
  }
  const d = WEAPONS[o.id], wp = hs.weapons.find(w => w.id === o.id);
  const tag = wp ? `Lv ${wp.level} → ${wp.level + 1}` : '새 무기';
  const evoHint = wp && wp.level + 1 === WEAPON_MAX_LV ? ` · ${PASSIVES[d.evo.pair].name}와 함께면 진화` : '';
  return { icon: d.icon, name: d.name, text: d.desc + evoHint, tag, cap };
}

function applyOption(state, o) {
  const hs = state.hunt;
  if (o.kind === 'heal') hs.hp = Math.min(hs.maxHp, hs.hp + H.HEAL_FISH);
  else if (o.kind === 'pouch') hs.bag.moonstone = (hs.bag.moonstone || 0) + TEMP.HUNT_SKILLS.POUCH;
  else if (o.kind === 'passive') {
    hs.passives[o.id] = Math.min(PASSIVE_MAX_LV, (hs.passives[o.id] || 0) + 1);
    if (o.id === 'fish_stock') { hs.maxHp += 20; hs.hp += 20; }
  } else {
    const wp = hs.weapons.find(w => w.id === o.id);
    if (wp) wp.level = Math.min(WEAPON_MAX_LV, wp.level + 1);
    else hs.weapons.push({ id: o.id, level: 1, evo: false });
  }
  for (const wp of hs.weapons) {
    const evo = WEAPONS[wp.id].evo;
    if (!wp.evo && wp.level >= WEAPON_MAX_LV && hs.passives[evo.pair]) {
      wp.evo = true;
      emit('huntEvolve', { id: wp.id, name: evo.name });
    }
  }
}

// 레벨업 카드 고르기(엔진 명령 hunt.pick). 카드가 남아 있는 동안 사냥 시간은 멈춘다.
export function pick(state, index) {
  const hs = state.hunt;
  if (state.mode !== 'hunt' || !hs || hs.status !== 'running') return { ok: false, reason: '진행 중인 사냥이 없습니다' };
  normalizeHunt(hs);
  const offer = hs.picks[0];
  if (!offer) return { ok: false, reason: '고를 카드가 없습니다' };
  const o = offer[index];
  if (!o) return { ok: false, reason: '없는 카드입니다' };
  hs.picks.shift();
  applyOption(state, o);
  return { ok: true, option: o };
}

function gainXp(state, v) {
  const hs = state.hunt;
  hs.xp += v;
  while (hs.xp >= hs.xpNext) {
    hs.xp -= hs.xpNext;
    hs.level += 1;
    hs.xpNext = xpNeeded(hs.level);
    hs.picks.push(rollOffer(state));
    emit('huntLevelUp', { level: hs.level });
  }
}

// ── 생성
export const findBoss = w => { for (let i = 0; i < w.enemies.count; i++) if (ENEMIES[w.enemies.items[i].type].boss) return i; return -1; };
// 모든 생성 경로(일반·무리·포위·박쥐·정예·보스 소환)가 여기를 지난다: 단계가 허용한 종류만, 잡몹은 단계 상한까지.
// HP 는 단계·달 배율만 곱한다(경과 시간으로 커지지 않는다)
export function spawnEnemy(state, w, type, x, y) {
  const hs = state.hunt, def = ENEMIES[type];
  if (!def) return null;
  if (!def.boss) {
    if (!stageAllows(hs.depth, type)) return null;
    const alive = w.enemies.count - (findBoss(w) >= 0 ? 1 : 0);
    if (alive >= stageDef(hs.depth).cap + (def.elite ? 2 : 0) || w.enemies.count >= H.MAX_ENEMIES) return null;
  }
  const e = w.enemies.spawn();
  Object.assign(e, {
    rolePhase:'approach',roleUntil:0,nextAttack:hs.elapsedMs+1500,aimX:0,aimY:1,motionX:0,motionY:0,warningR:0,facing:'down',
    uid: ++w.uidSeq, type, hp: Math.round(def.hp * hs.scale.hp), speed: def.speed * (def.boss ? 1 : randRange(state.rng, 0.85, 1.15)),
    kx: 0, ky: 0, hitAt: 0, orbitAt: 0, cresAt: 0, vx: 0, vy: 0, life: 0, phase: nextRandom(state.rng) * 6.28,
    x, y,
  });
  e.maxHp = e.hp;
  if (def.boss) initBoss(e, hs.elapsedMs);
  return e;
}

function aroundPlayer(state, w, type) {
  const a = nextRandom(state.rng) * Math.PI * 2;
  const r = randRange(state.rng, ...H.SPAWN_DIST);
  return spawnEnemy(state, w, type, w.player.x + Math.cos(a) * r, w.player.y + Math.sin(a) * r);
}

function pickType(state) {
  const pool = stagePool(state.hunt.depth);
  const total = pool.reduce((a, m) => a + m[2], 0);
  let r = nextRandom(state.rng) * total;
  for (const m of pool) { r -= m[2]; if (r < 0) return m[0]; }
  return pool[0][0];
}
const spawnMinion = (state, w, x, y) => spawnEnemy(state, w, pickType(state), x, y);

function runEvent(state, w, ev) {
  const p = w.player;
  if (ev.kind === 'horde') {
    const a = -Math.PI / 2 + (nextRandom(state.rng) - .5) * Math.PI * .6; // 화면 위쪽 반원(세로 화면에서도 보이게)
    for (let i = 0; i < 16; i++) {
      const side = (i - 7.5) * 26;
      spawnEnemy(state, w, 'shade_hand', p.x + Math.cos(a) * 430 - Math.sin(a) * side, p.y + Math.sin(a) * 430 + Math.cos(a) * side);
    }
  } else if (ev.kind === 'ring') {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      spawnEnemy(state, w, i % 3 ? 'shade_hand' : 'shade_blob', p.x + Math.cos(a) * 330, p.y + Math.sin(a) * 330);
    }
  } else if (ev.kind === 'swarm') {
    const dir = nextRandom(state.rng) < 0.5 ? 1 : -1;
    for (let i = 0; i < 18; i++) {
      const e = spawnEnemy(state, w, 'shade_bat', p.x - dir * 420, p.y - 220 + i * 26);
      if (e) { e.vx = dir * 150; e.vy = 0; e.life = 7000; }
    }
  } else if (ev.kind === 'elite') aroundPlayer(state, w, 'elite_hand');
}

// 단계 보스. 저장된 HP·페이즈가 있으면(이어하기) 그대로 되살린다
function spawnBoss(state, w) {
  const hs = state.hunt, type = hs.boss?.type || bossFor(hs.depth, hs.hunterId, !!state.roster.seohanbi);
  const e = aroundPlayer(state, w, type);
  if (!e) return null;
  if (hs.boss) { e.maxHp = hs.boss.maxHp; e.hp = Math.min(e.maxHp, hs.boss.hp); initBoss(e, hs.elapsedMs, hs.boss.phase || 0); }
  else hs.boss = { type, hp: e.hp, maxHp: e.maxHp, phase: 0 };
  hs.bossSpawned = true;
  return e;
}

// 단계 시간(stageMs) 기준 사건·보스. 키는 `<단계>:<종류>` 이고 다음 단계로 가면 비운다
function events(state, w, t) {
  const hs = state.hunt, st = hs.stageMs, n = hs.depth, prep = stageDef(n).prepMs;
  const once = k => !hs.fired.includes(k) && hs.fired.push(k);
  for (const ev of stageEvents(n)) {
    if (st >= ev.at - 2000 && once(`${n}:${ev.kind}:warn`)) { w.banner = { label: `⚠ ${ev.label}`, warn: true, until: t + 2000 }; emit('huntEvent', { kind: ev.kind, label: ev.label, warn: true }); }
    if (st >= ev.at && once(`${n}:${ev.kind}`)) { w.banner = { label: ev.label, warn: false, until: t + 1600 }; runEvent(state, w, ev); emit('huntEvent', { kind: ev.kind, label: ev.label, warn: false }); }
  }
  // 네오가 아직 모르는 검은 호랑이가 멀리서 지켜본다(연출만, 전장과 함께 사라진다)
  if (hs.hunterId === 'neo' && !state.roster.seohanbi && HANBI_STAGES.includes(n) && n < 100 && st >= prep * .5 && once(`${n}:cameo`)) {
    const a = -Math.PI / 2 + (nextRandom(state.rng) - .5) * Math.PI * .6; // 화면 위쪽 반원(세로 화면에서도 보이게)
    w.cameo = { x: w.player.x + Math.cos(a) * 210, y: w.player.y + Math.sin(a) * 210, until: t + 4000 };
    w.banner = { label: '??? · 검은 그림자가 이쪽을 보고 있다', warn: false, until: t + 3000 };
    emit('huntEvent', { kind: 'cameo', label: '???', warn: false });
  }
  if (hs.stageChoice) return;
  const name = ENEMIES[hs.boss?.type || bossFor(n, hs.hunterId, !!state.roster.seohanbi)].name;
  if (st >= prep - 2000 && once(`${n}:boss:warn`)) { w.banner = { label: `⚠ 보스 등장 · ${name}`, warn: true, until: t + 2000 }; emit('huntEvent', { kind: 'boss', label: name, warn: true }); }
  if (st >= prep && !hs.bossSpawned) {
    if (spawnBoss(state, w)) { w.banner = { label: `${name} · 쓰러뜨리면 클리어`, warn: false, until: t + 2200 }; w.shakeUntil = t + 600; emit('huntEvent', { kind: 'boss', label: name, warn: false }); }
  } else if (hs.bossSpawned && hs.boss && findBoss(w) < 0) spawnBoss(state, w); // 이어하기로 전장을 새로 만들었으면 보스를 되살린다
}

// ── 피해·처치·드롭
function addDrop(w, kind, id, v, x, y) {
  if (w.drops.count >= H.GEM_CAP) {
    // 별조각이 너무 많으면 가장 가까운 기존 별조각에 값을 합친다
    for (let i = w.drops.count - 1; i >= 0; i--) { const d = w.drops.items[i]; if (d.kind === kind && d.id === id) { d.v += v; return; } }
  }
  const d = w.drops.spawn();
  Object.assign(d, { kind, id, v, x, y, speed: 0, magnet: false });
}

function dropFrom(state, w, e) {
  const def = ENEMIES[e.type];
  addDrop(w, 'gem', '', def.xp, e.x, e.y);
  if (def.chest) {
    const base = def.boss ? Math.round(H.MOON_DROP.boss * (1 + (state.hunt?.gear?.bossMoon || 0))) : H.MOON_DROP.elite;
    addDrop(w, 'moon', 'moonstone', huntMoonReward(base, state.hunt.scale), e.x - 14, e.y);
    addDrop(w, 'chest', 'chest', 0, e.x + 14, e.y);
    return;
  }
  let r = nextRandom(state.rng);
  for (const d of H.POWER_DROP) { if (r < d.chance) { addDrop(w, d.id, d.id, 0, e.x - 10, e.y + 8); break; } r -= d.chance; }
  if (nextRandom(state.rng) < H.MOON_DROP.chance) addDrop(w, 'moon', 'moonstone', huntMoonReward(1, state.hunt.scale), e.x + 10, e.y - 6);
}

function killEnemy(state, w, i) {
  const e = w.enemies.items[i];
  const def = ENEMIES[e.type];
  dropFrom(state, w, e);
  if (def.boss) clearStage(state, w, def);
  if(state.hunt.elapsedMs-(w.lastDeathSound||-1000)>140){emit('huntDeath',{});w.lastDeathSound=state.hunt.elapsedMs;}
  w.enemies.release(i);
  state.hunt.kills += 1;
  const c = TEMP.HUNT_CAREER;
  state.hunt.careerXP += Math.ceil((def.boss ? c.xpBoss : def.elite ? c.xpElite : c.xpNormal) * (state.hunt.scale.reward ?? 1));
}

// 피해를 주고 죽었으면 true. kb = 밀어낼 방향(정규화 전 벡터)
function hurt(state, w, i, base, m, kbx = 0, kby = 0, melee=false) {
  const e = w.enemies.items[i];
  if(state.hunt.elapsedMs-(w.lastHitSound||-1000)>=180){emit('huntHit',{});w.lastHitSound=state.hunt.elapsedMs;}
  const crit = nextRandom(state.rng) < Math.min(.8,m.crit+(melee?.15:0));
  const dmg = Math.round(base * (crit ? (melee?2.3:H.CRIT_MULT) : 1));
  if(crit && melee && state.hunt.hunterId==='neo' && state.hunt.elapsedMs-(w.lastCritLine||-5000)>4200){w.lastCritLine=state.hunt.elapsedMs;emit('huntCritical',{});}
  e.hp -= dmg;
  e.hitAt = state.hunt.elapsedMs;
  addBattleFx(w,{kind:'hit',x:e.x,y:e.y-8,r:crit?24:16,at:e.hitAt,until:e.hitAt+180});
  const kl = Math.hypot(kbx, kby);
  if (kl > 0 && !ENEMIES[e.type].boss) { const k = H.KNOCKBACK * (ENEMIES[e.type].elite ? 0.3 : 1); e.kx += kbx / kl * k; e.ky += kby / kl * k; }
  if (w.texts.count < 40) { const tx = w.texts.spawn(); Object.assign(tx, { x: e.x + randRange(state.rng, -6, 6), y: e.y - 18, v: dmg, crit, life: 650 }); }
  if (e.hp <= 0) { killEnemy(state, w, i); return true; }
  return false;
}

function nearest(w, x, y, maxD = Infinity, skip = null) {
  let best = -1, bd = maxD * maxD;
  for (let i = 0; i < w.enemies.count; i++) {
    const e = w.enemies.items[i];
    if (skip && skip.has(e.uid)) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// ── 무기
function fireWeapons(state, w, t, m, sec) {
  const hs = state.hunt, p = w.player;
  for (const wp of hs.weapons) {
    const s = weaponStats(wp, m);
    if (wp.id === 'orbit') {
      w.orbitAngle += s.spin * sec;
      for (let k = 0; k < s.count; k++) {
        const a = w.orbitAngle + (k / s.count) * Math.PI * 2;
        const ox = p.x + Math.cos(a) * s.radius, oy = p.y + Math.sin(a) * s.radius;
        for (let i = w.enemies.count - 1; i >= 0; i--) {
          const e = w.enemies.items[i];
          if (t - e.orbitAt < s.hitGap) continue;
          if ((e.x - ox) ** 2 + (e.y - oy) ** 2 < (ENEMIES[e.type].r + 9) ** 2) { e.orbitAt = t; hurt(state, w, i, s.damage, m, e.x - p.x, e.y - p.y); }
        }
      }
      continue;
    }
    if (wp.id === 'aura') {
      if (t < w.auraAt) continue;
      w.auraAt=t+s.tickMs;
      if(hs.hp<hs.maxHp)hs.hp=Math.min(hs.maxHp,hs.hp+Math.round(s.heal));
      addBattleFx(w,{kind:'ward',x:p.x,y:p.y,r:s.radius,at:t,until:t+500});
      emit('huntAttack',{weapon:'aura'});continue;
    }
    if (t < (w.cool[wp.id] || 0)) continue;
    if (wp.id === 'bolt') {
      const target=nearest(w,p.x,p.y,s.radius+22);
      const prop=(w.props||[]).filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<s.radius+22).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      const e=target>=0?w.enemies.items[target]:prop;if(!e)continue;
      const angle=Math.atan2(e.y-p.y,e.x-p.x);
      p.swing={at:t,hitAt:t+90,until:t+360,hit:false,x:p.x,y:p.y,angle,radius:s.radius,halfArc:s.halfArc,damage:s.damage,evo:wp.evo};
      p.attackFacing=facingAngle(angle);p.action='attack';p.actionUntil=t+360;
    } else if (wp.id === 'crescent') {
      for (let k = 0; k < s.count; k++) {
        const a = Math.atan2(p.dirY, p.dirX) + (k - (s.count - 1) / 2) * 0.7;
        const b = w.shots.spawn();
        Object.assign(b, { kind: 'crescent', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, life: 4000, dmg: s.damage, out: true, dist: 0, range: s.range, hitGap: s.hitGap });
      }
    } else if (wp.id === 'tarot') {
      const used = new Set();
      for (let k = 0; k < s.count; k++) {
        let x, y;
        if (w.enemies.count) {
          const e = w.enemies.items[Math.floor(nextRandom(state.rng) * w.enemies.count)];
          if (used.has(e.uid) && w.enemies.count > s.count) { k--; if (used.size > 30) break; continue; }
          used.add(e.uid); x = e.x; y = e.y;
        } else { x = p.x + randRange(state.rng, -150, 150); y = p.y + randRange(state.rng, -200, 200); }
        const st = w.strikes.spawn();
        Object.assign(st, { x, y, at: t + s.warnMs + k * 70, r: s.radius, dmg: s.damage, boomUntil: 0 });
      }
    }
    // 부메랑·타로는 시전 동작(그리기 전용)
    if(wp.id==='crescent'||wp.id==='tarot')p.cast={at:t,until:t+320,facing:wp.id==='crescent'?facingAngle(Math.atan2(p.dirY,p.dirX)):p.facing};
    if(wp.id!=='bolt')emit('huntAttack',{weapon:wp.id});
    w.cool[wp.id] = t + s.cooldown;
  }
}

function stepShots(state, w, t, m, dt) {
  const p = w.player, sec = dt / 1000;
  for (let i = w.shots.count - 1; i >= 0; i--) {
    const s = w.shots.items[i];
    s.life -= dt;
    if (s.kind === 'crescent') {
      if (s.out) { s.dist += Math.hypot(s.vx, s.vy) * sec; if (s.dist >= s.range) s.out = false; }
      else {
        const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(s.vx, s.vy);
        s.vx = dx / d * sp; s.vy = dy / d * sp;
        if (d < 20) { w.shots.release(i); continue; }
      }
    }
    s.x += s.vx * sec; s.y += s.vy * sec;
    let dead = s.life <= 0;
    for (let j = w.enemies.count - 1; j >= 0 && !dead; j--) {
      const e = w.enemies.items[j];
      const rr = ENEMIES[e.type].r + (s.kind === 'crescent' ? 12 : 6);
      if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 >= rr * rr) continue;
      if (s.kind === 'crescent') {
        if (t - e.cresAt < s.hitGap) continue;
        e.cresAt = t; hurt(state, w, j, s.dmg, m, s.vx, s.vy);
      } else {
        if (e.uid === s.lastHit) continue;
        s.lastHit = e.uid;
        hurt(state, w, j, s.dmg, m, s.vx, s.vy);
        if (s.pierce-- <= 0) dead = true;
        break;
      }
    }
    if (dead) w.shots.release(i);
  }
  for (let i = w.strikes.count - 1; i >= 0; i--) {
    const st = w.strikes.items[i];
    if (st.boomUntil) { if (t >= st.boomUntil) w.strikes.release(i); continue; }
    if (t < st.at) continue;
    st.boomUntil = t + 260;
    for (let j = w.enemies.count - 1; j >= 0; j--) {
      const e = w.enemies.items[j];
      if ((e.x - st.x) ** 2 + (e.y - st.y) ** 2 < (st.r + ENEMIES[e.type].r) ** 2) hurt(state, w, j, st.dmg, m, e.x - st.x, e.y - st.y);
    }
  }
}

export function resolveMelee(state,w,t,m){
 const a=w.player.swing;if(!a||a.hit||t<a.hitAt)return;a.hit=true;emit('huntAttack',{weapon:'bolt'});
 for(let i=w.enemies.count-1;i>=0;i--){const e=w.enemies.items[i];if(withinMeleeArc(a.x,a.y,a.angle,a.radius,a.halfArc,e,ENEMIES[e.type].r))hurt(state,w,i,a.damage,m,e.x-a.x,e.y-a.y,true);}
 for(const prop of w.props||[]){if(!withinMeleeArc(a.x,a.y,a.angle,a.radius,a.halfArc,prop,prop.r))continue;const reward=hitFieldProp(state.hunt,prop,a.damage);addBattleFx(w,{kind:'hit',x:prop.x,y:prop.y,r:30,at:t,until:t+250});if(reward){addDrop(w,'moon','moonstone',reward,prop.x,prop.y);emit('huntObjectBroken',{reward});}}
}

function collect(state, w, t, m, dt) {
  const hs = state.hunt, p = w.player, sec = dt / 1000;
  const magR = H.MAGNET_RADIUS * m.magnet;
  for (let i = w.drops.count - 1; i >= 0; i--) {
    const it = w.drops.items[i];
    const dx = p.x - it.x, dy = p.y - it.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < magR) it.magnet = true;
    if (it.magnet) {
      it.speed = Math.min(800, it.speed + 1100 * sec);
      const stepLen = Math.min(d, it.speed * sec);
      it.x += dx / d * stepLen; it.y += dy / d * stepLen;
    }
    if (d >= H.PICKUP_RADIUS) continue;
    w.drops.release(i);
    if (it.kind === 'gem') {gainXp(state,it.v);if(t-(w.lastGemSound||-1000)>90){emit('huntGem',{});w.lastGemSound=t;}}
    else if (it.kind === 'moon') {
      hs.bag.moonstone = (hs.bag.moonstone || 0) + it.v;
      emit('huntPickup', { id: 'moonstone', name: `월정석 ×${it.v}`, v: it.v });
    } else if (it.kind === 'ing') { // 예전 저장의 재료 드롭(이어하기 호환)
      hs.bag[it.id] = (hs.bag[it.id] || 0) + 1;
      emit('huntPickup', { id: it.id, name: INGREDIENTS[it.id].name });
    } else if (it.kind === 'fish') {
      hs.hp = Math.min(hs.maxHp, hs.hp + H.HEAL_FISH);
      emit('huntPower', { kind: 'fish', label: `${POWER_NAMES.fish} · HP +${H.HEAL_FISH}` });
    } else if (it.kind === 'magnet') {
      for (let j = 0; j < w.drops.count; j++) if (w.drops.items[j].kind === 'gem') w.drops.items[j].magnet = true;
      emit('huntPower', { kind: 'magnet', label: `${POWER_NAMES.magnet} · 별조각을 모두 끌어온다` });
    } else if (it.kind === 'bomb') {
      for (let j = w.enemies.count - 1; j >= 0; j--) {
        const e = w.enemies.items[j];
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < H.BOMB_RADIUS ** 2) hurt(state, w, j, H.BOMB_DAMAGE, m, e.x - p.x, e.y - p.y);
      }
      w.shakeUntil = t + 400;
      emit('huntPower', { kind: 'bomb', label: POWER_NAMES.bomb });
    } else if (it.kind === 'chest') queueChest(state);
  }
}

function subStep(state, dt, input) {
  const hs = state.hunt;
  const w = getHuntWorld(state);
  const p = w.player;
  const sec = dt / 1000;
  hs.elapsedMs += dt; hs.stageMs += dt;
  const t = hs.elapsedMs;
  const m = mods(hs);
  if(!state.roster.museong && hs.careerLevel>=8 && t>=90000 && !state.museongEncounter){state.museongEncounter=true;w.banner={label:'안개 너머, 무성의 노래가 들려온다',warn:false,until:t+4000};emit('huntEvent',{kind:'encounter',label:'사냥을 마치고 무성의 이야기를 확인하세요',warn:false});}

  // 이동
  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.05;
  if (p.moving) {
    const k = Math.min(1, len) / len;
    p.x += input.x * k * H.PLAYER_SPEED * m.speed * sec;
    p.y += input.y * k * H.PLAYER_SPEED * m.speed * sec;
    p.dirX = input.x / len; p.dirY = input.y / len;
    p.facing = Math.abs(input.x) > Math.abs(input.y) ? (input.x > 0 ? 'right' : 'left') : (input.y > 0 ? 'down' : 'up');
  }

  // 사건·생성: 단계 밀도 목표(준비 시간 동안 시작→끝)보다 적을 때만, 모자란 만큼 빨리. 보스가 있으면 목표를 줄인다
  events(state, w, t);
  const sd = stageDef(hs.depth), boss = findBoss(w);
  const target = (sd.density[0] + (sd.density[1] - sd.density[0]) * Math.min(1, hs.stageMs / sd.prepMs)) * (boss >= 0 ? H.BOSS_DENSITY : 1);
  const missing = target - (w.enemies.count - (boss >= 0 ? 1 : 0));
  if (missing > 0 && !hs.stageChoice) {
    w.spawnAcc += sec * Math.min(H.SPAWN_RATE_MAX, H.SPAWN_RATE_MIN + H.SPAWN_RATE_PER_MISSING * missing);
    while (w.spawnAcc >= 1) { w.spawnAcc -= 1; aroundPlayer(state, w, pickType(state)); }
  } else w.spawnAcc = 0;

  fireWeapons(state, w, t, m, sec);
  for(let i=w.enemies.count-1;i>=0;i--){const e=w.enemies.items[i];if(!ENEMIES[e.type].elite&&Math.hypot(e.x-p.x,e.y-p.y)>1300)w.enemies.release(i);}
  w.props=nearbyProps(hs,p);
  resolveMelee(state,w,t,m);
  stepShots(state, w, t, m, dt);
  const aura = hs.weapons.find(x => x.id === 'aura');
  w.guard = aura ? Math.min(.6, weaponStats(aura, m).guard) : 0;
  stepEnemyBehaviors(state, w, t, dt);
  for (let i = w.enemies.count - 1; i >= 0; i--) {
    const e = w.enemies.items[i];
    if (!ENEMIES[e.type].boss) continue;
    const phase = stepBoss(state, w, e, t, dt, spawnMinion);
    if (hs.boss) { hs.boss.hp = Math.max(0, e.hp); hs.boss.phase = e.phaseNo || 0; }
    if (phase != null) { const def = ENEMIES[e.type], label = def.phases?.[phase]?.enrage ? `${def.name} 격노! · 공격이 빨라진다` : `${def.name}의 기세가 바뀌었다!`; w.banner = { label, warn: true, until: t + 2000 }; emit('huntEvent', { kind: 'bossPhase', label, warn: true }); }
  }
  stepZones(state, w, t);
  collect(state, w, t, m, dt);
  if (w.sweep) sweepField(state, w);
  if (w.cameo && t >= w.cameo.until) w.cameo = null;

  for (let i = w.texts.count - 1; i >= 0; i--) { const tx = w.texts.items[i]; tx.life -= dt; tx.y -= 30 * sec; if (tx.life <= 0) w.texts.release(i); }
  if (p.actionUntil && t >= p.actionUntil) { p.action = 'idle'; p.actionUntil = 0; }
  if (w.banner && t >= w.banner.until) w.banner = null;
}

// input: { x, y } -1~1 (조이스틱·키보드). 공격은 자동. 레벨업 카드가 남아 있으면 시간이 흐르지 않는다.
export function stepHunt(state, dt, input = { x: 0, y: 0 }) {
  const hs = state.hunt;
  if (!hs || hs.status !== 'running') return;
  normalizeHunt(hs);
  let left = dt;
  while (left > 0 && hs.status === 'running' && !paused(hs)) {
    const d = Math.min(H.SUB_STEP_MS, left);
    left -= d;
    subStep(state, d, input || { x: 0, y: 0 });
    if (hs.hp <= 0) { hs.status = 'down'; hs.stageChoice = null; flushChests(state); emit('huntEnd', { status: 'down' }); }
  }
}
// 레벨업 카드·열지 않은 상자·클리어 선택이 남아 있으면 사냥 시간이 흐르지 않는다
export const paused = hs => hs.picks.length > 0 || hs.chests.length > 0 || !!hs.stageChoice;

// ── 단계 클리어: 보스 처치 = 그 단계 클리어. 첫 클리어 보상은 사냥꾼별 원장 키로 한 번만
function clearStage(state, w, def) {
  const hs = state.hunt, n = hs.depth, key = `stage:${hs.hunterId}:${n}`;
  const first = !state.ledger.rewards[key];
  let bonus = 0;
  hs.bossDown = true; hs.bossKills += 1; hs.cleared += 1; hs.boss = null;
  if (first) {
    state.ledger.rewards[key] = true;
    bonus = huntMoonReward(firstClearMoon(n), hs.scale);
    hs.bag.moonstone = (hs.bag.moonstone || 0) + bonus;
  }
  state.hunter.maxStage = Math.min(100, Math.max(state.hunter.maxStage || 1, n + 1));
  // 한 번 출발에 STAGES_PER_RUN 단계까지. 그 뒤로는 귀환만 남는다
  const tired = n < 100 && hs.cleared >= H.STAGES_PER_RUN;
  hs.stageChoice = { stage: n, first, bonus, next: n < 100 && !tired, tired };
  w.sweep = true;
  w.banner = { label: `${def.name} 처치 · ${n}단계 클리어!`, warn: false, until: hs.elapsedMs + 2400 };
  emit('huntEvent', { kind: 'bossDown', label: `${n}단계 클리어!`, warn: false });
  emit('huntStageClear', { stage: n, first, bonus, tired, hunterId: hs.hunterId });
}

// 클리어 뒤 전장 정리: 남은 적·공격을 지우고 떨어진 월정석·별조각·상자는 모두 거둔다(적 순회가 끝난 뒤 실행)
function sweepField(state, w) {
  const hs = state.hunt;
  w.sweep = false;
  for (let i = w.drops.count - 1; i >= 0; i--) {
    const it = w.drops.items[i];
    if (it.kind === 'moon') hs.bag.moonstone = (hs.bag.moonstone || 0) + it.v;
    else if (it.kind === 'gem') gainXp(state, it.v);
    else if (it.kind === 'chest') queueChest(state);
  }
  w.drops.clear(); w.enemies.clear(); w.shots.clear(); w.strikes.clear(); clearBossAttacks(w);
  w.cameo = null;
}

// 다음 단계(엔진 명령 hunt.next). 무기·레벨·HP 는 그대로 이어 간다
export function nextStage(state) {
  const hs = state.hunt;
  if (state.mode !== 'hunt' || !hs || hs.status !== 'running' || !hs.stageChoice) return { ok: false, reason: '보스를 쓰러뜨려야 다음 단계로 갈 수 있어요' };
  if (hs.cleared >= H.STAGES_PER_RUN) return { ok: false, reason: '오늘은 여기까지 · 다음 출발에 이어 가요' };
  if (hs.depth >= 100 || hs.depth >= maxHuntDepth(state)) return { ok: false, reason: '더 깊은 단계가 없어요 · 귀환해 정산해 주세요' };
  if (hs.picks.length || hs.chests.length) return { ok: false, reason: '레벨업 카드와 상자를 먼저 정리해 주세요' };
  hs.depth += 1; hs.stageMs = 0; hs.boss = null; hs.bossSpawned = false; hs.bossDown = false; hs.fired = []; hs.stageChoice = null;
  hs.scale = depthScale(hs.depth, monthScale(state.day), calendarOf(state.day).monthIdx);
  const w = getHuntWorld(state);
  w.enemies.clear(); clearBossAttacks(w); w.spawnAcc = 0;
  w.banner = { label: `${hs.depth}단계 · 보스가 나올 때까지 버티기`, warn: false, until: hs.elapsedMs + 2200 };
  emit('huntStage', { depth: hs.depth });
  return { ok: true, depth: hs.depth };
}

// ── 희귀 상자: 줍는 순간 결과를 정해 저장하고(재접속해도 같은 결과), 화면은 룰렛으로 보여 주기만 한다
// 상자 강화도 단련 상한까지만
function chestTargets(hs) {
  const cap = id => hs.caps?.[id] || 0;
  return [
    ...hs.weapons.filter(x => x.level < Math.min(WEAPON_MAX_LV, cap(x.id))).map(x => ({ kind: 'weapon', id: x.id })),
    ...Object.entries(hs.passives).filter(([id, lv]) => lv < Math.min(PASSIVE_MAX_LV, cap(id))).map(([id]) => ({ kind: 'passive', id })),
  ];
}
function queueChest(state) {
  const hs = state.hunt, targets = chestTargets(hs);
  const upgrade = targets.length ? targets[Math.floor(nextRandom(state.rng) * targets.length)] : null;
  const slot = Math.floor(nextRandom(state.rng) * CHEST_WHEEL.length);
  hs.chests.push({ id: nextId(state, 'chest'), upgrade, slot, moon: huntMoonReward(CHEST_WHEEL[slot], hs.scale) });
  emit('huntChest', { label: POWER_NAMES.chest });
}
function applyChest(state, c) {
  const hs = state.hunt;
  // 고른 뒤 레벨업 카드로 이미 최대가 됐으면(또는 처음부터 없으면) 월정석으로 바꾼다
  const still = !!c.upgrade && chestTargets(hs).some(x => x.kind === c.upgrade.kind && x.id === c.upgrade.id);
  const label = still ? describeOption(hs, c.upgrade).name : null;
  if (still) applyOption(state, c.upgrade);
  const moon = c.moon + (still ? 0 : CHEST_FALLBACK);
  hs.bag.moonstone = (hs.bag.moonstone || 0) + moon;
  return { upgraded: still ? c.upgrade : null, moon, label };
}
// 상자 열기(엔진 명령 hunt.chest). 가장 먼저 주운 상자를 연다
export function openChest(state) {
  const hs = state.hunt;
  if (state.mode !== 'hunt' || !hs || !hs.chests?.length) return { ok: false, reason: '열 상자가 없습니다' };
  const c = hs.chests.shift(), r = applyChest(state, c);
  emit('huntPower', { kind: 'chest', label: r.label ? `${r.label} 강화 · 월정석 +${r.moon}` : `월정석 +${r.moon}` });
  return { ok: true, chest: c, ...r };
}
function flushChests(state) { const hs = state.hunt; while (hs.chests?.length) applyChest(state, hs.chests.shift()); }

export function retreat(state) {
  if (!state.hunt || state.hunt.status !== 'running') return { ok: false, reason: '진행 중인 사냥이 없습니다' };
  normalizeHunt(state.hunt);
  state.hunt.status = 'retreat';
  state.hunt.stageChoice = null;
  flushChests(state); // 열지 않은 상자는 정해진 결과대로 적용, 레벨업 카드는 다음 사냥으로 넘긴다
  emit('huntEnd', { status: 'retreat' });
  return { ok: true };
}

// 결과 수령: 가방의 월정석(예전 저장이면 재료도)을 hunt id 원장으로 한 번만 지급하고 네오를 사람 모습·대기로 되돌린다.
export function finishHunt(state) {
  const hs = state.hunt;
  if (state.mode !== 'hunt' || !hs) return { ok: false, reason: '진행 중인 사냥이 없습니다' };
  if (hs.status === 'running') return { ok: false, reason: '사냥이 아직 끝나지 않았습니다 (돌아가기를 누르면 바로 끝낼 수 있어요)' };
  const key = `hunt:${hs.id}`;
  const bonus = survivalReward(hs);
  const totalBag = {...hs.bag, moonstone:(hs.bag.moonstone || 0) + bonus.moonstone};
  for(const [id,n] of Object.entries(bonus.items)) totalBag[id] = (totalBag[id] || 0) + n;
  if (!state.ledger.rewards[key]) {
    state.ledger.rewards[key] = true;
    for (const [id, n] of Object.entries(totalBag)) {
      if (id === 'moonstone') { state.moonstone = (state.moonstone || 0) + n; state.stats.moonstonesObtained += n; }
      else if (INGREDIENTS[id]) state.stock[id] = (state.stock[id] || 0) + n;
    }
    for(const menu of Object.values(MENUS))if(menu.nominationOnly && Object.keys(menu.ingredients).some(id=>INGREDIENTS[id].huntOnly && totalBag[id]>0))state.learned[menu.id]=true;
    state.stats.nightDewObtained += totalBag.night_dew || 0;
    const gearLocked = !!placeLock(state, 'gear');
    state.stats.huntsCompleted += 1;
    if (gearLocked) emit('placeUnlocked', { id: 'gear', name: PLACE_NAMES.gear });
    state.hunter.xp += hs.careerXP || 0;
    state.hunter.kills += hs.kills;
    state.hunter.lastStage=hs.depth;
    state.hunter.builds??={};
    state.hunter.builds[hs.hunterId]={level:hs.level,xp:hs.xp,weapons:structuredClone(hs.weapons),passives:{...hs.passives},picks:structuredClone(hs.picks||[]),stage:hs.depth};
    state.stats.longestHuntMs = Math.max(state.stats.longestHuntMs || 0, hs.elapsedMs);
    state.stats.huntBosses = (state.stats.huntBosses || 0) + (hs.bossKills || 0);
    workHunt(state, (hs.cleared || 0) > 0, hs.hunterId);
    // 윤달의 부탁: 영냥이로 보스를 쓰러뜨리고 돌아와 정산하면 완료
    if(hs.bossKills>0 && hs.hunterId==='neo' && state.yunQuest?.status==='active'){state.yunQuest.status='complete';emit('questProgress',{label:'윤달의 부탁 · 보스 토벌 완료'});}
  }
  state.lastHunt = { id: hs.id, status: hs.status, hunterId:hs.hunterId, bonus, fieldBag:{...hs.bag}, bag: totalBag, kills: hs.kills, elapsedMs: hs.elapsedMs, level: hs.level ?? 1, bossDown: !!hs.bossDown, depth: hs.depth, startDepth: hs.startDepth ?? hs.depth, cleared: hs.cleared || 0, maxStage: state.hunter.maxStage || 1, careerXP: hs.careerXP || 0, careerLevel: hunterProgress(state.hunter.xp).level };
  worlds.delete(hs);
  state.hunt = null;
  state.mode = 'prep';
  state.paused = false;
  Object.assign(state.people[hs.hunterId || 'neo'], { activity: 'idle', form: 'human' });
  emit('huntFinished', { bag: state.lastHunt.bag });
  return { ok: true };
}

export function useSupply(state,id) {
 const hs=state.hunt, d=SUPPLIES[id];
 if(state.mode!=='hunt'||!hs||hs.status!=='running'||paused(normalizeHunt(hs)))return {ok:false,reason:'사냥 중에 사용할 수 있어요'};
 if(!d || !(state.armory?.supplies?.[id]>0))return {ok:false,reason:'먼저 모카 식재료점에서 준비해 주세요'};
 if(id==='tonic' && hs.hp>=hs.maxHp)return {ok:false,reason:'이미 체력이 가득해요'};
 const w=getHuntWorld(state);state.armory.supplies[id]-=1;
 if(id==='tonic')hs.hp=Math.min(hs.maxHp,hs.hp+Math.ceil(hs.maxHp*.35));
 if(id==='shield')hs.shieldUntil=hs.elapsedMs+8000;
 if(id==='magnet')for(let i=0;i<w.drops.count;i++)w.drops.items[i].magnet=true;
 if(id==='nova')for(let i=w.enemies.count-1;i>=0;i--){const e=w.enemies.items[i];if(Math.hypot(e.x-w.player.x,e.y-w.player.y)<300)hurt(state,w,i,240*mods(hs).dmg,mods(hs),0,0);}
 emit('huntPower',{kind:id,label:d.name});return {ok:true};
}
