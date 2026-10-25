// 에셋 정의 레지스트리. manifest.ready의 검증된 WebP만 읽고, 누락·실패한 항목은 도형으로 대체한다.
// 일러스트 규격: 캐릭터 셀 96×96, 발 기준점 (48,90). 부드러운 축소와 확대를 사용한다.
// 이미지를 넣는 방법: 각 항목의 path 에 WebP 를 두고 assets/manifest.json 의 ready 배열에 "묶음/키"(예: actors/yeoni)를 적는다.
//   매니페스트에 적힌 키만 불러오므로, 아직 없는 파일 때문에 404 가 쌓이지 않는다. 실패하면 도형으로 남는다.
// 시트 규격: 한 방향 블록 안에서 행 = idle/walk/action, 열 = 프레임. 방향 블록은 DIRECTIONS 순서로 세로로 잇는다.
// 자세한 규격과 생성 프롬프트는 docs/ASSETS.md, AGENTS.md.

import { ASSET_UPDATES } from './asset-updates.js';
import { OUTFITS } from '../data/outfits.js';
import { RECRUITABLE } from '../data/companions.js';
import { DECOR_CATALOG } from '../data/decor-catalog.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
export const SPRITE_STATES = Object.freeze(['idle', 'walk', 'cook', 'serve', 'host', 'react', 'attack', 'hurt']);
export const DIRECTIONS = Object.freeze(['down', 'left', 'right', 'up']);
export const ART = Object.freeze({ FRAME: 96, ANCHOR_X: 48, ANCHOR_Y: 90, ICON: 96, TILE: 128, PORTRAIT: 192 });

const actorStates = (over = {}) => ({
  idle: { frames: 4, fps: 4, loop: true },
  walk: { frames: 4, fps: 10, loop: true },
  cook: { frames: 4, fps: 6, loop: true },
  serve: { frames: 4, fps: 8, loop: false },
  host: { frames: 4, fps: 4, loop: true },
  react: { frames: 4, fps: 8, loop: false },
  attack: { frames: 4, fps: 12, loop: false },
  hurt: { frames: 2, fps: 8, loop: false },
  ...over,
});

const NPC_STATES = { cook: null, serve: null, host: null, attack: null, hurt: null };
const sourceKey = key => key === 'neo@vest_night' ? 'neo' : key === 'yeoni@apron_spring' ? 'yeoni' : key;
const actor = (key, label, fallback, over) => ({
  kind: 'actor', label, path: `assets/sprites/actors/${sourceKey(key)}.webp`, image: null,
  frame: { w: ART.FRAME, h: ART.FRAME }, anchor: { x: ART.ANCHOR_X, y: ART.ANCHOR_Y }, directions: DIRECTIONS,
  columns: 4, directionRows: 3, stateRows: { idle:0, walk:1, cook:2, serve:2, host:2, react:2, attack:2, hurt:2 },
  states: actorStates(over), fallback,
});
// 적·보스: 방향 없이(down 블록 하나) idle·walk·hurt 만 쓴다
const enemy = (key, label, fallback, size = 1) => ({
  kind: 'actor', label, path: `assets/sprites/enemies/${key}.webp`, image: null,
  frame: { w: ART.FRAME * size, h: ART.FRAME * size }, anchor: { x: ART.ANCHOR_X * size, y: ART.ANCHOR_Y * size }, directions: ['down'], columns:4, directionRows:3, stateRows:{idle:0,walk:1,hurt:2},
  states: { idle: { frames: 4, fps: 6, loop: true }, walk: { frames: 4, fps: 8, loop: true }, hurt: { frames: 2, fps: 10, loop: false } }, fallback,
});
const object = (key, label, size, color) => ({ kind: 'object', label, path: `assets/sprites/objects/${key}.webp`, image: null, size, fallback: { color } });
const icon = (key, label, color) => ({ kind: 'icon', label, path: `assets/sprites/icons/${key}.webp`, image: null, px: ART.ICON, fallback: { color } });
// 대화 초상화: 192×192, 4열 입/눈 프레임 × 표정 행(expressions 순서). 기존 가로형도 호환한다.
const portrait = (key, label, expressions) => ({ kind: 'portrait', label, path: `assets/sprites/portraits/${sourceKey(key)}.webp`, legacyPath: `assets/portraits/${key}.png`, image: null, px: ART.PORTRAIT, expressions });

const LEGACY_ASSETS = {
  actors: {
    ...Object.fromEntries(RECRUITABLE.filter(c => c.id !== 'moka').map(c => [c.id, actor(c.id, c.name, { shape: 'person', body: c.color, hair: '#342b40', skin: '#ffe6da' })])),
    ...Object.fromEntries(Object.values(OUTFITS).filter(o => o.slot === 'outfit').map(o => [`${o.who}@${o.id}`, actor(`${o.who}@${o.id}`, o.name, { shape: 'person', body: o.color, hair: o.who === 'neo' ? '#e8ebf5' : '#d98ea6', skin: '#ffe6da' })])),
    // 색은 code-destiny 원작 디자인 문서의 외형 기준(분홍 머리·연꽃·라벤더 리본 / 은발·남색 옷 / 흰 고양이·남색 마법모자)
    yeoni: actor('yeoni', '연이', { shape: 'person', body: '#e3b3bd', hair: '#d98ea6', skin: '#ffe6da', accent: '#b9a3e3' }),
    yeoni_pig: actor('yeoni_pig', '연이(꽃돼지)', { shape: 'pig', body: '#f6bccb', accent: '#f08fb0' }, { cook: null, serve: null, host: null, attack: null }),
    neo: actor('neo', '네오', { shape: 'person', body: '#25305a', hair: '#e8ebf5', skin: '#ffe9dc', accent: '#e8d5a3' }),
    // 영냥이 = 네오의 고양이 모습. 같은 인물 id(neo)를 쓰고 렌더링 키만 바꾼다.
    neo_cat: actor('neo_cat', '영냥이', { shape: 'cat', body: '#f7f5f0', hat: '#1d2850', accent: '#e5c58e', eye: '#7d6bd6' }),
    customer: actor('customer', '손님', { shape: 'person', body: null, hair: '#4a3a33', skin: '#ffe2cf' }, { cook: null, attack: null }),
    // 원작 인물(원작 소개 기준: 흰 아기 토끼 루나 / 분홍 앞치마·토끼 귀 머리띠의 빵집 언니 루나 언니 / 조끼 입은 파란 토끼 청토끼(청토끼 금융) /
    // 헤드폰·마이크·앞치마의 수달 요리사 모카(원작은 식상의 섬)). 그 밖의 색(모카 털·모자 등)은 도형 대체용 임시 구분이고 원작 색이 아니다.
    // 가게·마을 NPC 라 요리·공격 상태는 쓰지 않는다. 마을에서 맡은 역할은 게임 오리지널 외전 설정(docs/WORLD.md).
    luna: actor('luna', '루나', { shape: 'rabbit', body: '#fbf8f2', accent: '#f4b8c8', scale: 0.8 }, { cook: null, host: null, attack: null, hurt: null }), // 서빙·정리 담당이라 serve 사용
    luna_sis: actor('luna_sis', '루나 언니', { shape: 'rabbit', body: '#f6f1e8', accent: '#f0b0c0', apron: '#f3b6c6' }, { serve: null, host: null, attack: null, hurt: null }), // 굽기 담당이라 cook 사용
    cheongtokki: actor('cheongtokki', '청토끼', { shape: 'rabbit', body: '#9db6ef', accent: '#f4b8c8', vest: '#3d6fd1' }, NPC_STATES),
    moka: actor('moka', '모카', { shape: 'otter', body: '#8a5a3c', muzzle: '#f3e2c4', hat: '#7b4fb8', apron: '#f3e9d2', phones: '#2b2b33' }, NPC_STATES),
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
    ...Object.fromEntries(DECOR_CATALOG.map(d => [d.id, object(d.id, d.name, {w:d.width,h:d.height}, d.color)])),
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
  // 96×96 아이콘: 재료·메뉴·사냥 줍기·무기
  icons: {
    ...Object.fromEntries([...Object.values(INGREDIENTS),...Object.values(MENUS)].map(d => [d.id, icon(d.id,d.name,d.color)])),
    bean: icon('bean', '원두', '#7a4b2a'), milk: icon('milk', '우유', '#f3efe2'), tea: icon('tea', '찻잎', '#7fa65a'),
    flour: icon('flour', '밀가루', '#efe3c4'), egg: icon('egg', '달걀', '#f6d77a'), sugar: icon('sugar', '설탕', '#ffffff'),
    night_dew: icon('night_dew', '밤이슬', '#6f7fe8'),
    gem_s: icon('gem_s', '별조각(소)', '#8fd3ff'), gem_m: icon('gem_m', '별조각(중)', '#9dff9a'), gem_l: icon('gem_l', '별조각(대)', '#ffb36b'),
    fish: icon('fish', '구운 생선', '#f0a060'), magnet: icon('magnet', '수염 자석', '#e85d75'), bomb: icon('bomb', '달빛 폭탄', '#c9a227'), chest: icon('chest', '별 상자', '#d9b45a'),
    // 월정석: 사냥에서 떨어지고 청토끼 금융 센터에서 골드로 바꾼다(게임 오리지널)
    moonstone: icon('moonstone', '월정석', '#cfd8ff'),
    // 영냥이 장비(게임 오리지널·임시, data/gear.js). 외형은 바뀌지 않고 아이콘만 쓴다.
    claw_glove: icon('claw_glove', '고양이 발톱 장갑', '#e8d9c4'), crescent_wand: icon('crescent_wand', '초승달 방울 지팡이', '#e5c58e'),
    scale_vest: icon('scale_vest', '생선 비늘 조끼', '#8fb8c9'), fluff_cape: icon('fluff_cape', '솜뭉치 망토', '#f4f0fa'),
    fishbone_charm: icon('fishbone_charm', '생선뼈 부적', '#d8d2bf'), churu_magnet: icon('churu_magnet', '자석 츄르', '#e85d75'),
  },
  portraits: {
    ...Object.fromEntries(RECRUITABLE.filter(c => c.id !== 'moka').map(c => [c.id, portrait(c.id, c.name, ['normal','smile','serious','surprised'])])),
    ...Object.fromEntries(Object.values(OUTFITS).filter(o => o.slot === 'outfit').map(o => [`${o.who}@${o.id}`, portrait(`${o.who}@${o.id}`, o.name, o.who === 'neo' ? ['normal','smile','serious','flustered'] : ['normal','smile','surprised','sulky','determined'])])),
    yeoni: portrait('yeoni', '연이', ['normal', 'smile', 'surprised', 'sulky', 'determined']),
    yeoni_pig: portrait('yeoni_pig', '연이(꽃돼지)', ['normal', 'smile', 'surprised', 'sulky']),
    neo: portrait('neo', '네오', ['normal', 'smile', 'serious', 'flustered']),
    neo_cat: portrait('neo_cat', '영냥이', ['normal', 'smug', 'serious', 'surprised']),
    luna: portrait('luna', '루나', ['normal', 'smile', 'cry', 'surprised']),
    luna_sis: portrait('luna_sis', '루나 언니', ['normal', 'smile', 'tired', 'serious']),
    cheongtokki: portrait('cheongtokki', '청토끼', ['normal', 'smile', 'smug']),
    moka: portrait('moka', '모카', ['normal', 'smug', 'angry']),
  },
  // 128×128 타일(카페 바닥·벽, 사냥 들판)
  tiles: {
    cafe_floor: { kind: 'tile', label: '카페 바닥', path: 'assets/tiles/cafe_floor.webp', image: null, fallback: { color: '#f1dcc4' } },
    cafe_wall: { kind: 'tile', label: '카페 벽', path: 'assets/tiles/cafe_wall.webp', image: null, fallback: { color: '#e7c9a9' } },
    town_street: { kind: 'tile', label: '카페 앞 마을 길(마을 화면 배경)', path: 'assets/tiles/town_street.webp', image: null, fallback: { color: '#d9c7a5' } },
    river_field: { kind: 'tile', label: '사주의 강 밤 들판', path: 'assets/tiles/river_field.webp', image: null, fallback: { color: '#1f3346' } },
  },
  backgrounds: Object.fromEntries(['atelier_lit','atelier_dark','river_night','dressroom','farm'].map(key => [key, { kind:'background', label:key, path:`assets/backgrounds/${key}.webp`, dimensions:key==='farm'?[720,400]:[720,600], opaque:true }])),
  ui: {
    ...Object.fromEntries(['spring','summer','autumn','winter'].map(season => [`town-map-${season}`, { kind:'ui', label:`${season} 마을`, path:`assets/ui/town-map-${season}.webp`, dimensions:[720,600], opaque:true }])),
    ...Object.fromEntries([
      ...['atelier','expand','moka','luna','gear','hunt'].map(k=>[`town-node-${k}`,128,128]),
      ['heart-full',128,128],['heart-empty',128,128],['sos',128,128],
      ...['calm','tired','limit'].map(k=>[`stress-${k}`,128,128]),
      ...['panel','button','tab','card'].map(k=>[`frame-${k}`,144,144]),
      ['transform',1024,128],['transform-large',1536,192],['moon-glint',128,128],['push-lines',128,128],['ledger',128,128],
    ].map(([key,w,h])=>[key,{kind:'ui',label:key,path:`assets/ui/${key}.webp`,dimensions:[w,h]}])),
  },
};
export const ASSETS=Object.freeze(Object.fromEntries([...new Set([...Object.keys(LEGACY_ASSETS),...Object.keys(ASSET_UPDATES)])].map(g=>[g,{...LEGACY_ASSETS[g],...ASSET_UPDATES[g]}])));

// assets/manifest.json 의 ready 에 적힌 키만 불러온다. 파일이 없거나 실패하면 도형 대체로 남는다.
const loaded = new Map(), requests = new Map();
let available = new Set(), manifestTask;
const allEntries = () => Object.entries(ASSETS).flatMap(([g,group])=>Object.entries(group).map(([k,d])=>[`${g}/${k}`,d]));
const definitions = new Map(allEntries());
export const BOOT_ASSETS = ['backgrounds/title','ui/loading','actors/yeoni','actors/neo','actors/luna','actors/luna_sis','portraits/yeoni','portraits/neo','portraits/neo_cat','portraits/luna','portraits/luna_sis','backgrounds/atelier_lit','backgrounds/cafe_room','tiles/cafe_floor','tiles/cafe_wall',...allEntries().filter(([id])=>id.startsWith('objects/')||id.startsWith('icons/')).map(([id])=>id)];
async function requestImage(id){
 if(!available.has(id))return null;const d=definitions.get(id);if(!d)return null;const src=d.image||d.path;
 if(!requests.has(src))requests.set(src,new Promise(resolve=>{const img=new Image();let timer=setTimeout(()=>resolve(null),12000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);resolve(null);};img.src=src;}));
 const img=await requests.get(src);if(img)loaded.set(id,img);return img;
}
export async function loadAssetImages(manifestUrl='assets/manifest.json',{keys=BOOT_ASSETS,onProgress=()=>{}}={}){
 manifestTask ||= fetch(manifestUrl).then(r=>r.ok?r.json():{ready:[]}).then(m=>{available=new Set(m.ready||[]);}).catch(()=>{});
 await manifestTask;const wanted=[...new Set(keys)].filter(id=>available.has(id));let done=0;onProgress(0,wanted.length);
 await Promise.all(wanted.map(id=>requestImage(id).finally(()=>onProgress(++done,wanted.length))));return [...loaded.keys()];
}
export function imageFor(id){
 const key=definitions.has(id)?id:definitions.has(`actors/${id}`)?`actors/${id}`:`enemies/${id}`;
 if(!loaded.has(key)&&available.has(key))requestImage(key);
 return loaded.get(key)||null;
}
export function assetLoadStatus(){return {loaded:loaded.size,requested:requests.size,available:available.size};}
export const actorDef = key => ASSETS.actors[key] || ASSETS.enemies[key] || null;

// 상태 이름 → 실제로 그릴 상태(정의가 없으면 idle)
export function resolveState(def, state) {
  return def.states[state] ? state : 'idle';
}
