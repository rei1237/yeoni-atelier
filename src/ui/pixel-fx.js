import { imageFor } from '../render/assets.js';
// 화면 효과 전용. 시간·보상·변신 상태는 엔진이 이미 확정한 뒤 표시한다.
export function pixelFx(parent, key, {frames=1, duration=720, size=96}={}) {
  if(!parent || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const img=imageFor('ui/'+key);if(!img)return;
  const cv=document.createElement('canvas');cv.width=cv.height=size;cv.className='pixel-fx';cv.setAttribute('aria-hidden','true');parent.append(cv);
  const ctx=cv.getContext('2d'), start=performance.now();ctx.imageSmoothingEnabled=true;
  function draw(now) {
    if(!cv.isConnected || now-start>=duration){cv.remove();return;}
    const frame=Math.min(frames-1,Math.floor((now-start)/duration*frames)),w=img.width/frames;
    ctx.clearRect(0,0,size,size);ctx.drawImage(img,frame*w,0,w,img.height,0,0,size,size);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
