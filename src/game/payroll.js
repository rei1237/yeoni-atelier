import {TEMP} from '../config/balance.temp.js';
import {calendarOf} from './calendar.js';
import {usableHosts,emit,personName} from './state.js';
// 창업 동료는 무급. 새 영입자는 근무한 순의 수입에만 급여가 발생한다.
export const salariedStaff=state=>usableHosts(state).filter(id=>!['neo','luna','luna_sis'].includes(id));
export function payrollView(state){const m=calendarOf(state.day).monthIdx,rec=state.payroll?.months?.[m];return {staff:salariedStaff(state),accrued:rec?.due||0,arrears:state.payroll?.arrears||0};}
export function accruePayroll(state,sh){
 const p=state.payroll||={months:{},arrears:0};p.months||={};
 const c=calendarOf(sh.day),rec=p.months[c.monthIdx]||={shifts:{},staff:{},due:0,paid:0,closed:false};
 if(rec.shifts[sh.id])return rec;
 rec.shifts[sh.id]=true;
 const turnover=sh.sales+sh.baseTips+sh.feverTips;
 for(const id of salariedStaff(state).filter(id=>!sh.staffIds||sh.staffIds.includes(id))){const fee=Math.ceil(TEMP.PAYROLL_BASE/3+turnover*TEMP.PAYROLL_SHARE);rec.staff[id]=(rec.staff[id]||0)+fee;rec.due+=fee;}
 if(c.part===2&&!rec.closed){const total=rec.due+p.arrears;rec.previousArrears=p.arrears;rec.paid=Math.min(state.gold,total);state.gold-=rec.paid;p.arrears=total-rec.paid;rec.arrears=p.arrears;rec.closed=true;emit('payrollPaid',{due:total,paid:rec.paid,arrears:p.arrears});}
 return rec;
}
