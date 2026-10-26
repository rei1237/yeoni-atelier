import { hunterProgress,maxHuntDepth,depthScale,stageName } from '../game/hunt-growth.js';
import { huntCheck,monthScale } from '../game/hunt.js';
import { stageDef,stagePool,bossFor } from '../data/hunt-stages.js';
import { ENEMIES } from '../data/hunt-kit.js';
import { calendarOf } from '../game/calendar.js';
import { btn,esc } from './dom.js';
import { TEMP } from '../config/balance.temp.js';
import { SUPPLIES } from '../game/moka-armory.js';
export function huntPrepSheet(state,ui) {
 const hunterId=ui.hunterId==='seohanbi'&&state.roster.seohanbi?'seohanbi':'neo',p=hunterProgress(state.hunter.xp),max=maxHuntDepth(state),chk=huntCheck(state,hunterId);
 const selected=Math.min(max,Math.max(1,Number(ui.huntStage)||state.hunter.builds?.[hunterId]?.stage||state.hunter.lastStage||1)),scale=depthScale(selected,monthScale(state.day),calendarOf(state.day).monthIdx);
 return `<h2>달그늘 사냥터${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><div class="hunter-select">${['neo',...(state.roster.seohanbi?['seohanbi']:[])].map(id=>btn({action:'hunt.hunter',args:{id},cls:id===hunterId?'on':'',label:`<canvas data-talking-portrait="${id==='neo'?'neo_cat':'seohanbi_tiger'}" width="96" height="144" aria-hidden="true"></canvas><b>${id==='neo'?'영냥이':'서한비 · 검은 호랑이'}</b>`})).join('')}</div>
 <div class="card"><b>탐사 성장 Lv.${p.level}</b>${p.level>TEMP.HUNT_CAREER.statCap?`<span class="small"> · 체력·피해 보너스는 Lv${TEMP.HUNT_CAREER.statCap}까지</span>`:''}<progress value="${p.xp}" max="${p.xpNext}" aria-label="지속 성장 경험치"></progress><p>경험치 ${p.xp}/${p.xpNext} · 사냥 레벨·선택한 무기와 보조 능력·마지막 단계는 사냥꾼별로 유지돼요. 공방 강화와 물품은 별도로 적용돼요. 성장 보너스는 Lv${TEMP.HUNT_CAREER.statCap}에서 멈추고, 기술 레벨 상한은 윤달 공방 단련으로 올려요.</p></div>
 <p class="small note-heal">사냥터에는 회복 아이템이 없어요 · 모카의 회복 수프를 챙겨 가세요(최대 ${SUPPLIES.tonic.limit}개 · 보유 ${state.armory?.supplies?.tonic||0}개)</p>
 <p>행동력 1 · 보스를 쓰러뜨리면 클리어 · 언제든 돌아오기</p><h3>${selected}/100단계 · ${stageName(selected)}</h3><p class="small">적 체력 ×${scale.hp.toFixed(1)} · 피해 ×${scale.dmg.toFixed(1)} · 월정석 ×${scale.reward.toFixed(1)}</p>
 <div class="stage-picker"><label for="hunt-stage">도전할 단계</label><input id="hunt-stage" type="range" min="1" max="${max}" value="${selected}" aria-label="사냥 단계"><output>${selected} / 열린 ${max}</output></div><div class="btns">${[...new Set([1,Math.max(1,selected-1),Math.min(max,selected+1),max])].map(depth=>btn({action:'hunt.stage',args:{depth},cls:depth===selected?'on':'',label:`${depth}단계`})).join('')}</div>
 <p class="small">보스 <b>${esc(ENEMIES[bossFor(selected,hunterId,!!state.roster.seohanbi)].name)}</b> · 준비 ${stageDef(selected).prepMs/1000}초 뒤 등장 · 나오는 적: ${stagePool(selected).map(([id])=>esc(ENEMIES[id].name)).join(', ')}</p>${hunterId==='seohanbi'?'<p class="ok">검은 호랑이: 기본 체력 +120 · 피해 +80%p · 이동과 수집 강화</p>':''}
 ${!chk.ok?`<p role="status">${esc(chk.reasons.join(' · '))}</p>`:''}<div class="stack">${btn({action:'hunt.depart',args:{depth:selected},cls:'primary big',disabled:!chk.ok,label:`${selected}단계로 출발`})}${btn({action:'sheet.open',args:{sheet:'armory'},label:'윤달의 무기 공방 · 영구 강화'})}</div><p class="small muted">준비 시간 동안 잡몹을 상대하면 그 단계 보스가 반드시 나와요. 보스를 쓰러뜨리면 클리어 · 다음 단계가 열리고, 바로 이어 가거나 귀환해 정산할 수 있어요. 첫 클리어는 월정석 보너스가 한 번 붙어요.</p>`;
}
