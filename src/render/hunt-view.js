// 영냥이 월정석 사냥 화면(뱀서식). 플레이어를 따라가는 카메라, 필드, 적, 무기 효과, 드롭, 피해 숫자, 사건 알림, 조이스틱.
// 상태는 읽기만 한다. 화면 흔들림 같은 연출에만 Math.random 을 쓴다.

import {fieldTheme} from '../game/hunt-field.js';
import { TEMP } from '../config/balance.temp.js';
import { ENEMIES } from '../data/hunt-kit.js';
import { gemTier, mods, weaponStats, findBoss } from '../game/hunt.js';
import { drawActor, drawIcon } from './sprite-renderer.js';
import { imageFor } from './assets.js';

const H = TEMP.HUNT;
const GEM_KEYS = ['gem_s', 'gem_m', 'gem_l'];
const fieldPatterns = new WeakMap();

export function drawHunt(ctx, state, world, w, h, opts = {}) {
  const t = opts.t || 0;
  const fx=(key,x,y,size)=>{const img=imageFor(`effects/${key}`);if(!img)return false;const frame=Math.floor((opts.reducedMotion?0:t)/100)%4;ctx.drawImage(img,frame*128,0,128,128,x-size/2,y-size/2,size,size);return true;};
  const hs = state.hunt;
  const scale = Math.min(w / 420, h / 600);
  const vw = w / scale, vh = h / scale;
  const p = world.player;
  const now = hs.elapsedMs;
  let camX = p.x-vw/2;
  let camY = p.y-vh/2;
  if (now < world.shakeUntil && !state.paused && !opts.reducedMotion) { camX += (Math.random() - 0.5) * 8; camY += (Math.random() - 0.5) * 8; }

  ctx.fillStyle = '#141a2b'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-Math.round(camX), -Math.round(camY));

  const theme=fieldTheme(hs.depth),field=imageFor('tiles/'+theme)||imageFor('tiles/river_field');
  ctx.fillStyle=hs.depth>=85?'#231a30':'#263a3b';ctx.fillRect(camX-2,camY-2,vw+4,vh+4);
  if(field){const tile=512;for(let y=Math.floor(camY/tile)*tile;y<camY+vh;y+=tile)for(let x=Math.floor(camX/tile)*tile;x<camX+vw;x+=tile)ctx.drawImage(field,x,y,tile,tile);}
  for(const o of world.props||[]){if(hs.brokenProps?.[o.id]||o.x<camX-64||o.x>camX+vw+64||o.y<camY-80||o.y>camY+vh+80)continue;const img=imageFor('objects/hunt_'+o.kind);if(img)ctx.drawImage(img,o.x-32,o.y-48,64,64);if(o.hp<o.maxHp){ctx.fillStyle='#e7c275';ctx.fillRect(o.x-20,o.y-52,40*o.hp/o.maxHp,3);}}
  const m = mods(hs);
  // 달빛 수호부(바닥 원): 안에 있는 동안 방어가 오르고 조금씩 회복한다. 무적·탄 제거는 없다
  for (const wp of hs.weapons) {
    if (wp.id !== 'aura') continue;
    const s = weaponStats(wp, m);
    ctx.save(); ctx.globalAlpha = 0.35; fx('aura',p.x,p.y,s.radius*2); ctx.restore();
    ctx.fillStyle = wp.evo ? 'rgba(200,190,255,0.12)' : 'rgba(232,213,163,0.08)';
    ctx.strokeStyle = wp.evo ? 'rgba(200,190,255,0.55)' : 'rgba(232,213,163,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, s.radius + (opts.reducedMotion ? 0 : Math.sin(t / 300) * 2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // 보스 예고·피해 구역: 예고 중(at 전)에는 점선 테두리와 차오르는 면, 피해 중에는 진한 면
  for (const z of world.zones || []) {
    const warn = now < z.at, k = warn ? Math.max(0.15, Math.min(1, 1 - (z.at - now) / 1400)) : 1;
    ctx.save();
    ctx.fillStyle = warn ? 'rgba(230,70,90,0.28)' : z.puddle ? 'rgba(120,40,150,0.45)' : 'rgba(255,90,80,0.55)';
    ctx.strokeStyle = warn ? 'rgba(255,170,170,0.95)' : 'rgba(255,225,205,0.95)'; ctx.lineWidth = 2;
    if (warn) ctx.setLineDash([8, 6]);
    if (z.kind === 'circle') {
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2); ctx.fill();
    } else {
      const len = Math.hypot(z.x2 - z.x, z.y2 - z.y);
      ctx.translate(z.x, z.y); ctx.rotate(Math.atan2(z.y2 - z.y, z.x2 - z.x));
      ctx.strokeRect(0, -z.w / 2, len, z.w); ctx.fillRect(0, -z.w * k / 2, len, z.w * k);
    }
    ctx.restore();
  }

  // 타로 낙하: 경고 원 → 터짐
  for (let i = 0; i < world.strikes.count; i++) {
    const st = world.strikes.items[i];
    if(st.boomUntil && fx('tarot',st.x,st.y,st.r*2.2))continue;
    if (st.boomUntil) {
      const k = 1 - (st.boomUntil - now) / 260;
      ctx.strokeStyle = `rgba(255,214,120,${1 - k})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r * (0.6 + k * 0.5), 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,120,150,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const k = Math.max(0, Math.min(1, 1 - (st.at - now) / 450));
      ctx.fillStyle = '#f7f0ff'; ctx.strokeStyle = '#3b2a55'; ctx.lineWidth = 2;
      ctx.fillRect(st.x - 9, st.y - 80 * (1 - k) - 13, 18, 26); ctx.strokeRect(st.x - 9, st.y - 80 * (1 - k) - 13, 18, 26);
    }
  }

  // 드롭
  for (let i = 0; i < world.drops.count; i++) {
    const d = world.drops.items[i];
    const bob = Math.sin(t / 250 + i) * 1.5;
    if (d.kind === 'gem') drawIcon(ctx, GEM_KEYS[gemTier(d.v)], d.x, d.y + bob, [12, 16, 22][gemTier(d.v)]);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.arc(d.x, d.y, 13, 0, Math.PI * 2); ctx.fill();
      drawIcon(ctx, d.kind === 'ing' || d.kind === 'moon' ? d.id : d.kind, d.x, d.y + bob, d.kind === 'chest' ? 24 : 18);
    }
  }

  // 적
  for (let i = 0; i < world.enemies.count; i++) {
    const e = world.enemies.items[i];
    const def = ENEMIES[e.type];
    if(e.x<camX-120||e.x>camX+vw+120||e.y<camY-120||e.y>camY+vh+120)continue;
    drawEnemyWarning(ctx,e,def,now);
    const hit = e.hitAt > 0 && now - e.hitAt < 90;
    drawActor(ctx, def.art || e.type, { x: e.x, y: e.y + def.size * 0.3, size: def.size, state:e.rolePhase==='warning'||e.rolePhase==='fuse'?'attack':hit?'hurt':'walk', facing:e.facing||'down', t:now+e.uid*73, seed:e.uid, flash:hit, flipX:e.facing==='left' });
    if (def.elite && !def.boss) {
      const bw = def.size * 0.8, k = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - bw / 2, e.y - def.size * 0.62, bw, 5);
      ctx.fillStyle = '#ffd38a'; ctx.fillRect(e.x - bw / 2, e.y - def.size * 0.62, bw * k, 5);
    }
  }

  // 검은 그림자(이름·모습을 감춘 검은 호랑이): 잠깐 나타났다 사라진다
  if (world.cameo) {
    const c = world.cameo, a = Math.max(0, Math.min(1, (now - (c.until - 4000)) / 600, (c.until - now) / 600));
    ctx.save(); ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = 'rgba(150,44,64,0.35)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 34, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.filter = 'brightness(0)';
    drawActor(ctx, 'seohanbi_tiger', { x: c.x, y: c.y + 34, size: 116, state: 'idle', facing: 'down', t: now });
    ctx.restore();
  }

  // 탄: 사주성광(별빛), 초승달 부메랑
  for (let i = 0; i < world.shots.count; i++) {
    const s = world.shots.items[i];
    if(fx(s.kind==='crescent'?'crescent':'bolt',s.x,s.y,s.kind==='crescent'?44:30))continue;
    if (s.kind === 'crescent') {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(t / 60);
      ctx.fillStyle = '#ffe6a8'; ctx.beginPath(); ctx.arc(0, 0, 13, 0.3, Math.PI * 2 - 0.3); ctx.arc(5, 0, 10, Math.PI * 2 - 0.5, 0.5, true); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,229,138,0.35)'; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3b8'; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  for(const shot of world.hostile){ctx.strokeStyle='#c69bdb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(shot.x-shot.vx*.045,shot.y-shot.vy*.045);ctx.lineTo(shot.x,shot.y);ctx.stroke();ctx.fillStyle='#ffdda9';ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r,0,Math.PI*2);ctx.fill();}
  const swing=p.swing;
  if(swing&&now>=swing.hitAt&&now<swing.until){const q=(now-swing.hitAt)/(swing.until-swing.hitAt);ctx.save();ctx.translate(swing.x,swing.y);ctx.rotate(swing.angle);ctx.globalAlpha=1-q;const grad=ctx.createRadialGradient(0,0,swing.radius*.25,0,0,swing.radius);grad.addColorStop(0,'#fff0c000');grad.addColorStop(.76,swing.evo?'#d9b7f6aa':'#ffd58a88');grad.addColorStop(1,'#fff8e8ee');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,swing.radius,-swing.halfArc,swing.halfArc);ctx.closePath();ctx.fill();ctx.strokeStyle='#fffbea';ctx.lineWidth=opts.reducedMotion?2:5*(1-q)+1;ctx.beginPath();ctx.arc(0,0,swing.radius,-swing.halfArc+swing.halfArc*2*q,swing.halfArc);ctx.stroke();ctx.restore();}
  for(const burst of world.fx){const q=(now-burst.at)/(burst.until-burst.at);ctx.save();ctx.globalAlpha=1-q;ctx.strokeStyle=burst.kind==='burst'?'#ffb37d':'#fff4b8';ctx.lineWidth=burst.kind==='burst'?3:2;ctx.beginPath();ctx.arc(burst.x,burst.y,burst.r*(.35+.65*q),0,Math.PI*2);ctx.stroke();if(!opts.reducedMotion)for(let k=0;k<6;k++){const a=k*Math.PI/3;ctx.beginPath();ctx.moveTo(burst.x+Math.cos(a)*burst.r*q*.6,burst.y+Math.sin(a)*burst.r*q*.6);ctx.lineTo(burst.x+Math.cos(a)*burst.r*q,burst.y+Math.sin(a)*burst.r*q);ctx.stroke();}ctx.restore();}
  // 영냥이
  const hurt = now < p.hurtUntil;
  const st = p.action !== 'idle' ? p.action : p.moving ? 'walk' : 'idle';
  if (hurt && Math.floor(t / 80) % 2) ctx.globalAlpha = 0.5;
  const attacking=swing&&now<swing.until;
  drawActor(ctx, hs.hunterId==='seohanbi'?'seohanbi_tiger':attacking?'neo_cat_attack':'neo_cat', {x:p.x,y:p.y+20,size:hs.hunterId==='seohanbi'?76:68,state:attacking?'walk':st,facing:attacking?p.attackFacing:p.facing,t:now,animationFrame:attacking?Math.min(3,Math.floor((now-swing.at)/90)):undefined});
  ctx.globalAlpha = 1;

  // 별자리 궤도(플레이어 위에 그림)
  for (const wp of hs.weapons) {
    if (wp.id !== 'orbit') continue;
    const s = weaponStats(wp, m);
    for (let k = 0; k < s.count; k++) {
      const a = world.orbitAngle + (k / s.count) * Math.PI * 2;
      if(fx('orbit',p.x+Math.cos(a)*s.radius,p.y+Math.sin(a)*s.radius,36))continue;
      star(ctx, p.x + Math.cos(a) * s.radius, p.y + Math.sin(a) * s.radius, wp.evo ? 10 : 8, wp.evo ? '#cfc4ff' : '#ffe58a');
    }
  }

  // 피해 숫자
  ctx.textAlign = 'center';
  for (let i = 0; i < world.texts.count; i++) {
    const tx = world.texts.items[i];
    ctx.globalAlpha = Math.min(1, tx.life / 250);
    ctx.font = `800 ${tx.crit ? 17 : 12}px system-ui, sans-serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,16,40,0.9)'; ctx.strokeText(String(tx.v), tx.x, tx.y);
    ctx.fillStyle = tx.crit ? '#ffd23f' : '#fff'; ctx.fillText(String(tx.v), tx.x, tx.y);
  }
  ctx.globalAlpha = 1;
  // 흡수 반경(옅게)
  ctx.strokeStyle = 'rgba(160,180,255,0.12)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, H.MAGNET_RADIUS * m.magnet, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 보스 체력(화면 아래쪽, 위쪽 알림·대사와 겹치지 않게): 이름·남은 체력·페이즈 눈금. 화면 밖이면 가장자리 화살표로 방향을 알린다
  const bi = findBoss(world);
  if (bi >= 0) {
    const e = world.enemies.items[bi], def = ENEMIES[e.type];
    const bw = Math.min(w - 32, 380), bx = (w - bw) / 2, by = h - 46;
    ctx.fillStyle = 'rgba(20,16,40,0.86)'; ctx.fillRect(bx - 6, by, bw + 12, 34);
    ctx.font = '800 13px system-ui, sans-serif'; ctx.fillStyle = '#ffe0e6';
    ctx.textAlign = 'left'; ctx.fillText(def.name, bx, by + 14);
    ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, Math.ceil(e.hp)).toLocaleString('ko-KR')} / ${e.maxHp.toLocaleString('ko-KR')}`, bx + bw, by + 14);
    ctx.fillStyle = '#3a2030'; ctx.fillRect(bx, by + 20, bw, 9);
    ctx.fillStyle = '#ff5f7e'; ctx.fillRect(bx, by + 20, bw * Math.max(0, e.hp / e.maxHp), 9);
    ctx.fillStyle = '#fff4e8';
    for (const ph of (def.phases || []).slice(1)) ctx.fillRect(bx + bw * ph.below - 1, by + 18, 2, 13);
    const sx = (e.x - camX) * scale, sy = (e.y - camY) * scale;
    if (sx < 0 || sx > w || sy < 0 || sy > h) {
      const ax = Math.max(22, Math.min(w - 22, sx)), ay = Math.max(22, Math.min(by - 22, sy)), ang = Math.atan2(sy - h / 2, sx - w / 2);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = '#ff5f7e'; ctx.strokeStyle = '#2a1424'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }

  // 사건 알림(화면 좌표)
  if (world.banner) {
    const b = world.banner;
    const blink = b.warn && Math.floor(t / 250) % 2;
    ctx.font = '800 15px system-ui, sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(b.label).width + 28;
    ctx.fillStyle = b.warn ? (blink ? 'rgba(160,30,60,0.85)' : 'rgba(110,20,45,0.85)') : 'rgba(20,16,40,0.8)';
    ctx.fillRect(w / 2 - tw / 2, 14, tw, 30);
    ctx.fillStyle = b.warn ? '#ffe0e6' : '#ffe6a8'; ctx.fillText(b.label, w / 2, 34);
  }

  // 조이스틱(화면 좌표)
  const joy = opts.joy;
  if (joy?.active && opts.rect) {
    const ox = joy.ox - opts.rect.left, oy = joy.oy - opts.rect.top;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ox, oy, joy.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const kx = joy.x - opts.rect.left, ky = joy.y - opts.rect.top;
    const dx = kx - ox, dy = ky - oy, d = Math.hypot(dx, dy), k = d > joy.radius ? joy.radius / d : 1;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(ox + dx * k, oy + dy * k, 22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = 'start';
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.strokeStyle = 'rgba(20,16,40,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawEnemyWarning(ctx,e,def,now){if(!['warning','fuse'].includes(e.rolePhase))return;ctx.save();ctx.strokeStyle='#ffc995';ctx.fillStyle='#e66b452b';ctx.lineWidth=2;if(e.warningR){ctx.beginPath();ctx.arc(e.x,e.y,e.warningR,0,Math.PI*2);ctx.fill();ctx.stroke();const q=Math.max(0,Math.min(1,1-(e.roleUntil-now)/1100));ctx.strokeStyle='#ffe8be';ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.warningR,-Math.PI/2,-Math.PI/2+q*Math.PI*2);ctx.stroke();}else{ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.aimX*(def.role==='dash'?110:230),e.y+e.aimY*(def.role==='dash'?110:230));ctx.stroke();ctx.setLineDash([]);}ctx.restore();}
