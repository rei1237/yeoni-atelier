import { hunterProgress,maxHuntDepth,depthScale,stageName } from '../game/hunt-growth.js';
import { huntCheck,monthScale } from '../game/hunt.js';
import { calendarOf } from '../game/calendar.js';
import { btn,esc } from './dom.js';
export function huntPrepSheet(state,ui) {
 const hunterId=ui.hunterId==='seohanbi'&&state.roster.seohanbi?'seohanbi':'neo',p=hunterProgress(state.hunter.xp),max=maxHuntDepth(state),chk=huntCheck(state,hunterId);
 const selected=Math.min(max,Math.max(1,Number(ui.huntStage)||state.hunter.builds?.[hunterId]?.stage||state.hunter.lastStage||1)),scale=depthScale(selected,monthScale(state.day),calendarOf(state.day).monthIdx);
 return `<h2>달그늘 사냥터${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><div class="hunter-select">${['neo',...(state.roster.seohanbi?['seohanbi']:[])].map(id=>btn({action:'hunt.hunter',args:{id},cls:id===hunterId?'on':'',label:`<canvas data-talking-portrait="${id==='neo'?'neo_cat':'seohanbi_tiger'}" width="96" height="144" aria-hidden="true"></canvas><b>${id==='neo'?'영냥이':'서한비 · 검은 호랑이'}</b>`})).join('')}</div>
 <div class="card"><b>탐사 성장 Lv.${p.level}</b><progress value="${p.xp}" max="${p.xpNext}" aria-label="지속 성장 경험치"></progress><p>경험치 ${p.xp}/${p.xpNext} · 사냥 레벨·선택한 무기와 보조 능력·마지막 단계는 사냥꾼별로 유지돼요. 공방 강화와 물품은 별도로 적용돼요.</p></div>
 <p>행동력 1 · 쓰러질 때까지 생존 · 언제든 돌아오기</p><h3>${selected}/100단계 · ${stageName(selected)}</h3><p class="small">적 체력 ×${scale.hp.toFixed(1)} · 피해 ×${scale.dmg.toFixed(1)} · 월정석 ×${scale.reward.toFixed(1)}</p>
 <div class="stage-picker"><label for="hunt-stage">도전할 단계</label><input id="hunt-stage" type="range" min="1" max="${max}" value="${selected}" aria-label="사냥 단계"><output>${selected} / 열린 ${max}</output></div><div class="btns">${[...new Set([1,Math.max(1,selected-1),Math.min(max,selected+1),max])].map(depth=>btn({action:'hunt.stage',args:{depth},cls:depth===selected?'on':'',label:`${depth}단계`})).join('')}</div>
 <p class="small">초반 청토끼 정찰병 · 35단계 청토끼 부대 · 55단계 변이 청토끼 · 85단계부터 매우 강한 흑월의 파편</p>${hunterId==='seohanbi'?'<p class="ok">검은 호랑이: 기본 체력 +120 · 피해 +80%p · 이동과 수집 강화</p>':''}
 ${!chk.ok?`<p role="status">${esc(chk.reasons.join(' · '))}</p>`:''}<div class="stack">${btn({action:'hunt.depart',args:{depth:selected},cls:'primary big',disabled:!chk.ok,label:`${selected}단계로 출발`})}${btn({action:'sheet.open',args:{sheet:'armory'},label:'윤달의 무기 공방 · 영구 강화'})}</div><p class="small muted">3분을 버티고 정산하면 다음 단계가 열려요. 이후에도 계속 버틸 수 있고, 생존 시간에 따라 추가 월정석과 요리 재료를 받아요.</p>`;
}
