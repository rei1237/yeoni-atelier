import { UPGRADES, SUPPLIES, upgradeLevel, upgradeCost, armory } from '../game/moka-armory.js';
import { bondTier } from '../data/bonds.js';
import { btn } from './dom.js';
import { assetIcon } from './asset-html.js';
export function armorySheet(state,ui) {
 const who=ui.hunterId==='seohanbi' && state.roster.seohanbi?'seohanbi':'neo', tier=bondTier(state.affinity.moka||0), prep=state.mode==='prep';
 return `<h2>모카의 무기 공방${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2>
 <div class="shop-intro"><canvas data-talking-portrait="moka" width="100" height="150" aria-hidden="true"></canvas><div><b>무사히 돌아와. 다음 장비도 준비해 둘게.</b><p>월정석 ${state.moonstone}개 · 모카 인연 ${tier}/4</p>${btn({action:'bond.talk',args:{id:'moka'},label:'모카와 이야기하기'})}</div></div>
 <div class="btns">${['neo',...(state.roster.seohanbi?['seohanbi']:[])].map(id=>btn({action:'hunt.hunter',args:{id},cls:id===who?'on':'',label:id==='neo'?'영냥이':'서한비'})).join('')}</div>
 <p class="small">사냥꾼마다 강화가 따로 저장돼요. 강화 상한은 없고, 다음 가격은 조금씩 올라갑니다. 카페 접대 능력에는 영향을 주지 않아요.</p>
 <div class="list">${Object.entries(UPGRADES).map(([id,d])=>{const cost=upgradeCost(state,who,id);return `<article class="card upgrade-row">${assetIcon(`skills/${id==='power'?'paw':id==='vitality'?'fish_stock':'whisker'}`)}<div><b>${d.name} +${upgradeLevel(state,who,id)}</b><p>${d.detail}</p>${btn({action:'armory.enhance',args:{id,who},disabled:!prep||state.moonstone<cost,label:`강화 · 월정석 ${cost}`})}</div></article>`;}).join('')}</div>
 <h3>사냥 가방</h3><div class="supply-grid">${Object.entries(SUPPLIES).map(([id,d])=>`<article class="card">${assetIcon(`skills/${d.icon}`)}<b>${d.name}</b><p>${d.detail}</p><small>보유 ${armory(state).supplies[id]||0}개</small>${btn({action:'armory.buy',args:{id},disabled:!prep||tier<d.tier||state.moonstone<d.cost,label:tier<d.tier?`모카 인연 ${d.tier}에서 열림`:`구매 · 월정석 ${d.cost}`})}</article>`).join('')}</div>`;
}
