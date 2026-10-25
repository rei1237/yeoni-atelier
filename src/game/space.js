// 공간: 격자, 길찾기(BFS), 배치 검증, 테이블 위치 계산.

import { GRID, FIXTURES, RESERVED, FURNITURE, SPOTS, AREAS, areaCells } from '../data/layout.js';

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// rot: 0~3 (시계 방향 90도 단위)
export function rotateCell(dx, dy, rot) {
  let a = dx, b = dy;
  for (let i = 0; i < (rot & 3); i++) [a, b] = [-b, a];
  return [a, b];
}

export function furnitureCells(f) {
  if (f.x == null || f.y == null) return [];
  return FURNITURE[f.defId].cells.map(c => {
    const [dx, dy] = rotateCell(c.dx, c.dy, f.rot);
    return { x: f.x + dx, y: f.y + dy, kind: c.kind };
  });
}

export const inBounds = (x, y) => x >= 0 && y >= 0 && x < GRID.cols && y < GRID.rows;
const key = (x, y) => y * GRID.cols + x;

// 아직 열지 않은 구역의 칸(key 집합). open: 연 구역 id 목록
export function lockedSet(open = []) {
  const set = new Set();
  for (const a of AREAS) if (!open.includes(a.id)) for (const [x, y] of areaCells(a)) set.add(key(x, y));
  return set;
}

export function buildGrid(furniture, open = []) {
  const n = GRID.cols * GRID.rows;
  const locked = lockedSet(open);
  const fixture = new Array(n).fill(null);
  const block = new Array(n).fill(null);
  const floor = new Array(n).fill(null);
  for (const fx of FIXTURES) for (const [x, y] of fx.cells) fixture[key(x, y)] = fx.id;
  for (const f of furniture) {
    for (const c of furnitureCells(f)) {
      if (!inBounds(c.x, c.y)) continue;
      if (c.kind === 'floor') floor[key(c.x, c.y)] = f.uid;
      else block[key(c.x, c.y)] = { uid: f.uid, kind: c.kind };
    }
  }
  return {
    fixture, block, floor, locked,
    walkable: (x, y) => inBounds(x, y) && !fixture[key(x, y)] && !block[key(x, y)] && !locked.has(key(x, y)),
    blockAt: (x, y) => (inBounds(x, y) ? block[key(x, y)] : null),
  };
}

// BFS 4방향. 반환: 시작 칸을 뺀 칸 목록([x,y]...). 목표가 막힌 칸(의자 등)이어도 goalBlocked 이면 도착 허용.
export function findPath(grid, from, to, { goalBlocked = false } = {}) {
  if (from.x === to.x && from.y === to.y) return [];
  if (!inBounds(to.x, to.y)) return null;
  if (!goalBlocked && !grid.walkable(to.x, to.y)) return null;
  const prev = new Map();
  const startK = key(from.x, from.y);
  prev.set(startK, -1);
  const queue = [[from.x, from.y]];
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, y] = queue[qi];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const isGoal = nx === to.x && ny === to.y;
      if (!isGoal && !grid.walkable(nx, ny)) continue;
      prev.set(k, key(x, y));
      if (isGoal) {
        const path = [];
        let c = k;
        while (c !== startK) { path.push([c % GRID.cols, Math.floor(c / GRID.cols)]); c = prev.get(c); }
        return path.reverse();
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}

// 테이블 세트의 테이블 칸·의자 칸·서빙 칸(서빙대에서 가장 가까운 테이블 옆 통로)
export function tableGeometry(grid, f) {
  const cells = furnitureCells(f);
  const table = cells.find(c => c.kind === 'table');
  const chair = cells.find(c => c.kind === 'chair');
  if (!table || !chair) return null;
  let best = null;
  for (const [dx, dy] of DIRS) {
    const sx = table.x + dx, sy = table.y + dy;
    if (!grid.walkable(sx, sy)) continue;
    const p = findPath(grid, SPOTS.pickup, { x: sx, y: sy });
    if (p && (!best || p.length < best.len)) best = { x: sx, y: sy, len: p.length };
  }
  return { table: { x: table.x, y: table.y }, chair: { x: chair.x, y: chair.y }, service: best ? { x: best.x, y: best.y } : null };
}

const RESERVED_SET = new Set(RESERVED.map(([x, y]) => key(x, y)));
const FIXTURE_SET = new Set(FIXTURES.flatMap(f => f.cells.map(([x, y]) => key(x, y))));

// 배치 검증: 겹침, 입구 막기, 통로(입구→좌석, 서빙대→테이블, 입구→서빙대·주방·대기 자리)
export function validateLayout(furniture, open = []) {
  const problems = [];
  const locked = lockedSet(open);
  const blockOwner = new Map();
  const floorOwner = new Map();
  const placed = furniture.filter(f => f.x != null);
  for (const f of placed) {
    const name = FURNITURE[f.defId].name;
    for (const c of furnitureCells(f)) {
      if (!inBounds(c.x, c.y)) { problems.push({ code: 'bounds', uid: f.uid, msg: `${name}: 가게 밖으로 나갔습니다` }); continue; }
      const k = key(c.x, c.y);
      if (FIXTURE_SET.has(k)) problems.push({ code: 'fixture', uid: f.uid, msg: `${name}: 고정 설비와 겹칩니다` });
      if (RESERVED_SET.has(k)) problems.push({ code: 'reserved', uid: f.uid, msg: `${name}: 주방 통로·입구·계산대 뒤는 비워 두어야 합니다` });
      if (locked.has(k)) problems.push({ code: 'locked', uid: f.uid, msg: `${name}: 아직 열지 않은 구역입니다 (마을 공방에서 증축)` });
      const owners = c.kind === 'floor' ? floorOwner : blockOwner;
      if (owners.has(k) && owners.get(k) !== f.uid) problems.push({ code: 'overlap', uid: f.uid, msg: `${name}: 다른 가구와 겹칩니다` });
      owners.set(k, f.uid);
    }
  }
  const tables = placed.filter(f => FURNITURE[f.defId].table);
  const totalTables = furniture.filter(f => FURNITURE[f.defId].table).length;
  if (tables.length !== totalTables) problems.push({ code: 'tables', msg: '테이블 세트는 모두 배치해야 합니다' });

  if (!problems.length) {
    const grid = buildGrid(placed, open);
    const reach = (from, to, opts) => !!findPath(grid, from, to, opts);
    for (const f of tables) {
      const g = tableGeometry(grid, f);
      const label = `${f.tableNo}번 테이블`;
      if (!g.service) problems.push({ code: 'service', uid: f.uid, msg: `${label}: 서빙대에서 갈 수 있는 테이블 옆 통로가 없습니다` });
      if (!reach(SPOTS.entrance, g.chair, { goalBlocked: true })) problems.push({ code: 'seat', uid: f.uid, msg: `${label}: 입구에서 의자까지 길이 막혔습니다` });
    }
    const must = [['pickup', '서빙대'], ['yeoniHome', '계산대'], ['neoHome', '대기 자리'], ['drinkFront', '음료 머신'], ['ovenFront', '오븐']];
    for (const [spot, label] of must) {
      if (!reach(SPOTS.entrance, SPOTS[spot])) problems.push({ code: 'aisle', msg: `입구에서 ${label}까지 통로가 막혔습니다` });
    }
  }
  return { ok: problems.length === 0, problems };
}
