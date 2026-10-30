import {HUNT_CAST,hunterUnlocked,hunterName,hunterPortrait,selectedHunter} from '../game/hunt-cast.js';
import { hunterProgress,maxHuntDepth,depthScale,stageName } from '../game/hunt-growth.js';
import { huntCheck,monthScale } from '../game/hunt.js';
import { stageDef,stagePool,bossFor } from '../data/hunt-stages.js';
import { ENEMIES,WEAPONS,PASSIVES } from '../data/hunt-kit.js';
import { HUNT_ACHIEVEMENTS,achievementMoon } from '../data/hunt-achievements.js';
import { CODEX_MATERIALS } from '../game/hunt-codex.js';
import { INGREDIENTS } from '../data/menus.js';
import { calendarOf } from '../game/calendar.js';
import { btn,esc } from './dom.js';
import { TEMP } from '../config/balance.temp.js';
import { SUPPLIES,SKILL_IDS,skillRank,skillCap,capLevels } from '../game/moka-armory.js';

// 사냥 대화상자·사냥터 메인 공용 장식 줄(금 선·꽃잎·초승달)
export const NIGHT_ORN = '<svg class="night-orn" viewBox="0 0 160 20" aria-hidden="true"><path d="M8 10H60M100 10H152" stroke="#D9B26A" stroke-opacity=".75" stroke-width="1"/><circle cx="56" cy="10" r="1.4" fill="#D9B26A"/><circle cx="104" cy="10" r="1.4" fill="#D9B26A"/><ellipse cx="68" cy="10" rx="4.5" ry="1.9" fill="#E7A3B5"/><ellipse cx="92" cy="10" rx="4.5" ry="1.9" fill="#E7A3B5"/><path d="M83 3A7 7 0 1 0 83 17A8 8 0 0 1 83 3Z" fill="#F6E3B4"/></svg>';
const num=n=>Number(n||0).toLocaleString('ko-KR');
const close=()=>btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'});
const head=title=>`<h2 class="hh-head">${btn({action:'hunt.menu',args:{menu:'title'},cls:'ghost hh-back',label:'‹',title:'사냥터 메인으로'})}<span>${title}</span>${close()}</h2>`;
const achieved=state=>HUNT_ACHIEVEMENTS.filter(a=>state.ledger.achievements?.[a.id]).length;
const pickHunter=(state,ui)=>selectedHunter(state,ui.hunterId);
function codexPercent(state){
 const c=state.huntCodex||{},parts=[[SKILL_IDS.filter(id=>skillRank(state,id)>0).length,SKILL_IDS.length],[Object.keys(c.evolved||{}).length,Object.keys(WEAPONS).length],[Object.keys(ENEMIES).filter(id=>id in (c.enemies||{})).length,Object.keys(ENEMIES).length],[CODEX_MATERIALS.filter(id=>c.materials?.[id]>0).length,CODEX_MATERIALS.length]];
 return Math.floor(parts.reduce((a,[g])=>a+g,0)*100/parts.reduce((a,[,t])=>a+t,0));
}

// 사냥터 메인(타이틀) → 출발·업적·수집 도감. 메뉴 전환은 UI 상태(ui.huntMenu)만 바꾼다
export function huntPrepSheet(state,ui) {
 const m=ui.huntMenu;
 return `<div class="hunt-home">${m==='depart'?departView(state,ui):m==='achieve'?achieveView(state):m==='codex'?codexView(state):titleView(state,ui)}</div>`;
}

function titleView(state,ui){
 const id=pickHunter(state,ui),p=hunterProgress(state.hunter.xp);
 return `<div class="hh-top">${close()}</div>
 <div class="hh-logo"><small>꽃과 달의 밤 사냥</small><h2>영냥이의 사냥터</h2>${NIGHT_ORN}<p>달빛이 꽃잎에 내려앉는 밤, 그림자를 쫓아 월정석을 모아요</p></div>
 <div class="hh-hero" aria-hidden="true"><canvas data-talking-portrait="${hunterPortrait(id)}" width="256" height="320"></canvas></div>
 <dl class="hh-stats"><div><dt>탐사 성장</dt><dd>Lv.${p.level}</dd></div><div><dt>열린 단계</dt><dd>${maxHuntDepth(state)}/100</dd></div><div><dt>누적 처치</dt><dd>${num(state.hunter.kills)}</dd></div></dl>
 <nav class="hh-menu" aria-label="사냥터 메뉴">${btn({action:'hunt.menu',args:{menu:'depart'},cls:'primary big',label:'출발'})}${btn({action:'hunt.menu',args:{menu:'achieve'},label:`업적<small>${achieved(state)}/${HUNT_ACHIEVEMENTS.length}</small>`})}${btn({action:'hunt.menu',args:{menu:'codex'},label:`수집 도감<small>${codexPercent(state)}%</small>`})}</nav>`;
}

function departView(state,ui){
 const hunterId=pickHunter(state,ui),p=hunterProgress(state.hunter.xp),max=maxHuntDepth(state),chk=huntCheck(state,hunterId);
 const selected=Math.min(max,Math.max(1,Number(ui.huntStage)||state.hunter.builds?.[hunterId]?.stage||state.hunter.lastStage||1)),scale=depthScale(selected,monthScale(state.day, state.calendar?.turnsPerMonth || 3),calendarOf(state.day, state.calendar?.turnsPerMonth || 3).monthIdx);
 return `${head('출발 준비')}<div class="hunter-select">${HUNT_CAST.map(id=>{const open=hunterUnlocked(state,id);return btn({action:'hunt.hunter',args:open?{id}:{},disabled:!open,title:open?hunterName(id):'잠긴 동료',cls:open?(id===hunterId?'on':''):'hunter-locked',label:`<canvas data-talking-portrait="${hunterPortrait(id)}" width="256" height="320" aria-hidden="true"></canvas><b>${open?hunterName(id):'🔒 잠긴 동료'}</b>`});}).join('')}</div>
 <div class="card hunter-growth-card"><b>탐사 성장 Lv.${p.level}</b>${p.level>TEMP.HUNT_CAREER.statCap?`<span class="small"> · 체력·피해 보너스는 Lv${TEMP.HUNT_CAREER.statCap}까지</span>`:''}<progress value="${p.xp}" max="${p.xpNext}" aria-label="지속 성장 경험치"></progress><p>경험치 ${p.xp}/${p.xpNext} · 사냥 레벨·선택한 무기와 보조 능력·마지막 단계는 사냥꾼별로 유지돼요. 공방 강화와 물품은 별도로 적용돼요. 성장 보너스는 Lv${TEMP.HUNT_CAREER.statCap}에서 멈추고, 기술 레벨 상한은 윤달 공방의 상한 해방으로 풀어요.</p></div>
 <p class="small note-heal">폭탄은 윤달의 무기 공방에서 1개까지 구매해요 · 사냥터에는 회복 아이템이 없어요 · 모카의 회복 수프를 챙겨 가세요(최대 ${SUPPLIES.tonic.limit}개 · 보유 ${state.armory?.supplies?.tonic||0}개)</p>
 <p>행동력 1 · 보스를 쓰러뜨리면 클리어 · 언제든 돌아오기</p><h3>${selected}/100단계 · ${stageName(selected)}</h3><p class="small">적 Lv.${selected} · 체력 ×${scale.hp.toFixed(1)} · 피해 ×${scale.dmg.toFixed(1)} · 월정석 ×${scale.reward.toFixed(1)}</p>
 <div class="stage-picker"><label for="hunt-stage">도전할 단계</label><input id="hunt-stage" type="range" min="1" max="${max}" value="${selected}" aria-label="사냥 단계"><output>${selected} / 열린 ${max}</output></div><div class="btns">${[...new Set([1,Math.max(1,selected-1),Math.min(max,selected+1),max])].map(depth=>btn({action:'hunt.stage',args:{depth},cls:depth===selected?'on':'',label:`${depth}단계`})).join('')}</div>
 <p class="small">보스 <b>${esc(ENEMIES[bossFor(selected,hunterId,!!state.roster.seohanbi)].name)}</b> · 준비 ${stageDef(selected).prepMs/1000}초 뒤 등장 · 나오는 적: ${stagePool(selected).map(([id])=>esc(ENEMIES[id].name)).join(', ')}</p>${hunterId==='seohanbi'?'<p class="ok">검은 호랑이: 초승달 일섬으로 가까운 적을 베어요 · 기본 체력 +120 · 피해 +80%p · 이동과 수집 강화</p>':''}
 ${hunterId==='yeoni_pig'?'<p class="ok">꽃잎 산탄총은 앞쪽으로 다섯 발을 쏴요. 적을 처치해 꽃잎포를 충전하고, 100이 되면 직접 발사하세요.</p>':''}
 ${!chk.ok?`<p role="status">${esc(chk.reasons.join(' · '))}</p>`:''}<div class="stack">${btn({action:'hunt.depart',args:{depth:selected},cls:'primary big',disabled:!chk.ok,label:`${selected}단계로 출발`})}${btn({action:'sheet.open',args:{sheet:'armory'},label:'윤달의 무기 공방 · 영구 강화'})}</div><p class="small muted">준비 시간 동안 잡몹을 상대하면 그 단계 보스가 반드시 나와요. 보스를 쓰러뜨리면 클리어 · 다음 단계가 열리고, 바로 이어 가거나 귀환해 정산할 수 있어요. 첫 클리어는 월정석 보너스가 한 번 붙어요.</p>`;
}

function achieveView(state){
 const led=state.ledger.achievements||{};
 return `${head(`업적<small>${achieved(state)}/${HUNT_ACHIEVEMENTS.length}</small>`)}<ul class="hh-list">${HUNT_ACHIEVEMENTS.filter(a=>a.id!=='hanbi'||state.roster.seohanbi||state.ledger.story['hanbi:30']).map(a=>{const got=!!led[a.id],pr=!got&&a.goal?a.goal(state):null;
  return `<li class="hh-ach${got?' got':''}"><i aria-hidden="true">${a.icon}</i><div><b>${esc(a.name)}</b><span class="small">${esc(a.desc)}${pr?` · ${num(Math.min(pr[0],pr[1]))}/${num(pr[1])}`:''}</span></div><em>${got?'달성':`월정석 ${achievementMoon(a.id)}`}</em></li>`;}).join('')}</ul><p class="small muted">업적은 사냥에서 돌아와 정산할 때 확인하고, 보상 월정석은 한 번만 받아요.</p>`;
}

function codexView(state){
 const c=state.huntCodex||{};
 const skills=SKILL_IDS.map(id=>{const d=WEAPONS[id]||PASSIVES[id],r=skillRank(state,id),evo=WEAPONS[id]?.evo;
  return `<li class="hh-cell${r?'':' unknown'}"><i aria-hidden="true">${d.icon}</i><b>${r?esc(d.name):'???'}</b><span class="small">${r?`상한 Lv ${skillCap(id,r,capLevels(state))}`:'윤달 공방 기술서'}${evo&&r?`<br>${c.evolved?.[id]?`진화 ${esc(evo.name)}`:'진화 ???'}`:''}</span></li>`;}).join('');
 const foes=Object.entries(ENEMIES).map(([id,d])=>{const n=c.enemies?.[id],known=n!==undefined;
  return `<li class="hh-cell foe${known?'':' unknown'}${d.boss?' boss':''}"><canvas data-codex-actor="${esc(d.art||id)}" width="128" height="128" aria-hidden="true"></canvas><b>${known?esc(d.name):'???'}</b><span class="small">${known?(n>0?`처치 ${num(n)}`:'만남'):d.boss?'보스':'미발견'}</span></li>`;}).join('');
 const mats=CODEX_MATERIALS.map(id=>{const n=c.materials?.[id]||0;
  return `<li class="hh-cell${n?'':' unknown'}"><i aria-hidden="true">❀</i><b>${n?esc(INGREDIENTS[id].name):'???'}</b><span class="small">${n?`${num(n)}개 얻음`:'미발견'}</span></li>`;}).join('');
 return `${head(`수집 도감<small>${codexPercent(state)}%</small>`)}<h3>기술</h3><ul class="hh-grid">${skills}</ul><h3>만난 적 · 보스</h3><ul class="hh-grid foes">${foes}</ul><h3>희귀 재료 · 상자</h3><ul class="hh-grid">${mats}</ul><p class="small">연 희귀 상자 ${num(c.chests)}개 · 기록은 사냥에서 돌아와 정산할 때 쌓여요</p>`;
}
