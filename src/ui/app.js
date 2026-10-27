import {MENUS} from '../data/menus.js';
import {BONDS as GIFT_BONDS} from '../data/bonds.js';
import {foodPreference} from '../data/food-preferences.js';
import {SUPPLY_ORDER} from '../data/hunt-supplies.js';
import {completeStory} from './story-completion.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {branchStory} from '../story/branches.js';
import { worldScreenHtml, WORLD_PLACES } from './world-screen.js';
import { tableBadgesHtml, tablePopHtml } from './table-ui.js';
import { bondQuestion } from '../data/bond-dialogues.js';
import { talkCheck } from '../game/bonds.js';
import {CAFE_LINES,selectLine} from '../data/cafe-dialogue.js';
import {newCraft,mixCraft,craftHeat,craftQuality,craftShortage,deliverable} from './crafting.js';
import {findRecipe} from '../game/recipe.js';
import {TEMP as GAME_TEMP} from '../config/balance.temp.js';
// 연이의 아틀리에 진입점. 화면 ↔ 엔진 연결만 한다.
// 상태 변경은 모두 dispatch(명령)·tick(활성 시간)으로만 하고, 이 파일은 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import {showHelpFeedback} from './help-feedback.js';
import { unlockAudio,setAudioScene,audioAction,sound,audioStatus } from './audio.js';
import { GUIDES } from './tutorials.js';
import { btn } from './dom.js';
import { TEMP } from '../config/balance.temp.js';
import { createGame, personName, personDef } from '../game/state.js';
import { dispatch, tick, helperAvailable, HELPERS } from '../game/engine.js';
import { findServeTarget } from '../game/cafe.js';
import { getHuntWorld, paused as huntPaused } from '../game/hunt.js';
import { preview as interiorPreview } from '../game/interior.js';
import { furnitureCells } from '../game/space.js';
import { recordWallClock } from '../game/offline.js';
import { SAVE_KEYS, memoryStorage, browserStorage, saveGame, loadGame, hasSave, resetSave } from '../core/save.js';
import { createFrameLoop } from '../core/frame-loop.js';
import { createJoystick } from '../core/joystick.js';
import { loadAssetImages, ASSETS } from '../render/assets.js';
import { talkingKey } from '../render/sprite-renderer.js';
import { cafeBounds, computeView, cellToPx, pxToCell, drawCafe } from '../render/cafe-view.js';
import { drawHunt } from '../render/hunt-view.js';
import { $, morph, toast, floater, shake } from './dom.js';
import { topbarHtml, panelHtml, bubblesHtml, hitsHtml } from './hud.js';
import { sheetHtml, overlayHtml, tiredLine } from './sheets.js';
import { drawDressroom, drawInlinePortraits } from './dressroom.js';
import { outfitLine } from '../data/outfit-lines.js';
import { stressStage } from '../game/stress.js';
import { automationOn, ABILITIES } from '../game/permissions.js';
import { drawFarm } from './farm.js';
import { drawNumbers } from './number-motion.js';
import { installDialogFocus } from './dialog-focus.js';
import { applyAssetTheme } from './asset-html.js';
import { pixelFx } from './pixel-fx.js';
import { playNovel, novelActive } from './novel.js';
import { EVENT_STORIES } from '../story/events.js';
import { HANBI_STORIES } from '../story/hanbi.js';
import { VISIT_STORIES } from '../story/visits.js';
import { PROLOGUE } from '../story/prologue.js';
import { MONTH_STORIES, ENDINGS } from '../story/months.js';
import { careerMonthStory, castBondStory } from '../story/career.js';
import { BOND_STORIES } from '../story/bonds.js';
import { BONDS } from '../data/bonds.js';
import { SPEAKERS } from '../story/prologue.js';
import { pendingStory, calendarOf, isEnded, dateLabel } from '../game/calendar.js';
import { placeLock } from '../game/unlocks.js';
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
  cssW = Math.max(1, el.stage.clientWidth); cssH = Math.max(1, el.stage.clientHeight);
  el.canvas.width = Math.round(cssW * dpr); el.canvas.height = Math.round(cssH * dpr);
  el.canvas.style.width = `${cssW}px`; el.canvas.style.height = `${cssH}px`;
  view = computeView(cssW, cssH,{...ui.camera,...cafeBounds(state)});
  lastUi = 0;
}
new ResizeObserver(resize).observe(el.stage);
resize();
loadAssetImages(undefined,{onProgress:(done,total)=>{const p=document.getElementById('boot-progress');if(p){p.max=total||1;p.value=done;}const copy=document.getElementById('boot-copy');if(copy)copy.textContent=`찻잔과 친구들을 준비하고 있어요. ${done} / ${total}`;}}).then(()=>{document.getElementById('boot-screen')?.remove();applyAssetTheme();render(true);});

const joystick = createJoystick(el.canvas, { radius: 56 });

// ── 저장
function save(quiet = true) {
  if (!state) return;
  const r = saveGame(storage, SAVE_KEY, state);
  ui.hasSave = hasSave(storage, SAVE_KEY);
  if (!quiet) toast(r.ok ? (storageOk ? '💾 저장했습니다' : '💾 임시 저장(새로고침하면 사라짐)') : r.reason, r.ok ? 'good' : 'bad');
}

// 독립 화면의 주소 이력은 UI만 바꾸며 게임 저장과 분리한다.
function navigateScreen(screen, replace=false) {
  ui.screen=screen; ui.sheet=null; ui.tablePop=null;
  history[replace?'replaceState':'pushState']({yeoniScreen:screen},'',screen?'#'+screen:location.pathname+location.search);
}
window.addEventListener('popstate',e=>{if(state?.interior.draft)run({type:'interior.cancel'});ui.screen=state?(e.state?.yeoniScreen||null):null;ui.sheet=null;ui.tablePop=null;render(true);});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||novelActive())return;if(state?.interior.draft&&!ui.sheet){run({type:'interior.cancel'});render(true);return;}if(ui.tablePop){ui.tablePop=null;render(true);}else if(ui.screen&&!ui.sheet){navigateScreen(null,true);render(true);}});
// ── 명령
let repaySeq = 0;
function run(cmd, { keepQuiet = false } = {}) {
  if (!state) return { ok: false };
  const helperId=ui.delegate && helperAvailable(state,ui.delegate,cmd.type)?ui.delegate:null;
  const r = dispatch(state, helperId?{...cmd,helperId}:cmd);
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
  if(state || novelActive())return;
  state = createGame({ dev: DEV, seed: (Date.now() % 2147483647) | 0 });
  recordWallClock(state, Date.now());
  ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null;
  save();
  // 새 게임은 프롤로그부터. 영업 준비 화면이라 그동안 시간은 흐르지 않는다.
  const started=state;
  const finishPrologue=()=>{if(state!==started)return;run({type:'story.seen',id:'prologue'},{keepQuiet:true});toast('새 게임 · 토끼 자매와 첫 영업을 준비해요','good',3200);};
  playNovel(PROLOGUE, { onEnd:finishPrologue, onCancel:finishPrologue });
}

function goTitle() {
  if (state && (state.mode === 'shift' || state.mode === 'hunt') && !state.paused) dispatch(state, { type: 'pause' });
  save();
  ui.screen=null; state = null; ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null;
}

// 달 이야기·결말: id → 박자
function storyBeats(id) {
  if (id.startsWith('ending:')) return ENDINGS[id.slice(7)]?.beats || null;
  if (id.startsWith('bond:')) { const [, who, k] = id.split(':'); return BOND_STORIES[who]?.[Number(k) - 1] || castBondStory(who,Number(k)); }
  if (id.startsWith('branch:')) return branchStory(Number(id.slice(7)));
  if (id.startsWith('ev:')) return EVENT_STORIES[id] || null;
  if (id.startsWith('hanbi:')) return HANBI_STORIES[id.slice(6)] || null;
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
  const started=state;let ended=false;
  const done = (skip=false) => {if(ended||state!==started)return;ended=true;const result=completeStory(id,cmd=>run(cmd),{skip});if(result.ok&&!result.duplicate&&result.destination==='hunt'){navigateScreen(result.entry?.ok?null:'world');ui.sheet=result.entry?.ok?null:{kind:'hunt'};ui.huntMenu='title';} if (result.ok&&id.startsWith('ending:')) ui.ending = id.slice(7); render(true); };
  // 이야기 속 선택지는 분위기용: 상태를 바꾸지 않고 고른 답의 박자만 잇는다. 건너뛰어도 본 것으로 친다.
  const onChoose = (cid, beat) => ({ ok: true, beats: beat?.choices?.find(c => c.id === cid)?.beats || [] });
  playNovel(beats, { onEnd:()=>done(false), onCancel:()=>done(true), onChoose });
}

// 마을 가게를 처음 찾으면 그 가게 이야기를 한 번 튼다. 끝내든 건너뛰든 town.visit 으로만 기록한다.
function maybeVisit(place) {
  const beats = VISIT_STORIES[place];
  if (!beats || !state || state.mode !== 'prep' || state.ledger.story[`visit:${place}`] || placeLock(state, place) || novelActive()) return;
  const done = () => { run({ type: 'town.visit', place }, { keepQuiet: true }); render(true); };
  playNovel(beats, { onEnd: done, onCancel: done });
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
  'world.close': () => navigateScreen(null),
  'world.back': () => navigateScreen(ui.questReturn==='world'?'world':null),
  'world.select': d => {ui.worldPlace=d.id;},
  'world.quests': () => {ui.questReturn='world';ui.questDetail=false;navigateScreen('quests');},
  'quest.host': d => {ui.questHost=d.id;ui.questId=null;ui.questDetail=false;},
  'quest.select': d => {ui.questId=d.id;ui.questDetail=true;},
  'quest.list': () => {ui.questDetail=false;},
  'world.enter': d => {
    const p=WORLD_PLACES.find(p=>p.id===d.id);if(!p)return;
    const lock=placeLock(state,p.id);if(lock){toast(lock);return;}
    if(p.id==='atelier'){navigateScreen(null);return;}
    ui.sheet={kind:p.id==='farm'?'farm':p.id==='hunt'?'hunt':'town',tab:p.id};
    if(p.id==='hunt')ui.huntMenu='title';else maybeVisit(p.id);
  },
  'table.close': () => {ui.tablePop=null;},
  'table.firstDirty': () => {const t=state.tables.find(t=>t.state==='dirty');if(t)ui.tablePop={no:t.no};},
  'dress.who': d => { ui.dressWho = d.who; ui.dressPreview = null; ui.dressLine = null; },
  'dress.slot': d => { ui.dressSlot = d.slot; ui.dressPreview = null; ui.dressLine = null; },
  'dress.direction': d => { ui.dressDirection = d.dir; },
  'dress.pose': () => { ui.dressPose = ui.dressPose === 'host' ? 'idle' : 'host'; },
  'dress.preview': d => { ui.dressPreview = d.id; ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'preview'); },
  'outfit.unlock': d => { if (run({ type: 'outfit.unlock', id: d.id }).ok) ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'unlock'); },
  'hunt.hunter': d => {ui.hunterId=d.id;},
  'hunt.stage': d => {ui.huntStage=n(d.depth);},
  'hunt.menu': d => {ui.huntMenu=d.menu;},
  'armory.enhance': d => run({type:'armory.enhance',who:d.who,id:d.id}),
  'armory.learn': d => run({type:'armory.learn',id:d.id}),
  'armory.buy': d => run({type:'armory.buy',id:d.id}),
  'hunt.supply': d => run({type:'hunt.supply',id:d.id}),
  'chatter.close':()=>{ui.chatter=null;},
  'audio.change': d => audioAction(d.key,d.value),
  'guide.select': d => {ui.guideId=d.id;ui.guideStep=0;ui.sheet={kind:'tutorial'};},
  'guide.next':()=>{const g=GUIDES[ui.guideId||'cook'];if((ui.guideStep||0)<g.steps.length-1)ui.guideStep=(ui.guideStep||0)+1;else finishGuide();},
  'guide.back':()=>{ui.guideStep=Math.max(0,(ui.guideStep||0)-1);},
  'guide.close':()=>finishGuide(),
  'hunt.start': () => { ui.sheet = { kind: 'hunt' }; },
  'hunt.depart': d => { if (run({ type: 'hunt.start', depth: n(d.depth), hunterId:ui.hunterId||'neo' }).ok) ui.sheet = null; },
  'farm.select': d => { ui.farmCrop = d.id; },
  'farm.plot': d => { ui.farmPlot = n(d.index); },
  'world.delegate': d => {ui.delegate=ui.delegate===d.id?null:d.id;},
  'farm.plant': d => run({ type: 'farm.plant', cropId: d.id, index: n(d.index) }),
  'farm.water': d => run({ type: 'farm.water', index: n(d.index) }),
  'farm.tend': d => run({ type: 'farm.tend', index: n(d.index) }),
  'farm.harvest': d => run({ type: 'farm.harvest', index: n(d.index), cropInstanceId: d.id }),
  'farm.careAll': () => run({ type: 'farm.careAll' }),
  'farm.expand': () => run({ type: 'farm.expand' }),
  'farm.greenhouse': () => run({ type: 'farm.greenhouse' }),
  // 화면 전용
  'sheet.open': d => { if(d.sheet==='interior'){ACTIONS['interior.begin']();return;}if(d.sheet==='town'&&!d.tab){navigateScreen('world');return;}if(d.sheet==='quests'){ui.questReturn=ui.screen==='world'?'world':null;ui.questDetail=false;navigateScreen('quests');return;}ui.tablePop=null;ui.sheet = { kind: d.sheet, tab: d.tab, no:n(d.no) }; if (d.sheet === 'hunt') ui.huntMenu = d.menu || 'title'; if (d.sheet === 'town' && d.tab) maybeVisit(d.tab); },
  'town.tab': d => { if (ui.sheet) ui.sheet.tab = d.tab; maybeVisit(d.tab); },
  'sheet.close': () => { if(ui.sheet?.kind==='tutorial')finishGuide();else ui.sheet = null; },
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
    if(state.mode==='shift'&&!automationOn(state,'kitchen')&&known&&state.learned[known]){ui.combo=[];beginCraft(known);return;}
    const r = run({ type: 'recipe.try', ingredients: ui.combo.slice() });
    if (!r.ok) return;
    if (r.match === false) { shake(document.getElementById('combo-bench')); return; }
    ui.combo = [];
    if (r.known) toast('이미 아는 레시피예요 · 영업 중에 섞으면 바로 만들어요');
  },
  'discovery.close': () => { ui.discovery = null; },

  'game.continue': () => {
    if(state || novelActive())return;
    const r = loadGame(storage, SAVE_KEY);
    if (!r.ok) { toast(r.reason, 'bad'); return; }
    state = r.state;
    ui.sheet = null; ui.selectedSlot = null;
    save(); // 프롤로그 생략 마이그레이션을 다음 새로고침에도 유지한다.
    if (state.paused) toast('저장한 지점에서 일시정지 상태로 이어집니다', 'good');
  },
  'game.new': () => {
    if(state || novelActive())return;
    if (!ui.hasSave) { startNew(); return; }
    ui.confirm = { title:'새로운 카페를 열까요?', text:'지금까지의 저장은 지워지고 첫날부터 시작해요. 현재 이야기를 계속하려면 아래 버튼을 눌러 주세요.', art:'ui/new_game', yesLabel:'새 이야기 시작', noLabel:'현재 이야기 유지', danger:true, onYes:startNew };
  },
  'game.reset': () => {
    ui.confirm = { title: '저장을 초기화할까요?', text: '이 기기에 저장된 연이의 아틀리에 진행이 지워집니다. 되돌릴 수 없습니다.', yesLabel: '초기화', danger: true,
      onYes: () => { const r = resetSave(storage, SAVE_KEY, { confirmed: true }); ui.hasSave = hasSave(storage, SAVE_KEY); toast(r.ok ? '저장을 지웠습니다' : r.reason, r.ok ? 'good' : 'bad'); } };
  },
  'game.save': () => save(false),
  'game.title': () => goTitle(),
  'game.prologue': () => {if(!state&&!novelActive())playNovel(PROLOGUE, { onEnd: () => render(true) });},
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
    ui.tablePop = { no };
    ui.sheet = null;
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
  'order.quick': d => {const o=state.orders[d.id];if(!o)return;if(state.tray.some(it=>it?.menuId===o.menuId&&!it.reservedFor&&(!it.orderId||it.orderId===o.id)))run({type:'order.quick',orderId:d.id});else beginCraft(o.menuId,d.id);},
  'craft.cancel':()=>{const gift=ui.craft?.purpose==='gift';ui.craft=null;ui.sheet=gift?{kind:'foodgift'}:null;},
  'craft.assist':()=>{if(ui.craft?.step===1)ui.craft.assist=!ui.craft.assist;},
  'craft.mix':()=>{const c=ui.craft;if(c&&!Object.keys(craftShortage(state,c.menuId)).length&&mixCraft(c))sound('cook');},
  // 부족한 만큼만 모카 긴급 배달(영업 중 배달비 포함). 구매는 재료마다 엔진 명령 한 번.
  'craft.restock':()=>{const c=ui.craft;if(!c)return;for(const [id,qty] of Object.entries(craftShortage(state,c.menuId)))if(deliverable(id)&&!run({type:'shop.buy',ingredientId:id,qty}).ok)break;},
  'craft.heat':()=>{const c=ui.craft;if(!c||c.step!==1)return;const timing=craftHeat(c),quality=craftQuality(timing,c.menuId);const r=run(c.purpose==='gift'?{type:'gift.cook',menuId:c.menuId,timing,requestId:c.requestId}:c.orderId?{type:'order.quick',orderId:c.orderId,timing}:{type:'cook',menuId:c.menuId,timing});if(r.ok){sound('cook');c.step=2;c.jobId=r.jobId;c.quality=quality;c.timing=timing;c.perfect=quality==='완벽';toast(c.purpose==='gift'?'선물 조리를 시작했어요. 완성되면 선물 보관함에 담아요.':'조리를 시작했어요. 완성되면 픽업 선반에서 만나요.','good');}},

  'grounds.tab':d=>{ui.groundTab=n(d.id);ui.remodelPreview=null;},
  'grounds.begin':()=>run({type:'grounds.begin'}),
  'grounds.cancel':()=>run({type:'grounds.cancel'}),
  'grounds.apply':()=>run({type:'grounds.apply'}),
  'grounds.select':d=>{ui.groundItem=d.id;},
  'grounds.cell':d=>{if(ui.groundItem)run({type:'grounds.move',id:ui.groundItem,x:n(d.x),y:n(d.y)});},
  'grounds.nudge':d=>{const item=state.outdoor?.draft?.items.find(x=>x.id===ui.groundItem);if(item)run({type:'grounds.move',id:item.id,x:(item.x??0)+n(d.dx),y:(item.y??3)+n(d.dy)});},
  'grounds.rotate':()=>run({type:'grounds.rotate',id:ui.groundItem}),
  'grounds.store':()=>run({type:'grounds.store',id:ui.groundItem}),
  'grounds.buy':d=>run({type:'grounds.buy',id:d.id}),
  'grounds.floor':d=>run({type:'grounds.floor',id:d.id}),
  'grounds.floorBuy':d=>run({type:'grounds.floor.buy',id:d.id}),
  'grounds.expandPreview':()=>{ui.groundExpand=true;},
  'grounds.expandCancel':()=>{ui.groundExpand=false;},
  'grounds.expand':d=>{if(run({type:'grounds.expand',level:n(d.level),confirmed:true}).ok)ui.groundExpand=false;},
  'remodel.preview':d=>{ui.remodelPreview=d.id;},
  'remodel.buy':d=>run({type:'remodel.buy',id:d.id}),
  'remodel.apply':d=>{if(run({type:'remodel.apply',id:d.id}).ok)ui.remodelPreview=null;},
  'staffing.select':d=>run({type:'staffing.select',id:d.id}),
  'branch.buy':d=>run({type:'branch.buy',id:n(d.id),confirmed:true}),
  'branch.switch':d=>{if(run({type:'branch.switch',id:n(d.id)}).ok){ui.camera={};ui.tablePop=null;}},
  'branch.preview':d=>{ui.sheet={kind:'branches',preview:n(d.id)};},
  'cook.cancel': d=>run({type:'cook.cancel',jobId:d.job}),
  'cook.cancelNext': d => run({ type: 'cook.cancelNext', station: d.station }),
  'shop.buy': d => run({ type: 'shop.buy', ingredientId: d.id, qty: n(d.qty) }),
  'play.cycle':()=>{ui.playSpeed=ui.playSpeed===3?1:ui.playSpeed+1;},
  'play.speed': d => {ui.playSpeed=[1,2,3].includes(n(d.speed))?n(d.speed):1;},
  'finance.borrow': d => {const amount=n(d.amount);ui.confirm={title:`${amount.toLocaleString('ko-KR')}G를 빌릴까요?`,text:`월 이자 ${GAME_TEMP.LOAN_RATE*100}% · 다음 하순 이자 ${Math.ceil(amount*GAME_TEMP.LOAN_RATE).toLocaleString('ko-KR')}G가 추가됩니다. 미납 이자는 대출 원금에 더해져요.`,yesLabel:'조건 확인하고 빌리기',onYes:()=>run({type:'finance.borrow',amount,requestId:`loan-${Date.now()}-${++repaySeq}`})};},
  'finance.repay': d => run({type:'finance.repay',target:d.target,amount:n(d.amount),currency:d.currency}),
  'debt.repay': d => run({ type: 'debt.repay', amount: n(d.amount), requestId: `repay-${Date.now()}-${++repaySeq}` }),
  'quest.claim': d => run({ type: 'quest.claim', questId: d.id }),
  'recruit.complete': d => { if (run({ type: 'recruit.complete', id: d.id }).ok) ui.recruitEvent = null; },
  'outfit.equip': d => { if (run({ type: 'outfit.equip', who: d.who, slot: d.slot, itemId: d.item || null }).ok) { ui.dressPreview = d.item; ui.dressLine = outfitLine(d.who, d.item, stressStage(state)); } },
  'interior.undo':()=>run({type:'interior.undo'}),
  'editor.tab':d=>{ui.editTab=d.id;},
  'editor.category':d=>{ui.editCategory=d.id;},
  'editor.pick':d=>run({type:'interior.pick',uid:d.uid}),
  'editor.rotate':d=>{if(run({type:'interior.pick',uid:d.uid}).ok)run({type:'interior.rotate',uid:d.uid});},
  'interior.confirmItem':()=>run({type:'interior.confirmItem'}),
  'interior.cancelItem':()=>run({type:'interior.cancelItem'}),
  'editor.cancel':()=>{run({type:'interior.cancel'});ui.editTab='all';},
  'editor.shop':()=>{ui.sheet={kind:'town',tab:'expand'};},
  'interior.nudge': d => run({ type: 'interior.nudge', uid: d.uid, dx: n(d.dx), dy: n(d.dy) }),
  'interior.rotate': d => run({ type: 'interior.rotate', uid: d.uid }),
  'interior.store': d => run({ type: 'interior.store', uid: d.uid }),
  'interior.place': d => run({ type: 'interior.place', uid: d.uid }),
  'moonstone.exchange': d => run({ type: 'moonstone.exchange', qty: d.qty === 'all' ? state.moonstone : n(d.qty) }),
  'gear.buy': d => run({ type: 'gear.buy', id: d.id }),
  'gear.equip': d => run({ type: 'gear.equip', slot: d.slot, id: d.id || null }),
  'expand.decor': d => run({ type: 'expand.decor', defId: d.def }),
  'expand.area': d => run({ type: 'expand.area', id: d.id }),
  // 자동화는 인연으로 열린 것만 켜진다(엔진이 거절하면 사유 토스트). 전체 자동은 플레이어 화면에 없다(시뮬 전용).
  'automation.toggle': d => { const r = run({ type: 'automation.toggle', ability: d.ability }); if (r.ok) toast(r.on ? `${ABILITIES[r.ability].label} 켬` : `${ABILITIES[r.ability].label} 끔 · 직접 할게요`, r.on ? 'good' : ''); },
  'staff.dayOff': d => { const r = run({ type: 'staff.dayOff', id: d.id }); if (r.ok) toast(r.on ? `${personName(state, r.id)}은(는) 다음 영업에 쉬어요 · 결산 때 크게 회복` : `${personName(state, r.id)} 휴무 취소`); },
  'stress.shelter': d => run({ type: 'stress.shelter', id: d.id }),
};
for (const t of ['shift.start', 'settlement.close', 'pause', 'resume', 'fever.activate', 'interior.begin', 'interior.cancel', 'interior.apply',
  'hunt.retreat', 'hunt.finish', 'hunt.next', 'hunt.chest', 'expand.table']) ACTIONS[t] = () => run({ type: t });
ACTIONS['interior.begin']=()=>{const was=!!state?.interior.draft;if(run({type:'interior.begin'}).ok){if(!was)history.pushState({yeoniScreen:null,yeoniEditor:true},'',location.pathname+location.search);ui.sheet=null;ui.screen=null;ui.editTab='all';ui.editCategory='all';ui.editSearch='';}};
ACTIONS['hunt.pick'] = d => run({ type: 'hunt.pick', index: n(d.index) });
ACTIONS['workshop.tab']=d=>{ui.armoryTab=d.id;};
ACTIONS['workshop.quest']=d=>run({type:'workshop.quest',id:d.id,action:d.mode});
ACTIONS['yun.quest']=()=>run({type:'yun.quest'});
ACTIONS['farm.delegate']=()=>run({type:'farm.delegate'});
// 인연 대화: 질문 장면 안에서 바로 답을 고른다(별도 선택 창 없음). 답을 고르기 전에 닫으면 행동력을 쓰지 않는다.
ACTIONS['bond.talk'] = d => {
  const chk=talkCheck(state,d.id);if(!chk.ok){toast(chk.reason,'bad');return;}
  const q=bondQuestion(state,d.id);if(!q)return;
  const back=ui.sheet,name=BONDS[d.id].name;ui.sheet=null;render(true);
  const reopen=()=>{ui.sheet=back||{kind:'companions'};render(true);};
  playNovel([{chapter:[name+' · '+q.phase,q.title],bg:'atelier_dark',l:'yeoni:normal',c:d.id+':normal',r:null},{s:'nar',t:q.intro},
    {s:d.id,t:q.question,choices:q.answers.map(x=>({id:x.id,text:x.text})),guide:!state.tutorials?.bondtalk}],{
    onGuideSeen:()=>run({type:'tutorial.seen',id:'bondtalk'},{keepQuiet:true}),
    onChoose:choiceId=>{const r=run({type:'bond.talk',id:d.id,choiceId,token:q.token},{keepQuiet:true});if(!r.ok)return r;
      return {ok:true,beats:[{bg:'atelier_lit',l:'yeoni:smile',c:d.id+':smile',s:d.id,t:r.line},{s:'sys',t:'인연 +'+r.gain+' · 오늘의 대화가 마음에 남았습니다.'}]};},
    onEnd:reopen,
    onCancel:()=>{reopen();toast('대화를 다음으로 미뤘어요 · 행동력은 쓰지 않았어요');}});
};
let giftRequestSeq=0;
ACTIONS['gift.open']=d=>{ui.giftRecipient=d.id;ui.foodFilter='all';ui.sheet={kind:'foodgift'};};
ACTIONS['gift.filter']=d=>{ui.foodFilter=d.id;};
ACTIONS['gift.prepare']=d=>{ui.craft={...newCraft(d.menu),purpose:'gift',requestId:'gift-'+Date.now()+'-'+(++giftRequestSeq)};ui.craft.assist=motionPreference.matches;ui.sheet={kind:'craft'};};
ACTIONS['gift.watch']=()=>{const j=state.foodGifts?.job;if(j){ui.craft={...newCraft(j.menuId),purpose:'gift',step:2,jobId:j.id,quality:({normal:'보통',good:'좋음',perfect:'완벽'})[j.quality],timing:null};ui.sheet={kind:'craft'};}};
ACTIONS['gift.confirm']=d=>{const it=state.foodGifts?.items.find(i=>i.id===d.item);if(!it)return;const taste=foodPreference(d.id,it.menuId);ui.confirm={title:GIFT_BONDS[d.id].name+'에게 선물할까요?',text:MENUS[it.menuId].name+' 1개 · '+taste.label+' · 인연 +'+taste.gain,yesLabel:'선물 전하기',noLabel:'고르던 음식 유지',onYes:()=>{const r=run({type:'gift.food',id:d.id,itemId:d.item});if(r.ok){toast(r.line,'good',4500);}}};};
ACTIONS['gift.cancelConfirm']=d=>{ui.confirm={title:'선물 조리를 취소할까요?',text:'사용한 재료는 한 번 돌려받고 음식은 완성되지 않아요.',yesLabel:'조리 취소',onYes:()=>run({type:'gift.cancel',id:d.id})};};
ACTIONS['bond.gift'] = d => run({ type: 'bond.gift', id: d.id, giftId: d.gift });

document.addEventListener('click', e => {
  const cam=e.target.closest('[data-action^="camera."]');
  if(cam){if(cam.dataset.action==='camera.fit')ui.camera={zoom:1,x:0,y:0,overview:true};else {ui.camera.overview=false;ui.camera.zoom=Math.max(1,Math.min(2.4,ui.camera.zoom+Number(cam.dataset.step)));}resize();render(true);return;}

  if(ui.tablePop&&!e.target.closest('.table-pop,.table-badge,.hit')){ui.tablePop=null;render(true);}
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const action = b.dataset.action;
  if (b.getAttribute('aria-disabled') === 'true') {
    toast(b.getAttribute('title') || '지금은 할 수 없습니다', 'bad');
    return;
  }
  const fn = ACTIONS[action];
  if (!fn) { console.warn('unknown action', action); return; }
  if (!state && !action.startsWith('game.') && !action.startsWith('confirm.') && !action.startsWith('audio.')) return;
  unlockAudio(); sound('tap');
  fn(b.dataset);
  render(true);
});

document.addEventListener('input',e=>{if(e.target.matches('[data-editor-search]')){ui.editSearch=e.target.value;render(true);}});

// 인테리어 편집: 캔버스를 눌러 가구 고르기 / 고른 가구를 그 칸으로 옮기기
el.canvas.addEventListener('click', e => {
  const draft = state?.interior?.draft;
  if (!draft || !view || performance.now()<(ui.suppressCanvasClickUntil||0)) return;
  const r = el.canvas.getBoundingClientRect();
  const point=canvasPoint(e);
  const cell = pxToCell(view, point.x, point.y);
  const selected=draft.furniture.find(f=>f.uid===draft.selected);
  if(draft.itemBefore&&selected){run({type:selected.x==null?'interior.place':'interior.move',uid:selected.uid,x:cell.x,y:cell.y});return;}
  const placed = draft.furniture.filter(f => f.x!=null);
  const hits = placed.filter(f => furnitureCells(f).some(c => c.x === cell.x && c.y === cell.y));
  const pickF = hits.find(f => !furnitureCells(f).every(c => c.kind === 'floor')) || hits[0];
  if (pickF) run({ type: 'interior.pick', uid: pickF.uid });
});

// ── 이벤트 → 피드백
const tableAt = no => tablePx[no] || { x: cssW / 2, y: cssH / 3 };
function gagLines(lines) {
  (lines || []).forEach((l, i) => setTimeout(() => {
    const node = toast(`${l.who}: ${l.text}`, 'gag', 3000);
    const key = Object.values(SPEAKERS).find(s => s.name === l.who)?.portrait;
    // 작은 대사는 흉상을 줄이지 않고, 대화 시트에서 얼굴만 자른 192² 배지를 원형으로 보인다.
    const badge = key && ASSETS.badges?.[talkingKey(key)];
    if (node && badge) {
      const img = document.createElement('img'); img.className = 'toast-badge'; img.src = badge.path;
      img.alt = ''; img.setAttribute('aria-hidden', 'true'); node.prepend(img);
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
  for(const e of events){
    const speaker=({cooked:'luna_sis',served:'luna',paidAtCounter:'yeoni',feverOn:'neo'})[e.type];
    if(speaker && state?.mode==='shift'){const pool=CAFE_LINES[speaker];ui.staffLineIndex=(ui.staffLineIndex||0)+1;showCafeLine(pool[ui.staffLineIndex%pool.length],personName(state,speaker),speaker);}
  }

  if (!events?.length) return;
  for (const ev of events) {
    if(['served','cooked','takeawayDone'].includes(ev.type))sound('cook');
    const soundKind={huntAttack:ev.weapon,huntHit:'hit',huntHurt:'hurt',huntDeath:'death',huntGem:'gem',huntPickup:'moon',huntLevelUp:'level',huntChest:'chest',huntEvolve:'level',huntEnemyAttack:'aura',feverOn:'level'}[ev.type];if(soundKind)sound(soundKind);
    if(ev.type==='huntEvent'&&ev.warn)sound('boss');
    const p = ev.tableNo != null ? tableAt(ev.tableNo) : null;
    switch (ev.type) {
      case 'giftFoodReady':toast('선물 보관함에 완성된 음식을 담았어요.','good');break;
      case 'huntCritical': ui.critLine=(ui.critLine||0)+1;showCafeLine(CAFE_LINES.critical[ui.critLine%CAFE_LINES.critical.length],'영냥이','neo_cat');sound('level');break;
      case 'huntStageClear': if(ev.tired)showCafeLine(tiredLine(ev.hunterId),ev.hunterId==='seohanbi'?'서한비':'영냥이',ev.hunterId==='seohanbi'?'seohanbi':'neo_cat');break;
      case 'huntObjectBroken': sound('gem');break;
      case 'guestChatter': showCafeLine(ev.line,ev.kind==='takeaway'?'포장 손님':ev.tableNo?`${ev.tableNo}번 손님`:'손님','customer'); break;
      case 'paidAtCounter': sound('moon'); floater(cssW/2,cssH*.78,`계산 +${ev.amount}G`,'#b07a12');break;
      case 'cafeLevelUp': sound('bond'); toast(`카페 Lv.${ev.level}! ${ev.apGain>0?`다음 순부터 마을 행동력 +${ev.apGain}`:'더 많은 손님과 새로운 취향이 찾아와요'}`,'good');break;
      case 'takeawayDone': toast('포장 완료 · 손님이 계산대에서 받아 갔어요','good');break;
      case 'farmAction': ui.farmFeedback=ev.text;ui.farmMotion={kind:ev.kind,index:ev.index,cropId:ev.cropId,at:performance.now()};ui.farmAnimUntil=performance.now()+1800;toast(ev.text,'good');break;
      case 'shiftStart': toast(`☀ ${dateLabel(state, ev.day)} 영업 시작 · 10:00`, 'good'); gagOnce('start', pickLine(GAG_SHIFT_START), 0); break;
      case 'served': floater(p?.x??cssW/2, (p?.y??cssH*.75) - 10, '주문 완료', '#b07a12'); if (state.stats.served % 4 === 0) gagOnce('kitchen', pickLine(GAG_KITCHEN), 45000); break;
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
      case 'cooked': {const p=cellToPx(view,8,1.4);floater(p.x,p.y,'✧','#b07a12');}toast('한 접시 완성! 서빙대에서 손님에게 전해 주세요.','good');break;
      case 'cleaned': if(p)floater(p.x,p.y-12,'✧ 깨끗해요','#58734e');break;
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
      case 'placeUnlocked': toast(`🔓 ${ev.name}이 열렸어요`, 'good', 3600); break;
      case 'gearBought': toast(`🗡 ${ev.name} 구입 · 윤달의 무기 공방`, 'good'); gagOnce('stall', pickLine(GAG_GEAR_STALL), 8000); break;
      case 'expanded': toast(`🪑 ${ev.tableNo}번 테이블을 들였어요 · 다음 영업부터 손님 자리가 늘어요`, 'good', 3600); break;
      case 'areaOpened': resize(); toast(`🔓 ${ev.name} 증축 완료 · 인테리어에서 테이블과 장식을 놓아 보세요`, 'good', 3600); break;
      case 'decorBought': toast(`📦 ${ev.name} 보관함에 도착 · 인테리어에서 놓아 주세요`, 'good'); break;
      case 'huntFinished': pixelFx(el.stage,'transform',{frames:8}); if ((ev.bag?.moonstone || 0) > 0) gagOnce('hunt', pickLine(GAG_HUNT_RETURN), 0); break;
      case 'huntStart': pixelFx(el.stage,'transform',{frames:8}); toast(`${state.hunt.hunterId==='seohanbi'?'검은 호랑이 서한비':'영냥이'}가 ${state.hunt.depth}단계로 출발했어요 · 보스를 쓰러뜨리면 클리어`, 'good'); break;
      case 'huntPickup': floater(cssW / 2, cssH * 0.4, `+${ev.name}`, '#7d86e8'); break;
      case 'huntHurt': if(!matchMedia('(prefers-reduced-motion: reduce)').matches)shake(el.stage); break;
      case 'skillLearned': toast(ev.rank===1?`📜 ${ev.name}을 배웠어요 · 다음 사냥부터 나와요`:`📜 ${ev.name} 단련 ${ev.rank}단계`, 'good', 3200); break;
      case 'huntEvolve': toast(`🌟 진화! ${ev.name}`, 'good', 3200); break;
      case 'achievement': toast(`🏅 업적 「${ev.name}」 · 월정석 +${ev.moon}`, 'good', 3600); break;
      case 'huntPower': toast(ev.label, 'good', 1800); break;
      case 'payrollPaid': toast(`동료 급여 ${ev.paid.toLocaleString('ko-KR')}G 지급${ev.arrears?` · 미지급 ${ev.arrears.toLocaleString('ko-KR')}G`:''}`);break;
      case 'interestCharged': toast(`💸 ${ev.month}월 이자 ${ev.due.toLocaleString('ko-KR')}G${ev.added ? ` · 골드가 모자라 ${ev.added.toLocaleString('ko-KR')}G는 빚에 붙었어요` : ' 납부'}`, ev.added ? 'bad' : '', 3600); break;
      case 'bondTalk': if (!novelActive()) toast(`${SPEAKERS[ev.speaker]?.name || ''}: ${ev.line} (친밀도 +${ev.gain})`, 'gag', 3600); break;
      case 'bondGift': toast(`🎁 ${BONDS[ev.id].name} 친밀도 +${ev.gain}${ev.liked ? ' · 좋아하는 선물이에요!' : ''}`, 'good'); break;
      case 'staffResting': toast(`😮‍💨 ${ev.name}이(가) 한계예요 · 이번 영업은 쉬고, 하던 일은 다른 사람에게 넘겨요`, 'bad', 3600); break;
      case 'handOver': toast(`${personName(state, ev.id)}이(가) 하던 ${ev.kind === 'deliver' ? '서빙' : '정리'}을 다른 사람에게 넘겼어요`, '', 2400); break;
      case 'shelterRest': toast(`🐰 루나의 쉼터 · ${ev.name} 스트레스 −${Math.round(ev.recovered)}`, 'good'); break;
      case 'farmDelegated': toast(`🐾 네오가 밭일을 마쳤어요 · 수확 ${ev.harvested} · 다시 심기 ${ev.planted} · 돌봄 ${ev.cared}${ev.stopped ? ' · ' + ev.stopped : ''}`, 'good', 3600); break;
      case 'farmDelegateSkipped': toast(`농장 맡기기는 이번엔 쉬어요 · ${ev.reason}`, '', 3000); break;
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
  document.body.dataset.mode=state?.mode||'title';
  document.body.dataset.editing=state?.interior?.draft?'true':'false';
  if(!state||state.mode==='hunt')ui.screen=null;
  document.getElementById('app').hidden=!!ui.screen;
  const world=document.getElementById('world-screen');world.hidden=!ui.screen;
  if (!force && now - lastUi < 200) return;
  morph(world,worldScreenHtml(state,ui));
  lastUi = now;
  if (state && ui.selectedSlot != null && !state.tray[ui.selectedSlot]) ui.selectedSlot = null;
  if (ui.sheet?.kind === 'table' && state?.mode !== 'shift') ui.sheet = null;
  morph(el.topbar, topbarHtml(state, ui));
  morph(el.panel, panelHtml(state, ui));
  morph(el.bubbles, state?.mode === 'shift' || state?.mode === 'hunt' ? bubblesHtml(ui) : '');
  morph(el.hits, hitsHtml(state, view, ui)+tableBadgesHtml(state,view)+tablePopHtml(state,view,ui));
  document.getElementById('camera-controls').hidden=!state||state.mode==='hunt';
  const hunting=state?.mode==='hunt', h=state?.hunt;
  // 보스곡은 서한비(검은 호랑이) 전용. 일반 단계 보스는 깊이별 사냥곡
  const hanbiAlive=hunting&&getHuntWorld(state)?.enemies.items.slice(0,getHuntWorld(state).enemies.count).some(e=>e.type==='boss_hanbi');
  setAudioScene(novelActive()?'story':hunting?(h.status!=='running'?'huntResult':hanbiAlive?'huntBoss':h.depth>=55?'huntDeep':'hunt'):state?.fever?.activeUntil!=null?'fever':ui.sheet?.kind==='hunt'?'huntPrep':ui.sheet?.kind||(state?'cafe':'title'));
  const guide=({kitchen:'cook',craft:'cook',farm:'farm',hunt:'hunt',armory:'armory',outfits:'outfits',companions:'bonds',table:'serve',shop:'shop'})[ui.sheet?.kind] || (state?.interior.draft?'interior':null);
  // 잠긴 농장·공방에서는 안내를 띄우지 않는다
  const guideLocked=guide==='farm'?placeLock(state,'farm'):guide==='armory'?placeLock(state,'gear'):'';
  if(state && guide && !guideLocked && (guide!=='outfits'||state.hostbar.open) && !state.tutorials?.[guide] && !novelActive()){
    ui.guideReturn=ui.sheet;ui.guideId=guide;ui.guideStep=0;ui.sheet={kind:'tutorial'};
  }
  const sh = sheetHtml(state, ui);
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
  if(ui.craft?.step===1){const marker=document.querySelector('.heat-track i');if(marker)marker.style.left=craftHeat(ui.craft,t)+'%';}
  if (state && ui.sheet?.kind === 'farm') drawFarm(state, t, ui);
  if(ui.screen){drawInlinePortraits(t);return;}
  if (state && ui.sheet?.kind === 'outfits') drawDressroom(state, ui, t);
  drawInlinePortraits(t);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true; // 고해상도 일러스트 축소
  if (state?.mode === 'hunt' && state.hunt) {
    drawHunt(ctx, state, getHuntWorld(state), cssW, cssH, { t, reducedMotion:motionPreference.matches, joy: joystick.state.joy, rect: el.canvas.getBoundingClientRect() });
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
      const huntOn = state.mode === 'hunt' && state.hunt?.status === 'running' && !state.paused && !huntPaused(state.hunt);
      if (huntOn && !joystick.state.enabled) joystick.enable();
      if (!huntOn && joystick.state.enabled) joystick.disable();
      const running = !state.paused && ui.sheet?.kind!=='tutorial' && !novelActive() && (state.mode === 'shift' || state.mode === 'hunt'||state.mode==='prep'&&state.foodGifts?.job);
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
if (DEV) window.__yeoni = { get state() { return state; }, ui, audioStatus };
if (DEV && new URLSearchParams(location.search).get('qa') === 'actors') import('./qa-actors.js').then(m => m.mountActorQA());

document.addEventListener('change',e=>{if(e.target.id==='hunt-stage'){ui.huntStage=Number(e.target.value);render(true);}});

// 브라우저 확대에서도 논리 화면 좌표를 한 곳에서 계산한다.
function canvasPoint(e){const r=el.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*cssW/r.width,y:(e.clientY-r.top)*cssH/r.height};}
let cameraDrag=null;
el.stage.addEventListener('pointerdown',e=>{if(state?.mode==='hunt'||e.target.closest('button')||(ui.camera.zoom<=1&&view.tile*view.cols<=cssW&&view.tile*view.rows<=cssH))return;const p=canvasPoint(e);cameraDrag={x:p.x,y:p.y,px:ui.camera.x,py:ui.camera.y};el.stage.setPointerCapture(e.pointerId);});
el.stage.addEventListener('pointermove',e=>{if(!cameraDrag)return;const p=canvasPoint(e);if(Math.hypot(p.x-cameraDrag.x,p.y-cameraDrag.y)>6)ui.suppressCanvasClickUntil=performance.now()+400;ui.camera.x=cameraDrag.px+p.x-cameraDrag.x;ui.camera.y=cameraDrag.py+p.y-cameraDrag.y;view=computeView(cssW,cssH,{...ui.camera,...cafeBounds(state)});render(true);});
el.stage.addEventListener('pointerup',()=>cameraDrag=null);el.stage.addEventListener('pointercancel',()=>cameraDrag=null);

function beginCraft(menuId,orderId=null){
 if(automationOn(state,'kitchen')){run(orderId?{type:'order.quick',orderId}:{type:'cook',menuId});return;}
 const order=state.orders[orderId];if(order&&Object.values(state.stations).some(st=>stationJobs(st).some(j=>j?.orderId===orderId))){toast('이 주문은 조리 중이에요.');return;}
 ui.playSpeed=1;ui.craft=newCraft(menuId,orderId);ui.craft.assist=motionPreference.matches;ui.sheet={kind:'craft'};
}

function finishGuide(){const back=ui.guideReturn;ui.guideReturn=null;run({type:'tutorial.seen',id:ui.guideId||'cook'});ui.sheet=back||null;}
function showCafeLine(line,speaker,portrait='customer'){
 const now=performance.now();if(ui.chatter&&now<ui.chatter.until-1800)return;
 ui.chatter={line,speaker,portrait,until:now+6500};
}
document.addEventListener('change',e=>{if(e.target.id==='guide-selector'){ui.guideId=e.target.value;ui.guideStep=0;render(true);}});


// 눌러 둔 키·입력창·가려진 전투에서는 물품을 사용하지 않는다.
document.addEventListener('keydown',e=>{
 if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||document.hidden||state?.mode!=='hunt'||ui.sheet||ui.confirm||novelActive()||e.target.closest('input,textarea,select,[contenteditable=true]'))return;
 const n=/^[1-5]$/.test(e.key)?Number(e.key)-1:-1;if(n<0)return;
 e.preventDefault();run({type:'hunt.supply',id:SUPPLY_ORDER[n]});render(true);
});
