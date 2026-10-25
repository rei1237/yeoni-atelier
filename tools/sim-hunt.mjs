import { createGame } from '../src/game/state.js';
import { dispatch, tick } from '../src/game/engine.js';
import { getHuntWorld } from '../src/game/hunt.js';
import { maxHuntDepth, hunterProgress } from '../src/game/hunt-growth.js';
// 조이스틱만 누르는 결정론적 줍기/회피 봇. 적·체력·보상을 주입하지 않는다.
export function botHunt(s, depth=1, idle=false) {
 const start=dispatch(s,{type:'hunt.start',depth}); if(!start.ok)throw Error(start.reason);
 for(let n=0;n<12000 && s.hunt.status==='running';n++) {
  const hs=s.hunt,offer=hs.picks[0];
  if(offer){const ranked=offer.map((o,index)=>({index,score:o.kind==='weapon'?30+({bolt:10,aura:7,orbit:6,crescent:4,tarot:3}[o.id]||0):o.kind==='heal'?hs.hp<hs.maxHp*.5?45:0:({bell:24,fish_stock:20,hat:18,whisker:15,paw:10}[o.id]||5)})).sort((a,b)=>b.score-a.score); dispatch(s,{type:'hunt.pick',index:ranked[0].index});continue;}
  const w=getHuntWorld(s),p=w.player;let x=0,y=0;
  if(!idle) {
   const drops=w.drops.items.slice(0,w.drops.count).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   const target=drops[0]||{x:700+Math.cos(hs.elapsedMs/9000)*230,y:900+Math.sin(hs.elapsedMs/9000)*300};
   const d=Math.hypot(target.x-p.x,target.y-p.y)||1;x=(target.x-p.x)/d;y=(target.y-p.y)/d;
   for(let i=0;i<w.enemies.count;i++){const e=w.enemies.items[i],r=Math.hypot(p.x-e.x,p.y-e.y);if(r<110&&r>0){const a=(110-r)/40;x+=(p.x-e.x)/r*a;y+=(p.y-e.y)/r*a;}}
   if(p.x<90)x+=2;if(p.x>1310)x-=2;if(p.y<90)y+=2;if(p.y>1710)y-=2;
  }
  tick(s,100,{input:{x,y}});
 }
 if(s.hunt.status==='running')dispatch(s,{type:'hunt.retreat'}); // 봇만 20분 뒤 귀환; 게임 제한 없음
 dispatch(s,{type:'hunt.finish'});return s.lastHunt;
}
if(process.argv[1]?.endsWith('sim-hunt.mjs')){
 const rows=[];
 for(const seed of [7,42,20261025]){
  const s=createGame({seed});dispatch(s,{type:'story.seen',id:'m0'});dispatch(s,{type:'story.seen',id:'ev:hunt'});
  for(let run=1;run<=2;run++){const r=botHunt(s,maxHuntDepth(s));rows.push({seed,run,depth:r.depth,status:r.status,kills:r.kills,moonstone:r.bag.moonstone,xp:r.careerXP,careerLevel:hunterProgress(s.hunter.xp).level});}
  const idle=createGame({seed});dispatch(idle,{type:'story.seen',id:'m0'});dispatch(idle,{type:'story.seen',id:'ev:hunt'});const r=botHunt(idle,1,true);rows.push({seed,run:'idle',status:r.status,kills:r.kills,moonstone:r.bag.moonstone});
 }
 console.log(JSON.stringify({method:'사냥 조이스틱 봇 / 사람 플레이테스트 아님 / 신규 무장비',rows},null,2));
}
