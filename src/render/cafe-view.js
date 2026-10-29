import {catCafeActive} from '../game/cat-cafe-rules.js';
import {customerPose} from './customer-pose.js';
import {cookingPose,staffCookingPose} from './cooking-pose.js';
import {closingChore} from './staff-motion.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {assignedHosts,cafeCapacity} from '../game/capacity.js';
import {REMODELS,exteriorOf} from '../game/grounds.js';
import { customerLook } from '../data/customer-looks.js';
// 카페 화면 그리기(Canvas 2D). 상태를 읽기만 한다. 모든 시각 상태는 실제 게임 상태에서 나온다.
// 좌표: 상태의 x, y 는 타일 단위(칸 중심 = +0.5). view 가 타일 → 픽셀 변환을 맡는다.

import { GRID, FIXTURES, FURNITURE, SPOTS, RESERVED, AREAS, areaCells, cafeLayout } from '../data/layout.js';
import { PDF } from '../config/balance.pdf.js';
import { PEOPLE, STAFF_CREW } from '../data/companions.js';
import { MENUS } from '../data/menus.js';
import { OUTFITS } from '../data/outfits.js';
import {atmosphere} from '../game/cafe-growth.js';
import { CUSTOMER_WEALTH } from '../data/customer-wealth.js';
import {personName,usableHosts,shiftDuration} from '../game/state.js';
import { TEMP } from '../config/balance.temp.js';
import { ASSETS,imageFor } from './assets.js';
import { furnitureCells } from '../game/space.js';
import { drawActor, roundRect, drawObjectImage, drawFood, nameTag } from './sprite-renderer.js';

export function cafeBounds(state){const a=state?.interior?.areas||[];return {cols:a.includes('east_wing')||a.includes('garden_wing')?20:12,rows:Math.max(a.includes('garden_wing')?24:16,...AREAS.filter(x=>x.branchMin&&a.includes(x.id)).map(x=>x.rect[3]+1))};}
export function computeView(w,h,camera={}){
 const cols=camera.cols||12,rows=camera.rows||16;
 // 벽과 테두리는 논리 바닥 밖에 둔다. 모든 터치·배지·배우는 같은 바닥 좌표를 쓴다.
 const fit=Math.max(8,Math.floor(Math.min(w/(cols+2.2),h/(rows+3))*100)/100),expanded=cols>12||rows>16;
 const readable=!camera.overview&&expanded;
 const tile=(readable?Math.max(fit,w<600?28:38):fit)*(camera.zoom||1);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n)),extraX=Math.max(0,tile*(cols+2.2)-w),extraY=Math.max(0,tile*(rows+3)-h);
 const baseX=Math.round((w-tile*cols)/2),baseY=Math.round((h-tile*(rows+3))/2)+tile*3;
 const focusX=readable?w/2-tile*6-baseX:0,focusY=readable?h/2-tile*(expanded?8:5)-baseY:0;
 return {tile,ox:baseX+clamp(focusX+(camera.x||0),-extraX/2,extraX/2),oy:baseY+clamp(focusY+(camera.y||0),-extraY/2,extraY/2),w,h,cols,rows};
}
export const cellToPx = (v, x, y) => ({ x: v.ox + x * v.tile, y: v.oy + y * v.tile });
export const pxToCell = (v, px, py) => ({ x: Math.floor((px - v.ox) / v.tile), y: Math.floor((py - v.oy) / v.tile) });

const isFloorDef = def => def.cells.every(c => c.kind === 'floor');

function cellsBox(cells) {
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
}

// 이름표는 모든 배우를 그린 뒤 한 번에 놓는다. 겹치면 앞(아래쪽) 이름표를 한 줄씩 아래로 민다.
// 테이블 말풍선(avoid)에 가리면 머리 위(up)로 올린다.
function drawNameTags(ctx, tags, size, avoid = []) {
  const fs = Math.max(12, Math.min(14, Math.round(size * 0.2))), h = fs + 10, placed = [];
  ctx.font = `600 ${fs}px "Yeoni UI", sans-serif`;
  for (const g of tags.sort((a, b) => a.y - b.y)) {
    const w = ctx.measureText(g.text).width + 16;
    let y = g.y;
    for (let moved = true, n = 0; moved && n < 6; n++) {
      moved = false;
      for (const r of placed) if (Math.abs(r.x - g.x) < (r.w + w) / 2 && y < r.y + h && y + h > r.y) { y = r.y + h; moved = true; }
    }
    const hit = y => avoid.some(r => Math.abs(r.x - g.x) < (r.w + w) / 2 && y < r.y + r.h && y + h > r.y);
    if (g.up != null && hit(y) && !hit(g.up) && !placed.some(r => Math.abs(r.x - g.x) < (r.w + w) / 2 && g.up < r.y + h && g.up + h > r.y)) y = g.up;
    placed.push({ x: g.x, y, w });
    nameTag(ctx, g.text, g.x, y, size, g.color);
  }
}

function label(ctx, text, x, y, size, color = '#3b2f2f', align = 'center') {
  ctx.font = `700 ${Math.max(10, Math.round(size))}px system-ui, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function outfitLook(state, who) {
  if(who==='neo'&&catCafeActive(state))return {};
  const eq = state.outfits?.equipped?.[who];
  if (!eq) return {};
  return {
    outfitId: eq.outfit,
    body: eq.outfit ? OUTFITS[eq.outfit]?.color : undefined,
    accents: [eq.acc1, eq.acc2].filter(Boolean).map(id => OUTFITS[id]?.color).filter(Boolean),
  };
}

// opts: { selectedUid, problemUids:Set, t }
export function drawCafe(ctx, state, v, opts = {}) {
  const layout=cafeLayout(state,true),{spots:SPOTS,fixtures:FIXTURES,reserved:RESERVED}=layout;
  const T = v.tile, t = opts.t || 0;
  const P = (x, y) => cellToPx(v, x, y);
  ctx.fillStyle = '#eadbc8'; ctx.fillRect(0, 0, v.w, v.h);

  const luxurious=atmosphere(state)>=20;
  const backdrop=imageFor((REMODELS[exteriorOf(state).theme]||REMODELS.original).interior);
  if(backdrop&&v.cols===12&&v.rows===16)ctx.drawImage(backdrop,v.ox-T*1.1,v.oy-T*3,T*14.2,T*19);
  // 바닥
  for (let y = 0; y < v.rows; y++) for (let x = 0; x < v.cols; x++) {
    if(backdrop && v.cols===12 && v.rows===16 && !state.interior.draft)continue;
    const p = P(x, y);
    ctx.fillStyle = y === 0 ? '#e8dbc8' : '#f3e8d9';
    ctx.fillRect(p.x,p.y,T+.5,T+.5);
    ctx.globalAlpha = y === 0 ? .5 : .22;
    const tiled = drawObjectImage(ctx, 'tiles', y === 0 ? 'cafe_wall' : 'cafe_floor', p.x, p.y, T, T);
    ctx.globalAlpha = 1;
    if (tiled) continue;
    ctx.fillStyle = y === 0 ? '#e9dccb' : (x + y) % 2 ? '#f6ead9' : '#f1e2cd';
    ctx.fillRect(p.x, p.y, T + 0.5, T + 0.5);
  }
  // 증축 경계와 안내판은 가구 편집 중에만 표시한다.
  const open = state.interior.areas || [];
  for (const a of (state.interior.draft ? AREAS : [])) {
    if (open.includes(a.id) || a.rect[0]>=v.cols || a.rect[1]>=v.rows) continue;
    const [x0,y0,x1,y1]=a.rect, p=P(x0,y0), aw=(x1-x0+1)*T, ah=(y1-y0+1)*T, focus=opts.focusArea===a.id;
    // 꾸미기 '공간 확장'에서 고른 구역은 장미빛으로 넓어질 면적을 보여 준다.
    ctx.save();ctx.fillStyle=focus?'#e88aa83a':'#63536416';ctx.fillRect(p.x,p.y,aw,ah);
    ctx.strokeStyle=focus?'#c4567c':'#8e775b99';ctx.lineWidth=focus?2.5:1;ctx.setLineDash(focus?[8,5]:[3,5]);ctx.strokeRect(p.x+2,p.y+2,aw-4,ah-4);ctx.setLineDash([]);
    const w=Math.max(56,Math.min(aw-8,112)),cx=p.x+aw/2,cy=a.id==='salon'&&layout.counterArt?p.y+T*.5:p.y+ah/2,fs=Math.max(11,Math.min(13,T*.4));
    ctx.fillStyle='#fff9eff2';ctx.strokeStyle='#b8a385';roundRect(ctx,cx-w/2,cy-25,w,50,5);ctx.fill();ctx.stroke();
    ctx.font=`600 ${fs}px "Yeoni UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#584052';ctx.fillText(a.name,cx,cy-9,w-8);
    ctx.font='11px "Yeoni UI",sans-serif';ctx.fillStyle='#78634e';ctx.fillText('꾸미기 · 증축',cx,cy+10,w-8);ctx.restore();
  }
  // 입구 매트
  const ent = P(SPOTS.entrance.x, SPOTS.entrance.y);
  ctx.fillStyle = '#c9a27c'; ctx.fillRect(ent.x + T * 0.1, ent.y + T * 0.55, T * 0.8, T * 0.4);
  label(ctx, '입구', ent.x + T / 2, ent.y + T * 0.75, T * 0.26, '#fff');

  const editing = !!state.interior.draft;
  const list = (editing ? state.interior.draft.furniture : state.interior.furniture).filter(f => f.x != null);

  if (editing) {
    ctx.fillStyle = 'rgba(200,80,80,0.10)';
    for (const [x, y] of RESERVED) { const p = P(x, y); ctx.fillRect(p.x, p.y, T, T); }
    for(const [i,spot]of (layout.queue||[]).entries()){const p=P(spot.x+.5,spot.y+.5);ctx.fillStyle='#6c998955';ctx.beginPath();ctx.arc(p.x,p.y,T*.24,0,Math.PI*2);ctx.fill();ctx.fillStyle='#365b4c';ctx.font=`600 ${Math.max(8,T*.32)}px sans-serif`;ctx.textAlign='center';ctx.fillText(String(i+1),p.x,p.y+T*.1);}
    ctx.strokeStyle = 'rgba(120,90,60,0.25)'; ctx.lineWidth = 1;
    for (let x = 0; x <= v.cols; x++) { const p = P(x, 0); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + T * v.rows); ctx.stroke(); }
    for (let y = 0; y <= v.rows; y++) { const p = P(0, y); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + T * v.cols, p.y); ctx.stroke(); }
  }

  // 바닥 장식(러그 등)
  for (const f of list) {
    const def = FURNITURE[f.defId];
    if (!isFloorDef(def)) continue;
    if (drawWhole(ctx, f, P, T)) continue;
    for (const c of furnitureCells(f)) {
      const p = P(c.x, c.y);
      ctx.fillStyle = def.color; ctx.globalAlpha = 0.55; ctx.fillRect(p.x + 1, p.y + 1, T - 2, T - 2); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(p.x + T / 2, p.y + T / 2, T * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  }

  // 고정 설비
  for (const fx of FIXTURES) {
    if (fx.wall) continue;
    const b = cellsBox(fx.cells), p = P(b.x, b.y);
    if(fx.id==='counter'&&layout.counterArt){const a=layout.counterArt;drawObjectImage(ctx,'objects',a.key||(!luxurious?'basic_counter':'counter'),P(a.x,a.y).x,P(a.x,a.y).y,T*a.w,T*a.h);continue;}
    if (!drawObjectImage(ctx, 'objects', !luxurious && ASSETS.objects[`basic_${fx.id}`] ? `basic_${fx.id}` : fx.id, p.x-T*.25, p.y, b.w*T+T*.5, T*1.9)) {
      ctx.fillStyle = fx.color;
      roundRect(ctx, p.x + 2, p.y + 2, b.w * T - 4, b.h * T - 4, T * 0.15); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(p.x + 4, p.y + 4, b.w * T - 8, T * 0.18);
    }

  }

  // 가구(테이블·의자·막는 장식)
  const pieces=[];
  // 계산대 앞판은 직원의 다리 앞, 손님의 몸 뒤다. 상판 위 손과 얼굴은 가리지 않는다.
  const cashier=FIXTURES.find(f=>f.id==='counter'),cb=cellsBox(cashier.cells),cp=P(cb.x,cb.y);
  pieces.push({depth:layout.counterArt?.depth??SPOTS.yeoniHome.y+1,paint:()=>{ctx.save();ctx.beginPath();if(layout.counterArt){const a=layout.counterArt,p=P(a.x,a.y);ctx.rect(p.x,P(0,a.frontY).y,T*a.w,T*(a.y+a.h-a.frontY));ctx.clip();drawObjectImage(ctx,'objects',a.key||(!luxurious?'basic_counter':'counter'),p.x,p.y,T*a.w,T*a.h);}else{ctx.rect(cp.x-T*.25,cp.y+T*1.05,cb.w*T+T*.5,T*.85);ctx.clip();drawObjectImage(ctx,'objects',!luxurious?'basic_counter':'counter',cp.x-T*.25,cp.y,cb.w*T+T*.5,T*1.9);}ctx.restore();}});
  const tablesByUid = new Map((state.tables || []).map(tb => [tb.uid, tb]));
  for(const f of list){
    const def=FURNITURE[f.defId];if(isFloorDef(def))continue;
    if(def.chair){const p=P(f.x,f.y);pieces.push({depth:f.y+.65,paint:()=>drawChair(ctx,p,T,f.rot,luxurious)});if((state.tables||[]).some(tb=>tb.chairUid===f.uid&&tb.customerId))pieces.push({depth:f.y+.94,paint:()=>drawChairBack(ctx,p,T,f.rot)});continue;}
    if(!def.table){const cells=furnitureCells(f);pieces.push({depth:Math.max(...cells.map(c=>c.y))+1,paint:()=>{if(!drawWhole(ctx,f,P,T))for(const c of cells)drawDecor(ctx,f.defId,def,P(c.x,c.y),T);}});continue;}
    const footprint=furnitureCells(f);if(def.table&&footprint.filter(c=>c.kind==='table').length>1){const box=cellsBox(footprint.map(c=>[c.x,c.y])),p=P(box.x,box.y),k=(Math.max(box.w,box.h)+.9)/1.9;pieces.push({depth:box.y+box.h+.1,paint:()=>drawTable(ctx,state,{x:p.x+(box.w-k)*T/2,y:p.y+(box.h-k)*T/2},T*k,f,tablesByUid.get(f.uid),t)});continue;}
    for(const c of footprint){const p=P(c.x,c.y);
      if(c.kind==='table')pieces.push({depth:c.y+1.1,paint:()=>drawTable(ctx,state,p,T,f,tablesByUid.get(f.uid),t)});
      else if(c.kind==='chair')pieces.push({depth:c.y+.65,paint:()=>drawObjectImage(ctx,'objects',luxurious?'chair':'basic_chair',p.x-T*.18,p.y-T*.58,T*1.36,T*1.36)});
    }
  }



  // 캐릭터: y 순으로 정렬해 앞뒤를 맞춘다
  const actors = [];
  if (state.mode === 'shift') {
    for (const c of Object.values(state.customers)) {
      if(c.enterWaiting)continue;
      const pose=customerPose(state,c,opts.reducedMotion);
      actors.push({key:pose.key,x:c.x,y:c.y,seated:pose.seated,seatBlend:pose.seatBlend,cashierFront:layout.id==='legacy'&&c.state==='checkout'&&c.x>SPOTS.yeoniHome.x&&c.y<SPOTS.checkout.y+1.2,o:{state:pose.state,facing:pose.facing,walkDistance:c.walkDistance,animationFrame:pose.animationFrame,flipX:pose.flipX,name:null}});
    }
    for (const s of Object.values(state.staff)) {
      if(s.id==='neo'&&onStage(state,'neo'))continue; // 무대에 오른 네오는 아래 공연 줄에 선다
      const map = { walk: 'walk', serve: 'serve', clean: 'clean', host: 'host', react: 'react' };
      let st = map[s.action] || 'idle';
      if (s.action === 'cook') st = 'cook'; // 루나 언니가 굽는 중
      actors.push({ key: s.id==='neo'&&catCafeActive(state)?'neo_cat_cafe':ASSETS.actors[s.id] ? s.id : 'customer', x: s.x, y: s.y, o: { state: st, walkDistance:s.walkDistance, servicePose:s.id==='neo'&&catCafeActive(state)?null:s.servicePose?{...s.servicePose,progress:Math.max(0,Math.min(1,(state.shift.elapsedMs-s.servicePose.at)/(s.servicePose.until-s.servicePose.at)))}:null, cooking:staffCookingPose(state,s,opts.reducedMotion), closing:s.id==='neo'&&catCafeActive(state)?null:closingChore(s.id,s,state.shift.elapsedMs,shiftDuration(state),TEMP.CLOSING_MS,opts.reducedMotion), gesture:s.id==='yeoni'&&state.cafeGesture&&state.shift.elapsedMs-state.cafeGesture.at<1040?{...state.cafeGesture,age:state.shift.elapsedMs-state.cafeGesture.at}:null, cleaning:s.action==='clean', facing: s.facing, name: staffName(state, s.id), carry: s.carry ? { color: MENUS[s.carry.menuId].color,menuId:s.carry.menuId } : null, carryMore: (s.carryMore||[]).map(it=>it.menuId), ...outfitLook(state, s.id) } });
    }
    if(state.stage?.activeUntil!=null)actors.push(...stageLineup(state,actors,opts.reducedMotion));
  } else if (state.mode === 'prep' || state.mode === 'settlement') {
    const personalJob=state.foodGifts?.job?.maker==='yeoni'?state.foodGifts.job:null;
    actors.push({ key: 'yeoni', x: (personalJob?SPOTS.drinkFront.x:SPOTS.yeoniHome.x) + 0.5, y: (personalJob?SPOTS.drinkFront.y:SPOTS.yeoniHome.y) + 0.5, o: { cooking:personalJob?cookingPose(personalJob,MENUS[personalJob.menuId].station,opts.reducedMotion):null,state:personalJob?'cook':'idle', facing: layout.yeoniFacing, name: '연이', ...outfitLook(state, 'yeoni') } });
    for (const id of STAFF_CREW) {
      const home = id === 'luna' ? SPOTS.lunaHome : SPOTS.sisHome;
      actors.push({ key: id, x: home.x + 0.5, y: home.y + 0.5, o: { state: id==='luna_sis'&&state.foodGifts?.job?.maker==='luna_sis'?'cook':'idle',cooking:id==='luna_sis'&&state.foodGifts?.job?.maker==='luna_sis'?cookingPose(state.foodGifts?.job,MENUS[state.foodGifts?.job?.menuId]?.station,opts.reducedMotion):null, facing: id==='luna_sis'&&state.foodGifts?.job?.maker==='luna_sis'?'up':'down', name: PEOPLE[id].name, ...outfitLook(state, id) } });
    }
    if (assignedHosts(state).includes('neo') && state.people.neo?.activity === 'idle') actors.push({ key: catCafeActive(state)?'neo_cat_cafe':'neo', x: SPOTS.neoHome.x + 0.5, y: SPOTS.neoHome.y + 0.5, o: { state: 'idle', facing: 'down', name: personName(state,'neo'), ...outfitLook(state, 'neo') } });
    assignedHosts(state).filter(id=>id!=='neo'&&!STAFF_CREW.includes(id)).forEach((id,i)=>actors.push({key:id,x:2.5+(i%4)*2,y:10.5+Math.floor(i/4)*2,o:{state:'idle',facing:'down',name:personName(state,id),...outfitLook(state,id)}}));
  }
  actors.sort((a, b) => a.y - b.y);
  const tags = [];
  for(const a of actors){const p=P(a.x,a.y),blend=a.seatBlend,actorSize=blend==null?(a.seated?2.2:1.8):1.8+.4*blend,foot=p.y+T*(blend==null?(a.seated?-.10:.32):.32+(-.10+17/128*2.2-.32)*blend);pieces.push({depth:a.cashierFront?SPOTS.yeoniHome.y+1.1:a.y+(a.seated?.28:.32),paint:()=>drawActor(ctx,a.key,{...a.o,name:null,x:p.x,y:foot,size:T*actorSize,idleMotion:!a.seated&&!editing&&!state.paused,reducedMotion:opts.reducedMotion,t})});if(a.o.name)tags.push({text:a.o.name,x:p.x,up:foot-T*1.65-24,y:['serve','clean'].includes(a.o.state)?foot-T*1.65-24:foot+4+(a.o.state==='host'?Math.max(20,T*.65):0),color:a.o.tagColor});}
  pieces.sort((a,b)=>a.depth-b.depth);for(const piece of pieces)piece.paint();
  for (const paint of stageRain.splice(0)) paint(); // 손님 위, 주문 말풍선 아래
  if(state.mode==='shift')drawStations(ctx,state,v);
  // 피할 자리: 화면이 실제 말풍선·확대 버튼 크기를 넘겨 주면(opts.tagAvoid) 그것을, 없으면 tableBadgesHtml 기준점과 최소 폭 44px로 어림한다
  const badges = opts.tagAvoid || (state.mode === 'shift' ? state.tables.filter(t => t.customerId || t.state === 'dirty' || t.state === 'cleaning').map(t => { const b = P(t.table.x + .5, t.table.y + .15); return { x: b.x, y: b.y - 44 - T * .35, w: 44, h: 46 }; }) : []);
  drawNameTags(ctx, tags, T * 1.8, badges);

  // 편집 표시: 선택 가구와 문제 가구
  if (editing) {
    for (const f of list) {
      const bad = opts.problemUids?.has(f.uid);
      const sel = opts.selectedUid === f.uid;
      if (!bad && !sel) continue;
      ctx.lineWidth = sel ? 3 : 2;
      ctx.strokeStyle = bad ? '#b13f39' : '#4b704b';
      ctx.setLineDash(bad && !sel ? [5, 4] : []);
      for (const c of furnitureCells(f)) { const p = P(c.x, c.y);ctx.fillStyle=bad?'rgba(177,63,57,.28)':'rgba(75,112,75,.22)';ctx.fillRect(p.x,p.y,T,T); ctx.strokeRect(p.x + 2, p.y + 2, T - 4, T - 4); }
      if(sel&&state.interior.draft.itemBefore){const b=cellsBox(furnitureCells(f).map(c=>[c.x,c.y])),p=P(b.x+b.w/2,b.y);label(ctx,bad?'여기는 놓을 수 없어요':'미리보기 · 여기에 놓기',p.x,p.y-8,Math.max(12,T*.32),bad?'#a32f2f':'#315734');}
      ctx.setLineDash([]);
    }
  }
}

function staffName(state, id) {
  if (id === 'yeoni') return '연이';
  if(id==='neo')return personName(state,id);
  if (PEOPLE[id]) return PEOPLE[id].name;
  return id.startsWith('dev_') ? 'DEV' : personName(state,id);
}

function drawTable(ctx, state, p, T, f, tb, t) {
  const visit = tb?.customerId ? state.visits[state.customers[tb.customerId]?.visitId] : null;
  if (visit?.fevered && state.fever.activeUntil != null) {
    ctx.fillStyle = `rgba(255,200,60,${0.35 + Math.sin(t / 150) * 0.15})`;
    ctx.beginPath(); ctx.arc(p.x + T / 2, p.y + T / 2, T * 0.72, 0, Math.PI * 2); ctx.fill();
  }
  if (!drawObjectImage(ctx, 'objects', atmosphere(state)>=20?'table':'basic_table', p.x-T*.45, p.y-T*.45, T*1.9, T*1.9)) {
    ctx.fillStyle = '#c79a6b';
    roundRect(ctx, p.x + T * 0.08, p.y + T * 0.12, T * 0.84, T * 0.76, T * 0.18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(p.x + T * 0.14, p.y + T * 0.16, T * 0.72, T * 0.12);
  }
  if (visit?.stageThrown && state.stage?.activeUntil != null) stageRain.push(() => drawStageRain(ctx, p, T, t, visit.tableNo || 0));
  if (tb?.state === 'dirty' || tb?.state === 'cleaning') {
    ctx.save();
    ctx.globalAlpha=tb.state==='cleaning'?Math.max(0,(tb.cleanEndAt-state.shift.elapsedMs)/(tb.cleanMs||PDF.CLEAN_MS)):1;
    ctx.fillStyle='#fff9ec';ctx.strokeStyle='#ad9275';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(p.x+T*.48,p.y+T*.5,T*.22,T*.11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b58c62';ctx.beginPath();ctx.ellipse(p.x+T*.68,p.y+T*.4,T*.08,T*.1,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8a6142';for(let i=0;i<4;i++)ctx.fillRect(p.x+T*(.25+i*.13),p.y+T*(.62+(i%2)*.06),T*.04,T*.025);
    ctx.restore();
  }
  if (tb?.state === 'cleaning' && tb.cleanEndAt != null) {
    const k = 1 - Math.max(0, tb.cleanEndAt - state.shift.elapsedMs) / (tb.cleanMs || PDF.CLEAN_MS);
    ctx.strokeStyle = '#4fa3d9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x + T / 2, p.y + T / 2, T * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k)); ctx.stroke();
  }
  // 서빙된 음식 접시
  if (visit) {
    const served = visit.orderIds.map(id => state.orders[id]).filter(o => o && o.status === 'served').slice(-2);
    served.forEach((o, i) => {
      const cx = p.x + T * (served.length === 1 ? 0.5 : 0.33 + i * 0.34), cy = p.y + T * 0.55;
      ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.arc(cx, cy, T * 0.15, 0, Math.PI * 2); ctx.fill();
      drawFood(ctx, o.menuId, cx, cy + T * 0.07, T * (served.length === 1 ? 0.5 : 0.4));
    });
  }
  // 테이블 번호(색만이 아니라 숫자로)
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + T * 0.2, p.y + T * 0.22, T * 0.16, 0, Math.PI * 2); ctx.fill();
  label(ctx, String(f.tableNo), p.x + T * 0.2, p.y + T * 0.23, T * 0.24, '#5a3b22');
}

// 무대 공연: 네오를 가운데에, 나머지 멤버를 좌우로 홀 가운데 줄에 세우고 노래 → 춤 → 인사를 3초씩 돈다.
// 계산대가 비어 있으면 연이는 박수·응원봉을 흔들고, 금화가 날아온 직후에는 금화를 받아 든다.
const STAGE_BEAT_MS=3000,STAGE_ROW_Y=7,STAGE_GAP=1.5; // 기본 배치에서 비어 있는 LP 플레이어 옆 줄
const onStage=(state,id)=>state.stage?.activeUntil!=null&&state.people[id]?.activity==='performing'&&!(id==='neo'&&catCafeActive(state));
export function stageLineup(state,actors,reduced){
 const st=state.stage,now=state.shift.elapsedMs,start=st.activeUntil-TEMP.STAGE.DURATION_MS;
 const phase=['sing','dance','greet'][Math.floor(Math.max(0,now-start)/STAGE_BEAT_MS)%3];
 const ids=(st.performers||[]).filter(id=>onStage(state,id)).sort((a,b)=>(b==='neo')-(a==='neo'));
 const yeoni=actors.find(a=>a.key==='yeoni');
 if(yeoni&&ASSETS.actors.yeoni_cheer&&(yeoni.o.state||'idle')==='idle'&&!yeoni.o.gesture&&!yeoni.o.carry){
  const since=now-(st.nextThrowAt-TEMP.STAGE.THROW_EVERY_MS);
  Object.assign(yeoni,{key:'yeoni_cheer',o:{...yeoni.o,state:st.gold>0&&since>=0&&since<1200?'count':Math.floor(now/STAGE_BEAT_MS)%2?'cheer':'clap',facing:'down',outfitId:null,animationFrame:reduced?0:null}});
 }
 return ids.map((id,i)=>{const side=i?Math.ceil(i/2)*(i%2?-1:1):0,key=ASSETS.actors[id+'_stage']?id+'_stage':id;
  return {key,x:6+side*STAGE_GAP,y:STAGE_ROW_Y,o:{state:key===id?'idle':phase,facing:'down',animationFrame:reduced?0:null,name:staffName(state,id)}};});
}

// 여러 칸짜리 가구 그림을 한 장으로 그린다(러그·책장 등). 그림이 없으면 false.
// 무대 공연: 금화를 던진 테이블 위로 꽃잎 지폐와 금화가 흩날린다(캐릭터를 그린 뒤 한꺼번에, 효과 시트가 없으면 도트)
const stageRain = [];
function drawStageRain(ctx, p, T, t, seed) {
  const fx = imageFor('effects/stage_fx');
  if (fx) { // 줄 0 꽃잎 지폐 · 1 금화 · 2 벚꽃잎, 칸마다 4프레임
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const ph = (t / 1100 + i / 7 + seed * 0.17) % 1, size = T * (i % 3 === 2 ? 0.42 : 0.56);
      const x = p.x + T * (-0.3 + ((i * 37 + seed * 23) % 160) / 100) + Math.sin(t / 280 + i * 1.7) * T * 0.1;
      const y = p.y - T * 0.7 + ph * T * 1.4;
      ctx.globalAlpha = 1 - ph * 0.7;
      ctx.drawImage(fx, (Math.floor(t / 140 + i) % 4) * 128, (i % 3) * 128, 128, 128, x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
    return;
  }
  const u = Math.max(2, Math.round(T / 18));
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const ph = (t / 1100 + i / 7 + seed * 0.17) % 1;
    const x = Math.round(p.x + T * (-0.3 + ((i * 37 + seed * 23) % 160) / 100) + Math.sin(t / 280 + i * 1.7) * u * 2);
    const y = Math.round(p.y - T * 0.7 + ph * T * 1.4);
    ctx.globalAlpha = 1 - ph * 0.7;
    if (i % 2) { // 금화: 테두리 + 하이라이트 한 칸
      ctx.fillStyle = '#8a5a14'; ctx.fillRect(x - u, y - u, u * 3, u * 3);
      ctx.fillStyle = '#f2c14e'; ctx.fillRect(x, y - u, u, u * 3); ctx.fillRect(x - u, y, u * 3, u);
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(x, y, u, u);
    } else { // 꽃잎 지폐: 분홍 지폐 + 가운데 흰 점
      ctx.fillStyle = '#b5476b'; ctx.fillRect(x - u * 2, y - u, u * 4, u * 2);
      ctx.fillStyle = '#f7b8c8'; ctx.fillRect(x - u * 2 + 1, y - u + 1, u * 4 - 2, u * 2 - 2);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(x - Math.floor(u / 2), y - Math.floor(u / 2), u, u);
    }
  }
  ctx.restore();
}

function drawWhole(ctx, f, P, T) {
  const cells = furnitureCells(f).map(c => [c.x, c.y]);
  const b = cellsBox(cells), p = P(b.x, b.y);
  // 바닥 점유 칸과 입면 높이를 분리한다. 발은 점유 영역 아래쪽에 고정한다.
  const def=FURNITURE[f.defId],art=def.renderSize||{},w=Math.max(b.w,art.w||0),h=Math.max(b.h,art.h||0);
  return drawObjectImage(ctx, 'objects', f.defId, p.x+(b.w-w)*T/2, p.y+(b.h-h)*T, w*T, h*T);
}

function drawDecor(ctx, defId, def, p, T) {
  if (defId === 'plant') {
    ctx.fillStyle = '#b5784f'; roundRect(ctx, p.x + T * 0.3, p.y + T * 0.55, T * 0.4, T * 0.35, 4); ctx.fill();
    ctx.fillStyle = def.color;
    for (const [dx, dy, r] of [[0.5, 0.35, 0.22], [0.32, 0.45, 0.16], [0.68, 0.45, 0.16]]) { ctx.beginPath(); ctx.arc(p.x + T * dx, p.y + T * dy, T * r, 0, Math.PI * 2); ctx.fill(); }
  } else if (defId === 'lamp') {
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(p.x + T * 0.46, p.y + T * 0.35, T * 0.08, T * 0.5);
    ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(p.x + T / 2, p.y + T * 0.32, T * 0.2, 0, Math.PI * 2); ctx.fill();
    label(ctx, '★', p.x + T / 2, p.y + T * 0.33, T * 0.24, '#fff');
  } else {
    ctx.fillStyle = def.color; roundRect(ctx, p.x + 2, p.y + T * 0.1, T - 4, T * 0.8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 3; i++) ctx.fillRect(p.x + 4, p.y + T * (0.22 + i * 0.22), T - 8, T * 0.05);
  }
}

function drawStations(ctx, state, v) {
  const T = v.tile;
  const fixtures = Object.fromEntries(FIXTURES.map(f => [f.id, f]));
  for (const sid of ['drink', 'oven']) {
    const st = state.stations[sid];
    const b = cellsBox(fixtures[sid].cells), p = cellToPx(v, b.x, b.y);
    const w = b.w * T;
    const allSlots=activeSlotNames(st).map(k=>[k,heldKey(k)]).filter(([job,held])=>st[job]||st[held]),slots=allSlots.slice(0,2);

    slots.forEach(([slot,held],i)=>{
      const job=st[slot],item=st[held],menu=job?.menuId||item?.menuId;
      const cx=p.x+w*(slots.length===1?.5:.25+i*.5),cy=p.y+T*.22,r=T*(slots.length===1?.42:.32);
      ctx.fillStyle='#fff8eb';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=item?'#ad5265':'#58734e';ctx.lineWidth=Math.max(2,T*.07);
      ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(job?Math.min(1,job.progressMs/job.durationMs):1));ctx.stroke();
      drawFood(ctx,menu,cx,cy+T*.15,T*.48);

    });

  }
  // 서빙대 위 완성 음식(트레이 3칸)
  const pb = cellsBox(fixtures.pass.cells), pp = cellToPx(v, pb.x, pb.y);
  state.tray.slice(0,3).forEach((it, i) => {
    const cx = pp.x + T * (0.4 + i * 0.6), cy = pp.y + T * 0.72;
    ctx.fillStyle = it ? '#fffaf2' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, T * 0.18, 0, Math.PI * 2); ctx.fill();
    if (it) drawFood(ctx, it.menuId, cx, cy + T * 0.08, T * 0.5);
  });
}

function drawChair(ctx,p,T,rot,lux){
 const direction=['up','right','down','left'][rot&3],key='chair_'+direction;
 if(drawObjectImage(ctx,'objects',key,p.x-T*.18,p.y-T*.3,T*1.36,T*1.36))return;
 if(direction==='down'&&drawObjectImage(ctx,'objects',lux?'chair':'basic_chair',p.x-T*.18,p.y-T*.3,T*1.36,T*1.36))return;
 // 방향별 원본이 없는 동안 논리 방향을 보여 주는 임시 의자. 정면 그림을 돌리지 않는다.
 ctx.save();ctx.fillStyle='#c49b73';ctx.strokeStyle='#77543c';ctx.lineWidth=Math.max(1,T*.05);ctx.fillRect(p.x+T*.23,p.y+T*.3,T*.54,T*.48);ctx.strokeRect(p.x+T*.23,p.y+T*.3,T*.54,T*.48);
 const back=[[.18,.72,.64,.16],[.12,.22,.16,.66],[.18,.12,.64,.16],[.72,.22,.16,.66]][rot&3];ctx.fillStyle='#956c48';ctx.fillRect(p.x+T*back[0],p.y+T*back[1],T*back[2],T*back[3]);ctx.restore();
}

// 등받이 앞부분만 마지막에 겹친다. 의자 전체로 손님을 가리지 않는다.
function drawChairBack(ctx,p,T,rot){
 const direction=['up','right','down','left'][rot&3],img=imageFor('objects/chair_'+direction);if(!img||direction==='down')return;
 const box=direction==='up'?[.18,.35,.64,.20]:direction==='left'?[.60,.13,.27,.43]:[.13,.13,.27,.43];
 const [x,y,w,h]=box;ctx.drawImage(img,x*img.width,y*img.height,w*img.width,h*img.height,p.x-T*.18+x*T*1.36,p.y-T*.3+y*T*1.36,w*T*1.36,h*T*1.36);
}
