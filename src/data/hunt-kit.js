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
    name: '사주 성광', icon: '✦', desc: '주력 근접 참격 · 치명타 확률 +15%p · 치명타 피해 2.3배',
    base: { cooldown: 850, damage: 36, radius: 96, halfArc: Math.PI*.44 }, per: { damage: 7, radius: 5 }, counts: [1,1,1,1,1],
    evo: {pair:'bell',name:'사주 월광참',desc:'반경 +30% · 넓은 216도 참격'},
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
    name: '달빛 수호부', icon: '◎', desc: '들고 있는 동안 받는 피해 감소 · 3초마다 체력을 조금 회복한다',
    base: { radius: 105, damage: 0, tickMs: 3000, heal: 1, guard: .12 }, per: { radius: 6, heal: 1, guard: .03 }, counts: [1, 1, 1, 1, 1],
    evo: { pair: 'fish_stock', name: '월광 결계', desc: '회복량 2배 · 피해 감소 +10%p' },
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
  rabbit_scout:{name:'청토끼 정찰병',hp:20,speed:66,dmg:7,xp:1,r:14,size:44},
  moon_bomber:{name:'불안정한 월광',hp:38,speed:70,dmg:24,xp:2,r:15,size:44,role:'bomber'},
  shade_thorn: {role:'ranged',name:'가시 그림자',hp:65,speed:46,dmg:12,xp:3,r:18,size:46,zigzag:true},
  shade_clock: {role:'dash',name:'멈춘 시계',hp:40,speed:100,dmg:9,xp:3,r:14,size:42},
  blue_rabbit: {name:'청토끼',hp:80,speed:86,dmg:14,xp:3,r:16,size:48,behavior:'chase'},
  rabbit_brute: {role:'slam',name:'변이 청토끼',hp:160,speed:54,dmg:22,xp:4,r:21,size:60,behavior:'chase'},
  heukwol_fragment: {role:'fan',name:'흑월의 파편',hp:460,speed:80,dmg:34,xp:6,r:22,size:64,behavior:'zigzag'},
  shade_hand: { name: '검은 손', hp: 24, speed: 60, dmg: 8, xp: 1, r: 14, size: 40 },
  shade_bat: { name: '그림자 박쥐', hp: 16, speed: 100, dmg: 6, xp: 1, r: 11, size: 34 },
  shade_blob: { name: '검은 덩어리', hp: 75, speed: 38, dmg: 12, xp: 4, r: 18, size: 46 },
  shade_wisp: { name: '도깨비불', hp: 26, speed: 76, dmg: 7, xp: 2, r: 12, size: 36, zigzag: true },
  elite_hand: { name: '큰 검은 손', hp: 520, speed: 60, dmg: 15, xp: 20, r: 26, size: 72, chest: true, elite: true },
  // 보스: art = 그릴 그림 키, tasks = 예고→행동→회복을 도는 공격 순서(src/game/hunt-boss.js), phases = 체력 비율별 공격 순서
  boss_hand: { name: '거대한 검은 손', art: 'boss_hand', hp: 700, speed: 52, dmg: 18, xp: 40, r: 40, size: 108, chest: true, elite: true, boss: true, tasks: ['charge'] },
  boss_brute: { name: '변이 청토끼 대장', art: 'rabbit_brute', hp: 900, speed: 56, dmg: 20, xp: 45, r: 34, size: 100, chest: true, elite: true, boss: true, tasks: ['slam', 'charge'] },
  boss_stalker: { name: '달그늘 추적자', art: 'shade_wisp', hp: 820, speed: 70, dmg: 16, xp: 45, r: 30, size: 92, chest: true, elite: true, boss: true, tasks: ['stalk', 'slam'] },
  boss_blob: { name: '늪의 검은 덩어리', art: 'shade_blob', hp: 1100, speed: 40, dmg: 18, xp: 50, r: 38, size: 108, chest: true, elite: true, boss: true, tasks: ['puddle', 'summon'] },
  boss_lord: { name: '검은 손 군주', art: 'elite_hand', hp: 1300, speed: 54, dmg: 20, xp: 55, r: 40, size: 116, chest: true, elite: true, boss: true, tasks: ['summon', 'charge', 'slam'] },
  boss_clock: { name: '멈춘 시계의 그림자', art: 'shade_clock', hp: 1200, speed: 64, dmg: 18, xp: 55, r: 34, size: 100, chest: true, elite: true, boss: true, tasks: ['fault', 'stalk'] },
  boss_thorn: { name: '가시 십자', art: 'shade_thorn', hp: 1400, speed: 46, dmg: 20, xp: 60, r: 36, size: 104, chest: true, elite: true, boss: true, tasks: ['cross', 'crossx', 'fault'] },
  boss_core: { name: '흑월의 핵', art: 'heukwol_fragment', hp: 1800, speed: 50, dmg: 24, xp: 70, r: 40, size: 116, chest: true, elite: true, boss: true, tasks: ['barrage', 'cross', 'summon'] },
  // 100단계: 네오와 서한비(정체는 영입 전까지 숨김)의 결투. 이름은 "검은 호랑이"로만 보인다
  boss_hanbi: { name: '검은 호랑이', art: 'seohanbi_tiger', hp: 2600, speed: 62, dmg: 26, xp: 90, r: 40, size: 124, chest: true, elite: true, boss: true,
    phases: [{ below: 1.01, tasks: ['charge', 'cross', 'stalk'] }, { below: .66, tasks: ['fault', 'barrage', 'charge'] }, { below: .33, tasks: ['slam', 'barrage', 'crossx', 'stalk'] }] },
});

// 단계별 등장 적·사건·보스는 src/data/hunt-stages.js
