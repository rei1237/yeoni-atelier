import { personName } from '../game/state.js';
import { OUTFITS, MALE_HOSTS } from '../data/outfits.js';
import { outfitLine } from '../data/outfit-lines.js';
import { stressStage } from '../game/stress.js';
import { drawActor } from '../render/sprite-renderer.js';
import { paintTalkingPortrait } from './talking-portrait.js';
import { btn, esc } from './dom.js';
import { assetStyle, assetIcon } from './asset-html.js';
import {ASSETS,imageFor} from '../render/assets.js';
export function dressSelection(state, ui) {
  const who = MALE_HOSTS.includes(ui.dressWho) && state.roster[ui.dressWho] ? ui.dressWho : 'neo', slot = ui.dressSlot || 'outfit';
  const item = OUTFITS[ui.dressPreview];
  const preview = item && (!item.who || item.who === who) ? item.id : state.outfits.equipped[who][slot];
  return { who, slot, preview };
}
export function dressroomSheet(state, ui) {
  const { who, slot, preview } = dressSelection(state, ui), eq = state.outfits.equipped[who], prep = state.mode === 'prep';
  const stage = who === 'neo' ? stressStage(state) : 'calm';
  const line = ui.dressLine || outfitLine(who, preview, stage, 'wear');
  const items = Object.values(OUTFITS).filter(item => (!item.who || item.who === who) && (slot === 'outfit' ? item.slot === 'outfit' : item.slot === 'acc'));
  return `<h2>호스트 드레스룸${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>
    <p class="small">남성 호스트 전용 · 동료별 의상 컬렉션</p><div class="btns">${MALE_HOSTS.filter(id=>state.roster[id]).map(id => btn({ action: 'dress.who', args: { who: id }, cls: who === id ? 'on' : '', label: personName(state,id) })).join('')}</div>
    <div class="dress-stage" style="${assetStyle('backgrounds/dressroom')}"><img class="dress-illustration" src="${ASSETS.portraits[outfitPortrait(who,slot,preview,eq)]?.path||ASSETS.portraits[who]?.path}" alt="${esc(personName(state,who))}의 선택한 의상 일러스트"><canvas id="dress-actor" width="192" height="192" aria-label="의상 입어 보기"></canvas><div class="dress-speech"><canvas data-talking-portrait="${who}${preview && slot === 'outfit' ? `@${preview}` : ''}" data-expression="${stage === 'calm' ? 'smile' : 'serious'}" width="96" height="96" aria-hidden="true"></canvas><p>${esc(line)}</p></div></div>
    <div class="btns">${[['down','앞'],['left','왼쪽'],['right','오른쪽'],['up','뒤']].map(([dir,label]) => btn({ action: 'dress.direction', args: { dir }, cls: (ui.dressDirection || 'down') === dir ? 'on' : '', label })).join('')}${btn({ action: 'dress.pose', label: ui.dressPose === 'host' ? '대기 모습 보기' : '인사 모습 보기' })}</div>
    ${!prep ? '<p role="status">지금은 입어 보기만 가능해요. 영업 준비 중에 갈아입어 주세요.</p>' : ''}
    <div class="btns">${[['outfit','의상'],['acc1','액세서리 1'],['acc2','액세서리 2']].map(([id,label]) => btn({ action: 'dress.slot', args: { slot: id }, cls: slot === id ? 'on' : '', label })).join('')}</div>
    <div class="dress-catalog">${items.map(item => {
      const owned = state.outfits.owned.includes(item.id), u = item.unlock;
      const status = owned ? (eq[slot] === item.id ? '입는 중' : '보유') : u?.type === 'moonstone' ? `월정석 ${u.cost}개` : item.hint || '5월 개시 이야기에서';
      return `<article class="dress-item${preview === item.id ? ' selected' : ''}">${item.slot==='outfit'?`<canvas class="outfit-thumb" data-outfit="${who}@${item.id}" width="128" height="128" aria-label="${esc(item.name)} 미리보기"></canvas>`:assetIcon(`icons/${item.id}`)}<b>${esc(item.name)}</b><p class="small">${esc(outfitDescription(item,personName(state,who)))}</p><span>${status}</span>${btn({ action: 'dress.preview', args: { id: item.id }, label: '입어 보기' })}${owned ? btn({ action: 'outfit.equip', args: { who, slot, item: item.id }, disabled: !prep || eq[slot] === item.id, cls: 'primary', label: eq[slot] === item.id ? '입는 중' : '입기' }) : btn({ action: 'outfit.unlock', args: { id: item.id }, disabled: !prep || u?.type !== 'moonstone' || state.moonstone < u.cost, label: u?.type === 'moonstone' ? '해금하기' : '이야기 기다리기' })}</article>`;
    }).join('')}</div>${btn({ action: 'outfit.equip', args: { who, slot, item: '' }, disabled: !prep || !eq[slot], label: '이 칸 비우기' })}<p class="small muted">의상은 외형과 대사만 바꿔요. 능력치·만족도·스트레스는 변하지 않아요.</p>`;
}
export function drawDressroom(state, ui, now) {
  const canvas = document.getElementById('dress-actor'); if (!canvas) return;
  const { who, slot, preview } = dressSelection(state, ui);
  const outfit = slot === 'outfit' ? preview : state.outfits.equipped[who].outfit;
  if(canvas.width!==384){canvas.width=384;canvas.height=384;}
  const ctx = canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0); ctx.clearRect(0, 0, 192, 192);
  const previewImage=imageFor(`wardrobe/${outfit?`${who}@${outfit}`:who}`);
  if(previewImage){const direction=Math.max(0,['down','left','right','up'].indexOf(ui.dressDirection||'down'));ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(previewImage,direction*256,0,256,256,0,0,192,192);return;}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  drawActor(ctx, outfit ? `${who}@${outfit}` : who, { x: 96, y: 188, size: 184, body: OUTFITS[outfit]?.color, state: ui.dressPose || 'idle', facing: ui.dressDirection || 'down', t: reduced ? 0 : now });
}
export function drawInlinePortraits(now) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const cv of document.querySelectorAll('canvas[data-outfit]')){const ctx=cv.getContext('2d');ctx.clearRect(0,0,128,128);drawActor(ctx,cv.dataset.outfit,{x:64,y:125,size:120,state:'idle',facing:'down',t:0});}
  for(const cv of document.querySelectorAll('canvas[data-codex-actor]')){const ctx=cv.getContext('2d');ctx.clearRect(0,0,128,128);drawActor(ctx,cv.dataset.codexActor,{x:64,y:120,size:104,state:'walk',facing:'down',t:0});} // 사냥터 도감
  for (const cv of document.querySelectorAll('canvas[data-talking-portrait]')) {
    const text = cv.parentElement.textContent;
    let speech = inlineSpeech.get(cv);
    if (!speech || speech.text !== text) { speech = { text, start: now }; inlineSpeech.set(cv, speech); }
    paintTalkingPortrait(cv, { key: cv.dataset.talkingPortrait, expression: cv.dataset.expression || 'normal', now, talking: now - speech.start < Math.min(5000, text.length * 55), reduced });
  }
}
const inlineSpeech = new WeakMap();

function outfitDescription(item,name){
 const k=item.id;
 const text=k.includes('swim')?'시원한 리조트 수영복. 여름 테라스에 어울리는 가벼운 차림.':k.includes('moon')||k.includes('tailcoat')?'긴 재킷 자락과 은은한 금장으로 완성한 달빛 만찬의 예복.':k.includes('garden')||k.includes('linen')?'어깨의 힘을 뺀 부드러운 평상복. 편안한 오후의 대화를 위한 차림.':k.includes('formal')||k==='host_first'?'무대의 빛을 담은 정장. 반짝이는 장식과 단정한 실루엣.':k.includes('winter')?'차가운 계절을 감싸는 긴 코트.':k.includes('rain')?'비 갠 거리를 닮은 차분한 푸른 외투.':k.includes('haori')?'벚꽃빛을 얹은 부드러운 겉옷.':k.includes('wood')?'숲을 닮은 녹색 정장과 정갈한 셔츠.':item.slot==='acc'?'작은 포인트로 더하는 호스트의 개성.':'셔츠와 조끼를 갖춘 카페의 기본 차림.';
 return `${name} · ${text}`;
}

function outfitPortrait(who,slot,preview,eq){const outfit=slot==='outfit'?preview:eq.outfit;return outfit?`${who}@${outfit}`:who;}
