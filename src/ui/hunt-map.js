// 현재 활성화된 주변 사냥터만 표시한다. 무한 지형 전체나 아직 생성되지 않은 물체는 예측하지 않는다.
const RADIUS=1100;
export function huntMapPoints(world,radius=RADIUS){
 if(!world?.player)return [];
 const {x,y}=world.player,points=[];
 const add=(kind,o)=>{const dx=o.x-x,dy=o.y-y;if(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)<=radius&&Math.abs(dy)<=radius)points.push({kind,x:dx/radius,y:dy/radius});};
 for(let i=0;i<(world.drops?.count||0);i++)add('item',world.drops.items[i]);
 for(const prop of world.props||[])if(prop.treasure)add('chest',prop);
 for(let i=0;i<(world.enemies?.count||0);i++){const e=world.enemies.items[i];add(e.type?.startsWith('boss_')?'boss':'enemy',e);}
 points.push({kind:'player',x:0,y:0});return points;
}
export function drawHuntMap(canvas,world){
 if(!canvas||!world)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height;
 ctx.fillStyle='#171c30';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#303950';ctx.lineWidth=1;
 for(let i=1;i<4;i++){let x=Math.round(i*w/4)+.5,y=Math.round(i*h/4)+.5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 const colors={item:'#8fe7d6',chest:'#edc66b',enemy:'#f08595',boss:'#ffbd79',player:'#fff7dc'},sizes={item:3,chest:5,enemy:3,boss:6,player:6};
 for(const p of huntMapPoints(world)){const n=sizes[p.kind],x=Math.round((p.x+1)*w/2),y=Math.round((p.y+1)*h/2);ctx.fillStyle=colors[p.kind];ctx.fillRect(x-n/2,y-n/2,n,n);}
}
