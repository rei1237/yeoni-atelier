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

// 주문과 무관하게 손님이 지금 무엇을 하는지: 들어오는 중·계산·퇴장 손님을 '주문'으로 보이지 않게 한다.
export function guestMotion(c){
  if(!c)return '';
  if(c.state==='entering')return '자리로 가는 중';
  if(c.state==='checkout')return c.checkoutWaiting?'계산 줄 기다림':c.payAt!=null?'연이에게 결제 중':'계산하러 가는 중';
  if(c.state==='leaving')return '나가는 중';
  return '';
}
// 10-29 주문 영수증: 주문 한 건이 지금 어디에 있는지(다 나감·가져가는 중·조리 중·완성·만들기)
export function orderState(state,o){
  if(o.status==='served')return {kind:'done',label:'나갔어요'};
  if(o.status==='assigned')return {kind:'carry',label:'가져가는 중'};
  const job=Object.values(state.stations).flatMap(s=>stationJobs(s)).find(j=>j?.orderId===o.id);
  if(job)return {kind:'cook',label:`조리 ${Math.max(0,Math.ceil((job.durationMs-(job.progressMs||0))/1000))}초`,job};
  const item=state.tray.find(it=>it?.menuId===o.menuId&&!it.reservedFor&&(!it.orderId||it.orderId===o.id));
  if(item)return {kind:'ready',label:'완성',item};
  return {kind:'wait',label:'만들기'};
}
export const visitOrders=(state,visit)=>visit.orderIds.map(id=>state.orders[id]).filter(o=>o&&o.status!=='cancelled');
// 10-29 지금 할 일: 전달 → 정리 → 만들기 순서. 누르면 바로 처리되는 일만, 만들기는 기다림이 긴 손님부터
export function cafeTasks(state){
 if(state?.mode!=='shift')return [];
 const serve=[],make=[],used=new Set(),batched=new Set(),mood=o=>{const v=state.visits[o.visitId];return v?waitingSatisfaction(state,v):100;};
 for(const o of Object.values(state.orders||{}).filter(o=>o.status==='waiting').sort((a,b)=>mood(a)-mood(b))){
  const take=state.visits[o.visitId]?.kind==='takeaway',where=take?'포장':o.tableNo+'번',short=MENUS[o.menuId].short,st=orderState(state,o);
  if(st.kind==='cook'||st.kind==='carry')continue;
  const item=(state.tray||[]).find(it=>it&&!it.reservedFor&&!used.has(it.id)&&it.menuId===o.menuId&&(!it.orderId||it.orderId===o.id));
  if(item){used.add(item.id);serve.push({kind:'serve',no:o.tableNo,menuId:o.menuId,item:item.id,action:take?'order.quick':'serve',args:take?{id:o.id}:{item:item.id,no:o.tableNo},text:`${where} ${short}`,verb:'전달하기'});continue;}
  const group=take?[]:tableCookingOrders(state,o.tableNo);
  if(group.length>1){if(!batched.has(o.tableNo)){batched.add(o.tableNo);make.push({kind:'make',no:o.tableNo,menuId:o.menuId,action:'order.table',args:{no:o.tableNo},text:`${where} 주문 ${group.length}개`,verb:'만들기'});}}
  else make.push({kind:'make',no:o.tableNo,menuId:o.menuId,action:'order.quick',args:{id:o.id},text:`${where} ${short}`,verb:'만들기'});
 }
 const clean=state.tables.filter(t=>t.state==='dirty'&&!t.cleanQueued).map(t=>({kind:'clean',no:t.no,action:'clean',args:{no:t.no},text:`${t.no}번 테이블`,verb:'정리하기'}));
 return [...serve,...clean,...make];
}
// 같은 메뉴·같은 상태는 칩 하나(×n)로 묶고, 주문 순서를 지킨다. 다 나간 메뉴는 체크로 흐리게
export function orderChipsHtml(state,visit){
  const groups=[];
  for(const o of visitOrders(state,visit)){const st=orderState(state,o),g=groups.find(g=>g.menuId===o.menuId&&g.kind===st.kind);if(g)g.n++;else groups.push({menuId:o.menuId,kind:st.kind,label:st.label,n:1});}
  return groups.map(g=>`<span class="order-chip st-${g.kind}" title="${esc(MENUS[g.menuId].name)} · ${esc(g.label)}">${assetIcon('icons/'+g.menuId)}<span>${esc(MENUS[g.menuId].short)}${g.n>1?' ×'+g.n:''}</span></span>`).join('');
}
export function tableBadgesHtml(state,v) {
  if(state?.mode!=='shift'||!v)return '';
  const dense=state.tables.length>12,placed=[],serves=cafeTasks(state).filter(k=>k.action==='serve');
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
    // 남은 주문이 둘 이상이면 메뉴 아이콘을 최대 3개까지 늘어놓고 개수를 붙인다(첫 메뉴만 보이지 않게)
    // 완성 접시가 있는 자리는 말풍선 한 번으로 바로 전달한다
    const ready=!dirty&&!cleaning&&serves.find(k=>k.no===t.no);
    const motion=guestMotion(c),multi=!dirty&&!cleaning&&!motion&&visit&&c.state!=='requesting'?visitOrders(state,visit).filter(o=>o.status!=='served'):[];
    const text=ready?'전달하기':multi.length>1?`${multi.length}개`:cleaning?'닦는 중':dirty?(t.cleanQueued?'정리하러 가는 중':'정리하기'):motion||(c.state==='eating'?'식사 중':c.state==='requesting'?'지명 요청':order?MENUS[order.menuId].short:'메뉴 고르는 중');
    // 10-29 말풍선 문법: 버튼은 44px 터치 영역만, 보이는 것은 안쪽 pill(대화창과 같은 크림 바탕·색 테두리·꼬리)
    const tone=ready?'ready':cleaning?'cleaning':dirty?(t.cleanQueued?'queued':'dirty'):c?.state==='requesting'?'request':motion?'moving':order?'order':'calm';
    const urgent=visit&&waitingSatisfaction(state,visit)<55;
    const progress=cleaning?Math.min(100,100*(1-Math.max(0,t.cleanEndAt-state.shift.elapsedMs)/(t.cleanMs||1))):0;
    return `<button class="table-badge tone-${tone} ${dirty?'dirty':''} ${urgent?'urgent':''} ${c?.state==='eating'&&!dirty&&!cleaning&&multi.length<2?'enjoying':''} ${multi.length>1?'multi':''}" data-key="badge-${t.no}" data-action="${ready?'serve':dirty&&!t.cleanQueued?'clean':'table.tap'}" data-no="${t.no}"${ready?` data-item="${esc(ready.item)}"`:''} style="left:${Math.max(42,Math.min(v.w-42,p.x))}px;top:${Math.max(0,p.y-44-v.tile*.35)}px" title="${t.no}번 테이블 ${ready?MENUS[ready.menuId].short+' '+text:multi.length>1?'남은 주문 '+text:text}" aria-label="${t.no}번 테이블 ${ready?MENUS[ready.menuId].short+' '+text:multi.length>1?'남은 주문 '+text:text}"><span class="badge-pill">${ready?assetIcon('icons/'+ready.menuId):multi.length>1?`<i class="badge-icons">${[...new Set(multi.map(o=>o.menuId))].slice(0,3).map(id=>assetIcon('icons/'+id)).join('')}</i>`:order&&!motion?assetIcon('icons/'+order.menuId):''}<span>${esc(text)}</span>${cleaning?`<i class="badge-progress" style="--p:${Math.round(progress)}%" aria-hidden="true"></i>`:''}</span></button>`;
  }).join('');
}
// 10-29 주문 영수증: 메뉴마다 한 줄(아이콘·이름·상태·할 일), 무대 안에 다 들어오게 놓는다.
// 좁은 화면은 테이블과 말풍선을 가리지 않도록 테이블 위나 아래의 넓은 쪽에 가로로 펼친다
export function tablePopHtml(state,v,ui) {
  const t=state?.mode==='shift'&&state.tables.find(t=>t.no===ui.tablePop?.no);
  if(!t||!v)return '';
  const c=state.customers[t.customerId],visit=c&&state.visits[c.visitId];
  const p=cellToPx(v,t.table.x+.5,t.table.y+.5),narrow=v.w<560,width=narrow?v.w-16:Math.min(300,v.w-16);
  let body='<p>다음 손님을 기다리는 자리예요.</p>',est=130,count='';
  if(t.state==='dirty'||t.state==='cleaning')body=`<p>${t.state==='cleaning'?'루나가 테이블을 반짝반짝 닦고 있어요.':t.cleanQueued?'루나가 행주를 들고 오는 중이에요.':'손님이 떠난 자리예요. 치워야 다음 손님을 앉힐 수 있어요.'}</p>`+btn({action:'clean',args:{no:t.no},disabled:t.cleanQueued||t.state==='cleaning',label:t.state==='cleaning'?'닦는 중':t.cleanQueued?'정리하러 가는 중':'정리하기',cls:'primary'}),est=170;
  if(visit){
    const orders=visitOrders(state,visit),sts=orders.map(o=>orderState(state,o)),score=waitingSatisfaction(state,visit),left=sts.filter(x=>x.kind!=='done').length;
    if(orders.length)count=`<small class="pop-count">${left?`남은 주문 ${left} / ${orders.length}`:`${orders.length}개 다 나갔어요`}</small>`;
    body=`<p class="pop-guest">${esc(c.label||'손님')} · ${guestMotion(c)||(c.state==='eating'?'맛있게 먹는 중':'주문 현황')}</p><meter min="0" max="100" value="${score}" aria-label="손님 만족도 ${score}점"></meter><ol class="pop-ticket${narrow&&orders.length>=3?' two-col':''}" aria-label="${t.no}번 테이블 주문 ${orders.length}개">`+orders.map((o,i)=>{
      const st=sts[i],tip=o.status==='served'?`대기·분위기 ${o.foodBase??'—'} ${o.qualityDelta>=0?'+':''}${o.qualityDelta??0}`:'';
      const act=st.kind==='done'?`<small>✓ ${qualityOf(o.quality).label} · ${o.foodScore??'—'}점</small>`:st.kind==='ready'?btn({action:'serve',args:{item:st.item.id,no:t.no},label:qualityOf(st.item.quality).label+' · 전달',cls:'primary'}):st.kind==='wait'?btn({action:'order.quick',args:{id:o.id},label:'만들기',cls:'primary'}):`<small>${esc(st.label)}</small>`;
      return `<li class="table-order st-${st.kind}"${tip?` title="${esc(tip)}"`:''}>${assetIcon('icons/'+o.menuId)}<span>${esc(MENUS[o.menuId].short)}</span>${act}</li>`;
    }).join('')+'</ol>';
    est=96+orders.length*48;
    if(tableCookingOrders(state,t.no).length>1){body+=`<div class="pop-actions">${btn({action:'order.table',args:{no:t.no},cls:'primary big',label:'이 테이블 주문 한 번에 만들기'})}</div>`;est+=56;}
    if(visit.kind==='nomination'){body+=btn({action:'sheet.open',args:{sheet:'table',no:t.no},label:'접대 자세히'});est+=52;}
    for(const h of visit.help||[])if(h.status==='open'){const scene=HELP_SCENES[h.kind];body+=`<div class="table-help"><b>${esc(HELP_KINDS[h.kind].label)}</b><p>${esc(scene.prompt)}</p>${scene.choices.map(([choice,label])=>btn({action:'help.respond',args:{visit:visit.id,index:h.index,choice},label:esc(label)})).join('')}</div>`;est+=150;}
  }
  let pos;
  if(narrow){
    const top=p.y-v.tile*.85-52,bottom=p.y+v.tile*1.2;
    pos=top-8>=v.h-bottom-8?`bottom:${Math.round(v.h-top)}px;max-height:${Math.round(Math.max(150,top-8))}px`:`top:${Math.round(bottom)}px;max-height:${Math.round(Math.max(150,v.h-bottom-8))}px`;
    pos=`left:8px;${pos}`;
  }else{
    const maxH=Math.max(150,v.h-16),h=Math.min(est,maxH),left=Math.max(8,Math.min(v.w-width-8,p.x>v.w/2?p.x-width-14:p.x+14));
    pos=`left:${Math.round(left)}px;top:${Math.round(Math.max(8,Math.min(v.h-h-8,p.y-h/2)))}px;max-height:${Math.round(maxH)}px`;
  }
  return `<section class="table-pop${visit?' has-orders':''}${narrow?' narrow':''}" role="dialog" aria-label="${t.no}번 테이블" style="${pos};width:${width}px"><header><b class="pop-name">${t.no}번 테이블</b>${count}${btn({action:'table.close',cls:'pop-close',label:'✕',title:'테이블 닫기'})}</header>${body}</section>`;
}
