// 카페 공간 데이터. 1칸 = 1 타일. 세로형 12 × 16.
// 고정 설비(이동 불가)와 배치 가능한 가구를 분리한다.
// 연이는 주방 오른쪽 계산대에서 계산만 한다. 루나 언니는 주방(굽기), 루나는 홀(서빙·정리)을 맡는다(게임 오리지널).

import { DECOR_CATALOG,LARGE_CATALOG } from './decor-catalog.js';
import {furnitureMetrics} from './furniture-metrics.js';
export const GRID = Object.freeze({ cols: 20, rows: 40 });

export const SPOTS = Object.freeze({
  entrance: { x: 5, y: 15 },
  pickup: { x: 7, y: 1 },     // 서빙대 앞: 완성 음식을 집는 자리
  yeoniHome: { x: 10, y: 1 }, // 주방 오른쪽 계산대 뒤
  checkout: {x:11,y:1}, // 출입구와 분리한 결제 자리
  neoHome: { x: 6, y: 1 },    // 네오 대기 자리
  sisHome: { x: 3, y: 1 },    // 루나 언니: 음료 머신과 오븐 사이
  lunaHome: { x: 8, y: 1 },   // 루나: 서빙대 옆
  drinkFront: { x: 1, y: 1 },
  ovenFront: { x: 4, y: 1 },
});

// 고정 설비. 이동·보관 불가.
export const FIXTURES = Object.freeze([
  { id: 'drink', name: '음료 머신', cells: [[1, 0], [2, 0]], color: '#8fb3c9' },
  { id: 'oven', name: '오븐', cells: [[4, 0], [5, 0]], color: '#d08b5b' },
  { id: 'pass', name: '서빙대', cells: [[7, 0], [8, 0]], color: '#c9b28f' },
  { id: 'counter', name: '계산대', cells: [[10, 0], [11, 0]], color: '#b48a6a' },
  { id: 'wall_a', name: '벽', cells: [[0, 0], [3, 0], [6, 0], [9, 0]], color: '#e9dccb', wall: true },
]);

// 가구를 놓을 수 없는 칸: 주방 통로 전체, 입구와 입구 앞, 계산대 뒤
export const RESERVED = Object.freeze([
  ...Array.from({ length: 12 }, (_, x) => [x, 1]),
  [5, 15], [5, 14], [5, 13], [3, 14],
]);

// 잠긴 구역(공방 증축으로 연다). rect: [x0, y0, x1, y1] 포함 범위. 이름은 게임 오리지널, 가격은 TEMP.AREA_COSTS.
export const AREAS = Object.freeze([
  {id:'east_wing',name:'동쪽 음악당',rect:[12,0,19,15]},
  {id:'garden_wing',name:'남쪽 정원 홀',rect:[0,16,19,23]},
  { id: 'window', name: '창가석', rect: [9, 2, 11, 9] },
  { id: 'salon', name: '별빛 살롱', rect: [0, 11, 2, 15] },
  { id: 'terrace', name: '꽃길 테라스', rect: [9, 10, 11, 15] },
  ...Array.from({length:4},(_,i)=>({id:'branch_annex_'+(i+1),name:'별관 '+(i+1)+'구역',rect:[0,24+i*4,19,27+i*4],branchMin:i+2})),
]);

export function areaCells(a) {
  const [x0, y0, x1, y1] = a.rect;
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

// 가구 정의. cells는 회전 0 기준의 상대 좌표. kind: table / chair / block / floor(통과 가능 장식)
export const FURNITURE = Object.freeze({
  ...Object.fromEntries([...DECOR_CATALOG,...LARGE_CATALOG].map(d => [d.id, {...d}])),
  table: {id:'table',name:'카페 테이블',cells:[{dx:0,dy:0,kind:'table'}],color:'#c79a6b',ambience:0,table:true,storable:true},
  chair: {id:'chair',name:'카페 의자',cells:[{dx:0,dy:0,kind:'chair'}],color:'#c79a6b',ambience:0,chair:true,storable:true},
  table_set: { id: 'table_set', name: '2인 테이블 세트', cells: [{ dx: 0, dy: 0, kind: 'table' }, { dx: 0, dy: 1, kind: 'chair' }], color: '#c79a6b', ambience: 0, table: true, storable: false },
  plant: { id: 'plant', name: '화분', renderSize:{w:1.15,h:1.6}, cells: [{ dx: 0, dy: 0, kind: 'block' }], color: '#6aa36a', ambience: 2 },
  bookshelf: { id: 'bookshelf', name: '책장', renderSize:{w:2.5,h:3.5}, cells: [{ dx: 0, dy: 0, kind: 'block' }, { dx: 1, dy: 0, kind: 'block' }], color: '#9a6f4e', ambience: 3 },
  lamp: { id: 'lamp', name: '별 조명', renderSize:{w:1.5,h:2.5}, cells: [{ dx: 0, dy: 0, kind: 'block' }], color: '#f3d36b', ambience: 2 },
  rug: { id: 'rug', name: '꽃무늬 러그', cells: [{ dx: 0, dy: 0, kind: 'floor' }, { dx: 1, dy: 0, kind: 'floor' }, { dx: 0, dy: 1, kind: 'floor' }, { dx: 1, dy: 1, kind: 'floor' }], color: '#e9a9b6', ambience: 2 },
});

// 새 게임의 가구. x/y 가 null 이면 보관함에 있다.
// 테이블 세트는 보관할 수 없다. 마을 공방에서 테이블을 더 들인다(game/town.js).
export const START_FURNITURE = Object.freeze([
  { uid: 'table1', defId: 'table_set', x: 2, y: 4, rot: 0, tableNo: 1 },
  { uid: 'table2', defId: 'table_set', x: 6, y: 4, rot: 0, tableNo: 2 },
  { uid: 'table3', defId: 'table_set', x: 6, y: 8, rot: 0, tableNo: 3 },
  { uid: 'table4', defId: 'table_set', x: 2, y: 8, rot: 0, tableNo: 4 },
  { uid: 'table5', defId: 'table_set', x: 6, y: 11, rot: 0, tableNo: 5 },
  { uid: 'plant1', defId: 'plant', x: 0, y: 10, rot: 0 },
  { uid: 'plant2', defId: 'plant', x: 8, y: 15, rot: 0 },
  { uid: 'rug1', defId: 'rug', x: 3, y: 4, rot: 0 },
  { uid: 'shelf1', defId: 'bookshelf', x: null, y: null, rot: 0 },
  { uid: 'lamp1', defId: 'lamp', x: null, y: null, rot: 0 },
]);

// 구형 세트의 실제 위치·회전을 보존해 독립 의자를 한 번만 만든다.
export function splitFurniture(list){
 const out=list.map(f=>({...f})),added=[];
 for(const f of out){if(f.defId!=='table_set')continue;const uid=f.uid+'-chair',rot=f.rot&3,offset=[[0,1],[-1,0],[0,-1],[1,0]][rot];
  if(!out.some(x=>x.uid===uid))added.push({uid,defId:'chair',x:f.x==null?null:f.x+offset[0],y:f.y==null?null:f.y+offset[1],rot});f.defId='table';}
 return [...out,...added];
}
export function migrateFurniture(state){
 state.interior.furniture=splitFurniture(state.interior.furniture);
 for(const branch of Object.values(state.branches?.owned||{}))if(branch.snapshot?.interior)branch.snapshot.interior.furniture=splitFurniture(branch.snapshot.interior.furniture);
}

for(const def of Object.values(FURNITURE))Object.assign(def,furnitureMetrics(def));

// 계산대 이전은 명시 적용된 지점에만 쓴다. 값이 없는 저장은 기존 배치다.
const LEGACY_CAFE_LAYOUT=Object.freeze({id:'legacy',spots:SPOTS,fixtures:FIXTURES,reserved:RESERVED,yeoniFacing:'right',customerFacing:'left'});
const ENTRANCE_QUEUE=Object.freeze([{x:7,y:15},{x:6,y:14},{x:6,y:13}]);
const ENTRANCE_CAFE_LAYOUT=Object.freeze({id:'entrance',counterArt:{x:6.4,y:12.2,w:3.2,h:2.4,frontY:13.1,depth:14.5},spots:{...SPOTS,yeoniHome:{x:7,y:13},checkout:ENTRANCE_QUEUE[0]},
 fixtures:FIXTURES.map(f=>f.id==='counter'?{...f,cells:[[7,14],[8,14]]}:f),
 reserved:[...RESERVED,[7,13],...ENTRANCE_QUEUE.map(p=>[p.x,p.y])],queue:ENTRANCE_QUEUE,yeoniFacing:'down',customerFacing:'up'});
const LEFT_QUEUE=Object.freeze([{x:4,y:13},{x:4,y:12},{x:3,y:12}]);
const LEFT_CAFE_LAYOUT=Object.freeze({id:'entrance-left',serviceCells:[[1,13],[1,12],[2,12]],counterArt:{key:'counter_right',x:1.8,y:11.8,w:2.4,h:3.2,frontY:13.2,depth:14.5},spots:{...SPOTS,yeoniHome:{x:1,y:13},checkout:LEFT_QUEUE[0]},fixtures:FIXTURES.map(f=>f.id==='counter'?{...f,cells:[[2,13],[3,13],[2,14],[3,14]]}:f),reserved:[...RESERVED,[1,13],[1,12],[2,12],...LEFT_QUEUE.map(p=>[p.x,p.y])],queue:LEFT_QUEUE,yeoniFacing:'right',customerFacing:'left'});
export function cafeLayout(state,preview=false){
 const id=preview&&state?.interior?.draft?state.interior.draft.checkoutLayout:state?.interior?.checkoutLayout;
 return id==='entrance-left'?LEFT_CAFE_LAYOUT:id==='entrance'?ENTRANCE_CAFE_LAYOUT:LEGACY_CAFE_LAYOUT;
}
export const cafeSpots=state=>cafeLayout(state).spots;
