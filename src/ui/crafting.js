import {MENUS,INGREDIENTS} from '../data/menus.js';
import {assetIcon,assetStyle} from './asset-html.js';
import {btn,esc} from './dom.js';
export function craftingSheet(ui){
 const c=ui.craft,m=MENUS[c?.menuId];if(!m)return '';
 const steps=['재료 담기','달빛으로 섞기',m.station==='oven'?'오븐에 굽기':'따뜻하게 우려내기'];
 return `<h2>루나 언니의 작은 연금술${btn({action:'craft.cancel',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p class="small">${esc(m.name)} · ${c.step+1}/3</p><div class="craft-scene step-${c.step}"><div class="craft-ring" style="${assetStyle('effects/aura')}"></div><div class="craft-dish">${assetIcon(`icons/${m.id}`)}</div><div class="craft-ingredients">${Object.entries(m.ingredients).map(([id,n],i)=>`<span style="--i:${i}">${assetIcon(`icons/${id}`)}<b>${esc(INGREDIENTS[id].name)} ×${n}</b></span>`).join('')}</div></div><h3>${steps[c.step]}</h3><p>${['준비된 재료를 반짝이는 그릇에 모아 주세요.','서로 다른 향이 어우러지도록 빙글, 한 번 섞어요.','마지막 손길을 더하면 조리가 시작돼요. 완성될 때까지 다른 손님을 돌봐도 좋아요.'][c.step]}</p><div class="stack">${btn({action:'craft.step',cls:'primary',label:steps[c.step]})}${btn({action:'craft.cancel',label:'재료를 쓰지 않고 돌아가기'})}</div><p class="small muted">재료는 마지막 단계에서만 사용해요. 완성 음식은 서빙대에서 전달해 주세요. 포장은 손님이 직접 받아요.</p>`;
}
