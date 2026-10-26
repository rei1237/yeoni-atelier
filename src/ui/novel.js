// Presentation only. Choices return to the caller; engine commands remain in app.js.
import { paintTalkingPortrait } from './talking-portrait.js';
import { SPEAKERS } from '../story/prologue.js';
import { imageFor, loadAssetImages, ASSETS } from '../render/assets.js';
import { setStoryAudio, sound } from './audio.js';
import { playTransformation } from './transformation.js';
import { talkingKey } from '../render/sprite-renderer.js';
const TYPE_MS=32, reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null;
export const novelActive=()=>!!active;
export const novelPlaying=novelActive;
export function playNovel(input,{onEnd,onChoose,onGuideSeen,onCancel}={}){
 if(active)active.close(false);
 const beats=input.slice(),root=document.getElementById('novel');
 root.hidden=false;document.documentElement.classList.add("novel-open");
 root.innerHTML='<div class="nv-bg"><div class="nv-bg-layer a"></div><div class="nv-bg-layer b"></div></div><div class="nv-portraits">'+['l','c','r'].map(k=>'<canvas class="nv-pt '+k+'" width="384" height="460" aria-hidden="true"></canvas>').join('')+'</div><div class="nv-chapter" hidden><b></b></div><div class="nv-box" role="button" tabindex="0" aria-label="다음 대사"><div class="nv-name"></div><p class="nv-text" aria-live="polite"></p><span class="nv-next">다음 ▾</span></div><section class="nv-choice-panel" hidden aria-label="대화 선택지"></section><nav class="nv-tools"><button data-nv="back" aria-label="이전 대사">이전</button><button data-nv="auto">자동</button><button data-nv="log">기록</button><button data-nv="end" class="nv-end">건너뛰기</button></nav><div class="nv-log" hidden><div class="nv-log-list"></div><button data-nv="log">닫기</button></div>';
 const q=s=>root.querySelector(s),box=q('.nv-box'),text=q('.nv-text'),name=q('.nv-name'),next=q('.nv-next'),panel=q('.nv-choice-panel');
 const pts=Object.fromEntries(['l','c','r'].map(k=>[k,q('.nv-pt.'+k)])),layers=[q('.a'),q('.b')],slots={l:null,c:null,r:null};
 let idx=-1,full='',shown=0,typing=false,mode=false,timer=0,wait=0,raf=0,front=0,bgName='',speaker=null,pauseUntil=0,choiceLocked=false,backFloor=0,guideDone=false,transformCancel=null,closed=false;
 const log=[],focusBefore=document.activeElement;
 const stop=()=>{clearTimeout(timer);clearTimeout(wait);};
 function setBg(bg){
  if(!bg||bgName===bg)return;bgName=bg;front=1-front;
  layers[front].className='nv-bg-layer '+(front?'b':'a')+' bg-'+bg+' on';layers[1-front].classList.remove('on');
  const im=imageFor('backgrounds/'+bg);layers[front].style.backgroundImage=im?'url("'+im.src+'")':'';
 }
 function paint(now){
  if(closed)return;
  const visible=Object.values(slots).filter(Boolean).length;root.dataset.castCount=visible;
  for(const k of ['l','c','r']){
   const cv=pts[k],slot=slots[k];cv.classList.toggle('show',!!slot);if(!slot)continue;
   const [key,expression='normal']=slot.split(':');const speaking=key.split('@')[0]===speaker;
   cv.classList.toggle('dim',!!speaker&&!speaking);cv.classList.toggle('shadow',expression==='shadow');cv.classList.toggle('speaking',!!speaker&&speaking);
   if(speaking)box.dataset.speakerSlot=k;
   paintTalkingPortrait(cv,{key,expression,now,talking:typing&&speaking,reduced:reduced(),pauseUntil});
  }
  if(bgName&&!layers[front].style.backgroundImage){const im=imageFor('backgrounds/'+bgName);if(im)layers[front].style.backgroundImage='url("'+im.src+'")';}
  // Dialog height follows actual Korean copy, so portraits never sit behind its first line.
  root.style.setProperty('--nv-box-height',box.offsetHeight+'px');
  raf=requestAnimationFrame(paint);
 }
 function choices(){
  const b=beats[idx];if(!b.choices||choiceLocked)return;
  mode=false;q('[data-nv="auto"]').classList.remove('on');panel.hidden=false;root.classList.add('choosing');next.classList.remove('on');
  q('[data-nv="end"]').textContent=b.skipText||'나중에 이야기하기';
  if(b.guide&&!guideDone){
   const art=ASSETS.guides?.bonds?.path;
   panel.innerHTML='<div class="nv-choice-guide">'+(art?'<img src="'+art+'" alt="마음을 헤아리는 답을 고르는 인연 대화">':'')+'<h3>어떤 마음으로 답할까요?</h3><p>상대의 성격과 지금의 고민을 떠올려 보세요. 답에 따라 인연이 다르게 오르고, 대화를 마치면 행동력 1을 써요.</p><button class="primary" data-nv="guide">마음을 담아 답하기</button></div>';
  }else panel.innerHTML='<p class="nv-choice-label">연이의 대답</p><div class="nv-choices">'+b.choices.map(a=>'<button data-nv="choice" data-choice="'+esc(a.id)+'">'+esc(a.text)+'</button>').join('')+'</div><p class="nv-choice-error" role="status"></p>';
 }
 function finish(){
  clearTimeout(timer);typing=false;text.textContent=full;shown=full.length;
  if(!log.some(e=>e.i===idx))log.push({i:idx,who:SPEAKERS[beats[idx].s]?.name||'',t:full});
  if(beats[idx].choices){choices();return;}next.classList.add('on');
  if(mode)wait=setTimeout(advance,Math.min(5500,1400+full.length*55));
 }
 function show(i,instant=false){
  stop();transformCancel?.();transformCancel=null;idx=i;
  const b=beats[idx];let bg=null,bgm=null;
  Object.keys(slots).forEach(k=>slots[k]=null);
  for(let j=0;j<=i;j++){const x=beats[j];bg=x.bg||bg;bgm=x.bgm||bgm;Object.keys(slots).forEach(k=>{if(k in x)slots[k]=x[k];});}
  setBg(bg);setStoryAudio(bgm||({river_night:'strategy',atelier_dark:'dream',atelier_lit:'tea'}[bg]||'dream'));
  panel.hidden=true;root.classList.remove('choosing');choiceLocked=false;
  q('[data-nv="end"]').textContent='건너뛰기';
  if(b.chapter){
   speaker=null;typing=false;q('.nv-chapter b').textContent=b.chapter[1];q('.nv-chapter').hidden=false;box.classList.add('hide');
   wait=setTimeout(()=>{q('.nv-chapter').hidden=true;box.classList.remove('hide');advance();},instant?1:1700);return;
  }
  q('.nv-chapter').hidden=true;box.classList.remove('hide');
  const sp=SPEAKERS[b.s];speaker=sp?.portrait?.split('@')[0]||null;
  box.className='nv-box sp-'+(sp?'char':b.s)+' who-'+b.s;name.textContent=sp?.name||'';name.hidden=!sp;
  full=b.t||'';shown=0;text.textContent='';next.classList.remove('on');
  const start=()=>{
   if(closed)return;
   if(instant||reduced())return finish();
   typing=true;
   const tick=()=>{shown++;text.textContent=full.slice(0,shown);if(shown>=full.length)return finish();const punct=/[,，.。!?…]/.test(full[shown-1]);if(punct)pauseUntil=performance.now()+180;timer=setTimeout(tick,punct?210:TYPE_MS);};
   timer=setTimeout(tick,TYPE_MS);
  };
  // fx:'transform' 은 장면의 가운데 인물(c)로 방향을 정한다: 영냥이가 나오면 고양이로, 아니면 사람으로
  const tf=b.transform||(b.fx==='transform'?(/^neo_cat/.test(b.c||'')?'cat':'human'):null);
  if(b.fx&&b.fx!=='transform'&&!instant&&!reduced()){root.classList.add('fx-'+b.fx);setTimeout(()=>root.classList.remove('fx-'+b.fx),700);}
  if(tf&&!instant){typing=false;transformCancel=playTransformation(root,tf,start);}else start();
 }
 function advance(){if(idx+1>=beats.length)return close(true);show(idx+1);}
 function tap(){if(transformCancel?.running||!q('.nv-log').hidden||!q('.nv-chapter').hidden||beats[idx]?.choices)return;if(typing)finish();else advance();}
 function close(done){
  if(closed)return;closed=true;stop();cancelAnimationFrame(raf);transformCancel?.();setStoryAudio(null);
  root.removeEventListener('click',click);window.removeEventListener('keydown',key,true);root.hidden=true;document.documentElement.classList.remove("novel-open");root.innerHTML='';root.classList.remove('choosing','transforming');active=null;
  if(done)onEnd?.();else onCancel?.();focusBefore?.focus?.({preventScroll:true});
 }
 function click(e){
  e.stopPropagation();const b=e.target.closest('[data-nv]');if(!b)return tap();const act=b.dataset.nv;
  if(act==='choice'){
   if(choiceLocked)return;choiceLocked=true;const result=onChoose?.(b.dataset.choice,beats[idx]);
   if(!result?.ok){choiceLocked=false;const el=q('.nv-choice-error');if(el)el.textContent=result?.reason||'답을 다시 골라 주세요.';return;}
   sound('bond');beats.splice(idx+1,0,...(result.beats||[]));backFloor=idx+1;advance();
  }else if(act==='guide'){guideDone=true;onGuideSeen?.();choices();}
  else if(act==='auto'){if(beats[idx]?.choices)return;mode=!mode;b.classList.toggle('on',mode);clearTimeout(wait);if(mode&&!typing)wait=setTimeout(advance,1500);}
  else if(act==='log'){const el=q('.nv-log');el.hidden=!el.hidden;if(!el.hidden){mode=false;stop();if(typing)finish();q('.nv-log-list').innerHTML=log.map(x=>'<p>'+(x.who?'<b>'+esc(x.who)+'</b>':'')+esc(x.t)+'</p>').join('');q('.nv-log-list').scrollTop=1e6;}}
  else if(act==='back'){let j=idx-1;while(j>backFloor&&beats[j].chapter)j--;if(j>=backFloor)show(j,true);}
  else if(act==='end'){
   if(beats[idx]?.choices)return close(false);
   const c=beats.findIndex((x,i)=>i>idx&&x.choices);if(c>=0)show(c,true);else close(true);
  }
 }
 function key(e){if(e.target.closest?.('button'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();tap();}else if(e.key==='Escape'&&!q('.nv-log').hidden)q('.nv-log').hidden=true;}
 root.addEventListener('click',click);window.addEventListener('keydown',key,true);active={close};raf=requestAnimationFrame(paint);
 // Load only the cast/backdrops for this story, never the whole portrait catalogue.
 const keys=new Set();for(const b of beats){if(b.bg)keys.add('backgrounds/'+b.bg);for(const k of ['l','c','r'])if(b[k])keys.add('talking/'+talkingKey(b[k]));}
 loadAssetImages(undefined,{keys:[...keys]});box.focus({preventScroll:true});advance();
}
