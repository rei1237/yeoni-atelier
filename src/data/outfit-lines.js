// 게임 오리지널. 의상 대사는 능력치·스트레스 회복 효과가 없다.
export const OUTFIT_LINES = Object.freeze({
  vest_night: '익숙한 조끼야. 소매부터 정리하면 준비 끝.',
  host_first: '첫 손님을 맞을 때 입었던 옷이네. 오늘도 잘 부탁해.',
  crescent_tailcoat: '초승달 장식은 이쪽이야. 너무 눈부시진 않지?',
  wood_suit: '초록색을 입으니 가게 화분이랑 한 팀 같네.',
  blossom_haori: '벚꽃이 지고 나서도 이 색은 남아 있겠네.',
  rain_coat: '비가 그쳤어. 손님 우산부터 말려 둘까?',
  summer_linen: '가벼워서 좋다. 창가 자리는 내가 확인할게.',
  moonstone_robe: '작은 돌들이 모이니 이런 빛이 되네. 조심해서 입을게.',
  winter_coat: '오늘은 따뜻한 차가 먼저겠네. 목깃도 잘 여몄어.',
  apron_spring: '(앞치마 주머니가 넉넉하네. 영수증 수납 별 다섯.)',
  garden_apron: '(흙 묻어도 괜찮은 옷! 농장 출근 준비 별 다섯.)',
});
export function outfitLine(who, id, stage = 'calm', action = 'wear') {
  const base = OUTFIT_LINES[id] || (who === 'neo' ? '작은 장식도 분위기를 바꾸네.' : '이 옷으로 오늘도 함께할게. 움직이기 편해서 좋네.');
  if (who !== 'neo') return base;
  if (action === 'preview') return '잠깐 입어 볼게. 이쪽 모습은 어때?';
  if (action === 'unlock') return `새 옷이네. ${base}`;
  if (stage === 'limit') return `옷은 잘 맞네. 지금은 조금 쉬었다가 이야기하자.`;
  if (stage === 'tired') return `${base} 잠깐 앉아서 소매만 정리할게.`;
  return base;
}
