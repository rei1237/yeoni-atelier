import {customerLook} from '../data/customer-looks.js';
import {MENUS} from '../data/menus.js';
// 실제 좌석에 도착한 손님만 앉힌다. 이동·결제 중에는 걷기 시트를 유지한다.
export function customerPose(state,c){
 const table=state.tables?.find(t=>t.customerId===c.id),chair=table?.chair;
 const seated=!!chair&&!c.path?.length&&!['leaving','checkout','walking'].includes(c.state)&&Math.abs(c.x-chair.x-.5)<.08&&Math.abs(c.y-chair.y-.5)<.08;
 let action=c.action==='walk'?'walk':c.action==='react'?'react':'idle';
 if(seated&&c.action==='eat'){
  const served=Object.values(state.orders||{}).filter(o=>o.visitId===c.visitId&&o.status==='served'),item=served[Math.floor((state.shift?.elapsedMs||0)/2400)%Math.max(1,served.length)];
  action=MENUS[item?.menuId]?.station==='drink'?'drink':'eat';
 }
 return {key:`${seated?'customer_seated':'customer'}@look${customerLook(c)}`,seated,state:action,facing:seated?(table.facing||c.facing):c.facing};
}
