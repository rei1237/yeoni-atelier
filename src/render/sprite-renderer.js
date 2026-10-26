// 캐릭터 그리기: 스프라이트 시트가 있으면 프레임을, 없으면 도형 대체를 그린다.
// 같은 입력(상태·방향·시간)을 받으므로 시트를 넣어도 호출하는 쪽은 바뀌지 않는다.

import { ASSETS, imageFor, resolveState, actorDef } from './assets.js';
import { actorSocket } from '../data/actor-sockets.js';

// 카페의 대기 동작. 발 기준점은 이동하지 않고 호흡·작은 몸 기울임만 표현한다.
export function cafeIdlePose(key, o) {
  if (!o.idleMotion || o.reducedMotion || !['idle','host','cook','serve'].includes(o.state || 'idle')) return null;
  const seed=Array.from(key).reduce((n,c)=>n+c.charCodeAt(0),0)+(o.x||0)*.37+(o.y||0)*.19;
  const phase=(o.t||0)/1000, breath=Math.sin(phase*(1.65+(seed%7)*.06)+seed);
  return {scaleX:1-breath*.006,scaleY:1+breath*.022,angle:Math.sin(phase*.85+seed*.7)*.014};
}

export function drawActor(ctx, key, o) {
  const gesture=key==='yeoni'&&o.gesture;
  if(gesture && imageFor('yeoni_idle')){key='yeoni_idle';o={...o,state:gesture.kind,facing:'down',animationFrame:Math.min(3,Math.floor(gesture.age/260)),idleMotion:false,outfitId:null};}
  // 쟁반·천을 든 동안에는 손 위치가 정해진 기본 시트를 쓴다(대기 전용 시트는 손에 다른 물건이 있다).
  else if((o.state||'idle')==='idle'&&!o.outfitId&&!o.carry&&!o.cleaning&&imageFor(key+'_idle')){key=key+'_idle';o={...o,idleMotion:false};}
  const dressed = o.outfitId ? `${key}@${o.outfitId}` : key;
  key = imageFor(dressed) ? dressed : key.split('@')[0];
  const def = actorDef(key) || ASSETS.actors.customer;
  const st = resolveState(def, o.state || 'idle');
  const img = imageFor(key);
  o={...o,actorKey:key};
  const pose=cafeIdlePose(key,o);
  if (pose) {
    ctx.save();ctx.translate(o.x,o.y);ctx.rotate(pose.angle);ctx.scale(pose.scaleX,pose.scaleY);
    const body={...o,x:0,y:0,name:null};
    if(img)drawFromSheet(ctx,def,img,st,body);else drawFallback(ctx,def,st,body);
    ctx.restore();
    if(o.name)nameTag(ctx,o.name,o.x,o.y+4+(o.nameOffsetY||0),o.size,o.tagColor);
    return;
  }
  if (img) return drawFromSheet(ctx, def, img, st, o);
  drawFallback(ctx, def, st, o);
}

function drawFromSheet(ctx, def, img, st, o) {
  const s = def.states[st];
  const row = def.stateRows[st] + Math.max(0, def.directions.indexOf(o.facing || 'down')) * def.directionRows;
  const frame = (s.frameOffset || 0) + (o.animationFrame==null?Math.floor((o.t / 1000) * s.fps) % s.frames:Math.max(0,Math.min(s.frames-1,o.animationFrame)));
  // 고해상도 원본을 실제 화면 크기에 맞춰 축소한다.
  const scale = o.size / def.frame.h;
  const sock = o.carry || o.cleaning ? actorSocket(o.actorKey || '', o.facing || 'down') : null;
  if (sock?.layer === 'back') drawWorkProps(ctx, o, sock, scale, frame);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if(o.flipX){ctx.save();ctx.translate(o.x,0);ctx.scale(-1,1);ctx.translate(-o.x,0);}
  if (o.flash) ctx.filter = 'brightness(3)';
  ctx.drawImage(img, frame * def.frame.w, row * def.frame.h, def.frame.w, def.frame.h,
    Math.round(o.x - def.anchor.x * scale), Math.round(o.y - def.anchor.y * scale), def.frame.w * scale, def.frame.h * scale);
  ctx.filter = 'none';
  if(o.flipX)ctx.restore();
  ctx.imageSmoothingEnabled = prev;
  if (sock && sock.layer !== 'back') drawWorkProps(ctx, o, sock, scale, frame);
  if (o.name) nameTag(ctx, o.name, o.x, o.y + 4 + (o.nameOffsetY || 0), o.size, o.tagColor);
}

// 손이 없는 서빙 소품을 배우별 손 위치(actor-sockets.js)에 맞춰 붙인다. 위를 보면 몸 뒤, 그 외에는 몸 앞에 그린다.
// 쟁반과 음식은 한 번의 이동으로 함께 움직이고, 음식은 주문 ID가 가리키는 실제 메뉴 그림을 쟁반 면에 세운다.
function drawWorkProps(ctx, o, sock, scale, frame) {
  const id = `${o.cleaning ? 'cloth' : 'tray'}-${o.facing || 'down'}`, def = ASSETS.service?.[id], prop = def && imageFor(`service/${id}`);
  if (!prop) return;
  // 천은 한 손으로 쥐어 손잡이 기준점이 없다. 그때는 쟁반 손잡이 간격(172)으로 크기를 맞춘다.
  const hs = def.handSockets || [], [ax, ay] = def.anchor, span = hs.length > 1 ? hs[1][0] - hs[0][0] : 172;
  const k = sock.w * scale / span * (o.cleaning ? .8 : 1);
  const sx = o.flipX ? 128 - sock.x : sock.x;
  const bob = o.state === 'walk' && !o.reducedMotion ? -(frame % 2) * scale : 0;
  const wipe = o.cleaning && !o.reducedMotion ? Math.sin(o.t / 140) * sock.w * .22 * scale : 0;
  ctx.save();
  ctx.translate(o.x + (sx - 64) * scale + wipe, o.y + (sock.y - 122) * scale + bob);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(prop, -ax * k, -ay * k, def.dimensions[0] * k, def.dimensions[1] * k);
  if (o.carry?.menuId && !o.cleaning) drawFood(ctx, o.carry.menuId, (def.itemSocket[0] - ax) * k, (def.itemSocket[1] - ay) * k, 104 * k);
  ctx.restore();
}

// 메뉴 그림의 바닥(투명 여백 제외)을 주어진 점에 맞춘다. 그림이 없으면 아이콘 대체.
export function drawFood(ctx, menuId, x, bottom, px) {
  const img = imageFor(`icons/${menuId}`);
  if (!img) return drawIcon(ctx, menuId, x, bottom - px / 2, px);
  ctx.drawImage(img, x - px / 2, bottom - px * .88, px, px);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function nameTag(ctx, text, x, y, size, color = '#3b2f2f') {
  const fs = Math.max(9, Math.min(11, Math.round(size * 0.17)));
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  roundRect(ctx, x - w / 2, y, w, fs + 4, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y + 2);
}

// o: { x, y(발 위치), size(키 px), state, facing, t(ms), name, body?, accents?[], carry?{color}, hue? }
function drawFallback(ctx, def, st, o) {
  const fb = def.fallback;
  const s = o.size;
  const t = o.t / 1000;
  let dx = 0, dy = 0;
  if (st === 'walk') dy = -Math.abs(Math.sin(t * 10)) * s * 0.06;
  if (st === 'idle') dy = Math.sin(t * 2) * s * 0.012;
  if (st === 'react') dy = -Math.abs(Math.sin(t * 9)) * s * 0.16;
  if (st === 'hurt') dx = Math.sin(t * 60) * s * 0.05;
  if (st === 'attack') { const f = { left: -1, right: 1 }[o.facing] || 0; dx = f * s * 0.08; }
  const x = o.x + dx, y = o.y + dy;

  // 그림자
  ctx.fillStyle = 'rgba(60,40,30,0.18)';
  ctx.beginPath(); ctx.ellipse(o.x, o.y, s * 0.26, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();

  if (fb.shape === 'cat') drawCat(ctx, x, y, s, fb, o, t, st);
  else if (fb.shape === 'pig') drawPig(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'blob') drawBlob(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'hand') drawHand(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'bat') drawBat(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'wisp') drawWisp(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'rabbit') drawRabbit(ctx, x, y, s, fb, o, t);
  else if (fb.shape === 'otter') drawOtter(ctx, x, y, s, fb, o, t);
  else drawPerson(ctx, x, y, s, fb, o, t, st);

  if (st === 'hurt') {
    ctx.fillStyle = 'rgba(230,60,60,0.35)';
    ctx.beginPath(); ctx.arc(x, y - s * 0.45, s * 0.38, 0, Math.PI * 2); ctx.fill();
  }
  if (st === 'cook') steam(ctx, x + s * 0.2, y - s * 0.95, s, t);
  if (st === 'host') hostMark(ctx, x + s * 0.32, y - s * 1.0, s, t);
  if (st === 'react') { ctx.fillStyle = '#e8574a'; ctx.font = `800 ${Math.round(s * 0.34)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('!', x + s * 0.3, y - s * 0.95); }
  if (st === 'attack') { ctx.strokeStyle = 'rgba(255,240,150,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.5, -0.6, 0.6); ctx.stroke(); }
  if (o.name) nameTag(ctx, o.name, o.x, o.y + 3 + (o.nameOffsetY || 0), s, o.tagColor);
}

function drawPerson(ctx, x, y, s, fb, o, t, st) {
  const body = o.body || fb.body || `hsl(${o.hue ?? 30} 55% 62%)`;
  const legPhase = st === 'walk' ? Math.sin(t * 10) * s * 0.05 : 0;
  ctx.strokeStyle = '#5a4636'; ctx.lineWidth = Math.max(2, s * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.22); ctx.lineTo(x - s * 0.08 + legPhase, y - s * 0.02);
  ctx.moveTo(x + s * 0.08, y - s * 0.22); ctx.lineTo(x + s * 0.08 - legPhase, y - s * 0.02); ctx.stroke();
  ctx.fillStyle = body;
  roundRect(ctx, x - s * 0.2, y - s * 0.58, s * 0.4, s * 0.4, s * 0.12); ctx.fill();
  // 액세서리(색 점) — 능력치와 무관한 외형 표시
  (o.accents || []).forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - s * 0.1 + i * s * 0.2, y - s * 0.46, s * 0.05, 0, Math.PI * 2); ctx.fill(); });
  // 머리
  ctx.fillStyle = fb.skin; ctx.beginPath(); ctx.arc(x, y - s * 0.74, s * 0.19, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fb.hair;
  ctx.beginPath();
  if (o.facing === 'up') ctx.arc(x, y - s * 0.75, s * 0.2, 0, Math.PI * 2);
  else ctx.arc(x, y - s * 0.8, s * 0.2, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (fb.accent && o.facing !== 'up') { ctx.fillStyle = fb.accent; ctx.beginPath(); ctx.arc(x - s * 0.16, y - s * 0.86, s * 0.045, 0, Math.PI * 2); ctx.fill(); }
  if (o.facing !== 'up') {
    const ex = o.facing === 'left' ? -s * 0.06 : o.facing === 'right' ? s * 0.06 : 0;
    ctx.fillStyle = '#2d2420';
    ctx.beginPath(); ctx.arc(x + ex - s * 0.065, y - s * 0.73, s * 0.022, 0, Math.PI * 2); ctx.arc(x + ex + s * 0.065, y - s * 0.73, s * 0.022, 0, Math.PI * 2); ctx.fill();
  }
  if (o.carry) {
    ctx.fillStyle = '#f7f3ea'; roundRect(ctx, x - s * 0.26, y - s * 0.5, s * 0.52, s * 0.08, 3); ctx.fill();
    ctx.fillStyle = o.carry.color; ctx.beginPath(); ctx.arc(x, y - s * 0.56, s * 0.08, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCat(ctx, x, y, s, fb, o, t, st) {
  const sx = o.facing === 'left' ? -1 : 1;
  ctx.fillStyle = fb.body;
  // 꼬리
  ctx.strokeStyle = fb.body; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - sx * s * 0.2, y - s * 0.2);
  ctx.quadraticCurveTo(x - sx * s * 0.42, y - s * 0.3, x - sx * s * 0.34, y - s * 0.55 + Math.sin(t * 4) * s * 0.05); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.22, s * 0.26, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  const hx = x + sx * s * 0.14, hy = y - s * 0.5;
  ctx.beginPath(); ctx.arc(hx, hy, s * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx - s * 0.16, hy - s * 0.06); ctx.lineTo(hx - s * 0.12, hy - s * 0.28); ctx.lineTo(hx - s * 0.02, hy - s * 0.14);
  ctx.moveTo(hx + s * 0.16, hy - s * 0.06); ctx.lineTo(hx + s * 0.12, hy - s * 0.28); ctx.lineTo(hx + s * 0.02, hy - s * 0.14); ctx.fill();
  if (o.facing !== 'up') {
    ctx.fillStyle = fb.eye || fb.accent;
    ctx.beginPath(); ctx.arc(hx - s * 0.06, hy - s * 0.01, s * 0.03, 0, Math.PI * 2); ctx.arc(hx + s * 0.06, hy - s * 0.01, s * 0.03, 0, Math.PI * 2); ctx.fill();
  }
  if (fb.hat) {
    // 남색 마법모자 + 금빛 초승달(원작 영냥이 디자인)
    ctx.fillStyle = fb.hat;
    ctx.beginPath(); ctx.ellipse(hx, hy - s * 0.15, s * 0.22, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - s * 0.13, hy - s * 0.16); ctx.lineTo(hx + sx * s * 0.08, hy - s * 0.48); ctx.lineTo(hx + s * 0.13, hy - s * 0.16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fb.accent;
    ctx.beginPath(); ctx.arc(hx, hy - s * 0.26, s * 0.045, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fb.hat;
    ctx.beginPath(); ctx.arc(hx + s * 0.02, hy - s * 0.27, s * 0.04, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPig(ctx, x, y, s, fb, o, t) {
  ctx.fillStyle = fb.body;
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.3, s * 0.3, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * 0.2, y - s * 0.48); ctx.lineTo(x - s * 0.14, y - s * 0.62); ctx.lineTo(x - s * 0.06, y - s * 0.52);
  ctx.moveTo(x + s * 0.2, y - s * 0.48); ctx.lineTo(x + s * 0.14, y - s * 0.62); ctx.lineTo(x + s * 0.06, y - s * 0.52); ctx.fill();
  ctx.fillStyle = fb.accent;
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.26, s * 0.09, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5b3a3a';
  ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.38, s * 0.03, 0, Math.PI * 2); ctx.arc(x + s * 0.1, y - s * 0.38, s * 0.03, 0, Math.PI * 2); ctx.fill();
  // 왼쪽 귀 옆 연꽃(원작 꽃돼지 디자인)
  ctx.fillStyle = '#f48fb1';
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; ctx.beginPath(); ctx.ellipse(x - s * 0.22 + Math.cos(a) * s * 0.05, y - s * 0.58 + Math.sin(a) * s * 0.05, s * 0.04, s * 0.07, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); }
}

function drawHand(ctx, x, y, s, fb, o, t) {
  const sway = Math.sin(t * 5 + (o.seed || 0)) * s * 0.04;
  ctx.fillStyle = o.flash ? '#ffffff' : fb.body;
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.24, s * 0.24, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const fx = x - s * 0.18 + i * s * 0.12;
    roundRect(ctx, fx - s * 0.045 + sway, y - s * (0.7 - Math.abs(i - 1.5) * 0.08), s * 0.09, s * 0.36, s * 0.045); ctx.fill();
  }
  ctx.fillStyle = fb.eye;
  ctx.beginPath(); ctx.arc(x - s * 0.08, y - s * 0.24, s * 0.035, 0, Math.PI * 2); ctx.arc(x + s * 0.08, y - s * 0.24, s * 0.035, 0, Math.PI * 2); ctx.fill();
}

function drawBat(ctx, x, y, s, fb, o, t) {
  const f = Math.sin(t * 18 + (o.seed || 0)) * s * 0.12;
  const cy = y - s * 0.45;
  ctx.fillStyle = o.flash ? '#ffffff' : fb.body;
  ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x - s * 0.42, cy - s * 0.1 - f); ctx.lineTo(x - s * 0.2, cy + s * 0.08); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + s * 0.42, cy - s * 0.1 - f); ctx.lineTo(x + s * 0.2, cy + s * 0.08); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(x, cy, s * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fb.eye;
  ctx.beginPath(); ctx.arc(x - s * 0.05, cy - s * 0.02, s * 0.025, 0, Math.PI * 2); ctx.arc(x + s * 0.05, cy - s * 0.02, s * 0.025, 0, Math.PI * 2); ctx.fill();
}

function drawWisp(ctx, x, y, s, fb, o, t) {
  const cy = y - s * 0.4 + Math.sin(t * 4 + (o.seed || 0)) * s * 0.06;
  const g = ctx.createRadialGradient(x, cy, 1, x, cy, s * 0.32);
  g.addColorStop(0, o.flash ? '#ffffff' : '#e9e4ff'); g.addColorStop(0.5, fb.body); g.addColorStop(1, 'rgba(93,75,209,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, s * 0.32, 0, Math.PI * 2); ctx.fill();
}

function drawBlob(ctx, x, y, s, fb, o, t) {
  const w = 1 + Math.sin(t * 6 + (o.seed || 0)) * 0.08;
  ctx.fillStyle = o.flash ? '#ffffff' : fb.body;
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.25, s * 0.3 * w, s * 0.25 / w, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fb.eye || '#f3e9ff';
  ctx.beginPath(); ctx.arc(x - s * 0.09, y - s * 0.3, s * 0.04, 0, Math.PI * 2); ctx.arc(x + s * 0.09, y - s * 0.3, s * 0.04, 0, Math.PI * 2); ctx.fill();
}

// 토끼(루나·루나 언니·청토끼): 흰 몸 + 긴 귀. vest = 청토끼 파란 조끼, apron = 앞치마(도형 대체용 임시 구분)
function drawRabbit(ctx, x, y, s, fb, o, t) {
  const k = fb.scale || 1;
  const ear = Math.sin(t * 3 + (o.seed || 0)) * 0.08;
  ctx.fillStyle = fb.body;
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.24 * k, s * 0.24 * k, s * 0.22 * k, 0, 0, Math.PI * 2); ctx.fill();
  if (fb.vest) { ctx.fillStyle = fb.vest; roundRect(ctx, x - s * 0.2 * k, y - s * 0.4 * k, s * 0.4 * k, s * 0.24 * k, s * 0.06); ctx.fill(); }
  if (fb.apron) { ctx.fillStyle = fb.apron; roundRect(ctx, x - s * 0.14 * k, y - s * 0.36 * k, s * 0.28 * k, s * 0.3 * k, s * 0.05); ctx.fill(); }
  const hy = y - s * 0.56 * k;
  ctx.fillStyle = fb.body;
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(x + sx * s * 0.08 * k, hy - s * 0.26 * k, s * 0.055 * k, s * 0.2 * k, sx * (0.15 + ear), 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = fb.accent;
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(x + sx * s * 0.08 * k, hy - s * 0.26 * k, s * 0.025 * k, s * 0.14 * k, sx * (0.15 + ear), 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = fb.body;
  ctx.beginPath(); ctx.arc(x, hy, s * 0.17 * k, 0, Math.PI * 2); ctx.fill();
  if (o.facing !== 'up') {
    ctx.fillStyle = fb.eye || '#3a2a2a';
    ctx.beginPath(); ctx.arc(x - s * 0.06 * k, hy - s * 0.01, s * 0.025 * k, 0, Math.PI * 2); ctx.arc(x + s * 0.06 * k, hy - s * 0.01, s * 0.025 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fb.accent;
    ctx.beginPath(); ctx.arc(x, hy + s * 0.05 * k, s * 0.02 * k, 0, Math.PI * 2); ctx.fill();
  }
}

// 수달(모카): 코코아색 몸·크림 주둥이·보라 베레모·목에 건 헤드폰
function drawOtter(ctx, x, y, s, fb, o, t) {
  ctx.strokeStyle = fb.body; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.16, y - s * 0.08); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.04, x - s * 0.38, y - s * 0.2 + Math.sin(t * 3) * s * 0.03); ctx.stroke();
  ctx.fillStyle = fb.body;
  roundRect(ctx, x - s * 0.19, y - s * 0.52, s * 0.38, s * 0.5, s * 0.17); ctx.fill();
  if (fb.apron) { ctx.fillStyle = fb.apron; roundRect(ctx, x - s * 0.12, y - s * 0.38, s * 0.24, s * 0.32, s * 0.05); ctx.fill(); }
  const hy = y - s * 0.66;
  ctx.fillStyle = fb.body;
  ctx.beginPath(); ctx.arc(x, hy, s * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - s * 0.14, hy - s * 0.1, s * 0.05, 0, Math.PI * 2); ctx.arc(x + s * 0.14, hy - s * 0.1, s * 0.05, 0, Math.PI * 2); ctx.fill();
  if (o.facing !== 'up') {
    ctx.fillStyle = fb.muzzle;
    ctx.beginPath(); ctx.ellipse(x, hy + s * 0.06, s * 0.1, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d2420';
    ctx.beginPath(); ctx.arc(x, hy + s * 0.03, s * 0.025, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * 0.07, hy - s * 0.03, s * 0.022, 0, Math.PI * 2); ctx.arc(x + s * 0.07, hy - s * 0.03, s * 0.022, 0, Math.PI * 2); ctx.fill();
  }
  if (fb.phones) { ctx.strokeStyle = fb.phones; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.15, 0.2, Math.PI - 0.2); ctx.stroke(); }
  if (fb.hat) {
    ctx.fillStyle = fb.hat;
    ctx.beginPath(); ctx.ellipse(x + s * 0.03, hy - s * 0.15, s * 0.18, s * 0.07, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.1, hy - s * 0.21, s * 0.025, 0, Math.PI * 2); ctx.fill();
  }
}

function steam(ctx, x, y, s, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.8 + i / 3) % 1;
    ctx.beginPath(); ctx.arc(x + Math.sin((p + i) * 6) * s * 0.05, y - p * s * 0.35, s * (0.04 + p * 0.05), 0, Math.PI * 2); ctx.fill();
  }
}

function hostMark(ctx, x, y, s, t) {
  const k = 1 + Math.sin(t * 4) * 0.1;
  ctx.fillStyle = '#e86b8a';
  ctx.font = `700 ${Math.round(s * 0.3 * k)}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('♥', x, y);
}

// 아이콘은 요청 크기로 부드럽게 축소한다. 없으면 색 마름모.
export function drawIcon(ctx, key, x, y, px) {
  const img = imageFor(`icons/${key}`);
  if (img) {
    const k = px / 16;
    const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, Math.round(x - 8 * k), Math.round(y - 8 * k), 16 * k, 16 * k);
    ctx.imageSmoothingEnabled = prev;
    return;
  }
  const c = ASSETS.icons[key]?.fallback.color || '#fff';
  const r = px / 2;
  ctx.fillStyle = c; ctx.strokeStyle = 'rgba(20,16,40,0.85)'; ctx.lineWidth = Math.max(1.5, px / 10);
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.78, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.78, y); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// 대화 시트 키: 무대 정장(검정·금색)일 때만 neo_stage, 그 밖의 의상은 각 인물의 기본 시트.
const STAGE_SUITS = new Set(['host_first', 'crescent_tailcoat']);
export function talkingKey(key) {
  const [who, outfit] = key.split(':')[0].split('@');
  return who === 'neo' && STAGE_SUITS.has(outfit) ? 'neo_stage' : who;
}

// 대화 초상화(소설 화면): 초상화 시트가 있으면 표정 칸을, 없으면 캐릭터 도형을 크게 그린다
export function drawPortrait(ctx, key, expr, w, h, { frame = 0, talkingSheet = false } = {}) {
  ctx.clearRect(0, 0, w, h);
  if(talkingSheet){
    const talkKey=talkingKey(key);
    const sheet=imageFor(`talking/${talkKey}`), d=ASSETS.talking?.[talkKey];
    if(sheet&&d){const fw=d.frame.w,fh=d.frame.h,k=Math.min(w/fw,h/fh);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(sheet,Math.max(0,Math.min(3,frame))*fw,0,fw,fh,(w-fw*k)/2,h-fh*k,fw*k,fh*k);return;}
  }
  const actualKey = imageFor(`portraits/${key}`) ? key : key.split('@')[0];
  const def = ASSETS.portraits[actualKey];
  const img = imageFor(`portraits/${actualKey}`);
  if (def?.static && img) {
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const sh = w >= h ? Math.min(img.height,img.width*1.05) : img.height;
    const scale=Math.min(w/img.width,h/sh);
    ctx.drawImage(img,0,0,img.width,sh,(w-img.width*scale)/2,h-sh*scale,img.width*scale,sh*scale);return;
  }
  if (def && img) {
    const i = Math.max(0, def.expressions.indexOf(expr));
    const k = Math.min(w, h) / def.px;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const animated = img.width === 4 * def.px && img.height === def.expressions.length * def.px;
    const sx = animated ? Math.max(0, Math.min(3, frame)) * def.px : i * def.px;
    const sy = animated ? i * def.px : 0;
    ctx.drawImage(img, sx, sy, def.px, def.px, Math.round((w - def.px * k) / 2), h - def.px * k, def.px * k, def.px * k);
    return;
  }
  const state = expr === 'surprised' || expr === 'flustered' || expr === 'cry' ? 'react' : 'idle';
  drawActor(ctx, key, { x: w / 2, y: h * 0.98, size: h * 0.92, state, facing: 'down', t: 0 });
}

export { roundRect };

// 오브젝트·타일 이미지(32px = 타일 1칸). 그림이 있고 가로세로 비율이 칸 상자와 맞을 때만 그리고 true 를 돌려준다.
// 회전으로 비율이 바뀌었거나 그림이 없으면 false → 호출한 쪽이 도형으로 그린다.
export function drawObjectImage(ctx, group, key, x, y, w, h) {
  const img = imageFor(`${group}/${key}`);
  if (!img) return false;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (group === 'tiles') ctx.drawImage(img,2,2,img.width-4,img.height-4,x,y,w+.5,h+.5);
  else {const k=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*k)/2,y+h-img.height*k,img.width*k,img.height*k);}
  ctx.imageSmoothingEnabled = prev;
  return true;
}
