// 의상·액세서리(임시 데이터). 색상과 이름표로만 표현한다.
// 능력치·상성·핵심 조건 상한에 영향이 없다(효과 필드 자체가 없다).

export const OUTFIT_SLOTS = Object.freeze(['outfit', 'acc1', 'acc2']);

export const OUTFITS = Object.freeze({
  crescent_tailcoat: { id: 'crescent_tailcoat', slot: 'outfit', who: 'neo', name: '초승달 연미복', color: '#35446d', temp: true, unlock: { type: 'moonstone', cost: 28 } },
  wood_suit: { id: 'wood_suit', slot: 'outfit', who: 'neo', name: '청목 정장', color: '#527362', temp: true, unlock: { type: 'moonstone', cost: 36 } },
  blossom_haori: { id: 'blossom_haori', slot: 'outfit', who: 'neo', name: '벚꽃 저녁', color: '#c69aae', temp: true, unlock: { type: 'moonstone', cost: 42 } },
  rain_coat: { id: 'rain_coat', slot: 'outfit', who: 'neo', name: '비 갠 새벽', color: '#6b91a8', temp: true, unlock: { type: 'event', key: 'm4' }, hint: '7월 이야기를 마치면' },
  summer_linen: { id: 'summer_linen', slot: 'outfit', who: 'neo', name: '여름의 여백', color: '#e8d7ba', temp: true, unlock: { type: 'event', key: 'm5' }, hint: '8월 이야기를 마치면' },
  moonstone_robe: { id: 'moonstone_robe', slot: 'outfit', who: 'neo', name: '월정석 예복', color: '#b2b8d3', temp: true, unlock: { type: 'moonstone', cost: 90 } },
  winter_coat: { id: 'winter_coat', slot: 'outfit', who: 'neo', name: '한겨울 별자리', color: '#403b5b', temp: true, unlock: { type: 'event', key: 'm9' }, hint: '12월 이야기를 마치면' },
  garden_apron: { id: 'garden_apron', slot: 'outfit', who: 'yeoni', name: '연꽃 정원 앞치마', color: '#a9b88e', temp: true, unlock: { type: 'moonstone', cost: 24 } },
  host_first: { id: 'host_first', slot: 'outfit', who: 'neo', name: '달빛 첫인사', color: '#293450', temp: true, unlock: { type: 'event', key: 'm2' } },
  apron_spring: { id: 'apron_spring', slot: 'outfit', name: '봄빛 앞치마', color: '#f7c6d0', who: 'yeoni', unlock: { type: 'start' } },
  vest_night: { id: 'vest_night', slot: 'outfit', name: '밤하늘 조끼', color: '#3f4a7a', who: 'neo', unlock: { type: 'start' } },
  pin_star: { id: 'pin_star', slot: 'acc', name: '별 머리핀', color: '#f3d36b' },
  badge_ggul: { id: 'badge_ggul', slot: 'acc', name: '꿀꿀 배지', color: '#f29bb0' },
  ribbon_mint: { id: 'ribbon_mint', slot: 'acc', name: '민트 리본', color: '#7fd1b9' },
});

export const START_OUTFITS = Object.freeze(['apron_spring', 'vest_night', 'pin_star', 'badge_ggul', 'ribbon_mint']);
export const OUTFIT_WEARERS = Object.freeze(['yeoni', 'neo']);
