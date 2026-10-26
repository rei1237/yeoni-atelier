// 사냥터 수집 도감·업적. 도감은 사냥 귀환 정산 때만 쌓이고, 업적은 ledger.achievements로 1회만 지급한다
import { HUNT_ACHIEVEMENTS, achievementMoon } from '../data/hunt-achievements.js';
import { stagePool, bossFor } from '../data/hunt-stages.js';
import { INGREDIENTS } from '../data/menus.js';
import { emit } from './state.js';

export const CODEX_MATERIALS = Object.freeze(['night_dew', ...Object.keys(INGREDIENTS).filter(id => INGREDIENTS[id].huntOnly)]);
export const newCodex = () => ({ enemies: {}, evolved: {}, materials: {}, chests: 0, feats: {} });

// 사냥 1회 결과를 도감에 더한다(finishHunt의 원장 블록 안에서만 부른다)
export function recordHunt(state, hs, bag) {
  const c = state.huntCodex ??= newCodex();
  for (const [type, n] of Object.entries(hs.seen || {})) c.enemies[type] = (c.enemies[type] || 0) + n;
  for (const wp of hs.weapons || []) if (wp.evo) c.evolved[wp.id] = true;
  for (const [id, n] of Object.entries(bag)) if (CODEX_MATERIALS.includes(id) && n > 0) c.materials[id] = (c.materials[id] || 0) + n;
  c.chests += hs.chestsOpened || 0;
  if ((hs.cleared || 0) > 0 && !hs.tonicsUsed) c.feats.no_tonic = true;
  if ((hs.cleared || 0) >= 3) c.feats.triple = true;
}

// 도감 이전 저장: 깬 단계의 적·보스는 만남(처치 수 0), 저장 빌드의 진화, 밤이슬 누적으로 채운다
export function legacyCodex(data) {
  const c = newCodex(), max = data.hunter?.maxStage || 1;
  for (let n = 1; n < max; n++) {
    for (const [id] of stagePool(n)) c.enemies[id] ??= 0;
    c.enemies[bossFor(n)] ??= 0;
  }
  for (const b of Object.values(data.hunter?.builds || {})) for (const wp of b.weapons || []) if (wp.evo) c.evolved[wp.id] = true;
  if (data.stats?.nightDewObtained > 0) c.materials.night_dew = data.stats.nightDewObtained;
  return c;
}

// 이룬 업적을 원장에 한 번만 적고 월정석을 준다. quiet면 알림 없이(저장 불러오기 소급)
export function checkAchievements(state, { quiet = false } = {}) {
  const led = state.ledger.achievements ??= {}, got = [];
  for (const a of HUNT_ACHIEVEMENTS) {
    if (led[a.id] || !a.test(state)) continue;
    led[a.id] = true;
    const moon = achievementMoon(a.id);
    state.moonstone = (state.moonstone || 0) + moon;
    state.stats.moonstonesObtained = (state.stats.moonstonesObtained || 0) + moon;
    if (!quiet) emit('achievement', { id: a.id, name: a.name, moon });
    got.push(a.id);
  }
  return got;
}
