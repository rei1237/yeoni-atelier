// 전투 결과를 읽기만 하는 원작 패턴 표현. 난수·피해 계산은 렌더러에 두지 않는다.
export function drawKfp(ctx,rt,now,reduced){if(!rt)return;ctx.save();const density=Math.sqrt(Math.max(1,rt.fields.length));
 for(const f of rt.fields){if(now<f.at){const q=(now-f.born)/(f.at-f.born),x=f.sx+(f.x-f.sx)*q,y=f.sy+(f.y-f.sy)*q-Math.sin(q*Math.PI)*55;ctx.fillStyle=f.kind==='gas'?'#a7df66':'#ffc36a';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();continue;}
  const fade=Math.min(1,(f.until-now)/400);ctx.globalAlpha=.12*fade/density;ctx.fillStyle=f.kind==='fire'?'#ff9759':f.kind==='gas'?'#99d86f':'#dfb557';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.85,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.45*fade/density;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,r=f.r*(reduced?.45:.4+.15*Math.sin(now/300+i));ctx.beginPath();ctx.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.8,3,0,Math.PI*2);ctx.fill();}}
 ctx.globalAlpha=1;
 for(const b of rt.beams){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);const fade=Math.max(0,Math.min(1,(b.until-now)/180));
  const glow=ctx.createLinearGradient(0,-b.width/2,0,b.width/2);glow.addColorStop(0,'rgba(244,141,206,0)');glow.addColorStop(.4,'rgba(244,141,206,.22)');glow.addColorStop(.5,'rgba(255,246,220,.52)');glow.addColorStop(.6,'rgba(244,141,206,.22)');glow.addColorStop(1,'rgba(244,141,206,0)');
  ctx.globalAlpha=fade;ctx.fillStyle=glow;ctx.fillRect(0,-b.width/2,b.length,b.width);ctx.strokeStyle='#fff6dc';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(b.length,0);ctx.stroke();ctx.restore();}
 for(const s of rt.shots){if(s.delay>now)continue;ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=s.color;ctx.strokeStyle='#fff1d3';ctx.lineWidth=1.5;
  if(s.kind==='saw'){ctx.rotate(reduced?0:now/95);ctx.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=s.r*(i%2?.72:1);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.globalAlpha=.32;ctx.fill();ctx.globalAlpha=.8;ctx.stroke();}
  else{ctx.rotate(Math.atan2(s.vy,s.vx));ctx.beginPath();ctx.ellipse(0,0,s.r*1.8,s.r,0,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();}
 for(const a of rt.arcs){ctx.save();ctx.globalAlpha=Math.max(0,(a.until-now)/(a.until-a.at));ctx.fillStyle=a.color;ctx.strokeStyle='#fff0db';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.arc(a.x,a.y,a.r,a.angle-a.half,a.angle+a.half);ctx.closePath();ctx.globalAlpha*=.3;ctx.fill();ctx.globalAlpha*=3;ctx.stroke();ctx.restore();}
 for(const o of rt.orbits){ctx.fillStyle=o.color;ctx.strokeStyle='#fff5e9';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(o.x,o.y,o.r,o.r*.55,Math.PI*.25,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();}
