// 카페 화면 그리기(Canvas 2D). 상태를 읽기만 한다. 모든 시각 상태는 실제 게임 상태에서 나온다.
// 좌표: 상태의 x, y 는 타일 단위(칸 중심 = +0.5). view 가 타일 → 픽셀 변환을 맡는다.

import { GRID, FIXTURES, FURNITURE, SPOTS, RESERVED, AREAS, areaCells } from '../data/layout.js';
import { PDF } from '../config/balance.pdf.js';
import { PEOPLE, STAFF_CREW } from '../data/companions.js';
import { MENUS } from '../data/menus.js';
import { OUTFITS } from '../data/outfits.js';
import { ASSETS } from './assets.js';
import { furnitureCells } from '../game/space.js';
import { drawActor, roundRect, drawObjectImage, drawIcon } from './sprite-renderer.js';

export function computeView(w, h) {
  const tile = Math.max(8, Math.floor(Math.min(w / GRID.cols, h / GRID.rows) * 100) / 100);
  return { tile, ox: Math.round((w - tile * GRID.cols) / 2), oy: Math.round((h - tile * GRID.rows) / 2), w, h };
}
export const cellToPx = (v, x, y) => ({ x: v.ox + x * v.tile, y: v.oy + y * v.tile });
export const pxToCell = (v, px, py) => ({ x: Math.floor((px - v.ox) / v.tile), y: Math.floor((py - v.oy) / v.tile) });

const isFloorDef = def => def.cells.every(c => c.kind === 'floor');

function cellsBox(cells) {
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
}

function label(ctx, text, x, y, size, color = '#3b2f2f', align = 'center') {
  ctx.font = `700 ${Math.max(10, Math.round(size))}px system-ui, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function outfitLook(state, who) {
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
  const T = v.tile, t = opts.t || 0;
  const P = (x, y) => cellToPx(v, x, y);
  ctx.fillStyle = '#eadbc8'; ctx.fillRect(0, 0, v.w, v.h);

  // 바닥
  for (let y = 0; y < GRID.rows; y++) for (let x = 0; x < GRID.cols; x++) {
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
  // 아직 열지 않은 구역(공방 증축 전): 빗금과 자물쇠
  const open = state.interior.areas || [];
  for (const a of AREAS) {
    if (open.includes(a.id)) continue;
    ctx.fillStyle = 'rgba(92,60,82,0.28)';
    for (const [x, y] of areaCells(a)) {
      const p = P(x, y);
      ctx.fillRect(p.x, p.y, T + 0.5, T + 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + T); ctx.lineTo(p.x + T, p.y); ctx.stroke();
    }
    const [x0, y0, x1, y1] = a.rect;
    const c = P((x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2);
    label(ctx, '🔒', c.x, c.y - T * 0.2, T * 0.5);
    label(ctx, a.name, c.x, c.y + T * 0.4, T * 0.28, '#fff');
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
    ctx.strokeStyle = 'rgba(120,90,60,0.25)'; ctx.lineWidth = 1;
    for (let x = 0; x <= GRID.cols; x++) { const p = P(x, 0); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + T * GRID.rows); ctx.stroke(); }
    for (let y = 0; y <= GRID.rows; y++) { const p = P(0, y); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + T * GRID.cols, p.y); ctx.stroke(); }
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
    if (!drawObjectImage(ctx, 'objects', fx.id, p.x, p.y, b.w * T, b.h * T)) {
      ctx.fillStyle = fx.color;
      roundRect(ctx, p.x + 2, p.y + 2, b.w * T - 4, b.h * T - 4, T * 0.15); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(p.x + 4, p.y + 4, b.w * T - 8, T * 0.18);
    }
    label(ctx, fx.name, p.x + b.w * T / 2, p.y + (b.h === 1 ? T * 0.42 : b.h * T / 2), T * 0.27);
  }

  // 가구(테이블·의자·막는 장식)
  const tablesByUid = new Map((state.tables || []).map(tb => [tb.uid, tb]));
  for (const f of list) {
    const def = FURNITURE[f.defId];
    if (isFloorDef(def)) continue;
    if (!def.table && drawWhole(ctx, f, P, T)) continue;
    for (const c of furnitureCells(f)) {
      const p = P(c.x, c.y);
      if (c.kind === 'table') drawTable(ctx, state, p, T, f, tablesByUid.get(f.uid), t);
      else if (c.kind === 'chair') { if (drawObjectImage(ctx, 'objects', 'chair', p.x, p.y, T, T)) continue; ctx.fillStyle = '#a8774c'; roundRect(ctx, p.x + T * 0.22, p.y + T * 0.3, T * 0.56, T * 0.5, T * 0.12); ctx.fill(); }
      else drawDecor(ctx, f.defId, def, p, T);
    }
  }

  if (state.mode === 'shift') drawStations(ctx, state, v);

  // 캐릭터: y 순으로 정렬해 앞뒤를 맞춘다
  const actors = [];
  if (state.mode === 'shift') {
    for (const c of Object.values(state.customers)) {
      const st = c.action === 'walk' ? 'walk' : c.action === 'react' ? 'react' : 'idle';
      actors.push({ key: 'customer', x: c.x, y: c.y, o: { state: st, facing: c.facing, hue: c.hue } });
    }
    for (const s of Object.values(state.staff)) {
      const map = { walk: 'walk', serve: 'serve', clean: 'serve', host: 'host', react: 'react' };
      let st = map[s.action] || 'idle';
      if (s.action === 'cook') st = 'cook'; // 루나 언니가 굽는 중
      actors.push({ key: ASSETS.actors[s.id] ? s.id : 'customer', x: s.x, y: s.y, o: { state: st, facing: s.facing, name: staffName(state, s.id), carry: s.carry ? { color: MENUS[s.carry.menuId].color } : null, ...outfitLook(state, s.id) } });
    }
  } else if (state.mode === 'prep' || state.mode === 'settlement') {
    actors.push({ key: 'yeoni', x: SPOTS.yeoniHome.x + 0.5, y: SPOTS.yeoniHome.y + 0.5, o: { state: 'idle', facing: 'down', name: '연이', ...outfitLook(state, 'yeoni') } });
    for (const id of STAFF_CREW) {
      const home = id === 'luna' ? SPOTS.lunaHome : SPOTS.sisHome;
      actors.push({ key: id, x: home.x + 0.5, y: home.y + 0.5, o: { state: 'idle', facing: 'down', name: PEOPLE[id].name, ...outfitLook(state, id) } });
    }
    if (state.people.neo?.activity === 'idle') actors.push({ key: 'neo', x: SPOTS.neoHome.x + 0.5, y: SPOTS.neoHome.y + 0.5, o: { state: 'idle', facing: 'down', name: '네오', ...outfitLook(state, 'neo') } });
  }
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) {
    const p = P(a.x, a.y);
    drawActor(ctx, a.key, { ...a.o, x: p.x, y: p.y + T * 0.32, size: T * 1.45, t });
  }

  // 편집 표시: 선택 가구와 문제 가구
  if (editing) {
    for (const f of list) {
      const bad = opts.problemUids?.has(f.uid);
      const sel = opts.selectedUid === f.uid;
      if (!bad && !sel) continue;
      ctx.lineWidth = sel ? 3 : 2;
      ctx.strokeStyle = bad ? '#d9443a' : '#2f7de1';
      ctx.setLineDash(bad && !sel ? [5, 4] : []);
      for (const c of furnitureCells(f)) { const p = P(c.x, c.y); ctx.strokeRect(p.x + 2, p.y + 2, T - 4, T - 4); }
      ctx.setLineDash([]);
    }
  }
}

function staffName(state, id) {
  if (id === 'yeoni') return '연이';
  if (PEOPLE[id]) return PEOPLE[id].name;
  return id.startsWith('dev_') ? 'DEV' : id;
}

function drawTable(ctx, state, p, T, f, tb, t) {
  const visit = tb?.customerId ? state.visits[state.customers[tb.customerId]?.visitId] : null;
  if (visit?.fevered && state.fever.activeUntil != null) {
    ctx.fillStyle = `rgba(255,200,60,${0.35 + Math.sin(t / 150) * 0.15})`;
    ctx.beginPath(); ctx.arc(p.x + T / 2, p.y + T / 2, T * 0.72, 0, Math.PI * 2); ctx.fill();
  }
  if (!drawObjectImage(ctx, 'objects', 'table', p.x, p.y, T, T)) {
    ctx.fillStyle = '#c79a6b';
    roundRect(ctx, p.x + T * 0.08, p.y + T * 0.12, T * 0.84, T * 0.76, T * 0.18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(p.x + T * 0.14, p.y + T * 0.16, T * 0.72, T * 0.12);
  }
  if (tb?.state === 'dirty' || tb?.state === 'cleaning') {
    ctx.fillStyle = '#8a6142';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(p.x + T * (0.25 + (i * 37 % 50) / 100), p.y + T * (0.35 + (i * 23 % 35) / 100), T * 0.04, 0, Math.PI * 2); ctx.fill(); }
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
      drawIcon(ctx,o.menuId,cx,cy,16);
    });
  }
  // 테이블 번호(색만이 아니라 숫자로)
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + T * 0.2, p.y + T * 0.22, T * 0.16, 0, Math.PI * 2); ctx.fill();
  label(ctx, String(f.tableNo), p.x + T * 0.2, p.y + T * 0.23, T * 0.24, '#5a3b22');
}

// 여러 칸짜리 가구 그림을 한 장으로 그린다(러그·책장 등). 그림이 없으면 false.
function drawWhole(ctx, f, P, T) {
  const cells = furnitureCells(f).map(c => [c.x, c.y]);
  const b = cellsBox(cells), p = P(b.x, b.y);
  return drawObjectImage(ctx, 'objects', f.defId, p.x, p.y, b.w * T, b.h * T);
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
    if (st.current) {
      const k = Math.min(1, st.current.progressMs / st.current.durationMs);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(ctx, p.x + 4, p.y + T * 0.66, w - 8, T * 0.22, 4); ctx.fill();
      ctx.fillStyle = MENUS[st.current.menuId].color; roundRect(ctx, p.x + 4, p.y + T * 0.66, (w - 8) * k, T * 0.22, 4); ctx.fill();
      label(ctx, `${MENUS[st.current.menuId].short} ${Math.ceil((st.current.durationMs - st.current.progressMs) / 1000)}초`, p.x + w / 2, p.y + T * 0.77, T * 0.2, '#fff');
    }
    if (st.next) {
      ctx.fillStyle = '#fff'; roundRect(ctx, p.x + w - T * 0.62, p.y - T * 0.02, T * 0.62, T * 0.28, 5); ctx.fill();
      label(ctx, `다음 ${MENUS[st.next.menuId].short}`, p.x + w - T * 0.31, p.y + T * 0.12, T * 0.17, '#5a3b22');
    }
    if (st.held) {
      ctx.strokeStyle = '#d9443a'; ctx.lineWidth = 3; ctx.strokeRect(p.x + 2, p.y + 2, w - 4, T - 4);
      ctx.fillStyle = '#d9443a'; roundRect(ctx, p.x + 2, p.y + T * 0.02, T * 1.1, T * 0.28, 5); ctx.fill();
      label(ctx, '트레이 가득', p.x + 2 + T * 0.55, p.y + T * 0.16, T * 0.17, '#fff');
    }
  }
  // 서빙대 위 완성 음식(트레이 3칸)
  const pb = cellsBox(fixtures.pass.cells), pp = cellToPx(v, pb.x, pb.y);
  state.tray.forEach((it, i) => {
    const cx = pp.x + T * (0.4 + i * 0.6), cy = pp.y + T * 0.72;
    ctx.fillStyle = it ? '#fffaf2' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, T * 0.18, 0, Math.PI * 2); ctx.fill();
    if (it) drawIcon(ctx,it.menuId,cx,cy,16);
  });
}
