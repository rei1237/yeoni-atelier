import {ENEMIES} from '../data/hunt-kit.js';
import {TEMP} from '../config/balance.temp.js';
import {emit} from './state.js';
const H=TEMP.HUNT;
// 받는 피해 = 기본 × 단계·달 배율 × (1 − 수호부 피해 감소 w.guard). 보호막 소모품(shieldUntil)은 무적
export function damageHunter(state,w,base,t){const h=state.hunt,p=w.player;if(t<p.hurtUntil||t<(h.shieldUntil||0))return false;h.hp=Math.max(0,h.hp-Math.max(1,Math.round(base*h.scale.dmg*(1-(w.guard||0)))));p.hurtUntil=t+H.HURT_IFRAME_MS;p.action='hurt';p.actionUntil=t+240;w.shakeUntil=t+160;if(w.guard)p.guardAt=t;emit('huntHurt',{hp:h.hp});return true;}
export function addBattleFx(w,fx){if(w.fx.length>=40)w.fx.shift();w.fx.push(fx);}
function shoot(w,e,t,def){const n=def.role==='fan'?3:1;for(let k=0;k<n&&w.hostile.length<48;k++){const a=Math.atan2(e.aimY,e.aimX)+(k-(n-1)/2)*.25;w.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*155,vy:Math.sin(a)*155,r:6,dmg:def.dmg*.7,until:t+3000});}emit('huntEnemyAttack',{kind:'shot'});}
// 보스는 src/game/hunt-boss.js 가 움직인다(여기서는 건너뛴다)
export function stepEnemyBehaviors(state,w,t,dt){
 const p=w.player,sec=dt/1000,decay=Math.exp(-8*sec),grid=new Map(),cell=60;
 for(let i=0;i<w.enemies.count;i++){const e=w.enemies.items[i],key=`${Math.floor(e.x/cell)},${Math.floor(e.y/cell)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);}
 for(let i=w.enemies.count-1;i>=0;i--){const e=w.enemies.items[i],def=ENEMIES[e.type],dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;let mx=dx/d,my=dy/d,sp=e.speed,planted=false;
  if(def.boss)continue;
  if(e.life>0){e.life-=dt;e.x+=e.vx*sec;e.y+=e.vy*sec;if(e.life<=0){w.enemies.release(i);continue;}}
  else {
   if(def.role==='bomber'){
    if(e.rolePhase==='approach'&&d<110){e.rolePhase='fuse';e.roleUntil=t+1100;e.warningR=92;}
    if(e.rolePhase==='fuse'){planted=true;if(t>=e.roleUntil){addBattleFx(w,{kind:'burst',x:e.x,y:e.y,r:92,at:t,until:t+380});if(d<92+14)damageHunter(state,w,def.dmg,t);emit('huntEnemyAttack',{kind:'burst'});w.enemies.release(i);continue;}}
   }else if(def.role==='dash'){
    if(e.rolePhase==='approach'&&d<230&&t>=e.nextAttack){e.rolePhase='warning';e.roleUntil=t+750;e.aimX=mx;e.aimY=my;}
    if(e.rolePhase==='warning'){planted=true;if(t>=e.roleUntil){e.rolePhase='dash';e.roleUntil=t+420;}}
    else if(e.rolePhase==='dash'){mx=e.aimX;my=e.aimY;sp=245;if(t>=e.roleUntil){e.rolePhase='approach';e.nextAttack=t+2400;}}
   }else if(['ranged','fan'].includes(def.role)){
    if(d<150){mx=-mx;my=-my;}else if(d<280){mx*=.15;my*=.15;}
    if(e.rolePhase==='warning'){planted=true;if(t>=e.roleUntil){shoot(w,e,t,def);e.rolePhase='approach';e.nextAttack=t+3600;}}
    else if(d<350&&t>=e.nextAttack){e.rolePhase='warning';e.roleUntil=t+850;e.aimX=dx/d;e.aimY=dy/d;}
   }else if(def.role==='slam'){
    if(e.rolePhase==='approach'&&d<100&&t>=e.nextAttack){e.rolePhase='warning';e.roleUntil=t+950;e.warningR=95;}
    if(e.rolePhase==='warning'){planted=true;if(t>=e.roleUntil){if(d<95+14)damageHunter(state,w,def.dmg*1.5,t);addBattleFx(w,{kind:'burst',x:e.x,y:e.y,r:95,at:t,until:t+300});e.rolePhase='approach';e.nextAttack=t+2300;}}
   }
   if(def.zigzag&&!planted){const z=Math.sin(t/520+e.phase)*.48,nx=mx-my*z,ny=my+mx*z,n=Math.hypot(nx,ny)||1;mx=nx/n;my=ny/n;}
   const blend=1-Math.exp(-12*sec);e.motionX+=(mx*sp-e.motionX)*blend;e.motionY+=(my*sp-e.motionY)*blend;
   if(!planted){e.x+=e.motionX*sec;e.y+=e.motionY*sec;}
  }
  if(!planted){e.x+=e.kx*sec;e.y+=e.ky*sec;}e.kx*=decay;e.ky*=decay;
  e.facing=Math.abs(mx)>Math.abs(my)?(mx>0?'right':'left'):(my>0?'down':'up');
  if(def.role!=='bomber'&&d<def.r+14)damageHunter(state,w,def.dmg,t);
  if(!planted&&((e.uid+Math.floor(t/34))%2===0)){const gx=Math.floor(e.x/cell),gy=Math.floor(e.y/cell);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const o of grid.get(`${gx+a},${gy+b}`)||[]){if(o===e)continue;const ox=e.x-o.x,oy=e.y-o.y,rr=(def.r+ENEMIES[o.type].r)*.8,dd=Math.hypot(ox,oy);if(dd>0&&dd<rr){const push=(rr-dd)*.2;e.x+=ox/dd*push;e.y+=oy/dd*push;}}}
 }
 for(let i=w.hostile.length-1;i>=0;i--){const s=w.hostile[i];s.x+=s.vx*sec;s.y+=s.vy*sec;const hit=Math.hypot(s.x-p.x,s.y-p.y)<s.r+14;if(hit)damageHunter(state,w,s.dmg,t);if(hit||t>=s.until)w.hostile.splice(i,1);}
 for(let i=w.fx.length-1;i>=0;i--)if(t>=w.fx[i].until)w.fx.splice(i,1);
}
