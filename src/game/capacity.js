import {GRID,FURNITURE,cafeLayout} from '../data/layout.js';
import {lockedSet,buildGrid,tableGeometry} from './space.js';
import {usableHosts} from './state.js';
import {bondFx} from '../data/bonds.js';
import {TEMP} from '../config/balance.temp.js';
const capacities=new Map(),seatCache=new WeakMap();
// TEMP: 열린 바닥에서 수용량을 파생한다. 기본점의 조리·선반은 기존값을 유지한다.
export function cafeCapacity(state){
 const areas=state.interior.areas||[],key=[...areas].sort().join(',');let value=capacities.get(key);
 if(!value){const tiles=GRID.cols*GRID.rows-lockedSet(areas).size,extra=Math.max(0,tiles-135);
  value=Object.freeze({tiles,tableLimit:Math.min(60,24+Math.floor(extra/20)),hostSlots:Math.min(16,1+Math.floor(extra/48)),stationSlots:Math.min(6,1+Math.floor(extra/120)),traySlots:Math.min(12,3+Math.floor(extra/80)),takeawayLimit:Math.min(6,2+Math.floor(extra/160))});capacities.set(key,value);}
 const list=state.interior.furniture,sig=key+'|'+cafeLayout(state).id+'|'+list.map(f=>[f.uid,f.defId,f.x,f.y,f.rot].join(':')).join(';');let found=seatCache.get(list);
 if(found?.sig!==sig){const grid=buildGrid(list,areas,cafeLayout(state));found={sig,seats:list.filter(f=>FURNITURE[f.defId]?.table&&f.x!=null).filter(f=>{const g=tableGeometry(grid,f);return g.chair&&g.service;}).length};seatCache.set(list,found);}
 const seats=found.seats,fx=bondFx(state); // 루나 언니 인연: 설비마다 동시 조리·픽업 선반이 늘어난다
 return {...value,stationSlots:Math.min(TEMP.BONDS.COOK_SLOT_CAP,value.stationSlots+fx.cookSlots),traySlots:value.traySlots+fx.traySlots,seats,guestLimit:seats+value.takeawayLimit,staffSlots:value.hostSlots+3};
}
export function assignedHosts(state){const eligible=usableHosts(state),selected=state.staffing?.selected;return (Array.isArray(selected)?selected:eligible).filter(id=>eligible.includes(id)).slice(0,cafeCapacity(state).hostSlots);}
export function selectStaff(state,id,on){
 if(state.mode!=='prep'||state.interior.draft||state.outdoor?.draft)return {ok:false,reason:'영업 준비 중 편집을 마친 뒤 직원을 배치해 주세요'};
 if(!usableHosts(state).includes(id))return {ok:false,reason:'영입과 활동 해금을 먼저 마쳐 주세요'};
 const list=assignedHosts(state),has=list.includes(id),next=on??!has;
 if(next&&!has&&list.length>=cafeCapacity(state).hostSlots)return {ok:false,reason:'직원 배치 자리가 가득 찼어요. 구역을 넓히거나 다른 동료를 대기로 바꿔 주세요'};
 state.staffing={selected:next?(has?list:[...list,id]):list.filter(x=>x!==id)};return {ok:true,id,on:next};
}
