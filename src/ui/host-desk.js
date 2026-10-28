import {hostFeeQuote} from '../game/host-fees.js';
import {catCafeActive,catCafeUnlocked,CAT_CAFE_AFFINITY} from '../game/cat-cafe-rules.js';
import {personName} from '../game/state.js';
import {assetIcon} from './asset-html.js';
import {btn,esc} from './dom.js';
export function hostDeskHtml(s){
 if(!s.hostbar.open)return '';
 if(s.mode==='prep')return `<div class="host-desk host-prep"><b>${s.meta.hostDemo?'호스트 체험 카페':'호스트 카페'}</b><span>${s.meta.hostDemo?'홀·주방 자동 · 지명과 SOS에 집중해 보세요':'지명 손님을 맞을 동료를 준비해요'}</span>${btn({action:'sheet.open',args:{sheet:'staffing'},label:'배치'})}${btn({action:'sheet.open',args:{sheet:'outfits'},label:'의상'})}</div>`;
 if(s.mode!=='shift')return '';
 const visits=Object.values(s.visits).filter(v=>v.kind==='nomination'&&!v.settled&&Object.values(s.customers).some(c=>c.visitId===v.id&&['requesting','hosted'].includes(c.state)));
 visits.sort((a,b)=>Number(b.help?.some(h=>h.status==='open'))-Number(a.help?.some(h=>h.status==='open'))||Number(a.acceptAt!=null)-Number(b.acceptAt!=null));
 return visits.length?`<nav class="host-desk host-visits" aria-label="지명과 도움 요청">${visits.map(v=>{const help=v.help?.some(h=>h.status==='open'),request=v.acceptAt==null;return btn({action:'sheet.open',args:{sheet:'table',no:v.tableNo},cls:help?'host-sos':request?'host-request':'',label:assetIcon('badges/'+(v.nominee==='neo'&&catCafeActive(s)?'neo_cat':v.nominee))+`<span><b>${v.tableNo}번 · ${esc(personName(s,v.nominee))}</b><small>${help?'SOS · 도움 주기':request?'지명 '+hostFeeQuote(s,v).toLocaleString()+'G':'접대 '+Math.max(0,Math.ceil((v.endAt-s.shift.elapsedMs)/1000))+'초 남음'}</small></span>`});}).join('')}</nav>`:'';
}

export function catCafeControl(s){
 if(!s.hostbar.open)return '';
 const active=catCafeActive(s),unlocked=catCafeUnlocked(s);
 return `<section class="cat-cafe-control"><b>${active?'영냥이 카페 도우미':'네오와 영냥이'}</b><p>${unlocked?'인연 3단계 · 스트레스가 높아도 영냥이 모습으로 서빙·정리와 지명을 도울 수 있어요.':'네오 인연 '+(s.affinity.neo||0)+' / '+CAT_CAFE_AFFINITY+' · 3단계에서 영냥이 카페 근무가 열려요.'}</p>${btn({action:'neo.cafeForm',disabled:!unlocked,label:active?'네오로 돌아오기':'영냥이로 돕기'})}<small>같은 동료 한 명이에요. 접대·운반 중이나 휴무에는 바꿀 수 없어요.</small></section>`;
}
