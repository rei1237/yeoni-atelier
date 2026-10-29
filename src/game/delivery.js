import {INGREDIENTS,MENUS} from '../data/menus.js';
import {bondFx} from '../data/bonds.js';
import {TEMP} from '../config/balance.temp.js';
import {workShop} from './bonds.js';
import {emit} from './state.js';
export function deliveryQuote(s,items){
 if(!items||typeof items!=='object'||Array.isArray(items))return {ok:false,reason:'주문할 재료를 골라 주세요'};
 const entries=Object.entries(items);if(!entries.length)return {ok:false,reason:'주문할 재료를 골라 주세요'};
 const fx=bondFx(s);let base=0;
 for(const [id,n] of entries){const ing=INGREDIENTS[id];if(!ing||!(ing.basic||ing.shop)||!Number.isInteger(n)||n<1||n>99)return {ok:false,reason:'판매 재료와 수량 1~99개를 확인해 주세요'};base+=Math.ceil(ing.price*n*(1-fx.discount));}
 const fee=Math.ceil(TEMP.DELIVERY_FEE*(1-fx.feeCut));return {ok:true,base,fee,cost:base+fee};
}
export function orderDelivery(s,items,requestId){
 if(!['prep','shift'].includes(s.mode)||s.interior.draft||s.outdoor?.draft)return {ok:false,reason:'카페 영업 준비 또는 영업 중에 배달을 요청해 주세요'};
 if(typeof requestId!=='string'||!requestId||requestId.length>120)return {ok:false,reason:'배달 주문을 다시 확인해 주세요'};
 if(s.ledger.deliveries?.[requestId])return {ok:true,duplicate:true,...s.ledger.deliveries[requestId]};
 const quote=deliveryQuote(s,items);if(!quote.ok)return quote;
 if(s.gold<quote.cost)return {ok:false,reason:`골드가 부족해요. 재료값 ${quote.base}G + 배달비 ${quote.fee}G = ${quote.cost}G`};
 s.gold-=quote.cost;for(const [id,n] of Object.entries(items)){s.stock[id]=(s.stock[id]||0)+n;if(id==='night_dew')s.stats.nightDewObtained+=n;}
 (s.ledger.deliveries??={})[requestId]={base:quote.base,fee:quote.fee,cost:quote.cost};workShop(s);emit('deliveryArrived',quote);return quote;
}
// 10-29 배운 메뉴를 한 번 만들기에도 모자란 판매 재료(배달로 채울 수 있는 것만)
export function shortIngredients(s){
 const need={};
 for(const [id,on] of Object.entries(s.learned||{})){if(!on||!MENUS[id])continue;for(const [ing,n] of Object.entries(MENUS[id].ingredients)){const x=INGREDIENTS[ing];if(x&&(x.basic||x.shop)&&(s.stock[ing]||0)<n)need[ing]=true;}}
 return Object.keys(need);
}
// 10-29 모카 묶음 담기. refill 은 모자란 재료를 5개까지 채운다
export const DELIVERY_BUNDLES=Object.freeze([
 {id:'refill',name:'떨어진 재료 채우기',items:null},
 {id:'coffee',name:'커피 바 묶음',items:{bean:5,milk:5,sugar:5}},
 {id:'bakery',name:'베이커리 묶음',items:{flour:5,egg:5,milk:5,sugar:5}},
 {id:'tea',name:'찻집 묶음',items:{tea:5,sugar:5}},
]);
export function bundleItems(s,id){
 const b=DELIVERY_BUNDLES.find(x=>x.id===id);if(!b)return {};
 if(b.items)return {...b.items};
 return Object.fromEntries(shortIngredients(s).map(ing=>[ing,Math.max(1,5-(s.stock[ing]||0))]));
}
