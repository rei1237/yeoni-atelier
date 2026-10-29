import {ASSETS} from '../render/assets.js';
import {worldMeetingAccess} from '../game/world-meetings.js';
import {uiIcon} from './moonlight-ui.js';
import {WORLD_NAV} from './world-navigation-data.js';
import {huntVisitReason} from '../game/hunt-visits.js';
import { QUEST_STORIES } from '../data/quest-stories.js';
import { calendarOf, dateLabel, maxActionPoints } from '../game/calendar.js';
import { placeLock } from '../game/unlocks.js';
import { townCheck } from '../game/town.js';
import { questView } from '../game/economy.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
import { assetStyle, assetIcon } from './asset-html.js';
// 10-29 사용자 요청: 데스크톱(넓은 화면 + 마우스)은 원본 해상도 지도, 모바일은 경량본. 고해상도를 다 받기 전에는 경량본을 그대로 쓴다
const DESKTOP_MAP='(min-width: 1024px) and (hover: hover) and (pointer: fine)';
const worldMapStyle=id=>(globalThis.matchMedia?.(DESKTOP_MAP).matches&&assetStyle('ui/town-map-hd'))||assetStyle(id);
import { btn, esc } from './dom.js';

// 목적지·의뢰는 기존 상태를 읽는다. 화면 이동은 행동력이나 보상을 바꾸지 않는다.
export const WORLD_PLACES = [
  {id:'atelier',name:'연이의 아틀리에',x:51,y:80,who:'yeoni',desc:'따뜻한 한 잔을 준비하는 우리 카페'},
  {id:'moka',name:'모카 식재료점',x:17,y:56,who:'moka',desc:'신선한 재료와 특별한 레시피'},
  {id:'expand',name:'무성의 가구·꽃 상점',x:48,y:41,who:'museong',desc:'가구, 꽃, 그리고 더 넓은 카페'},
  {id:'luna',name:'루나의 쉼터',x:80,y:79,who:'luna',desc:'지친 동료가 잠시 쉬어 가는 곳'},
  {id:'finance',name:'청토끼 금융 센터',x:82,y:49,who:'cheongtokki',desc:'월정석 환전과 장부 정리'},
  {id:'gear',name:'윤달의 무기 공방',x:22,y:25,who:'yun',desc:'다음 원정을 위한 강화와 회복'},
  {id:'hunt',name:'영냥이의 사냥터',x:80,y:21,who:'neo_cat',desc:'영냥이와 떠나는 월정석 원정'},
  {id:'farm',name:'농장',x:18,y:83,who:'yeoni',desc:'씨앗을 심고 계절을 가꾸는 시간'},
];
export const QUEST_HOSTS = {
  q_first_serve:['luna','루나'], q_first_shift:['yeoni','연이'], q_first_repay:['cheongtokki','청토끼'],
  q_special_ingredient:['moka','모카'], q_first_moonstone:['neo_cat','영냥이'], q_first_exchange:['cheongtokki','청토끼'],
  q_expand:['museong','무성'], q_special_menu:['luna_sis','루나 언니'], q_new_companion:['neo','네오'],
};
const season = m => m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter';
const reward = r => [r.gold?`${r.gold.toLocaleString('ko-KR')}G`:'',...Object.entries(r.items||{}).map(([id,n])=>`${INGREDIENTS[id].name} ×${n}`),r.learn?`${MENUS[r.learn].name} 레시피`:''].filter(Boolean).join(' · ');
const status = q => q.claimed?'완료':q.claimable?'보상 받기':q.locked?'잠김':'진행 중';

export function worldScreenHtml(state, ui) {
  if (!state || !ui.screen) return '';
  return ui.screen==='quests'?questScreenHtml(state,ui):mapScreenHtml(state,ui);
}
export function mapScreenHtml(state,ui) {
  const meeting=worldMeetingAccess(state);
  const chosen=WORLD_PLACES.find(p=>p.id===ui.worldPlace);
  const lock=chosen?(placeLock(state,chosen.id)||(chosen.id!=='atelier'&&!townCheck(state).ok?townCheck(state).reason:'')):'';
  const mapStyle=worldMapStyle('ui/town-map-'+season(calendarOf(state.day).month));
  const nodes=WORLD_PLACES.map(p=>{
    const pin=WORLD_NAV.destinations.find(d=>d.id===p.id).pin, why=placeLock(state,p.id);
    const name=why?(p.id==='expand'?'가구와 꽃 상점':'잠긴 장소'):p.name;
    return `<button type="button" class="world-node ${why?'locked':''}" data-key="place-${p.id}" data-action="world.select" data-id="${p.id}" style="--x:${pin[0]*100}%;--y:${pin[1]*100}%" aria-label="${esc(name)}${why?' · 잠김':''}"><span class="world-pin">${why?uiIcon('lock'):'<span aria-hidden="true">✿</span>'}</span></button>`;
  }).join('');
  let card='';
  if(chosen&&ui.worldCardOpen){
    const pin=WORLD_NAV.destinations.find(d=>d.id===chosen.id).pin;
    const name=lock?(chosen.id==='expand'?'가구와 꽃 상점':'아직 닫힌 장소'):chosen.name;
    const actor=chosen.id==='expand'?'museong@museong_garden':chosen.who;
    const portrait=lock?'':`<span class="world-card-character" style="${assetStyle('actors/'+actor)}" aria-hidden="true"></span>`;
    const back=`<div class="world-card-back" aria-hidden="true"><span>☾</span><small>✿</small></div>`;
    const face=`<div class="world-card-front"><div class="world-card-heading"><span>${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ'][WORLD_PLACES.indexOf(chosen)]}</span><small>DESTINY ISLAND</small></div><div class="world-card-art ${lock?'concealed':''}" style="${lock?'':mapStyle+';background-position:'+(pin[0]*100)+'% '+(pin[1]*100)+'%'}">${portrait}${lock?uiIcon('lock'):''}</div><div class="world-card-copy"><small>✧ &nbsp; 재성의 섬 &nbsp; ✧</small><h2 id="world-card-name">${esc(name)}</h2><p>${esc(lock||(chosen.id==='hunt'&&huntVisitReason(state))||chosen.desc)}</p></div></div>`;
    const at=ui.worldAt||state.worldLocation||'atelier',here=chosen.id===at;
    card=`<div class="world-card-overlay"><button class="world-card-shade" data-action="world.card.close" aria-label="장소 카드 닫기"></button><section class="world-card-dialog" role="dialog" aria-modal="true" aria-labelledby="world-card-name"><button class="world-card-close" data-action="world.card.close" aria-label="장소 카드 닫기">×</button><div class="world-card-flip"><div class="world-card-inner">${back}${face}</div></div>${btn({action:'world.enter',args:{id:chosen.id},cls:'primary world-card-action',disabled:!!lock,title:lock||(here?'지금 머무는 곳 · 다시 열기':'이곳으로 가기'),label:lock?'아직 갈 수 없어요':here?'다시 들어가기':'이곳으로 가기'})}${btn({action:'world.card.close',cls:'world-card-again',label:'지도로 돌아가기'})}</section></div>`;
  }
  return `<section class="world-map-screen" aria-labelledby="world-title"><header class="world-header"><span class="world-botanical" aria-hidden="true">${assetIcon('ui/botanical_right')}</span><span class="world-brand-seal" aria-hidden="true">✿</span><div class="world-header-title"><h1 id="world-title">재성의 섬</h1><p>${esc(dateLabel(state))} · ${state.gold.toLocaleString('ko-KR')}G · 행동력 ${state.ap.left}</p></div><div class="world-tools">${btn({action:'world.quests',label:uiIcon('book')+'<span>부탁 노트</span>'})}${btn({action:'world.enter',args:{id:'atelier'},label:uiIcon('cup')+'<span>카페로</span>'})}</div></header>
  <div class="world-map-stage"><div class="world-map-title"><span aria-hidden="true">✧</span><div><b>꽃과 달빛의 산책</b><small>지도를 밀어 둘러보고 꽃 핀을 눌러요</small></div><div class="world-map-controls">${btn({action:'world.zoom',args:{delta:-0.5},title:'지도 축소',label:'−'})}${btn({action:'world.zoom',args:{delta:0.5},title:'지도 확대',label:'＋'})}</div></div><div class="world-map-viewport" tabindex="0" aria-label="재성의 섬 지도, 스크롤하여 이동"><div class="world-landmarks" style="--zoom:${ui.worldZoom||1};${mapStyle}" aria-label="섬의 목적지"><canvas class="world-traveler" width="128" height="128" role="img" aria-label="${ui.worldTrip?'목적지로 걷는 연이':'지도에서 기다리는 연이'}"></canvas>${nodes}</div></div>${!ui.worldTrip?`<div class="world-map-hint"><span aria-hidden="true">✿</span><div><b>꽃길을 따라, 섬 한 바퀴</b><p>카드를 열어 장소를 확인하고 여행을 시작해요.</p></div></div>`:''}${ui.worldTrip?`<div class="world-travel-tools" role="status"><span>${esc(WORLD_PLACES.find(p=>p.id===ui.worldTrip.id)?.name)}까지 걸어가요</span>${btn({action:'world.travel.skip',label:'바로 도착'})}${btn({action:'world.travel.cancel',label:'이동 취소'})}</div>`:''}</div><footer class="world-map-footer world-social-footer"><span>${esc(meeting.unlocked?(meeting.available.length?"새로운 초대장이 도착했어요":"네오와 친구들의 이야기"):meeting.hint)}</span>${btn({action:"sheet.open",args:{sheet:"worldcast"},disabled:!meeting.unlocked,label:uiIcon(meeting.unlocked?"crew":"lock")+(meeting.unlocked?(meeting.available.length?"초대장 확인":"데스티노바 만나기"):"데스티노바 · 잠김")})}</footer>${card}</section>`;
}
export function questScreenHtml(state,ui) {
  const quests=questView(state), host=ui.questHost||'all';
  const hosts=[...new Set(quests.map(q=>QUEST_HOSTS[q.id]?.[0]||'yeoni'))];
  const rows=quests.filter(q=>host==='all'||QUEST_HOSTS[q.id]?.[0]===host);
  const selected=rows.find(q=>q.id===ui.questId)||rows.find(q=>q.claimable)||rows.find(q=>!q.claimed)||rows[0];
  const [who,name]=QUEST_HOSTS[selected?.id]||['yeoni','연이'];
  const story=QUEST_STORIES[selected?.id],line=story?(selected.claimed?story.after:story.reason):selected?.desc;
  const detail=selected?`<div class="quest-detail"><button class="quest-list-back" data-action="quest.list">‹ 의뢰 목록</button><span class="quest-state">${status(selected)}</span><h2>${esc(selected.title)}</h2><section class="quest-story"><h3>${selected.claimed?'함께 남긴 이야기':'부탁을 남긴 이유'}</h3><p>${esc(line)}</p></section><p class="quest-objective"><b>이번 목표</b> ${esc(selected.desc)}</p><label>진행 <b>${Math.min(selected.progress,selected.goal)} / ${selected.goal}</b><progress max="${selected.goal}" value="${Math.min(selected.progress,selected.goal)}" aria-label="${esc(selected.title)} 진행"></progress></label><div class="quest-reward"><h3>완료 보상</h3><p>${esc(reward(selected.reward))}</p></div>${btn({action:'quest.claim',args:{id:selected.id},cls:'quest-claim',disabled:!selected.claimable,title:selected.claimed?'이미 보상을 받았어요':selected.claimable?'보상 받기':'목표를 달성하면 받을 수 있어요',label:selected.claimed?'보상 수령 완료':selected.claimable?'보상 받기':'목표를 달성해 주세요'})}</div>`:'<p>아직 열린 부탁이 없어요. 카페에서 하루를 이어 가세요.</p>';
  return `<section class="quest-screen ${ui.questDetail?'show-detail':''}" aria-labelledby="quest-title" style="${assetStyle('backgrounds/cafe_room')}"><header class="world-header"><div><h1 id="quest-title">인연의 부탁 노트</h1><p>함께 만들어 가는 카페의 하루</p></div>${btn({action:'world.back',label:ui.questReturn==='world'?'지도로':'카페로'})}</header><div class="quest-layout"><section class="quest-paper"><div class="quest-botanical" aria-hidden="true">${assetIcon('ui/botanical_left')}${assetIcon('ui/botanical_right')}</div><nav class="quest-hosts" aria-label="부탁한 친구">${btn({action:'quest.host',args:{id:'all'},cls:host==='all'?'selected':'',label:'전체'})}${hosts.map(id=>btn({action:'quest.host',args:{id},cls:host===id?'selected':'',title:Object.values(QUEST_HOSTS).find(h=>h[0]===id)?.[1],label:assetIcon('badges/'+id,id)})).join('')}</nav><div class="quest-list-pane"><div class="quest-list" aria-label="의뢰 목록">${rows.map(q=>`<button data-key="quest-${q.id}" class="quest-entry ${q.id===selected?.id?'selected':''}" data-action="quest.select" data-id="${q.id}" aria-pressed="${q.id===selected?.id}"><small>${esc(QUEST_HOSTS[q.id]?.[1]||'연이')} · ${status(q)}</small><b>${esc(q.title)}</b><span>${Math.min(q.progress,q.goal)} / ${q.goal}</span></button>`).join('')||'<p>이 친구의 부탁은 아직 없어요.</p>'}</div><aside class="quest-character"><img class="quest-portrait" data-key="quest-portrait-${esc(who)}" src="${ASSETS.portraits[who]?.path||ASSETS.portraits.yeoni.path}" alt="${esc(name)}"><div class="quest-dialogue"><b>${esc(name)}</b><p>${esc(line||'오늘의 부탁을 함께 살펴봐요.')}</p></div></aside></div>${detail}</section></div></section>`;
}
