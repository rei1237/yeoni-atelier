// 캐릭터 그리기: 스프라이트 시트가 있으면 프레임을, 없으면 도형 대체를 그린다.
// 같은 입력(상태·방향·시간)을 받으므로 시트를 넣어도 호출하는 쪽은 바뀌지 않는다.

import { ASSETS, SPRITE_STATES, imageFor, resolveState, actorDef } from './assets.js';

export function drawActor(ctx, key, o) {
  const def = actorDef(key) || ASSETS.actors.customer;
  const st = resolveState(def, o.state || 'idle');
  const img = imageFor(key);
  if (img) return drawFromSheet(ctx, def, img, st, o);
  drawFallback(ctx, def, st, o);
}

function drawFromSheet(ctx, def, img, st, o) {
  const s = def.states[st];
  const row = SPRITE_STATES.indexOf(st) + Math.max(0, def.directions.indexOf(o.facing || 'down')) * SPRITE_STATES.length;
  const frame = Math.floor((o.t / 1000) * s.fps) % s.frames;
  // 도트 그림은 정수 배율로만 키워야 픽셀이 고르게 보인다(32px 프레임 → 32·64·96…)
  const scale = Math.max(1, Math.round(o.size / def.frame.h));
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  if (o.flash) ctx.filter = 'brightness(3)';
  ctx.drawImage(img, frame * def.frame.w, row * def.frame.h, def.frame.w, def.frame.h,
    Math.round(o.x - def.anchor.x * scale), Math.round(o.y - def.anchor.y * scale), def.frame.w * scale, def.frame.h * scale);
  ctx.filter = 'none';
  ctx.imageSmoothingEnabled = prev;
  if (o.name) nameTag(ctx, o.name, o.x, o.y + 4, o.size, o.tagColor);
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
  const fs = Math.max(10, Math.round(size * 0.26));
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
  else drawPerson(ctx, x, y, s, fb, o, t, st);

  if (st === 'hurt') {
    ctx.fillStyle = 'rgba(230,60,60,0.35)';
    ctx.beginPath(); ctx.arc(x, y - s * 0.45, s * 0.38, 0, Math.PI * 2); ctx.fill();
  }
  if (st === 'cook') steam(ctx, x + s * 0.2, y - s * 0.95, s, t);
  if (st === 'host') hostMark(ctx, x + s * 0.32, y - s * 1.0, s, t);
  if (st === 'react') { ctx.fillStyle = '#e8574a'; ctx.font = `800 ${Math.round(s * 0.34)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('!', x + s * 0.3, y - s * 0.95); }
  if (st === 'attack') { ctx.strokeStyle = 'rgba(255,240,150,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.5, -0.6, 0.6); ctx.stroke(); }
  if (o.name) nameTag(ctx, o.name, o.x, o.y + 3, s, o.tagColor);
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

// 16×16 아이콘: 이미지가 있으면 정수 배율, 없으면 색 마름모
export function drawIcon(ctx, key, x, y, px) {
  const img = imageFor(`icons/${key}`);
  if (img) {
    const k = Math.max(1, Math.round(px / 16));
    const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - 8 * k), Math.round(y - 8 * k), 16 * k, 16 * k);
    ctx.imageSmoothingEnabled = prev;
    return;
  }
  const c = ASSETS.icons[key]?.fallback.color || '#fff';
  const r = px / 2;
  ctx.fillStyle = c; ctx.strokeStyle = 'rgba(20,16,40,0.85)'; ctx.lineWidth = Math.max(1.5, px / 10);
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.78, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.78, y); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// 대화 초상화(소설 화면): 초상화 시트가 있으면 표정 칸을, 없으면 캐릭터 도형을 크게 그린다
export function drawPortrait(ctx, key, expr, w, h) {
  ctx.clearRect(0, 0, w, h);
  const def = ASSETS.portraits[key];
  const img = imageFor(`portraits/${key}`);
  if (def && img) {
    const i = Math.max(0, def.expressions.indexOf(expr));
    const k = Math.max(1, Math.floor(Math.min(w, h) / def.px));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, i * def.px, 0, def.px, def.px, Math.round((w - def.px * k) / 2), h - def.px * k, def.px * k, def.px * k);
    return;
  }
  const state = expr === 'surprised' || expr === 'flustered' ? 'react' : 'idle';
  drawActor(ctx, key, { x: w / 2, y: h * 0.98, size: h * 0.92, state, facing: 'down', t: 0 });
}

export { roundRect };

// 오브젝트·타일 이미지(32px = 타일 1칸). 그림이 있고 가로세로 비율이 칸 상자와 맞을 때만 그리고 true 를 돌려준다.
// 회전으로 비율이 바뀌었거나 그림이 없으면 false → 호출한 쪽이 도형으로 그린다.
export function drawObjectImage(ctx, group, key, x, y, w, h) {
  const img = imageFor(`${group}/${key}`);
  if (!img || Math.abs(img.width / img.height - w / h) > 0.01) return false;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.imageSmoothingEnabled = prev;
  return true;
}
