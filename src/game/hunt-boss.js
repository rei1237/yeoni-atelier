// 보스 공격 순서: 등장 3초 → (예고 ≥1.2초 → 행동 → 회복 ≥2초) 반복. 수치는 모두 임시(TEMP)다.
// 예고는 w.zones 에 남는다: at 전에는 그림만(피해 없음), at~until 동안 피해. dmg 0 은 예고 전용 선이다.
// 안전지대: 강타 고리 밖, 균열선 사이, 교차선 사이 사분면, 탄막 빈틈. 페이즈가 바뀌면 남은 공격을 지운다.
// 전장 상태(w)는 저장하지 않는다. 보스 HP 와 페이즈만 state.hunt.boss 에 저장한다.
import { ENEMIES } from '../data/hunt-kit.js';
import { damageHunter, addBattleFx } from './enemy-behaviors.js';
import { nextRandom, randRange } from '../core/rng.js';
import { emit } from './state.js';

export const BOSS_TIMING = Object.freeze({ openingMs: 3000, warnMinMs: 1200, recoverMinMs: 2000, phaseRecoverMs: 2200 });
const LINE_LEN = 900;
// warn = 예고, act = 행동, recover = 회복(ms), mult = 기본 피해 배율
export const BOSS_TASKS = Object.freeze({
  charge: { warn: 1300, act: 950, recover: 2200, mult: 1.3, speed: 300, dist: 280 },
  slam: { warn: 1400, act: 300, recover: 2200, mult: 1.6, r: 150 },
  fault: { warn: 1500, act: 400, recover: 2400, mult: 1.2, gap: 110, w: 36 },
  puddle: { warn: 1400, act: 300, recover: 2400, mult: .5, r: 70, linger: 3200, n: 4 },
  summon: { warn: 1200, act: 200, recover: 2600, n: 6 },
  stalk: { warn: 1200, act: 2400, recover: 2000, mult: 1, speedMul: 2.1 },
  cross: { warn: 1400, act: 350, recover: 2200, mult: 1.3, w: 44 },
  crossx: { warn: 1400, act: 350, recover: 2200, mult: 1.3, w: 44 },
  barrage: { warn: 1500, act: 200, recover: 2600, mult: .6, slots: 24, gaps: 3, speed: 120 },
});

export const bossPhaseOf = (def, ratio) => {
  if (!def.phases) return 0;
  let n = 0;
  def.phases.forEach((p, i) => { if (ratio < p.below) n = i; });
  return n;
};
const tasksOf = (def, phase) => def.phases ? def.phases[phase].tasks : def.tasks;

export function initBoss(e, t, phase = 0) {
  Object.assign(e, { task: null, taskPhase: 'open', taskUntil: t + BOSS_TIMING.openingMs, taskIdx: 0, phaseNo: phase, aimX: 0, aimY: 1, stalkUntil: 0 });
}

export function addZone(w, z) { (w.zones ??= []).push(z); }
export function clearBossAttacks(w) { w.hostile.length = 0; if (w.zones) w.zones.length = 0; }

function segDist(px, py, z) {
  const dx = z.x2 - z.x, dy = z.y2 - z.y, l2 = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((px - z.x) * dx + (py - z.y) * dy) / l2));
  return Math.hypot(px - (z.x + dx * k), py - (z.y + dy * k));
}
export const zoneHits = (z, x, y, pad = 12) => z.kind === 'circle' ? Math.hypot(x - z.x, y - z.y) < z.r + pad : segDist(x, y, z) < z.w / 2 + pad;

const line = (x, y, ax, ay, off, width, at, until, dmg) => {
  const nx = -ay, ny = ax, cx = x + nx * off, cy = y + ny * off;
  return { kind: 'line', x: cx - ax * LINE_LEN / 2, y: cy - ay * LINE_LEN / 2, x2: cx + ax * LINE_LEN / 2, y2: cy + ay * LINE_LEN / 2, w: width, at, until, dmg };
};

// 예고 시작: 조준을 고정하고 피해 구역을 미리 깐다
function beginWarn(state, w, e, def, t) {
  const p = w.player, T = BOSS_TASKS[e.task], warn = Math.max(BOSS_TIMING.warnMinMs, T.warn), at = t + warn;
  const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
  e.aimX = (p.x - e.x) / d; e.aimY = (p.y - e.y) / d;
  e.taskPhase = 'warn'; e.taskUntil = at;
  const dmg = def.dmg * (T.mult || 1);
  if (e.task === 'charge') addZone(w, { kind: 'line', x: e.x, y: e.y, x2: e.x + e.aimX * (T.dist + def.r), y2: e.y + e.aimY * (T.dist + def.r), w: def.r * 2, at, until: at, dmg: 0 });
  else if (e.task === 'slam') addZone(w, { kind: 'circle', x: e.x, y: e.y, r: T.r, at, until: at + 250, dmg });
  else if (e.task === 'fault') for (const off of [-T.gap, 0, T.gap]) addZone(w, line(p.x, p.y, e.aimX, e.aimY, off, T.w, at, at + 300, dmg));
  else if (e.task === 'puddle') for (let k = 0; k < T.n; k++) {
    const x = k ? p.x + randRange(state.rng, -160, 160) : p.x, y = k ? p.y + randRange(state.rng, -160, 160) : p.y;
    addZone(w, { kind: 'circle', x, y, r: T.r, at, until: at + T.linger, dmg, puddle: true });
  }
  else if (e.task === 'cross') for (const [ax, ay] of [[1, 0], [0, 1]]) addZone(w, line(e.x, e.y, ax, ay, 0, T.w, at, at + 300, dmg));
  else if (e.task === 'crossx') for (const [ax, ay] of [[Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]]) addZone(w, line(e.x, e.y, ax, ay, 0, T.w, at, at + 300, dmg));
  else addZone(w, { kind: 'circle', x: e.x, y: e.y, r: def.r + 36, at, until: at, dmg: 0, follow: e.uid }); // 소환·추격·탄막: 몸 주위 예고 고리
  emit('huntEnemyAttack', { kind: 'bossWarn', task: e.task });
}

function act(state, w, e, def, t, spawnMinion) {
  const T = BOSS_TASKS[e.task];
  e.taskPhase = 'act'; e.taskUntil = t + T.act;
  if (e.task === 'summon') {
    for (let k = 0; k < T.n; k++) { const a = k / T.n * Math.PI * 2; spawnMinion(state, w, e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); }
  } else if (e.task === 'barrage') {
    const start = Math.floor(nextRandom(state.rng) * T.slots), gapEvery = T.slots / T.gaps;
    for (let k = 0; k < T.slots && w.hostile.length < 64; k++) {
      const rel = (k - start + T.slots) % T.slots;
      if (rel % gapEvery < 2) continue; // 빈틈 두 칸씩
      const a = k / T.slots * Math.PI * 2;
      w.hostile.push({ x: e.x, y: e.y, vx: Math.cos(a) * T.speed, vy: Math.sin(a) * T.speed, r: 7, dmg: def.dmg * T.mult, until: t + 5000 });
    }
  } else if (e.task === 'stalk') e.stalkUntil = t + T.act;
  if (['slam', 'cross', 'crossx', 'fault'].includes(e.task)) addBattleFx(w, { kind: 'burst', x: e.x, y: e.y, r: e.task === 'slam' ? T.r : 60, at: t, until: t + 320 });
  emit('huntEnemyAttack', { kind: 'boss', task: e.task });
}

// 보스 한 마리 진행. 반환: 페이즈가 바뀌었으면 새 페이즈 번호
export function stepBoss(state, w, e, t, dt, spawnMinion) {
  const def = ENEMIES[e.type], p = w.player, sec = dt / 1000;
  const phase = bossPhaseOf(def, e.hp / e.maxHp);
  let changed = null;
  if (phase > (e.phaseNo || 0)) {
    e.phaseNo = phase; changed = phase; clearBossAttacks(w);
    e.task = null; e.taskPhase = 'recover'; e.taskUntil = t + BOSS_TIMING.phaseRecoverMs; e.stalkUntil = 0;
  }
  if (t >= e.taskUntil) {
    if (e.taskPhase === 'open' || e.taskPhase === 'recover') {
      const list = tasksOf(def, e.phaseNo || 0);
      e.task = list[e.taskIdx % list.length]; e.taskIdx += 1;
      beginWarn(state, w, e, def, t);
    } else if (e.taskPhase === 'warn') act(state, w, e, def, t, spawnMinion);
    else if (e.taskPhase === 'act') { e.taskPhase = 'recover'; e.taskUntil = t + Math.max(BOSS_TIMING.recoverMinMs, BOSS_TASKS[e.task].recover); }
  }
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  let vx = 0, vy = 0;
  if (e.taskPhase === 'act' && e.task === 'charge') { const T = BOSS_TASKS.charge; vx = e.aimX * T.speed; vy = e.aimY * T.speed; }
  else if (e.taskPhase === 'act' && e.task === 'stalk') { vx = dx / d * def.speed * BOSS_TASKS.stalk.speedMul; vy = dy / d * def.speed * BOSS_TASKS.stalk.speedMul; }
  else if (e.taskPhase !== 'warn' && e.taskPhase !== 'act' && d > def.r + 40) { vx = dx / d * def.speed; vy = dy / d * def.speed; }
  e.x += vx * sec; e.y += vy * sec;
  const fx = vx || dx, fy = vy || dy;
  e.facing = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? 'right' : 'left') : (fy > 0 ? 'down' : 'up');
  e.rolePhase = e.taskPhase === 'warn' ? 'warning' : 'approach'; // 그리기용
  if (d < def.r + 14) damageHunter(state, w, def.dmg * (e.taskPhase === 'act' && e.task === 'charge' ? BOSS_TASKS.charge.mult : 1), t);
  return changed;
}

// 예고·피해 구역 진행: 끝난 구역은 지운다. 따라다니는 예고 고리는 보스 위치를 따른다
export function stepZones(state, w, t) {
  const zones = w.zones || [], p = w.player;
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (z.follow) for (let j = 0; j < w.enemies.count; j++) { const e = w.enemies.items[j]; if (e.uid === z.follow) { z.x = e.x; z.y = e.y; break; } }
    if (z.dmg > 0 && t >= z.at && t < z.until && zoneHits(z, p.x, p.y)) damageHunter(state, w, z.dmg, t);
    if (t >= Math.max(z.at, z.until)) zones.splice(i, 1);
  }
}
