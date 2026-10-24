// 의상·액세서리(임시 데이터). 색상과 이름표로만 표현한다.
// 능력치·상성·핵심 조건 상한에 영향이 없다(효과 필드 자체가 없다).

export const OUTFIT_SLOTS = Object.freeze(['outfit', 'acc1', 'acc2']);

export const OUTFITS = Object.freeze({
  apron_spring: { id: 'apron_spring', slot: 'outfit', name: '봄빛 앞치마', color: '#f7c6d0' },
  vest_night: { id: 'vest_night', slot: 'outfit', name: '밤하늘 조끼', color: '#3f4a7a' },
  pin_star: { id: 'pin_star', slot: 'acc', name: '별 머리핀', color: '#f3d36b' },
  badge_ggul: { id: 'badge_ggul', slot: 'acc', name: '꿀꿀 배지', color: '#f29bb0' },
  ribbon_mint: { id: 'ribbon_mint', slot: 'acc', name: '민트 리본', color: '#7fd1b9' },
});

export const START_OUTFITS = Object.freeze(['apron_spring', 'vest_night', 'pin_star', 'badge_ggul', 'ribbon_mint']);
export const OUTFIT_WEARERS = Object.freeze(['yeoni', 'neo']);
