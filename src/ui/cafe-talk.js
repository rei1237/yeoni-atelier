// 카페 대화 말풍선: 말하는 사람 머리 위에 짧게 띄우고, 손님 한마디에는 연이·직원이 이어서 받아 준다.
// 화면 연출일 뿐이라 게임 상태는 바꾸지 않는다(ui.talk에만 기록).
import {CAFE_LINES,CAFE_REPLIES,PREP_SCENES,selectLine} from '../data/cafe-dialogue.js';
import {cellToPx,prepSpots} from '../render/cafe-view.js';
import {imageFor} from '../render/assets.js';

export const TALK_MS=3600,TALK_MAX=2,REPLY_DELAY=1400,STAFF_GAP=9000,PREP_FIRST=2500,PREP_GAP=11000,PREP_LINE=2300;
export const newTalk=()=>({items:[],queue:[],seq:0,lastStaff:-1e9,turn:0,prepTurn:0,prepAt:null});
const NAMES={yeoni:'연이',luna:'루나',luna_sis:'루나 언니',neo:'네오'};
const SEATED=new Set(['thinking','requesting','waiting_food','eating']);

function push(talk,e,now){
  talk.items=talk.items.filter(i=>now<i.until&&i.who!==e.who);
  while(talk.items.length>=TALK_MAX)talk.items.shift(); // 가장 오래된 말풍선부터 비킨다
  talk.items.push({...e,id:++talk.seq,at:now,until:now+TALK_MS});
}
const busy=(talk,now)=>talk.items.some(i=>now<i.until)||talk.queue.length>0;

// 손님 한마디 + 1.4초 뒤 받아 주는 말. 이미 대화가 오가는 중이면 이번 말은 건너뛴다.
export function guestTalk(talk,state,ev,now,roll=0){
  const c=state?.customers?.[ev.customerId];
  if(!c||busy(talk,now))return false;
  push(talk,{who:'c:'+c.id,name:ev.kind==='takeaway'?'포장 손님':ev.tableNo?`${ev.tableNo}번 손님`:'손님',line:ev.line,guest:true},now);
  const pool=CAFE_REPLIES[ev.topic]||CAFE_REPLIES[ev.context]||CAFE_REPLIES.arrival;
  const server=ev.context==='served'&&Object.values(state.staff||{}).find(s=>s.servicePose?.tableNo===ev.tableNo&&s.action==='serve')?.id;
  const who=[server,...Object.keys(pool)].find(id=>id&&pool[id]&&state.staff?.[id]);
  if(who)talk.queue.push({at:now+REPLY_DELAY,who,name:NAMES[who]||who,line:selectLine(pool[who],roll)});
  return true;
}

// 손님 대화가 없을 때만 직원끼리 한마디(조리 완료·서빙·계산·피버). 너무 자주 말하지 않게 간격을 둔다.
export function staffTalk(talk,state,who,now){
  if(!state?.staff?.[who]||!CAFE_LINES[who]||busy(talk,now)||now-talk.lastStaff<STAFF_GAP)return false;
  const pool=CAFE_LINES[who];talk.turn+=1;talk.lastStaff=now;
  push(talk,{who,name:NAMES[who]||who,line:pool[talk.turn%pool.length]},now);
  return true;
}

// 영업 흐름이 정한 한마디(마감 준비 등). 잡담 간격과 상관없이 바로 그 사람 머리 위에 띄운다.
export function sayTalk(talk,state,who,line,now){
  if(!state?.staff?.[who])return false;
  talk.queue=talk.queue.filter(q=>q.who!==who);
  push(talk,{who,name:NAMES[who]||who,line},now);
  return true;
}

// 영업 준비 화면: 대화가 없을 때 PREP_GAP마다 장면 하나(첫 줄 바로, 다음 줄은 PREP_LINE 간격으로 예약)
export function prepTalk(talk,state,now){
  if(state?.mode!=='prep')return false;
  talk.prepAt??=now+PREP_FIRST;
  if(now<talk.prepAt||busy(talk,now))return false;
  const here=prepSpots(state),scenes=PREP_SCENES.filter(sc=>sc.every(([who])=>here[who]));
  if(!scenes.length)return false;
  const scene=scenes[talk.prepTurn++%scenes.length];talk.prepAt=now+PREP_GAP;
  scene.forEach(([who,line],i)=>{const e={who,name:NAMES[who]||who,line};if(i)talk.queue.push({...e,at:now+i*PREP_LINE});else push(talk,e,now);});
  return true;
}

// 예약된 대답을 꺼내고 끝난 말풍선을 치운다. 말할 사람이 자리를 떠났으면 그 말풍선도 없앤다.
export function stepTalk(talk,state,now){
  for(const q of talk.queue.filter(q=>now>=q.at))push(talk,q,now);
  talk.queue=talk.queue.filter(q=>now<q.at);
  talk.items=talk.items.filter(i=>now<i.until&&anchorCell(state,i.who));
  return talk.items;
}

export function anchorCell(state,who){
  if(state?.mode==='prep')return who.startsWith('c:')?null:prepSpots(state)[who]||null;
  if(state?.mode!=='shift')return null;
  if(who.startsWith('c:')){const c=state.customers[who.slice(2)];return c&&!c.enterWaiting?{x:c.x,y:c.y,seated:SEATED.has(c.state)}:null;}
  const s=state.staff?.[who];return s?{x:s.x,y:s.y,seated:false}:null;
}

// 화면 좌표(머리 위). 앉은 손님은 그림이 더 크고 발이 의자 위에 있어 조금 더 높다.
export function talkPoint(state,view,who){
  const a=anchorCell(state,who);if(!a||!view)return null;
  const p=cellToPx(view,a.x,a.y);return {x:p.x,y:p.y-view.tile*(a.seated?1.75:1.45)};
}

// 겹치는 말풍선 비켜 놓기: 먼저 뜬 말풍선은 제자리, 다음 것은 위→아래→옆 순서로 빈 곳을 찾는다.
// 입력은 꼬리 끝(하단 가운데) 좌표와 크기, 출력은 화면 안에 들어간 같은 형식의 좌표.
const GAP=6;
export function placeBubbles(list,{width=Infinity,height=Infinity}={}){
  const placed=[],hit=(a,b)=>a.l<b.r+GAP&&b.l<a.r+GAP&&a.t<b.b+GAP&&b.t<a.b+GAP;
  const fit=(x,y,w,h)=>({x:Math.max(w/2+GAP,Math.min(width-w/2-GAP,x)),y:Math.max(h+GAP,Math.min(height-GAP,y))});
  return list.map(({x,y,w,h})=>{
    const base=fit(x,y,w,h),box=p=>({l:p.x-w/2,r:p.x+w/2,t:p.y-h,b:p.y});
    const tries=[base,...placed.flatMap(o=>[{x:base.x,y:o.t-GAP},{x:base.x,y:o.b+h+GAP},{x:o.r+GAP+w/2,y:base.y},{x:o.l-GAP-w/2,y:base.y}])].map(p=>fit(p.x,p.y,w,h));
    const p=tries.find(p=>!placed.some(o=>hit(box(p),o)))||base;
    placed.push(box(p));return {...p,moved:p.x!==base.x||p.y!==base.y};
  });
}

// 매 프레임: 말풍선 DOM을 맞추고 위치만 옮긴다(HTML UI 200ms 갱신과 분리해 흔들리지 않게).
export function syncTalk(layer,state,view,talk,now,{width=Infinity,height=Infinity}={}){
  const items=state?.mode==='shift'||state?.mode==='prep'?stepTalk(talk,state,now):[];
  const keep=new Set(items.map(i=>String(i.id)));
  for(const n of [...layer.children])if(!keep.has(n.dataset.id))n.remove();
  for(const i of items){
    let n=layer.querySelector(`[data-id="${i.id}"]`);
    if(!n){
      n=document.createElement('div');n.dataset.id=i.id;n.className=`talk-bubble ${i.guest?'guest':'staff who-'+i.who}`;
      const b=document.createElement('b'),p=document.createElement('p');b.textContent=i.name;p.textContent=i.line;n.append(b,p);
      n.setAttribute('role','status');layer.append(n);
    }
    const face=!i.guest&&!n.querySelector('.talk-face')&&imageFor('badges/'+i.who); // 초상화는 늦게 받아져도 붙인다
    if(face){const img=document.createElement('img');img.className='talk-face';img.src=face.src;img.alt='';n.prepend(img);}
  }
  const shown=items.map(i=>({i,n:layer.querySelector(`[data-id="${i.id}"]`),pt:talkPoint(state,view,i.who)})).filter(o=>{o.n.hidden=!o.pt;return o.pt;});
  const spots=placeBubbles(shown.map(({n,pt})=>({x:pt.x,y:pt.y,w:n.offsetWidth||180,h:n.offsetHeight||56})),{width,height});
  shown.forEach(({i,n,pt},k)=>{
    const s=spots[k],w=n.offsetWidth||180,tail=Math.max(16,Math.min(w-16,pt.x-s.x+w/2));
    n.style.left=`${s.x}px`;n.style.top=`${s.y}px`;n.style.setProperty('--tail',`${tail}px`);
    n.classList.toggle('lifted',s.moved);n.classList.toggle('fading',i.until-now<450);
  });
}
