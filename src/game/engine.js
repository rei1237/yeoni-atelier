// 엔진 진입점. 화면(UI)·자동 운영·테스트는 모두 dispatch(명령)와 tick(활성 시간 진행)만 쓴다.
// UI 는 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import { TEMP } from '../config/balance.temp.js';
import { withEvents } from './state.js';
import * as cafe from './cafe.js';
import * as nom from './nomination.js';
import * as shift from './shift.js';
import * as eco from './economy.js';
import * as interior from './interior.js';
import * as hunt from './hunt.js';
import * as calendar from './calendar.js';
import * as recipe from './recipe.js';
import * as town from './town.js';
import * as bonds from './bonds.js';
import * as farm from './farm.js';
import { autoStep } from './auto.js';

// 일시정지 중에도 받는 명령
const ALLOWED_WHILE_PAUSED = new Set(['resume', 'pause', 'auto.toggle', 'kitchen.toggle']);
// 영업 중에만 의미가 있는 명령
const SHIFT_ONLY = new Set(['cook', 'cook.cancelNext', 'serve', 'clean', 'nomination.accept', 'nomination.decline', 'nomination.propose', 'help.respond', 'fever.activate']);

function route(state, cmd) {
  const t = cmd?.type;
  if (state.paused && !ALLOWED_WHILE_PAUSED.has(t)) return { ok: false, reason: '일시정지 중입니다 — 계속하기를 눌러 주세요' };
  if (SHIFT_ONLY.has(t) && state.mode !== 'shift') return { ok: false, reason: '정규 영업 중에만 할 수 있습니다' };
  switch (t) {
    case 'shift.start': return shift.startShift(state);
    case 'settlement.close': return shift.closeSettlement(state);
    case 'pause':
      if (state.mode !== 'shift' && state.mode !== 'hunt') return { ok: false, reason: '진행 중인 영업·사냥이 없습니다' };
      state.paused = true; return { ok: true };
    case 'resume': state.paused = false; return { ok: true };
    case 'auto.toggle': state.auto = cmd.on ?? !state.auto; return { ok: true, auto: state.auto };
    case 'kitchen.toggle': state.autoKitchen = cmd.on ?? !state.autoKitchen; return { ok: true, autoKitchen: state.autoKitchen };

    case 'cook': return cafe.cook(state, cmd.menuId);
    case 'recipe.try': return recipe.tryCombo(state, cmd.ingredients);
    case 'cook.cancelNext': return cafe.cancelNext(state, cmd.station);
    case 'serve': return cafe.serve(state, cmd.itemId, cmd.tableNo);
    case 'clean': return cafe.requestClean(state, cmd.tableNo);

    case 'nomination.accept': return nom.accept(state, cmd.tableNo);
    case 'nomination.decline': return nom.decline(state, cmd.tableNo);
    case 'nomination.propose': return nom.propose(state, cmd.tableNo, cmd.personId);
    case 'help.respond': return nom.respondHelp(state, cmd.visitId, cmd.index, cmd.choice);
    case 'fever.activate': return nom.activateFever(state);

    case 'shop.buy': return eco.buy(state, cmd.ingredientId, cmd.qty);
    case 'farm.plant': return farm.plant(state, cmd.cropId, cmd.index);
    case 'farm.water': return farm.care(state, cmd.index, 'water');
    case 'farm.tend': return farm.care(state, cmd.index, 'tend');
    case 'farm.careAll': return farm.careAll(state);
    case 'farm.harvest': return farm.harvest(state, cmd.index, cmd.cropInstanceId);
    case 'farm.expand': return farm.expansion(state);
    case 'farm.greenhouse': return farm.expansion(state, true);
    case 'debt.repay': return eco.repay(state, cmd.amount, cmd.requestId);
    case 'quest.claim': return eco.claimQuest(state, cmd.questId);
    case 'recruit.complete': return eco.completeRecruit(state, cmd.id);
    case 'moonstone.exchange': return town.exchange(state, cmd.qty);
    case 'gear.buy': return town.buyGear(state, cmd.id);
    case 'gear.equip': return town.equipGear(state, cmd.slot, cmd.id ?? null);
    case 'expand.table': return town.buyExpansion(state);
    case 'expand.decor': return town.buyDecor(state, cmd.defId);
    case 'expand.area': return town.buyArea(state, cmd.id);
    case 'outfit.equip': return eco.equip(state, cmd.who, cmd.slot, cmd.itemId);

    case 'interior.begin': return interior.begin(state);
    case 'interior.select': return interior.select(state, cmd.uid);
    case 'interior.move': return interior.move(state, cmd.uid, cmd.x, cmd.y);
    case 'interior.nudge': return interior.nudge(state, cmd.uid, cmd.dx, cmd.dy);
    case 'interior.rotate': return interior.rotate(state, cmd.uid);
    case 'interior.store': return interior.store(state, cmd.uid);
    case 'interior.place': return interior.place(state, cmd.uid, cmd.x, cmd.y);
    case 'interior.cancel': return interior.cancel(state);
    case 'interior.apply': return interior.apply(state);

    case 'bond.talk': return bonds.talk(state, cmd.id);
    case 'bond.gift': return bonds.gift(state, cmd.id, cmd.giftId);
    case 'story.seen': return calendar.markStory(state, cmd.id);
    case 'hunt.start': return hunt.startHunt(state);
    case 'hunt.retreat': return hunt.retreat(state);
    case 'hunt.finish': return hunt.finishHunt(state);
    case 'hunt.pick': return hunt.pick(state, cmd.index);
    default: return { ok: false, reason: `알 수 없는 명령: ${t}` };
  }
}

function normalize(r) {
  const out = r && typeof r === 'object' ? { ...r } : { ok: !!r };
  if (!out.ok && !out.reasons) out.reasons = out.reason ? [out.reason] : [];
  return out;
}

export function dispatch(state, cmd) {
  const { result, events } = withEvents(() => normalize(route(state, cmd)));
  return { ...result, events };
}

// 자동 운영은 사람과 같은 명령 경로(route)를 쓴다
const runAuto = state => autoStep(state, cmd => normalize(route(state, cmd)));

// 활성 시간 dtMs 만큼 진행. 일시정지·결산·준비 중에는 시간이 흐르지 않는다.
// 큰 dt 는 SIM_STEP_MS 이하의 고정 단계로 나눈다(정수 ms).
export function tick(state, dtMs, { input } = {}) {
  return withEvents(() => {
    if (state.paused) return;
    let left = Math.max(0, Math.floor(dtMs));
    while (left > 0) {
      const dt = Math.min(TEMP.SIM_STEP_MS, left);
      left -= dt;
      if (state.mode === 'shift') shift.stepShift(state, dt, runAuto);
      else if (state.mode === 'hunt') hunt.stepHunt(state, dt, input);
      else break;
      if (state.paused) break;
    }
  }).events;
}
