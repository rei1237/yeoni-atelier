// 무한 생존: 필드 수집과 생존 보너스를 따로 보여 주고 정산 원장으로 한 번만 지급한다.
export function survivalReward(hunt) {
  const seconds = Math.max(0, Math.floor((hunt.elapsedMs || 0) / 1000));
  const depth = Math.max(1, hunt.depth || 1);
  const moonstone = Math.floor(seconds / 30) * (4 + depth);
  const harvests = Math.floor(seconds / 60);
  const ingredients = ['tea','milk','flour','bean','sugar','night_dew'];
  const items = {};
  for(let i=0;i<ingredients.length;i++) {
    const n = Math.floor((harvests + ingredients.length - 1 - i) / ingredients.length) * 2;
    if(n) items[ingredients[i]] = n;
  }
  const rare=[['moon_lotus',20],['dream_honey',30],['star_leaf',45],['gold_bark',60],['white_lotus',75],['heukwol_grain',85]];
  for(const [id,stage]of rare)if(depth>=stage && seconds>=120)items[id]=Math.floor(seconds/120);
  return { moonstone, items };
}
