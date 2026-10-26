import {acceptYunQuest} from './yun-quest.js';
import * as finance from './finance.js';
// 엔진 진입점. 화면(UI)·자동 운영·테스트는 모두 dispatch(명령)와 tick(활성 시간 진행)만 쓴다.
// UI 는 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import { bondTier } from '../data/bonds.js';
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
import * as armory from './moka-armory.js';
import * as farm from './farm.js';
import { unlockOutfit } from './outfits.js';
import { autoStep } from './auto.js';
import { toggleAutomation } from './permissions.js';
import { setDayOff, shelter } from './stress.js';
import { delegateFarm } from './farm-delegate.js';

// 일시정지 중에도 받는 명령
const ALLOWED_WHILE_PAUSED = new Set(['resume', 'pause', 'auto.toggle', 'automation.toggle', 'tutorial.seen']);
// 영업 중에만 의미가 있는 명령
const SHIFT_ONLY = new Set(['order.quick', 'cook', 'cook.cancelNext', 'serve', 'clean', 'nomination.accept', 'nomination.decline', 'nomination.propose', 'help.respond', 'fever.activate']);

const FARM_ACTIONS = new Set(['farm.harvest','farm.plant','farm.water','farm.tend']);
export const HELPERS = Object.freeze({neo:{tier:1,actions:['farm.water','farm.tend']},moka:{tier:2,actions:['farm.water','farm.tend']},yun:{tier:3,actions:['farm.harvest']}});
// 네오 대행은 같은 순 사냥과 겹치지 않는다(사냥을 다녀왔으면 거절, 대행하면 그 순 사냥 거절)
export function helperAvailable(state,id,type){const h=HELPERS[id];return !!(h && state.roster[id] && bondTier(state.affinity[id]||0)>=h.tier && h.actions.includes(type) && !state.ap.delegated?.[id] && !(id==='neo'&&state.ap.neoTask==='hunt'));}
function route(state, cmd) {
 const paid=state.mode==='prep' && FARM_ACTIONS.has(cmd?.type);
 const helper=paid && cmd.helperId && helperAvailable(state,cmd.helperId,cmd.type);
 if(paid && cmd.helperId && !helper)return {ok:false,reason:'이 일을 대신할 수 없거나 이번 순 대행을 이미 마쳤어요'};
 if(paid && !helper){const chk=farm.farmEnergyCheck(state);if(!chk.ok)return chk;}
 const result=execute(state,cmd);
 if(paid && result?.ok && !result.duplicate){if(helper){state.ap.delegated??={};state.ap.delegated[cmd.helperId]=true;if(cmd.helperId==='neo')state.ap.neoTask='farm';}else farm.spendFarmEnergy(state);}
 return result;
}
function execute(state, cmd) {
  const t = cmd?.type;
  if (state.paused && !ALLOWED_WHILE_PAUSED.has(t)) return { ok: false, reason: '일시정지 중입니다 — 계속하기를 눌러 주세요' };
  if (SHIFT_ONLY.has(t) && state.mode !== 'shift') return { ok: false, reason: '정규 영업 중에만 할 수 있습니다' };
  switch (t) {
    case 'tutorial.seen':
      if(!/^[a-z]+$/.test(cmd.id||''))return {ok:false,reason:'안내를 찾을 수 없어요'};
      state.tutorials??={};state.tutorials[cmd.id]=true;return {ok:true};
    case 'shift.start': return shift.startShift(state);
    case 'settlement.close': return shift.closeSettlement(state);
    case 'pause':
      if (state.mode !== 'shift' && state.mode !== 'hunt') return { ok: false, reason: '진행 중인 영업·사냥이 없습니다' };
      state.paused = true; return { ok: true };
    case 'resume': state.paused = false; return { ok: true };
    // 전체 자동(지명 수락·도움 응답·피버까지)은 시뮬·테스트 전용이다. 플레이어 화면에는 버튼이 없고 sim 표시 없이는 거절한다.
    case 'auto.toggle':
      if (cmd.sim !== true) return { ok: false, reason: '전체 자동은 시뮬레이션 전용이에요. 홀·주방 자동은 인연으로 열려요' };
      state.auto = cmd.on ?? !state.auto; return { ok: true, auto: state.auto };
    case 'automation.toggle': return toggleAutomation(state, cmd.ability, cmd.on);
    case 'staff.dayOff': return setDayOff(state, cmd.id, cmd.on);
    case 'stress.shelter': return shelter(state, cmd.id);

    case 'cook': return cafe.cook(state, cmd.menuId);
    case 'order.quick': return cafe.quickOrder(state, cmd.orderId);
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
    case 'farm.delegate': return delegateFarm(state);
    case 'farm.expand': return farm.expansion(state);
    case 'farm.greenhouse': return farm.expansion(state, true);
    case 'debt.repay': return eco.repay(state, cmd.amount, cmd.requestId);
    case 'quest.claim': return eco.claimQuest(state, cmd.questId);
    case 'recruit.complete': return eco.completeRecruit(state, cmd.id);
    case 'cast.story': return eco.castStory(state, cmd.id);
    case 'finance.borrow': return finance.borrow(state,cmd.amount,cmd.requestId);
    case 'finance.repay': return finance.repayFinance(state,cmd.target,cmd.amount,cmd.currency);
    case 'moonstone.exchange': return town.exchange(state, cmd.qty);
    case 'town.visit': return town.markVisit(state, cmd.place);
    case 'gear.buy': return town.buyGear(state, cmd.id);
    case 'gear.equip': return town.equipGear(state, cmd.slot, cmd.id ?? null);
    case 'expand.table': return town.buyExpansion(state);
    case 'expand.decor': return town.buyDecor(state, cmd.defId);
    case 'expand.area': return town.buyArea(state, cmd.id);
    case 'outfit.equip': return eco.equip(state, cmd.who, cmd.slot, cmd.itemId);
    case 'outfit.unlock': return unlockOutfit(state, cmd.id);

    case 'interior.begin': return interior.begin(state);
    case 'interior.select': return interior.select(state, cmd.uid);
    case 'interior.move': return interior.move(state, cmd.uid, cmd.x, cmd.y);
    case 'interior.nudge': return interior.nudge(state, cmd.uid, cmd.dx, cmd.dy);
    case 'interior.rotate': return interior.rotate(state, cmd.uid);
    case 'interior.store': return interior.store(state, cmd.uid);
    case 'interior.place': return interior.place(state, cmd.uid, cmd.x, cmd.y);
    case 'interior.cancel': return interior.cancel(state);
    case 'interior.apply': return interior.apply(state);

    case 'bond.talk': return bonds.talk(state, cmd.id, cmd.choiceId, cmd.token);
    case 'yun.quest': return acceptYunQuest(state);
    case 'armory.enhance': return armory.enhance(state,cmd.who,cmd.id);
    case 'armory.buy': return armory.buySupply(state,cmd.id);
    case 'armory.learn': return armory.learnSkill(state,cmd.id);
    case 'hunt.supply': return hunt.useSupply(state,cmd.id);
    case 'bond.gift': return bonds.gift(state, cmd.id, cmd.giftId);
    case 'story.seen': return calendar.markStory(state, cmd.id);
    case 'hunt.start': return hunt.startHunt(state, cmd.depth, cmd.hunterId);
    case 'hunt.retreat': return hunt.retreat(state);
    case 'hunt.finish': return hunt.finishHunt(state);
    case 'hunt.pick': return hunt.pick(state, cmd.index);
    case 'hunt.next': return hunt.nextStage(state);
    case 'hunt.chest': return hunt.openChest(state);
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
