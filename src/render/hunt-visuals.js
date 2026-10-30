// 시각적 크기만 보정한다. 실제 충돌·공격 반경과 전투 수치는 읽기 전용이다.
export function enemyVisualSize(def,scale){
 if(def.boss||def.size>=48)return def.size;
 return Math.min(def.size*1.8,Math.max(def.size*1.5,40/(Math.max(.5,scale)*.75)));
}
export function sajuPhase(swing,now,still=false){
 if(!swing||now<swing.at||now>=swing.until)return null;
 const windup=now<swing.hitAt,q=windup?(now-swing.at)/Math.max(1,swing.hitAt-swing.at):(now-swing.hitAt)/Math.max(1,swing.until-swing.hitAt);
 return {windup,progress:q,alpha:windup?.15+.25*q:Math.pow(1-q,.7),sweep:still?.5:windup?0:Math.min(1,q*2.4),particles:still?0:10};
}
export function drawSaju(ctx,a,now,still=false){
 const p=sajuPhase(a,now,still);if(!p)return;
 const tiger=a.skill==='초승달 일섬',gold=tiger?'#b8d7ff':a.evo?'#dccafa':'#f3cf85',rim=tiger?'#f4f9ff':'#fff4dc';ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);
 ctx.globalAlpha=p.alpha;ctx.lineCap='round';
 if(p.windup){ctx.strokeStyle=gold;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,a.radius*.88,-a.halfArc,a.halfArc);ctx.stroke();ctx.restore();return;}
 const glow=ctx.createRadialGradient(0,0,a.radius*.35,0,0,a.radius);glow.addColorStop(0,'#f4da9b00');glow.addColorStop(.7,tiger?'#7eaeef38':a.evo?'#c7b0e526':'#e4b76e26');glow.addColorStop(1,'#fff1d54d');
 ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,a.radius,-a.halfArc,a.halfArc);ctx.closePath();ctx.fill();
 const tip=-a.halfArc+2*a.halfArc*p.sweep,tail=Math.max(-a.halfArc,tip-a.halfArc*.9);
 for(const [radius,width,color,alpha] of [[.90,15,gold,.12],[.94,7,gold,.25],[.96,3,gold,.65],[1,1.7,rim,.95]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=p.alpha*alpha;ctx.beginPath();ctx.arc(0,0,a.radius*radius,tail,tip+.04);ctx.stroke();}
 if(tiger){ctx.globalAlpha=p.alpha*.7;ctx.strokeStyle='#f4f9ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,a.radius*.82,Math.max(-a.halfArc,tail+.12),tip);ctx.stroke();ctx.globalAlpha=p.alpha*.35;ctx.strokeStyle='#8abfff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,a.radius*.73,Math.max(-a.halfArc,tail+.2),tip);ctx.stroke();}
 for(let k=0;k<p.particles;k++){const v=k/p.particles,angle=-a.halfArc+v*a.halfArc*2,r=a.radius*(.64+.27*((k*7%11)/11)),drift=p.progress*(6+k%3);ctx.globalAlpha=p.alpha*(.2+.5*(1-v));ctx.fillStyle=k%2?rim:gold;const x=Math.cos(angle)*(r+drift),y=Math.sin(angle)*(r+drift);ctx.beginPath();ctx.ellipse(x,y,k%3===0?2.2:1,1,angle,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
