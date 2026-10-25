// 영냥이 월정석 사냥 화면(뱀서식). 플레이어를 따라가는 카메라, 필드, 적, 무기 효과, 드롭, 피해 숫자, 사건 알림, 조이스틱.
// 상태는 읽기만 한다. 화면 흔들림 같은 연출에만 Math.random 을 쓴다.

import { TEMP } from '../config/balance.temp.js';
import { ENEMIES } from '../data/hunt-kit.js';
import { gemTier, mods, weaponStats } from '../game/hunt.js';
import { drawActor, drawIcon } from './sprite-renderer.js';

const H = TEMP.HUNT;
const GEM_KEYS = ['gem_s', 'gem_m', 'gem_l'];

export function drawHunt(ctx, state, world, w, h, opts = {}) {
  const t = opts.t || 0;
  const hs = state.hunt;
  const scale = Math.min(w / 420, h / 600);
  const vw = w / scale, vh = h / scale;
  const p = world.player;
  const now = hs.elapsedMs;
  let camX = Math.max(0, Math.min(H.FIELD_W - vw, p.x - vw / 2));
  let camY = Math.max(0, Math.min(H.FIELD_H - vh, p.y - vh / 2));
  if (now < world.shakeUntil && !state.paused) { camX += (Math.random() - 0.5) * 8; camY += (Math.random() - 0.5) * 8; }

  ctx.fillStyle = '#141a2b'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-Math.round(camX), -Math.round(camY));

  // 필드: 밤 강가 들판 + 점 무늬(보이는 곳만)
  ctx.fillStyle = '#243a35'; ctx.fillRect(0, 0, H.FIELD_W, H.FIELD_H);
  ctx.fillStyle = 'rgba(190,230,200,0.10)';
  const x0 = Math.floor(camX / 60) * 60, y0 = Math.floor(camY / 60) * 60;
  for (let y = y0; y < camY + vh + 60; y += 60) for (let x = x0 + ((y / 60) % 2 ? 30 : 0); x < camX + vw + 60; x += 60) { ctx.fillRect(x, y, 3, 3); }
  ctx.strokeStyle = '#6f8fb3'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, H.FIELD_W - 6, H.FIELD_H - 6);

  const m = mods(hs);
  // 달빛 장막(바닥 원)
  for (const wp of hs.weapons) {
    if (wp.id !== 'aura') continue;
    const s = weaponStats(wp, m);
    ctx.fillStyle = wp.evo ? 'rgba(200,190,255,0.20)' : 'rgba(232,213,163,0.14)';
    ctx.strokeStyle = wp.evo ? 'rgba(200,190,255,0.55)' : 'rgba(232,213,163,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, s.radius + Math.sin(t / 300) * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // 타로 낙하: 경고 원 → 터짐
  for (let i = 0; i < world.strikes.count; i++) {
    const st = world.strikes.items[i];
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
    const hit = e.hitAt > 0 && now - e.hitAt < 90;
    drawActor(ctx, e.type, { x: e.x, y: e.y + def.size * 0.3, size: def.size, state: hit ? 'hurt' : 'walk', facing: 'down', t, seed: e.uid, flash: hit });
    if (def.elite) {
      const bw = def.size * 0.8, k = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - bw / 2, e.y - def.size * 0.62, bw, 5);
      ctx.fillStyle = def.boss ? '#ff6b81' : '#ffd38a'; ctx.fillRect(e.x - bw / 2, e.y - def.size * 0.62, bw * k, 5);
    }
  }

  // 탄: 사주성광(별빛), 초승달 부메랑
  for (let i = 0; i < world.shots.count; i++) {
    const s = world.shots.items[i];
    if (s.kind === 'crescent') {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(t / 60);
      ctx.fillStyle = '#ffe6a8'; ctx.beginPath(); ctx.arc(0, 0, 13, 0.3, Math.PI * 2 - 0.3); ctx.arc(5, 0, 10, Math.PI * 2 - 0.5, 0.5, true); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,229,138,0.35)'; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3b8'; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // 영냥이
  const hurt = now < p.hurtUntil;
  const st = p.action !== 'idle' ? p.action : p.moving ? 'walk' : 'idle';
  if (hurt && Math.floor(t / 80) % 2) ctx.globalAlpha = 0.5;
  drawActor(ctx, 'neo_cat', { x: p.x, y: p.y + 16, size: 48, state: st, facing: p.facing, t, name: '영냥이' });
  ctx.globalAlpha = 1;

  // 별자리 궤도(플레이어 위에 그림)
  for (const wp of hs.weapons) {
    if (wp.id !== 'orbit') continue;
    const s = weaponStats(wp, m);
    for (let k = 0; k < s.count; k++) {
      const a = world.orbitAngle + (k / s.count) * Math.PI * 2;
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
