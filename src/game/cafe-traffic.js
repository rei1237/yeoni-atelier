// 발 위치의 최소 간격. 난수·렌더링과 독립된 결정론적 보행 회피.
export const ACTOR_GAP=.64;
export const cafeActors=s=>[...Object.values(s.staff||{}),...Object.values(s.customers||{})].filter(a=>!a.checkoutWaiting&&!a.enterWaiting);
export function trafficStep(e,target,distance,actors,walkable){
 const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<1e-6)return {x:target.x,y:target.y};
 const step=Math.min(distance,d),ux=dx/d,uy=dy/d;
 const others=actors.filter(a=>a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<1.5);
 // 서로 마주치면 각자 진행 방향의 오른쪽으로 비킨다.
 for(const angle of [0,Math.PI/4,Math.PI/2,-Math.PI/4,-Math.PI/2,Math.PI*3/4]){
  const cos=Math.cos(angle),sin=Math.sin(angle),x=e.x+(ux*cos-uy*sin)*step,y=e.y+(ux*sin+uy*cos)*step;
  if(!walkable(x,y))continue;
  if(others.some(a=>{const before=Math.hypot(e.x-a.x,e.y-a.y),after=Math.hypot(x-a.x,y-a.y);if(before<ACTOR_GAP-.001)return after<before+.0001;const vx=x-e.x,vy=y-e.y,t=Math.max(0,Math.min(1,((a.x-e.x)*vx+(a.y-e.y)*vy)/(step*step)));return Math.hypot(e.x+vx*t-a.x,e.y+vy*t-a.y)<ACTOR_GAP-.001;}))continue;
  return {x,y};
 }
 return null;
}
