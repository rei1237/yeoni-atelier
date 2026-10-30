import {arcanaSymbol} from './arcana.js';
import {worldMeetingAccess} from '../game/world-meetings.js';
import {DEST1NOVA_MEMBERS} from '../data/dest1nova-profiles.js';
import {recruitView} from '../game/economy.js';
import {townCheck} from '../game/town.js';
import {assetIcon} from './asset-html.js';
import {btn,esc} from './dom.js';
export function worldCastSheet(s){
 const access=worldMeetingAccess(s);
 if(!access.unlocked)return `<h2>아직 도착하지 않은 초대장${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p>${esc(access.hint)}</p><p>그때의 만남 이야기를 통해 새로운 동료와 인연을 맺어요.</p>`;
 const rows=recruitView(s),canMeet=townCheck(s).ok;
 return `<h2>데스티노바와 만나는 시간${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2>${access.available.map(x=>`<section class="world-invitation"><h3>${esc(x.name)}의 초대장</h3><p>${esc(x.meetEvent?.title||'새로운 만남')}</p>${btn({action:'recruit.event',args:{id:x.id},disabled:!canMeet,label:'만남 이야기 시작'})}</section>`).join('')}<p>함께하는 멤버에게 대화와 선물을 전하거나, 새로운 만남의 초대장을 확인해요.</p><div class="world-cast-list">${DEST1NOVA_MEMBERS.map(p=>{
 const r=rows.find(x=>x.id===p.id),joined=!!s.roster[p.id],ready=r?.status==='available',c=r?.condition;
 const condition=joined?'함께하는 동료':ready?'초대장이 도착했어요':`${c.year}년차 ${c.month}월부터 · 네오 인연 ${s.affinity.neo||0}/${c.neoAffinity}`;
 return `<article class="world-cast-person ${joined?'joined':ready?'ready':'waiting'}"><span class="world-cast-face">${assetIcon('badges/'+p.id)}</span><div><h3>${esc(p.name)} <small>${esc(p.position)}</small></h3><p>${esc(p.tagline)}</p>${arcanaSymbol(p.id)}<small>${esc(condition)}</small>${!joined&&!ready?'<small>조건을 채운 뒤 해당 월에 만나요. 놓치면 다음 해 같은 달에 다시 찾아와요.</small>':''}<div>${joined?btn({action:'world.companion',args:{id:p.id},disabled:!canMeet,label:'대화 · 선물'}):btn({action:'recruit.event',args:{id:p.id},disabled:!ready||!canMeet,label:ready?'초대장 열기':'만남을 기다리는 중'})}</div></div></article>`;
 }).join('')}</div><p class="small">영입을 마친 동료는 다음 영업부터 직원 배치에서 선택할 수 있어요.</p>`;
}
