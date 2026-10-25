// 영냥이 사냥(뱀서식)의 무기·보조 능력·적 정의. 이름과 수치는 모두 이 게임의 임시(TEMP) 설정이다.
// 원작(code-destiny)의 공식 능력이 아니며, 적의 "검은 손" 외 이름은 임시 이름이다.
// 레벨당 누적·진화 배율(×1.35)은 killerflowerpig 의 무기 성장 방식을 개념만 참고했다(코드 이식 아님).

export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;
export const WEAPON_MAX_LV = 5;
export const PASSIVE_MAX_LV = 3;
export const EVO_MULT = 1.35;

// 무기: base = 1레벨 값, per = 레벨마다 더하는 값, counts = 레벨별 개수(1~5)
export const WEAPONS = Object.freeze({
  bolt: {
    name: '사주성광', icon: '✦', desc: '가장 가까운 적에게 별빛 탄을 쏜다',
    base: { cooldown: 720, damage: 16, speed: 440, pierce: 0 }, per: { damage: 3 }, counts: [1, 1, 2, 2, 3],
    pierceAt: { 4: 1 }, evo: { pair: 'bell', name: '사주 유성우', desc: '탄 +2 · 관통 +2' },
  },
  orbit: {
    name: '별자리 궤도', icon: '✧', desc: '별이 영냥이 주위를 돈다',
    base: { radius: 76, damage: 7, spin: 3.2, hitGap: 600 }, per: { damage: 3 }, counts: [2, 3, 3, 4, 5],
    evo: { pair: 'hat', name: '황도 십이궁', desc: '별 6개 · 반경 증가' },
  },
  crescent: {
    name: '초승달 부메랑', icon: '☾', desc: '바라보는 쪽으로 날아갔다 돌아온다',
    base: { cooldown: 1300, damage: 22, range: 230, speed: 360, hitGap: 350 }, per: { damage: 4 }, counts: [1, 1, 2, 2, 2],
    evo: { pair: 'paw', name: '보름달 회전', desc: '부메랑 +2 · 사거리 증가' },
  },
  aura: {
    name: '달빛 장막', icon: '◎', desc: '주위의 적에게 계속 피해를 준다',
    base: { radius: 68, damage: 5, tickMs: 700 }, per: { damage: 2, radius: 10 }, counts: [1, 1, 1, 1, 1],
    evo: { pair: 'fish_stock', name: '월광 결계', desc: '범위 안 적 40% 느려짐' },
  },
  tarot: {
    name: '타로 낙하', icon: '🂠', desc: '무작위 적 위로 카드가 떨어진다',
    base: { cooldown: 2100, damage: 38, radius: 52, warnMs: 450 }, per: { damage: 6 }, counts: [2, 2, 3, 3, 4],
    evo: { pair: 'luck', name: '운명의 수레바퀴', desc: '카드 +3 · 범위 증가' },
  },
});

export const PASSIVES = Object.freeze({
  paw: { name: '고양이 발걸음', icon: '🐾', desc: '이동 속도 +10%' },
  hat: { name: '마법모자', icon: '🎩', desc: '공격 범위 +15%' },
  bell: { name: '별 방울', icon: '🔔', desc: '재사용 대기 −8%' },
  fish_stock: { name: '생선 비축', icon: '🐟', desc: '최대 HP +20' },
  whisker: { name: '자석 수염', icon: '🧲', desc: '흡수 반경 +30%' },
  luck: { name: '행운', icon: '🍀', desc: '치명타 확률 +5%' },
});

// 적: r = 충돌 반지름, size = 그릴 크기, xp = 떨어뜨리는 별조각 값
export const ENEMIES = Object.freeze({
  shade_thorn: {hp:65,speed:46,dmg:12,xp:3,r:18,size:46,zigzag:true},
  shade_clock: {hp:40,speed:100,dmg:9,xp:3,r:14,size:42},
  blue_rabbit: {name:'청토끼',hp:80,speed:86,dmg:14,xp:3,r:16,size:48,behavior:'chase'},
  rabbit_brute: {name:'변이 청토끼',hp:160,speed:54,dmg:22,xp:4,r:21,size:60,behavior:'chase'},
  heukwol_fragment: {name:'흑월의 파편',hp:460,speed:80,dmg:34,xp:6,r:22,size:64,behavior:'zigzag'},
  shade_hand: { hp: 24, speed: 60, dmg: 8, xp: 1, r: 14, size: 40 },
  shade_bat: { hp: 16, speed: 100, dmg: 6, xp: 1, r: 11, size: 34 },
  shade_blob: { hp: 75, speed: 38, dmg: 12, xp: 4, r: 18, size: 46 },
  shade_wisp: { hp: 26, speed: 76, dmg: 7, xp: 2, r: 12, size: 36, zigzag: true },
  elite_hand: { hp: 520, speed: 60, dmg: 15, xp: 20, r: 26, size: 72, chest: true, elite: true },
  boss_hand: { hp: 1650, speed: 48, dmg: 22, xp: 60, r: 40, size: 108, chest: true, elite: true, boss: true },
});

// 시간대별 등장 적(초 이상이면 섞인다)
export const SPAWN_MIX = Object.freeze([
  { from: 0, id: 'shade_hand', w: 6 },
  { from: 25, id: 'shade_bat', w: 3 },
  { from: 55, id: 'shade_blob', w: 2 },
  { from: 85, id: 'shade_wisp', w: 3 },
  { from: 110, id: 'shade_thorn', w: 2 },
  { from: 160, id: 'shade_clock', w: 2 },
]);

// 사건(2초 전 경고). kind: horde = 한쪽에서 몰려옴, ring = 원으로 포위, swarm = 박쥐가 가로지름, elite, boss
export const HUNT_EVENTS = Object.freeze([
  { at: 45, kind: 'horde', label: '검은 손 무리가 몰려온다!' },
  { at: 70, kind: 'elite', label: '큰 검은 손 등장!' },
  { at: 90, kind: 'ring', label: '사방에서 포위당했다!' },
  { at: 120, kind: 'swarm', label: '박쥐 떼가 지나간다!' },
  { at: 135, kind: 'elite', label: '큰 검은 손 등장!' },
  { at: 150, kind: 'boss', label: '거대한 검은 손이 나타났다!' },
]);
