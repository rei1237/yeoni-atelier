import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { getHuntWorld } from '../src/game/hunt.js';
import { maxHuntDepth, hunterProgress } from '../src/game/hunt-growth.js';
import { zoneHits } from '../src/game/hunt-boss.js';
// 조이스틱만 누르는 결정론적 줍기/회피 봇. 적·체력·보상을 주입하지 않는다.
// 사람처럼 붉은 예고 구역과 가까운 적 탄은 피한다(예고가 보이는 순간부터).
export function botHunt(s, depth=1, idle=false) {
 const start=dispatch(s,{type:'hunt.start',depth}); if(!start.ok)throw Error(start.reason);
 for(let n=0;n<12000 && s.hunt.status==='running';n++) {
  const hs=s.hunt,offer=hs.picks[0];
  if(hs.chests.length){dispatch(s,{type:'hunt.chest'});continue;}
  if(hs.stageChoice&&!offer){if(!dispatch(s,{type:'hunt.next'}).ok)break;continue;} // 봇은 클리어하면 계속 내려간다
  if(offer){const ranked=offer.map((o,index)=>({index,score:o.kind==='weapon'?30+({bolt:10,aura:7,orbit:6,crescent:4,tarot:3}[o.id]||0):o.kind==='heal'?hs.hp<hs.maxHp*.5?45:0:({bell:24,fish_stock:20,hat:18,whisker:15,paw:10}[o.id]||5)})).sort((a,b)=>b.score-a.score); dispatch(s,{type:'hunt.pick',index:ranked[0].index});continue;}
  const w=getHuntWorld(s),p=w.player;let x=0,y=0;
  if(!idle) {
   const drops=w.drops.items.slice(0,w.drops.count).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   const target=drops[0]||{x:700+Math.cos(hs.elapsedMs/9000)*230,y:900+Math.sin(hs.elapsedMs/9000)*300};
   const d=Math.hypot(target.x-p.x,target.y-p.y)||1;x=(target.x-p.x)/d;y=(target.y-p.y)/d;
   for(let i=0;i<w.enemies.count;i++){const e=w.enemies.items[i],r=Math.hypot(p.x-e.x,p.y-e.y);if(r<110&&r>0){const a=(110-r)/40;x+=(p.x-e.x)/r*a;y+=(p.y-e.y)/r*a;}}
   const t=hs.elapsedMs;
   for(const z of w.zones||[]){if(t>=Math.max(z.at,z.until))continue;if(!zoneHits(z,p.x,p.y,34))continue;
    if(z.kind==='line'){const dx=z.x2-z.x,dy=z.y2-z.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,side=Math.sign((p.x-z.x)*nx+(p.y-z.y)*ny)||1;x+=nx*side*3;y+=ny*side*3;}
    else{const r=Math.hypot(p.x-z.x,p.y-z.y)||1;if(z.kind==='ring'&&r<z.r0-20)continue;x+=(p.x-z.x)/r*3;y+=(p.y-z.y)/r*3;}}
   for(const b of w.hostile){const r=Math.hypot(p.x-b.x,p.y-b.y);if(r<70&&r>0){const v=Math.hypot(b.vx,b.vy)||1,nx=-b.vy/v,ny=b.vx/v,side=Math.sign((p.x-b.x)*nx+(p.y-b.y)*ny)||1;x+=nx*side*1.5;y+=ny*side*1.5;}}
   if(p.x<90)x+=2;if(p.x>1310)x-=2;if(p.y<90)y+=2;if(p.y>1710)y-=2;
  }
  tick(s,100,{input:{x,y}});
 }
 if(s.hunt.status==='running')dispatch(s,{type:'hunt.retreat'}); // 봇만 20분(또는 100단계) 뒤 귀환; 게임 제한 없음
 dispatch(s,{type:'hunt.finish'});return s.lastHunt;
}
if(process.argv[1]?.endsWith('sim-hunt.mjs')){
 const rows=[];
 for(const seed of [7,42,20261025]){
  const s=createGame({seed});s.stats.shiftsCompleted=1; // 시뮬 준비: 첫 영업을 마친 상태
  dispatch(s,{type:'story.seen',id:'m0'});dispatch(s,{type:'story.seen',id:'ev:hunt'});
  for(let run=1;run<=2;run++){const r=botHunt(s,maxHuntDepth(s));rows.push({seed,run,from:r.startDepth,depth:r.depth,cleared:r.cleared,maxStage:s.hunter.maxStage,status:r.status,kills:r.kills,moonstone:r.bag.moonstone,xp:r.careerXP,careerLevel:hunterProgress(s.hunter.xp).level});}
  const idle=createGame({seed});idle.stats.shiftsCompleted=1;dispatch(idle,{type:'story.seen',id:'m0'});dispatch(idle,{type:'story.seen',id:'ev:hunt'});const r=botHunt(idle,1,true);rows.push({seed,run:'idle',depth:r.depth,cleared:r.cleared,status:r.status,kills:r.kills,moonstone:r.bag.moonstone});
 }
 console.log(JSON.stringify({method:'사냥 조이스틱 봇(붉은 예고·적 탄 회피) / 사람 플레이테스트 아님 / 신규 무장비',rows},null,2));
}
