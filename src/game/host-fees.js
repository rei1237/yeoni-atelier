import {TEMP} from '../config/balance.temp.js';
import {menuPrice,atmosphere} from './cafe-growth.js';
import {popularity} from './reputation.js';
// 수락할 때 견적을 고정한다. 카페 성장/손님 등급을 반영하며 팁과 분리한다.
export function hostFeeQuote(state,visit){return Math.round(menuPrice(state,{price:TEMP.HOST_FEE_BASE})*(TEMP.HOST_FEE_WEALTH[visit.wealthId]||1)*(1+popularity(state)/100+Math.max(0,Math.min(100,atmosphere(state)))/100));}
export const earnedHostFee=(visit,completedFull)=>completedFull?Math.max(0,visit.hostFeeQuote||0):0;
