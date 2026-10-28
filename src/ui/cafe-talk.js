// 카페 대화 말풍선: 말하는 사람 머리 위에 짧게 띄우고, 손님 한마디에는 연이·직원이 이어서 받아 준다.
// 화면 연출일 뿐이라 게임 상태는 바꾸지 않는다(ui.talk에만 기록).
import {CAFE_LINES,CAFE_REPLIES,selectLine} from '../data/cafe-dialogue.js';
import {cellToPx} from '../render/cafe-view.js';

export const TALK_MS=3600,TALK_MAX=2,REPLY_DELAY=1400,STAFF_GAP=9000;
export const newTalk=()=>({items:[],queue:[],seq:0,lastStaff:-1e9,turn:0});
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

// 예약된 대답을 꺼내고 끝난 말풍선을 치운다. 말할 사람이 자리를 떠났으면 그 말풍선도 없앤다.
export function stepTalk(talk,state,now){
  for(const q of talk.queue.filter(q=>now>=q.at))push(talk,q,now);
  talk.queue=talk.queue.filter(q=>now<q.at);
  talk.items=talk.items.filter(i=>now<i.until&&anchorCell(state,i.who));
  return talk.items;
}

export function anchorCell(state,who){
  if(state?.mode!=='shift')return null;
  if(who.startsWith('c:')){const c=state.customers[who.slice(2)];return c&&!c.enterWaiting?{x:c.x,y:c.y,seated:SEATED.has(c.state)}:null;}
  const s=state.staff?.[who];return s?{x:s.x,y:s.y,seated:false}:null;
}

// 화면 좌표(머리 위). 앉은 손님은 그림이 더 크고 발이 의자 위에 있어 조금 더 높다.
export function talkPoint(state,view,who){
  const a=anchorCell(state,who);if(!a||!view)return null;
  const p=cellToPx(view,a.x,a.y);return {x:p.x,y:p.y-view.tile*(a.seated?1.75:1.45)};
}

// 매 프레임: 말풍선 DOM을 맞추고 위치만 옮긴다(HTML UI 200ms 갱신과 분리해 흔들리지 않게).
export function syncTalk(layer,state,view,talk,now,{width=Infinity}={}){
  const items=state?.mode==='shift'?stepTalk(talk,state,now):[];
  const keep=new Set(items.map(i=>String(i.id)));
  for(const n of [...layer.children])if(!keep.has(n.dataset.id))n.remove();
  for(const i of items){
    let n=layer.querySelector(`[data-id="${i.id}"]`);
    if(!n){
      n=document.createElement('div');n.dataset.id=i.id;n.className=`talk-bubble ${i.guest?'guest':'staff'}`;
      const b=document.createElement('b'),p=document.createElement('p');b.textContent=i.name;p.textContent=i.line;n.append(b,p);
      n.setAttribute('role','status');layer.append(n);
    }
    const pt=talkPoint(state,view,i.who);if(!pt){n.hidden=true;continue;}
    const w=n.offsetWidth||180,x=Math.max(w/2+6,Math.min(width-w/2-6,pt.x)),tail=Math.max(14,Math.min(w-14,pt.x-x+w/2));
    n.hidden=false;n.style.left=`${x}px`;n.style.top=`${Math.max(n.offsetHeight+6,pt.y)}px`;n.style.setProperty('--tail',`${tail}px`);
    n.classList.toggle('fading',i.until-now<450);
  }
}
