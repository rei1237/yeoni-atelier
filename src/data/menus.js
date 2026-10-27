// 메뉴·재료 데이터. 메뉴 이름은 기획서 p.8의 "가칭 메뉴"를 그대로 쓴다(정식 명칭 아님).
// 조리 시간은 기획서 제안 범위 안의 값, 가격·재료 원가는 임시값(balance.temp.js 성격).
// 재료는 모두 마을 모카 식재료점에서 산다. basic = 기본 재료, shop = 모카가 파는 특별 재료(밤이슬, 가격 임시).

export const INGREDIENTS = Object.freeze({
  moon_lotus:{id:'moon_lotus',name:'달그늘 연꽃',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},
  dream_honey:{id:'dream_honey',name:'꿈결 꿀',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},
  star_leaf:{id:'star_leaf',name:'별결 찻잎',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},
  gold_bark:{id:'gold_bark',name:'황금 달계피',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},
  white_lotus:{id:'white_lotus',name:'밤의 백련',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},
  heukwol_grain:{id:'heukwol_grain',name:'흑월 현미',price:0,basic:false,shop:false,huntOnly:true,color:'#aa83c0'},

  berry: { id: 'berry', name: '딸기', price: 34, basic: false, farm: true, color: '#da7495' },
  rice: { id: 'rice', name: '쌀', price: 32, basic: false, farm: true, color: '#f5e8d0' },
  pumpkin: { id: 'pumpkin', name: '호박', price: 38, basic: false, farm: true, color: '#e5a34c' },
  bean:      { id: 'bean',      name: '원두',   price: 30, basic: true,  color: '#7a4b2a' },
  milk:      { id: 'milk',      name: '우유',   price: 26, basic: true,  color: '#f3efe2' },
  tea:       { id: 'tea',       name: '찻잎',   price: 30, basic: true,  color: '#7fa65a' },
  flour:     { id: 'flour',     name: '밀가루', price: 30, basic: true,  color: '#efe3c4' },
  egg:       { id: 'egg',       name: '달걀',   price: 30, basic: true,  color: '#f6d77a' },
  sugar:     { id: 'sugar',     name: '설탕',   price: 18, basic: true,  color: '#ffffff' },
  night_dew: { id: 'night_dew', name: '밤이슬', price: 90, basic: false, shop: true, color: '#6f7fe8', rare: true },
});

// station: 'drink' = 음료 머신, 'oven' = 오븐
// group: 기획서 조리 시간 구분(drink / dessert / meal)
export const MENUS = Object.freeze({
  americano:{id:'americano',name:'새벽별 아메리카노',short:'아메리카노',station:'drink',group:'drink',cookMs:10000,price:100,ingredients:{bean:1},color:'#684732',learned:true}, // TEMP: 원가30G, 물은 재고가 아니다
  lotus_moon:{id:'lotus_moon',name:'달빛 연꽃차',short:'달빛 연꽃차',station:'drink',group:'drink',cookMs:36000,price:2800,ingredients:{moon_lotus:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:20},
  honey_peach:{id:'honey_peach',name:'꿀복숭아차',short:'꿀복숭아차',station:'drink',group:'drink',cookMs:38000,price:3200,ingredients:{dream_honey:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:30},
  star_black_tea:{id:'star_black_tea',name:'별가루 홍차',short:'별가루 홍차',station:'drink',group:'drink',cookMs:40000,price:4200,ingredients:{star_leaf:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:45},
  gold_cinnamon:{id:'gold_cinnamon',name:'황금 계피차',short:'황금 계피차',station:'drink',group:'drink',cookMs:42000,price:5200,ingredients:{gold_bark:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:60},
  white_lotus_healing:{id:'white_lotus_healing',name:'백련 치유차',short:'백련 치유차',station:'drink',group:'drink',cookMs:44000,price:6800,ingredients:{white_lotus:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:75},
  black_moon_brown_rice:{id:'black_moon_brown_rice',name:'흑월 현미차',short:'흑월 현미차',station:'drink',group:'drink',cookMs:45000,price:9600,ingredients:{heukwol_grain:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:85},

  lotus_berry_tart: { id: 'lotus_berry_tart', name: '연꽃 딸기 타르트', short: '딸기타르트', station: 'oven', group: 'dessert', cookMs: 18000, price: 195, ingredients: { berry: 1, flour: 1, sugar: 1 }, color: '#da7495', learned: false, farm: true },
  moon_rice_bowl: { id: 'moon_rice_bowl', name: '초승달 달걀밥', short: '달걀밥', station: 'oven', group: 'meal', cookMs: 24000, price: 220, ingredients: { rice: 1, egg: 1 }, color: '#f5d36b', learned: false, farm: true },
  golden_pumpkin_soup: { id: 'golden_pumpkin_soup', name: '황금 호박 수프', short: '호박수프', station: 'oven', group: 'meal', cookMs: 22000, price: 210, ingredients: { pumpkin: 1, milk: 1 }, color: '#e5a34c', learned: false, farm: true },
  fortune_latte:   { id: 'fortune_latte',   name: '운세 라테',   short: '라테',  station: 'drink', group: 'drink',   cookMs: 14000, price: 140, ingredients: { bean: 1, milk: 1 }, color: '#c89b6d', learned: true },
  starlight_tea:   { id: 'starlight_tea',   name: '별빛 차',     short: '별차',  station: 'drink', group: 'drink',   cookMs: 12000, price: 120, ingredients: { tea: 1, sugar: 1 }, color: '#9fc46f', learned: true },
  flower_cookie:   { id: 'flower_cookie',   name: '꽃 쿠키',     short: '쿠키',  station: 'oven',  group: 'dessert', cookMs: 18000, price: 150, ingredients: { flour: 1, sugar: 1 }, color: '#f2a7b8', learned: true },
  moon_pudding:    { id: 'moon_pudding',    name: '달빛 푸딩',   short: '푸딩',  station: 'oven',  group: 'dessert', cookMs: 22000, price: 180, ingredients: { egg: 1, milk: 1, sugar: 1 }, color: '#f5d36b', learned: true },
  lucky_sand:      { id: 'lucky_sand',      name: '행운 샌드',   short: '샌드',  station: 'oven',  group: 'meal',    cookMs: 28000, price: 240, ingredients: { flour: 1, egg: 1, milk: 1 }, color: '#e7b27a', learned: true },
  // 조합 발견 메뉴(임시): 처음엔 모르고, 조합대에서 재료를 맞게 섞으면 배운다. 이름·가격은 이 게임의 임시값.
  moon_milk_tea:   { id: 'moon_milk_tea',   name: '달빛 밀크티', short: '밀크티', station: 'drink', group: 'drink',   cookMs: 15000, price: 160, ingredients: { tea: 1, milk: 1, sugar: 1 }, color: '#d9b99b', learned: false, combo: true },
  stardust_castella: { id: 'stardust_castella', name: '별가루 카스텔라', short: '카스텔라', station: 'oven', group: 'dessert', cookMs: 24000, price: 200, ingredients: { flour: 1, egg: 1, sugar: 1 }, color: '#f0c25a', learned: false, combo: true },
  oink_cream_latte: { id: 'oink_cream_latte', name: '꿀꿀 크림 라테', short: '크림라테', station: 'drink', group: 'drink', cookMs: 16000, price: 170, ingredients: { bean: 1, milk: 1, sugar: 1 }, color: '#f2b8c6', learned: false, combo: true },
  // 특별 메뉴: 사냥 재료 사용. 첫 밤이슬 획득 퀘스트 보상으로 레시피를 익힌다.
  night_dew_latte: { id: 'night_dew_latte', name: '밤이슬 라테', short: '밤라테', station: 'drink', group: 'drink',   cookMs: 16000, price: 320, ingredients: { night_dew: 1, milk: 1, bean: 1 }, color: '#7d86e8', learned: false, special: true },
});

export const MENU_ORDER = Object.freeze(['americano','fortune_latte', 'starlight_tea', 'flower_cookie', 'moon_pudding', 'lucky_sand', 'moon_milk_tea', 'stardust_castella', 'oink_cream_latte', 'night_dew_latte', 'lotus_berry_tart', 'moon_rice_bowl', 'golden_pumpkin_soup','lotus_moon','honey_peach','star_black_tea','gold_cinnamon','white_lotus_healing','black_moon_brown_rice']);

export function ingredientCostOf(menuId) {
  const m = MENUS[menuId];
  let sum = 0;
  for (const [id, n] of Object.entries(m.ingredients)) sum += INGREDIENTS[id].price * n;
  return sum;
}
