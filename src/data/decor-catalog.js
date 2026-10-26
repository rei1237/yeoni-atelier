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
