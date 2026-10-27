import {SUPPLIES} from '../game/moka-armory.js';
import {supplyStatus} from '../game/hunt.js';
import {SUPPLY_ORDER,SUPPLY_SHORT} from '../data/hunt-supplies.js';
import {assetIcon} from './asset-html.js';
import {esc} from './dom.js';
export function huntSuppliesHtml(state){
 return `<div class="hunt-quickslots" role="group" aria-label="사냥 물품 · 숫자 1부터 5로 사용">${SUPPLY_ORDER.map((id,i)=>{
  const d=SUPPLIES[id],st=supplyStatus(state,id),detail=`${d.name} · ${st.count}개 · ${st.reason}`;
  return `<button data-action="hunt.supply" data-id="${id}" aria-disabled="${!st.ok}" aria-label="${esc(detail)}" aria-describedby="supply-help-${id}" title="${esc(detail)}"><span class="supply-art">${assetIcon('skills/'+d.icon)}<kbd>${i+1}</kbd><b>×${st.count}</b></span><span>${SUPPLY_SHORT[id]}</span><small>${st.leftMs?Math.ceil(st.leftMs/1000)+'초':st.ok?'사용':st.count?'대기':'없음'}</small><span class="supply-tooltip" id="supply-help-${id}" role="tooltip">${esc(d.detail)}<br>${esc(st.reason)}</span></button>`;
 }).join('')}</div>`;
}
