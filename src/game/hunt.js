// 영냥이 월정석 사냥(생존형, 100단계). 적은 재료가 아니라 월정석(환전용)을 떨어뜨린다. 정규 영업과 분리된 모드이며 네오와 같은 인물 잠금(people.neo)을 쓴다.
// 장비(data/gear.js) 효과는 출발할 때 hs.gear 로 고정해 사냥 중 바뀌지 않는다.
// 저장되는 것: 진행 시간·HP·가방·장비 효과·레벨·경험치·무기·보조 능력·대기 중인 레벨업 카드·지난 사건.
// 전장(적·탄·드롭 위치)은 저장하지 않고 이어하기 때 새로 만든다.
// killerflowerpig 에서 가져온 것: Pool(그대로), 조이스틱 입력(변형). 무기 레벨 누적·진화 배율·
// 밀도 목표 생성기·별조각 등급/합치기는 개념만 참고해 이 파일에서 새로 썼다(전투 로직 이식 아님).

import { enhancementBonus, SUPPLIES } from './moka-armory.js';
import { survivalReward } from './hunt-rewards.js';
import { PDF } from '../config/balance.pdf.js';
import { TEMP } from '../config/balance.temp.js';
import { INGREDIENTS,MENUS } from '../data/menus.js';
import { gearBonus } from '../data/gear.js';
import {
  WEAPONS, PASSIVES, ENEMIES, SPAWN_MIX, HUNT_EVENTS,
  MAX_WEAPONS, MAX_PASSIVES, WEAPON_MAX_LV, PASSIVE_MAX_LV, EVO_MULT,
} from '../data/hunt-kit.js';
import { Pool } from '../core/pool.js';
import { nextRandom, randRange } from '../core/rng.js';
import { emit, nextId } from './state.js';
import { personBusyReason } from './nomination.js';
import { apCheck, spendAp, calendarOf, totalMonths } from './calendar.js';
import { bondFx } from '../data/bonds.js';
import { workHunt } from './bonds.js';
import { hunterProgress, maxHuntDepth, depthScale, huntMoonReward } from './hunt-growth.js';

const H = TEMP.HUNT;
const worlds = new WeakMap(); // state.hunt 객체 → 실행 중 전장(저장 안 함)
const POWER_NAMES = { fish: '구운 생선', magnet: '수염 자석', bomb: '달빛 폭탄', chest: '별 상자' };

export const xpNeeded = level => Math.round(H.XP_BASE + (level - 1) * H.XP_STEP + (level - 1) ** 2 * H.XP_CURVE);
// 달력이 흐를수록 그늘이 짙어진다: 사냥 시작 때 정해 사냥 내내 쓴다
export const monthScale = day => { const m = Math.min(calendarOf(day).monthIdx, 11); return { hp: 1 + H.MONTH_HP * m, dmg: 1 + H.MONTH_DMG * m }; };
export const gemTier = v => (v < 4 ? 0 : v < 20 ? 1 : 2);

export function huntCheck(state, hunterId = 'neo') {
  const reasons = [];
  if (!['neo','seohanbi'].includes(hunterId) || (hunterId === 'seohanbi' && !state.roster.seohanbi)) reasons.push('아직 함께 사냥할 수 없는 동료입니다');
  if (!state.huntUnlocked) reasons.push('아직 사냥터 이야기를 보지 않았습니다');
  const busy = state.shift ? personBusyReason(state, hunterId) : null;
  if (busy) reasons.push(busy);
  else if (state.people[hunterId]?.activity !== 'idle') reasons.push('선택한 동료가 다른 활동 중입니다');
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
  gear.hp += (careerLevel - 1) * TEMP.HUNT_CAREER.hpPerLevel;
  gear.dmg += (careerLevel - 1) * TEMP.HUNT_CAREER.damagePerLevel;
  const hp = H.PLAYER_HP + gear.hp;
  state.hunt = normalizeHunt({
    id: nextId(state, 'hunt'), elapsedMs: 0, durationMs: null, hunterId, hp, maxHp: hp, gear,
    bag: { moonstone: 0 }, kills: 0, status: 'running', depth, careerLevel, careerXP: 0,
    scale: depthScale(depth, monthScale(state.day), calendarOf(state.day).monthIdx),
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
    cool: {},      // 무기별 다음 발사 시각
    orbitAngle: 0,
    auraAt: 0,
    spawnAcc: 0,
    uidSeq: 0,
    shakeUntil: 0,
    banner: null,  // { label, warn, until }
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
    if (wp.id === 'bolt') { s.count += 2; s.pierce += 2; }
    if (wp.id === 'orbit') { s.count = 6; s.radius *= 1.25; }
    if (wp.id === 'crescent') { s.count += 2; s.range *= 1.3; }
    if (wp.id === 'aura') s.slow = 0.4;
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
function optionsFor(hs) {
  const out = [];
  for (const wp of hs.weapons) if (wp.level < WEAPON_MAX_LV) out.push({ kind: 'weapon', id: wp.id });
  if (hs.weapons.length < MAX_WEAPONS) for (const id of Object.keys(WEAPONS)) if (!hs.weapons.some(w => w.id === id)) out.push({ kind: 'weapon', id });
  const owned = Object.keys(hs.passives);
  for (const id of owned) if (hs.passives[id] < PASSIVE_MAX_LV) out.push({ kind: 'passive', id });
  if (owned.length < MAX_PASSIVES) for (const id of Object.keys(PASSIVES)) if (!owned.includes(id)) out.push({ kind: 'passive', id });
  return out;
}

function rollOffer(state, n = 3) {
  const all = optionsFor(state.hunt);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(nextRandom(state.rng) * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const pick = all.slice(0, n);
  return pick.length ? pick : [{ kind: 'heal' }];
}

export function describeOption(hs, o) {
  if (o.kind === 'heal') return { icon: '🐟', name: '간식 시간', text: `HP ${H.HEAL_FISH} 회복`, tag: '회복' };
  if (o.kind === 'passive') {
    const d = PASSIVES[o.id], lv = hs.passives[o.id] || 0;
    return { icon: d.icon, name: d.name, text: d.desc, tag: lv ? `Lv ${lv} → ${lv + 1}` : '새 보조 능력' };
  }
  const d = WEAPONS[o.id], wp = hs.weapons.find(w => w.id === o.id);
  const tag = wp ? `Lv ${wp.level} → ${wp.level + 1}` : '새 무기';
  const evoHint = wp && wp.level + 1 === WEAPON_MAX_LV ? ` · ${PASSIVES[d.evo.pair].name}와 함께면 진화` : '';
  return { icon: d.icon, name: d.name, text: d.desc + evoHint, tag };
}

function applyOption(state, o) {
  const hs = state.hunt;
  if (o.kind === 'heal') hs.hp = Math.min(hs.maxHp, hs.hp + H.HEAL_FISH);
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
function spawnEnemy(state, w, type, x, y) {
  if (w.enemies.count >= H.MAX_ENEMIES && !ENEMIES[type].elite) return null;
  const hs = state.hunt;
  if(type==='shade_hand') { if(hs.depth>=85)type='heukwol_fragment'; else if(hs.depth>=55)type='rabbit_brute'; else if(hs.depth>=35)type='blue_rabbit'; }
  const def = ENEMIES[type];
  // 정예·보스는 시간 성장 없이 달 배율만(늦게 나와도 잡을 수 있게)
  const grow = (1 + .55 * (hs.elapsedMs / 60000) + .08 * (hs.elapsedMs / 60000) ** 2) * hs.scale.hp;
  const e = w.enemies.spawn();
  Object.assign(e, {
    uid: ++w.uidSeq, type, hp: Math.round(def.hp * grow), speed: def.speed * randRange(state.rng, 0.85, 1.15),
    kx: 0, ky: 0, hitAt: 0, orbitAt: 0, cresAt: 0, vx: 0, vy: 0, life: 0, phase: nextRandom(state.rng) * 6.28,
    x: Math.max(10, Math.min(H.FIELD_W - 10, x)), y: Math.max(10, Math.min(H.FIELD_H - 10, y)),
  });
  e.maxHp = e.hp;
  return e;
}

function aroundPlayer(state, w, type) {
  const a = nextRandom(state.rng) * Math.PI * 2;
  const r = randRange(state.rng, ...H.SPAWN_DIST);
  return spawnEnemy(state, w, type, w.player.x + Math.cos(a) * r, w.player.y + Math.sin(a) * r);
}

function pickType(state, sec) {
  const pool = SPAWN_MIX.filter(m => sec >= m.from);
  if(state.hunt.depth>=35)pool.push({id:'blue_rabbit',w:6});
  if(state.hunt.depth>=55)pool.push({id:'rabbit_brute',w:4});
  if(state.hunt.depth>=85)pool.push({id:'heukwol_fragment',w:12});
  const total = pool.reduce((a, m) => a + m.w, 0);
  let r = nextRandom(state.rng) * total;
  for (const m of pool) { r -= m.w; if (r < 0) return m.id; }
  return pool[0].id;
}

function runEvent(state, w, ev) {
  const p = w.player;
  if (ev.kind === 'horde') {
    const a = nextRandom(state.rng) * Math.PI * 2;
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
  else if (ev.kind === 'boss') { aroundPlayer(state, w, 'boss_hand'); w.shakeUntil = state.hunt.elapsedMs + 600; }
}

function events(state, w, t) {
  const hs = state.hunt;
  const cycle = Math.floor(t / 180000);
  for (const ev of HUNT_EVENTS) {
    const at = ev.at * 1000 + cycle * 180000;
    const wk = `${cycle}:${ev.at}:warn`, gk = `${cycle}:${ev.at}`;
    if (t >= at - 2000 && !hs.fired.includes(wk)) {
      hs.fired.push(wk);
      w.banner = { label: `⚠ ${ev.label}`, warn: true, until: t + 2000 };
      emit('huntEvent', { kind: ev.kind, label: ev.label, warn: true });
    }
    if (t >= at && !hs.fired.includes(gk)) {
      hs.fired.push(gk);
      w.banner = { label: ev.label, warn: false, until: t + 1600 };
      runEvent(state, w, ev);
      emit('huntEvent', { kind: ev.kind, label: ev.label, warn: false });
    }
  }
}

// ── 피해·처치·드롭
function addDrop(w, kind, id, v, x, y) {
  if (kind === 'gem' && w.drops.count >= H.GEM_CAP) {
    // 별조각이 너무 많으면 가장 가까운 기존 별조각에 값을 합친다
    for (let i = w.drops.count - 1; i >= 0; i--) { const d = w.drops.items[i]; if (d.kind === 'gem') { d.v += v; return; } }
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
  if (def.boss) { state.hunt.bossDown = true; state.hunt.bossKills += 1; w.banner = { label: '거대한 검은 손을 물리쳤다!', warn: false, until: state.hunt.elapsedMs + 2000 }; emit('huntEvent', { kind: 'bossDown', label: '거대한 검은 손을 물리쳤다!', warn: false }); }
  w.enemies.release(i);
  state.hunt.kills += 1;
  const c = TEMP.HUNT_CAREER;
  state.hunt.careerXP += Math.ceil((def.boss ? c.xpBoss : def.elite ? c.xpElite : c.xpNormal) * (state.hunt.scale.reward ?? 1));
}

// 피해를 주고 죽었으면 true. kb = 밀어낼 방향(정규화 전 벡터)
function hurt(state, w, i, base, m, kbx = 0, kby = 0) {
  const e = w.enemies.items[i];
  if(state.hunt.elapsedMs-(w.lastHitSound||-1000)>=180){emit('huntHit',{});w.lastHitSound=state.hunt.elapsedMs;}
  const crit = nextRandom(state.rng) < m.crit;
  const dmg = Math.round(base * (crit ? H.CRIT_MULT : 1));
  e.hp -= dmg;
  e.hitAt = state.hunt.elapsedMs;
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
      w.auraAt = t + s.tickMs;
      for (let i = w.enemies.count - 1; i >= 0; i--) {
        const e = w.enemies.items[i];
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (s.radius + ENEMIES[e.type].r) ** 2) hurt(state, w, i, s.damage, m);
      }
      continue;
    }
    if (t < (w.cool[wp.id] || 0)) continue;
    if (wp.id === 'bolt') {
      const target = nearest(w, p.x, p.y, 320);
      if (target < 0) continue;
      const e = w.enemies.items[target];
      const base = Math.atan2(e.y - p.y, e.x - p.x);
      for (let k = 0; k < s.count; k++) {
        const a = base + (k - (s.count - 1) / 2) * 0.2;
        const b = w.shots.spawn();
        Object.assign(b, { kind: 'bolt', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, life: 900, dmg: s.damage, pierce: s.pierce, lastHit: 0 });
      }
      p.action = 'attack'; p.actionUntil = t + 180;
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

function stepEnemies(state, w, t, dt, auraSlow) {
  const hs = state.hunt, p = w.player, sec = dt / 1000;
  const decay = Math.exp(-8 * sec);
  for (let i = w.enemies.count - 1; i >= 0; i--) {
    const e = w.enemies.items[i];
    const def = ENEMIES[e.type];
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    let sp = e.speed;
    if (auraSlow && d < auraSlow.radius + def.r) sp *= 1 - auraSlow.slow;
    if (e.life > 0) {
      // 가로지르는 박쥐 떼: 쫓지 않고 정해진 방향으로 날다가 사라진다
      e.life -= dt;
      e.x += e.vx * sec; e.y += e.vy * sec;
      if (e.life <= 0) { w.enemies.release(i); continue; }
    } else {
      let mx = dx / d, my = dy / d;
      if (def.zigzag) { const z = Math.sin(t / 260 + e.phase) * 0.9; const nx = mx - my * z, ny = my + mx * z; const nl = Math.hypot(nx, ny) || 1; mx = nx / nl; my = ny / nl; }
      e.x += mx * sp * sec; e.y += my * sp * sec;
    }
    e.x += e.kx * sec; e.y += e.ky * sec; e.kx *= decay; e.ky *= decay;
    if (d < def.r + 14 && t >= p.hurtUntil) {
      hs.hp = Math.max(0, hs.hp - (t < (hs.shieldUntil || 0) ? 0 : Math.round(def.dmg * hs.scale.dmg * (1 + .12 * hs.elapsedMs / 60000))));
      p.hurtUntil = t + H.HURT_IFRAME_MS;
      p.action = 'hurt'; p.actionUntil = t + 300;
      w.shakeUntil = t + 220;
      if (!def.boss) { e.kx -= dx / d * 220; e.ky -= dy / d * 220; }
      emit('huntHurt', { hp: hs.hp });
    }
  }
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
    if (it.kind === 'gem') gainXp(state, it.v);
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
    } else if (it.kind === 'chest') {
      const opts = optionsFor(hs);
      const o = opts.length ? opts[Math.floor(nextRandom(state.rng) * opts.length)] : { kind: 'heal' };
      const label = describeOption(hs, o).name;
      applyOption(state, o);
      emit('huntChest', { label });
    }
  }
}

function subStep(state, dt, input) {
  const hs = state.hunt;
  const w = getHuntWorld(state);
  const p = w.player;
  const sec = dt / 1000;
  hs.elapsedMs += dt;
  const t = hs.elapsedMs;
  const m = mods(hs);

  // 이동
  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.05;
  if (p.moving) {
    const k = Math.min(1, len) / len;
    p.x = Math.max(16, Math.min(H.FIELD_W - 16, p.x + input.x * k * H.PLAYER_SPEED * m.speed * sec));
    p.y = Math.max(16, Math.min(H.FIELD_H - 16, p.y + input.y * k * H.PLAYER_SPEED * m.speed * sec));
    p.dirX = input.x / len; p.dirY = input.y / len;
    p.facing = Math.abs(input.x) > Math.abs(input.y) ? (input.x > 0 ? 'right' : 'left') : (input.y > 0 ? 'down' : 'up');
  }

  // 사건·생성(밀도 목표보다 적으면 두 배로 빨리)
  events(state, w, t);
  const f = Math.min(2, t / 180000);
  const density = H.DENSITY_START + (H.DENSITY_END - H.DENSITY_START) * f;
  let rate = H.SPAWN_RATE_START + (H.SPAWN_RATE_END - H.SPAWN_RATE_START) * f;
  if (w.enemies.count < density) rate *= 2;
  w.spawnAcc += sec * rate;
  while (w.spawnAcc >= 1) { w.spawnAcc -= 1; aroundPlayer(state, w, pickType(state, t / 1000)); }

  fireWeapons(state, w, t, m, sec);
  stepShots(state, w, t, m, dt);
  const aura = hs.weapons.find(x => x.id === 'aura' && x.evo);
  stepEnemies(state, w, t, dt, aura ? weaponStats(aura, m) : null);
  collect(state, w, t, m, dt);

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
  while (left > 0 && hs.status === 'running' && !hs.picks.length) {
    const d = Math.min(H.SUB_STEP_MS, left);
    left -= d;
    subStep(state, d, input || { x: 0, y: 0 });
    if (hs.hp <= 0) { hs.status = 'down'; emit('huntEnd', { status: 'down' }); }

  }
}

export function retreat(state) {
  if (!state.hunt || state.hunt.status !== 'running') return { ok: false, reason: '진행 중인 사냥이 없습니다' };
  state.hunt.status = 'retreat';
  state.hunt.picks = [];
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
    state.stats.huntsCompleted += 1;
    state.hunter.xp += hs.careerXP || 0;
    state.hunter.kills += hs.kills;
    if(hs.elapsedMs>=180000)state.hunter.maxStage=Math.min(100,Math.max(state.hunter.maxStage||1,hs.depth+1));
    state.stats.longestHuntMs = Math.max(state.stats.longestHuntMs || 0, hs.elapsedMs);
    state.stats.huntBosses = (state.stats.huntBosses || 0) + (hs.bossKills || 0);
    workHunt(state, hs.elapsedMs >= 180000, hs.hunterId);
  }
  state.lastHunt = { id: hs.id, status: hs.status, hunterId:hs.hunterId, bonus, fieldBag:{...hs.bag}, bag: totalBag, kills: hs.kills, elapsedMs: hs.elapsedMs, level: hs.level ?? 1, bossDown: !!hs.bossDown, depth: hs.depth, careerXP: hs.careerXP || 0, careerLevel: hunterProgress(state.hunter.xp).level };
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
 if(state.mode!=='hunt'||!hs||hs.status!=='running'||hs.picks.length)return {ok:false,reason:'사냥 중에 사용할 수 있어요'};
 if(!d || !(state.armory?.supplies?.[id]>0))return {ok:false,reason:'먼저 모카 상점에서 준비해 주세요'};
 if(id==='tonic' && hs.hp>=hs.maxHp)return {ok:false,reason:'이미 체력이 가득해요'};
 const w=getHuntWorld(state);state.armory.supplies[id]-=1;
 if(id==='tonic')hs.hp=Math.min(hs.maxHp,hs.hp+Math.ceil(hs.maxHp*.35));
 if(id==='shield')hs.shieldUntil=hs.elapsedMs+8000;
 if(id==='magnet')for(let i=0;i<w.drops.count;i++)w.drops.items[i].magnet=true;
 if(id==='nova')for(let i=w.enemies.count-1;i>=0;i--){const e=w.enemies.items[i];if(Math.hypot(e.x-w.player.x,e.y-w.player.y)<300)hurt(state,w,i,240*mods(hs).dmg,mods(hs),0,0);}
 emit('huntPower',{kind:id,label:d.name});return {ok:true};
}
