// 배우별·방향별 손 위치. 128² 셀 좌표(발 기준점 64,122)이며 시트를 2배 확대해 격자로 읽은 값이다(2026-10-26).
// x·y = 두 손 사이 가운데(쟁반 기준점이 놓일 곳), w = 두 손 사이 거리, layer = 쟁반을 몸 앞(front)/뒤(back) 중 어디에 그릴지.
// 의상 시트(neo@host_first 등)는 같은 몸 비율로 정규화되어 기본 배우 값을 쓰고, 다르면 여기에 따로 적는다.
// 소품 쪽 좌표(쟁반 손잡이 42,114 / 214,114, 음식 바닥 128,99)는 asset-updates.js 의 service 정의에 있다.
const side = (front, back, y, w) => ({
  down: { x: 64, y, w, layer: 'front' },
  left: { x: front, y, w: Math.round(w * .85), layer: 'front' },
  right: { x: back, y, w: Math.round(w * .85), layer: 'front' },
  up: { x: 64, y: y - 2, w, layer: 'back' },
});

export const ACTOR_SOCKETS = Object.freeze({
  luna: side(30, 98, 86, 34),
  luna_sis: side(38, 90, 86, 30),
  neo: side(40, 88, 86, 32),
  'neo@host_first': side(40, 88, 88, 34),
  moka: side(34, 94, 78, 36),
  cheongtokki: side(36, 92, 90, 40),
  seohanbi: side(38, 90, 90, 34),
  solv: side(34, 94, 84, 40),
  bambi: side(38, 90, 84, 32),
  lune: side(34, 94, 88, 38),
  raven: side(36, 92, 90, 34),
  museong: side(34, 94, 90, 40),
  yun: side(38, 90, 88, 36),
  yeoni: side(38, 90, 86, 32),
  customer: side(38, 90, 88, 30),
});

// 정확한 의상 키 → 기본 배우 키 순서로 찾는다. 없으면 null(호출한 쪽은 소품을 그리지 않는다).
export function actorSocket(key, facing = 'down') {
  const set = ACTOR_SOCKETS[key] || ACTOR_SOCKETS[key.split('@')[0]];
  return set ? set[facing] || set.down : null;
}
