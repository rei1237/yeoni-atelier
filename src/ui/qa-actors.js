// 개발 모드 전용 검수 화면(?dev=1&qa=actors). 게임 상태를 읽거나 바꾸지 않고, 그림 계약만 한 장에 모아 본다.
// 행 = 배우(기본·의상), 열 = 방향 4 × (대기·걷기·운반·정리). 손 위치는 actor-sockets.js, 소품은 service 그림을 쓴다.
import { ASSETS, loadAssetImages } from '../render/assets.js';
import { drawActor } from '../render/sprite-renderer.js';
import { ACTOR_SOCKETS } from '../data/actor-sockets.js';
import { MENUS } from '../data/menus.js';

const DIRS = ['down', 'left', 'right', 'up'];
const POSES = ['idle', 'walk', 'carry', 'clean'];
const CELL = 96, HEAD = 120, TOP = 28;

export async function mountActorQA() {
  const rows = Object.keys(ASSETS.actors)
    .filter(k => ACTOR_SOCKETS[k.split('@')[0]] && k !== 'customer')
    .sort((a, b) => a.localeCompare(b));
  const menuId = Object.keys(MENUS).find(id => ASSETS.icons?.[id]) || Object.keys(MENUS)[0];
  await loadAssetImages(undefined, { keys: [...rows.map(k => `actors/${k}`), ...Object.keys(ASSETS.service || {}).map(k => `service/${k}`), `icons/${menuId}`] });
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:999;overflow:auto;background:#f4efe7';
  const cv = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  const w = HEAD + DIRS.length * POSES.length * CELL, h = TOP + rows.length * CELL;
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
  cv.dataset.qa = 'actors'; cv.dataset.rows = rows.length;
  wrap.append(cv); document.body.append(wrap);
  const ctx = cv.getContext('2d');
  const frame = t => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f4efe7'; ctx.fillRect(0, 0, w, h);
    ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = '#3b2f2f'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    DIRS.forEach((d, di) => POSES.forEach((p, pi) => ctx.fillText(`${d} ${p}`, HEAD + (di * POSES.length + pi + .5) * CELL, TOP / 2)));
    rows.forEach((key, r) => {
      const [base, outfitId] = key.split('@'), y0 = TOP + r * CELL;
      ctx.fillStyle = r % 2 ? '#efe7dc' : '#f8f3ec'; ctx.fillRect(0, y0, w, CELL);
      ctx.fillStyle = '#3b2f2f'; ctx.textAlign = 'left'; ctx.fillText(key, 6, y0 + CELL / 2); ctx.textAlign = 'center';
      DIRS.forEach((facing, di) => POSES.forEach((pose, pi) => {
        const x = HEAD + (di * POSES.length + pi + .5) * CELL, foot = y0 + CELL - 8;
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.strokeRect(x - CELL / 2 + .5, y0 + .5, CELL - 1, CELL - 1);
        drawActor(ctx, base, {
          x, y: foot, size: CELL * .86, t, facing, outfitId: outfitId || null,
          state: pose === 'walk' || pose === 'carry' ? 'walk' : pose === 'clean' ? 'clean' : 'idle',
          carry: pose === 'carry' ? { menuId } : null, cleaning: pose === 'clean',
        });
        ctx.fillStyle = '#d9443a'; ctx.fillRect(x - 1, foot - 1, 3, 3);
      }));
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
