import { imageFor, loadAssetImages } from '../render/assets.js';
// One bounded cinematic, no gameplay time or state mutation. Owns and cancels its RAF.
export function playTransformation(root,to='cat',onDone=()=>{}){
 const layer=document.createElement('div');layer.className='nv-transformation';layer.setAttribute('aria-label',to==='cat'?'네오가 영냥이로 변신합니다':'영냥이가 네오로 돌아옵니다');
 const cv=document.createElement('canvas');cv.width=720;cv.height=900;layer.append(cv);root.append(layer);root.classList.add('transforming');
 const ctx=cv.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now(),duration=reduced?350:2800;
 let raf=0,done=false;const ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
 const clean=()=>{if(done)return;done=true;cancelAnimationFrame(raf);layer.remove();root.classList.remove('transforming');cancel.running=false;};
 const cancel=()=>clean();cancel.running=true;
 loadAssetImages(undefined,{keys:['portraits/neo','portraits/neo_cat']});
 function actor(key,alpha,scale=1){
  const img=imageFor('portraits/'+key);if(!img||alpha<=0)return;
  const h=key==='neo'?660:420,k=Math.min(610/img.width,h/img.height)*scale;
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,360-img.width*k/2,750-img.height*k,img.width*k,img.height*k);ctx.restore();
 }
 function render(now){
  if(done)return;const t=clamp((now-start)/duration),p=ease(t),from=to==='cat'?'neo':'neo_cat',target=to==='cat'?'neo_cat':'neo';
  ctx.clearRect(0,0,720,900);
  const wash=ctx.createRadialGradient(360,490,10,360,490,440);wash.addColorStop(0,'rgba(32,23,65,.74)');wash.addColorStop(1,'rgba(9,13,34,0)');ctx.fillStyle=wash;ctx.fillRect(0,0,720,900);
  actor(from,1-clamp((p-.30)/.26),1-clamp((p-.34)/.22)*.07);
  actor(target,clamp((p-.48)/.25),.94+.06*ease(clamp((p-.5)/.4)));
  if(!reduced){
   const energy=Math.sin(Math.PI*p),glow=ctx.createRadialGradient(360,500,5,360,500,300);
   glow.addColorStop(0,'rgba(255,243,210,'+(energy*.65)+')');glow.addColorStop(.45,'rgba(208,186,255,'+(energy*.23)+')');glow.addColorStop(1,'rgba(208,186,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,100,720,740);
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(let n=0;n<3;n++){
    ctx.beginPath();const phase=p*Math.PI*2.2+n*2.1;
    for(let j=0;j<=90;j++){const a=j/90*Math.PI*1.55+phase,rx=180+n*30,x=360+Math.cos(a)*rx,y=520+Math.sin(a)*60+(j/90-.5)*(-420*(1-p));j?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.strokeStyle=n%2?'rgba(202,181,255,'+(energy*.8)+')':'rgba(255,220,151,'+(energy*.85)+')';ctx.lineWidth=2.4;ctx.stroke();
   }
   for(let n=0;n<32;n++){
    const a=n*2.399+p*2.8,r=90+(n%9)*20*(1-p*.6),x=360+Math.cos(a)*r,y=650-(p*620+n*27)%620,alpha=energy*(.4+(n%4)*.15);
    ctx.fillStyle='rgba(255,235,193,'+alpha+')';ctx.beginPath();ctx.ellipse(x,y,1.5+n%3,2+n%2,0,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
  if(t<1)raf=requestAnimationFrame(render);else{clean();onDone();}
 }
 raf=requestAnimationFrame(render);return cancel;
}

