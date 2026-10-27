// 자동화 권한. 그 동료의 인연 단계와 같은 단계 인연 이야기를 본 기록(ledger.story['bond:<id>:<단계>'])을 엔진이 함께 확인한다.
// 버튼만 잠그는 화면 잠금이 아니다: automation.toggle·자동 실행이 모두 여기를 거친다. 수치는 TEMP.AUTOMATION(임시).

import { TEMP } from '../config/balance.temp.js';
import { BONDS, bondTier } from '../data/bonds.js';

export const ABILITIES = TEMP.AUTOMATION;

export function abilityCheck(state, ability) {
  const a = ABILITIES[ability];
  if (!a) return { ok: false, reason: '없는 자동화입니다' };
  const name = BONDS[a.id].name, tier = bondTier(state.affinity?.[a.id] || 0);
  const detail = { who:a.id, name, current:tier, need:a.tier };
  if (tier < a.tier) return { ok: false, ...detail, reason: `${name} 인연 ♥${a.tier}에 열려요 (지금 ♥${tier})` };
  if (!state.ledger.story[`bond:${a.id}:${a.tier}`]) return { ok: false, ...detail, reason: `${name} ♥${a.tier} 인연 이야기를 보면 열려요` };
  return { ok: true, ...detail };
}
export const canUse = (state, ability) => abilityCheck(state, ability).ok;

// 지금 실제로 돌아가는 자동화(켜짐 + 권한). state.auto 는 시뮬·테스트 전용 전체 자동이다.
export const automationOn = (state, ability) => !!state.auto || (!!state.automation?.[ability] && canUse(state, ability));

export const HALL_ABILITIES = Object.freeze(['hall','hall_neo']);
export const hallAutomationOn = (state,id) => HALL_ABILITIES.some(key=>ABILITIES[key].id===id && automationOn(state,key));
// 모두 끄면 아직 배정되지 않은 자동 예약을 풀어 직접 조작할 수 있게 한다.
function releaseHallQueue(state){
 if(state.auto || HALL_ABILITIES.some(key=>automationOn(state,key)))return;
 state.tasks=(state.tasks||[]).filter(task=>{
  if(!task.autoHall||task.assignedTo)return true;
  if(task.type==='clean'){const t=state.tables.find(t=>t.no===task.tableNo);if(t)t.cleanQueued=false;}
  else{const o=state.orders[task.orderId],item=state.tray.find(it=>it?.id===task.itemId);if(o?.status==='assigned'){o.status='waiting';o.itemId=null;}if(item)item.reservedFor=null;}
  return false;
 });
}
export function toggleAutomation(state, ability, on) {
  if(!ABILITIES[ability])return {ok:false,reason:'없는 자동화입니다'};
  const chk = abilityCheck(state, ability);
  const next = on ?? !state.automation?.[ability];
  if (next && !chk.ok) return chk;
  state.automation = { ...state.automation, [ability]: !!next };
  releaseHallQueue(state);
  return { ok: true, ability, on: !!next };
}
