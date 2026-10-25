// 게임 내 전용 월정석. 실제 Code Destiny 결제·잔액과 연결하지 않는다. 수치는 TEMP.
import { emit } from './state.js';
import { bondTier } from '../data/bonds.js';
import { workShop } from './bonds.js';
export const HUNTERS = ['neo', 'seohanbi'];
export const UPGRADES = Object.freeze({
  power: { name:'무기 연마', base:45, step:4, value:.045, detail:'피해 배율 +4.5%p' },
  vitality: { name:'수호 부적', base:35, step:3, value:7, detail:'최대 체력 +7' },
  magnet: { name:'월광 수집기', base:40, step:3, value:.035, detail:'줍기 범위 +3.5%p' },
});
export const SUPPLIES = Object.freeze({
  tonic:{name:'모카의 회복 수프', cost:18, tier:0, icon:'heal', detail:'최대 체력의 35% 회복'},
  magnet:{name:'달빛 수집 향', cost:30, tier:1, icon:'whisker', detail:'필드에 떨어진 모든 보상을 끌어오기'},
  shield:{name:'검은 밤의 방패', cost:45, tier:2, icon:'hat', detail:'8초 동안 접촉 피해 방지'},
  nova:{name:'모카의 비밀 향신료', cost:65, tier:3, icon:'tarot', detail:'주변 적에게 현재 공격력 기준 큰 피해'},
});
export function armory(state) { return state.armory || { upgrades:{}, supplies:{} }; }
export function upgradeLevel(state, who, id) { return armory(state).upgrades?.[who]?.[id] || 0; }
export function upgradeCost(state, who, id) { const d=UPGRADES[id], n=upgradeLevel(state,who,id); return d ? Math.ceil(d.base+d.step*n+Math.pow(n,1.18)) : Infinity; }
export function enhancementBonus(state,who) { return { dmg:upgradeLevel(state,who,'power')*.045, hp:upgradeLevel(state,who,'vitality')*7, magnet:upgradeLevel(state,who,'magnet')*.035 }; }
function check(state) { return state.mode==='prep' && !state.interior.draft ? {ok:true} : {ok:false,reason:'영업 준비 중에 모카 상점을 이용해 주세요'}; }
function ensure(state) { state.armory ||= {upgrades:{},supplies:{}}; state.armory.upgrades ||= {}; state.armory.supplies ||= {}; return state.armory; }
export function enhance(state,who,id) {
  const chk=check(state); if(!chk.ok)return chk;
  if(!HUNTERS.includes(who) || !state.roster[who] || !UPGRADES[id])return {ok:false,reason:'함께하는 사냥꾼과 강화 항목을 골라 주세요'};
  const cost=upgradeCost(state,who,id); if(!Number.isSafeInteger(cost)||state.moonstone<cost)return {ok:false,reason:`월정석 ${cost}개가 필요해요`};
  const a=ensure(state), n=upgradeLevel(state,who,id); if(!Number.isSafeInteger(n+1))return {ok:false,reason:'저장할 수 있는 수치 범위를 넘었습니다'};
  state.moonstone-=cost; (a.upgrades[who] ||= {})[id]=n+1;
  workShop(state); emit('armoryUpgrade',{who,id,level:n+1,cost}); return {ok:true,cost,level:n+1};
}
export function buySupply(state,id) {
  const chk=check(state);if(!chk.ok)return chk;const item=SUPPLIES[id];
  if(!item || bondTier(state.affinity.moka||0)<item.tier)return {ok:false,reason:'모카와 인연을 쌓으면 새 물품이 열려요'};
  if(state.moonstone<item.cost)return {ok:false,reason:`월정석 ${item.cost}개가 필요해요`};
  const a=ensure(state);state.moonstone-=item.cost;a.supplies[id]=(a.supplies[id]||0)+1;workShop(state);emit('supplyBought',{id});return {ok:true};
}
