// 영냥이 장비(윤달의 무기 공방). 게임 오리지널 임시 데이터 — 원작 설정이 아니다.
// 장비는 사냥 능력치만 바꾸고 영냥이 외형은 바꾸지 않는다. 효과·가격은 모두 임시값(balance.temp.js 성격).
// fx: dmg = 모든 무기 피해 +비율, hp = 최대 HP +값, speed = 이동 속도 +비율, magnet = 줍기 범위 +비율
// cost: gold 또는 moonstone 중 하나

export const GEAR_SLOTS = Object.freeze({ weapon: '무기', armor: '방어구', charm: '장신구' });

export const GEAR = Object.freeze({
  claw_glove:     { id: 'claw_glove',     slot: 'weapon', name: '고양이 발톱 장갑',   desc: '모든 무기 피해 +15%',            fx: { dmg: 0.15 },               cost: { gold: 900 } },
  crescent_wand:  { id: 'crescent_wand',  slot: 'weapon', name: '초승달 방울 지팡이', desc: '모든 무기 피해 +35%',            fx: { dmg: 0.35 },               cost: { gold: 2500 } },
  scale_vest:     { id: 'scale_vest',     slot: 'armor',  name: '생선 비늘 조끼',     desc: '최대 HP +30',                    fx: { hp: 30 },                  cost: { gold: 800 } },
  fluff_cape:     { id: 'fluff_cape',     slot: 'armor',  name: '솜뭉치 망토',        desc: '최대 HP +60 · 이동 속도 +5%',    fx: { hp: 60, speed: 0.05 },     cost: { gold: 2200 } },
  fishbone_charm: { id: 'fishbone_charm', slot: 'charm',  name: '생선뼈 부적',        desc: '줍기 범위 +40%',                 fx: { magnet: 0.4 },             cost: { gold: 600 } },
  churu_magnet:   { id: 'churu_magnet',   slot: 'charm',  name: '자석 츄르',          desc: '줍기 범위 +80% · 이동 속도 +8%', fx: { magnet: 0.8, speed: 0.08 }, cost: { gold: 2000 } },
});

export const GEAR_ORDER = Object.freeze(['claw_glove', 'crescent_wand', 'scale_vest', 'fluff_cape', 'fishbone_charm', 'churu_magnet']);

// 장착한 장비 효과의 합(배율은 1 + 합)
export function gearBonus(equipped = {}) {
  const b = { dmg: 1, hp: 0, speed: 1, magnet: 1 };
  for (const id of Object.values(equipped)) {
    const fx = GEAR[id]?.fx;
    if (!fx) continue;
    b.dmg += fx.dmg || 0; b.hp += fx.hp || 0; b.speed += fx.speed || 0; b.magnet += fx.magnet || 0;
  }
  return b;
}
