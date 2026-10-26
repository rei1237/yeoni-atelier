import {MENUS,INGREDIENTS} from '../data/menus.js';
import {assetIcon,assetStyle} from './asset-html.js';
import {btn,esc} from './dom.js';
// 수동 조리 화면(표시 전용). 주문을 누르면 열리고 두 번 탭으로 끝난다: ① 재료 담아 젓기 ② 향/불이 가운데일 때 마무리 → 조리 시작.
// 실제 재료 차감·조리는 마무리 때 엔진 명령(order.quick/cook) 한 번으로만 일어난다. 재료가 모자라면 모카 긴급 배달을 먼저 띄운다.
export function newCraft(menuId,orderId=null){return {menuId,orderId,step:0,heatAt:0};}
export function mixCraft(c,now=performance.now()){if(c.step!==0)return false;c.step=1;c.heatAt=now;return true;}
export function craftHeat(c,now=performance.now()){return Math.round((1-Math.cos((now-c.heatAt)/800))*50);}
export const craftQuality=value=>value>=35&&value<=65?'향이 딱 알맞게 어우러졌어요!':'따뜻하게 준비됐어요. 다음엔 가운데에서 맞춰 봐요.';
// 이 메뉴를 만들려면 더 필요한 재료 {id: 부족 수량}
export const deliverable=id=>!!(INGREDIENTS[id]?.basic||INGREDIENTS[id]?.shop);
export function craftShortage(state,menuId){const out={};for(const [id,n] of Object.entries(MENUS[menuId]?.ingredients||{})){const lack=n-(state.stock[id]||0);if(lack>0)out[id]=lack;}return out;}
export function craftingSheet(state,ui){
 const c=ui.craft,m=MENUS[c?.menuId];if(!m)return '';
 const lack=craftShortage(state,m.id),short=Object.keys(lack).length>0,canDeliver=short&&Object.keys(lack).every(deliverable),finish=m.station==='oven'?'굽기':'우리기';
 const bowl=`<div class="craft-worktop" style="${assetStyle('backgrounds/crafting')}"><div class="mix-bowl ${c.step===1?'mixing':''}" id="mix-bowl" style="--stirs:${c.step?6:0}"><div class="bowl-liquid"></div>${(c.step?[m.id]:Object.keys(m.ingredients)).map(id=>assetIcon('icons/'+id)).join('')}<span>${c.step?'보글보글':'✧'}</span></div></div>`;
 const need=`<div class="ingredient-basket">${Object.entries(m.ingredients).map(([id,n])=>`<div class="ing ${lack[id]?'lack':''}">${assetIcon('icons/'+id)}<b>${esc(INGREDIENTS[id].name)}</b><small>${state.stock[id]||0}/${n}</small></div>`).join('')}</div>`;
 const body=c.step===2?`<h3>조리를 시작했어요</h3><p class="craft-quality">${c.perfect?'완벽':'좋음'} · ${esc(c.quality)}</p><p>완성되면 픽업 선반에서 손님에게 전해 주세요.</p>${btn({action:'craft.cancel',cls:'primary big',label:'카페로 돌아가기'})}`:c.step===0
  ?`<h3>재료를 담아 저어요</h3>${need}${short?`<p class="craft-lack">재료가 모자라요 · ${Object.entries(lack).map(([id,k])=>`${esc(INGREDIENTS[id].name)} ${k}개`).join(', ')}</p>${canDeliver?btn({action:'craft.restock',cls:'primary big',label:'🛵 모카 긴급 배달 부르기'}):'<p class="small">모카 가게에 없는 재료예요. 사냥이나 농장에서 구해 와요.</p>'}`:btn({action:'craft.mix',cls:'primary big',label:'재료 담아 젓기'})}`
  :`<h3>${m.station==='oven'?'알맞게 구워요':'향이 오를 때 마무리해요'}</h3><div class="heat-track" role="img" aria-label="표시가 가운데 초록 칸에 오면 마무리"><span class="heat-sweetspot"></span><i style="left:${craftHeat(c)}%"></i></div><p class="small">표시가 가운데에 오면 눌러요. 빗나가도 재료를 잃지 않아요.</p>${btn({action:'craft.heat',cls:'primary big',label:`${finish} 마무리 · 조리 시작`})}`;
 return `<h2>${esc(m.name)}${btn({action:'craft.cancel',cls:'close ghost',label:'✕',title:'조리 취소'})}</h2><ol class="craft-steps">${['담아 젓기',finish].map((x,i)=>`<li class="${i===c.step?'current':i<c.step?'done':''}">${i+1} ${x}</li>`).join('')}</ol>${bowl}${body}<p class="small muted">${c.step===2?'창을 닫아도 시작한 조리는 계속돼요.':'재료는 조리 시작 때 사용해요. 닫으면 준비 과정만 취소돼요.'}</p>`;
}
