import {customerLook} from '../data/customer-looks.js';
import {MENUS} from '../data/menus.js';
// 실제 좌석에 도착한 손님만 앉힌다. 이동·결제 중에는 걷기 시트를 유지한다.
export function customerPose(state,c,reducedMotion=false){
 const now=state.shift?.elapsedMs||0,look=customerLook(c);
 const table=state.tables?.find(t=>t.customerId===c.id),chair=table?.chair;
 const seated=!!chair&&!c.path?.length&&!['leaving','checkout','walking'].includes(c.state)&&Math.abs(c.x-chair.x-.5)<.08&&Math.abs(c.y-chair.y-.5)<.08;
 let action=c.action==='walk'?'walk':c.action==='react'?'react':'idle';
 if(seated&&(c.state==='eating'||c.action==='eat')){
  const served=Object.values(state.orders||{}).filter(o=>o.visitId===c.visitId&&o.status==='served'),item=served[Math.floor((state.shift?.elapsedMs||0)/2400)%Math.max(1,served.length)];
  action=MENUS[item?.menuId]?.station==='drink'?'drink':'eat';
 }
 // 결제 대기열이 가득 차면 예약한 의자에서 기다린다.
 if(c.checkoutWaiting&&chair)return {key:`customer_seated@look${look}`,seated:true,state:'idle',facing:table.facing||c.facing};
 const standing=c.standing&&now<c.standing.until;
 const sitting=seated&&['thinking','requesting'].includes(c.state)&&c.action!=='eat'&&Number.isFinite(c.sitAt)&&now-c.sitAt<640;
 if(!reducedMotion&&(standing||sitting)){
  const progress=Math.max(0,Math.min(1,(now-(standing?c.standing.at:c.sitAt))/640));
  const blend=standing?1-progress:progress;
  return {key:`customer_transition@look${look}`,state:'transition',facing:standing?c.standing.facing:table.facing,seated:false,seatBlend:blend,animationFrame:standing?3-Math.min(3,Math.floor(progress*4)):Math.min(3,Math.floor(progress*4))};
 }
 if(c.state==='checkout'&&!standing&&!c.path?.length&&c.payAt!=null)return {key:`customer_transition@look${look}`,state:'pay',facing:'right',flipX:c.facing==='left',seated:false,animationFrame:reducedMotion?0:Math.max(0,Math.min(3,Math.floor((now-c.payAt+1040)/260)))};
 return {key:`${seated?'customer_seated':'customer'}@look${customerLook(c)}`,seated,state:action,facing:seated?(table.facing||c.facing):c.facing};
}
