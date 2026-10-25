// Circle-aware sector test, adapted conceptually from killerflowerpig/butcher-sword.js.
export function withinMeleeArc(x,y,angle,range,halfArc,enemy,radius){const dx=enemy.x-x,dy=enemy.y-y,d=Math.hypot(dx,dy);if(d>range+radius)return false;if(d<=radius)return true;const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)));return delta<=halfArc+Math.asin(Math.min(1,radius/d));}
export const facingAngle=a=>Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?'right':'left'):(Math.sin(a)>0?'down':'up');
