// 사냥 단계(1~100) 정의. 수치는 모두 임시(TEMP)다.
// 준비 시간 동안 잡몹을 상대하고, 준비 시간이 끝나면 그 단계 보스가 반드시 나온다. 보스를 쓰러뜨려야 클리어다.
// 적 종류는 경과 시간이 아니라 단계로만 열린다(모든 생성 경로가 stageAllows 를 거친다).

// 구간: to = 구간 마지막 단계, prep = 구간 첫·끝 준비 시간(초), den = 단계 안 밀도 시작→끝, cap = 잡몹 동시 상한
const BANDS = Object.freeze([
  { to: 1, prep: [60, 60], den: [2, 7], cap: 10 },
  { to: 5, prep: [75, 105], den: [3, 12], cap: 18 },
  { to: 20, prep: [110, 140], den: [5, 20], cap: 28 },
  { to: 39, prep: [145, 170], den: [8, 28], cap: 40 },
  { to: 69, prep: [175, 205], den: [10, 38], cap: 56 },
  { to: 84, prep: [210, 225], den: [12, 44], cap: 64 },
  { to: 99, prep: [230, 240], den: [14, 50], cap: 72 },
  { to: 100, prep: [240, 240], den: [6, 18], cap: 24 }, // 마지막 결투: 잡몹을 줄여 보스에 집중
]);

// [적, 등장 단계, 가중치]. 가중치 0 = 사건으로만 나온다
export const STAGE_UNLOCKS = Object.freeze([
  ['shade_hand', 1, 5], ['rabbit_scout', 1, 4], ['shade_bat', 2, 3], ['shade_blob', 6, 2], ['shade_wisp', 10, 3],
  ['blue_rabbit', 21, 3], ['elite_hand', 21, 0], ['shade_clock', 25, 2], ['moon_bomber', 40, 2],
  ['rabbit_brute', 55, 2], ['shade_thorn', 80, 2], ['heukwol_fragment', 85, 2],
]);

// [구간 마지막 단계, 보스 후보]. 같은 단계는 늘 같은 보스(단계 번호로 돌려 고른다)
const BOSS_POOLS = Object.freeze([
  [1, ['boss_hand']],
  [5, ['boss_brute', 'boss_stalker']],
  [20, ['boss_blob', 'boss_lord', 'boss_brute', 'boss_clock']],
  [39, ['boss_clock', 'boss_lord', 'boss_stalker', 'boss_blob', 'boss_thorn']],
  [69, ['boss_thorn', 'boss_clock', 'boss_lord', 'boss_blob', 'boss_stalker']],
  [84, ['boss_thorn', 'boss_stalker', 'boss_clock', 'boss_lord']],
  [99, ['boss_core', 'boss_thorn', 'boss_clock']],
]);

// 네오로 처음 클리어하면 귀환 뒤 검은 호랑이 사건이 열리는 단계(게임 오리지널)
export const HANBI_STAGES = Object.freeze([30, 40, 50, 70, 100]);

const clampStage = n => Math.min(100, Math.max(1, Math.floor(n) || 1));
const lerp = (a, b, k) => a + (b - a) * k;

export function stageDef(n) {
  n = clampStage(n);
  let from = 1;
  for (const b of BANDS) {
    if (n <= b.to) {
      const k = b.to > from ? (n - from) / (b.to - from) : 0;
      return { n, prepMs: Math.round(lerp(b.prep[0], b.prep[1], k)) * 1000, density: b.den, cap: b.cap };
    }
    from = b.to + 1;
  }
}

export const stageAllows = (n, type) => STAGE_UNLOCKS.some(([id, at]) => id === type && clampStage(n) >= at);
export const stagePool = n => STAGE_UNLOCKS.filter(([, at, w]) => w > 0 && clampStage(n) >= at);

// 100단계: 네오가 아직 서한비를 만나지 못했으면 검은 호랑이, 아니면 흑월의 핵
export function bossFor(n, hunterId = 'neo', recruited = false) {
  n = clampStage(n);
  if (n >= 100) return hunterId === 'neo' && !recruited ? 'boss_hanbi' : 'boss_core';
  let from = 1;
  for (const [to, pool] of BOSS_POOLS) { if (n <= to) return pool[(n - from) % pool.length]; from = to + 1; }
  return 'boss_core';
}

// 단계 안 사건(준비 시간 비율로). 크기는 생성기 상한(cap)을 넘지 않는다
export function stageEvents(n) {
  n = clampStage(n);
  const p = stageDef(n).prepMs, out = [];
  if (n >= 2) out.push({ kind: 'horde', at: p * .4, label: '검은 손 무리가 몰려온다!' }, { kind: 'swarm', at: p * .6, label: '박쥐 떼가 지나간다!' });
  if (n >= 6) { const at = Math.max(70000, p * .75); if (at < p) out.push({ kind: 'ring', at, label: '사방에서 포위당했다!' }); }
  if (n >= 21) out.push({ kind: 'elite', at: p * .85, label: '큰 검은 손 등장!' });
  return out.sort((a, b) => a.at - b.at);
}

// 첫 클리어 월정석(가방에 담겨 정산 때 한 번 지급)
export const firstClearMoon = n => 10 + 2 * clampStage(n);
