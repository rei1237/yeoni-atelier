import {WEAPONS,cannonLaneRatio,cannonLaneStack} from '../data/kfp-weapons.js';
import {activeKfpCores,kfpPlayerStats,normalizeKfp} from './kfp-loadout.js';
import {kfpWeaponStats} from './kfp-stats.js';
import {chooseCannonVolley,cannonBeamHits} from './kfp-cannon-targeting.js';
import {ENEMIES} from '../data/hunt-kit.js';
import {nextRandom} from '../core/rng.js';
import {withinMeleeArc} from './melee.js';
const TAU=Math.PI*2,key=w=>(w.sourceId||w.id)+':'+w.id;
export const KFP_LIMITS=Object.freeze({shots:256,fields:36,beams:3,orbits:32});
// 원작 발사 패턴을 현재 적 Pool·밀리초 시계·저장 상태에 연결한다. 전투 RNG는 state.rng뿐이다.
export function stepKfp(state,world,dt,hit){
 const h=state.hunt,k=normalizeKfp(h);if(!k)return;
 const t=h.elapsedMs,sec=dt/1000,p=world.player,ps=kfpPlayerStats(h),rand=(a,b)=>a+(b-a)*nextRandom(state.rng);
 const rt=world.kfp??={shots:[],fields:[],beams:[],orbits:[],arcs:[],revision:k.revision};
 k.cool??={};k.thorns??={};
 if(rt.revision!==k.revision){const owns=new Set(k.weapons.map(w=>w.id));for(const a of [rt.shots,rt.fields,rt.beams,rt.arcs])for(let i=a.length-1;i>=0;i--)if(!owns.has(a[i].owner))a.splice(i,1);rt.revision=k.revision;}
 const live=()=>world.enemies.items.slice(0,world.enemies.count);
 const nearest=(r=700)=>live().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<r).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 const damage=(e,s,amount=s.dmg,dx=e.x-p.x,dy=e.y-p.y)=>{const i=world.enemies.items.slice(0,world.enemies.count).findIndex(x=>x===e);if(i<0)return;
  if(s.slow){e.kfpSlow=Math.max(e.kfpSlow||0,s.slow);e.kfpSlowUntil=t+1000;}
  if(s.bleed){e.kfpBleed=Math.max(e.kfpBleed||0,s.bleed);e.kfpBleedUntil=t+3000;}
  const before=e.hp;if(s.execute&&!ENEMIES[e.type].boss&&e.hp/e.maxHp<=s.execute)amount=Math.max(amount,e.hp);hit(i,amount,{crit:Math.min(.8,ps.crit+s.crit),critMultiplier:3+(s.critBonus||0)},dx,dy);
  if(s.lifesteal)h.hp=Math.min(h.maxHp,h.hp+Math.min(before,amount)*s.lifesteal);
 };
 rt.orbits=[];rt.arcs=rt.arcs.filter(x=>x.until>t);rt.beams=rt.beams.filter(x=>x.until>t);
 h.hp=Math.min(h.maxHp,h.hp+ps.regen*sec);world.kfpArmor=ps.armor;world.kfpGuard=ps.guard;
 for(const e of live())if(t<(e.kfpBleedUntil||0)&&t>=(e.kfpBleedAt||0)){e.kfpBleedAt=t+500;damage(e,{crit:0},e.kfpBleed);}
 const requests=[];
 function shot(w,s,a,kind='bullet',radius=5){if(rt.shots.length>=KFP_LIMITS.shots)return;
  const projectile={owner:w.sourceId||w.id,core:key(w),id:w.id,kind,x:p.x,y:p.y-16,vx:Math.cos(a)*s.speed,vy:Math.sin(a)*s.speed,until:t+s.duration*1000,r:radius*s.area,s:{...s},pierce:s.pierce,hits:{},born:t,color:WEAPONS[w.id].color};rt.shots.push(projectile);return projectile;}
 function field(w,s,x,y,kind,delay=550){
  const owner=w.sourceId||w.id,cap=WEAPONS[w.id].fusionOnly?8:Math.max(3,s.amount+2),owned=rt.fields.filter(f=>f.core===key(w));
  if(owned.length>=cap)rt.fields.splice(rt.fields.indexOf(owned[0]),1);if(rt.fields.length>=KFP_LIMITS.fields)rt.fields.shift();
  rt.fields.push({owner,core:key(w),x,y,sx:p.x,sy:p.y-16,kind,r:s.radius*s.area,s:{...s},at:t+delay,born:t,until:t+delay+s.duration*1000,next:t+delay,follow:s.follow});}
 function shootPattern(w,s,kind){const target=nearest(),a=target?Math.atan2(target.y-p.y,target.x-p.x):Math.atan2(p.dirY,p.dirX);
  if(kind==='shotgun')for(let i=0;i<s.amount;i++)shot(w,{...s,speed:s.speed*rand(.85,1.1)},a+(s.amount>1?(i/(s.amount-1)-.5)*s.spread:0)+rand(-.05,.05),'bullet',4);
  if(kind==='rifle')for(let i=0;i<s.amount;i++)shot(w,s,a+(i?rand(-.35,.35):0),'bullet',w.evolved?9:6);
  if(kind==='pistols'){for(let i=0;i<s.amount;i++){const sh=shot(w,s,a+rand(-.035,.035),'bullet',4);if(sh){sh.delay=t+i*45;sh.until+=i*45;}}}
  if(kind==='saw'){const n=Math.min(6,s.amount);for(const old of rt.shots)if(old.core===key(w)&&old.kind==='saw')old.until=Math.min(old.until,t+150);for(let i=0;i<n;i++)shot(w,{...s,dmg:s.dmg*s.amount/n},rand(0,TAU),'saw',w.id==='carnage_saw'?18:14);}
  if(kind==='sword'){if(!target)return;const radius=Math.min(w.id==='sword_wheel'?200:175,(s.radius||100)*Math.sqrt(s.area)),half=Math.min(Math.PI*.65,Math.PI*.4+Math.max(0,s.amount-1)*.08);
   rt.arcs.push({owner:w.sourceId||w.id,x:p.x,y:p.y,angle:a,r:radius,half,at:t,until:t+220,color:WEAPONS[w.id].color});
   for(const e of live())if(withinMeleeArc(p.x,p.y,a,radius,half,e,ENEMIES[e.type].r))damage(e,s);}
  if(kind==='fire'||kind==='gas'||kind==='firegas'){
   if(s.follow){const old=rt.fields.find(f=>f.core===key(w)&&f.follow);if(old){old.s=s;old.until=t+2000;return;}field(w,{...s,duration:2},p.x,p.y,kind,0);return;}
   for(let i=0;i<s.amount;i++){const list=live().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<420),e=list.length?list[Math.floor(nextRandom(state.rng)*list.length)]:null;field(w,s,e?.x??p.x+rand(-200,200),e?.y??p.y+rand(-160,160),kind);}}
 }
 function orbit(w,s,consumable=true){
  const id=key(w),n=Math.min(8,s.amount),slots=k.thorns[id]??=[];while(slots.length<n)slots.push(0);slots.length=n;
  let ready=0;for(let i=0;i<n;i++){if(slots[i]>t)continue;ready++;const a=t/1000*(w.id==='thorns'?s.speed:3.4)+i/n*TAU,r=s.radius||50,x=p.x+Math.cos(a)*r,y=p.y-16+Math.sin(a)*r*.8,pr=14*s.area;
   if(rt.orbits.length<KFP_LIMITS.orbits)rt.orbits.push({x,y,r:pr,color:w.evolved?'#f681a9':'#ffbce2'});
   const enemy=live().find(e=>Math.hypot(e.x-x,e.y-ENEMIES[e.type].r-y)<ENEMIES[e.type].r+pr);
   const projectile=world.hostile.findIndex(b=>Math.hypot(b.x-x,b.y-y)<b.r+pr);
   if(enemy||projectile>=0){slots[i]=t+(consumable?(s.regrow||1.4):s.hitCd)*1000;
    if(projectile>=0)world.hostile.splice(projectile,1);
    if(enemy){const def=ENEMIES[enemy.type],stun=w.evolved?(def.boss?.4:3):def.boss?.3+.05*(w.level-1):.6+.1*(w.level-1);
     if(!def.boss||t>=(enemy.kfpStunImmune||0)){enemy.kfpStunUntil=t+stun*1000*(def.elite&&!def.boss?.5:1);if(def.boss)enemy.kfpStunImmune=enemy.kfpStunUntil+2500;}
     damage(enemy,s,s.dmg*(def.boss?.75:1));}
    if(consumable){const range=40*s.area*(w.evolved?1.25:1),targets=live().filter(e=>e!==enemy&&Math.hypot(e.x-x,e.y-y)<range+ENEMIES[e.type].r).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
     for(const e of targets.slice(0,3+(w.level>=5?1:0)+(w.evolved?1:0)))damage(e,s,s.dmg*(.25+.01*(w.level-1)));}
   }
  }
  if(consumable)world.kfpGuard=Math.max(world.kfpGuard,ps.guard+Math.min(w.evolved?.3:.2,ready*(w.evolved?.05:.04)));
 }
 for(const w of activeKfpCores(h)){
  const s=kfpWeaponStats(w,ps),id=key(w);if(w.id==='thorns'){orbit(w,s);continue;}
  if(['lotus_bloom','orbit_saw'].includes(w.id)&&t<(k.cool[id+':orbit']||0))orbit(w,{...s,dmg:s.dmg*(w.id==='lotus_bloom'?.45:.6),amount:Math.min(5,3+Math.floor((w.level-1)/3)+(s.bonusAmount||0)),radius:w.id==='lotus_bloom'?90:78},false);
  if(s.trail&&p.moving&&t>=(k.cool[id+':trail']||0)){field(w,{...s,radius:64,area:s.area,dmg:s.dmg*.6,duration:Math.min(10,6*s.durationScale)},p.x,p.y,'fire',0);k.cool[id+':trail']=t+400;}
  if(t<(k.cool[id]||0))continue;k.cool[id]=t+s.cd*1000;
  p.cast={at:t,until:t+200,facing:p.facing};
  if(['cannon','lotus_bloom','ember_lance','absolute_bloom'].includes(w.id))requests.push({w,s});
  if(['shotgun','scatter_rail','toxic_scatter'].includes(w.id))shootPattern(w,s,'shotgun');
  else if(w.id==='rifle')shootPattern(w,s,'rifle');
  else if(['pistols','burst_rail','guillotine'].includes(w.id))shootPattern(w,s,'pistols');
  else if(['saw','venom_saw','orbit_saw','carnage_saw'].includes(w.id))shootPattern(w,s,'saw');
  else if(['sword','sword_wheel'].includes(w.id))shootPattern(w,s,'sword');
  else if(['molotov','gas','plague_fire','plague_end'].includes(w.id))shootPattern(w,s,w.id==='gas'?'gas':w.id==='molotov'?'fire':'firegas');
  else if(w.id==='doom_barrage'){for(let i=0;i<s.amount;i++)shot(w,s,i/s.amount*TAU+t*.0007);shootPattern(w,{...s,amount:3,dmg:s.dmg*2},'rifle');}
  if(w.id==='ember_lance')shootPattern(w,{...s,dmg:s.dmg*.16,amount:Math.min(2,s.amount),radius:54,duration:Math.min(6,3*s.durationScale),tick:.3},'fire');
  if(['lotus_bloom','orbit_saw'].includes(w.id))k.cool[id+':orbit']=t+Math.min(4.5,2.8*s.durationScale)*1000;
 }
 if(requests.length){
  const targets=live().map(e=>({...e,alive:true,id:e.uid,radius:ENEMIES[e.type].r,ref:e})),count=Math.min(3,Math.max(...requests.map(x=>x.s.amount))),length=Math.max(...requests.map(x=>x.s.length*Math.sqrt(x.s.area))),width=Math.max(...requests.map(x=>x.s.width*x.s.area));
  const profiles=Array.from({length:count},(_,i)=>requests.filter(x=>x.s.amount>i).map(x=>({length:x.s.length*Math.sqrt(x.s.area),width:x.s.width*x.s.area})));
  const volley=chooseCannonVolley({targets,count,length,width,rayProfiles:profiles,fallbackAngle:Math.atan2(p.dirY,p.dirX),muzzleAt:()=>({x:p.x,y:p.y-16})});
  for(const target of targets)for(const {w,s} of requests){const rays=Math.min(s.amount,count),hits=volley.rays.slice(0,rays).filter(ray=>cannonBeamHits(target,{...ray,segments:null,length:s.length*Math.sqrt(s.area),width:s.width*s.area})).length;
   if(hits)damage(target.ref,s,s.beamDamage*cannonLaneRatio(w.id,w.level)*cannonLaneStack(hits,!!ENEMIES[target.type].boss));}
  rt.beams=volley.rays.map(ray=>({...ray,owner:requests[0].w.sourceId||requests[0].w.id,at:t,until:t+Math.max(...requests.map(x=>x.s.duration))*1000}));
 }
 for(let i=rt.shots.length-1;i>=0;i--){const b=rt.shots[i];if(b.delay>t)continue;const ox=b.x,oy=b.y;b.x+=b.vx*sec;b.y+=b.vy*sec;let dead=t>=b.until;
  if(b.kind==='saw'){const hw=world.viewW?world.viewW/2:210,hh=world.viewH?world.viewH/2:300;if(b.x<p.x-hw||b.x>p.x+hw){b.vx*=-1;b.x=Math.max(p.x-hw,Math.min(p.x+hw,b.x));}if(b.y<p.y-hh||b.y>p.y+hh){b.vy*=-1;b.y=Math.max(p.y-hh,Math.min(p.y+hh,b.y));}}
  for(const e of live()){if(dead)break;if(b.hits[e.uid]&&t<b.hits[e.uid])continue;const dx=b.x-ox,dy=b.y-oy,q=Math.max(0,Math.min(1,((e.x-ox)*dx+(e.y-oy)*dy)/(dx*dx+dy*dy||1)));
   if(Math.hypot(e.x-ox-dx*q,e.y-oy-dy*q)>ENEMIES[e.type].r+b.r)continue;
   b.hits[e.uid]=b.kind==='saw'?t+b.s.hitCd*1000:Infinity;damage(e,b.s,b.s.dmg,b.vx,b.vy);if(b.kind!=='saw'&&b.pierce--<=0)dead=true;}
  if(dead)rt.shots.splice(i,1);
 }
 for(let i=rt.fields.length-1;i>=0;i--){const f=rt.fields[i];if(t>=f.until){rt.fields.splice(i,1);continue;}if(f.follow){f.x=p.x;f.y=p.y;f.until=t+2000;}if(t<f.next)continue;f.next=t+f.s.tick*1000;for(const e of live())if(Math.hypot(e.x-f.x,e.y-f.y)<f.r+ENEMIES[e.type].r)damage(e,f.s);}
}
