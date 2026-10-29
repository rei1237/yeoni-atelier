import {INGREDIENTS} from '../data/menus.js';
import {TEMP} from '../config/balance.temp.js';
import {deliveryQuote,shortIngredients,DELIVERY_BUNDLES,bundleItems} from '../game/delivery.js';
import {assetIcon} from './asset-html.js';
import {btn,esc} from './dom.js';
// 10-29 모카 배달: 묶음 담기 → 재료별 ＋1·＋5 → 아래 합계에서 주문. 장바구니는 화면 상태(ui)에만 둔다
const names=items=>Object.keys(items).map(id=>INGREDIENTS[id]?.name).filter(Boolean).join('·');
function bundleCard(s,b,short){
 const items=bundleItems(s,b.id),empty=!Object.keys(items).length;
 const line=b.items?`${names(items)} 각 5개`:empty?'지금은 모자란 재료가 없어요':`${names(items)} 5개까지`;
 return btn({action:'delivery.bundle',args:{id:b.id},cls:'delivery-bundle'+(b.id==='refill'&&short.length?' urgent':''),disabled:empty,label:`<span class="db-icons">${Object.keys(items).slice(0,4).map(id=>assetIcon('icons/'+id)).join('')||assetIcon('badges/moka')}</span><b>${esc(b.name)}</b><small>${esc(line)}</small>`,title:`${b.name} 담기`});
}
export function deliverySheet(s,ui){
 const cart=ui.deliveryCart||{},q=deliveryQuote(s,cart),short=shortIngredients(s),count=Object.values(cart).reduce((a,n)=>a+n,0);
 const rows=Object.values(INGREDIENTS).filter(i=>i.basic||i.shop).map(i=>{const n=cart[i.id]||0,low=short.includes(i.id);return `<li class="delivery-item${n?' picked':''}">${assetIcon('icons/'+i.id)}<span class="di-name"><b>${esc(i.name)}</b><small class="${low?'low':''}">보유 ${s.stock[i.id]||0}${low?' · 부족':''} · ${i.price}G</small></span><span class="di-qty">${btn({action:'delivery.qty',args:{id:i.id,delta:-1},disabled:!n,label:'−',title:i.name+' 1개 빼기'})}<output aria-label="${esc(i.name)} 주문 수량">${n}</output>${btn({action:'delivery.qty',args:{id:i.id,delta:1},disabled:n>=99,label:'+1',title:i.name+' 1개 담기'})}${btn({action:'delivery.qty',args:{id:i.id,delta:5},disabled:n>=99,label:'+5',title:i.name+' 5개 담기'})}</span></li>`;}).join('');
 const label=!q.ok?'재료를 담아 주세요':s.gold<q.cost?'골드가 부족해요':`${q.cost}G · ${count}개 주문하기`;
 return `<section class="delivery-sheet"><h2>모카 배달${btn({action:'delivery.close',cls:'close ghost',label:'✕',title:'배달 닫기'})}</h2>
 <div class="delivery-intro">${assetIcon('badges/moka')}<p class="delivery-bubble">모카: ${short.length?'재료가 떨어졌네. 묶음으로 담으면 한 번에 싣고 갈게.':'필요한 건 다 담아. 한 번에 싣고 갈게.'}</p></div>
 ${short.length?`<p class="delivery-alert" role="status">떨어진 재료 · ${esc(names(Object.fromEntries(short.map(id=>[id,1]))))}</p>`:''}
 <h3 class="delivery-h">빠른 묶음</h3><div class="delivery-bundles">${DELIVERY_BUNDLES.map(b=>bundleCard(s,b,short)).join('')}</div>
 <h3 class="delivery-h">재료 고르기${count?btn({action:'delivery.clear',cls:'delivery-clear',label:'비우기',title:'장바구니 비우기'}):''}</h3><ul class="delivery-list">${rows}</ul>
 <p class="small delivery-tip">영업 전에 마을 식재료점에서 사면 배달비가 없어요. 배달에는 행동력이 들지 않아요.</p>
 <footer class="delivery-total"><p><span>재료값</span><b>${q.base||0}G</b></p><p><span>배달비 · 주문당 한 번</span><b>${!q.ok?TEMP.DELIVERY_FEE+'G':q.fee?q.fee+'G':'무료 · 모카 인연'}</b></p><p class="sum"><span>총액 / 보유</span><b>${q.cost||0}G / ${s.gold}G</b></p>${btn({action:'delivery.order',cls:'primary big',disabled:!q.ok||s.gold<q.cost,label})}</footer></section>`;
}
