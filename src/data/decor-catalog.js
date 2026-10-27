import {furnitureMetrics} from './furniture-metrics.js';
// 게임 오리지널 인테리어. 가격·분위기 효과는 임시(TEMP), 전부 확정 구매.
const decor = (id, name, theme, width, height, floor, color, price, ambience) => ({ id, name, theme, width, height, color, price, ambience:ambience*(price>=1600?4:price>=900?2:1),
  grade:price>=1600?'명품':price>=900?'고급':'기본',
  cells: Array.from({ length: width * height }, (_, i) => ({ dx: i % width, dy: Math.floor(i / width), kind: floor ? 'floor' : 'block' })) });
export const DECOR_CATALOG = Object.freeze([
  decor('lotus_pot', '연꽃 수반', '연꽃 정원', 1, 1, false, '#bf7188', 480, 2),
  decor('bamboo', '작은 대나무', '연꽃 정원', 1, 1, false, '#719577', 520, 2),
  decor('garden_bench', '꽃길 벤치', '연꽃 정원', 2, 1, false, '#a98063', 1100, 3),
  decor('lotus_rug', '연꽃 원형 카펫', '연꽃 정원', 2, 2, true, '#c98da6', 1400, 3),
  decor('moon_lamp', '초승달 스탠드', '달빛 살롱', 1, 1, false, '#d5b877', 800, 2),
  decor('velvet_sofa', '남보라 벨벳 소파', '달빛 살롱', 2, 1, false, '#77668d', 1800, 4),
  decor('star_carpet', '별자리 카펫', '달빛 살롱', 2, 2, true, '#59628c', 1600, 3),
  decor('record_shelf', '데스티노바 음반장', '달빛 살롱', 2, 1, false, '#806c85', 2000, 4),
  decor('tea_cabinet', '오행 찻잔장', '오행 찻집', 2, 1, false, '#92714e', 1400, 3),
  decor('water_bowl', '푸른 물결 수반', '오행 찻집', 1, 1, false, '#668fa0', 600, 2),
  decor('fire_lantern', '붉은 등불', '오행 찻집', 1, 1, false, '#bc7261', 650, 2),
  decor('earth_vase', '황토빛 항아리', '오행 찻집', 1, 1, false, '#b79764', 500, 2),
  decor('silver_bell', '은빛 풍경', '오행 찻집', 1, 1, false, '#a6a6b5', 750, 2),
  decor('harvest_basket', '수확 바구니', '연이의 농장', 1, 1, false, '#b68f59', 420, 2),
  decor('herb_shelf', '허브 화분 선반', '연이의 농장', 2, 1, false, '#81926c', 1000, 3),
  decor('greenhouse_rug', '새싹 발매트', '연이의 농장', 2, 2, true, '#8fa38b', 900, 2),
]);

// 기존 저장 품목은 크기를 유지한다. 대형 규격은 별도 제품으로 판매한다.
export const LARGE_CATALOG=Object.freeze([
 {id:'grand_table',name:'대형 원형 테이블',width:2,height:2,price:3600,baseAmbience:3,table:true,art:'table'},
 {id:'grand_planter',name:'대형 꽃 정원',width:2,height:2,price:2200,baseAmbience:3,art:'plant'},
 {id:'long_cabinet',name:'긴 수납 카운터',width:3,height:2,price:4200,baseAmbience:4,art:'pass'},
].map(d=>{const cells=Array.from({length:d.width*d.height},(_,i)=>({dx:i%d.width,dy:Math.floor(i/d.width),kind:d.table?'table':'block'}));const base={...d,cells,theme:'넓은 공간 가구',grade:d.baseAmbience===4?'명품':'고급',color:'#c79a6b',storable:true};return {...base,...furnitureMetrics(base)};}));
