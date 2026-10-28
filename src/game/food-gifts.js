import {gainYeoni,canYeoniCook,yeoniEffects} from './yeoni-growth.js';
import {TEMP} from '../config/balance.temp.js';
import {apCheck,spendAp,maxActionPoints} from './calendar.js';
import {MENUS} from '../data/menus.js';
import {bondOpen} from './unlocks.js';
import {BONDS} from '../data/bonds.js';
import {qualityForTiming} from '../data/cooking-quality.js';
import {foodPreference} from '../data/food-preferences.js';
import {gainBond} from './bonds.js';
import {emit,nextId} from './state.js';
import {changeStress} from './stress.js';
const fail=reason=>({ok:false,reason});
const ready=s=>s.mode==='prep'&&!s.paused&&!s.interior.draft&&!s.outdoor?.draft;
export function foodGiftRecipient(s,id){return bondOpen(s,id);}
export function beginGiftCook(s,menuId,timing,requestId){
 if(!ready(s))return fail('영업 준비 중 주방에서 선물용 음식을 만들어요');
 if(typeof requestId!=='string'||!requestId||requestId.length>120)return fail('조리 요청을 다시 열어 주세요');
 if(s.ledger.foodGiftRequests?.[requestId])return fail('이미 처리한 조리 요청이에요');
 const m=MENUS[menuId];if(!canYeoniCook(s,m))return fail('아직 배우지 않은 메뉴예요');
 if(s.foodGifts?.job)return fail('먼저 시작한 여분 음식을 만들고 있어요');
 if((s.foodGifts?.items.length||0)>=20)return fail('선물 보관함은 20개까지예요');
 if(Object.entries(m.ingredients).some(([id,n])=>(s.stock[id]||0)<n))return fail('재료가 모자라요');
 const ap=apCheck(s,1);if(!ap.ok)return ap;
 const id=nextId(s,'giftCook');spendAp(s,1);for(const [key,n] of Object.entries(m.ingredients))s.stock[key]-=n;
 s.ledger.consumes[id]=true;(s.ledger.foodGiftRequests||={})[requestId]=id;
 s.foodGifts||={items:[],job:null};s.foodGifts.job={id,menuId,quality:qualityForTiming(timing,menuId),progressMs:0,durationMs:Math.round(TEMP.GIFT_COOK_MS*(1-yeoniEffects(s).cookSpeed)),owner:'gift',maker:'yeoni',apCost:1,startedDay:s.day};
 return {ok:true,jobId:id};
}
export function stepGiftCook(s,dt){const g=s.foodGifts,j=g?.job;if(!j||s.mode!=='prep')return;j.progressMs=Math.min(j.durationMs,j.progressMs+dt);if(j.progressMs<j.durationMs)return;
 if(!s.ledger.rewards['giftCook:'+j.id]){s.ledger.rewards['giftCook:'+j.id]=true;g.items.push({id:j.id,menuId:j.menuId,quality:j.quality,owner:'gift',maker:j.maker});if(j.maker==='yeoni'){gainYeoni(s,'cook');const recipes=s.yeoniGrowth.recipes??={};recipes[j.menuId]=(recipes[j.menuId]||0)+1;}emit('giftFoodReady',{menuId:j.menuId});}g.job=null;
}
export function cancelGiftCook(s,id){const j=s.foodGifts?.job;if(!ready(s)||!j||j.id!==id)return fail('취소할 선물 조리가 없어요');s.ledger.cookRefunds||={};if(!s.ledger.cookRefunds[id]){for(const [k,n] of Object.entries(MENUS[j.menuId].ingredients))s.stock[k]=(s.stock[k]||0)+n;if(j.apCost&&j.startedDay===s.day)s.ap.left=Math.min(maxActionPoints(s),s.ap.left+j.apCost);s.ledger.cookRefunds[id]=true;}s.foodGifts.job=null;return {ok:true};}
export function giftFood(s,id,itemId){
 if(!ready(s)||!foodGiftRecipient(s,id))return fail('함께하는 동료에게 영업 준비 중 선물해 주세요');
 if(s.ap.gifted[id])return fail('이번 순에는 이미 선물했어요');
 const index=s.foodGifts?.items.findIndex(i=>i.id===itemId&&i.owner==='gift'&&!i.orderId&&!i.reservedFor)??-1;
 if(index<0||s.ledger.consumes['foodGift:'+itemId])return fail('선물 보관함에 있는 음식만 줄 수 있어요');
 const item=s.foodGifts.items[index],taste=foodPreference(id,item.menuId);
 s.foodGifts.items.splice(index,1);s.ledger.consumes['foodGift:'+itemId]=true;s.ap.gifted={...s.ap.gifted,[id]:true};const gain=gainBond(s,id,taste.gain);changeStress(s,'gift',id);
 gainYeoni(s,'gift');emit('bondGift',{id,giftId:item.menuId,gain,liked:taste.rank!=='normal',line:taste.line});return {ok:true,gain,line:taste.line,quality:item.quality};
}
