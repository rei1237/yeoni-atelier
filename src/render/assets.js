// 에셋 정의 레지스트리. 지금은 이미지 파일이 없다 → 모든 항목은 도형 대체 렌더링으로 그린다.
// 도트 그림 규격: 캐릭터 프레임 32×32, 기준점 (16, 30) = 발밑 중앙. 화면에는 정수 배율로만 키운다(번짐 없음).
// 이미지를 넣는 방법: 각 항목의 path 에 PNG 를 두고 assets/manifest.json 의 ready 배열에 "묶음/키"(예: actors/yeoni)를 적는다.
//   매니페스트에 적힌 키만 불러오므로, 아직 없는 파일 때문에 404 가 쌓이지 않는다. 실패하면 도형으로 남는다.
// 시트 규격: 한 방향 블록 안에서 행 = 상태(SPRITE_STATES 순서), 열 = 프레임. 방향 블록은 DIRECTIONS 순서로 세로로 잇는다.
// 자세한 규격과 생성 프롬프트는 docs/ASSETS.md, AGENTS.md.

export const SPRITE_STATES = Object.freeze(['idle', 'walk', 'cook', 'serve', 'host', 'react', 'attack', 'hurt']);
export const DIRECTIONS = Object.freeze(['down', 'left', 'right', 'up']);
export const PIXEL = Object.freeze({ FRAME: 32, ANCHOR_X: 16, ANCHOR_Y: 30, ICON: 16, TILE: 32, PORTRAIT: 96 });

const actorStates = (over = {}) => ({
  idle: { frames: 4, fps: 4, loop: true },
  walk: { frames: 6, fps: 10, loop: true },
  cook: { frames: 4, fps: 6, loop: true },
  serve: { frames: 4, fps: 8, loop: false },
  host: { frames: 4, fps: 4, loop: true },
  react: { frames: 4, fps: 8, loop: false },
  attack: { frames: 4, fps: 12, loop: false },
  hurt: { frames: 2, fps: 8, loop: false },
  ...over,
});

const actor = (key, label, fallback, over) => ({
  kind: 'actor', label, path: `assets/sprites/actors/${key}.png`, image: null,
  frame: { w: PIXEL.FRAME, h: PIXEL.FRAME }, anchor: { x: PIXEL.ANCHOR_X, y: PIXEL.ANCHOR_Y }, directions: DIRECTIONS,
  states: actorStates(over), fallback,
});
// 적·보스: 방향 없이(down 블록 하나) idle·walk·hurt 만 쓴다
const enemy = (key, label, fallback, size = 1) => ({
  kind: 'actor', label, path: `assets/sprites/enemies/${key}.png`, image: null,
  frame: { w: PIXEL.FRAME * size, h: PIXEL.FRAME * size }, anchor: { x: PIXEL.ANCHOR_X * size, y: PIXEL.ANCHOR_Y * size }, directions: ['down'],
  states: { idle: { frames: 4, fps: 6, loop: true }, walk: { frames: 4, fps: 8, loop: true }, hurt: { frames: 2, fps: 10, loop: false } }, fallback,
});
const object = (key, label, size, color) => ({ kind: 'object', label, path: `assets/sprites/objects/${key}.png`, image: null, size, fallback: { color } });
const icon = (key, label, color) => ({ kind: 'icon', label, path: `assets/sprites/icons/${key}.png`, image: null, px: PIXEL.ICON, fallback: { color } });
// 대화 초상화: 96×96 한 장에 표정을 가로로 이어 붙인다(expressions 순서)
const portrait = (key, label, expressions) => ({ kind: 'portrait', label, path: `assets/portraits/${key}.png`, image: null, px: PIXEL.PORTRAIT, expressions });

export const ASSETS = Object.freeze({
  actors: {
    // 색은 code-destiny 원작 디자인 문서의 외형 기준(분홍 머리·연꽃·라벤더 리본 / 은발·남색 옷 / 흰 고양이·남색 마법모자)
    yeoni: actor('yeoni', '연이', { shape: 'person', body: '#e3b3bd', hair: '#d98ea6', skin: '#ffe6da', accent: '#b9a3e3' }),
    yeoni_pig: actor('yeoni_pig', '연이(꽃돼지)', { shape: 'pig', body: '#f6bccb', accent: '#f08fb0' }, { cook: null, serve: null, host: null, attack: null }),
    neo: actor('neo', '네오', { shape: 'person', body: '#25305a', hair: '#e8ebf5', skin: '#ffe9dc', accent: '#e8d5a3' }),
    // 영냥이 = 네오의 고양이 모습. 같은 인물 id(neo)를 쓰고 렌더링 키만 바꾼다.
    neo_cat: actor('neo_cat', '영냥이', { shape: 'cat', body: '#f7f5f0', hat: '#1d2850', accent: '#e5c58e', eye: '#7d6bd6' }),
    customer: actor('customer', '손님', { shape: 'person', body: null, hair: '#4a3a33', skin: '#ffe2cf' }, { cook: null, attack: null }),
    dev_temp_01: actor('dev_temp_01', 'DEV 임시 동료 01', { shape: 'person', body: '#9a9a9a', hair: '#666', skin: '#eee' }),
  },
  // 사냥 적. "검은 손"만 원작 EP.01 에 나오는 존재이고, 나머지는 게임 임시 적이다(정식 설정 아님).
  enemies: {
    shade_hand: enemy('shade_hand', '검은 손', { shape: 'hand', body: '#2a1f3d', eye: '#e7d8ff' }),
    shade_bat: enemy('shade_bat', '그림자 박쥐(임시)', { shape: 'bat', body: '#3b2a55', eye: '#ffd8f0' }),
    shade_blob: enemy('shade_blob', '그림자 덩어리(임시)', { shape: 'blob', body: '#4a2f6a', eye: '#f3e9ff' }),
    shade_wisp: enemy('shade_wisp', '도깨비불(임시)', { shape: 'wisp', body: '#5d4bd1', eye: '#fff' }),
    elite_hand: enemy('elite_hand', '큰 검은 손(임시 정예)', { shape: 'hand', body: '#5a1830', eye: '#ffd38a' }, 2),
    boss_hand: enemy('boss_hand', '거대한 검은 손(임시 보스)', { shape: 'hand', body: '#1a0f26', eye: '#ff7a8a' }, 3),
  },
  objects: {
    table: object('table', '테이블', { w: 1, h: 1 }, '#c79a6b'),
    chair: object('chair', '의자', { w: 1, h: 1 }, '#a8774c'),
    drink: object('drink', '음료 머신', { w: 2, h: 1 }, '#8fb3c9'),
    oven: object('oven', '오븐', { w: 2, h: 1 }, '#d08b5b'),
    pass: object('pass', '서빙대', { w: 2, h: 1 }, '#c9b28f'),
    counter: object('counter', '카운터', { w: 1, h: 2 }, '#b48a6a'),
    plant: object('plant', '화분', { w: 1, h: 1 }, '#6aa36a'),
    bookshelf: object('bookshelf', '책장', { w: 2, h: 1 }, '#9a6f4e'),
    lamp: object('lamp', '별 조명', { w: 1, h: 1 }, '#f3d36b'),
    rug: object('rug', '꽃무늬 러그', { w: 2, h: 2 }, '#e9a9b6'),
    pot: object('pot', '조합 냄비', { w: 1, h: 1 }, '#b8a28a'),
  },
  // 16×16 아이콘: 재료·메뉴·사냥 줍기·무기
  icons: {
    bean: icon('bean', '원두', '#7a4b2a'), milk: icon('milk', '우유', '#f3efe2'), tea: icon('tea', '찻잎', '#7fa65a'),
    flour: icon('flour', '밀가루', '#efe3c4'), egg: icon('egg', '달걀', '#f6d77a'), sugar: icon('sugar', '설탕', '#ffffff'),
    night_dew: icon('night_dew', '밤이슬', '#6f7fe8'),
    gem_s: icon('gem_s', '별조각(소)', '#8fd3ff'), gem_m: icon('gem_m', '별조각(중)', '#9dff9a'), gem_l: icon('gem_l', '별조각(대)', '#ffb36b'),
    fish: icon('fish', '구운 생선', '#f0a060'), magnet: icon('magnet', '수염 자석', '#e85d75'), bomb: icon('bomb', '달빛 폭탄', '#c9a227'), chest: icon('chest', '별 상자', '#d9b45a'),
  },
  portraits: {
    yeoni: portrait('yeoni', '연이', ['normal', 'smile', 'surprised', 'sulky', 'determined']),
    yeoni_pig: portrait('yeoni_pig', '연이(꽃돼지)', ['normal', 'smile', 'surprised', 'sulky']),
    neo: portrait('neo', '네오', ['normal', 'smile', 'serious', 'flustered']),
    neo_cat: portrait('neo_cat', '영냥이', ['normal', 'smug', 'serious', 'surprised']),
  },
  // 32×32 타일(카페 바닥·벽, 사냥 들판)
  tiles: {
    cafe_floor: { kind: 'tile', label: '카페 바닥', path: 'assets/tiles/cafe_floor.png', image: null, fallback: { color: '#f1dcc4' } },
    cafe_wall: { kind: 'tile', label: '카페 벽', path: 'assets/tiles/cafe_wall.png', image: null, fallback: { color: '#e7c9a9' } },
    river_field: { kind: 'tile', label: '사주의 강 밤 들판', path: 'assets/tiles/river_field.png', image: null, fallback: { color: '#1f3346' } },
  },
});

// assets/manifest.json 의 ready 에 적힌 키만 불러온다. 파일이 없거나 실패하면 도형 대체로 남는다.
const loaded = new Map();
// 매니페스트 id 는 '묶음/키' 형식(예: actors/yeoni, portraits/yeoni, icons/bean)
const allEntries = () => Object.entries(ASSETS).flatMap(([g, group]) => Object.entries(group).map(([k, d]) => [`${g}/${k}`, d]));
export async function loadAssetImages(manifestUrl = 'assets/manifest.json') {
  let ready = [];
  try {
    const r = await fetch(manifestUrl, { cache: 'no-store' });
    if (r.ok) ready = (await r.json()).ready || [];
  } catch { /* 매니페스트가 없으면 전부 도형 */ }
  const want = new Set(ready);
  await Promise.all(allEntries().filter(([k]) => want.has(k)).map(([k, d]) => new Promise(res => {
    const img = new Image();
    img.onload = () => { loaded.set(k, img); res(); };
    img.onerror = () => res();
    img.src = d.image || d.path;
  })));
  return [...loaded.keys()];
}
export const imageFor = id => loaded.get(id) || loaded.get(`actors/${id}`) || loaded.get(`enemies/${id}`) || null;
export const actorDef = key => ASSETS.actors[key] || ASSETS.enemies[key] || null;

// 상태 이름 → 실제로 그릴 상태(정의가 없으면 idle)
export function resolveState(def, state) {
  return def.states[state] ? state : 'idle';
}
