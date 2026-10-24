// 연이의 아틀리에 진입점. 화면 ↔ 엔진 연결만 한다.
// 상태 변경은 모두 dispatch(명령)·tick(활성 시간)으로만 하고, 이 파일은 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import { TEMP } from '../config/balance.temp.js';
import { createGame, personName } from '../game/state.js';
import { dispatch, tick } from '../game/engine.js';
import { findServeTarget } from '../game/cafe.js';
import { getHuntWorld } from '../game/hunt.js';
import { preview as interiorPreview } from '../game/interior.js';
import { furnitureCells } from '../game/space.js';
import { recordWallClock } from '../game/offline.js';
import { SAVE_KEYS, memoryStorage, browserStorage, saveGame, loadGame, hasSave, resetSave } from '../core/save.js';
import { createFrameLoop } from '../core/frame-loop.js';
import { createJoystick } from '../core/joystick.js';
import { loadAssetImages } from '../render/assets.js';
import { computeView, cellToPx, pxToCell, drawCafe } from '../render/cafe-view.js';
import { drawHunt } from '../render/hunt-view.js';
import { $, morph, toast, floater, shake } from './dom.js';
import { topbarHtml, panelHtml, bubblesHtml, hitsHtml } from './hud.js';
import { sheetHtml, overlayHtml } from './sheets.js';
import { playNovel } from './novel.js';
import { PROLOGUE } from '../story/prologue.js';

// ── 부팅
const DEV = new URLSearchParams(location.search).get('dev') === '1';
const SAVE_KEY = DEV ? SAVE_KEYS.dev : SAVE_KEYS.normal;
let storage = browserStorage();
const storageOk = !!storage;
if (!storage) storage = memoryStorage();

let state = null;
const ui = { dev: DEV, speed: 1, sheet: null, confirm: null, selectedSlot: null, recruitEvent: null, combo: [], discovery: null, storageOk, hasSave: hasSave(storage, SAVE_KEY) };
if (DEV) document.documentElement.classList.add('dev');

const el = { topbar: $('#topbar'), panel: $('#panel'), stage: $('#stage'), canvas: $('#view'), hits: $('#hits'), bubbles: $('#bubbles'),
  sheetWrap: $('#sheet-wrap'), sheet: $('#sheet'), overlay: $('#overlay') };
const ctx = el.canvas.getContext('2d');
let view = null, cssW = 0, cssH = 0, dpr = 1;
let lastUi = 0;
const tablePx = {}; // 마감 뒤에도 떠오르는 숫자 위치를 알 수 있게 테이블 화면 좌표를 기억

function resize() {
  const r = el.stage.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cssW = Math.max(1, Math.round(r.width)); cssH = Math.max(1, Math.round(r.height));
  el.canvas.width = Math.round(cssW * dpr); el.canvas.height = Math.round(cssH * dpr);
  el.canvas.style.width = `${cssW}px`; el.canvas.style.height = `${cssH}px`;
  view = computeView(cssW, cssH);
  lastUi = 0;
}
new ResizeObserver(resize).observe(el.stage);
resize();
loadAssetImages();

const joystick = createJoystick(el.canvas, { radius: 56 });

// ── 저장
function save(quiet = true) {
  if (!state) return;
  const r = saveGame(storage, SAVE_KEY, state);
  ui.hasSave = hasSave(storage, SAVE_KEY);
  if (!quiet) toast(r.ok ? (storageOk ? '💾 저장했습니다' : '💾 임시 저장(새로고침하면 사라짐)') : r.reason, r.ok ? 'good' : 'bad');
}

// ── 명령
let repaySeq = 0;
function run(cmd, { keepQuiet = false } = {}) {
  if (!state) return { ok: false };
  const r = dispatch(state, cmd);
  handleEvents(r.events);
  if (!r.ok) {
    if (!keepQuiet) toast((r.reasons?.length ? r.reasons : [r.reason || '할 수 없습니다']).join(' / '), 'bad');
  } else {
    recordWallClock(state, Date.now());
    save();
  }
  render(true);
  return r;
}

function startNew() {
  state = createGame({ dev: DEV, seed: (Date.now() % 2147483647) | 0 });
  recordWallClock(state, Date.now());
  ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null;
  save();
  // 새 게임은 프롤로그부터. 영업 준비 화면이라 그동안 시간은 흐르지 않는다.
  playNovel(PROLOGUE, { onEnd: () => { toast('새 게임 · 접대 담당은 네오 한 명으로 시작합니다', 'good', 3200); render(true); } });
}

function goTitle() {
  if (state && (state.mode === 'shift' || state.mode === 'hunt') && !state.paused) dispatch(state, { type: 'pause' });
  save();
  state = null; ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null;
}

const n = v => Number(v);
// data-action → 처리. 엔진 명령은 같은 이름을 쓰고, 화면 전용 동작(시트·확인창·저장)은 여기서만 처리한다.
const ACTIONS = {
  // 화면 전용
  'sheet.open': d => { ui.sheet = { kind: d.sheet }; },
  'sheet.close': () => { ui.sheet = null; },
  'overlay.settlement': () => {},
  'overlay.hunt': () => {},
  'confirm.yes': () => { const cf = ui.confirm; ui.confirm = null; cf?.onYes(); },
  'confirm.no': () => { ui.confirm = null; },
  'recruit.event': d => { ui.recruitEvent = d.id; ui.sheet = null; },
  'recruit.close': () => { ui.recruitEvent = null; },
  // 조합대 선택은 화면 상태다. 섞기만 엔진 명령(recipe.try)으로 보낸다.
  'combo.add': d => { if (ui.combo.length < 3) ui.combo.push(d.id); },
  'combo.remove': d => { ui.combo.splice(n(d.index), 1); },
  'combo.clear': () => { ui.combo = []; },
  'combo.mix': () => {
    const r = run({ type: 'recipe.try', ingredients: ui.combo.slice() });
    if (!r.ok) return;
    if (r.match === false) { shake(document.getElementById('combo-bench')); return; }
    ui.combo = [];
    if (r.known) toast('이미 아는 레시피예요 · 영업 중에 섞으면 바로 만들어요');
  },
  'discovery.close': () => { ui.discovery = null; },

  'game.continue': () => {
    const r = loadGame(storage, SAVE_KEY);
    if (!r.ok) { toast(r.reason, 'bad'); return; }
    state = r.state;
    ui.sheet = null; ui.selectedSlot = null;
    if (state.paused) toast('저장한 지점에서 일시정지 상태로 이어집니다', 'good');
  },
  'game.new': () => {
    if (!ui.hasSave) { startNew(); return; }
    ui.confirm = { title: '새 게임을 시작할까요?', text: '지금 저장된 진행은 새 게임으로 덮어씌워집니다.', yesLabel: '새 게임 시작', danger: true, onYes: startNew };
  },
  'game.reset': () => {
    ui.confirm = { title: '저장을 초기화할까요?', text: '이 기기에 저장된 연이의 아틀리에 진행이 지워집니다. 되돌릴 수 없습니다.', yesLabel: '초기화', danger: true,
      onYes: () => { const r = resetSave(storage, SAVE_KEY, { confirmed: true }); ui.hasSave = hasSave(storage, SAVE_KEY); toast(r.ok ? '저장을 지웠습니다' : r.reason, r.ok ? 'good' : 'bad'); } };
  },
  'game.save': () => save(false),
  'game.title': () => goTitle(),
  'game.prologue': () => playNovel(PROLOGUE, { onEnd: () => render(true) }),

  'dev.speed': d => { if (DEV) { ui.speed = n(d.speed); toast(`DEV 배속 ×${ui.speed} (저장 안 됨)`); } },
  'dev.skip': () => { if (DEV && state) { handleEvents(tick(state, 60000, { input: { x: 0, y: 0 } })); save(); } },

  // 테이블·트레이
  'table.tap': d => {
    const no = n(d.no);
    const it = ui.selectedSlot != null ? state.tray[ui.selectedSlot] : null;
    if (it && !it.reservedFor) {
      const r = run({ type: 'serve', itemId: it.id, tableNo: no });
      if (r.ok) ui.selectedSlot = null;
      return;
    }
    ui.sheet = { kind: 'table', no };
  },
  'tray.tap': d => {
    const i = n(d.i);
    const it = state.tray[i];
    if (!it) { ui.selectedSlot = null; return; }
    if (it.reservedFor) { toast('이미 서빙하러 가는 중입니다'); return; }
    if (ui.selectedSlot !== i) { ui.selectedSlot = i; return; }
    const target = findServeTarget(state, it);
    if (target == null) { toast('이 메뉴를 기다리는 테이블이 없습니다', 'bad'); return; }
    if (run({ type: 'serve', itemId: it.id, tableNo: target }).ok) ui.selectedSlot = null;
  },

  // 엔진 명령(인자 변환)
  'serve': d => run({ type: 'serve', itemId: d.item, tableNo: n(d.no) }),
  'clean': d => run({ type: 'clean', tableNo: n(d.no) }),
  'nomination.accept': d => run({ type: 'nomination.accept', tableNo: n(d.no) }),
  'nomination.decline': d => run({ type: 'nomination.decline', tableNo: n(d.no) }),
  'nomination.propose': d => run({ type: 'nomination.propose', tableNo: n(d.no), personId: d.person }),
  'help.respond': d => run({ type: 'help.respond', visitId: d.visit, index: n(d.index), choice: d.choice }),
  'cook': d => run({ type: 'cook', menuId: d.menu }),
  'cook.cancelNext': d => run({ type: 'cook.cancelNext', station: d.station }),
  'shop.buy': d => run({ type: 'shop.buy', ingredientId: d.id, qty: n(d.qty) }),
  'debt.repay': d => run({ type: 'debt.repay', amount: n(d.amount), requestId: `repay-${Date.now()}-${++repaySeq}` }),
  'quest.claim': d => run({ type: 'quest.claim', questId: d.id }),
  'recruit.complete': d => { if (run({ type: 'recruit.complete', id: d.id }).ok) ui.recruitEvent = null; },
  'outfit.equip': d => run({ type: 'outfit.equip', who: d.who, slot: d.slot, itemId: d.item || null }),
  'interior.nudge': d => run({ type: 'interior.nudge', uid: d.uid, dx: n(d.dx), dy: n(d.dy) }),
  'interior.rotate': d => run({ type: 'interior.rotate', uid: d.uid }),
  'interior.store': d => run({ type: 'interior.store', uid: d.uid }),
  'interior.place': d => run({ type: 'interior.place', uid: d.uid }),
  'auto.toggle': () => { const r = run({ type: 'auto.toggle' }); if (r.ok) toast(r.auto ? '🤖 자동 운영 켬 (플레이어와 같은 명령만 사용)' : '자동 운영 끔'); },
};
for (const t of ['shift.start', 'settlement.close', 'pause', 'resume', 'fever.activate', 'interior.begin', 'interior.cancel', 'interior.apply',
  'hunt.start', 'hunt.retreat', 'hunt.finish']) ACTIONS[t] = () => run({ type: t });
ACTIONS['hunt.pick'] = d => run({ type: 'hunt.pick', index: n(d.index) });

document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const action = b.dataset.action;
  if (b.getAttribute('aria-disabled') === 'true') {
    toast(b.getAttribute('title') || '지금은 할 수 없습니다', 'bad');
    return;
  }
  const fn = ACTIONS[action];
  if (!fn) { console.warn('unknown action', action); return; }
  if (!state && !action.startsWith('game.') && !action.startsWith('confirm.')) return;
  fn(b.dataset);
  render(true);
});

// 인테리어 편집: 캔버스를 눌러 가구 고르기 / 고른 가구를 그 칸으로 옮기기
el.canvas.addEventListener('click', e => {
  const draft = state?.interior?.draft;
  if (!draft || !view) return;
  const r = el.canvas.getBoundingClientRect();
  const cell = pxToCell(view, e.clientX - r.left, e.clientY - r.top);
  const placed = draft.furniture.filter(f => !f.stored);
  const hits = placed.filter(f => furnitureCells(f).some(c => c.x === cell.x && c.y === cell.y));
  const pickF = hits.find(f => !furnitureCells(f).every(c => c.kind === 'floor')) || hits[0];
  if (pickF && pickF.uid !== draft.selected) run({ type: 'interior.select', uid: pickF.uid });
  else if (!pickF && draft.selected) run({ type: 'interior.move', uid: draft.selected, x: cell.x, y: cell.y });
});

// ── 이벤트 → 피드백
const tableAt = no => tablePx[no] || { x: cssW / 2, y: cssH / 3 };
function gagLines(lines) {
  (lines || []).forEach((l, i) => setTimeout(() => toast(`${l.who}: ${l.text}`, 'gag', 3000), i * 1100));
}

function handleEvents(events) {
  if (!events?.length) return;
  for (const ev of events) {
    const p = ev.tableNo != null ? tableAt(ev.tableNo) : null;
    switch (ev.type) {
      case 'shiftStart': toast(`☀ Day ${ev.day} 영업 시작 · 30:00`, 'good'); break;
      case 'served': floater(p.x, p.y - 10, `+${ev.price}G`, '#b07a12'); break;
      case 'nominationRequest': toast(`💌 ${ev.tableNo}번 손님이 ${personName(state, ev.nominee)} 지명 요청 — 테이블을 눌러 확인`, 'good', 3600); break;
      case 'nominationAccepted': toast(`🫖 ${ev.tableNo}번 접대 시작 · 300초 전담`, 'good'); gagLines(ev.gag); break;
      case 'nominationConverted': toast(`${ev.tableNo}번: ${ev.why}`); break;
      case 'nominationProposed': toast(`${ev.tableNo}번에 ${personName(state, ev.personId)} 추천`); break;
      case 'helpOpen': toast(`❗ ${ev.tableNo}번: ${ev.label} — 테이블을 눌러 응답`, '', 3200); break;
      case 'helpDone': floater(p.x, p.y - 20, ev.gain > 0 ? `대화 +${ev.gain}` : '대화 ±0', '#3f74c9'); gagLines(ev.gag); break;
      case 'helpMissed': toast(`${ev.tableNo}번 도움 요청을 놓쳤어요 (대화 −1)`, 'bad'); break;
      case 'feverOn': toast(`🔥 피버! ${ev.tables.join('·')}번 테이블 정산 팁 2배`, 'good', 3200); shake(el.panel); break;
      case 'hostingSettled':
        toast(`${ev.tableNo}번 접대 정산 · 만족도 ${ev.H.toFixed(1)} ${ev.grade}${ev.capped ? ' (핵심 조건 상한)' : ''} · 팁 ${ev.tip}G`, ev.H >= 60 ? 'good' : '', 3600);
        if (ev.tip > 0) floater(p.x, p.y - 30, `팁 +${ev.tip}G`, '#c0392b');
        break;
      case 'trayFull': toast('트레이가 가득 찼어요 — 서빙해서 칸을 비워 주세요', 'bad'); break;
      case 'cookCancelled': toast(`조리 취소: ${ev.reason}`, 'bad'); break;
      case 'leave': if (ev.reason === '음식을 오래 기다려 떠남' || ev.reason === '주문할 수 있는 메뉴가 없음') toast(`😣 ${ev.tableNo}번 손님: ${ev.reason}`, 'bad'); break;
      case 'learned': toast(`📖 새 레시피: ${ev.name}`, 'good'); break;
      case 'discovered': ui.discovery = ev.menuId; break;
      case 'comboMiss': toast(`🤔 ${ev.hint}`, '', 2600); break;
      case 'recruited': toast(`👥 ${ev.name} 영입 완료 · 다음 영업부터 접대 가능`, 'good', 3600); break;
      case 'reward': toast('🎁 보상을 받았습니다', 'good'); break;
      case 'repaid': toast(`💳 ${ev.amount}G 상환 · 남은 빚 ${ev.debt}G`, 'good'); break;
      case 'huntStart': toast('🐾 네오가 영냥이 모습으로 탐색을 떠났어요 (3:00)', 'good'); break;
      case 'huntPickup': floater(cssW / 2, cssH * 0.4, `+${ev.name}`, '#7d86e8'); break;
      case 'huntHurt': shake(el.stage); break;
      case 'huntEvolve': toast(`🌟 진화! ${ev.name}`, 'good', 3200); break;
      case 'huntChest': toast(`🎁 상자: ${ev.label}`, 'good'); break;
      case 'huntPower': toast(ev.label, 'good', 1800); break;
      case 'shiftClosed': ui.sheet = null; ui.selectedSlot = null; save(); break;
      default: break;
    }
  }
}

// ── 그리기

function render(force = false) {
  const now = performance.now();
  if (!force && now - lastUi < 200) return;
  lastUi = now;
  if (state && ui.selectedSlot != null && !state.tray[ui.selectedSlot]) ui.selectedSlot = null;
  if (ui.sheet?.kind === 'table' && state?.mode !== 'shift') ui.sheet = null;
  morph(el.topbar, topbarHtml(state, ui));
  morph(el.panel, panelHtml(state, ui));
  morph(el.bubbles, state?.mode === 'shift' && view ? bubblesHtml(state, view) : '');
  morph(el.hits, hitsHtml(state, view, ui));
  const sh = sheetHtml(state, ui);
  el.sheetWrap.hidden = !sh;
  morph(el.sheet, sh);
  const ov = overlayHtml(state, ui);
  el.overlay.hidden = !ov;
  morph(el.overlay, ov);
}

function draw(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false; // 도트 그림 번짐 방지
  if (state?.mode === 'hunt' && state.hunt) {
    drawHunt(ctx, state, getHuntWorld(state), cssW, cssH, { t, joy: joystick.state.joy, rect: el.canvas.getBoundingClientRect() });
    return;
  }
  if (!state) { ctx.fillStyle = '#f3e6d6'; ctx.fillRect(0, 0, cssW, cssH); return; }
  const draft = state.interior.draft;
  let problemUids;
  if (draft) problemUids = new Set(interiorPreview(state).problems.map(p => p.uid).filter(Boolean));
  drawCafe(ctx, state, view, { selectedUid: draft?.selected ?? null, problemUids, t });
  for (const tb of state.tables) tablePx[tb.no] = cellToPx(view, tb.table.x + 0.5, tb.table.y);
}

// ── 프레임 루프(숨김/페이지 이탈 시 일시정지·저장)
let last = null, autosaveAcc = 0;
const loop = createFrameLoop({
  reset: () => { last = null; },
  onSuspend: () => {
    if (state && (state.mode === 'shift' || state.mode === 'hunt') && !state.paused) dispatch(state, { type: 'pause' });
    save();
  },
  onResume: () => render(true),
  frame: now => {
    const raw = last == null ? 0 : Math.min(now - last, TEMP.FRAME_DT_CAP_MS);
    last = now;
    if (state) {
      const huntOn = state.mode === 'hunt' && state.hunt?.status === 'running' && !state.paused && !state.hunt.picks?.length;
      if (huntOn && !joystick.state.enabled) joystick.enable();
      if (!huntOn && joystick.state.enabled) joystick.disable();
      const running = !state.paused && (state.mode === 'shift' || state.mode === 'hunt');
      if (running && raw > 0) {
        const dt = raw * (DEV ? ui.speed : 1);
        handleEvents(tick(state, dt, { input: joystick.state.move }));
        autosaveAcc += raw;
        if (autosaveAcc >= TEMP.AUTOSAVE_MS) { autosaveAcc = 0; recordWallClock(state, Date.now()); save(); }
      }
    }
    draw(now);
    render();
  },
});
loop.start();
render(true);

// 개발 모드에서만 콘솔 확인용 핸들 노출(일반 플레이에는 없음)
if (DEV) window.__yeoni = { get state() { return state; }, ui };
