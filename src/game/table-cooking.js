import {MENUS,INGREDIENTS} from '../data/menus.js';
import {stationJobs,stationItems} from './station-slots.js';
import {cook} from './cafe.js';
import {withEvents} from './state.js';
export function tableCookingOrders(s,no){
 const table=s.tables.find(t=>t.no===no),visit=s.visits[table?.visitId]||Object.values(s.visits).find(v=>v.customerId===table?.customerId);
 if(!table?.customerId||!visit)return [];
 const existing=[...s.tray.filter(Boolean),...Object.values(s.stations).flatMap(st=>[...stationJobs(st),...stationItems(st)])];
 return visit.orderIds.map(id=>s.orders[id]).filter(o=>o?.status==='waiting'&&!existing.some(j=>j.orderId===o.id));
}
export function cookTable(s,no,timing){
 const orders=tableCookingOrders(s,no);if(!orders.length)return {ok:false,reason:'새로 만들 주문이 없어요. 주방의 조리 현황을 확인해 주세요'};
 const need={};for(const o of orders)for(const [id,n] of Object.entries(MENUS[o.menuId].ingredients))need[id]=(need[id]||0)+n;
 for(const [id,n] of Object.entries(need))if((s.stock[id]||0)<n)return {ok:false,reason:`묶음 조리 재료 부족: ${INGREDIENTS[id].name} ${n}개 필요`};
 // 전체가 들어갈지 먼저 검사. 실패하면 어떤 재료·작업도 바뀌지 않는다.
 const trial=structuredClone(s);const check=withEvents(()=>orders.map(o=>cook(trial,o.menuId,o.id,timing))).result;
 const failed=check.find(r=>!r.ok);if(failed)return failed;
 const results=orders.map(o=>cook(s,o.menuId,o.id,timing));
 // 한 테이블 주문은 한꺼번에 완성된다: 함께 시작한 작업은 가장 긴 조리 시간에 맞춘다.
 const ids=new Set(results.map(r=>r.jobId)),jobs=Object.values(s.stations).flatMap(stationJobs).filter(j=>ids.has(j.id)),longest=Math.max(...jobs.map(j=>j.durationMs));
 for(const j of jobs)j.durationMs=longest;
 return {ok:true,jobId:results[0].jobId,jobIds:results.map(r=>r.jobId),count:results.length,queued:results.filter(r=>r.queued).length};
}
