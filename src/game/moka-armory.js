// 게임 내 전용 월정석. 실제 Code Destiny 결제·잔액과 연결하지 않는다. 수치는 TEMP.
import {recordYunTrade} from './yun-quest.js';
import { emit } from './state.js';
import { bondTier } from '../data/bonds.js';
import { workShop } from './bonds.js';
import { placeLock } from './unlocks.js';
import { TEMP } from '../config/balance.temp.js';
import { WEAPONS, PASSIVES, WEAPON_MAX_LV } from '../data/hunt-kit.js';
const SK = TEMP.HUNT_SKILLS;
export const HUNTERS = ['neo', 'seohanbi'];
// 강화·소모품 월정석 값은 임시(TEMP). 10-26: 단계 사냥 월정석 수급에 맞춰 두 배로 올림
export const UPGRADES = Object.freeze({
  power: { name:'무기 연마', base:320, step:60, value:.045, detail:'피해 배율 +4.5%p' },
  vitality: { name:'수호 부적', base:260, step:50, value:7, detail:'최대 체력 +7' },
  magnet: { name:'월광 수집기', base:280, step:50, value:.035, detail:'줍기 범위 +3.5%p' },
});
export const SUPPLIES = Object.freeze({
  bomb:{name:'달빛 폭탄',cost:130,tier:0,shop:'gear',icon:'tarot',limit:1,detail:'주변 적에게 피해 200 · 최대 보유 1개 · 사용 후 재구매 가능 (TEMP)'},
  tonic:{name:'모카의 회복 수프', cost:36, tier:0, icon:'heal', detail:'최대 체력의 35% 회복 · 사냥터의 구운 생선은 드물어요', limit:3},
  magnet:{name:'달빛 수집 향', cost:60, tier:1, icon:'whisker', detail:'필드에 떨어진 모든 보상을 끌어오기'},
  shield:{name:'검은 밤의 방패', cost:90, tier:2, icon:'hat', detail:'8초 동안 접촉 피해 방지'},
  nova:{name:'모카의 비밀 향신료', cost:130, tier:3, icon:'tarot', detail:'주변 적에게 현재 공격력 기준 큰 피해'},
});
export function armory(state) { return state.armory || { upgrades:{}, supplies:{}, skills:{} }; }
// ── 기술 단련: 0 = 못 배움. 무기 r단계 → Lv r+1까지(4단계면 Lv5·진화), 보조 r단계 → Lv r까지
export const SKILL_IDS = [...Object.keys(WEAPONS), ...Object.keys(PASSIVES)];
export const skillKind = id => WEAPONS[id] ? 'weapon' : PASSIVES[id] ? 'passive' : null;
export const skillMaxRank = id => skillKind(id) === 'weapon' ? WEAPON_MAX_LV - 1 : skillKind(id) ? 3 : 0;
export const skillCap = (id, rank) => rank <= 0 ? 0 : skillKind(id) === 'weapon' ? rank + 1 : rank;
export const skillRank = (state, id) => armory(state).skills?.[id] || 0;
export function skillCost(id, rank) { return Math.round((SK.LEARN[id] || SK.TRAIN_BASE) * (SK.TRAIN_MULT[rank - 1] ?? Infinity)); }
export const startSkills = () => Object.fromEntries(SK.START.map(id => [id, 1]));
// 기술 단련 이전 저장: 기본 4종 + 저장 빌드·진행 중 사냥에 이미 있는 레벨만큼 단련한 것으로 본다(빼앗지 않음)
export function legacySkillRanks(data) {
  const out = startSkills(), up = (id, r) => { if (skillKind(id)) out[id] = Math.min(skillMaxRank(id), Math.max(out[id] || 0, r)); };
  for (const b of [...Object.values(data.hunter?.builds || {}), data.hunt].filter(Boolean)) {
    for (const wp of b.weapons || []) up(wp.id, wp.evo ? WEAPON_MAX_LV - 1 : Math.max(1, wp.level - 1));
    for (const [id, lv] of Object.entries(b.passives || {})) up(id, lv);
  }
  return out;
}
export function upgradeLevel(state, who, id) { return armory(state).upgrades?.[who]?.[id] || 0; }
export function upgradeCost(state, who, id) { const d=UPGRADES[id], n=upgradeLevel(state,who,id); return d ? Math.ceil(d.base+d.step*n+Math.pow(n,1.18)) : Infinity; }
export function enhancementBonus(state,who) { return { dmg:upgradeLevel(state,who,'power')*.045, hp:upgradeLevel(state,who,'vitality')*7, magnet:upgradeLevel(state,who,'magnet')*.035 }; }
// 강화는 윤달의 무기 공방, 소모품은 모카 식재료점 소관이다(저장 키 armory는 호환을 위해 유지).
function check(state,where) { return state.mode==='prep' && !state.interior.draft ? {ok:true} : {ok:false,reason:`영업 준비 중에 ${where}을 이용해 주세요`}; }
function ensure(state) { state.armory ||= {upgrades:{},supplies:{}}; state.armory.upgrades ||= {}; state.armory.supplies ||= {}; state.armory.skills ||= startSkills(); return state.armory; }
// 이야기 보상: 물품 n개(보유 한도까지), 윤달의 첫 강화 무료 1회. 지급 여부는 호출하는 쪽이 원장으로 한 번만 정한다.
export function giftSupply(state,id,n=1){const a=ensure(state),lim=SUPPLIES[id]?.limit||Infinity;a.supplies[id]=Math.min(lim,(a.supplies[id]||0)+n);return a.supplies[id];}
export function giftFreeEnhance(state){const a=ensure(state);a.freeEnhance=(a.freeEnhance||0)+1;}
export function enhance(state,who,id) {
  const chk=check(state,'윤달의 무기 공방'); if(!chk.ok)return chk;
  const lock=placeLock(state,'gear'); if(lock)return {ok:false,reason:lock};
  if(!HUNTERS.includes(who) || !state.roster[who] || !UPGRADES[id])return {ok:false,reason:'함께하는 사냥꾼과 강화 항목을 골라 주세요'};
  const free=(armory(state).freeEnhance||0)>0,cost=free?0:upgradeCost(state,who,id); if(!Number.isSafeInteger(cost)||state.moonstone<cost)return {ok:false,reason:`월정석 ${cost}개가 필요해요`};
  const a=ensure(state), n=upgradeLevel(state,who,id); if(free)a.freeEnhance-=1; if(!Number.isSafeInteger(n+1))return {ok:false,reason:'저장할 수 있는 수치 범위를 넘었습니다'};
  state.moonstone-=cost; (a.upgrades[who] ||= {})[id]=n+1;
  state.stats.workshopEnhances=(state.stats.workshopEnhances||0)+1;recordYunTrade(state,0,cost); emit('armoryUpgrade',{who,id,level:n+1,cost}); return {ok:true,cost,level:n+1};
}
// 배우기와 단련은 같은 명령(armory.learn). 사냥꾼 둘이 함께 쓴다
export function learnSkill(state,id) {
  const chk=check(state,'윤달의 무기 공방'); if(!chk.ok)return chk;
  const lock=placeLock(state,'gear'); if(lock)return {ok:false,reason:lock};
  if(!skillKind(id))return {ok:false,reason:'없는 기술입니다'};
  const a=ensure(state), rank=skillRank(state,id);
  if(rank>=skillMaxRank(id))return {ok:false,reason:'이미 끝까지 단련한 기술이에요'};
  const cost=skillCost(id,rank+1); if(state.moonstone<cost)return {ok:false,reason:`월정석 ${cost}개가 필요해요`};
  state.moonstone-=cost; a.skills[id]=rank+1;
  recordYunTrade(state,0,cost); emit('skillLearned',{id,name:(WEAPONS[id]||PASSIVES[id]).name,rank:rank+1,cost}); return {ok:true,cost,rank:rank+1};
}
export function buySupply(state,id) {
  const item=SUPPLIES[id],chk=check(state,item?.shop==='gear'?'윤달의 무기 공방':'모카 식재료점');if(!chk.ok)return chk;
  if(item?.shop==='gear'){const lock=placeLock(state,'gear');if(lock)return {ok:false,reason:lock};}
  if(!item || bondTier(state.affinity.moka||0)<item.tier)return {ok:false,reason:'모카와 인연을 쌓으면 새 물품이 열려요'};
  if(item?.limit && (armory(state).supplies?.[id]||0)>=item.limit)return {ok:false,reason:id==='tonic'?'회복 수프는 3개까지만 챙길 수 있어요':`${item.name} 최대 보유 ${item.limit}개 · 사용한 뒤 다시 구매할 수 있어요`};
  if(state.moonstone<item.cost)return {ok:false,reason:`월정석 ${item.cost}개가 필요해요`};
  const a=ensure(state);state.moonstone-=item.cost;a.supplies[id]=(a.supplies[id]||0)+1;workShop(state);emit('supplyBought',{id});return {ok:true};
}
