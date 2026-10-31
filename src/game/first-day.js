import {MENUS} from '../data/menus.js';
// 안내는 실제 게임 상태에서 다음 행동을 고른다. 안내 자체는 비용·보상을 만들지 않는다.
export function firstDayStep(s){
 if(!s||s.day!==1||s.tutorials?.firstday||s.interior.draft)return null;
 if(s.mode==='prep'){
  if(s.foodGifts?.job)return {id:'cooking',title:'연이가 첫 음식을 만들고 있어요',text:'완성하면 보관함에 담기고 경험치가 올라요. 창을 닫아도 조리는 계속돼요.',action:'gift.watch',label:'조리 장면 보기'};
  if(!s.tutorials?.decorate&&s.interior.furniture.some(f=>f.x==null))return {id:'decorate',title:'보관함 가구로 카페를 꾸며요',text:'가구를 골라 놓고 배치를 적용해 보세요.',action:'decor.open',label:'가구 배치 배우기'};
  if(s.ap.left>0){
   if((s.yeoniGrowth?.counts?.cook||0)>0&&!Object.keys(s.ap.talked||{}).length)return {id:'talk',title:'동료와 첫 이야기를 나눠요',text:'대답을 고르면 행동력 1이 자동으로 사용되고 인연과 연이 경험치가 올라요.',action:'bond.talk',args:{id:'luna'},label:'루나와 이야기 · 행동력 1'};
   const m=Object.values(MENUS).find(m=>s.learned[m.id]&&!m.yeoniLevel&&Object.entries(m.ingredients).every(([id,n])=>(s.stock[id]||0)>=n));
   if((s.foodGifts?.items.length||0)>=20)return {id:'store',title:'보관함을 먼저 비워요',text:'동료에게 음식을 선물한 뒤 다음 요리를 준비할 수 있어요.',action:'sheet.open',args:{sheet:'companions'},label:'선물할 동료 보기'};
   return m?{id:'cook',title:(s.yeoniGrowth?.counts?.cook||0)?'남은 행동력으로 한 번 더 요리해요':'연이와 첫 음료를 만들어 봐요',text:`남은 행동력 ${s.ap.left} · 조리 시작 시 1이 자동 차감돼요. 취소하면 같은 날 사용한 행동력을 돌려받아요.`,action:'gift.prepare',args:{menu:m.id},label:m.short+' 만들기 · 행동력 1'}:{id:'stock',title:'요리에 쓸 재료를 준비해요',text:'부족한 재료는 모카에게 구입해요. 구매에는 행동력이 들지 않아요.',action:'sheet.open',args:{sheet:'shop'},label:'모카 식재료점'};
  }
  return {id:'open',title:'오늘의 준비를 마쳤어요',text:'영업을 시작해 첫 주문을 받아요. 영업을 마치면 다음 순의 행동력이 채워져요.',action:'shift.start',label:'영업 시작 안내 보기'};
 }
 if(s.mode!=='shift'||s.tutorialProgress?.clean)return null;
 const dirty=s.tables.find(t=>t.state==='dirty');
 if(dirty)return {id:'clean',title:'손님이 떠난 자리를 정리해요',text:'정리를 요청하면 루나가 치우고 다음 손님을 맞아요.',action:'clean',args:{no:dirty.no},label:dirty.no+'번 자리 정리하기'};
 const index=s.tray.findIndex(it=>it&&!it.reservedFor);
 if(index>=0)return {id:'serve',title:'완성된 음식을 전해요',text:'음식을 누르면 기다리는 손님에게 루나가 전달해요.',action:'tray.tap',args:{i:index},label:'완성 음식 전달하기'};
 const jobs=Object.values(s.stations).flatMap(st=>[st.current,st.parallel,st.next,...(st.queue||[])]).filter(Boolean);
 const order=Object.values(s.orders).find(o=>o.status==='waiting'&&!o.itemId&&!jobs.some(j=>j.orderId===o.id));
 if(order)return {id:'order',title:'첫 주문을 만들어요',text:'주문한 메뉴를 눌러 재료와 타이밍을 확인해요. 손님 주문 조리는 행동력을 쓰지 않아요.',action:'order.quick',args:{id:order.id},label:MENUS[order.menuId].short+' 주문 만들기'};
 return {id:'wait',title:s.stats.served?'손님의 식사와 계산을 기다려요':'손님을 맞이하고 있어요',text:s.stats.served?'연이가 입구에서 계산해요. 손님이 떠나면 자리 정리를 안내할게요.':'손님이 주문하면 다음 행동이 여기에 나타나요. 주방에서 조리 현황을 확인할 수 있어요.',action:'cafe.drawer',args:{tab:'kitchen'},label:'주방 확인하기'};
}
