import {cookingPose,yeoniCookSheet} from '../render/cooking-pose.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {cookingDifficulty as craftDifficulty,qualityForTiming,qualityOf} from '../data/cooking-quality.js';
import {MENUS,INGREDIENTS} from '../data/menus.js';
import {assetIcon,assetStyle} from './asset-html.js';
import {imageFor} from '../render/assets.js';
import {btn,esc} from './dom.js';
// 수동 조리 화면(표시 전용). 주문을 누르면 열리고 두 번 탭으로 끝난다: ① 재료 담아 젓기 ② 향/불이 가운데일 때 마무리 → 조리 시작.
// 실제 재료 차감·조리는 마무리 때 엔진 명령(order.quick/cook) 한 번으로만 일어난다. 재료가 모자라면 모카 긴급 배달을 먼저 띄운다.
// TEMP: 기본 메뉴는 넓고 느리게, 해금 단계가 높을수록 일정하게 어려워진다.
export {cookingDifficulty as craftDifficulty} from '../data/cooking-quality.js';
export function newCraft(menuId,orderId=null){return {menuId,orderId,step:0,heatAt:0,assist:false};}
export function mixCraft(c,now=performance.now()){if(c.step!==0)return false;c.step=1;c.heatAt=now;return true;}
export function craftHeat(c,now=performance.now()){return c.assist?50:Math.round((1-Math.cos(Math.max(0,now-c.heatAt)/craftDifficulty(c.menuId).speedMs))*50);}
export function craftQuality(value,menuId){return qualityOf(qualityForTiming(value,menuId)).label;}
// 화면의 단계와 남은 시간은 실제 엔진 작업에서만 읽는다.
export function craftProduction(state,c){
 const st=state.stations[MENUS[c.menuId]?.station];
 const job=c.purpose==='gift'?state.foodGifts?.job?.id===c.jobId?state.foodGifts.job:null:stationJobs(st||{}).find(j=>j&&j.id===c.jobId);
 if(job){const queued=c.purpose!=='gift'&&queuedJobs(st).includes(job),p=queued?0:Math.min(1,job.progressMs/job.durationMs);return {status:queued?'queued':'cooking',progress:p,remaining:Math.ceil((job.durationMs-(job.progressMs||0))/1000),pose:queued?null:cookingPose(job,MENUS[c.menuId].station),phase:queued?'queued':cookingPose(job,MENUS[c.menuId].station)?.phase||'plate',label:queued?'설비를 기다려요':p<.22?'재료를 준비해요':p<.82?(MENUS[c.menuId].station==='oven'?'오븐에서 구워요':'향을 추출하고 섞어요'):'접시에 담아요'};}
 const item=[...(c.purpose==='gift'?state.foodGifts?.items||[]:state.tray),...stationItems(st||{})].find(it=>it&&(it.jobId===c.jobId||c.purpose==='gift'&&it.id===c.jobId));
 if(item)return {status:'ready',progress:1,remaining:0,label:c.purpose==='gift'?'완성 · 선물 보관함':'완성 · 픽업 선반'};
 return {status:'finished',progress:1,remaining:0,label:'주방 작업을 마쳤어요'};
}
// 이 메뉴를 만들려면 더 필요한 재료 {id: 부족 수량}
export const deliverable=id=>!!(INGREDIENTS[id]?.basic||INGREDIENTS[id]?.shop);
export function craftIngredients(menuIds){const out={};for(const menu of [].concat(menuIds))for(const [id,n] of Object.entries(MENUS[menu]?.ingredients||{}))out[id]=(out[id]||0)+n;return out;}
export function craftShortage(state,menuId){const out={};for(const [id,n] of Object.entries(craftIngredients(menuId))){const lack=n-(state.stock[id]||0);if(lack>0)out[id]=lack;}return out;}
export function craftingSheet(state,ui){
 const c=ui.craft,m=MENUS[c?.menuId];if(!m)return '';
 const ingredients=craftIngredients(c.batchMenus||m.id),lack=craftShortage(state,c.batchMenus||m.id),short=Object.keys(lack).length>0,canDeliver=short&&Object.keys(lack).every(deliverable),finish=m.station==='oven'?'굽기':'추출·섞기',difficulty=craftDifficulty(m.id),production=c.step===2?craftProduction(state,c):null;
 const currentStep=production?.status==='ready'?3:c.step;
 const phase=production?.status==='ready'?'ready':c.step===2?'cooking':c.step===1?'mixing':'prepare';
 const pose=production?.pose,personal=c.purpose==='gift'&&(state.foodGifts?.job?.maker||'yeoni')==='yeoni';
 const bowl=cookStage(m,{personal,pose,phase,label:production?.label||(c.step===1?(m.station==='oven'?'오븐을 데워요':'향을 끌어올려요'):'재료를 꺼내요')});
 const need=`${c.tableNo?`<p>테이블 ${c.tableNo} · ${(c.batchMenus||[]).map(id=>esc(MENUS[id].short)).join(' + ')} 함께 조리</p>`:''}<div class="ingredient-basket">${Object.entries(ingredients).map(([id,n])=>`<div class="ing ${lack[id]?'lack':''}">${assetIcon('icons/'+id)}<b>${esc(INGREDIENTS[id].name)}</b><small>필요 ${n} · 보유 ${state.stock[id]||0}</small></div>`).join('')}</div>`;
 const body=c.step===2?`<h3>${esc(production.label)}</h3><progress class="craft-production" max="1" value="${production.progress}" aria-label="실제 조리 진행"></progress><p>${production.status==='cooking'?`남은 시간 ${production.remaining}초`:production.status==='queued'?'앞선 작업이 끝나면 시작해요.':production.status==='ready'?(c.purpose==='gift'?'선물 보관함에서 동료에게 전할 수 있어요.':'손님 테이블에서 전달하기를 눌러 주세요.'):'전달·취소 상태는 카페 주문 목록에서 확인하세요.'}</p><p class="craft-quality">${c.purpose==='gift'?'선물 음식 · 취향에 따라 인연 상승 · ':''}조리 품질 ${esc(c.quality)}${c.purpose==='gift'?' · 품질 추가 인연 보너스 없음':` · 음식 만족도 ${qualityOf(qualityForTiming(c.timing,c.menuId)).delta>=0?'+':''}${qualityOf(qualityForTiming(c.timing,c.menuId)).delta}점`}</p>${btn({action:'craft.cancel',cls:'primary big',label:c.purpose==='gift'?'보관함으로 돌아가기':'카페로 돌아가기'})}`:c.step===0
  ?`<h3>재료를 담아 준비해요</h3>${need}${short?`<p class="craft-lack">재료가 모자라요 · ${Object.entries(lack).map(([id,k])=>`${esc(INGREDIENTS[id].name)} ${k}개`).join(', ')}</p>${canDeliver?btn({action:'craft.restock',cls:'primary big',label:'모카 긴급 배달 부르기'}):'<p class="small">모카 가게에 없는 재료예요. 사냥이나 농장에서 구해 와요.</p>'}`:btn({action:'craft.mix',cls:'primary big',label:'재료 담아 섞기'})}`
  :`<h3>${m.station==='oven'?'오븐 온도를 맞춰요':'향이 오를 때 마무리해요'}</h3><div class="heat-track" role="img" aria-label="표시가 초록 구간에 오면 마무리"><span class="heat-sweetspot" style="left:${difficulty.min}%;width:${difficulty.width}%"></span><span class="heat-perfect" style="left:${difficulty.perfectMin}%;width:${difficulty.width/2}%"></span><i style="left:${craftHeat(c)}%"></i></div><p class="small">${difficulty.tier===0?'처음 메뉴 · 넓은 성공 구간':`조리 난도 ${difficulty.tier+1}단계`} · 초록 구간은 좋음, 가운데는 완벽이에요. 바깥은 보통으로 완성돼요.</p>${btn({action:'craft.heat',cls:'primary big',label:`${finish} 시작`})}${btn({action:'craft.assist',cls:'ghost craft-assist',label:c.assist?'타이밍 도움 켜짐 · 움직임 다시 켜기':'타이밍 도움 · 표시 멈추기'})}`;

 const steps=`<ol class="craft-steps" aria-label="조리 단계">${['재료 준비','타이밍',finish,c.purpose==='gift'?'보관함':'픽업'].map((x,i)=>`<li class="${i===currentStep?'current':i<currentStep?'done':''}"${i===currentStep?' aria-current="step"':''}><i>${i<currentStep?'✓':i+1}</i><span>${x}</span></li>`).join('')}</ol>`;
 return `<div class="cook-sheet${c.purpose==='gift'?' gift':''}"><h2>${esc(m.name)}${btn({action:'craft.cancel',cls:'close ghost',label:'✕',title:c.step===2?'닫기':'조리 취소'})}</h2>${steps}${bowl}${c.step===2&&c.tableNo?batchProgress(state,c):''}${body}<p class="small muted">${c.step===2&&c.purpose==='gift'?'창을 닫아도 조리는 계속돼요. 완성 음식은 손님 주문과 분리된 선물 보관함에 담아요.':c.step===2?'창을 닫아도 시작한 조리는 계속돼요. 품질은 이 음식의 만족도에 반영돼요. 대기시간과 분위기도 함께 계산해요.':'재료는 조리 시작 때 사용해요. 닫으면 준비 과정만 취소돼요.'}</p></div>`;
}

function batchProgress(s,c){return `<section class="batch-progress"><h3>${c.tableNo}번 테이블 함께 조리</h3>${(c.jobIds||[]).map(id=>{const st=Object.values(s.stations).find(st=>stationJobs(st).some(j=>j.id===id)),job=st&&stationJobs(st).find(j=>j.id===id),item=[...s.tray.filter(Boolean),...Object.values(s.stations).flatMap(st=>stationItems(st))].find(it=>it.jobId===id);const order=Object.values(s.orders).find(o=>o.jobId===id);return `<p>${esc(MENUS[job?.menuId||item?.menuId||order?.menuId]?.short||'주문')} · ${job?(queuedJobs(st).includes(job)?'설비 대기':Math.ceil((job.durationMs-job.progressMs)/1000)+'초 남음'):item?'완성 · 픽업 가능':order?.status==='served'?'전달 완료':'주방에서 확인'}</p>`;}).join('')}</section>`;}

// 요리 무대: 연이(선물)는 메뉴에 맞는 시트로 손에 든 소품을 다루고, 루나 언니(주문)는 설비 앞에서 일한다.
// 프레임은 CSS 스텝 애니메이션, 행(준비·조리·완성)만 실제 진행에서 고른다. 데스크톱은 2배 시트를 CSS로 받는다.
export function cookStage(m,{personal,pose,phase,label}){
 const oven=m.station==='oven',row=phase==='ready'||pose?.phase==='plate'?2:pose&&pose.phase!=='prepare'?1:0;
 const sheet=personal?(imageFor('actors/'+yeoniCookSheet(m.station))?'actors/'+yeoniCookSheet(m.station):'actors/yeoni_cook'):'actors/luna_sis_cook';
 const who=personal?'연이':'루나 언니',hd=personal&&sheet!=='actors/yeoni_cook'?` hd-${oven?'bake':'drink'}`:'';
 const chef=assetStyle(sheet)?`<div class="cook-chef ${personal?'yeoni':'luna-sis'}${hd}" role="img" aria-label="${who} ${esc(label)}" style="${assetStyle(sheet)};--row:${row}"></div>`:'';
 return `<div class="craft-worktop cook-stage ${phase} ${oven?'oven':'drink'} ${personal?'by-yeoni':'by-luna-sis'}"><span class="cook-moon" aria-hidden="true"></span><div class="cook-station">${assetIcon('objects/'+(oven?'oven':'drink'))}</div>${chef}<div class="cook-dish${phase==='ready'?' done':''}">${assetIcon('icons/'+m.id)}</div><ul class="cook-ingredients" aria-label="재료">${Object.keys(m.ingredients).map(id=>`<li>${assetIcon('icons/'+id)}</li>`).join('')}</ul><p class="cook-caption"><b>${esc(who)}</b> ${esc(label)}</p></div>`;
}
