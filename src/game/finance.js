import {TEMP} from '../config/balance.temp.js';
import {calendarOf} from './calendar.js';
import {cafeProgress} from './cafe-growth.js';
import {townCheck} from './town.js';
import {bondFx} from '../data/bonds.js';
import {emit} from './state.js';

// 게임 속 청토끼 대출. 실제 금융상품·Code Destiny 결제와 무관하다.
export const exchangeRate=state=>TEMP.MOONSTONE_GOLD*(1+bondFx(state.affinity).moonRate);
const ensure=state=>state.finance||=( {balance:0,requests:{},interest:{}} );
export function creditView(state){
 const balance=state.finance?.balance||0;
 const recent=Object.values(state.ledger.settlements).slice(-3).reduce((n,s)=>n+s.sales+(s.hostFees||0)+s.baseTips+s.feverTips,0);
 const limit=Math.min(5_000_000,Math.max(20_000,cafeProgress(state).level*20000,Math.floor(recent*1.5)));
 return {balance,limit,available:Math.max(0,limit-balance),rate:TEMP.LOAN_RATE,nextInterest:Math.ceil(balance*TEMP.LOAN_RATE)};
}
export function borrow(state,amount,requestId){
 const chk=townCheck(state);if(!chk.ok)return chk;
 const f=ensure(state),v=creditView(state);
 if(typeof requestId!=='string'||!requestId)return {ok:false,reason:'대출 확인을 다시 열어 주세요'};
 if(f.requests[requestId])return {ok:false,reason:'이미 처리한 대출입니다'};
 if(!Number.isSafeInteger(amount)||amount<=0||amount>v.available)return {ok:false,reason:'대출 한도 안에서 금액을 골라 주세요'};
 f.balance+=amount;state.gold+=amount;f.requests[requestId]={amount,day:state.day};
 emit('loanReceived',{amount,balance:f.balance});return {ok:true,amount};
}
export function chargeLoanInterest(state,sh){
 const f=ensure(state),c=calendarOf(sh.day);if(c.part!==2)return null;
 const key=String(c.monthIdx);if(f.interest[key])return f.interest[key];
 const due=Math.ceil(f.balance*TEMP.LOAN_RATE),paid=Math.min(state.gold,due);state.gold-=paid;f.balance+=due-paid;
 const rec={due,paid,added:due-paid,balance:f.balance};f.interest[key]=rec;return rec;
}
export function repayFinance(state,target,amount,currency='gold'){
 const chk=townCheck(state);if(!chk.ok)return chk;
 if(!['inheritance','loan'].includes(target)||!['gold','moonstone'].includes(currency))return {ok:false,reason:'상환 항목을 골라 주세요'};
 const f=ensure(state),debt=target==='loan'?f.balance:state.debt;
 if(!Number.isSafeInteger(amount)||amount<=0||debt<=0)return {ok:false,reason:'갚을 금액을 확인해 주세요'};
 const rate=exchangeRate(state),available=currency==='moonstone'?state.moonstone:state.gold;
 const used=Math.min(amount,currency==='moonstone'?Math.ceil(debt/rate):debt);
 if(used>available)return {ok:false,reason:'상환할 재화가 부족해요'};
 const converted=currency==='moonstone'?Math.floor(used*rate):used,paid=Math.min(debt,converted);
 if(currency==='moonstone'){state.moonstone-=used;state.gold+=converted-paid;state.stats.moonstonesExchanged+=used;}else state.gold-=used;
 if(target==='loan')f.balance-=paid;else {state.debt-=paid;state.repaidTotal+=paid;state.stats.repayCount++;}
 emit('repaid',{amount:paid,debt:target==='loan'?f.balance:state.debt});return {ok:true,paid,used,change:converted-paid};
}
