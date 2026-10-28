import {INGREDIENTS} from '../data/menus.js';
import {bondFx} from '../data/bonds.js';
import {TEMP} from '../config/balance.temp.js';
import {workShop} from './bonds.js';
import {emit} from './state.js';
export function deliveryQuote(s,items){
 if(!items||typeof items!=='object'||Array.isArray(items))return {ok:false,reason:'주문할 재료를 골라 주세요'};
 const entries=Object.entries(items);if(!entries.length)return {ok:false,reason:'주문할 재료를 골라 주세요'};
 const fx=bondFx(s.affinity);let base=0;
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
