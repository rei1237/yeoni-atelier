import {START_FURNITURE,splitFurniture} from '../data/layout.js';
import {emptyStations} from './state.js';
// TEMP: 기존 1호점의 최대 면적은 보존하고 이후 지점마다 4행씩 넓힌다.
export const BRANCHES=Object.freeze([
 {id:1,name:'아틀리에 본점',revenue:0,cost:0,maxRows:24,line:'익숙한 첫 공간에서 단골을 만나요.'},
 {id:2,name:'항구 찻집',revenue:150000,cost:1000,currency:'moonstone',maxRows:28,line:'여행길에 잠시 쉬어 가는 찻집이에요.'},
 {id:3,name:'꽃길 살롱',revenue:800000,cost:24000,maxRows:32,line:'꽃과 여유로운 좌석을 위한 넓은 살롱이에요.'},
 {id:4,name:'시계탑 별관',revenue:2400000,cost:70000,maxRows:36,line:'많은 손님을 맞이할 수 있는 별관이에요.'},
 {id:5,name:'달빛 정원점',revenue:6000000,cost:180000,maxRows:40,line:'가장 넓은 홀과 정원을 꾸밀 수 있어요.'}
]);
const LOCAL=['staffing','interior','exterior','outdoor','reputation','tables','customers','visits','orders','stations','tray','tasks','staff','lastSettlement','automation'];
const clone=x=>JSON.parse(JSON.stringify(x));
export const earnedRevenue=state=>Object.values(state.ledger.sales||{}).reduce((sum,n)=>sum+(Number.isFinite(n)?Math.max(0,n):0),0);
export const activeBranch=state=>state.branches?.active||1;
export const branchDef=state=>BRANCHES[activeBranch(state)-1]||BRANCHES[0];
export function ensureBranches(state){
 state.branches??={active:1,owned:{1:{id:1,openedDay:state.day,snapshot:null}}};
 state.branches.owned??={1:{id:1,openedDay:state.day,snapshot:null}};
 return state.branches;
}
export function nextBranch(state){return BRANCHES.find(b=>!state.branches?.owned?.[b.id]&&b.id!==1)||null;}
export function branchOffer(state){const b=nextBranch(state);if(!b)return null;const seen=!!state.ledger.story['branch:'+b.id];if(seen)return b;const afterJune=state.day>=1+3*(state.calendar?.turnsPerMonth||3);return earnedRevenue(state)>=b.revenue&&(b.id!==2||afterJune)?b:null;}
// 10-29 사용자 요청: 첫 지점 이야기(청토끼의 2호점 제안)를 보기 전에는 지점 관리를 잠가 둔다. 이미 지점을 연 저장은 열린 채로 둔다
export function branchLock(state){if(state.ledger.story['branch:2']||Object.keys(state.branches?.owned||{}).some(id=>Number(id)>1))return '';return `6월 이후 누적 매출 ${BRANCHES[1].revenue.toLocaleString()}G를 달성하면 청토끼가 지점 이야기를 꺼내요`;}
export function pendingBranchStory(state){const b=branchOffer(state);return b&&!state.ledger.story['branch:'+b.id]?'branch:'+b.id:null;}
const canChange=state=>state.mode!=='prep'?{ok:false,reason:'영업·사냥·결산을 마치고 지점을 바꿔 주세요'}:state.interior.draft||state.outdoor?.draft?{ok:false,reason:'꾸미기 초안을 먼저 적용하거나 취소해 주세요'}:{ok:true};
function snapshot(state){return Object.fromEntries(LOCAL.filter(k=>state[k]!==undefined).map(k=>[k,clone(state[k])]));}
function fresh(){return {interior:{checkoutLayout:'entrance-left',furniture:splitFurniture(START_FURNITURE),areas:[],draft:null},reputation:25,tables:[],customers:{},visits:{},orders:{},stations:emptyStations(),tray:[null,null,null],tasks:[],staff:{},lastSettlement:null,automation:{hall:false,hall_neo:false,kitchen:false,farm:false}};}
export function buyBranch(state,id,confirmed=false){
 const check=canChange(state);if(!check.ok)return check;
 const b=BRANCHES.find(b=>b.id===id);if(!b||id===1)return {ok:false,reason:'개점할 지점이 없습니다'};
 if(state.branches?.owned?.[id])return {ok:true,duplicate:true};
 if(!confirmed)return {ok:false,reason:'비용과 지점 정보를 확인한 뒤 개점을 확정해 주세요'};
 if(branchOffer(state)?.id!==id||!state.ledger.story['branch:'+id])return {ok:false,reason:'누적 매출을 달성하고 청토끼의 제안을 먼저 들어 주세요'};
 const currency=b.currency||'gold',amount=state[currency]||0;
 if(amount<b.cost)return {ok:false,reason:currency==='moonstone'?`월정석이 부족해요 (${b.cost.toLocaleString()}개 필요)`:`골드가 부족해요 (${b.cost.toLocaleString()}G 필요)`};
 const all=ensureBranches(state);state[currency]-=b.cost;all.owned[id]={id,openedDay:state.day,snapshot:fresh()};state.ledger.rewards['branch:open:'+id]=true;
 return {ok:true,id,cost:b.cost,currency};
}
export function switchBranch(state,id){
 const check=canChange(state);if(!check.ok)return check;
 const all=ensureBranches(state);if(!all.owned[id])return {ok:false,reason:'아직 개점하지 않은 지점이에요'};
 if(all.active===id)return {ok:true,duplicate:true};
 all.owned[all.active].snapshot=snapshot(state);const target=all.owned[id].snapshot||fresh();
 for(const k of LOCAL){if(target[k]===undefined)delete state[k];else state[k]=clone(target[k]);}
 all.active=id;state.shift=null;state.paused=false;return {ok:true};
}
export function areaAvailable(state,area){return !area.branchMin||activeBranch(state)>=area.branchMin;}
