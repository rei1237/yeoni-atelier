import {drawTrail} from './trail-view.js';
import {drawKfp} from './kfp-view.js';
import {KFP_PLAYER} from '../data/kfp-player.js';
import {enemyVisualSize,drawSaju} from './hunt-visuals.js';
// 영냥이 월정석 사냥 화면(뱀서식). 플레이어를 따라가는 카메라, 필드, 적, 무기 효과, 드롭, 피해 숫자, 사건 알림, 조이스틱.
// 상태는 읽기만 한다. 화면 흔들림 같은 연출에만 Math.random 을 쓴다.

import {fieldTheme} from '../game/hunt-field.js';
import { TEMP } from '../config/balance.temp.js';
import { ENEMIES } from '../data/hunt-kit.js';
import { gemTier, mods, catnipLeft, weaponStats, findBoss } from '../game/hunt.js';
import { drawActor, drawIcon } from './sprite-renderer.js';
import { imageFor, actorDef } from './assets.js';

// 적 그림은 대부분 오른쪽을 보는 옆모습 한 줄이라 왼쪽으로 갈 때 뒤집는다. 왼쪽 행이 따로 있는 시트(검은 호랑이)는 그 행을 쓰고 뒤집지 않는다.
export function enemyFlipX(e,def){
  if(actorDef(def.art||e.type)?.directions?.includes('left'))return false;
  return (e.faceX??(e.facing==='left'?-1:1))<0;
}

const H = TEMP.HUNT;
const GEM_KEYS = ['gem_s', 'gem_m', 'gem_l'];
const fieldPatterns = new WeakMap();

// 달빛 결계(위에서 본 바닥 원). 이미지 에셋 없이 캔버스로 그린다
const WARD = { gold: '#D9B26A', rose: '#E7A3B5', lilac: '#B9A6E0', silver: '#E6E9F5' };
const wardFloors = new Map();
function wardFloor(r, evo) {
  const key = `${Math.round(r)}:${evo ? 1 : 0}`;
  if (wardFloors.has(key)) return wardFloors.get(key);
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'), s = Math.ceil(r * 2 + 4), m = s / 2; c.width = c.height = s;
  const g = c.getContext('2d'), grad = g.createRadialGradient(m, m, r * .08, m, m, r);
  grad.addColorStop(0, evo ? 'rgba(230,233,245,.26)' : 'rgba(185,166,224,.22)');
  grad.addColorStop(.6, evo ? 'rgba(185,166,224,.16)' : 'rgba(231,163,181,.14)');
  grad.addColorStop(.93, evo ? 'rgba(230,233,245,.30)' : 'rgba(217,178,106,.24)'); // 테두리 쪽 결계 빛
  grad.addColorStop(1, 'rgba(185,166,224,0)');
  g.fillStyle = grad; g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill();
  if (wardFloors.size > 24) wardFloors.clear();
  wardFloors.set(key, c); return c;
}
function petal(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .7, 0, 0, s); ctx.quadraticCurveTo(-s * .7, 0, 0, -s); ctx.fill(); }
function wardStar(ctx, s) { ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, d = k % 2 ? s * .35 : s; ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d); } ctx.closePath(); ctx.fill(); }
function crescent(ctx, s) { ctx.beginPath(); ctx.arc(0, 0, s, -Math.PI / 2, Math.PI / 2); ctx.ellipse(0, 0, s * .45, s, 0, Math.PI / 2, -Math.PI / 2, true); ctx.fill(); }
// 둥근 판(보스 체력·알림). ctx.roundRect 없는 브라우저도 그린다
function roundPanel(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawMoonWard(ctx, x, y, r, now, evo, still) {
  const floor = wardFloor(r, evo), spin = still ? 0 : now / 7000, rim = evo ? WARD.silver : WARD.gold;
  ctx.save(); ctx.translate(x, y);
  if (floor) ctx.drawImage(floor, -floor.width / 2, -floor.height / 2);
  ctx.strokeStyle = rim; ctx.globalAlpha = .7; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .45; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r * .82, 0, Math.PI * 2); ctx.stroke();
  // 두 고리 사이를 도는 꽃잎·별 12개
  for (let k = 0; k < 12; k++) {
    const a = spin + k * Math.PI / 6;
    ctx.save(); ctx.translate(Math.cos(a) * r * .91, Math.sin(a) * r * .91); ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = .85; ctx.fillStyle = k % 2 ? rim : (evo ? WARD.lilac : WARD.rose);
    if (k % 2) wardStar(ctx, 4.5); else petal(ctx, 6);
    ctx.restore();
  }
  // 안쪽 초승달 4개는 반대로 돈다
  ctx.fillStyle = evo ? WARD.silver : WARD.lilac;
  for (let k = 0; k < 4; k++) {
    const a = -spin * 1.6 + k * Math.PI / 2;
    ctx.save(); ctx.translate(Math.cos(a) * r * .55, Math.sin(a) * r * .55); ctx.rotate(a); ctx.globalAlpha = .55; crescent(ctx, 7); ctx.restore();
  }
  if (evo) { // 월광 결계: 가운데 보름달 문양
    ctx.globalAlpha = .5; ctx.strokeStyle = WARD.silver; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, r * .24, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .18; ctx.fillStyle = WARD.silver; ctx.fill();
  }
  ctx.restore();
}
// 회복 틱: 금 고리가 안에서 밖으로 퍼지고 빛 알갱이가 떠오른다
function drawWardPulse(ctx, b, now, still) {
  const q = Math.max(0, Math.min(1, (now - b.at) / (b.until - b.at)));
  ctx.save(); ctx.strokeStyle = WARD.gold; ctx.fillStyle = '#FFF1C7';
  ctx.globalAlpha = (1 - q) * .8; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(b.x, b.y, still ? b.r * .82 : b.r * (.3 + .7 * q), 0, Math.PI * 2); ctx.stroke();
  if (!still) for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3 + (b.at % 628) / 100, d = b.r * (.25 + .12 * (k % 3));
    ctx.globalAlpha = (1 - q) * .9; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d * .6 - q * 26, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawHunt(ctx, state, world, w, h, opts = {}) {
  const t = opts.t || 0;
  const fx=(key,x,y,size)=>{const img=imageFor(`effects/${key}`);if(!img)return false;const frame=Math.floor((opts.reducedMotion?0:t)/100)%4;ctx.drawImage(img,frame*128,0,128,128,x-size/2,y-size/2,size,size);return true;};
  const hs = state.hunt;
  // 10-29 넓은 데스크톱은 보이는 폭을 760 안쪽으로 당겨 크게 본다(적이 330~430 밖에서 나오므로)
  const scale = w >= 900 ? Math.max(Math.min(w / 420, h / 600), Math.min(w / 760, h / 360), w / 950) : Math.min(w / 420, h / 600);
  const vw = w / scale, vh = h / scale;
  const p = world.player;
  const now = hs.elapsedMs;
  let camX = p.x-vw/2;
  let camY = p.y-vh/2;
  if (now < world.shakeUntil && !state.paused && !opts.reducedMotion) { camX += Math.sin(now*.071)*4; camY += Math.cos(now*.097)*4; }

  ctx.fillStyle = '#141a2b'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-Math.round(camX), -Math.round(camY));

  const theme=fieldTheme(hs.depth),field=imageFor('tiles/'+theme)||imageFor('tiles/river_field');
  ctx.fillStyle=hs.depth>=85?'#231a30':'#263a3b';ctx.fillRect(camX-2,camY-2,vw+4,vh+4);
  if(field){const tile=512;for(let y=Math.floor(camY/tile)*tile;y<camY+vh;y+=tile)for(let x=Math.floor(camX/tile)*tile;x<camX+vw;x+=tile)ctx.drawImage(field,x,y,tile,tile);}
  for(const o of world.props||[]){if(hs.brokenProps?.[o.id]||o.x<camX-64||o.x>camX+vw+64||o.y<camY-80||o.y>camY+vh+80)continue;const img=imageFor('objects/hunt_'+o.kind),sz=o.treasure?84:64;if(o.treasure){const g=ctx.createRadialGradient(o.x,o.y-14,4,o.x,o.y-14,56);g.addColorStop(0,'rgba(255,231,160,.55)');g.addColorStop(1,'rgba(255,231,160,0)');ctx.fillStyle=g;ctx.fillRect(o.x-56,o.y-70,112,112);}if(img)ctx.drawImage(img,o.x-sz/2,o.y-sz*.75,sz,sz);if(o.hp<o.maxHp){ctx.fillStyle='#e7c275';ctx.fillRect(o.x-20,o.y-52,40*o.hp/o.maxHp,3);}}
  drawKfp(ctx,world.kfp,now,opts.reducedMotion);
  drawTrail(ctx,hs);
  const m = mods(hs);
  // 달빛 수호부(바닥 원): 안에 있는 동안 방어가 오르고 조금씩 회복한다. 무적·탄 제거는 없다
  for (const wp of hs.weapons) if (wp.id === 'aura') drawMoonWard(ctx, p.x, p.y, weaponStats(wp, m).radius, now, wp.evo, opts.reducedMotion);
  for (const b of world.fx) if (b.kind === 'ward') drawWardPulse(ctx, b, now, opts.reducedMotion);

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
    } else if (z.kind === 'ring') { // 도넛: 안쪽은 안전
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.moveTo(z.x + z.r0, z.y); ctx.arc(z.x, z.y, z.r0, 0, Math.PI * 2, true); ctx.stroke();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r0 + (z.r - z.r0) * k, 0, Math.PI * 2); ctx.moveTo(z.x + z.r0, z.y); ctx.arc(z.x, z.y, z.r0, 0, Math.PI * 2, true); ctx.fill();
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
      drawIcon(ctx, d.kind === 'ing' || d.kind === 'moon' ? d.id : d.kind, d.x, d.y + bob, d.kind === 'chest' ? 24 : d.kind === 'fish' && d.v ? 14 : 18);
    }
  }

  // 적
  for (let i = 0; i < world.enemies.count; i++) {
    const e = world.enemies.items[i];
    const def = ENEMIES[e.type];
    if(e.x<camX-120||e.x>camX+vw+120||e.y<camY-120||e.y>camY+vh+120)continue;
    drawEnemyWarning(ctx,e,def,now);
    const hit = e.hitAt > 0 && now - e.hitAt < 90;
    const visualSize=enemyVisualSize(def,scale);ctx.save();
    if(!def.boss&&def.size<48){ctx.fillStyle='rgba(13,19,35,.5)';ctx.beginPath();ctx.ellipse(e.x,e.y+def.r*.6,def.r,def.r*.45,0,0,Math.PI*2);ctx.fill();ctx.shadowColor=hit?'#fff2b5':'#b3a5ce';ctx.shadowBlur=2;}
    drawActor(ctx, def.art || e.type, { x: e.x, y: e.y + visualSize * 0.3, size: visualSize, state:e.rolePhase==='warning'||e.rolePhase==='fuse'?'attack':hit?'hurt':'walk', facing:e.facing||'down', t:now+e.uid*73, seed:e.uid, flash:hit&&!opts.reducedMotion, flipX:enemyFlipX(e,def) });ctx.restore();
    if (def.elite && !def.boss) {
      const bw = visualSize * 0.8, k = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - bw / 2, e.y - visualSize * 0.62, bw, 5);
      ctx.fillStyle = '#ffd38a'; ctx.fillRect(e.x - bw / 2, e.y - visualSize * 0.62, bw * k, 5);
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
  drawSaju(ctx,swing,now,opts.reducedMotion);
  for(const burst of world.fx){if(burst.kind==='ward')continue;if(burst.kind==='petal'){drawPetalWave(ctx,burst,now,opts.reducedMotion);continue;}const q=(now-burst.at)/(burst.until-burst.at);ctx.save();ctx.globalAlpha=1-q;ctx.strokeStyle=burst.kind==='burst'?'#ffb37d':'#fff4b8';ctx.lineWidth=burst.kind==='burst'?3:2;ctx.beginPath();ctx.arc(burst.x,burst.y,burst.r*(.35+.65*q),0,Math.PI*2);ctx.stroke();if(!opts.reducedMotion)for(let k=0;k<6;k++){const a=k*Math.PI/3;ctx.beginPath();ctx.moveTo(burst.x+Math.cos(a)*burst.r*q*.6,burst.y+Math.sin(a)*burst.r*q*.6);ctx.lineTo(burst.x+Math.cos(a)*burst.r*q,burst.y+Math.sin(a)*burst.r*q);ctx.stroke();}ctx.restore();}
  // 개다래 열매 버프: 발밑에 옅은 초록·금빛(끝나기 2초 전부터 옅어진다)
  const buff=catnipLeft(hs);if(buff>0){const g=ctx.createRadialGradient(p.x,p.y+14,6,p.x,p.y+14,58),a=Math.min(1,buff/2000)*(opts.reducedMotion?.5:.42+.12*Math.sin(now/180));g.addColorStop(0,`rgba(214,236,150,${a})`);g.addColorStop(1,'rgba(214,236,150,0)');ctx.fillStyle=g;ctx.fillRect(p.x-58,p.y-44,116,116);}
  // 영냥이
  const hurt = now < p.hurtUntil;
  const st = p.action !== 'idle' ? p.action : p.moving ? 'walk' : 'idle';
  if (hurt && Math.floor(t / 80) % 2) ctx.globalAlpha = 0.5;
  const attacking=swing&&now<swing.until,casting=!attacking&&p.cast&&now<p.cast.until;
  if(hs.hunterId==='yeoni_pig'){
    const img=imageFor('ui/kfp_player'),frames=KFP_PLAYER.frames,fr=frames[opts.reducedMotion||!p.moving?0:Math.floor(now/110)%frames.length],k=72/KFP_PLAYER.height;
    if(img){ctx.save();if(p.facing==='left'){ctx.translate(p.x*2,0);ctx.scale(-1,1);}ctx.drawImage(img,fr[0],0,fr[1],fr[2],p.x-fr[3]*k,p.y+20-fr[4]*k,fr[1]*k,fr[2]*k);ctx.restore();}
    else drawActor(ctx,'yeoni_pig',{x:p.x,y:p.y+20,size:72,state:st,facing:p.facing,t:now});
  }
  else if(hs.hunterId==='seohanbi')drawActor(ctx,'seohanbi_tiger',{x:p.x,y:p.y+20,size:76,state:attacking?'walk':st,facing:attacking?p.attackFacing:p.facing,t:now,animationFrame:attacking?Math.min(3,Math.floor((now-swing.at)/90)):undefined});
  else{
    // 참격 > 시전 > 걷기. 공격·시전 셀은 192×160이라 크기 68×160/128=85로 몸 크기를 맞춘다
    const act=attacking?{key:'neo_cat_attack',at:swing.at,step:90,facing:p.attackFacing}:casting?{key:'neo_cat_cast',at:p.cast.at,step:80,facing:p.cast.facing}:null;
    const walkFps=8+3*Math.max(0,Math.min(1,(m.speed-1)/.5));
    const frame=opts.reducedMotion?1:act?Math.min(3,Math.floor((now-act.at)/act.step)):st==='walk'?Math.floor(now/1000*walkFps)%4:undefined;
    drawActor(ctx,act?act.key:'neo_cat',{x:p.x,y:p.y+20,size:act?85:68,state:act?'walk':st,facing:act?act.facing:p.facing,t:now,animationFrame:frame});
  }
  ctx.globalAlpha = 1;
  // 수호부가 피해를 줄인 순간: 짧은 금빛 막
  if (p.guardAt != null && now - p.guardAt < 220) {
    ctx.save(); ctx.globalAlpha = (1 - (now - p.guardAt) / 220) * .8; ctx.strokeStyle = WARD.gold; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

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
  for (let i = Math.max(0,world.texts.count-16); i < world.texts.count; i++) {
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
    // 달밤 판: 남색 둥근 판·금 가는 테·초승달·장미→진홍 막대·꽃잎 마름모 페이즈 눈금
    const bw = Math.min(w - 40, 380), bx = (w - bw) / 2, by = h - 48;
    roundPanel(ctx, bx - 10, by - 3, bw + 20, 40, 12);
    ctx.fillStyle = 'rgba(20,26,51,0.92)'; ctx.fill();
    ctx.strokeStyle = 'rgba(217,178,106,0.85)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.translate(bx + 3, by + 9); ctx.rotate(Math.PI); ctx.fillStyle = WARD.gold; crescent(ctx, 5.5); ctx.restore();
    ctx.font = '800 13px system-ui, sans-serif'; ctx.fillStyle = '#F6E3B4';
    ctx.textAlign = 'left'; ctx.fillText(def.name, bx + 12, by + 14);
    ctx.fillStyle = '#E6E9F5';
    ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, Math.ceil(e.hp)).toLocaleString('ko-KR')} / ${e.maxHp.toLocaleString('ko-KR')}`, bx + bw, by + 14);
    roundPanel(ctx, bx, by + 20, bw, 9, 4.5); ctx.fillStyle = '#2B1A33'; ctx.fill();
    const q = Math.max(0, e.hp / e.maxHp);
    if (q > 0) {
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#B3243F'); g.addColorStop(1, '#E7A3B5');
      roundPanel(ctx, bx, by + 20, Math.max(9, bw * q), 9, 4.5); ctx.fillStyle = g; ctx.fill();
    }
    for (const ph of (def.phases || []).slice(1)) {
      ctx.save(); ctx.translate(bx + bw * ph.below, by + 24.5); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#F3EBDD'; ctx.strokeStyle = WARD.gold; ctx.lineWidth = 1; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.strokeRect(-3.5, -3.5, 7, 7); ctx.restore();
    }
    const sx = (e.x - camX) * scale, sy = (e.y - camY) * scale;
    if (sx < 0 || sx > w || sy < 0 || sy > h) {
      const ax = Math.max(22, Math.min(w - 22, sx)), ay = Math.max(22, Math.min(by - 22, sy)), ang = Math.atan2(sy - h / 2, sx - w / 2);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = '#E7A3B5'; ctx.strokeStyle = '#141A33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }

  // 사건 알림(화면 좌표): 금 테 알약. 경고는 붉은 판에 장미빛 테가 깜빡인다(움직임 줄이기면 깜빡이지 않음)
  if (world.banner) {
    const b = world.banner;
    const blink = b.warn && !opts.reducedMotion && Math.floor(t / 250) % 2;
    ctx.font = '800 15px system-ui, sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(b.label).width + 48, bx = w / 2 - tw / 2;
    roundPanel(ctx, bx, 12, tw, 32, 16);
    ctx.fillStyle = b.warn ? (blink ? 'rgba(150,28,58,0.92)' : 'rgba(104,20,44,0.92)') : 'rgba(20,26,51,0.9)'; ctx.fill();
    ctx.strokeStyle = b.warn ? (blink ? '#F3C2CF' : 'rgba(231,163,181,0.75)') : 'rgba(217,178,106,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = b.warn ? WARD.rose : WARD.gold;
    for (const sx of [bx + 15, bx + tw - 15]) { ctx.save(); ctx.translate(sx, 28); ctx.rotate(Math.PI / 2); petal(ctx, 4.5); ctx.restore(); }
    ctx.fillStyle = b.warn ? '#FFE0E6' : '#F6E3B4'; ctx.fillText(b.label, w / 2, 33);
  }

  // 조이스틱(화면 좌표)
  const joy = opts.joy;
  if (joy?.active && opts.rect) {
    const sx=w/opts.rect.width,sy=h/opts.rect.height,joyRadius=joy.radius*Math.min(sx,sy);
    const ox = (joy.ox - opts.rect.left)*sx, oy = (joy.oy - opts.rect.top)*sy;
    // 금 테 반투명 달 원
    ctx.fillStyle = 'rgba(20,26,51,0.32)'; ctx.strokeStyle = 'rgba(217,178,106,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ox, oy, joyRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(217,178,106,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ox, oy, joyRadius * .62, 0, Math.PI * 2); ctx.stroke();
    const kx = (joy.x - opts.rect.left)*sx, ky = (joy.y - opts.rect.top)*sy;
    const dx = kx - ox, dy = ky - oy, d = Math.hypot(dx, dy), k = d > joyRadius ? joyRadius / d : 1;
    ctx.fillStyle = 'rgba(246,227,180,0.55)'; ctx.strokeStyle = WARD.gold; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ox + dx * k, oy + dy * k, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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

// 원본 petal-cannon.js의 꽃잎 고리 연출을 현재 렌더 시계에 맞춘다. 게임 난수를 쓰지 않는다.
function drawPetalWave(ctx,wave,now,reduced){
 const t=Math.max(0,Math.min(1,(now-wave.at)/650)),r=wave.r*Math.min(1,t*2.5);
 ctx.save();ctx.translate(wave.x,wave.y);ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle='#ffd1e8';ctx.lineWidth=3*(1-t)+1;
 ctx.beginPath();ctx.arc(0,0,reduced?wave.r:r,0,Math.PI*2);ctx.stroke();
 if(!reduced)for(let i=0;i<18;i++){const a=i*Math.PI*2/18+t*.6;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a+Math.PI/4);ctx.fillStyle=i%2?'#ff75bd':'#ffe0ef';ctx.beginPath();ctx.ellipse(0,0,5+5*(1-t),3,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();
}
