import {findRecipe} from '../game/recipe.js';
import {TEMP as GAME_TEMP} from '../config/balance.temp.js';
// 연이의 아틀리에 진입점. 화면 ↔ 엔진 연결만 한다.
// 상태 변경은 모두 dispatch(명령)·tick(활성 시간)으로만 하고, 이 파일은 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import {showHelpFeedback} from './help-feedback.js';
import { unlockAudio,setAudioScene,audioAction,sound } from './audio.js';
import { GUIDES } from './tutorials.js';
import { btn } from './dom.js';
import { TEMP } from '../config/balance.temp.js';
import { createGame, personName, personDef } from '../game/state.js';
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
import { cafeBounds, computeView, cellToPx, pxToCell, drawCafe } from '../render/cafe-view.js';
import { drawHunt } from '../render/hunt-view.js';
import { $, morph, toast, floater, shake } from './dom.js';
import { topbarHtml, panelHtml, bubblesHtml, hitsHtml } from './hud.js';
import { sheetHtml, overlayHtml } from './sheets.js';
import { drawDressroom, drawInlinePortraits } from './dressroom.js';
import { outfitLine } from '../data/outfit-lines.js';
import { stressStage } from '../game/stress.js';
import { drawFarm } from './farm.js';
import { drawNumbers } from './number-motion.js';
import { installDialogFocus } from './dialog-focus.js';
import { applyAssetTheme } from './asset-html.js';
import { pixelFx } from './pixel-fx.js';
import { playNovel, novelActive } from './novel.js';
import { EVENT_STORIES } from '../story/events.js';
import { PROLOGUE } from '../story/prologue.js';
import { MONTH_STORIES, ENDINGS } from '../story/months.js';
import { careerMonthStory, castBondStory } from '../story/career.js';
import { BOND_STORIES } from '../story/bonds.js';
import { BONDS } from '../data/bonds.js';
import { SPEAKERS } from '../story/prologue.js';
import { pendingStory, calendarOf, isEnded, dateLabel } from '../game/calendar.js';
import { GAG_SHIFT_START, GAG_KITCHEN, GAG_MOKA_BUY, GAG_MOKA_DELIVERY, GAG_LUNA_EXCHANGE, GAG_GEAR_STALL, GAG_CHEONGTOKKI_REPAY, GAG_HUNT_RETURN, pickLine } from '../data/lines.js';

// ── 부팅
const DEV = new URLSearchParams(location.search).get('dev') === '1';
const SAVE_KEY = DEV ? SAVE_KEYS.dev : SAVE_KEYS.normal;
let storage = browserStorage();
const storageOk = !!storage;
if (!storage) storage = memoryStorage();

let state = null;
const ui = { playSpeed:1, camera:{zoom:1,x:0,y:0}, dev: DEV, speed: 1, sheet: null, confirm: null, selectedSlot: null, recruitEvent: null, combo: [], discovery: null, ending: null, storageOk, hasSave: hasSave(storage, SAVE_KEY) };
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
  view = computeView(cssW, cssH,{...ui.camera,...cafeBounds(state)});
  lastUi = 0;
}
new ResizeObserver(resize).observe(el.stage);
resize();
loadAssetImages().then(() => { applyAssetTheme(); render(true); });

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
  sound(r.ok ? cmd.type.startsWith('farm.')?'farm':cmd.type.startsWith('bond.')?'bond':'good' : 'bad');
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
  ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null;
  save();
  // 새 게임은 프롤로그부터. 영업 준비 화면이라 그동안 시간은 흐르지 않는다.
  playNovel(PROLOGUE, { onEnd: () => { toast('새 게임 · 토끼 자매와 첫 영업을 준비해요', 'good', 3200); render(true); } });
}

function goTitle() {
  if (state && (state.mode === 'shift' || state.mode === 'hunt') && !state.paused) dispatch(state, { type: 'pause' });
  save();
  state = null; ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null;
}

// 달 이야기·결말: id → 박자
function storyBeats(id) {
  if (id.startsWith('ending:')) return ENDINGS[id.slice(7)]?.beats || null;
  if (id.startsWith('bond:')) { const [, who, k] = id.split(':'); return BOND_STORIES[who]?.[Number(k) - 1] || castBondStory(who,Number(k)); }
  if (id.startsWith('ev:')) return EVENT_STORIES[id] || null;
  return careerMonthStory(Number(id.slice(1)), state);
}

// 영업 준비 화면에서 아직 안 본 이야기가 있으면 한 번 튼다. 본 기록은 엔진 명령(story.seen)으로만 남긴다.
function maybeStory() {
  if (!state || novelActive() || ui.confirm || ui.discovery || ui.recruitEvent || ui.ending || state.interior.draft) return;
  const id = pendingStory(state);
  if (!id) return;
  const beats = storyBeats(id);
  if (!beats) { run({ type: 'story.seen', id }, { keepQuiet: true }); return; }
  ui.sheet = null;
  playNovel(beats, { onEnd: () => { run({ type: 'story.seen', id }); if (id.startsWith('ending:')) ui.ending = id.slice(7); render(true); } });
}

function replayStory() {
  if (!state) return;
  const id = isEnded(state) ? `ending:${state.calendar.endingId}` : `m${calendarOf(state.day).monthIdx}`;
  const beats = storyBeats(id);
  if (beats) { ui.sheet = null; playNovel(beats, { onEnd: () => render(true) }); }
}

const n = v => Number(v);
// data-action → 처리. 엔진 명령은 같은 이름을 쓰고, 화면 전용 동작(시트·확인창·저장)은 여기서만 처리한다.
const ACTIONS = {
  'dress.who': d => { ui.dressWho = d.who; ui.dressPreview = null; ui.dressLine = null; },
  'dress.slot': d => { ui.dressSlot = d.slot; ui.dressPreview = null; ui.dressLine = null; },
  'dress.direction': d => { ui.dressDirection = d.dir; },
  'dress.pose': () => { ui.dressPose = ui.dressPose === 'host' ? 'idle' : 'host'; },
  'dress.preview': d => { ui.dressPreview = d.id; ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'preview'); },
  'outfit.unlock': d => { if (run({ type: 'outfit.unlock', id: d.id }).ok) ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'unlock'); },
  'hunt.hunter': d => {ui.hunterId=d.id;},
  'hunt.stage': d => {ui.huntStage=n(d.depth);},
  'armory.enhance': d => run({type:'armory.enhance',who:d.who,id:d.id}),
  'armory.buy': d => run({type:'armory.buy',id:d.id}),
  'hunt.supply': d => run({type:'hunt.supply',id:d.id}),
  'audio.change': d => audioAction(d.key,d.value),
  'guide.select': d => {ui.guideId=d.id;ui.sheet={kind:'tutorial'};},
  'hunt.start': () => { ui.sheet = { kind: 'hunt' }; },
  'hunt.depart': d => { if (run({ type: 'hunt.start', depth: n(d.depth), hunterId:ui.hunterId||'neo' }).ok) ui.sheet = null; },
  'farm.select': d => { ui.farmCrop = d.id; },
  'farm.plant': d => run({ type: 'farm.plant', cropId: d.id, index: n(d.index) }),
  'farm.water': d => run({ type: 'farm.water', index: n(d.index) }),
  'farm.tend': d => run({ type: 'farm.tend', index: n(d.index) }),
  'farm.harvest': d => run({ type: 'farm.harvest', index: n(d.index), cropInstanceId: d.id }),
  'farm.careAll': () => run({ type: 'farm.careAll' }),
  'farm.expand': () => run({ type: 'farm.expand' }),
  'farm.greenhouse': () => run({ type: 'farm.greenhouse' }),
  // 화면 전용
  'sheet.open': d => { ui.sheet = { kind: d.sheet, tab: d.tab }; },
  'town.tab': d => { if (ui.sheet) ui.sheet.tab = d.tab; },
  'sheet.close': () => { ui.sheet = null; },
  'overlay.settlement': () => {},
  'overlay.hunt': () => {},
  'confirm.yes': () => { const cf = ui.confirm; ui.confirm = null; cf?.onYes(); },
  'confirm.no': () => { ui.confirm = null; },
  'recruit.event': d => {
    const story=personDef(state,d.id)?.meetEvent;if(!story)return;ui.sheet=null;ui.recruitEvent=d.id;
    const whoByName=Object.fromEntries(Object.entries(SPEAKERS).map(([id,s])=>[s.name,id]));
    playNovel([{chapter:['새로운 인연',story.title],bg:'atelier_lit',l:'yeoni:normal',c:'neo:normal',r:`${d.id}:normal`},...story.lines.map(line=>{const i=line.indexOf(':');return {s:whoByName[line.slice(0,i)]||'nar',t:line.slice(i+1).trim()};})],{onEnd:()=>{run({type:'recruit.complete',id:d.id});ui.recruitEvent=null;render(true);}});
  },
  'cast.read': d => {
    const story = personDef(state, d.id)?.followup;
    if (!story || !state.roster[d.id] || state.mode !== 'prep' || state.day <= state.recruitment[d.id].at) { toast('함께 영업한 뒤 준비 시간에 이야기를 나눠요'); return; }
    ui.sheet = null;
    playNovel([{ chapter: ['인연', story.title], bg: 'atelier_lit', l:'yeoni:normal', r:`${d.id}:normal` }, ...story.lines.map(line => {
      const split=line.indexOf(':'); const name=split<0?'':line.slice(0,split);
      const speaker=Object.keys(SPEAKERS).find(key=>SPEAKERS[key].name===name);
      return { s:speaker||'nar', t:speaker?line.slice(split+1).trim():line };
    })], { onEnd: () => run({ type: 'cast.story', id: d.id }) });
  },
  'recruit.close': () => { ui.recruitEvent = null; },
  // 조합대 선택은 화면 상태다. 섞기만 엔진 명령(recipe.try)으로 보낸다.
  'combo.add': d => { if (ui.combo.length < 3) ui.combo.push(d.id); },
  'combo.remove': d => { ui.combo.splice(n(d.index), 1); },
  'combo.clear': () => { ui.combo = []; },
  'combo.mix': () => {
    const known=findRecipe(ui.combo);
    if(state.mode==='shift'&&!state.autoKitchen&&!state.auto&&known&&state.learned[known]){ui.combo=[];beginCraft(known);return;}
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
  'story.replay': () => { ui.ending = null; replayStory(); },
  'ending.close': () => { ui.ending = null; toast('☕ 후일담 영업 · 이제 이자도 만기도 없어요. 마음껏 가게를 키워 보세요', 'good', 3600); },

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
  'cook': d => beginCraft(d.menu),
  'order.quick': d => {const o=state.orders[d.id];if(!o)return;if(state.tray.some(it=>it?.menuId===o.menuId&&!it.reservedFor))run({type:'order.quick',orderId:d.id});else beginCraft(o.menuId,d.id);},
  'craft.cancel':()=>{ui.craft=null;ui.sheet={kind:'kitchen'};},
  'craft.step':()=>{if(!ui.craft)return;sound('cook');if(ui.craft.step<2){ui.craft.step++;return;}const c=ui.craft;const r=run(c.orderId?{type:'order.quick',orderId:c.orderId}:{type:'cook',menuId:c.menuId});if(r.ok){ui.craft=null;ui.sheet=null;toast('재료가 어우러지고 있어요. 곧 완성돼요.','good');}},
  'cook.cancelNext': d => run({ type: 'cook.cancelNext', station: d.station }),
  'shop.buy': d => run({ type: 'shop.buy', ingredientId: d.id, qty: n(d.qty) }),
  'play.speed': d => {ui.playSpeed=[1,2,3].includes(n(d.speed))?n(d.speed):1;},
  'finance.borrow': d => {const amount=n(d.amount);ui.confirm={title:`${amount.toLocaleString('ko-KR')}G를 빌릴까요?`,text:`월 이자 ${GAME_TEMP.LOAN_RATE*100}% · 다음 하순 이자 ${Math.ceil(amount*GAME_TEMP.LOAN_RATE).toLocaleString('ko-KR')}G가 추가됩니다. 미납 이자는 대출 원금에 더해져요.`,yesLabel:'조건 확인하고 빌리기',onYes:()=>run({type:'finance.borrow',amount,requestId:`loan-${Date.now()}-${++repaySeq}`})};},
  'finance.repay': d => run({type:'finance.repay',target:d.target,amount:n(d.amount),currency:d.currency}),
  'debt.repay': d => run({ type: 'debt.repay', amount: n(d.amount), requestId: `repay-${Date.now()}-${++repaySeq}` }),
  'quest.claim': d => run({ type: 'quest.claim', questId: d.id }),
  'recruit.complete': d => { if (run({ type: 'recruit.complete', id: d.id }).ok) ui.recruitEvent = null; },
  'outfit.equip': d => { if (run({ type: 'outfit.equip', who: d.who, slot: d.slot, itemId: d.item || null }).ok) { ui.dressPreview = d.item; ui.dressLine = outfitLine(d.who, d.item, stressStage(state)); } },
  'interior.nudge': d => run({ type: 'interior.nudge', uid: d.uid, dx: n(d.dx), dy: n(d.dy) }),
  'interior.rotate': d => run({ type: 'interior.rotate', uid: d.uid }),
  'interior.store': d => run({ type: 'interior.store', uid: d.uid }),
  'interior.place': d => run({ type: 'interior.place', uid: d.uid }),
  'moonstone.exchange': d => run({ type: 'moonstone.exchange', qty: d.qty === 'all' ? state.moonstone : n(d.qty) }),
  'gear.buy': d => run({ type: 'gear.buy', id: d.id }),
  'gear.equip': d => run({ type: 'gear.equip', slot: d.slot, id: d.id || null }),
  'expand.decor': d => run({ type: 'expand.decor', defId: d.def }),
  'expand.area': d => run({ type: 'expand.area', id: d.id }),
  'kitchen.toggle': () => { const r = run({ type: 'kitchen.toggle' }); if (r.ok) toast(r.autoKitchen ? '🍳 주방 자동 켬 · 루나 언니가 굽고 루나가 서빙해요' : '편한 수동 · 주문을 눌러 조리하고 완성된 음식을 눌러 서빙해요'); },
  'auto.toggle': () => { const r = run({ type: 'auto.toggle' }); if (r.ok) toast(r.auto ? '🤖 자동 운영 켬 (플레이어와 같은 명령만 사용)' : '자동 운영 끔'); },
};
for (const t of ['shift.start', 'settlement.close', 'pause', 'resume', 'fever.activate', 'interior.begin', 'interior.cancel', 'interior.apply',
  'hunt.retreat', 'hunt.finish', 'expand.table']) ACTIONS[t] = () => run({ type: t });
ACTIONS['hunt.pick'] = d => run({ type: 'hunt.pick', index: n(d.index) });
ACTIONS['bond.talk'] = d => {ui.sheet={kind:'bond-choice',id:d.id};};
ACTIONS['bond.answer'] = d => {if(run({type:'bond.talk',id:d.id,choiceId:d.choice,token:d.token}).ok)ui.sheet={kind:'companions'};};
ACTIONS['bond.gift'] = d => run({ type: 'bond.gift', id: d.id, giftId: d.gift });

document.addEventListener('click', e => {
  const cam=e.target.closest('[data-action^="camera."]');
  if(cam){if(cam.dataset.action==='camera.fit')ui.camera={zoom:1,x:0,y:0};else ui.camera.zoom=Math.max(1,Math.min(2.4,ui.camera.zoom+Number(cam.dataset.step)));resize();render(true);return;}

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
  unlockAudio(); sound('tap');
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
  (lines || []).forEach((l, i) => setTimeout(() => {
    const node = toast(`${l.who}: ${l.text}`, 'gag', 3000);
    const key = Object.values(SPEAKERS).find(s => s.name === l.who)?.portrait;
    if (node && key) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 96;
      cv.dataset.talkingPortrait = key; cv.setAttribute('aria-hidden', 'true'); node.prepend(cv);
    }
  }, i * 1100));
}
// 개그 말풍선은 화면 연출일 뿐이다. 같은 종류가 너무 자주 뜨지 않게 실제 시간으로 간격을 둔다.
const gagAt = {};
function gagOnce(kind, lines, gapMs = 15000) {
  const t = performance.now();
  if (gagAt[kind] != null && t - gagAt[kind] < gapMs) return;
  gagAt[kind] = t;
  gagLines(Array.isArray(lines) ? lines : [lines]);
}

function handleEvents(events) {
  if (!events?.length) return;
  for (const ev of events) {
    if(['served','cooked','takeawayDone'].includes(ev.type))sound('cook');
    if(['huntPickup','huntLevelUp','feverOn'].includes(ev.type))sound('moon');
    if(ev.type==='huntHurt'||ev.type==='huntHit')sound('hit');
    const p = ev.tableNo != null ? tableAt(ev.tableNo) : null;
    switch (ev.type) {
      case 'guestChatter': gagOnce('guest',{who:'손님',text:ev.line},14000);break;
      case 'paidAtCounter': sound('moon'); floater(cssW/2,cssH*.78,`계산 +${ev.amount}G`,'#b07a12');break;
      case 'cafeLevelUp': sound('bond'); toast(`카페 Lv.${ev.level}! 더 많은 손님과 새로운 취향이 찾아와요`,'good');break;
      case 'takeawayDone': toast('포장 완료 · 손님이 계산대에서 받아 갔어요','good');break;
      case 'farmAction': toast(ev.text, 'good'); break;
      case 'shiftStart': toast(`☀ ${dateLabel(state, ev.day)} 영업 시작 · 10:00`, 'good'); gagOnce('start', pickLine(GAG_SHIFT_START), 0); break;
      case 'served': floater(p?.x??cssW/2, (p?.y??cssH*.75) - 10, '주문 완료', '#b07a12'); if (Math.random() < 0.25) gagOnce('kitchen', pickLine(GAG_KITCHEN), 45000); break;
      case 'nominationRequest': toast(`💌 ${ev.tableNo}번 손님이 ${personName(state, ev.nominee)} 지명 요청 — 테이블을 눌러 확인`, 'good', 3600); break;
      case 'nominationAccepted': toast(`🫖 ${ev.tableNo}번 접대 시작 · 60초 전담`, 'good'); gagLines(ev.gag); break;
      case 'nominationConverted': toast(`${ev.tableNo}번: ${ev.why}`); break;
      case 'nominationProposed': toast(`${ev.tableNo}번에 ${personName(state, ev.personId)} 추천`); break;
      case 'helpOpen': ui.playSpeed=1; navigator.vibrate?.([70, 40, 70]); toast(`❗ ${ev.tableNo}번: ${ev.label} — 테이블을 눌러 응답`, '', 3200); break;
      case 'helpDone': showHelpFeedback(ev); floater(p.x, p.y - 20, ev.gain > 0 ? `대화 +${ev.gain}` : `대화 ${ev.gain}`, '#3f74c9'); break;
      case 'helpMissed': showHelpFeedback({...ev,quality:'missed',gain:-1}); break;
      case 'feverOn': toast(ev.tycoon ? `대부호의 앙코르! 팁 ${ev.tip}G · 데스티노바 피버` : `🔥 피버! ${ev.tables.join('·')}번 테이블 정산 팁 2배`, 'good', 3200); shake(el.panel); break;
      case 'hostingSettled':
        toast(`${ev.tableNo}번 접대 정산 · 만족도 ${ev.H.toFixed(1)} ${ev.grade}${ev.capped ? ' (핵심 조건 상한)' : ''} · 팁 ${ev.tip}G`, ev.H >= 60 ? 'good' : '', 3600);
        if (ev.tip > 0) floater(p.x, p.y - 30, `팁 +${ev.tip}G`, '#c0392b');
        break;
      case 'trayFull': toast('트레이가 가득 찼어요 — 서빙해서 칸을 비워 주세요', 'bad'); break;
      case 'cooked': pixelFx(el.stage,'effects/aura',{frames:4,size:130,duration:850});toast('한 접시 완성! 서빙대에서 손님에게 전해 주세요.','good');break;
      case 'cookCancelled': toast(`조리 취소: ${ev.reason}`, 'bad'); break;
      case 'leave': if (ev.reason === '음식을 오래 기다려 떠남' || ev.reason === '주문할 수 있는 메뉴가 없음') toast(`😣 ${ev.tableNo}번 손님: ${ev.reason}`, 'bad'); break;
      case 'learned': toast(`📖 새 레시피: ${ev.name}`, 'good'); break;
      case 'discovered': ui.discovery = ev.menuId; break;
      case 'comboMiss': toast(`🤔 ${ev.hint}`, '', 2600); break;
      case 'recruited': toast(`👥 ${ev.name} 영입 완료 · 다음 영업부터 접대 가능`, 'good', 3600); break;
      case 'reward': toast('🎁 보상을 받았습니다', 'good'); break;
      case 'repaid': toast(`💳 ${ev.amount}G 상환 · 남은 빚 ${ev.debt}G`, 'good'); gagOnce('repay', pickLine(GAG_CHEONGTOKKI_REPAY), 0); break;
      case 'bought': if (ev.delivery) { toast(`🛵 모카 긴급 배달 · 배달비 ${ev.fee}G 포함 ${ev.cost}G`); gagOnce('delivery', pickLine(GAG_MOKA_DELIVERY), 20000); } else gagOnce('moka', pickLine(GAG_MOKA_BUY), 12000); break;
      case 'exchanged': toast(`⚖ 월정석 ${ev.qty}개 → ${ev.gold}G`, 'good'); gagOnce('luna', pickLine(GAG_LUNA_EXCHANGE), 8000); break;
      case 'gearBought': toast(`🗡 ${ev.name} 구입 · 모카의 무기 공방`, 'good'); gagOnce('stall', pickLine(GAG_GEAR_STALL), 8000); break;
      case 'expanded': toast(`🪑 ${ev.tableNo}번 테이블을 들였어요 · 다음 영업부터 손님 자리가 늘어요`, 'good', 3600); break;
      case 'areaOpened': resize(); toast(`🔓 ${ev.name} 증축 완료 · 인테리어에서 테이블과 장식을 놓아 보세요`, 'good', 3600); break;
      case 'decorBought': toast(`📦 ${ev.name} 보관함에 도착 · 인테리어에서 놓아 주세요`, 'good'); break;
      case 'huntFinished': pixelFx(el.stage,'transform',{frames:8}); if ((ev.bag?.moonstone || 0) > 0) gagOnce('hunt', pickLine(GAG_HUNT_RETURN), 0); break;
      case 'huntStart': pixelFx(el.stage,'transform',{frames:8}); toast(state.hunt.hunterId==='seohanbi'?'검은 호랑이 서한비가 출발했어요':'영냥이가 출발했어요 · 오래 버틸수록 추가 보상', 'good'); break;
      case 'huntPickup': floater(cssW / 2, cssH * 0.4, `+${ev.name}`, '#7d86e8'); break;
      case 'huntHurt': shake(el.stage); break;
      case 'huntEvolve': toast(`🌟 진화! ${ev.name}`, 'good', 3200); break;
      case 'huntChest': toast(`🎁 상자: ${ev.label}`, 'good'); break;
      case 'huntPower': toast(ev.label, 'good', 1800); break;
      case 'payrollPaid': toast(`동료 급여 ${ev.paid.toLocaleString('ko-KR')}G 지급${ev.arrears?` · 미지급 ${ev.arrears.toLocaleString('ko-KR')}G`:''}`);break;
      case 'interestCharged': toast(`💸 ${ev.month}월 이자 ${ev.due.toLocaleString('ko-KR')}G${ev.added ? ` · 골드가 모자라 ${ev.added.toLocaleString('ko-KR')}G는 빚에 붙었어요` : ' 납부'}`, ev.added ? 'bad' : '', 3600); break;
      case 'bondTalk': toast(`${SPEAKERS[ev.speaker]?.name || ''}: ${ev.line} (친밀도 +${ev.gain})`, 'gag', 3600); break;
      case 'bondGift': toast(`🎁 ${BONDS[ev.id].name} 친밀도 +${ev.gain}${ev.liked ? ' · 좋아하는 선물이에요!' : ''}`, 'good'); break;
      case 'bondUp': toast(`💗 ${BONDS[ev.id].name} ♥${ev.tier} · ${ev.label}`, 'good', 4000); break;
      case 'gameEnded': toast('📜 마지막 결산 완료 · 결말이 열립니다', 'good', 3200); break;
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
  document.getElementById('camera-controls').hidden=!state||state.mode==='hunt';
  setAudioScene(novelActive()?'story':state?.mode==='hunt'?'hunt':state?.fever?.activeUntil!=null?'fever':ui.sheet?.kind|| (state?'cafe':'title'));
  const guide=({kitchen:'cook',farm:'farm',hunt:'hunt',armory:'armory',outfits:'outfits',companions:'bonds',table:'serve',town:'interior'})[ui.sheet?.kind];
  const sh = sheetHtml(state, ui)+(guide?`<div class="context-guide">${btn({action:'guide.select',args:{id:guide},label:'그림으로 보는 사용법 · '+GUIDES[guide].title})}</div>`:'');
  el.sheetWrap.hidden = !sh;
  morph(el.sheet, sh);
  const ov = overlayHtml(state, ui);
  el.overlay.hidden = !ov;
  morph(el.overlay, ov);
  if (state?.mode === 'prep') maybeStory();
}

const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
function draw(t) {
  drawNumbers(t);
  if (state && ui.sheet?.kind === 'farm') drawFarm(state, t);
  if (state && ui.sheet?.kind === 'outfits') drawDressroom(state, ui, t);
  drawInlinePortraits(t);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true; // 고해상도 일러스트 축소
  if (state?.mode === 'hunt' && state.hunt) {
    drawHunt(ctx, state, getHuntWorld(state), cssW, cssH, { t, joy: joystick.state.joy, rect: el.canvas.getBoundingClientRect() });
    return;
  }
  if (!state) { ctx.fillStyle = '#f3e6d6'; ctx.fillRect(0, 0, cssW, cssH); return; }
  const draft = state.interior.draft;
  let problemUids;
  if (draft) problemUids = new Set(interiorPreview(state).problems.map(p => p.uid).filter(Boolean));
  drawCafe(ctx, state, view, { selectedUid: draft?.selected ?? null, problemUids, t, reducedMotion:motionPreference.matches });
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
        const dt = raw * (DEV && ui.speed!==1 ? ui.speed : state.mode==='shift'?ui.playSpeed:1);
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
installDialogFocus();

// 개발 모드에서만 콘솔 확인용 핸들 노출(일반 플레이에는 없음)
if (DEV) window.__yeoni = { get state() { return state; }, ui };

document.addEventListener('change',e=>{if(e.target.id==='hunt-stage'){ui.huntStage=Number(e.target.value);render(true);}});

let cameraDrag=null;
el.stage.addEventListener('pointerdown',e=>{if(state?.mode==='hunt'||state?.interior.draft||e.target.closest('button')||ui.camera.zoom<=1)return;cameraDrag={x:e.clientX,y:e.clientY,px:ui.camera.x,py:ui.camera.y};el.stage.setPointerCapture(e.pointerId);});
el.stage.addEventListener('pointermove',e=>{if(!cameraDrag)return;ui.camera.x=cameraDrag.px+e.clientX-cameraDrag.x;ui.camera.y=cameraDrag.py+e.clientY-cameraDrag.y;view=computeView(cssW,cssH,{...ui.camera,...cafeBounds(state)});render(true);});
el.stage.addEventListener('pointerup',()=>cameraDrag=null);el.stage.addEventListener('pointercancel',()=>cameraDrag=null);

function beginCraft(menuId,orderId=null){
 if(state.autoKitchen||state.auto){run(orderId?{type:'order.quick',orderId}:{type:'cook',menuId});return;}
 const order=state.orders[orderId];if(order&&Object.values(state.stations).some(st=>[st.current,st.next].some(j=>j?.orderId===orderId))){toast('이 주문은 조리 중이에요.');return;}
 ui.playSpeed=1;ui.craft={menuId,orderId,step:0};ui.sheet={kind:'craft'};
}
