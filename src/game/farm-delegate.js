// 네오에게 농장 맡기기(네오 ♥3 + 같은 단계 인연 이야기 = permissions 'farm'). 연이가 누르는 것과 같은 농장 함수로
// 다 자란 밭 수확 → 같은 작물 다시 심기(씨앗값) → 자라는 밭 물·돌봄 순서로 하고, 한 걸음마다 농장 행동력 1을 쓴다.
// 순마다 한 번(ledger.rewards['farm:auto:<day>']). 같은 순에 네오가 사냥을 다녀왔으면 거절하고, 맡기면 그 순 사냥을 거절한다.
// 오프라인 생산은 없다: 이 명령(또는 농장 맡기기를 켠 채 영업 시작)이 있어야만 일한다.
import { CROPS, farmWeather } from '../data/farm.js';
import { abilityCheck } from './permissions.js';
import { stressOf, STRESS_MAX } from './stress.js';
import { emit } from './state.js';
import { farmCheck, farmEnergyCheck, spendFarmEnergy, harvest, plant, plantCheck, care } from './farm.js';

const key = state => `farm:auto:${state.day}`;

export function delegateCheck(state) {
  const chk = farmCheck(state); if (!chk.ok) return chk;
  const perm = abilityCheck(state, 'farm'); if (!perm.ok) return perm;
  if (state.ledger.rewards[key(state)]) return { ok: false, reason: '이번 순 농장은 이미 네오에게 맡겼어요' };
  if (state.ap.neoTask === 'hunt') return { ok: false, reason: '네오는 이번 순에 사냥을 다녀왔어요' };
  if (state.people.neo?.activity !== 'idle') return { ok: false, reason: '네오가 다른 일을 하는 중이에요' };
  if (stressOf(state, 'neo') >= STRESS_MAX) return { ok: false, reason: '네오가 너무 지쳤어요 · 루나의 쉼터에서 쉬게 해 주세요' };
  if (!farmEnergyCheck(state).ok) return farmEnergyCheck(state);
  return { ok: true };
}

export function delegateFarm(state) {
  const chk = delegateCheck(state); if (!chk.ok) return chk;
  const done = { harvested: 0, planted: 0, cared: 0, stopped: null };
  const step = () => { if (!farmEnergyCheck(state).ok) { done.stopped = '농장 행동력이 떨어졌어요'; return false; } return true; };
  const plots = state.farm.plots;
  for (let i = 0; i < plots.length && !done.stopped; i++) {
    const p = plots[i];
    if (!p || p.growth < CROPS[p.cropId].turns || !step()) continue;
    if (!harvest(state, i, p.id).ok) continue;
    spendFarmEnergy(state); done.harvested++;
    if (plantCheck(state, p.cropId, i).ok && plant(state, p.cropId, i, '네오').ok) { spendFarmEnergy(state); done.planted++; }
    else if (state.gold < CROPS[p.cropId].seedCost) done.stopped ??= '씨앗값이 모자라 다시 심지 못했어요';
  }
  const rain = farmWeather(state.farm, state.day) === 'rain';
  for (let i = 0; i < plots.length && !done.stopped; i++) {
    const p = plots[i];
    if (!p || p.growth >= CROPS[p.cropId].turns) continue;
    for (const kind of ['water', 'tend']) {
      if (kind === 'water' && (rain || p.wateredDay === state.day)) continue;
      if (kind === 'tend' && p.caredDay === state.day) continue;
      if (!step()) break;
      if (care(state, i, kind, '네오').ok) { spendFarmEnergy(state); done.cared++; }
    }
  }
  if (!done.harvested && !done.planted && !done.cared) return { ok: false, reason: done.stopped || '지금은 맡길 밭일이 없어요' };
  state.ledger.rewards[key(state)] = { ...done };
  state.ap.neoTask = 'farm';
  emit('farmDelegated', { ...done });
  return { ok: true, ...done };
}
