import {trailDef} from '../game/hunt-trails.js';
export function drawTrail(ctx,h){const z=h.trail?.hazard;if(!z)return;const active=h.elapsedMs>=z.at+1800;ctx.save();ctx.translate(z.x,z.y);ctx.strokeStyle=trailDef(h.depth).color;ctx.fillStyle=active?'rgba(220,111,160,.36)':'rgba(235,218,171,.10)';ctx.lineWidth=active?4:2;ctx.setLineDash(active?[]:[7,6]);
 const rect=(x,y,w,h)=>{ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);};
 if(z.kind==='lane')rect(-34,-260,68,520);
 if(z.kind==='cross'){rect(-27,-220,54,440);rect(-220,-27,440,54);}
 if(z.kind==='ring'){ctx.beginPath();ctx.arc(0,0,125,0,Math.PI*2);ctx.arc(0,0,75,0,Math.PI*2,true);ctx.fill();ctx.stroke();}
 if(z.kind==='islands')for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.beginPath();ctx.arc(Math.cos(a)*85,Math.sin(a)*85,48,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();}
