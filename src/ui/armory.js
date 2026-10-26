import {yunQuestView,YUN_COMMISSION} from '../game/yun-quest.js';
import { UPGRADES, SUPPLIES, upgradeLevel, upgradeCost, armory } from '../game/moka-armory.js';
import { bondTier } from '../data/bonds.js';
import { btn } from './dom.js';
import { assetIcon } from './asset-html.js';
export function armorySheet(state,ui) {
 const who=ui.hunterId==='seohanbi' && state.roster.seohanbi?'seohanbi':'neo', tier=bondTier(state.affinity.moka||0), prep=state.mode==='prep';
 return `<h2>윤달의 무기 공방${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2>
 <div class="shop-intro"><canvas data-talking-portrait="yun" width="100" height="150" aria-hidden="true"></canvas><div><b>날보다 먼저 손잡이를 살피지. 네가 무사해야 하니까.</b><p>월정석 ${state.moonstone}개 · 윤달의 공방</p>${state.roster.yun?btn({action:'bond.talk',args:{id:'yun'},label:'윤달과 이야기하기'}):''}</div></div>
 <div class="btns">${['neo',...(state.roster.seohanbi?['seohanbi']:[])].map(id=>btn({action:'hunt.hunter',args:{id},cls:id===who?'on':'',label:id==='neo'?'영냥이':'서한비'})).join('')}</div>
 <p class="small">사냥꾼마다 강화가 따로 저장돼요. 강화 상한은 없고, 다음 가격은 조금씩 올라갑니다. 카페 접대 능력에는 영향을 주지 않아요.</p>
 <div class="list">${Object.entries(UPGRADES).map(([id,d])=>{const cost=upgradeCost(state,who,id);return `<article class="card upgrade-row">${assetIcon(`skills/${id==='power'?'paw':id==='vitality'?'fish_stock':'whisker'}`)}<div><b>${d.name} +${upgradeLevel(state,who,id)}</b><p>${d.detail}</p>${btn({action:'armory.enhance',args:{id,who},disabled:!prep||state.moonstone<cost,label:`강화 · 월정석 ${cost}`})}</div></article>`;}).join('')}</div>
 ${yunCommission(state)}`;
}
export function supplyShop(state){const tier=bondTier(state.affinity.moka||0),prep=state.mode==='prep';return `<h3>모카의 사냥 도시락과 보급품</h3><div class="supply-grid">${Object.entries(SUPPLIES).map(([id,d])=>`<article class="card">${assetIcon(`skills/${d.icon}`)}<b>${d.name}</b><p>${d.detail}</p><small>보유 ${armory(state).supplies[id]||0}개</small>${btn({action:'armory.buy',args:{id},disabled:!prep||tier<d.tier||state.moonstone<d.cost,label:tier<d.tier?`모카 인연 ${d.tier}에서 열림`:`월정석 ${d.cost}`})}</article>`).join('')}</div>`;}
function yunCommission(state){if(state.roster.yun)return '<p class="small ok">함께 돌아온 약속 · 윤달이 동료로 합류했어요.</p>';const q=yunQuestView(state);return `<section class="card"><h3>윤달의 부탁 · 손잡이에 남은 약속</h3><p>장비를 믿고 돌아오는 사람에게만 내 이야기를 맡기고 싶어.</p><p class="small">공방 이용 ${q.gold.toLocaleString()} / ${YUN_COMMISSION.gold.toLocaleString()}G 또는 월정석 ${q.moonstone} / ${YUN_COMMISSION.moonstone}개</p>${q.ready?btn({action:'recruit.event',args:{id:'yun'},cls:'primary',label:'윤달에게 돌아온 이야기 전하기'}):q.status==='active'?'<p class="ok">영냥이로 단계 보스 1마리 토벌 뒤 귀환 · 1단계는 준비 1분 뒤 거대한 검은 손이 나와요. 서한비의 토벌은 이 부탁에 포함되지 않아요.</p>':btn({action:'yun.quest',disabled:!q.eligible,label:'부탁 듣기 · 영냥이의 보스 토벌'})}</section>`;}
