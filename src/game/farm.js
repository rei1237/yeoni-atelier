import { CROPS, FARM, farmLevel, farmSeason, farmWeather, maxFarmEnergy } from '../data/farm.js';
export function farmEnergyCheck(state,cost=1){return state.farm.energy>=cost?{ok:true}:{ok:false,reason:`농장 행동력이 부족해요 (${state.farm.energy}/${maxFarmEnergy(state.farm)}) · 영업을 마치면 다시 채워져요`};}
export function spendFarmEnergy(state,cost=1){state.farm.energy-=cost;}
import { emit, nextId } from './state.js';

const fail = reason => ({ ok: false, reason });
export function farmCheck(state) {
  if (state.mode !== 'prep') return fail('연이가 가게를 비울 수 있는 영업 준비 중에 농장에 가요');
  if (state.interior.draft) return fail('인테리어 편집을 먼저 마쳐 주세요');
  return { ok: true };
}
export function plantCheck(state, cropId, index) {
  const chk = farmCheck(state); if (!chk.ok) return chk;
  const crop = CROPS[cropId];
  if (!crop || !Number.isInteger(index) || index < 0 || index >= state.farm.plots.length) return fail('작물과 밭을 골라 주세요');
  if (state.farm.plots[index]) return fail('이미 작물이 자라는 밭이에요');
  if (farmLevel(state.farm) < crop.level) return fail(`농장 레벨 ${crop.level}에 열려요`);
  if (!state.farm.greenhouse && !crop.seasons.includes(farmSeason(state.day))) return fail('이 계절에는 온실이 필요해요');
  if (state.gold < crop.seedCost) return fail(`씨앗값 ${crop.seedCost}G가 필요해요`);
  if (!farmEnergyCheck(state).ok) return farmEnergyCheck(state);
  return { ok: true };
}
export function plant(state, cropId, index, by = '연이') {
  const chk = plantCheck(state, cropId, index); if (!chk.ok) return chk;
  state.gold -= CROPS[cropId].seedCost;
  state.farm.plots[index] = { id: nextId(state, 'crop'), cropId, growth: 0, careTurns: 0, wateredDay: null, caredDay: null };
  emit('farmAction', { kind:'plant',index,cropId,text: `${by}가 ${CROPS[cropId].name} 씨앗을 심었어요` });
  return { ok: true };
}
export function care(state, index, kind, by = '연이') {
  const chk = farmCheck(state); if (!chk.ok) return chk;
  const p = Number.isInteger(index) ? state.farm.plots[index] : null;
  if (!p || !['water', 'tend'].includes(kind)) return fail('돌볼 작물이 없어요');
  if (p.growth >= CROPS[p.cropId].turns) return fail('다 자랐어요. 수확해 주세요');
  const key = kind === 'water' ? 'wateredDay' : 'caredDay';
  if (p[key] === state.day || (kind === 'water' && farmWeather(state.farm, state.day) === 'rain')) return fail('이번 순에는 이미 물이나 손길이 충분해요');
  p[key] = state.day;
  emit('farmAction', { kind,index,cropId:p.cropId,text: kind === 'water' ? `${by}가 물을 주었어요` : `${by}가 잡초를 뽑고 흙을 덮었어요` });
  return { ok: true };
}
export function careAll(state) {
  const chk=farmCheck(state);if(!chk.ok)return chk;
  if(farmLevel(state.farm)<3)return fail('농장 레벨 3부터 한 번에 돌볼 수 있어요');
  const tasks=[];
  state.farm.plots.forEach((p,i)=>{if(!p||p.growth>=CROPS[p.cropId].turns)return; if(p.wateredDay!==state.day&&farmWeather(state.farm,state.day)!=='rain')tasks.push([i,'water']);if(p.caredDay!==state.day)tasks.push([i,'tend']);});
  if(!tasks.length)return fail('모든 밭을 돌봤어요');
  const ap=farmEnergyCheck(state,tasks.length);if(!ap.ok)return ap;
  for(const [i,kind] of tasks)care(state,i,kind);
  spendFarmEnergy(state,tasks.length);return {ok:true,count:tasks.length};
}
export function farmForecast(state,p){
 const c=CROPS[p.cropId],wet=p.wateredDay===state.day||farmWeather(state.farm,state.day)==='rain',tended=p.caredDay===state.day;
 const harsh=['dry','frost'].includes(farmWeather(state.farm,state.day))&&!state.farm.greenhouse;
 const growth=(harsh&&!tended?.1:.25)+(wet?.75:0)+(tended?1:0);
 return {growth,remaining:Math.max(0,Math.ceil((c.turns-p.growth)/growth)),qty:c.yield+Math.min(3,(p.careTurns||0)+(tended?1:0))+Math.floor((farmLevel(state.farm)-1)/FARM.levelYieldEvery)};
}
// 결산을 닫을 때 직전 순의 날씨와 돌보기로 성장한다. 누락한 순·오프라인 시간은 소급 지급하지 않는다.
export function advanceFarm(state) {
  const f = state.farm;
  if (f.lastAdvancedDay >= state.day) return;
  const previous=state.day-1;
  for(const p of f.plots){
   if(!p||p.growth>=CROPS[p.cropId].turns)continue;
   const forecast=farmForecast({...state,day:previous},p);
   p.growth=Math.min(CROPS[p.cropId].turns,p.growth+forecast.growth);
   if(p.caredDay===previous)p.careTurns++;
  }
  f.lastAdvancedDay = state.day;
  f.energy = maxFarmEnergy(f);
}
export function harvest(state, index, cropInstanceId) {
  const chk = farmCheck(state); if (!chk.ok) return chk;
  const f = state.farm, p = Number.isInteger(index) ? f.plots[index] : null;
  if (!p || p.id !== cropInstanceId) return fail('이미 수확했거나 다른 작물이에요');
  const crop = CROPS[p.cropId];
  if (p.growth < crop.turns) return fail('아직 자라는 중이에요');
  const key = `farm:${p.id}`;
  if (state.ledger.rewards[key]) return fail('이미 수확한 작물이에요');
  const level = farmLevel(f);
  const qty = crop.yield + Math.min(3,p.careTurns||0) + Math.floor((level - 1) / FARM.levelYieldEvery);
  state.ledger.rewards[key] = { ingredient: crop.ingredient, qty, xp: crop.xp };
  state.stock[crop.ingredient] = (state.stock[crop.ingredient] || 0) + qty;
  if (crop.recipe) state.learned[crop.recipe] = true;
  if (crop.ingredient === 'night_dew') state.stats.nightDewObtained += qty;
  f.xp += crop.xp; f.harvests++; f.plots[index] = null;
  emit('farmAction', { kind:'harvest',index,cropId:p.cropId,text: `${crop.name} 수확 · 요리 재료 ${qty}개${farmLevel(f) > level ? ` · 농장 레벨 ${farmLevel(f)}!` : ''}` });
  return { ok: true, ingredient: crop.ingredient, qty, xp: crop.xp };
}
export function expansion(state, greenhouse = false) {
  const chk = farmCheck(state); if (!chk.ok) return chk;
  const f = state.farm, level = farmLevel(f);
  const needLevel = greenhouse ? FARM.greenhouseLevel : 2 + (f.plots.length - FARM.startPlots) / FARM.plotStep;
  const price = greenhouse ? FARM.greenhouseCost : FARM.expandBase * (1 + (f.plots.length - FARM.startPlots) / FARM.plotStep);
  if (greenhouse ? f.greenhouse : f.plots.length >= FARM.maxPlots) return fail('이미 모두 확장했어요');
  if (level < needLevel) return fail(`농장 레벨 ${needLevel}에 열려요`);
  if (state.gold < price) return fail(`${price}G가 필요해요`);
  state.gold -= price;
  if (greenhouse) f.greenhouse = true; else f.plots.push(...Array(FARM.plotStep).fill(null));
  return { ok: true };
}
