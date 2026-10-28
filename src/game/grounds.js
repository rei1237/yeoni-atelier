import {FURNITURE} from '../data/layout.js';
import {activeBranch} from './branches.js';
export const GROUNDS=Object.freeze({cols:12,baseRows:8,entrance:{x:5,y:3}});
export const GARDEN_ITEMS=Object.freeze(['plant','bamboo','garden_bench','moon_lamp','lotus_pot','flower_cart']);
export const FLOOR_THEMES=Object.freeze({grass:{name:'달빛 풀밭',asset:'tiles/hunt_garden',cost:0},stone:{name:'마을 돌길',asset:'tiles/town_street',cost:800},wood:{name:'나무 데크',asset:'tiles/cafe_floor',cost:1200}});
export const REMODELS=Object.freeze({original:{exterior:'buildings/cafe_original',name:'첫 카페',cost:0,interior:'backgrounds/cafe_room',decor:null},blossom:{exterior:'buildings/cafe_blossom',name:'꽃이 피는 입구',cost:2400,interior:'backgrounds/cafe_room',decor:'objects/flower_cart'},salon:{exterior:'buildings/cafe_salon',name:'연꽃 살롱',cost:6000,interior:'backgrounds/atelier_lit',decor:'objects/lotus_pot'}});
export const gardenItem=id=>id==='flower_cart'?{id,name:'꽃 수레',width:2,height:1,price:1200}:FURNITURE[id];
export const gardenPrice=id=>gardenItem(id)?.price||500;
export const newGrounds=()=>({level:0,items:[],floor:'grass',floors:['grass'],draft:null});
export const groundsOf=state=>state.outdoor||newGrounds();
export const exteriorOf=state=>state.exterior||{owned:['original'],theme:'original'};
export function groundSize(state){return {cols:12,rows:8+groundsOf(state).level*2};}
export function groundExpansion(state){const level=groundsOf(state).level;return level<Math.min(4,activeBranch(state)+1)?{level:level+1,cost:2000*3**level,rows:10+level*2}:null;}
function check(state){return state.mode==='prep'?{ok:true}:{ok:false,reason:'영업 준비 중에만 가게 주변을 꾸밀 수 있어요'};}
export function buyRemodel(state,id){const chk=check(state);if(!chk.ok)return chk;const d=REMODELS[id];if(!d)return {ok:false,reason:'없는 리모델링 상품이에요'};const e=state.exterior??={owned:['original'],theme:'original'};if(e.owned.includes(id))return {ok:true,duplicate:true};if(state.gold<d.cost)return {ok:false,reason:'골드가 부족해요'};state.gold-=d.cost;e.owned.push(id);state.ledger.rewards['remodel:'+activeBranch(state)+':'+id]=true;return {ok:true};}
export function applyRemodel(state,id){const chk=check(state);if(!chk.ok)return chk;if(!REMODELS[id]||!exteriorOf(state).owned.includes(id))return {ok:false,reason:'먼저 구매해 주세요'};state.exterior??={owned:['original'],theme:'original'};state.exterior.theme=id;return {ok:true};}
export function groundCommand(state,cmd){
 const chk=check(state);if(!chk.ok)return chk;const g=state.outdoor??=newGrounds(),op=cmd.type.slice(8);
 if(op==='begin'){g.draft??={items:g.items.map(x=>({...x})),floor:g.floor,undo:[]};return {ok:true};}
 if(op==='cancel'){g.draft=null;return {ok:true};}
 if(op==='expand'){const ex=groundExpansion(state);if(!ex||ex.level!==cmd.level)return {ok:false,reason:'부지를 다시 확인해 주세요'};if(!cmd.confirmed)return {ok:false,reason:'비용을 확인한 뒤 확정해 주세요'};if(state.gold<ex.cost)return {ok:false,reason:'골드가 부족해요'};state.gold-=ex.cost;g.level=ex.level;state.ledger.rewards['ground:'+activeBranch(state)+':'+ex.level]=true;return {ok:true};}
 if(op==='buy'){if(!GARDEN_ITEMS.includes(cmd.id))return {ok:false,reason:'없는 정원 가구예요'};if(g.items.some(x=>x.id===cmd.id))return {ok:true,duplicate:true};const cost=gardenPrice(cmd.id);if(state.gold<cost)return {ok:false,reason:'골드가 부족해요'};state.gold-=cost;g.items.push({id:cmd.id,x:null,y:null,rot:0});g.draft?.items.push({id:cmd.id,x:null,y:null,rot:0});return {ok:true,id:cmd.id};}
 if(op==='floor.buy'){const d=FLOOR_THEMES[cmd.id];if(!d)return {ok:false,reason:'없는 바닥이에요'};if(g.floors.includes(cmd.id))return {ok:true,duplicate:true};if(state.gold<d.cost)return {ok:false,reason:'골드가 부족해요'};state.gold-=d.cost;g.floors.push(cmd.id);return {ok:true};}
 if(!g.draft)return {ok:false,reason:'먼저 주변 꾸미기를 시작해 주세요'};
 if(op==='floor'){if(!g.floors.includes(cmd.id))return {ok:false,reason:'구매하지 않은 바닥이에요'};g.draft.floor=cmd.id;return {ok:true};}
 if(op==='undo'){const prior=g.draft.undo?.pop();if(!prior)return {ok:false,reason:'되돌릴 배치가 없어요'};Object.assign(g.draft.items.find(x=>x.id===prior.id),prior.before);return {ok:true,id:prior.id};}
 if(op==='apply'){const valid=validateGround(state,g.draft.items);if(!valid.ok)return valid;g.items=g.draft.items.map(x=>({...x}));g.floor=g.draft.floor;g.draft=null;return {ok:true};}
 const item=g.draft.items.find(x=>x.id===cmd.id);if(!item)return {ok:false,reason:'보유 가구를 골라 주세요'};
 if(['store','rotate','move','suggest'].includes(op)){(g.draft.undo??=[]).push({id:item.id,before:{x:item.x,y:item.y,rot:item.rot}});if(g.draft.undo.length>30)g.draft.undo.shift();}
 if(op==='suggest'){const spot=suggestGroundSpot(state,item.id,cmd.near);if(!spot){g.draft.undo.pop();return {ok:false,reason:'대문 길을 막지 않는 빈자리가 없어요'};}Object.assign(item,spot);return {ok:true,...spot};}
 if(op==='store'){item.x=null;item.y=null;return {ok:true};}
 if(op==='rotate'){item.rot=item.rot===2?0:2;return {ok:true};}
 if(op==='move'){if(!Number.isInteger(cmd.x)||!Number.isInteger(cmd.y))return {ok:false,reason:'격자 안을 골라 주세요'};item.x=cmd.x;item.y=cmd.y;return {ok:true};}
 return {ok:false,reason:'없는 주변 꾸미기 명령이에요'};
}
// 정원 추천 자리: 기준 칸에서 가까운 순으로 길을 막지 않는 칸을 고른다.
export function suggestGroundSpot(state,id,near){
 const items=groundsOf(state).draft?.items;const item=items?.find(x=>x.id===id);if(!item)return null;const {cols,rows}=groundSize(state),c0=near&&Number.isFinite(near.x)?near:item.x!=null?item:{x:2,y:4},saved={x:item.x,y:item.y};
 const cells=[];for(let y=3;y<rows;y++)for(let x=0;x<cols;x++)cells.push({x,y});cells.sort((a,b)=>Math.hypot(a.x-c0.x,a.y-c0.y)-Math.hypot(b.x-c0.x,b.y-c0.y));
 let found=null;for(const p of cells){item.x=p.x;item.y=p.y;if(validateGround(state,items).ok){found=p;break;}}
 Object.assign(item,saved);return found;
}
export function validateGround(state,items){
 const {cols,rows}=groundSize(state),blocked=new Set(),key=(x,y)=>x+','+y;
 for(let y=0;y<3;y++)for(let x=3;x<9;x++)blocked.add(key(x,y));
 for(const item of items){if(item.x==null)continue;const d=gardenItem(item.id),w=d.width||1,h=d.height||1;
  for(let y=item.y;y<item.y+h;y++)for(let x=item.x;x<item.x+w;x++){const k=key(x,y);if(x<0||y<0||x>=cols||y>=rows||blocked.has(k)||(x===5&&(y===3||y===rows-1)))return {ok:false,reason:'가구가 겹치거나 입구·부지 밖을 막아요'};blocked.add(k);}
 }
 const queue=[[5,3]],seen=new Set(['5,3']);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===5&&y===rows-1)return {ok:true};for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=cols||ny>=rows||blocked.has(k)||seen.has(k))continue;seen.add(k);queue.push([nx,ny]);}}
 return {ok:false,reason:'대문에서 카페 입구까지 걸어갈 길을 남겨 주세요'};
}
