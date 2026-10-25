// 게임 오리지널 임시 수치. 실제 재배 기간이 아니라 한 순 단위의 짧은 농장 루프다.
export const FARM = Object.freeze({ startPlots: 4, maxPlots: 12, plotStep: 2, expandBase: 360, xpStep: 60, careBonus: 1, levelYieldEvery: 3, greenhouseLevel: 5, greenhouseCost: 1600 });
export const CROPS = Object.freeze({
  wheat: { name: '달빛 밀', ingredient: 'flour', processing: '수확하며 제분', level: 1, seasons: ['spring', 'autumn', 'winter'], turns: 1, yield: 4, seedCost: 24, xp: 18 },
  tea: { name: '별빛 찻잎', ingredient: 'tea', level: 1, seasons: ['spring', 'summer', 'autumn'], turns: 1, yield: 4, seedCost: 24, xp: 18 },
  beet: { name: '설탕무', ingredient: 'sugar', processing: '수확하며 설탕 만들기', level: 1, seasons: ['spring', 'autumn', 'winter'], turns: 1, yield: 5, seedCost: 20, xp: 18 },
  berry: { name: '연꽃 딸기', ingredient: 'berry', level: 2, seasons: ['spring', 'summer'], turns: 2, yield: 6, seedCost: 40, xp: 32, recipe: 'lotus_berry_tart' },
  rice: { name: '초승달 벼', ingredient: 'rice', processing: '수확하며 도정', level: 2, seasons: ['spring', 'summer', 'autumn'], turns: 2, yield: 7, seedCost: 44, xp: 34, recipe: 'moon_rice_bowl' },
  coffee: { name: '별밤 커피나무', ingredient: 'bean', processing: '수확하며 원두 볶기', level: 3, seasons: ['summer', 'autumn'], turns: 2, yield: 8, seedCost: 52, xp: 36 },
  pumpkin: { name: '황금 호박', ingredient: 'pumpkin', level: 3, seasons: ['summer', 'autumn'], turns: 2, yield: 7, seedCost: 48, xp: 34, recipe: 'golden_pumpkin_soup' },
  dew: { name: '밤이슬 꽃', ingredient: 'night_dew', level: 5, seasons: ['winter'], turns: 3, yield: 4, seedCost: 90, xp: 50, recipe: 'night_dew_latte' },
});
export const SEASONS = Object.freeze({ spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' });
export const WEATHER = Object.freeze({ sun: { name: '맑음', icon: '☀', hint: '물을 주면 한 단계 자라요.' }, rain: { name: '비', icon: '☂', hint: '빗물이 밭을 적셔 줘요. 잡초를 돌봐 주세요.' }, dry: { name: '건조', icon: '♨', hint: '물과 돌보기가 모두 필요해요.' }, frost: { name: '서리', icon: '❄', hint: '물을 주고 보온하면 자라요. 온실은 서리를 막아 줘요.' } });
export const farmLevel = farm => 1 + Math.floor(Math.sqrt(Math.max(0, farm.xp) / FARM.xpStep));
export const farmNextXp = farm => farmLevel(farm) ** 2 * FARM.xpStep;
export const farmSeason = day => ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][((2 + Math.floor((day - 1) / 3)) % 12)];
export function newFarm(seed = 20261025) {
  return { xp: 0, seed: seed >>> 0, greenhouse: false, lastAdvancedDay: 1, harvests: 0, plots: Array.from({ length: FARM.startPlots }, () => null) };
}
// 날씨는 날짜와 별도 농장 시드로 결정한다. 화면 열기·저장·다른 활동으로 다시 추첨되지 않는다.
export function farmWeather(farm, day) {
  let n = (farm.seed ^ Math.imul(day, 0x45d9f3b)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) >>> 0;
  const v = (n ^ (n >>> 16)) >>> 0;
  return v % 10 < 3 ? 'rain' : v % 10 < 5 ? (farmSeason(day) === 'winter' ? 'frost' : 'dry') : 'sun';
}
