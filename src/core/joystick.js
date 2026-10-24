// [변형 이식] rei1237/killerflowerpig @1e33016 src/core/input.js
// 가져온 것: TAP_LIMITS·isTargetTap·joystickVector, 플로팅 조이스틱(반경을 벗어나면 원점이 따라옴),
//           WASD/방향키 이동, 포인터 캡처, blur 시 입력 해제.
// 바꾼 것: 전역 싱글턴 대신 생성 함수로 만들어 사냥 화면에서만 켜고 끈다. 일시정지 키·탭 선택 콜백은 뺐다.

export const TAP_LIMITS = Object.freeze({ duration: 250, distance: 8 });

export function joystickVector(dx, dy, radius = 56, dead = 6) {
  const length = Math.hypot(dx, dy);
  if (length < dead) return { x: 0, y: 0 };
  const magnitude = Math.min(1, length / radius);
  return { x: dx / length * magnitude, y: dy / length * magnitude };
}

const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export function createJoystick(surface, { radius = 56 } = {}) {
  const keys = new Set();
  const state = {
    enabled: false,
    move: { x: 0, y: 0 },
    joy: { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0, radius },
  };
  const joy = state.joy;

  const updateKeyboardMove = () => {
    if (joy.active) return;
    let x = 0, y = 0;
    for (const k of keys) { const v = MOVE_KEYS[k]; if (v) { x += v[0]; y += v[1]; } }
    const len = Math.hypot(x, y);
    state.move.x = len ? x / len : 0;
    state.move.y = len ? y / len : 0;
  };
  const resetJoy = () => {
    joy.active = false; joy.id = -1;
    state.move.x = 0; state.move.y = 0;
  };
  const reset = () => { keys.clear(); resetJoy(); };

  const onKeyDown = (e) => {
    if (!state.enabled || !MOVE_KEYS[e.code]) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')) return;
    keys.add(e.code); updateKeyboardMove(); e.preventDefault();
  };
  const onKeyUp = (e) => { keys.delete(e.code); updateKeyboardMove(); };
  const onDown = (e) => {
    if (!state.enabled || joy.active || e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
    joy.active = true; joy.id = e.pointerId;
    joy.ox = joy.x = e.clientX; joy.oy = joy.y = e.clientY;
    surface.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!joy.active || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    const len = Math.hypot(dx, dy);
    if (len > joy.radius) {
      const k = (len - joy.radius) / len;
      joy.ox += dx * k; joy.oy += dy * k;
      dx = e.clientX - joy.ox; dy = e.clientY - joy.oy;
    }
    joy.x = e.clientX; joy.y = e.clientY;
    Object.assign(state.move, joystickVector(dx, dy, joy.radius));
  };
  const onEnd = (e) => { if (e.pointerId === joy.id) { resetJoy(); updateKeyboardMove(); } };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', reset);
  surface.addEventListener('pointerdown', onDown);
  surface.addEventListener('pointermove', onMove);
  surface.addEventListener('pointerup', onEnd);
  surface.addEventListener('pointercancel', onEnd);
  surface.addEventListener('lostpointercapture', onEnd);

  return {
    state,
    enable() { state.enabled = true; },
    disable() { state.enabled = false; reset(); },
    reset,
  };
}
