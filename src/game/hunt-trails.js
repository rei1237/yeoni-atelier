// TEMP: 준비 시간·보스 조건은 유지하고 구간별 회피 패턴과 한 번의 선택을 더한다.
import {stageDef} from '../data/hunt-stages.js';
import {damageHunter} from './enemy-behaviors.js';
export const TRAILS=Object.freeze([
 {to:20,name:'달꽃 오솔길',kind:'lane',hint:'빛나는 길의 옆으로 비켜요',color:'#e9b8dc',interval:24000},
 {to:39,name:'시계 안개 정원',kind:'ring',hint:'고리 안쪽이나 바깥으로 나가요',color:'#c3bbef',interval:22000},
 {to:69,name:'가시 온실',kind:'cross',hint:'십자 빛 사이의 빈 곳을 찾아요',color:'#b1d5b6',interval:21000},
 {to:99,name:'흑월의 연못',kind:'islands',hint:'세 빛 웅덩이를 피해 움직여요',color:'#9cbde7',interval:20000},
 {to:100,name:'달의 마지막 문',kind:'cross',hint:'문이 빛나면 대각선으로 피해요',color:'#f0d69c',interval:18000},
]);
export const trailDef=n=>TRAILS.find(x=>n<=x.to)||TRAILS.at(-1);
export function trailState(h){if(h.trail?.depth!==h.depth)h.trail={depth:h.depth,choice:null,nextAt:stageDef(h.depth).prepMs*.2,sequence:0,hazard:null};return h.trail;}
export function trailOffer(h){return h?.status==='running'&&!h.stageChoice&&h.stageMs>=stageDef(h.depth).prepMs*.3&&!h.trail?.choice;}
export function chooseTrail(state,choice){const h=state.hunt;if(state.mode!=='hunt'||!trailOffer(h)||!['rest','challenge'].includes(choice))return {ok:false,reason:'지금은 고를 갈림길이 없어요'};const v=trailState(h);v.choice=choice;if(choice==='rest')h.hp=Math.min(h.maxHp,h.hp+Math.ceil(h.maxHp*.18));return {ok:true,choice};}
export function trailContains(z,x,y){const dx=x-z.x,dy=y-z.y;if(z.kind==='lane')return Math.abs(dx)<34&&Math.abs(dy)<260;if(z.kind==='cross')return (Math.abs(dx)<27&&Math.abs(dy)<220)||(Math.abs(dy)<27&&Math.abs(dx)<220);if(z.kind==='ring')return Math.abs(Math.hypot(dx,dy)-100)<25;return [0,1,2].some(i=>{const a=i*Math.PI*2/3;return Math.hypot(dx-Math.cos(a)*85,dy-Math.sin(a)*85)<48;});}
export function stepTrail(state,w){const h=state.hunt,v=trailState(h),t=h.elapsedMs,def=trailDef(h.depth);if(h.stageChoice)return;
 if(h.depth>1&&h.stageMs>=v.nextAt){v.nextAt=h.stageMs+def.interval;v.hazard={kind:def.kind,x:w.player.x,y:w.player.y,at:t,sequence:++v.sequence,hit:false};w.banner={label:def.name+' · '+def.hint,warn:true,until:t+1800};}
 const z=v.hazard;if(z&&t>=z.at+1800&&t<z.at+2800&&!z.hit&&trailContains(z,w.player.x,w.player.y)){z.hit=true;damageHunter(state,w,Math.min(12,4+Math.floor(h.depth/20)),t);}
 if(z&&t>=z.at+2800)v.hazard=null;
}
export function claimTrailReward(state){const h=state.hunt;if(h.trail?.choice!=='challenge')return 0;const key=`trail:${h.hunterId}:${h.depth}`;if(state.ledger.rewards[key])return 0;state.ledger.rewards[key]=true;const amount=5+Math.floor(h.depth/10);h.bag.moonstone=(h.bag.moonstone||0)+amount;return amount;}
