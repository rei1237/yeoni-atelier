import { OUTFITS } from '../data/outfits.js';
import { outfitLine } from '../data/outfit-lines.js';
import { stressStage } from '../game/stress.js';
import { drawActor } from '../render/sprite-renderer.js';
import { paintTalkingPortrait } from './talking-portrait.js';
import { btn, esc } from './dom.js';
import { assetStyle } from './asset-html.js';
export function dressSelection(state, ui) {
  const who = ui.dressWho === 'yeoni' ? 'yeoni' : 'neo', slot = ui.dressSlot || 'outfit';
  const item = OUTFITS[ui.dressPreview];
  const preview = item && (!item.who || item.who === who) ? item.id : state.outfits.equipped[who][slot];
  return { who, slot, preview };
}
export function dressroomSheet(state, ui) {
  const { who, slot, preview } = dressSelection(state, ui), eq = state.outfits.equipped[who], prep = state.mode === 'prep';
  const stage = who === 'neo' ? stressStage(state) : 'calm';
  const line = ui.dressLine || outfitLine(who, preview, stage, 'wear');
  const items = Object.values(OUTFITS).filter(item => (!item.who || item.who === who) && (slot === 'outfit' ? item.slot === 'outfit' : item.slot === 'acc'));
  return `<h2>달빛 드레스룸${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>
    <div class="btns">${['neo', 'yeoni'].map(id => btn({ action: 'dress.who', args: { who: id }, cls: who === id ? 'on' : '', label: id === 'neo' ? '네오' : '연이' })).join('')}</div>
    <div class="dress-stage" style="${assetStyle('backgrounds/dressroom')}"><canvas id="dress-actor" width="192" height="192" aria-label="의상 입어 보기"></canvas><div class="dress-speech"><canvas data-talking-portrait="${who}${preview && slot === 'outfit' ? `@${preview}` : ''}" data-expression="${stage === 'calm' ? 'smile' : 'serious'}" width="96" height="96" aria-hidden="true"></canvas><p>${esc(line)}</p></div></div>
    <div class="btns">${[['down','앞'],['left','왼쪽'],['right','오른쪽'],['up','뒤']].map(([dir,label]) => btn({ action: 'dress.direction', args: { dir }, cls: (ui.dressDirection || 'down') === dir ? 'on' : '', label })).join('')}${btn({ action: 'dress.pose', label: ui.dressPose === 'host' ? '대기 모습 보기' : '인사 모습 보기' })}</div>
    ${!prep ? '<p role="status">지금은 입어 보기만 가능해요. 영업 준비 중에 갈아입어 주세요.</p>' : ''}
    <div class="btns">${[['outfit','의상'],['acc1','액세서리 1'],['acc2','액세서리 2']].map(([id,label]) => btn({ action: 'dress.slot', args: { slot: id }, cls: slot === id ? 'on' : '', label })).join('')}</div>
    <div class="dress-catalog">${items.map(item => {
      const owned = state.outfits.owned.includes(item.id), u = item.unlock;
      const status = owned ? (eq[slot] === item.id ? '입는 중' : '보유') : u?.type === 'moonstone' ? `월정석 ${u.cost}개` : item.hint || '5월 개시 이야기에서';
      return `<article class="dress-item${preview === item.id ? ' selected' : ''}"><b>${esc(item.name)}</b><span>${status}</span>${btn({ action: 'dress.preview', args: { id: item.id }, label: '입어 보기' })}${owned ? btn({ action: 'outfit.equip', args: { who, slot, item: item.id }, disabled: !prep || eq[slot] === item.id, cls: 'primary', label: eq[slot] === item.id ? '입는 중' : '입기' }) : btn({ action: 'outfit.unlock', args: { id: item.id }, disabled: !prep || u?.type !== 'moonstone' || state.moonstone < u.cost, label: u?.type === 'moonstone' ? '해금하기' : '이야기 기다리기' })}</article>`;
    }).join('')}</div>${btn({ action: 'outfit.equip', args: { who, slot, item: '' }, disabled: !prep || !eq[slot], label: '이 칸 비우기' })}<p class="small muted">의상은 외형과 대사만 바꿔요. 능력치·만족도·스트레스는 변하지 않아요.</p>`;
}
export function drawDressroom(state, ui, now) {
  const canvas = document.getElementById('dress-actor'); if (!canvas) return;
  const { who, slot, preview } = dressSelection(state, ui);
  const outfit = slot === 'outfit' ? preview : state.outfits.equipped[who].outfit;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 192, 192);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  drawActor(ctx, outfit ? `${who}@${outfit}` : who, { x: 96, y: 188, size: 128, body: OUTFITS[outfit]?.color, state: ui.dressPose || 'idle', facing: ui.dressDirection || 'down', t: reduced ? 0 : now });
}
export function drawInlinePortraits(now) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const cv of document.querySelectorAll('canvas[data-talking-portrait]')) {
    const text = cv.parentElement.textContent;
    let speech = inlineSpeech.get(cv);
    if (!speech || speech.text !== text) { speech = { text, start: now }; inlineSpeech.set(cv, speech); }
    paintTalkingPortrait(cv, { key: cv.dataset.talkingPortrait, expression: cv.dataset.expression || 'normal', now, talking: now - speech.start < Math.min(5000, text.length * 55), reduced });
  }
}
const inlineSpeech = new WeakMap();
