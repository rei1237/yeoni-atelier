// 인테리어 편집: 영업 전·마감 후에만. 초안(draft)에서 이동·회전·보관·배치 → 미리보기 검증 → 적용 / 취소(원상 복구).
// 초안은 저장하지 않는다. 적용할 때만 실제 배치(state.interior.furniture)가 바뀐다.

import { FURNITURE, GRID } from '../data/layout.js';
import { inBounds, validateLayout } from './space.js';

export function editCheck(state) {
  if (state.mode !== 'prep') return { ok: false, reason: state.mode === 'shift' ? '영업 중에는 인테리어를 바꿀 수 없습니다' : state.mode === 'hunt' ? '사냥 중에는 인테리어를 바꿀 수 없습니다' : '결산을 닫은 뒤 편집할 수 있습니다' };
  return { ok: true };
}

const findDraft = (state, uid) => state.interior.draft?.furniture.find(f => f.uid === uid) || null;

export function begin(state) {
  const chk = editCheck(state);
  if (!chk.ok) return chk;
  if (state.interior.draft) return { ok: true };
  state.interior.draft = { furniture: state.interior.furniture.map(f => ({ ...f })), selected: null };
  return { ok: true };
}

function needDraft(state, uid) {
  if (!state.interior.draft) return { error: { ok: false, reason: '편집 모드가 아닙니다' } };
  const f = findDraft(state, uid);
  if (!f) return { error: { ok: false, reason: '없는 가구입니다' } };
  return { f };
}

export function select(state, uid) {
  if (!state.interior.draft) return { ok: false, reason: '편집 모드가 아닙니다' };
  state.interior.draft.selected = uid && findDraft(state, uid) ? uid : null;
  return { ok: true };
}

export function move(state, uid, x, y) {
  const { f, error } = needDraft(state, uid);
  if (error) return error;
  if (f.x == null) return { ok: false, reason: '보관함의 가구는 먼저 배치해 주세요' };
  if (!inBounds(x, y)) return { ok: false, reason: '가게 밖으로는 옮길 수 없습니다' };
  f.x = x; f.y = y;
  return { ok: true };
}

export function nudge(state, uid, dx, dy) {
  const f = findDraft(state, uid);
  if (!f || f.x == null) return { ok: false, reason: '배치된 가구를 골라 주세요' };
  return move(state, uid, f.x + dx, f.y + dy);
}

export function rotate(state, uid) {
  const { f, error } = needDraft(state, uid);
  if (error) return error;
  if (f.x == null) return { ok: false, reason: '보관함의 가구는 회전할 수 없습니다' };
  f.rot = (f.rot + 1) & 3;
  return { ok: true };
}

export function store(state, uid) {
  const { f, error } = needDraft(state, uid);
  if (error) return error;
  if (FURNITURE[f.defId].storable === false) return { ok: false, reason: `${FURNITURE[f.defId].name}은(는) 보관할 수 없습니다 (테이블은 늘릴 수만 있어요)` };
  f.x = null; f.y = null; f.rot = 0;
  return { ok: true };
}

// 보관함 가구 꺼내기: 지정 칸, 없으면 문제가 없는 첫 빈 칸을 찾는다
export function place(state, uid, x, y) {
  const { f, error } = needDraft(state, uid);
  if (error) return error;
  if (f.x != null) return { ok: false, reason: '이미 배치된 가구입니다' };
  const tryAt = (px, py) => {
    f.x = px; f.y = py;
    if (validateLayout(state.interior.draft.furniture, state.interior.areas).ok) return true;
    f.x = null; f.y = null;
    return false;
  };
  if (x != null && y != null) { f.x = x; f.y = y; return { ok: true }; }
  for (let py = 2; py < GRID.rows; py++) for (let px = 0; px < GRID.cols; px++) if (tryAt(px, py)) return { ok: true };
  return { ok: false, reason: '놓을 수 있는 빈 자리가 없습니다' };
}

export function preview(state) {
  const list = state.interior.draft ? state.interior.draft.furniture : state.interior.furniture;
  return validateLayout(list, state.interior.areas);
}

export function cancel(state) {
  if (!state.interior.draft) return { ok: false, reason: '편집 모드가 아닙니다' };
  state.interior.draft = null; // 실제 배치는 손대지 않았으므로 그대로 복구된다
  return { ok: true };
}

export function apply(state) {
  if (!state.interior.draft) return { ok: false, reason: '편집 모드가 아닙니다' };
  const chk = editCheck(state);
  if (!chk.ok) return chk;
  const v = validateLayout(state.interior.draft.furniture, state.interior.areas);
  if (!v.ok) return { ok: false, reason: v.problems[0].msg, reasons: v.problems.map(p => p.msg) };
  state.interior.furniture = state.interior.draft.furniture.map(f => ({ ...f }));
  state.interior.draft = null;
  return { ok: true };
}
