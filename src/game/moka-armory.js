// 게임 내 전용 월정석. 실제 Code Destiny 결제·잔액과 연결하지 않는다. 수치는 TEMP.
import {recordYunTrade} from './yun-quest.js';
import { emit } from './state.js';
import { perkTier } from '../data/bonds.js';
import { workShop } from './bonds.js';
import { placeLock } from './unlocks.js';
import { TEMP } from '../config/balance.temp.js';
import { WEAPONS, PASSIVES, WEAPON_MAX_LV, PASSIVE_MAX_LV } from '../data/hunt-kit.js';
const SK = TEMP.HUNT_SKILLS;
export const HUNTERS = ['neo', 'seohanbi'];
// 공방 강화·상한 해방은 월정석, 나머지 공방 물품과 모카 보급품은 골드를 사용한다.
export const UPGRADES = Object.freeze({
  power: { name:'무기 연마', base:45, step:12, value:.045, detail:'피해 배율 +4.5%p' },
  vitality: { name:'수호 부적', base:35, step:10, value:7, detail:'최대 체력 +7' },
  stride: { name:'달빛 발걸음', base:40, step:10, value:.015, detail:'이동 속도 +1.5%p · 최대 +60%p' },
});
export const SUPPLIES = Object.freeze({
  bomb:{name:'달빛 폭탄',cost:1200,tier:0,shop:'gear',icon:'tarot',limit:1,detail:'주변 적에게 피해 200 · 최대 보유 1개 · 사용 후 재구매 가능 (TEMP)'},
  tonic:{name:'모카의 회복 수프', cost:36, tier:0, icon:'heal', detail:'최대 체력의 35% 회복 · 사냥터의 구운 생선은 드물어요', limit:3},
  magnet:{name:'달빛 질주 향', cost:60, tier:1, icon:'whisker', detail:'8초 동안 이동 속도 +25%'},
  shield:{name:'검은 밤의 방패', cost:90, tier:2, icon:'hat', detail:'8초 동안 접촉 피해 방지'},
  nova:{name:'모카의 비밀 향신료', cost:130, tier:3, icon:'tarot', detail:'주변 적에게 현재 공격력 기준 큰 피해'},
});
export const supplyPrice = item => ({currency:'gold', amount:item.shop==='gear' ? item.cost : item.cost * TEMP.MOONSTONE_GOLD});
export function armory(state) { return state.armory || { upgrades:{}, supplies:{}, skills:{} }; }
// ── 기술: 0 = 못 배움, 1 이상 = 배움(옛 저장의 기술별 해방 단계는 숫자 그대로 남는다).
// 10-29 공방 연구(armory.tech): 무기 상한(forge)·보조 상한(charm)은 배운 기술 모두에 공용, 진화 비전(evo)은 무기마다 따로 연다
export const SKILL_IDS = [...Object.keys(WEAPONS), ...Object.keys(PASSIVES)];
export const skillKind = id => WEAPONS[id] ? 'weapon' : PASSIVES[id] ? 'passive' : null;
export const skillMaxRank = id => skillKind(id) === 'weapon' ? WEAPON_MAX_LV - 1 : skillKind(id) ? 3 : 0; // 옛 기술별 해방 단계(이전 저장 계산용)
const CAP_MAX_TIER = SK.CAP_COST.length;
export const TECH_LINES = Object.freeze({
  forge: { name:'무기 상한 해방', icon:'tech_forge', detail:'배운 무기 모두가 사냥터에서 한 단계 더 자라요' },
  charm: { name:'보조 상한 해방', icon:'tech_charm', detail:'배운 보조 능력 모두가 사냥터에서 한 단계 더 자라요' },
  evo: { name:'진화 비전', icon:'tech_evo', detail:'무기마다 따로 연구해요 · 연구한 무기만 Lv 최대와 짝 보조 능력으로 진화해요' },
});
export const techMax = line => line === 'evo' ? Object.keys(WEAPONS).length : SK.TECH[line]?.cost.length || 0;
export const techLevel = (state, line) => line === 'evo' ? Object.keys(armory(state).tech?.evo || {}).length : Math.min(techMax(line), armory(state).tech?.[line] || 0);
export const evoKnown = (state, id) => !!armory(state).tech?.evo?.[id];
export const capLevels = state => ({ weapon: Math.min(WEAPON_MAX_LV, SK.CAP_BASE.weapon + techLevel(state, 'forge')), passive: Math.min(PASSIVE_MAX_LV, SK.CAP_BASE.passive + techLevel(state, 'charm')) });
export const skillCap = (id, rank, levels) => rank <= 0 || !skillKind(id) ? 0 : levels[skillKind(id)];
export const skillRank = (state, id) => armory(state).skills?.[id] || 0;
export const skillCost = id => SK.LEARN[id] ?? Infinity;
// 다음 연구 단계의 값과 조건. 진화 비전은 몇 개째인지에 따라 값·도달 단계가 오른다
export function techNext(state, line, id) {
  const lv = techLevel(state, line), t = SK.TECH[line];
  if (!t || lv >= techMax(line)) return { done: true };
  const out = { cost: t.cost[lv], stage: t.stage[lv], currency: 'moonstone' };
  if (line === 'evo') {
    if (!WEAPONS[id]) return { ...out, reason: '진화를 연구할 무기를 골라 주세요' };
    if (evoKnown(state, id)) return { done: true };
    if (techLevel(state, 'forge') < techMax('forge')) return { ...out, reason: '무기 상한 해방을 끝까지 연 뒤에 연구할 수 있어요' };
    if (skillRank(state, id) <= 0) return { ...out, reason: '먼저 이 무기를 배워 주세요' };
  }
  if ((state.hunter?.maxStage || 1) < out.stage) return { ...out, reason: `사냥터 ${out.stage}단계에 닿으면 연구할 수 있어요` };
  return out;
}
// 공용 상한 이전 저장: 기술별로 풀어 둔 가장 높은 상한만큼을 공용 단계로 준다(빼앗지 않음)
export function legacyCapTier(skills = {}) {
  let tier = 0;
  for (const [id, r] of Object.entries(skills)) if (r > 0 && skillKind(id)) { const old = skillKind(id) === 'weapon' ? r + 1 : r, base = SK.CAP_BASE[skillKind(id)]; tier = Math.max(tier, old - base); }
  return Math.min(CAP_MAX_TIER, tier);
}
// 10-29 공방 연구 이전 저장: 옛 공용 상한 단계만큼 무기·보조 상한을 열고, 2단계(진화 허용)였다면 배운 무기·이미 진화한 무기의 진화 비전을 준다(빼앗지 않음, 낸 월정석은 연구로 이어진다)
export function legacyTech(data) {
  const a = data.armory || {}, t = a.capTier ?? legacyCapTier(a.skills), evo = {};
  if (t >= CAP_MAX_TIER) for (const id of Object.keys(WEAPONS)) if ((a.skills?.[id] || 0) > 0) evo[id] = 1;
  for (const id of Object.keys(data.huntCodex?.evolved || {})) if (WEAPONS[id]) evo[id] = 1;
  for (const b of [...Object.values(data.hunter?.builds || {}), data.hunt].filter(Boolean)) for (const wp of b.weapons || []) if (wp.evo && WEAPONS[wp.id]) evo[wp.id] = 1;
  return { forge: Math.min(techMax('forge'), t), charm: Math.min(techMax('charm'), t), evo };
}
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
export function upgradeLevel(state, who, id) { const u=armory(state).upgrades?.[who]||{}; return id==='stride'?(u.stride||0)+(u.magnet||0):(u[id]||0); }
export function upgradeCost(state, who, id) { const d=UPGRADES[id], n=upgradeLevel(state,who,id); return d ? Math.ceil(d.base+d.step*n+Math.pow(n,1.18)) : Infinity; }
export function enhancementBonus(state,who) { return { dmg:upgradeLevel(state,who,'power')*.045, hp:upgradeLevel(state,who,'vitality')*7, magnet:0, speed:Math.min(.6,upgradeLevel(state,who,'stride')*.015) }; } // 기존 수집기 단계는 발걸음으로 전환
// 강화는 윤달의 무기 공방, 소모품은 모카 식재료점 소관이다(저장 키 armory는 호환을 위해 유지).
function check(state,where) { return state.mode==='prep' && !state.interior.draft ? {ok:true} : {ok:false,reason:`영업 준비 중에 ${where}을 이용해 주세요`}; }
function ensure(state) { state.armory ||= {upgrades:{},supplies:{}}; state.armory.upgrades ||= {}; state.armory.supplies ||= {}; state.armory.skills ||= startSkills(); state.armory.tech ||= {forge:0,charm:0,evo:{}}; state.armory.tech.evo ||= {}; return state.armory; }
// 이야기 보상: 물품 n개(보유 한도까지), 윤달의 첫 강화 무료 1회. 지급 여부는 호출하는 쪽이 원장으로 한 번만 정한다.
export function giftSupply(state,id,n=1){const a=ensure(state),lim=SUPPLIES[id]?.limit||Infinity;a.supplies[id]=Math.min(lim,(a.supplies[id]||0)+n);return a.supplies[id];}
export function giftFreeEnhance(state){const a=ensure(state);a.freeEnhance=(a.freeEnhance||0)+1;}
export function enhance(state,who,id) {
  const chk=check(state,'윤달의 무기 공방'); if(!chk.ok)return chk;
  const lock=placeLock(state,'gear'); if(lock)return {ok:false,reason:lock};
  if(!HUNTERS.includes(who) || !state.roster[who] || !UPGRADES[id])return {ok:false,reason:'함께하는 사냥꾼과 강화 항목을 골라 주세요'};
  if(id==='stride' && upgradeLevel(state,who,id)>=40)return {ok:false,reason:'달빛 발걸음은 최대 단계예요'};
  const free=(armory(state).freeEnhance||0)>0,cost=free?0:upgradeCost(state,who,id); if(!Number.isSafeInteger(cost)||state.moonstone<cost)return {ok:false,reason:`월정석 ${cost}개가 필요해요`};
  const a=ensure(state), n=upgradeLevel(state,who,id); if(free)a.freeEnhance-=1; if(!Number.isSafeInteger(n+1))return {ok:false,reason:'저장할 수 있는 수치 범위를 넘었습니다'};
  state.moonstone-=cost; const upgrades=(a.upgrades[who] ||= {}); upgrades[id]=(upgrades[id]||0)+1;
  state.stats.workshopEnhances=(state.stats.workshopEnhances||0)+1;recordYunTrade(state,0,cost); emit('armoryUpgrade',{who,id,level:n+1,cost}); return {ok:true,cost,level:n+1};
}
// 기술 배우기(armory.learn)와 공방 연구(armory.tech). 사냥꾼 둘이 함께 쓴다
export function learnSkill(state,id) {
  const chk=check(state,'윤달의 무기 공방'); if(!chk.ok)return chk;
  const lock=placeLock(state,'gear'); if(lock)return {ok:false,reason:lock};
  if(!skillKind(id))return {ok:false,reason:'없는 기술입니다'};
  const a=ensure(state);
  if(skillRank(state,id)>0)return {ok:false,reason:'이미 배운 기술이에요 · 상한은 공방 연구로 올려요'};
  const cost=skillCost(id); if(state.gold<cost)return {ok:false,reason:`골드 ${cost.toLocaleString()}G가 필요해요`};
  state.gold-=cost; a.skills[id]=1;
  const cap=skillCap(id,1,capLevels(state));
  recordYunTrade(state,cost,0); emit('skillLearned',{id,name:(WEAPONS[id]||PASSIVES[id]).name,rank:1,cost,cap}); return {ok:true,cost,rank:1};
}
export function researchTech(state,line,id) {
  const chk=check(state,'윤달의 무기 공방'); if(!chk.ok)return chk;
  const lock=placeLock(state,'gear'); if(lock)return {ok:false,reason:lock};
  if(!TECH_LINES[line])return {ok:false,reason:'없는 연구입니다'};
  const next=techNext(state,line,id); if(next.done)return {ok:false,reason:line==='evo'&&WEAPONS[id]?'이미 연구한 진화예요':`${TECH_LINES[line].name}을 끝까지 연구했어요`};
  if(next.reason)return {ok:false,reason:next.reason};
  if(state[next.currency]<next.cost)return {ok:false,reason:next.currency==='gold'?`골드 ${next.cost.toLocaleString()}G가 필요해요`:`월정석 ${next.cost}개가 필요해요`};
  const a=ensure(state); state[next.currency]-=next.cost;
  if(line==='evo')a.tech.evo[id]=1; else a.tech[line]=techLevel(state,line)+1;
  const level=techLevel(state,line);
  recordYunTrade(state,next.currency==='gold'?next.cost:0,next.currency==='moonstone'?next.cost:0); emit('techResearched',{line,id:line==='evo'?id:null,name:line==='evo'?WEAPONS[id].evo.name:TECH_LINES[line].name,level,max:techMax(line),cost:next.cost,...capLevels(state)}); return {ok:true,cost:next.cost,level};
}
export function buySupply(state,id) {
  const item=SUPPLIES[id],chk=check(state,item?.shop==='gear'?'윤달의 무기 공방':'모카 식재료점');if(!chk.ok)return chk;
  if(item?.shop==='gear'){const lock=placeLock(state,'gear');if(lock)return {ok:false,reason:lock};}
  if(!item || perkTier(state,'moka')<item.tier)return {ok:false,reason:'모카와 인연을 쌓으면 새 물품이 열려요'};
  if(item?.limit && (armory(state).supplies?.[id]||0)>=item.limit)return {ok:false,reason:id==='tonic'?'회복 수프는 3개까지만 챙길 수 있어요':`${item.name} 최대 보유 ${item.limit}개 · 사용한 뒤 다시 구매할 수 있어요`};
  const price=supplyPrice(item);
  if((state[price.currency]||0)<price.amount)return {ok:false,reason:price.currency==='gold'?`골드 ${price.amount.toLocaleString()}G가 필요해요`:`월정석 ${price.amount}개가 필요해요`};
  const a=ensure(state);state[price.currency]-=price.amount;a.supplies[id]=(a.supplies[id]||0)+1;if(item.shop==='gear')recordYunTrade(state,price.amount,0);workShop(state);emit('supplyBought',{id});return {ok:true};
}
