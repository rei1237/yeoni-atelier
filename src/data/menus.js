// 메뉴·재료 데이터. 메뉴 이름은 기획서 p.8의 "가칭 메뉴"를 그대로 쓴다(정식 명칭 아님).
// 조리 시간과 가격·재료 원가는 게임 밸런스용 임시값이다.
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
  bean:      { id: 'bean',      name: '원두',   price: 21, basic: true,  color: '#7a4b2a' },
  milk:      { id: 'milk',      name: '우유',   price: 18, basic: true,  color: '#f3efe2' },
  tea:       { id: 'tea',       name: '찻잎',   price: 21, basic: true,  color: '#7fa65a' },
  flour:     { id: 'flour',     name: '밀가루', price: 21, basic: true,  color: '#efe3c4' },
  egg:       { id: 'egg',       name: '달걀',   price: 21, basic: true,  color: '#f6d77a' },
  sugar:     { id: 'sugar',     name: '설탕',   price: 13, basic: true,  color: '#ffffff' },
  night_dew: { id: 'night_dew', name: '밤이슬', price: 63, basic: false, shop: true, color: '#6f7fe8', rare: true },
});

// station: 'drink' = 음료 머신, 'oven' = 오븐
// group: 기획서 조리 시간 구분(drink / dessert / meal)
export const MENUS = Object.freeze({
  // TEMP: 루나 언니 인연으로 단계별 해금되는 고수익 메뉴.
  luna_crescent_latte:{id:'luna_crescent_latte',name:'초승달 크림 커피',short:'초승달 커피',station:'drink',group:'drink',cookMs:15000,price:1200,ingredients:{bean:2,milk:1,sugar:1},color:'#d3ae85',learned:false,special:true,lunaRank:3},
  luna_berry_mille:{id:'luna_berry_mille',name:'딸기 장미 밀푀유',short:'딸기 밀푀유',station:'oven',group:'dessert',cookMs:21000,price:2200,ingredients:{berry:2,flour:2,milk:1,sugar:1},color:'#df8fa2',learned:false,special:true,lunaRank:6},
  luna_pumpkin_quiche:{id:'luna_pumpkin_quiche',name:'황금 호박 키슈',short:'호박 키슈',station:'oven',group:'meal',cookMs:26000,price:3600,ingredients:{pumpkin:2,flour:2,egg:2,milk:1},color:'#d5a557',learned:false,special:true,lunaRank:9},

  // TEMP: 연이 성장으로 해금 → 직접 완성 → 카페 등록. 사냥 전용 메뉴와 별도.
  yeoni_moon_latte:{id:'yeoni_moon_latte',name:'달빛 크림 라테',short:'달빛 라테',station:'drink',group:'drink',cookMs:13000,price:710,ingredients:{bean:1,milk:2,sugar:1},color:'#e4c5c8',learned:false,special:true,yeoniLevel:3,reputationBonus:.3},
  yeoni_rose_mille:{id:'yeoni_rose_mille',name:'장미 밀푀유',short:'장미 밀푀유',station:'oven',group:'dessert',cookMs:18000,price:1050,ingredients:{flour:2,egg:1,milk:1,sugar:1},color:'#d792a6',learned:false,special:true,yeoniLevel:6,reputationBonus:.5},
  yeoni_garden_quiche:{id:'yeoni_garden_quiche',name:'꽃정원 키슈',short:'꽃정원 키슈',station:'oven',group:'meal',cookMs:21000,price:1410,ingredients:{flour:2,egg:2,milk:1,pumpkin:1},color:'#a3b88a',learned:false,special:true,yeoniLevel:10,reputationBonus:.7},

  americano:{id:'americano',name:'새벽별 아메리카노',short:'아메리카노',station:'drink',group:'drink',cookMs:7000,price:200,ingredients:{bean:1},color:'#684732',learned:true}, // TEMP: 원가21G, 물은 재고가 아니다
  lotus_moon:{id:'lotus_moon',name:'달빛 연꽃차',short:'달빛 연꽃차',station:'drink',group:'drink',cookMs:25000,price:5060,ingredients:{moon_lotus:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:20},
  honey_peach:{id:'honey_peach',name:'꿀복숭아차',short:'꿀복숭아차',station:'drink',group:'drink',cookMs:27000,price:5780,ingredients:{dream_honey:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:30},
  star_black_tea:{id:'star_black_tea',name:'별가루 홍차',short:'별가루 홍차',station:'drink',group:'drink',cookMs:28000,price:7580,ingredients:{star_leaf:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:45},
  gold_cinnamon:{id:'gold_cinnamon',name:'황금 계피차',short:'황금 계피차',station:'drink',group:'drink',cookMs:29000,price:9380,ingredients:{gold_bark:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:60},
  white_lotus_healing:{id:'white_lotus_healing',name:'백련 치유차',short:'백련 치유차',station:'drink',group:'drink',cookMs:31000,price:12260,ingredients:{white_lotus:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:75},
  black_moon_brown_rice:{id:'black_moon_brown_rice',name:'흑월 현미차',short:'흑월 현미차',station:'drink',group:'drink',cookMs:31000,price:17300,ingredients:{heukwol_grain:2,tea:1},color:'#b48bc6',learned:false,special:true,nominationOnly:true,huntStage:85},

  lotus_berry_tart: { id: 'lotus_berry_tart', name: '연꽃 딸기 타르트', short: '딸기타르트', station: 'oven', group: 'dessert', cookMs:13000,price:410, ingredients: { berry: 1, flour: 1, sugar: 1 }, color: '#da7495', learned: false, farm: true },
  moon_rice_bowl: { id: 'moon_rice_bowl', name: '초승달 달걀밥', short: '달걀밥', station: 'oven', group: 'meal', cookMs:17000,price:440, ingredients: { rice: 1, egg: 1 }, color: '#f5d36b', learned: false, farm: true },
  golden_pumpkin_soup: { id: 'golden_pumpkin_soup', name: '황금 호박 수프', short: '호박수프', station: 'oven', group: 'meal', cookMs:15000,price:430, ingredients: { pumpkin: 1, milk: 1 }, color: '#e5a34c', learned: false, farm: true },
  fortune_latte:   { id: 'fortune_latte',   name: '운세 라테',   short: '라테',  station: 'drink', group: 'drink',   cookMs:10000,price:290, ingredients: { bean: 1, milk: 1 }, color: '#c89b6d', learned: true },
  starlight_tea:   { id: 'starlight_tea',   name: '별빛 차',     short: '별차',  station: 'drink', group: 'drink',   cookMs:8000,price:250, ingredients: { tea: 1, sugar: 1 }, color: '#9fc46f', learned: true },
  flower_cookie:   { id: 'flower_cookie',   name: '꽃 쿠키',     short: '쿠키',  station: 'oven',  group: 'dessert', cookMs:13000,price:310, ingredients: { flour: 1, sugar: 1 }, color: '#f2a7b8', learned: true },
  moon_pudding:    { id: 'moon_pudding',    name: '달빛 푸딩',   short: '푸딩',  station: 'oven',  group: 'dessert', cookMs:15000,price:370, ingredients: { egg: 1, milk: 1, sugar: 1 }, color: '#f5d36b', learned: true },
  lucky_sand:      { id: 'lucky_sand',      name: '행운 샌드',   short: '샌드',  station: 'oven',  group: 'meal',    cookMs:20000,price:480, ingredients: { flour: 1, egg: 1, milk: 1 }, color: '#e7b27a', learned: true },
  // 조합 발견 메뉴(임시): 처음엔 모르고, 조합대에서 재료를 맞게 섞으면 배운다. 이름·가격은 이 게임의 임시값.
  moon_milk_tea:   { id: 'moon_milk_tea',   name: '달빛 밀크티', short: '밀크티', station: 'drink', group: 'drink',   cookMs:11000,price:330, ingredients: { tea: 1, milk: 1, sugar: 1 }, color: '#d9b99b', learned: false, combo: true },
  stardust_castella: { id: 'stardust_castella', name: '별가루 카스텔라', short: '카스텔라', station: 'oven', group: 'dessert', cookMs:17000,price:410, ingredients: { flour: 1, egg: 1, sugar: 1 }, color: '#f0c25a', learned: false, combo: true },
  oink_cream_latte: { id: 'oink_cream_latte', name: '꿀꿀 크림 라테', short: '크림라테', station: 'drink', group: 'drink', cookMs:11000,price:360, ingredients: { bean: 1, milk: 1, sugar: 1 }, color: '#f2b8c6', learned: false, combo: true },
  // 특별 메뉴: 사냥 재료 사용. 첫 밤이슬 획득 퀘스트 보상으로 레시피를 익힌다.
  night_dew_latte: { id: 'night_dew_latte', name: '밤이슬 라테', short: '밤라테', station: 'drink', group: 'drink',   cookMs:11000,price:660, ingredients: { night_dew: 1, milk: 1, bean: 1 }, color: '#7d86e8', learned: false, special: true },
});

export const MENU_ORDER = Object.freeze(['luna_crescent_latte','luna_berry_mille','luna_pumpkin_quiche','yeoni_moon_latte','yeoni_rose_mille','yeoni_garden_quiche','americano','fortune_latte', 'starlight_tea', 'flower_cookie', 'moon_pudding', 'lucky_sand', 'moon_milk_tea', 'stardust_castella', 'oink_cream_latte', 'night_dew_latte', 'lotus_berry_tart', 'moon_rice_bowl', 'golden_pumpkin_soup','lotus_moon','honey_peach','star_black_tea','gold_cinnamon','white_lotus_healing','black_moon_brown_rice']);

export function ingredientCostOf(menuId) {
  const m = MENUS[menuId];
  let sum = 0;
  for (const [id, n] of Object.entries(m.ingredients)) sum += INGREDIENTS[id].price * n;
  return sum;
}

// 이전 가격으로 이미 소비한 저장 중 조리의 결산을 되돌릴 때만 사용한다.
const LEGACY_INGREDIENT_PRICES = Object.freeze({"bean":30,"milk":26,"tea":30,"flour":30,"egg":30,"sugar":18,"night_dew":90});
export function legacyIngredientCostOf(menuId) {
  return Object.entries(MENUS[menuId].ingredients).reduce((sum,[id,n]) => sum + (LEGACY_INGREDIENT_PRICES[id] ?? INGREDIENTS[id].price) * n, 0);
}

// 루나 언니 메뉴는 저장을 덮어쓰지 않고 인연 랭크에서 해금 상태를 계산한다.
export function menuUnlocked(state,id) { const m=MENUS[id]; return !!m && (m.lunaRank ? (state.bondRank?.luna_sis || 0) >= m.lunaRank : !!state.learned?.[id]); }
