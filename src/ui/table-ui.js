import {tableCookingOrders} from '../game/table-cooking.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {qualityOf} from '../data/cooking-quality.js';
import { MENUS } from '../data/menus.js';
import { waitingSatisfaction } from '../game/reputation.js';
import { HELP_KINDS } from '../data/lines.js';
import { HELP_SCENES } from '../data/help.js';
import { assetIcon } from './asset-html.js';
import { btn, esc } from './dom.js';
import { cellToPx } from '../render/cafe-view.js';

export function tableBadgesHtml(state,v) {
  if(state?.mode!=='shift'||!v)return '';
  const dense=state.tables.length>12,placed=[];
  return [...state.tables].sort((a,b)=>Number(b.state==='dirty')-Number(a.state==='dirty')).map(t=>{
    const c=state.customers[t.customerId],visit=c&&state.visits[c.visitId];
    const order=visit?.orderIds.map(id=>state.orders[id]).find(o=>o?.status==='waiting');
    const dirty=t.state==='dirty',cleaning=t.state==='cleaning';
    if(!dirty&&!cleaning&&!c)return '';
    const p=cellToPx(v,t.table.x+.5,t.table.y+.15);
    if(p.x<0||p.x>v.w||p.y<0||p.y>v.h)return '';
    if(dense&&!dirty&&!cleaning&&(!order||c?.state==='entering'))return '';
    if(dense&&placed.some(q=>Math.abs(q.x-p.x)<104&&Math.abs(q.y-p.y)<48))return '';
    const worker=Object.values(state.staff||{}).find(s=>s.servicePose?.tableNo===t.no);
    if(worker)p.x+=p.x<v.w/2?Math.max(62,v.tile*1.6):-Math.max(62,v.tile*1.6);
    placed.push(p);
    const text=cleaning?'닦는 중':dirty?(t.cleanQueued?'가는 중':'정리'):c.state==='eating'?'식사 중':c.state==='requesting'?'지명 요청':order?MENUS[order.menuId].short:'메뉴 고르는 중';
    const urgent=visit&&waitingSatisfaction(state,visit)<55;
    const progress=cleaning?Math.min(100,100*(1-Math.max(0,t.cleanEndAt-state.shift.elapsedMs)/(t.cleanMs||1))):0;
    return `<button class="table-badge ${dirty?'dirty':''} ${urgent?'urgent':''} ${c?.state==='eating'&&!dirty&&!cleaning?'enjoying':''}" data-key="badge-${t.no}" data-action="${dirty&&!t.cleanQueued?'clean':'table.tap'}" data-no="${t.no}" style="left:${Math.max(42,Math.min(v.w-42,p.x))}px;top:${Math.max(0,p.y-44-v.tile*.35)}px" title="${t.no}번 테이블 ${text}" aria-label="${t.no}번 테이블 ${text}">${order?assetIcon('icons/'+order.menuId):''}<span>${esc(text)}</span>${cleaning?`<progress max="100" value="${progress}" aria-label="정리 진행"></progress>`:''}</button>`;
  }).join('');
}
export function tablePopHtml(state,v,ui) {
  const t=state?.mode==='shift'&&state.tables.find(t=>t.no===ui.tablePop?.no);
  if(!t||!v)return '';
  const c=state.customers[t.customerId],visit=c&&state.visits[c.visitId];
  const p=cellToPx(v,t.table.x+.5,t.table.y+.5),width=Math.min(280,v.w-16);
  const left=Math.max(8,Math.min(v.w-width-8,p.x>v.w/2?p.x-width-14:p.x+14));
  let body='<p>다음 손님을 기다리는 자리예요.</p>';
  if(t.state==='dirty'||t.state==='cleaning')body=btn({action:'clean',args:{no:t.no},disabled:t.cleanQueued||t.state==='cleaning',label:t.state==='cleaning'?'닦는 중':t.cleanQueued?'정리하러 가는 중':'정리하기',cls:'primary'});
  if(visit){
    const orders=visit.orderIds.map(id=>state.orders[id]).filter(Boolean),score=waitingSatisfaction(state,visit);
    body=`<p>${esc(c.label||'손님')} · ${c.state==='eating'?'맛있게 먹는 중':'주문 현황'}</p><meter min="0" max="100" value="${score}" aria-label="손님 만족도 ${score}점"></meter>`+orders.map(o=>{
      const job=Object.values(state.stations).flatMap(s=>stationJobs(s)).find(j=>j?.orderId===o.id);
      const item=state.tray.find(it=>it?.menuId===o.menuId&&!it.reservedFor&&(!it.orderId||it.orderId===o.id));
      return `<div class="table-order">${assetIcon('icons/'+o.menuId)}<span>${esc(MENUS[o.menuId].short)}</span>${o.status==='served'?`<small>${qualityOf(o.quality).label} · ${o.foodScore??'—'}점<br>대기·분위기 ${o.foodBase??'—'} ${o.qualityDelta>=0?'+':''}${o.qualityDelta??0}</small>`:o.status==='assigned'?'<small>가져가는 중</small>':job?`<small>조리 중 ${Math.ceil((job.durationMs-(job.progressMs||0))/1000)}초</small>`:item?btn({action:'serve',args:{item:item.id,no:t.no},label:qualityOf(item.quality).label+' · 전달하기',cls:'primary'}):btn({action:'order.quick',args:{id:o.id},label:'만들기',cls:'primary'})}</div>`;
    }).join('');
    if(tableCookingOrders(state,t.no).length>1)body+=btn({action:'order.table',args:{no:t.no},cls:'primary big',label:'이 테이블 주문 한 번에 만들기'});
    if(visit.kind==='nomination')body+=btn({action:'sheet.open',args:{sheet:'table',no:t.no},label:'접대 자세히'});
    for(const h of visit.help||[])if(h.status==='open'){const scene=HELP_SCENES[h.kind];body+=`<div class="table-help"><b>${esc(HELP_KINDS[h.kind].label)}</b><p>${esc(scene.prompt)}</p>${scene.choices.map(([choice,label])=>btn({action:'help.respond',args:{visit:visit.id,index:h.index,choice},label:esc(label)})).join('')}</div>`;}
  }
  return `<section class="table-pop" role="dialog" aria-label="${t.no}번 테이블" style="left:${left}px;top:${Math.max(8,Math.min(v.h-210,p.y-70))}px;width:${width}px"><header><b>${t.no}번 테이블</b>${btn({action:'table.close',label:'✕',title:'테이블 닫기'})}</header>${body}</section>`;
}
