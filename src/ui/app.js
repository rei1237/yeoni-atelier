import {installApp} from './install-app.js';
import {worldMeetingAccess} from '../game/world-meetings.js';
import {recruitView} from '../game/economy.js';
import {createHostDemo,HOST_DEMO_SAVE_KEY} from '../game/host-demo.js';
import {kfpFusionPreview,KFP_WEAPONS} from '../game/kfp-loadout.js';
import {MENUS} from '../data/menus.js';
import {BONDS as GIFT_BONDS} from '../data/bonds.js';
import {foodPreference} from '../data/food-preferences.js';
import {SUPPLY_ORDER} from '../data/hunt-supplies.js';
import {completeStory} from './story-completion.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {branchStory} from '../story/branches.js';
import {createWorldTrip,worldRoute,advanceTrip} from './world-travel.js';
import {WORLD_NAV} from './world-navigation-data.js';
import {townCheck} from '../game/town.js';
import {drawActor} from '../render/sprite-renderer.js';
import { worldScreenHtml, WORLD_PLACES } from './world-screen.js';
import { tableBadgesHtml, tablePopHtml } from './table-ui.js';
import { bondQuestion } from '../data/bond-dialogues.js';
import { talkCheck } from '../game/bonds.js';
import {CAFE_LINES,PATRON_TIP_LINES,selectLine} from '../data/cafe-dialogue.js';
import {ELDER_LOOKS} from '../data/customer-looks.js';
import {newTalk,guestTalk,staffTalk,sayTalk,syncTalk,prepTalk,situationTalk,shiftSituation} from './cafe-talk.js';
import {newCraft,mixCraft,craftHeat,craftQuality,craftShortage,deliverable} from './crafting.js';
import {findRecipe} from '../game/recipe.js';
import {TEMP as GAME_TEMP} from '../config/balance.temp.js';
// 연이의 아틀리에 진입점. 화면 ↔ 엔진 연결만 한다.
// 상태 변경은 모두 dispatch(명령)·tick(활성 시간)으로만 하고, 이 파일은 골드·지명 시간·영입 상태를 직접 바꾸지 않는다.

import {showHelpFeedback} from './help-feedback.js';
import { unlockAudio,setAudioScene,audioAction,sound,audioStatus,startShiftMusic } from './audio.js';
import {tableCookingOrders} from '../game/table-cooking.js';
import { GUIDES,guideForContext } from './tutorials.js';
import { FORTUNE_BIRTH_KEY } from './fortune-sheet.js';
import { btn } from './dom.js';
import { TEMP } from '../config/balance.temp.js';
import { createGame, personName, personDef } from '../game/state.js';
import { dispatch, tick, helperAvailable, HELPERS } from '../game/engine.js';
import { findServeTarget } from '../game/cafe.js';
import { bundleItems } from '../game/delivery.js';
import { drawHuntMap } from './hunt-map.js';
import { getHuntWorld, paused as huntPaused } from '../game/hunt.js';
import { preview as interiorPreview } from '../game/interior.js';
import { furnitureCells } from '../game/space.js';
import { recordWallClock } from '../game/offline.js';
import { SAVE_KEYS, memoryStorage, browserStorage, saveGame, loadGame, hasSave, resetSave } from '../core/save.js';
import { createFrameLoop } from '../core/frame-loop.js';
import { createJoystick } from '../core/joystick.js';
import { loadAssetImages, imageFor, ASSETS } from '../render/assets.js';
import { talkingKey } from '../render/sprite-renderer.js';
import { cafeBounds, computeView, cellToPx, pxToCell, drawCafe, canvasDpr } from '../render/cafe-view.js';
import { AREAS } from '../data/layout.js';
import { gardenItem } from '../game/grounds.js';
import { decorDirty, purchaseGate, placedNote } from './decor-screen.js';
import { drawHunt } from '../render/hunt-view.js';
import { $, morph, toast, floater, shake } from './dom.js';
import { topbarHtml, panelHtml, bubblesHtml, hitsHtml, won, huntFullscreenEnds } from './hud.js';
import { DEMAND_KINDS } from '../game/counter-demand.js';
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
import {hunterUnlocked,hunterName} from '../game/hunt-cast.js';
import { HANBI_STORIES } from '../story/hanbi.js';
import { RATE_STORIES, creditorStory } from '../story/creditor.js';
import { VISIT_STORIES } from '../story/visits.js';
import { PROLOGUE } from '../story/prologue.js';
import { MONTH_STORIES, ENDINGS } from '../story/months.js';
import { seasonStory } from '../story/seasons.js';
import { careerMonthStory, castBondStory } from '../story/career.js';
import { BOND_STORIES } from '../story/bonds.js';
import { BONDS, COMMON_GIFT, bondReady, rankWaits, withWa } from '../data/bonds.js';
import { SPEAKERS } from '../story/prologue.js';
import { pendingStory, calendarOf, isEnded, dateLabel } from '../game/calendar.js';
import { placeLock, bondName, bondMasked } from '../game/unlocks.js';
import { GAG_SHIFT_START, GAG_KITCHEN, GAG_MOKA_BUY, GAG_MOKA_DELIVERY, GAG_LUNA_EXCHANGE, GAG_GEAR_STALL, GAG_CHEONGTOKKI_REPAY, GAG_HUNT_RETURN, pickLine } from '../data/lines.js';

// ── 부팅
const DEV = new URLSearchParams(location.search).get('dev') === '1';
const HOST_DEMO=DEV&&new URLSearchParams(location.search).get('demo')==='host';
const SAVE_KEY = HOST_DEMO?HOST_DEMO_SAVE_KEY:DEV ? SAVE_KEYS.dev : SAVE_KEYS.normal;
let storage = browserStorage();
const storageOk = !!storage;
if (!storage) storage = memoryStorage();

let state = null;
// 영업 배속은 기기 설정으로 남긴다(10-29 사용자 요청: 배속 유지). 저장 게임과 별개다.
const SPEED_KEY='yeoni-atelier.play-speed.v1';
const savedSpeed=()=>{try{const v=Number(storage.getItem(SPEED_KEY));return [1,2,3].includes(v)?v:1;}catch{return 1;}};
function setPlaySpeed(v){ui.playSpeed=[1,2,3].includes(v)?v:1;try{storage.setItem(SPEED_KEY,String(ui.playSpeed));}catch{}}
const ui = { playSpeed:savedSpeed(), camera:{zoom:1,x:0,y:0}, dev: DEV, hostDemo:HOST_DEMO, speed: 1, sheet: null, confirm: null, selectedSlot: null, recruitEvent: null, combo: [], discovery: null, ending: null, storageOk, hasSave: hasSave(storage, SAVE_KEY) };
ui.canFullscreen=!!document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function';
document.addEventListener('fullscreenchange',()=>{ui.fullscreen=!!document.fullscreenElement;if(!ui.fullscreen)ui.huntFullscreen=false;render(true);});
if (DEV) document.documentElement.classList.add('dev');

const el = { topbar: $('#topbar'), panel: $('#panel'), stage: $('#stage'), canvas: $('#view'), hits: $('#hits'), bubbles: $('#bubbles'), talk: $('#talk'),
  sheetWrap: $('#sheet-wrap'), sheet: $('#sheet'), overlay: $('#overlay') };
const ctx = el.canvas.getContext('2d');
let view = null, cssW = 0, cssH = 0, dpr = 1;
let lastUi = 0;
const tablePx = {}; // 마감 뒤에도 떠오르는 숫자 위치를 알 수 있게 테이블 화면 좌표를 기억

// 증축 미리보기 중에는 고른 구역까지 무대를 넓혀 보여 준다.
function stageBounds(){const b=cafeBounds(state),a=state?.interior.draft&&AREAS.find(x=>x.id===ui.decorArea);return a?{cols:Math.max(b.cols,a.rect[2]+1),rows:Math.max(b.rows,a.rect[3]+1)}:b;}
function resize() {
  const r = el.stage.getBoundingClientRect();
  document.documentElement.style.setProperty('--cafe-stage-height', `${r.height}px`);
  cssW = Math.max(1, el.stage.clientWidth); cssH = Math.max(1, el.stage.clientHeight);
  dpr = canvasDpr(cssW, cssH, window.devicePixelRatio); // 3배 화면 휴대폰에서도 캔버스가 늘어나 흐려지지 않게
  el.canvas.width = Math.round(cssW * dpr); el.canvas.height = Math.round(cssH * dpr);
  el.canvas.style.width = `${cssW}px`; el.canvas.style.height = `${cssH}px`;
  view = computeView(cssW, cssH,{...ui.camera,...stageBounds()});
  lastUi = 0;
}
new ResizeObserver(resize).observe(el.stage);
resize();
loadAssetImages(undefined,{onProgress:(done,total)=>{const p=document.getElementById('boot-progress');if(p){p.max=total||1;p.value=done;}const count=document.getElementById('boot-count');if(count)count.textContent=total?`${Math.round(done/total*100)}%`:'';}}).then(()=>{document.getElementById('boot-screen')?.remove();applyAssetTheme();render(true);});

const joystick = createJoystick(el.canvas, { radius: 56 });

// ── 저장
function save(quiet = true) {
  if (!state) return;
  const r = saveGame(storage, SAVE_KEY, state);
  ui.hasSave = hasSave(storage, SAVE_KEY);
  if (!quiet) toast(r.ok ? (storageOk ? '💾 저장했습니다' : '💾 임시 저장(새로고침하면 사라짐)') : r.reason, r.ok ? 'good' : 'bad');
}

// 독립 화면의 주소 이력은 UI만 바꾸며 게임 저장과 분리한다.
// 10-29 영업 중에는 가게를 비울 수 없어 재성의 섬 지도도 열지 않는다
const ISLAND_SHIFT_LOCK='영업 중에는 재성의 섬에 갈 수 없어요. 마감한 뒤 다녀와요';
function navigateScreen(screen, replace=false) {
  if(screen==='world'&&state?.mode==='shift'){toast(ISLAND_SHIFT_LOCK);return false;}
  ui.worldTrip=null; ui.worldMarker=null; ui.worldCardOpen=false; ui.screen=screen; ui.sheet=null; ui.tablePop=null; ui.cafeDrawer=null;
  history[replace?'replaceState':'pushState']({yeoniScreen:screen},'',screen?'#'+screen:location.pathname+location.search);
}
window.addEventListener('popstate',e=>{ui.worldTrip=null;ui.worldMarker=null;ui.worldCardOpen=false;if(state?.interior.draft&&decorBack(true))return;ui.screen=state?(e.state?.yeoniScreen||null):null;if(ui.screen==='world'&&state?.mode==='shift')ui.screen=null;ui.sheet=null;ui.tablePop=null;ui.cafeDrawer=null;render(true);});
document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.key!=='Escape'||novelActive())return;if(ui.worldTrip){ui.worldTrip=null;ui.worldMarker=null;render(true);return;}if(ui.worldCardOpen){ui.worldCardOpen=false;render(true);return;}if(state?.interior.draft&&!ui.sheet&&!ui.confirm){decorBack(false);render(true);return;}if(ui.cafeDrawer){ui.cafeDrawer=null;render(true);}else if(ui.tablePop){ui.tablePop=null;render(true);}else if(ui.screen&&!ui.sheet){navigateScreen(null,true);render(true);}});
// 꾸미기 뒤로: 고른 가구는 선택만 풀고, 적용 전 변경이 있으면 묻고, 없으면 닫는다. 화면을 유지하면 true.
function decorBack(fromHistory){
 const keep=()=>{if(fromHistory)history.pushState({yeoniScreen:null,yeoniEditor:true},'',location.pathname+location.search);};
 if(state.interior.draft.itemBefore||ui.decorSpace==='outdoor'&&ui.groundItem){keep();ACTIONS['decor.deselect']();render(true);return true;}
 if(decorDirty(state)){keep();askDecorDiscard();render(true);return true;}
 closeDecor();return false;
}
function askDecorDiscard(){ui.confirm={title:'적용하지 않은 배치가 있어요',text:'닫으면 이번에 옮긴 배치는 원래대로 돌아가요. 이미 산 가구와 증축한 공간은 그대로 남아요.',yesLabel:'배치 버리고 닫기',noLabel:'계속 꾸미기',onYes:closeDecor};}
function closeDecor(){if(state.outdoor?.draft)run({type:'grounds.cancel'},{keepQuiet:true});if(state.interior.draft)run({type:'interior.cancel'},{keepQuiet:true});ui.decorSpace='indoor';ui.groundItem=null;ui.decorArea=null;ui.groundExpand=false;ui.remodelPreview=null;resize();}
// 화면 가운데 칸과 카메라 맞추기(구매·추천 자리·증축 미리보기)
const viewCenterCell=()=>view?pxToCell(view,cssW/2,cssH/2):undefined;
function focusCell(x,y){if(!view)return;const v0=computeView(cssW,cssH,{...ui.camera,x:0,y:0,...stageBounds()});ui.camera.x=cssW/2-(v0.ox+(x+.5)*v0.tile);ui.camera.y=cssH/2-(v0.oy+(y+.5)*v0.tile);view=computeView(cssW,cssH,{...ui.camera,...stageBounds()});}
function afterDecorBuy(uid){
 ui.decorTab='owned';ui.editTab='all';ui.editCategory='all';
 const s=run({type:'interior.suggest',uid,near:viewCenterCell()},{keepQuiet:true});
 if(s.ok){focusCell(s.x,s.y);toast('구매 완료 · 추천 자리에 올려 뒀어요','good',2600);}
 else toast('구매 완료 · 보관함에 있어요. 지금 열린 공간에는 빈자리가 없어요 · 다른 가구를 보관하거나 공간 확장에서 넓혀요','good',5600);
}
function enterWorldPlace(id){
 const p=WORLD_PLACES.find(p=>p.id===id);if(!p)return;
 const lock=placeLock(state,id)||(id!=='atelier'&&!townCheck(state).ok?townCheck(state).reason:'');
 if(lock){toast(lock);return;}
 const recorded=run({type:"world.arrive",place:id},{keepQuiet:true});if(!recorded.ok)return;
 ui.worldAt=id;
 if(id==='atelier'){navigateScreen(null);return;}
 ui.sheet={kind:id==='farm'?'farm':id==='hunt'?'hunt':'town',tab:id};
 if(id==='hunt')ui.huntMenu='title';else maybeVisit(id);
}
function stepWorldTravel(ms){
 if(ui.screen!=='world'||!ui.worldTrip)return;
 const trip=ui.worldTrip,id=trip.id,instant=trip.skip||motionPreference.matches;
 if(trip.complete){trip.idleMs=(trip.idleMs||0)+ms;if(trip.idleMs>=240){ui.worldTrip=null;enterWorldPlace(id);render(true);}return;}
 const pose=advanceTrip(trip,ms,instant);if(pose)ui.worldMarker=pose;
 if(pose?.arrived){if(instant){ui.worldTrip=null;enterWorldPlace(id);}render(true);}
}
function drawWorldMarker(t){
 if(ui.screen!=='world')return;
 const el=document.querySelector('.world-traveler'),root=document.querySelector('.world-landmarks');if(!el||!root)return;
 let p=ui.worldMarker;
 if(!p){const pt=WORLD_NAV.waypoints[ui.worldAt||state?.worldLocation]||WORLD_NAV.waypoints.atelier;p={x:pt[0]*100,y:pt[1]*100,facing:'down',frame:0};}
 el.style.left=p.x+'%';el.style.top=p.y+'%';
 const viewport=el.closest('.world-map-viewport');
 if(viewport&&(ui.worldTrip||!viewport.dataset.centered||viewport.dataset.zoom!==String(ui.worldZoom||1)||viewport.dataset.size!==viewport.clientWidth+':'+viewport.clientHeight)){viewport.dataset.centered='true';viewport.dataset.size=viewport.clientWidth+':'+viewport.clientHeight;viewport.dataset.zoom=String(ui.worldZoom||1);const v=viewport.getBoundingClientRect(),m=el.getBoundingClientRect(),pad=64;let dx=0,dy=0;if(m.left<v.left+pad)dx=m.left-v.left-pad;else if(m.right>v.right-pad)dx=m.right-v.right+pad;if(m.top<v.top+pad)dy=m.top-v.top-pad;else if(m.bottom>v.bottom-pad)dy=m.bottom-v.bottom+pad;viewport.scrollLeft+=dx;viewport.scrollTop+=dy;}
 const ctx=el.getContext('2d');ctx.clearRect(0,0,128,128);ctx.imageSmoothingEnabled=true;
 drawActor(ctx,'yeoni',{x:64,y:122,size:128,state:ui.worldTrip&&!ui.worldTrip.complete?'walk':'idle',facing:p.facing,animationFrame:p.frame,t,reducedMotion:motionPreference.matches});
}
// ── 명령
let repaySeq = 0;
function run(cmd, { keepQuiet = false } = {}) {
  if (!state) return { ok: false };
  const checkoutDraft=state.interior.draft?.checkoutPreview||cmd.type==='interior.checkoutPreview';
  const helperId=ui.delegate && helperAvailable(state,ui.delegate,cmd.type)?ui.delegate:null;
  const r = dispatch(state, helperId?{...cmd,helperId}:cmd);
  handleEvents(r.events);
  sound(r.ok ? cmd.type.startsWith('farm.')?'farm':cmd.type.startsWith('bond.')?'bond':'good' : 'bad');
  if (!r.ok) {
    if (!keepQuiet) toast((r.reasons?.length ? r.reasons : [r.reason || '할 수 없습니다']).join(' / '), 'bad');
  } else if(!checkoutDraft||cmd.type==='interior.apply'){
    recordWallClock(state, Date.now());
    save();
  }
  render(true);
  return r;
}

function startNew() {
  if(state || novelActive())return;
  state = HOST_DEMO?createHostDemo():createGame({ dev: DEV, seed: (Date.now() % 2147483647) | 0 });
  ui.worldAt='atelier';
  recordWallClock(state, Date.now());
  ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null; ui.credits = false;
  save();
  if(HOST_DEMO){ui.guideId='host';ui.guideStep=0;ui.guideReturn={kind:null};ui.sheet={kind:'tutorial'};return;}
  // 새 게임은 프롤로그부터. 영업 준비 화면이라 그동안 시간은 흐르지 않는다.
  const started=state;
  const finishPrologue=()=>{if(state!==started)return;run({type:'story.seen',id:'prologue'},{keepQuiet:true});toast('새 게임 · 토끼 자매와 첫 영업을 준비해요','good',3200);};
  playNovel(PROLOGUE, { onEnd:finishPrologue, onCancel:finishPrologue });
}

function goTitle() {
  if (state && (state.mode === 'shift' || state.mode === 'hunt') && !state.paused) dispatch(state, { type: 'pause' });
  save();
  history.replaceState({},'',location.pathname+location.search);
  ui.screen=null; state = null; ui.sheet = null; ui.selectedSlot = null; ui.recruitEvent = null; ui.ending = null; ui.credits = false;
}

// 달 이야기·결말: id → 박자
function storyBeats(id) {
  if (id.startsWith('ending:')) return ENDINGS[id.slice(7)]?.beats || null;
  if (id.startsWith('bond:')) { const [, who, k] = id.split(':'); return BOND_STORIES[who]?.[Number(k) - 1] || castBondStory(who,Number(k)); }
  if (id.startsWith('branch:')) return branchStory(Number(id.slice(7)));
  if (id.startsWith('ev:')) return EVENT_STORIES[id] || null;
  if (id.startsWith('hanbi:')) return HANBI_STORIES[id.slice(6)] || null;
  if (id.startsWith('rate:')) return RATE_STORIES[id.slice(5)] || null;
  if (/^(warn|ultimatum|relief):/.test(id)) return creditorStory(id, state.ledger);
  if (id.startsWith('season:')) return seasonStory(Number(id.slice(7)), state);
  return careerMonthStory(Number(id.slice(1)), state);
}

// 영업 준비 화면에서 아직 안 본 이야기가 있으면 한 번 튼다. 본 기록은 엔진 명령(story.seen)으로만 남긴다.
function maybeStory() {
  if (!state || ui.storyHold || novelActive() || ui.confirm || ui.discovery || ui.recruitEvent || ui.ending || state.interior.draft || ui.sheet?.kind === 'rankup') return; // 랭크 업 카드를 닫으면 해방 이야기로 잇는다
  // 배드 엔딩 저장: 결말을 본 뒤에는 영업 화면 대신 결말 창(새 게임·다시 보기·크레딧)만 남긴다
  if (state.calendar?.endingId === 'bad' && state.ledger.story['ending:bad']) { ui.sheet = null; ui.ending = 'bad'; render(true); return; }
  const id = pendingStory(state);
  if (!id) return;
  if (id === 'ev:forge' && (ui.sheet || ui.worldTrip)) return; // 금융 센터 볼일을 마치고 창을 닫으면 공방 이야기로 잇는다
  const beats = storyBeats(id);
  if (!beats) { run({ type: 'story.seen', id }, { keepQuiet: true }); return; }
  ui.sheet = null;
  const started=state;let ended=false;
  const done = (skip=false) => {if(ended||state!==started)return;ended=true;ui.storyHold=true;try{const result=completeStory(id,cmd=>run(cmd),{skip});if(result.ok&&!result.duplicate&&result.destination==='hunt'){navigateScreen(result.entry?.ok?null:'world');ui.sheet=result.entry?.ok?null:{kind:'hunt'};ui.huntMenu='title';} if(result.ok&&!result.duplicate&&(result.destination==='finance'||result.destination==='gear'))goStoryPlace(result.destination); if(result.ok&&!result.duplicate&&result.destination==='fortune'){loadFortuneBirth();ui.sheet={kind:'fortune'};} if (result.ok&&id.startsWith('ending:')) ui.ending = id.slice(7);}finally{ui.storyHold=false;} render(true); }; // 끝난 이야기의 행선지를 다 열 때까지 다음 이야기를 틀지 않는다
  // 이야기 속 선택지는 분위기용: 상태를 바꾸지 않고 고른 답의 박자만 잇는다. 건너뛰어도 본 것으로 친다.
  const onChoose = (cid, beat) => ({ ok: true, beats: beat?.choices?.find(c => c.id === cid)?.beats || [] });
  playNovel(beats, { onEnd:()=>done(false), onCancel:()=>done(true), onChoose });
}

// 운세 수첩의 생일은 게임 저장이 아니라 이 기기에만, 사용자가 기억하기를 켰을 때만 둔다
function loadFortuneBirth(){try{const v=localStorage.getItem(FORTUNE_BIRTH_KEY);if(v){ui.fortuneBirth=v;ui.fortuneRemember=true;}}catch{}}
function keepFortuneBirth(){try{if(ui.fortuneRemember&&ui.fortuneBirth)localStorage.setItem(FORTUNE_BIRTH_KEY,ui.fortuneBirth);else localStorage.removeItem(FORTUNE_BIRTH_KEY);}catch{}}

// 이야기가 가리킨 마을 장소로 바로 데려간다(도착 처리는 world.arrive). 공방은 강화 탭을 연다.
function goStoryPlace(id){
  if(navigateScreen('world')===false)return;
  if(id==='gear')run({type:'town.visit',place:'gear'},{keepQuiet:true}); // 첫 강화 이야기가 공방 소개를 대신한다
  enterWorldPlace(id);
  if(id==='gear'&&ui.worldAt==='gear'){ui.sheet={kind:'armory'};ui.armoryTab='upgrade';}
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
  const id = isEnded(state) ? `ending:${state.calendar.endingId}` : `m${calendarOf(state.day, state.calendar?.turnsPerMonth || 3).monthIdx}`;
  const beats = storyBeats(id);
  if (beats) { ui.sheet = null; playNovel(beats, { onEnd: () => render(true) }); }
}

const n = v => Number(v);
// data-action → 처리. 엔진 명령은 같은 이름을 쓰고, 화면 전용 동작(시트·확인창·저장)은 여기서만 처리한다.
const ACTIONS = {
  'world.close': () => navigateScreen(null),
  'world.back': () => navigateScreen(ui.questReturn==='world'?'world':null),
  'world.select': d => {if(ui.worldTrip||!WORLD_PLACES.some(p=>p.id===d.id))return;ui.worldPlace=d.id;ui.worldCardOpen=true;requestAnimationFrame(()=>document.querySelector('.world-card-close')?.focus());},
  'world.card.close':()=>{ui.worldCardOpen=false;requestAnimationFrame(()=>document.querySelector('.world-node[data-id="'+ui.worldPlace+'"]')?.focus());},
  'world.zoom': d => {ui.worldZoom=Math.max(1,Math.min(2.5,(ui.worldZoom||1)+Number(d.delta)));},
  'world.travel.cancel':()=>{ui.worldTrip=null;ui.worldMarker=null;},
  'world.travel.skip':()=>{if(ui.worldTrip)ui.worldTrip.skip=true;},
  'world.quests': () => {ui.questReturn='world';ui.questDetail=false;navigateScreen('quests');},
  'quest.host': d => {ui.questHost=d.id;ui.questId=null;ui.questDetail=false;},
  'quest.select': d => {ui.questId=d.id;ui.questDetail=true;},
  'quest.list': () => {ui.questDetail=false;},
  'world.enter': d => {
    if(ui.worldTrip)return;
    const p=WORLD_PLACES.find(p=>p.id===d.id);if(!p)return;
    const lock=placeLock(state,p.id)||(p.id!=='atelier'&&!townCheck(state).ok?townCheck(state).reason:'');if(lock){toast(lock);return;}
    ui.worldCardOpen=false;
    const at=WORLD_PLACES.some(x=>x.id===(ui.worldAt||state.worldLocation))?(ui.worldAt||state.worldLocation):'atelier';
    if(at===p.id){enterWorldPlace(p.id);return;}
    const path=worldRoute(WORLD_NAV,at,p.id);if(!path){toast('이동 경로를 찾지 못했어요.');return;}
    ui.worldTrip=createWorldTrip(p.id,path);ui.worldMarker={...path[0],facing:'down',frame:0};
  },
  'cafe.areaInfo':()=>{if(state.mode!=='prep'){toast('영업을 마친 뒤 꾸미기에서 새 구역을 열 수 있어요.');return;}ACTIONS['decor.open']({tab:'expand'});},
  'cafe.drawer':d=>{ui.cafeDrawer=ui.cafeDrawer===d.tab?null:d.tab;ui.tablePop=null;requestAnimationFrame(()=>document.querySelector('.cafe-drawer:not([hidden]) header button')?.focus());},
  'cafe.drawer.close':()=>{const tab=ui.cafeDrawer;ui.cafeDrawer=null;requestAnimationFrame(()=>document.querySelector('.cafe-actions [data-tab="'+tab+'"]')?.focus());},
  'table.close': () => {ui.tablePop=null;},
  'table.firstDirty': () => {const t=state.tables.find(t=>t.state==='dirty');if(t)ui.tablePop={no:t.no};},
  'dress.who': d => { ui.dressWho = d.who; ui.dressPreview = null; ui.dressLine = null; },
  'dress.slot': d => { ui.dressSlot = d.slot; ui.dressPreview = null; ui.dressLine = null; },
  'dress.direction': d => { ui.dressDirection = d.dir; },
  'dress.pose': () => { ui.dressPose = ui.dressPose === 'host' ? 'idle' : 'host'; },
  'dress.preview': d => { ui.dressPreview = d.id; ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'preview'); },
  'outfit.unlock': d => { if (run({ type: 'outfit.unlock', id: d.id }).ok) ui.dressLine = outfitLine(ui.dressWho || 'neo', d.id, stressStage(state), 'unlock'); },
  'hunt.hunter': d => {if(hunterUnlocked(state,d.id))ui.hunterId=d.id;},
  'hunt.fuse.confirm':d=>{const p=kfpFusionPreview(state.hunt,d.id);if(!p.ok)return toast(p.reason);ui.confirm={title:KFP_WEAPONS[p.output].name+' 조합',text:p.inputs.map(i=>KFP_WEAPONS[i.id].evolve.name).join(' + ')+'를 소모해요. 재료의 진화 공격도 함께 이어져요.',yesLabel:'조합 확정',onYes:()=>run({type:'hunt.fuse',id:d.id,revision:n(d.revision)})};},
  'hunt.trail':d=>{const r=run({type:'hunt.trail',choice:d.choice});if(r?.ok)ui.sheet=null;},
  'hunt.petal':()=>run({type:'hunt.petal'}),
  'hunt.map':()=>{ui.huntMap=!ui.huntMap;},
  'hunt.stage': d => {ui.huntStage=n(d.depth);},
  'hunt.menu': d => {ui.huntMenu=d.menu;},
  'armory.enhance': d => run({type:'armory.enhance',who:d.who,id:d.id}),
  'armory.learn': d => run({type:'armory.learn',id:d.id}),
  'armory.tech': d => run({type:'armory.tech',line:d.line,id:d.id}),
  'armory.buy': d => run({type:'armory.buy',id:d.id}),
  'hunt.supply': d => run({type:'hunt.supply',id:d.id}),
  'chatter.close':()=>{ui.chatter=null;},
  'audio.change': d => audioAction(d.key,d.value),
  'guide.select': d => {ui.guideId=d.id;ui.guideStep=0;ui.sheet={kind:'tutorial'};},
  'guide.next':()=>{const g=GUIDES[ui.guideId||'cook'];if((ui.guideStep||0)<g.steps.length-1)ui.guideStep=(ui.guideStep||0)+1;else finishGuide(true);},
  'guide.back':()=>{ui.guideStep=Math.max(0,(ui.guideStep||0)-1);},
  'guide.close':()=>finishGuide(),
  'fortune.flip':()=>{ui.fortuneFlip=true;},
  'hunt.start': () => { ui.sheet = { kind: 'hunt' }; },
  // 10-29 사냥터 전체화면: 페이지 전체를 띄우고, 다시 누르면 창 모드로
  'hunt.fullscreen': () => { const on=!document.fullscreenElement;const p=on?document.documentElement.requestFullscreen({navigationUI:'hide'}):document.exitFullscreen();ui.huntFullscreen=on;p?.catch?.(()=>toast('이 브라우저에서는 전체화면을 열 수 없어요.','bad')); },
  'hunt.depart': async d => { if(ui.huntLoading)return;ui.huntLoading=true;const departing=state;try{const keys=[...Object.keys(ASSETS.enemies).map(id=>'enemies/'+id),'actors/neo_cat','actors/seohanbi'];await loadAssetImages(undefined,{keys});if(state!==departing||ui.sheet?.kind!=='hunt')return;if(keys.some(id=>!imageFor(id))){toast('사냥터 그림을 불러오지 못했어요. 연결을 확인하고 다시 출발해 주세요.');return;}if (run({ type: 'hunt.start', depth: n(d.depth), hunterId:ui.hunterId||'neo' }).ok) ui.sheet = null;}finally{ui.huntLoading=false;render(true);} },
  'farm.select': d => { ui.farmCrop = d.id; },
  'farm.plot': d => { ui.farmPlot = n(d.index); },
  'world.delegate': d => {ui.delegate=ui.delegate===d.id?null:d.id;},
  'farm.plant': d => run({ type: 'farm.plant', cropId: d.id, index: n(d.index) }),
  'farm.water': d => run({ type: 'farm.water', index: n(d.index) }),
  'farm.tend': d => run({ type: 'farm.tend', index: n(d.index) }),
  'farm.harvest': d => run({ type: 'farm.harvest', index: n(d.index), cropInstanceId: d.id }),
  'farm.careAll': () => run({ type: 'farm.careAll' }),
  'farm.harvestAll': () => run({ type: 'farm.harvestAll' }),
  'farm.expand': () => run({ type: 'farm.expand' }),
  'farm.greenhouse': () => run({ type: 'farm.greenhouse' }),
  // 화면 전용
  'sheet.open': d => { if(d.sheet==='worldcast'&&!worldMeetingAccess(state).unlocked){toast(worldMeetingAccess(state).hint);return;} if(d.sheet==='interior'||d.sheet==='grounds'){ACTIONS['decor.open']({space:d.sheet==='grounds'?'outdoor':''});return;}if(d.sheet==='town'&&state?.mode==='shift'){toast(ISLAND_SHIFT_LOCK);return;}if(d.sheet==='town'&&!d.tab){navigateScreen('world');return;}if(d.sheet==='quests'){ui.questReturn=ui.screen==='world'?'world':null;ui.questDetail=false;navigateScreen('quests');return;}ui.tablePop=null;ui.sheet = { kind: d.sheet, tab: d.tab, no:n(d.no) }; if (d.sheet === 'hunt') ui.huntMenu = d.menu || 'title'; if (d.sheet === 'fortune') loadFortuneBirth(); if (d.sheet === 'town' && d.tab) maybeVisit(d.tab); },
  'town.tab': d => { if (ui.sheet) ui.sheet.tab = d.tab; maybeVisit(d.tab); },
  'sheet.close': () => { if(ui.sheet?.kind==='tutorial')finishGuide();else ui.sheet = ui.sheet?.kind==='rankup'?ui.sheet.back:null; },
  'overlay.settlement': () => {},
  'overlay.hunt': () => {},
  'confirm.yes': () => { const cf = ui.confirm; ui.confirm = null; cf?.onYes(); },
  'confirm.no': () => { ui.confirm = null; },
  'recruit.event': d => {
    if(!townCheck(state).ok||recruitView(state).find(x=>x.id===d.id)?.status!=='available'){toast('만남 시기와 조건을 먼저 확인해 주세요.');return;}
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

  'game.room':()=>{if(state)save();ui.gameRoom=true;},
  'game.room.close':()=>{ui.gameRoom=false;},
  'lore.open':()=>{ui.loreBook='cast';},
  'lore.tab':d=>{ui.loreBook=d.tab==='story'?'story':'cast';},
  'lore.close':()=>{ui.loreBook=null;},
  'game.install':()=>installApp(),
  'game.wake':()=>{ui.exited=false;},
  'game.exit':()=>{if(state&&(!storageOk||!saveGame(storage,SAVE_KEY,state).ok)){toast('저장을 완료하지 못했어요. 종료 전에 저장 상태를 확인해 주세요.','bad');return;}ui.exitSaved=!!state;goTitle();ui.exited=true;if(audioStatus().music)audioAction('music');if(window.opener)window.close();},
  'game.continue': () => {
    if(state || novelActive())return;
    const r = loadGame(storage, SAVE_KEY);
    if (!r.ok) { toast(r.reason, 'bad'); return; }
    state = r.state;
    if(HOST_DEMO&&state.meta?.hostDemo)dispatch(state,{type:'hostDemo.prepare'});
    ui.worldAt=WORLD_PLACES.some(x=>x.id===state.worldLocation)?state.worldLocation:'atelier';
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
  'credits.open': () => { ui.credits = true; },
  'credits.close': () => { ui.credits = false; },
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
    ui.cafeDrawer=null;ui.tablePop = { no };
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
  'neo.cafeForm':()=>{if(!state.tutorials?.catcafe){ui.guideReturn=ui.sheet||{kind:null};ui.guideId='catcafe';ui.guideStep=0;ui.guideAction='neo.cafeForm';ui.sheet={kind:'tutorial'};return;}run({type:'neo.cafeForm'});},
  'nomination.accept': d => {if(run({ type: 'nomination.accept', tableNo: n(d.no) }).ok)ui.sheet=null;},
  'nomination.decline': d => run({ type: 'nomination.decline', tableNo: n(d.no) }),
  'nomination.propose': d => run({ type: 'nomination.propose', tableNo: n(d.no), personId: d.person }),
  'counter.respond': d => run({ type: 'counter.respond', visitId: d.visit }),
  'help.respond': d => {if(run({ type: 'help.respond', visitId: d.visit, index: n(d.index), choice: d.choice }).ok)ui.sheet=null;},
  'cook': d => beginCraft(d.menu),
  'order.table':d=>{const orders=tableCookingOrders(state,n(d.no));if(!orders.length)return;beginCraft(orders[0].menuId,orders[0].id);ui.craft.tableNo=n(d.no);ui.craft.batchMenus=orders.map(o=>o.menuId);},
  'order.quick': d => {const o=state.orders[d.id];if(!o)return;if(state.tray.some(it=>it?.menuId===o.menuId&&!it.reservedFor&&(!it.orderId||it.orderId===o.id)))run({type:'order.quick',orderId:d.id});else beginCraft(o.menuId,d.id);},
  'craft.cancel':()=>{const gift=ui.craft?.purpose==='gift';ui.craft=null;ui.sheet=gift?{kind:'foodgift'}:null;},
  'craft.assist':()=>{if(ui.craft?.step===1)ui.craft.assist=!ui.craft.assist;},
  'craft.mix':()=>{const c=ui.craft;if(c&&!Object.keys(craftShortage(state,c.batchMenus||c.menuId)).length&&mixCraft(c))sound('cook');},
  // 부족한 만큼만 모카 긴급 배달(영업 중 배달비 포함). 구매는 재료마다 엔진 명령 한 번.
  'craft.restock':()=>{const c=ui.craft;if(!c)return;ui.deliveryCart=craftShortage(state,c.batchMenus||c.menuId);ui.deliveryReturn={kind:'craft'};ui.deliveryRequest='delivery-'+crypto.randomUUID();ui.sheet={kind:'delivery'};},
  'craft.heat':()=>{const c=ui.craft;if(!c||c.step!==1)return;const timing=craftHeat(c),quality=craftQuality(timing,c.menuId);const r=run(c.purpose==='gift'?{type:'gift.cook',menuId:c.menuId,timing,requestId:c.requestId}:c.tableNo?{type:'order.table',no:c.tableNo,timing}:c.orderId?{type:'order.quick',orderId:c.orderId,timing}:{type:'cook',menuId:c.menuId,timing});if(r.ok){sound('cook');c.step=2;c.jobId=r.jobId;c.jobIds=r.jobIds;c.quality=quality;c.timing=timing;c.perfect=quality==='완벽';toast(c.purpose==='gift'?'선물 조리를 시작했어요. 완성되면 선물 보관함에 담아요.':'조리를 시작했어요. 완성되면 픽업 선반에서 만나요.','good');}},

  'grounds.tab':d=>{ui.groundTab=n(d.id);ui.remodelPreview=null;},
  'grounds.begin':()=>run({type:'grounds.begin'}),
  'grounds.cancel':()=>run({type:'grounds.cancel'}),
  'grounds.apply':()=>run({type:'grounds.apply'}),
  'grounds.select':d=>{ui.groundItem=d.id;},
  'grounds.cell':d=>{const x=n(d.x),y=n(d.y);if(ui.groundItem){run({type:'grounds.move',id:ui.groundItem,x,y});return;}const hit=state.outdoor?.draft?.items.find(i=>{const g=gardenItem(i.id);return i.x!=null&&x>=i.x&&x<i.x+(g.width||1)&&y>=i.y&&y<i.y+(g.height||1);});if(hit)ui.groundItem=hit.id;},
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
  'play.cycle':()=>setPlaySpeed(ui.playSpeed===3?1:ui.playSpeed+1),
  'play.speed': d => setPlaySpeed(n(d.speed)),
  'finance.borrow': d => {const amount=n(d.amount);ui.confirm={title:`${amount.toLocaleString('ko-KR')}G를 빌릴까요?`,text:`월 이자 ${GAME_TEMP.LOAN_RATE*100}% · 다음 월말 이자 ${Math.ceil(amount*GAME_TEMP.LOAN_RATE).toLocaleString('ko-KR')}G가 추가됩니다. 미납 이자는 대출 원금에 더해져요.`,yesLabel:'조건 확인하고 빌리기',onYes:()=>run({type:'finance.borrow',amount,requestId:`loan-${Date.now()}-${++repaySeq}`})};},
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
  'editor.shop':()=>{ui.decorTab='shop';},
  'decor.close':()=>{if(decorDirty(state))askDecorDiscard();else closeDecor();},
  'decor.space':d=>{if(d.id==='outdoor'){if(state.interior.draft?.checkoutPreview)return;if(state.interior.draft?.itemBefore)run({type:'interior.cancelItem'},{keepQuiet:true});if(!state.outdoor?.draft&&!run({type:'grounds.begin'}).ok)return;}else ui.groundItem=null;ui.decorSpace=d.id==='outdoor'?'outdoor':'indoor';ui.decorArea=null;ui.groundExpand=false;resize();},
  'decor.tab':d=>{ui.decorTab=d.id;ui.decorArea=null;ui.groundExpand=false;resize();},
  'decor.theme':d=>{ui.decorTheme=d.id;},
  'decor.pick':d=>{const dr=state.interior.draft;if(dr?.itemBefore&&dr.selected!==d.uid)run({type:'interior.cancelItem'},{keepQuiet:true});if(run({type:'interior.pick',uid:d.uid}).ok){const f=state.interior.draft.furniture.find(x=>x.uid===d.uid);if(f?.x!=null)focusCell(f.x,f.y);else{const s=run({type:'interior.suggest',uid:d.uid,near:viewCenterCell()},{keepQuiet:true});if(s.ok)focusCell(s.x,s.y);}}}, // 보관함 가구는 고르자마자 추천 자리에 미리 올린다
  'decor.place':()=>{const uid=state.interior.draft?.selected;if(run({type:'interior.confirmItem'}).ok)toast(placedNote(state,uid),'good',2800);},
  'decor.rotate':()=>run({type:'interior.rotate',uid:state.interior.draft?.selected}),
  'decor.store':()=>run({type:'interior.store',uid:state.interior.draft?.selected}),
  'decor.deselect':()=>{if(ui.decorSpace==='outdoor'){ui.groundItem=null;return;}if(state.interior.draft?.itemBefore)run({type:'interior.cancelItem'},{keepQuiet:true});run({type:'interior.select',uid:null},{keepQuiet:true});},
  'decor.suggest':()=>{if(ui.decorSpace==='outdoor'){run({type:'grounds.suggest',id:ui.groundItem});return;}const dr=state.interior.draft,f=dr?.furniture.find(x=>x.uid===dr.selected);if(!f)return;const r=run({type:'interior.suggest',uid:f.uid,near:f.x==null?viewCenterCell():undefined});if(r.ok)focusCell(r.x,r.y);},
  'decor.undo':()=>run({type:ui.decorSpace==='outdoor'?'grounds.undo':'interior.undo'}),
  'decor.skipGuide':()=>run({type:'tutorial.seen',id:'decorate'},{keepQuiet:true}),
  'decor.apply':()=>{const dr=state.interior.draft;if(!dr)return;if(dr.itemBefore||!interiorPreview(state).ok){run({type:'interior.apply'});return;}if(state.outdoor?.draft&&!run({type:'grounds.apply'}).ok)return;if(run({type:'interior.apply'}).ok){if(!state.tutorials?.decorate)run({type:'tutorial.seen',id:'decorate'},{keepQuiet:true});ui.decorSpace='indoor';ui.groundItem=null;ui.decorArea=null;ui.groundExpand=false;resize();toast('🌸 꾸민 배치를 카페에 적용했어요','good');}},
  'decor.buy':d=>{if(!purchaseGate(ui,performance.now()))return;const r=run({type:'expand.decor',defId:d.def,currency:d.currency});if(r.ok)afterDecorBuy(r.uid);},
  'decor.buyTable':()=>{if(!purchaseGate(ui,performance.now()))return;const r=run({type:'expand.table'});if(r.ok)afterDecorBuy(r.uid);},
  'decor.area':d=>{ui.decorArea=ui.decorArea===d.id?null:d.id;resize();const a=AREAS.find(x=>x.id===ui.decorArea);if(a)focusCell((a.rect[0]+a.rect[2])/2,(a.rect[1]+a.rect[3])/2);},
  'decor.buyArea':d=>{if(!purchaseGate(ui,performance.now()))return;if(run({type:'expand.area',id:d.id}).ok){const a=AREAS.find(x=>x.id===d.id);ui.decorArea=null;ui.decorTab='owned';ui.editTab='stored';resize();if(a)focusCell((a.rect[0]+a.rect[2])/2,(a.rect[1]+a.rect[3])/2);}},
  'decor.gardenBuy':d=>{if(!purchaseGate(ui,performance.now()))return;const r=run({type:'grounds.buy',id:d.id});if(r.ok&&!r.duplicate){ui.groundItem=d.id;ui.decorTab='owned';const s=run({type:'grounds.suggest',id:d.id},{keepQuiet:true});toast(s.ok?'구매 완료 · 추천 자리에 놓았어요. 격자를 눌러 옮길 수 있어요':'구매 완료 · 보관함에 있어요. 격자를 눌러 놓아 주세요','good',4200);}},
  'interior.nudge': d => run({ type: 'interior.nudge', uid: d.uid, dx: n(d.dx), dy: n(d.dy) }),
  'interior.rotate': d => run({ type: 'interior.rotate', uid: d.uid }),
  'interior.store': d => run({ type: 'interior.store', uid: d.uid }),
  'interior.place': d => run({ type: 'interior.place', uid: d.uid }),
  'moonstone.exchange': d => {const r=run({ type: 'moonstone.exchange', qty: d.qty === 'all' ? state.moonstone : n(d.qty) });if(r.ok)setExchangeQty(Math.min(ui.exchangeQty??0,state.moonstone||0));},
  // 환전 개수: 10·100·1000·전부 빠른 선택, ±1, 직접 입력(입력칸은 렌더가 값을 덮지 않아 직접 맞춘다)
  'exchange.pick': d => setExchangeQty(d.qty === 'all' ? state.moonstone || 0 : Math.min(n(d.qty), state.moonstone || 0)),
  'exchange.step': d => setExchangeQty(Math.max(1, Math.min(state.moonstone || 0, exchangeQty() + n(d.d)))),
  'gear.buy': d => run({ type: 'gear.buy', id: d.id }),
  'gear.equip': d => run({ type: 'gear.equip', slot: d.slot, id: d.id || null }),
  'expand.decor': d => run({ type: 'expand.decor', defId: d.def, currency: d.currency }),
  'expand.area': d => run({ type: 'expand.area', id: d.id }),
  // 자동화는 인연으로 열린 것만 켜진다(엔진이 거절하면 사유 토스트). 전체 자동은 플레이어 화면에 없다(시뮬 전용).
  'automation.toggle': d => { const r = run({ type: 'automation.toggle', ability: d.ability }); if (r.ok) toast(r.on ? `${ABILITIES[r.ability].label} 켬` : `${ABILITIES[r.ability].label} 끔 · 직접 할게요`, r.on ? 'good' : ''); },
  'staff.dayOff': d => { const r = run({ type: 'staff.dayOff', id: d.id }); if (r.ok) toast(r.on ? `${personName(state, r.id)}은(는) 다음 영업에 쉬어요 · 결산 때 크게 회복` : `${personName(state, r.id)} 휴무 취소`); },
  'stress.shelter': d => run({ type: 'stress.shelter', id: d.id }),
};
for (const t of ['shift.start', 'settlement.close', 'pause', 'resume', 'fever.activate', 'interior.begin', 'interior.cancel', 'interior.apply',
  'hunt.retreat', 'hunt.finish', 'hunt.next', 'hunt.chest', 'expand.table', 'stage.perform', 'concert.hold']) ACTIONS[t] = () => run({ type: t });
ACTIONS['shift.start']=()=>{if(!state.tutorials?.opening){ui.guideReturn={kind:null};ui.guideId='opening';ui.guideStep=0;ui.guideAction='shift.start';ui.sheet={kind:'tutorial'};return;}if(run({type:'shift.start'}).ok){ui.cafeDrawer=null;ui.tablePop=null;ui.sheet=null;}};
// 카페 꾸미기 진입점은 하나다. 월드맵(sheet.open town)을 거치지 않는다.
ACTIONS['decor.open']=(d={})=>{const was=!!state?.interior.draft;if(!run({type:'interior.begin'}).ok)return;if(!was){history.pushState({yeoniScreen:null,yeoniEditor:true},'',location.pathname+location.search);ui.editTab='all';ui.editCategory='all';ui.editSearch='';ui.groundItem=null;ui.groundExpand=false;ui.decorArea=null;ui.decorSpace='indoor';ui.decorTab='owned';}ui.sheet=null;ui.screen=null;ui.cafeDrawer=null;ui.tablePop=null;if(d.tab)ui.decorTab=d.tab;if(d.space==='outdoor')ACTIONS['decor.space']({id:'outdoor'});};
ACTIONS['interior.begin']=()=>ACTIONS['decor.open']();
ACTIONS['interior.checkoutPreview']=()=>{const was=!!state?.interior.draft;if(run({type:'interior.checkoutPreview'}).ok){if(!was)history.pushState({yeoniScreen:null,yeoniEditor:true},'',location.pathname+location.search);ui.sheet=null;ui.screen=null;ui.cafeDrawer=null;ui.editTab='all';ui.editCategory='all';ui.editSearch='';}};
ACTIONS['hunt.pick'] = d => run({ type: 'hunt.pick', index: n(d.index) });
ACTIONS['workshop.tab']=d=>{ui.armoryTab=d.id;};
ACTIONS['workshop.quest']=d=>run({type:'workshop.quest',id:d.id,action:d.mode});
ACTIONS['yun.quest']=()=>run({type:'yun.quest'});
ACTIONS['farm.delegate']=()=>run({type:'farm.delegate'});
// 인연 대화: 질문 장면 안에서 바로 답을 고른다(별도 선택 창 없음). 답을 고르기 전에 닫으면 행동력을 쓰지 않는다.
ACTIONS['bond.talk'] = d => {
  const chk=talkCheck(state,d.id);if(!chk.ok){toast(chk.reason,'bad');return;}
  const q=bondQuestion(state,d.id);if(!q)return;
  const back=ui.sheet,name=bondName(state,d.id),masked=bondMasked(state,d.id),face=masked?'seohanbi_tiger:shadow':null,who=masked?'shadow_tiger':d.id;ui.sheet=null;render(true);
  let up=null;const reopen=()=>{const to=back||{kind:'companions'};ui.sheet=up?{kind:'rankup',up,back:to}:to;render(true);};
  playNovel([{chapter:[name+' · '+q.phase,q.title],bg:'atelier_dark',l:'yeoni:normal',c:face||d.id+':normal',r:null},{s:'nar',t:q.intro},
    {s:d.id,t:q.question,choices:q.answers.map(x=>({id:x.id,text:x.text})),guide:!state.tutorials?.bondtalk}],{
    onGuideSeen:()=>run({type:'tutorial.seen',id:'bondtalk'},{keepQuiet:true}),
    onChoose:choiceId=>{const r=run({type:'bond.talk',id:d.id,choiceId,token:q.token},{keepQuiet:true});if(!r.ok)return r;
      up=r.rankUp;const beats=[{bg:'atelier_lit',l:'yeoni:smile',c:face||d.id+':smile',s:who,t:r.line},{s:'sys',t:'인연 +'+r.gain+' · 오늘의 대화가 마음에 남았습니다.'}];
      if(up)beats.push({s:'sys',t:'✦ RANK UP · '+withWa(name)+'의 인연이 깊어졌다 · Rank '+up.rank+(up.perk?' · 능력 해방: '+up.perk:'')});
      else if(bondReady(state,d.id))beats.push({s:'sys',t:'✦ 다음 대화에서 마음이 통하는 답을 고르면 인연 랭크가 오릅니다.'});
      return {ok:true,beats};},
    onEnd:reopen,
    onCancel:()=>{reopen();toast('대화를 다음으로 미뤘어요 · 행동력은 쓰지 않았어요');}});
};
let giftRequestSeq=0;
ACTIONS['delivery.open']=()=>{ui.deliveryCart={};ui.deliveryReturn=null;ui.deliveryRequest='delivery-'+crypto.randomUUID();ui.sheet={kind:'delivery'};};
ACTIONS['delivery.close']=()=>{ui.sheet=ui.deliveryReturn||null;ui.deliveryReturn=null;};
ACTIONS['delivery.qty']=d=>{ui.deliveryCart??={};const qty=Math.max(0,Math.min(99,(ui.deliveryCart[d.id]||0)+n(d.delta)));if(qty)ui.deliveryCart[d.id]=qty;else delete ui.deliveryCart[d.id];ui.deliveryRequest='delivery-'+crypto.randomUUID();};
ACTIONS['delivery.bundle']=d=>{ui.deliveryCart??={};for(const [id,q] of Object.entries(bundleItems(state,d.id)))ui.deliveryCart[id]=Math.min(99,(ui.deliveryCart[id]||0)+q);ui.deliveryRequest='delivery-'+crypto.randomUUID();};
ACTIONS['delivery.clear']=()=>{ui.deliveryCart={};ui.deliveryRequest='delivery-'+crypto.randomUUID();};
ACTIONS['delivery.order']=()=>{ui.deliveryRequest??='delivery-'+crypto.randomUUID();const result=run({type:'shop.deliver',items:{...ui.deliveryCart},requestId:ui.deliveryRequest});if(result.ok){ui.deliveryCart={};ui.deliveryRequest=null;ui.sheet=ui.deliveryReturn||null;ui.deliveryReturn=null;toast('모카 배달 도착 · 재료값 '+result.base+'G + 배달비 '+result.fee+'G','good');}};
ACTIONS['yeoni.kitchen']=()=>{ui.giftRecipient=null;ui.foodFilter='all';ui.sheet={kind:'foodgift'};};
ACTIONS['yeoni.title']=d=>run({type:'yeoni.title',id:d.id});
ACTIONS['yeoni.register']=d=>{if(run({type:'yeoni.menu.register',menuId:d.menu}).ok)toast('카페 메뉴에 등록했어요. 다음 손님부터 주문할 수 있어요.','good');};
ACTIONS['bond.read']=d=>{const key='bond:'+d.id+':'+d.tier;if(state.mode!=='prep'||!state.ledger.story[key])return;const story=storyBeats(key);if(!story)return;const back=ui.sheet;ui.sheet=null;playNovel(story,{onEnd:()=>{ui.sheet=back;render(true);},onCancel:()=>{ui.sheet=back;render(true);}});};
ACTIONS['world.companion']=d=>{if(state.roster[d.id]&&BONDS[d.id]){ui.companionId=d.id;ui.sheet={kind:'companions'};}};
ACTIONS['companion.select']=d=>{if(BONDS[d.id])ui.companionId=d.id;};
ACTIONS['rankup.close']=()=>{ui.sheet=ui.sheet?.kind==='rankup'?ui.sheet.back:null;};
ACTIONS['gift.back']=()=>{ui.companionId=ui.giftRecipient;ui.sheet={kind:'companions'};};
ACTIONS['gift.open']=d=>{ui.giftRecipient=d.id;ui.foodFilter='all';ui.sheet={kind:'foodgift'};};
ACTIONS['gift.filter']=d=>{ui.foodFilter=d.id;};
ACTIONS['gift.prepare']=d=>{ui.craft={...newCraft(d.menu),purpose:'gift',requestId:'gift-'+Date.now()+'-'+(++giftRequestSeq)};ui.sheet={kind:'craft'};};
// 선물 요리는 타이밍 단계 없이 바로 조리 장면으로 간다(품질은 언제나 가운데 값)
ACTIONS['gift.watch']=()=>{const j=state.foodGifts?.job;if(j){ui.craft={...newCraft(j.menuId),purpose:'gift',step:2,jobId:j.id,quality:({normal:'보통',good:'좋음',perfect:'완벽'})[j.quality],timing:null};ui.sheet={kind:'craft'};}};
ACTIONS['gift.confirm']=d=>{const it=state.foodGifts?.items.find(i=>i.id===d.item);if(!it)return;const taste=foodPreference(d.id,it.menuId);ui.confirm={title:GIFT_BONDS[d.id].name+'에게 선물할까요?',text:MENUS[it.menuId].name+' 1개 · '+taste.label+' · 인연 +'+taste.gain,yesLabel:'선물 전하기',noLabel:'고르던 음식 유지',onYes:()=>{const r=run({type:'gift.food',id:d.id,itemId:d.item});if(r.ok){toast(r.line,'good',4500);}}};};
ACTIONS['gift.cancelConfirm']=d=>{ui.confirm={title:'선물 조리를 취소할까요?',text:'사용한 재료는 한 번 돌려받고 음식은 완성되지 않아요.',yesLabel:'조리 취소',onYes:()=>run({type:'gift.cancel',id:d.id})};};
ACTIONS['bond.gift'] = d => {const b=BONDS[d.id],g=d.gift===b?.gift.id?b.gift:d.gift===COMMON_GIFT.id?COMMON_GIFT:null;if(!g)return;ui.confirm={title:b.name+'에게 선물할까요?',text:g.name+' · '+g.cost+'G · 이번 순 선물 1회 사용',yesLabel:'구매해서 선물',onYes:()=>run({type:'bond.gift',id:d.id,giftId:d.gift})};};

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
  if (!state && !action.startsWith('game.') && !action.startsWith('confirm.') && !action.startsWith('audio.') && !action.startsWith('lore.')) return;
  unlockAudio(); sound('tap');
  fn(b.dataset);
  render(true);
});

document.addEventListener('input',e=>{if(e.target.matches('[data-editor-search]')){ui.editSearch=e.target.value;render(true);}});

// 인테리어 편집: 캔버스를 눌러 가구 고르기 / 고른 가구를 그 칸으로 옮기기
el.canvas.addEventListener('click', e => {
  const draft = state?.interior?.draft;
  if (!draft || !view || ui.decorSpace==='outdoor' || performance.now()<(ui.suppressCanvasClickUntil||0)) return;
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
    // 실제로 접시를 내려놓은 직원이 말한다(없으면 기본 담당).
    const server=e.type==='served'&&Object.values(state?.staff||{}).find(s=>s.servicePose?.tableNo===e.tableNo&&s.action==='serve')?.id,who=CAFE_LINES[server]?server:speaker;
    if(who && state?.mode==='shift'&&!events.some(x=>x.type==='guestChatter'))staffTalk(ui.talk??=newTalk(),state,who,performance.now()); // 손님 말이 먼저, 직원은 대답으로
  }

  if (!events?.length) return;
  for (const ev of events) {
    if(['served','cooked','takeawayDone'].includes(ev.type))sound('cook');
    const soundKind={huntAttack:ev.weapon,huntHit:'hit',huntHurt:'hurt',huntDeath:'death',huntGem:'gem',huntPickup:'moon',huntLevelUp:'level',huntChest:'chest',huntEvolve:'level',huntEnemyAttack:'aura',feverOn:'level'}[ev.type];if(soundKind)sound(soundKind);
    if(ev.type==='huntEvent'&&ev.warn)sound('boss');
    const p = ev.tableNo != null ? tableAt(ev.tableNo) : null;
    switch (ev.type) {
      case 'yeoniLevelUp':toast('연이 Lv.'+ev.level+' · 성장 효과와 새 레시피를 주방에서 확인하세요.','good');break;
      case 'giftFoodReady':toast('선물 보관함에 완성된 음식을 담았어요.','good');break;
      case 'huntCritical': ui.critLine=(ui.critLine||0)+1;showCafeLine(CAFE_LINES.critical[ui.critLine%CAFE_LINES.critical.length],'영냥이','neo_cat');sound('level');break;
      case 'huntStageClear': if(ev.tired)showCafeLine(tiredLine(ev.hunterId),ev.hunterId==='seohanbi'?'서한비':'영냥이',ev.hunterId==='seohanbi'?'seohanbi':'neo_cat');break;
      case 'huntTreasureFound': toast('✦ 보물 상자 발견! 부수면 월정석이 쏟아져요','good',2600);if(state.hunt?.hunterId==='neo'){ui.chatter=null;ui.lastHuntChatter=0;showCafeLine('오늘은 일진이 좋군!','영냥이','neo_cat');}break;
      case 'huntObjectBroken': sound('gem');floater(cssW/2,cssH*.34,ev.treasure?`✦ 보물 상자! 월정석 ×${ev.reward}${ev.heal?' · 구운 생선':''}`:`✦ 월정석 ×${ev.reward} 발견!${ev.snack?' · 구운 생선 조각':''}`,'#6f63c9');if(ev.treasure)break;ui.lootLine=(ui.lootLine||0)+1;if(state.hunt?.hunterId==='neo'&&ui.lootLine%2===1)showCafeLine(CAFE_LINES.moonloot[(ui.lootLine>>1)%CAFE_LINES.moonloot.length],'영냥이','neo_cat');break;
      case 'huntEliteDown': if(state.hunt?.hunterId==='neo'){ui.eliteLine=(ui.eliteLine||0)+1;showCafeLine(CAFE_LINES.elitedown[ui.eliteLine%CAFE_LINES.elitedown.length],'영냥이','neo_cat');}break;
      case 'supplyGift': toast(ev.label,'good',3600);break;
      case 'neoGrowth': toast(`🌙 네오 성장 · 공감·대화·재미·외모가 오르고 사냥 체력 +${TEMP.CALENDAR.HIKE_NEO.huntHp}`,'good',3600);break;
      case 'guestChatter': if(state.mode==='shift'&&ev.customerId){guestTalk(ui.talk??=newTalk(),state,ev,performance.now(),Math.random());break;}showCafeLine(ev.line,ev.kind==='takeaway'?'포장 손님':ev.tableNo?`${ev.tableNo}번 손님`:'손님','customer'); break;
      case 'paidAtCounter': sound('coin'); floater(cssW/2,cssH*.78,`계산 +${ev.amount}G`,'#b07a12');break;
      case 'cafeLevelUp': sound('bond'); toast(`카페 Lv.${ev.level}! ${ev.apGain>0?`다음 순부터 마을 행동력 +${ev.apGain}`:'더 많은 손님과 새로운 취향이 찾아와요'}`,'good');break;
      case 'counterDemand': sound('bond'); break;
      case 'patronTip': {sound('coin');const c=state.customers?.[ev.customerId],pool=ELDER_LOOKS.includes(c?.look)&&ev.wealthId==='tycoon'?PATRON_TIP_LINES.elder:PATRON_TIP_LINES[ev.wealthId]||PATRON_TIP_LINES.generous;
        if(c&&state.mode==='shift')guestTalk(ui.talk??=newTalk(),state,{customerId:c.id,line:selectLine(pool,Math.random()),topic:'patronTip'},performance.now(),Math.random());
        floater(cssW/2,cssH*.72,`${ev.wealthId==='tycoon'?'대부호':'통큰'} 손님 팁 +${ev.tip}G`,'#c9962e');break;}
      case 'counterDemandDone': {const k=DEMAND_KINDS[ev.kind];sound('coin');toast(`${k.icon} ${k.done}${ev.tip?` · 팁 +${ev.tip}G`:''}`,'good',2400);break;}
      case 'takeawayDone': toast('포장 완료 · 손님이 계산대에서 받아 갔어요','good');break;
      case 'farmAction': ui.farmFeedback=ev.text;ui.farmMotion={kind:ev.kind,index:ev.index,cropId:ev.cropId,at:performance.now()};ui.farmAnimUntil=performance.now()+1800;toast(ev.text,'good');break;
      case 'shiftStart': ui.talk=newTalk(); sound('open'); startShiftMusic(); toast(`☀ ${dateLabel(state, ev.day)} 영업 시작 · 10:00`, 'good'); gagOnce('start', pickLine(GAG_SHIFT_START), 0); break;
      case 'closingStart': sound('close'); toast('🌙 마감 30초 전 · 새 손님은 받지 않아요. 남은 주문은 끝나도 매출로 잡혀요', '', 3600); sayTalk(ui.talk??=newTalk(),state,'luna_sis','설거지랑 청소, 시작할게요. 괜찮아요, 남은 주문도 끝까지 챙길게요.',performance.now()); break;
      case 'served': floater(p?.x??cssW/2, (p?.y??cssH*.75) - 10, '주문 완료', '#b07a12'); if (state.stats.served % 4 === 0) gagOnce('kitchen', pickLine(GAG_KITCHEN), 45000); break;
      case 'nominationRequest': toast(`💌 ${ev.tableNo}번 손님이 ${personName(state, ev.nominee)} 지명 요청 — 테이블을 눌러 확인`, 'good', 3600); break;
      case 'nominationAccepted': toast(`🫖 ${ev.tableNo}번 접대 시작 · 60초 전담`, 'good'); gagLines(ev.gag); break;
      case 'nominationConverted': toast(`${ev.tableNo}번: ${ev.why}`); break;
      case 'nominationProposed': toast(`${ev.tableNo}번에 ${personName(state, ev.personId)} 추천`); break;
      case 'helpOpen': navigator.vibrate?.([70, 40, 70]); toast(`❗ ${ev.tableNo}번: ${ev.label} — 테이블을 눌러 응답`, '', 3200); break;
      case 'helpDone': showHelpFeedback(ev); floater(p.x, p.y - 20, ev.gain > 0 ? `대화 +${ev.gain}` : `대화 ${ev.gain}`, '#3f74c9'); break;
      case 'helpMissed': showHelpFeedback({...ev,quality:'missed',gain:-1}); break;
      case 'feverOn': toast(ev.tycoon ? `대부호의 앙코르! 팁 ${ev.tip}G · 데스티노바 피버` : `🔥 피버! ${ev.tables.join('·')}번 테이블 정산 팁 2배`, 'good', 3200); shake(el.panel); break;
      case 'stageOn': toast(`🎤 카페 무대 · ${ev.performers.map(id => personName(state, id)).join('·')} · 30초 동안 손님이 꽃잎 지폐를 던져요`, 'good', 3200); sound('bond'); shake(el.panel); break;
      case 'stageThrow': if (p) floater(p.x, p.y - 24, `✿ +${ev.gold}G`, '#b5476b'); break;
      case 'stageOff': toast(`무대 끝 · 던져 준 ${ev.gold.toLocaleString('ko-KR')}G는 계산대에서 받아요`, 'good', 3000); break;
      case 'concertHeld': sound('level'); toast(`🎶 정기 콘서트 ${ev.seats}석 매진 · 티켓 +${ev.gold.toLocaleString('ko-KR')}G`, 'good', 3600); break;
      case 'fansGain': if (ev.tierUp) toast(`✦ ${personName(state, ev.id)} 인기 단계 「${ev.tierUp}」 · 지명과 팁이 늘어요`, 'good', 3200); break;
      case 'hostingSettled':
        toast(`${ev.tableNo}번 접대 정산 · 만족도 ${ev.H.toFixed(1)} ${ev.grade}${ev.capped ? ' (핵심 조건 상한)' : ''} · 지명료 ${ev.hostFee||0}G + 팁 ${ev.tip}G`, ev.H >= 60 ? 'good' : '', 3600);
        if (ev.tip > 0) floater(p.x, p.y - 30, `팁 +${ev.tip}G`, '#c0392b');
        break;
      case 'trayFull': toast('트레이가 가득 찼어요 — 서빙해서 칸을 비워 주세요', 'bad'); break;
      case 'cooked': {const p=cellToPx(view,8,1.4);floater(p.x,p.y,'✧','#b07a12');}toast('한 접시 완성! 금빛 "전달하기"를 눌러 손님께 전해요.','good');break;
      case 'cleaned': if(p)floater(p.x,p.y-12,'✧ 깨끗해요','#58734e');break;
      case 'cookCancelled': toast(`조리 취소: ${ev.reason}`, 'bad'); break;
      case 'leave': if (ev.reason === '음식을 오래 기다려 떠남' || ev.reason === '주문할 수 있는 메뉴가 없음') {toast(`😣 ${ev.tableNo}번 손님: ${ev.reason}`, 'bad');if(ev.reason==='음식을 오래 기다려 떠남')situationTalk(ui.talk??=newTalk(),state,'angryLeave',performance.now(),Math.random());} break;
      case 'learned': toast(`📖 새 레시피: ${ev.name}`, 'good'); break;
      case 'discovered': ui.discovery = ev.menuId; break;
      case 'comboMiss': toast(`🤔 ${ev.hint}`, '', 2600); break;
      case 'recruited': toast(`👥 ${ev.name} 영입 완료 · 다음 영업부터 접대 가능`, 'good', 3600); break;
      case 'reward': toast('🎁 보상을 받았습니다', 'good'); break;
      case 'repaid': toast(`💳 ${ev.amount}G 상환 · 남은 빚 ${ev.debt}G`, 'good'); gagOnce('repay', pickLine(GAG_CHEONGTOKKI_REPAY), 0); break;
      case 'bought': if (ev.delivery) { toast(ev.fee?`🛵 모카 긴급 배달 · 배달비 ${ev.fee}G 포함 ${ev.cost}G`:`🛵 모카 무료 배달 · 재료값 ${ev.cost}G`); gagOnce('delivery', pickLine(GAG_MOKA_DELIVERY), 20000); } else gagOnce('moka', pickLine(GAG_MOKA_BUY), 12000); break;
      case 'exchanged': toast(`⚖ 월정석 ${ev.qty}개 → ${ev.gold}G`, 'good'); gagOnce('luna', pickLine(GAG_LUNA_EXCHANGE), 8000); break;
      case 'placeUnlocked': toast(`🔓 ${ev.name}이 열렸어요`, 'good', 3600); break;
      case 'gearBought': toast(`🗡 ${ev.name} 구입 · 윤달의 무기 공방`, 'good'); gagOnce('stall', pickLine(GAG_GEAR_STALL), 8000); break;
      case 'expanded': if(!state.interior.draft)toast(`🪑 ${ev.tableNo}번 테이블을 들였어요 · 다음 영업부터 손님 자리가 늘어요`, 'good', 3600); break;
      case 'areaOpened': resize(); toast(`🔓 ${ev.name} 증축 완료 · 보유 가구를 새 공간에 놓아 보세요`, 'good', 3600); break;
      case 'decorBought': if(!state.interior.draft)toast(`📦 ${ev.name} 보관함에 도착 · 카페 꾸미기에서 놓아 주세요`, 'good'); break;
      case 'huntFinished': pixelFx(el.stage,'transform',{frames:8}); if ((ev.bag?.moonstone || 0) > 0) gagOnce('hunt', pickLine(GAG_HUNT_RETURN), 0); break;
      case 'huntStart': pixelFx(el.stage,'transform',{frames:8}); toast(`${hunterName(state.hunt.hunterId)}가 ${state.hunt.depth}단계로 출발했어요 · 보스를 쓰러뜨리면 클리어`, 'good'); break;
      case 'huntPickup': floater(cssW / 2, cssH * 0.4, `+${ev.name}`, '#7d86e8'); break;
      case 'huntHurt': if(!matchMedia('(prefers-reduced-motion: reduce)').matches)shake(el.stage); break;
      case 'skillLearned': toast(`📜 ${ev.name}을 배웠어요 · 다음 사냥부터 최대 Lv ${ev.cap}`, 'good', 3200); break;
      case 'techResearched': toast(ev.line==='evo'?`🔓 진화 비전 · ${ev.name} 연구 완료 (${ev.level}/${ev.max})`:`🔓 ${ev.name} ${ev.level}/${ev.max} · 무기 Lv ${ev.weapon} · 보조 Lv ${ev.passive}`, 'good', 3200); break;
      case 'huntEvolve': toast(`🌟 진화! ${ev.name}`, 'good', 3200); break;
      case 'achievement': toast(`🏅 업적 「${ev.name}」 · 월정석 +${ev.moon}`, 'good', 3600); break;
      case 'huntPower': toast(ev.label, 'good', 1800); break;
      case 'payrollPaid': toast(`동료 급여 ${ev.paid.toLocaleString('ko-KR')}G 지급${ev.arrears?` · 미지급 ${ev.arrears.toLocaleString('ko-KR')}G`:''}`);break;
      case 'interestCharged': toast(`💸 ${ev.month}월 이자 ${ev.due.toLocaleString('ko-KR')}G${ev.added ? ` · 골드가 모자라 ${ev.added.toLocaleString('ko-KR')}G는 빚에 붙었어요` : ' 납부'}`, ev.added ? 'bad' : '', 3600); break;
      case 'bondTalk': if (!novelActive()) toast(`${SPEAKERS[ev.speaker]?.name || ''}: ${ev.line} (친밀도 +${ev.gain})`, 'gag', 3600); break;
      case 'bondGift': toast(`🎁 ${bondName(state,ev.id)} 친밀도 +${ev.gain}${ev.liked ? ' · 좋아하는 선물이에요!' : ''}`, 'good'); break;
      case 'staffResting': toast(`😮‍💨 ${ev.name}이(가) 한계예요 · 이번 영업은 쉬고, 하던 일은 다른 사람에게 넘겨요`, 'bad', 3600); break;
      case 'handOver': toast(`${personName(state, ev.id)}이(가) 하던 ${ev.kind === 'deliver' ? '서빙' : '정리'}을 다른 사람에게 넘겼어요`, '', 2400); break;
      case 'shelterRest': toast(`🐰 루나의 쉼터 · ${ev.name} 스트레스 −${Math.round(ev.recovered)}`, 'good'); break;
      case 'farmDelegated': toast(`🐾 네오가 밭일을 마쳤어요 · 수확 ${ev.harvested} · 다시 심기 ${ev.planted} · 돌봄 ${ev.cared}${ev.stopped ? ' · ' + ev.stopped : ''}`, 'good', 3600); break;
      case 'farmDelegateSkipped': toast(`농장 맡기기는 이번엔 쉬어요 · ${ev.reason}`, '', 3000); break;
      case 'bondReady': if (!novelActive()) toast(`✦ ${withWa(bondName(state,ev.id))}의 인연이 깊어질 것 같다 · ${ev.wait ? '다음 달 ' : ''}대화하면 Rank ${ev.rank}`, 'good', 4000); break;
      case 'gameEnded': toast(ev.endingId === 'bad' ? '📜 청토끼 통첩 기한이 지났어요 · 결말이 열립니다' : '📜 마지막 결산 완료 · 결말이 열립니다', ev.endingId === 'bad' ? 'bad' : 'good', 3200); break;
      case 'milestoneMet': toast(`🤝 청토끼와의 약속 달성 · 원금의 ${Math.round(ev.share * 100)}% 상환 · 다음 달 이자 ${Math.round(ev.cut * 100)}% 감면`, 'good', 3600); break;
      case 'creditorWarning': toast(ev.milestone ? '✉️ 청토끼 경고 · 약속한 상환에 못 미쳤어요' : '✉️ 청토끼 경고 · 이번 달 상환이 이자보다 적었어요', 'bad', 3600); break;
      case 'creditorNotice': toast(ev.need ? '✉️ 청토끼 · 다음 달 분기 상환을 확인해 주세요' : '✉️ 청토끼 · 이번 분기 상환 목표를 채웠어요', ev.need ? 'bad' : 'good', 3600); break;
      case 'creditorUltimatum': toast(`🟥 청토끼 통첩 · ${ev.need.toLocaleString('ko-KR')}G 더 갚기 · ${ev.turns}순 안에`, 'bad', 4200); break;
      case 'ultimatumCleared': toast('🕊️ 청토끼 통첩 해제 · 경고가 0회로 돌아갔어요', 'good', 3600); break;
      case 'shiftClosed': ui.sheet = null; ui.selectedSlot = null; ui.chatter = null; save(); break; // 마감 화면을 가리는 영업 중 대사는 내린다
      default: break;
    }
  }
}

// ── 그리기

// 영업 마감 화면을 처음 열 때 결과 금액을 0부터 올려 보이고 축하음을 한 번 낸다.
function countUpSettlement(){
  const b=el.overlay.querySelector('.settle-amount[data-countup]');if(!b||ui.settleShown===b.dataset.shift)return;
  ui.settleShown=b.dataset.shift;const to=Number(b.dataset.countup)||0,final=b.textContent;sound(to>=0?'good':'bad');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!to)return;
  const t0=performance.now(),fmt=n=>(n>=0?'+':'−')+won(Math.abs(n));
  const step=t=>{if(!b.isConnected)return;const k=Math.min(1,(t-t0)/1100),e=1-(1-k)**3;b.textContent=k<1?fmt(Math.round(to*e)):final;if(k<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

function render(force = false) {
  const now = performance.now();
  document.body.dataset.mode=state?.mode||'title';
  document.body.dataset.editing=state?.interior?.draft?'true':'false';
  document.body.dataset.cafeFocus=['prep','shift'].includes(state?.mode)&&!state.interior.draft?'true':'false';
  if(!state||state.mode==='hunt')ui.screen=null;
  if(state?.mode!=='hunt')ui.huntMap=false;
  if(huntFullscreenEnds(state,ui,!!document.fullscreenElement)){ui.huntFullscreen=false;document.exitFullscreen?.()?.catch?.(()=>{});}
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
  document.getElementById('camera-controls').hidden=!state||state.mode==='hunt'||!!state.interior.draft&&ui.decorSpace==='outdoor';
  ui.tagAvoid=state&&state.mode!=='hunt'?domTagAvoid():null;
  const hunting=state?.mode==='hunt', h=state?.hunt;
  // 보스곡은 서한비(검은 호랑이) 전용. 일반 단계 보스는 깊이별 사냥곡
  const hanbiAlive=hunting&&getHuntWorld(state)?.enemies.items.slice(0,getHuntWorld(state).enemies.count).some(e=>e.type==='boss_hanbi');
  setAudioScene(novelActive()?'story':hunting?(h.status!=='running'?'huntResult':hanbiAlive?'huntBoss':h.depth>=55?'huntDeep':'hunt'):state?.fever?.activeUntil!=null?'fever':ui.sheet?.kind==='hunt'?'huntPrep':ui.sheet?.kind==='outfits'?'outfits':ui.screen==='world'?'world':!state?'title':ui.sheet?.kind||'cafe');
  const guide=guideForContext(state,ui);
  // 잠긴 농장·공방에서는 안내를 띄우지 않는다
  const guideLocked=guide==='farm'?placeLock(state,'farm'):guide==='armory'?placeLock(state,'gear'):'';
  if(state && ui.sheet?.kind!=='tutorial' && guide && !guideLocked && (guide!=='outfits'||state.hostbar.open) && !state.tutorials?.[guide] && !novelActive()){
    ui.guideReturn=ui.sheet||{kind:null};ui.guideId=guide;ui.guideStep=0;ui.guideAction=guide==='restock'?'delivery.open':null;ui.sheet={kind:'tutorial'};
  }
  const sh = sheetHtml(state, ui);
  el.sheetWrap.hidden = !sh;
  morph(el.sheet, sh);
  const ov = overlayHtml(state, ui);
  el.overlay.hidden = !ov;
  morph(el.overlay, ov);
  countUpSettlement();
  if (state?.mode === 'prep') maybeStory();
}

let lastHuntMapDraw = 0;
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
function draw(t) {
  drawNumbers(t);
  if(ui.craft?.step===1){const marker=document.querySelector('.heat-track i');if(marker)marker.style.left=craftHeat(ui.craft,t)+'%';}
  if (state && ui.sheet?.kind === 'farm') drawFarm(state, t, ui);
  if(ui.screen){drawInlinePortraits(t);drawWorldMarker(t);return;}
  if (state && ui.sheet?.kind === 'outfits') drawDressroom(state, ui, t);
  drawInlinePortraits(t);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true; // 고해상도 일러스트 축소
  if (state?.mode === 'hunt' && state.hunt) {
    if (ui.huntMap && t-lastHuntMapDraw>=250) { drawHuntMap(document.querySelector('.hunt-map-canvas'),getHuntWorld(state)); lastHuntMapDraw=t; }
    drawHunt(ctx, state, getHuntWorld(state), cssW, cssH, { t, reducedMotion:motionPreference.matches, joy: joystick.state.joy, rect: el.canvas.getBoundingClientRect() });
    return;
  }
  if (!state) { ctx.fillStyle = '#f3e6d6'; ctx.fillRect(0, 0, cssW, cssH); return; }
  const draft = state.interior.draft;
  let problemUids;
  if (draft) problemUids = new Set(interiorPreview(state).problems.map(p => p.uid).filter(Boolean));
  drawCafe(ctx, state, view, { selectedUid: draft?.selected ?? null, problemUids, focusArea: draft ? ui.decorArea : null, t, reducedMotion:motionPreference.matches, tagAvoid: ui.tagAvoid });
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
      const running = !ui.gameRoom && !state.paused && !['tutorial','kfp','trail'].includes(ui.sheet?.kind) && !novelActive() && (state.mode === 'shift' || state.mode === 'hunt'||state.mode==='prep'&&state.foodGifts?.job);
      if (running && raw > 0) {
        const dt = raw * (DEV && ui.speed!==1 ? ui.speed : state.mode==='shift'&&ui.sheet?.kind!=='craft'?ui.playSpeed:1); // 요리 타이밍 창이 열린 동안만 1배, 닫으면 고른 배속으로
        handleEvents(tick(state, dt, { input: joystick.state.move }));
        autosaveAcc += raw;
        if (autosaveAcc >= TEMP.AUTOSAVE_MS) { autosaveAcc = 0; recordWallClock(state, Date.now()); save(); }
      }
    }
    stepWorldTravel(raw);
    draw(now);
    if(state?.mode==='prep'&&!ui.screen&&!ui.sheet&&!state.interior.draft&&!novelActive())prepTalk(ui.talk??=newTalk(),state,performance.now());
    if(state?.mode==='shift'&&!ui.screen&&!ui.sheet&&!novelActive()){const k=shiftSituation(state);if(k)situationTalk(ui.talk??=newTalk(),state,k,performance.now(),Math.random());}
    if(el.talk)syncTalk(el.talk,ui.screen?null:state,view,ui.talk??=newTalk(),performance.now(),{width:cssW,height:cssH});
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
// 이름표가 피할 DOM 사각형(테이블 말풍선·확대 버튼)을 실제로 놓인 크기 그대로 캔버스 좌표로 바꾼다(x는 가운데)
function domTagAvoid(){const cr=el.canvas.getBoundingClientRect();if(!cr.width||!cr.height)return null;const k=cssW/cr.width,q=cssH/cr.height,box=r=>({x:(r.left-cr.left+r.width/2)*k,y:(r.top-cr.top)*q,w:r.width*k,h:r.height*q});const out=[...el.hits.querySelectorAll('.table-badge')].map(b=>box(b.getBoundingClientRect()));const cam=document.getElementById('camera-controls');if(!cam.hidden&&cam.offsetParent)out.push(box(cam.getBoundingClientRect()));return out;}
function canvasPoint(e){const r=el.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*cssW/r.width,y:(e.clientY-r.top)*cssH/r.height};}
let cameraDrag=null;
el.stage.addEventListener('pointerdown',e=>{if(state?.mode==='hunt'||e.target.closest('button,.decor-grounds')||(ui.camera.zoom<=1&&view.tile*view.cols<=cssW&&view.tile*view.rows<=cssH))return;const p=canvasPoint(e);cameraDrag={x:p.x,y:p.y,px:ui.camera.x,py:ui.camera.y};el.stage.setPointerCapture(e.pointerId);});
el.stage.addEventListener('pointermove',e=>{if(!cameraDrag)return;const p=canvasPoint(e);if(Math.hypot(p.x-cameraDrag.x,p.y-cameraDrag.y)>6)ui.suppressCanvasClickUntil=performance.now()+400;ui.camera.x=cameraDrag.px+p.x-cameraDrag.x;ui.camera.y=cameraDrag.py+p.y-cameraDrag.y;view=computeView(cssW,cssH,{...ui.camera,...stageBounds()});render(true);});
el.stage.addEventListener('pointerup',()=>cameraDrag=null);
const zoomTo=z=>{ui.camera.overview=false;ui.camera.zoom=Math.max(1,Math.min(2.4,z));view=computeView(cssW,cssH,{...ui.camera,...stageBounds()});render(true);};
el.stage.addEventListener('wheel',e=>{if(!state||state.mode==='hunt'||e.target.closest('.decor-grounds,.table-pop'))return;e.preventDefault();zoomTo((ui.camera.zoom||1)*(e.deltaY<0?1.1:1/1.1));},{passive:false});
const touches=new Map();let pinch=null;
el.stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||state?.mode==='hunt')return;touches.set(e.pointerId,canvasPoint(e));if(touches.size===2){const [a,b]=[...touches.values()];pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:ui.camera.zoom||1};cameraDrag=null;}});
el.stage.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;touches.set(e.pointerId,canvasPoint(e));if(pinch&&touches.size===2){const [a,b]=[...touches.values()];ui.suppressCanvasClickUntil=performance.now()+400;zoomTo(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d);}});
const endTouch=e=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;};el.stage.addEventListener('pointerup',endTouch);el.stage.addEventListener('pointercancel',endTouch);el.stage.addEventListener('pointercancel',()=>cameraDrag=null);

function beginCraft(menuId,orderId=null){
 if(automationOn(state,'kitchen')){run(orderId?{type:'order.quick',orderId}:{type:'cook',menuId});return;}
 const order=state.orders[orderId];if(order&&Object.values(state.stations).some(st=>stationJobs(st).some(j=>j?.orderId===orderId))){toast('이 주문은 조리 중이에요.');return;}
 ui.cafeDrawer=null;ui.tablePop=null;ui.craft=newCraft(menuId,orderId);ui.craft.assist=motionPreference.matches;ui.sheet={kind:'craft'};
}

function finishGuide(proceed=false){const back=ui.guideReturn,action=ui.guideAction;ui.guideReturn=null;ui.guideAction=null;run({type:'tutorial.seen',id:ui.guideId==='firstday'?'firstdayintro':ui.guideId||'cook'});ui.sheet=back?.kind?back:null;if(proceed&&action)ACTIONS[action]();}
function exchangeQty(){return Math.min(ui.exchangeQty??100,state?.moonstone||0);}
function setExchangeQty(q){ui.exchangeQty=Math.max(0,Math.floor(q)||0);const i=document.getElementById('exchange-qty');if(i)i.value=String(exchangeQty()||'');}
document.addEventListener('input',e=>{if(e.target.id==='exchange-qty'){ui.exchangeQty=Math.max(0,Math.floor(Number(e.target.value))||0);render(true);}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='exchange-qty'){e.preventDefault();document.querySelector('[data-action="moonstone.exchange"]')?.click();}});
function showCafeLine(line,speaker,portrait='customer'){
 const now=performance.now();if(ui.chatter&&now<ui.chatter.until-1800)return;
 const hunting=state?.mode==='hunt';if(hunting&&now-(ui.lastHuntChatter||0)<8000)return;if(hunting)ui.lastHuntChatter=now;ui.chatter={line,speaker,portrait,hunting,until:now+(hunting?1800:4500)};
}
document.addEventListener('change',e=>{if(e.target.id==='fortune-birth'){ui.fortuneBirth=e.target.value;keepFortuneBirth();render(true);}else if(e.target.id==='fortune-remember'){ui.fortuneRemember=e.target.checked;keepFortuneBirth();render(true);}});
document.addEventListener('change',e=>{if(e.target.id==='guide-selector'){ui.guideId=e.target.value;ui.guideStep=0;render(true);}});


// 눌러 둔 키·입력창·가려진 전투에서는 물품을 사용하지 않는다.
document.addEventListener('keydown',e=>{
 if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||document.hidden||state?.mode!=='hunt'||ui.sheet||ui.confirm||novelActive()||e.target.closest('input,textarea,select,[contenteditable=true]'))return;
 const n=/^[1-5]$/.test(e.key)?Number(e.key)-1:-1;if(n<0)return;
 e.preventDefault();run({type:'hunt.supply',id:SUPPLY_ORDER[n]});render(true);
});
