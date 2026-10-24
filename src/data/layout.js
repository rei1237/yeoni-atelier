// 카페 공간 데이터. 1칸 = 1 타일. 세로형 9 × 12.
// 고정 설비(이동 불가)와 배치 가능한 가구를 분리한다.

export const GRID = Object.freeze({ cols: 9, rows: 12 });

export const SPOTS = Object.freeze({
  entrance: { x: 4, y: 11 },
  pickup: { x: 7, y: 1 },     // 서빙대 앞: 완성 음식을 집는 자리
  yeoniHome: { x: 1, y: 3 },  // 카운터 뒤 연이 대기 자리
  neoHome: { x: 3, y: 3 },    // 네오 대기 자리
  drinkFront: { x: 1, y: 1 },
  ovenFront: { x: 4, y: 1 },
});

// 고정 설비. 이동·보관 불가.
export const FIXTURES = Object.freeze([
  { id: 'drink', name: '음료 머신', cells: [[1, 0], [2, 0]], color: '#8fb3c9' },
  { id: 'oven', name: '오븐', cells: [[4, 0], [5, 0]], color: '#d08b5b' },
  { id: 'pass', name: '서빙대', cells: [[7, 0], [8, 0]], color: '#c9b28f' },
  { id: 'counter', name: '카운터', cells: [[0, 3], [0, 4]], color: '#b48a6a' },
  { id: 'wall_a', name: '벽', cells: [[0, 0], [3, 0], [6, 0]], color: '#e9dccb', wall: true },
]);

// 가구를 놓을 수 없는 칸: 주방 통로 전체, 입구와 입구 앞
export const RESERVED = Object.freeze([
  ...Array.from({ length: 9 }, (_, x) => [x, 1]),
  [4, 11], [4, 10],
]);

// 가구 정의. cells는 회전 0 기준의 상대 좌표. kind: table / chair / block / floor(통과 가능 장식)
export const FURNITURE = Object.freeze({
  table_set: { id: 'table_set', name: '2인 테이블 세트', cells: [{ dx: 0, dy: 0, kind: 'table' }, { dx: 0, dy: 1, kind: 'chair' }], color: '#c79a6b', ambience: 0, table: true, storable: false },
  plant: { id: 'plant', name: '화분', cells: [{ dx: 0, dy: 0, kind: 'block' }], color: '#6aa36a', ambience: 2 },
  bookshelf: { id: 'bookshelf', name: '책장', cells: [{ dx: 0, dy: 0, kind: 'block' }, { dx: 1, dy: 0, kind: 'block' }], color: '#9a6f4e', ambience: 3 },
  lamp: { id: 'lamp', name: '별 조명', cells: [{ dx: 0, dy: 0, kind: 'block' }], color: '#f3d36b', ambience: 2 },
  rug: { id: 'rug', name: '꽃무늬 러그', cells: [{ dx: 0, dy: 0, kind: 'floor' }, { dx: 1, dy: 0, kind: 'floor' }, { dx: 0, dy: 1, kind: 'floor' }, { dx: 1, dy: 1, kind: 'floor' }], color: '#e9a9b6', ambience: 2 },
});

// 새 게임의 가구. x/y 가 null 이면 보관함에 있다.
// 테이블 세트 3개는 보관할 수 없다(좌석 3개는 1단계의 고정 규모).
export const START_FURNITURE = Object.freeze([
  { uid: 'table1', defId: 'table_set', x: 2, y: 5, rot: 0, tableNo: 1 },
  { uid: 'table2', defId: 'table_set', x: 6, y: 5, rot: 0, tableNo: 2 },
  { uid: 'table3', defId: 'table_set', x: 6, y: 8, rot: 0, tableNo: 3 },
  { uid: 'plant1', defId: 'plant', x: 0, y: 11, rot: 0 },
  { uid: 'plant2', defId: 'plant', x: 8, y: 11, rot: 0 },
  { uid: 'rug1', defId: 'rug', x: 3, y: 5, rot: 0 },
  { uid: 'shelf1', defId: 'bookshelf', x: null, y: null, rot: 0 },
  { uid: 'lamp1', defId: 'lamp', x: null, y: null, rot: 0 },
]);
