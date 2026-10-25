// 메뉴·재료 데이터. 메뉴 이름은 기획서 p.8의 "가칭 메뉴"를 그대로 쓴다(정식 명칭 아님).
// 조리 시간은 기획서 제안 범위 안의 값, 가격·재료 원가는 임시값(balance.temp.js 성격).
// 재료는 모두 마을 모카 식재료점에서 산다. basic = 기본 재료, shop = 모카가 파는 특별 재료(밤이슬, 가격 임시).

export const INGREDIENTS = Object.freeze({
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

export const MENU_ORDER = Object.freeze(['fortune_latte', 'starlight_tea', 'flower_cookie', 'moon_pudding', 'lucky_sand', 'moon_milk_tea', 'stardust_castella', 'oink_cream_latte', 'night_dew_latte']);

export function ingredientCostOf(menuId) {
  const m = MENUS[menuId];
  let sum = 0;
  for (const [id, n] of Object.entries(m.ingredients)) sum += INGREDIENTS[id].price * n;
  return sum;
}
