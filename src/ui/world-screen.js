import { calendarOf, dateLabel, maxActionPoints } from '../game/calendar.js';
import { placeLock } from '../game/unlocks.js';
import { townCheck } from '../game/town.js';
import { questView } from '../game/economy.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
import { assetStyle, assetIcon } from './asset-html.js';
import { btn, esc } from './dom.js';

// 목적지·의뢰는 기존 상태를 읽는다. 화면 이동은 행동력이나 보상을 바꾸지 않는다.
export const WORLD_PLACES = [
  {id:'atelier',name:'연이의 아틀리에',x:51,y:80,who:'yeoni',desc:'따뜻한 한 잔을 준비하는 우리 카페'},
  {id:'moka',name:'모카 식재료점',x:17,y:56,who:'moka',desc:'신선한 재료와 특별한 레시피'},
  {id:'expand',name:'무성의 가구·꽃 상점',x:48,y:41,who:'museong',desc:'가구, 꽃, 그리고 더 넓은 카페'},
  {id:'luna',name:'루나의 쉼터',x:80,y:79,who:'luna',desc:'지친 동료가 잠시 쉬어 가는 곳'},
  {id:'finance',name:'청토끼 금융 센터',x:82,y:49,who:'cheongtokki',desc:'월정석 환전과 장부 정리'},
  {id:'gear',name:'윤달의 무기 공방',x:22,y:25,who:'yun',desc:'다음 원정을 위한 강화와 회복'},
  {id:'hunt',name:'달그늘 사냥터',x:80,y:21,who:'neo_cat',desc:'영냥이와 떠나는 월정석 원정'},
  {id:'farm',name:'꽃돼지 연이의 농장',x:18,y:83,who:'yeoni_pig',desc:'씨앗을 심고 계절을 가꾸는 시간'},
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
  const chosen=WORLD_PLACES.find(p=>p.id===ui.worldPlace)||WORLD_PLACES[0];
  const lock=chosen.id==='atelier'?'':placeLock(state,chosen.id)||(!townCheck(state).ok?townCheck(state).reason:'');
  const nodes=WORLD_PLACES.map(p=>{
    const why=placeLock(state,p.id);
    return `<button class="world-node ${p.id===chosen.id?'selected':''} ${why?'locked':''}" data-key="place-${p.id}" data-action="world.select" data-id="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-pressed="${p.id===chosen.id}" title="${esc(why||p.desc)}">${assetIcon('badges/'+p.who)}<span>${esc(p.name)}${why?'<small>잠김</small>':''}</span></button>`;
  }).join('');
  return `<section class="world-map-screen" aria-labelledby="world-title" style="${assetStyle('ui/town-map-'+season(calendarOf(state.day).month))}">
    <header class="world-header"><div><h1 id="world-title">재성의 섬</h1><p>${esc(dateLabel(state))} · 행동력 ${state.ap.left}/${maxActionPoints(state)}</p></div><div class="world-tools">${btn({action:'world.quests',label:'부탁 노트'})}${btn({action:'world.close',label:'카페로',title:'카페로 돌아가기'})}</div></header>
    <div class="world-landmarks" aria-label="마을 목적지">${nodes}</div>
    <section class="destination" aria-live="polite">${assetIcon('badges/'+chosen.who)}<div><h2>${esc(chosen.name)}</h2><p>${esc(lock||chosen.desc)}</p></div>${btn({action:'world.enter',args:{id:chosen.id},cls:'primary',disabled:!!lock,title:lock||chosen.name+' 방문하기',label:lock?'아직 닫혀 있어요':chosen.id==='atelier'?'카페로':'방문하기'})}</section>
  </section>`;
}
export function questScreenHtml(state,ui) {
  const quests=questView(state), host=ui.questHost||'all';
  const hosts=[...new Set(quests.map(q=>QUEST_HOSTS[q.id]?.[0]||'yeoni'))];
  const rows=quests.filter(q=>host==='all'||QUEST_HOSTS[q.id]?.[0]===host);
  const selected=rows.find(q=>q.id===ui.questId)||rows.find(q=>q.claimable)||rows.find(q=>!q.claimed)||rows[0];
  const [who,name]=QUEST_HOSTS[selected?.id]||['yeoni','연이'];
  const detail=selected?`<div class="quest-detail"><button class="quest-list-back" data-action="quest.list">‹ 의뢰 목록</button><span class="quest-state">${status(selected)}</span><h2>${esc(selected.title)}</h2><p>${esc(selected.desc)}</p><label>진행 <b>${Math.min(selected.progress,selected.goal)} / ${selected.goal}</b><progress max="${selected.goal}" value="${Math.min(selected.progress,selected.goal)}" aria-label="${esc(selected.title)} 진행"></progress></label><div class="quest-reward"><h3>완료 보상</h3><p>${esc(reward(selected.reward))}</p></div>${btn({action:'quest.claim',args:{id:selected.id},cls:'quest-claim',disabled:!selected.claimable,title:selected.claimed?'이미 보상을 받았어요':selected.claimable?'보상 받기':'목표를 달성하면 받을 수 있어요',label:selected.claimed?'보상 수령 완료':selected.claimable?'보상 받기':'목표를 달성해 주세요'})}</div>`:'<p>아직 열린 부탁이 없어요. 카페에서 하루를 이어 가세요.</p>';
  return `<section class="quest-screen ${ui.questDetail?'show-detail':''}" aria-labelledby="quest-title" style="${assetStyle('backgrounds/cafe_room')}"><header class="world-header"><div><h1 id="quest-title">인연의 부탁 노트</h1><p>함께 만들어 가는 카페의 하루</p></div>${btn({action:'world.back',label:ui.questReturn==='world'?'지도로':'카페로'})}</header><div class="quest-layout"><section class="quest-paper"><nav class="quest-hosts" aria-label="부탁한 친구">${btn({action:'quest.host',args:{id:'all'},cls:host==='all'?'selected':'',label:'전체'})}${hosts.map(id=>btn({action:'quest.host',args:{id},cls:host===id?'selected':'',title:Object.values(QUEST_HOSTS).find(h=>h[0]===id)?.[1],label:assetIcon('badges/'+id,id)})).join('')}</nav><div class="quest-list" aria-label="의뢰 목록">${rows.map(q=>`<button data-key="quest-${q.id}" class="quest-entry ${q.id===selected?.id?'selected':''}" data-action="quest.select" data-id="${q.id}" aria-pressed="${q.id===selected?.id}"><small>${esc(QUEST_HOSTS[q.id]?.[1]||'연이')} · ${status(q)}</small><b>${esc(q.title)}</b><span>${Math.min(q.progress,q.goal)} / ${q.goal}</span></button>`).join('')||'<p>이 친구의 부탁은 아직 없어요.</p>'}</div>${detail}</section><aside class="quest-character"><canvas class="quest-portrait" data-talking-portrait="${esc(who)}" width="320" height="384" role="img" aria-label="${esc(name)}"></canvas><div class="quest-dialogue"><b>${esc(name)}</b><p>${esc(selected?.desc||'오늘의 부탁을 함께 살펴봐요.')}</p></div></aside></div></section>`;
}
