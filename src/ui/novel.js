// 라이트노벨식 대화 화면(프롤로그 등). 게임 상태를 읽거나 바꾸지 않는다 → 끝나면 onEnd 만 부른다.
// 조작: 탭 = 글자 다 보이기 → 한 번 더 탭 = 다음. Enter·Space 같음. AUTO·SKIP·LOG·◀(이전)·건너뛰기.
// 연출 기준은 code-destiny 소설 읽기 화면(유리 대화창·금테·이름표·초상화 3칸·켄 번스 배경)을 참고해 새로 만든 것이다.

import { drawPortrait } from '../render/sprite-renderer.js';
import { SPEAKERS } from '../story/prologue.js';

const TYPE_MS = 30, SKIP_MS = 120, LOG_MAX = 60;
const autoDelay = len => Math.min(4200, 1100 + len * 55);
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let active = null;
export const novelPlaying = () => !!active;

export function playNovel(beats, { onEnd } = {}) {
  if (active) active.close(false);
  const root = document.getElementById('novel');
  root.hidden = false;
  root.innerHTML = `
    <div class="nv-bg"><div class="nv-bg-layer a"></div><div class="nv-bg-layer b"></div><div class="nv-stars"></div></div>
    <div class="nv-fx"></div>
    <div class="nv-portraits">${['l', 'c', 'r'].map(k => `<canvas class="nv-pt ${k}" width="192" height="192" aria-hidden="true"></canvas>`).join('')}</div>
    <div class="nv-chapter" hidden><small></small><b></b><i></i></div>
    <div class="nv-box" role="button" tabindex="0" aria-label="다음 대사">
      <div class="nv-name"></div><p class="nv-text" aria-live="polite"></p><span class="nv-next">다음 ▾</span>
    </div>
    <nav class="nv-tools">
      <button data-nv="back" title="이전 대사">◀</button>
      <button data-nv="auto">AUTO</button>
      <button data-nv="skip">SKIP</button>
      <button data-nv="log">LOG</button>
      <button data-nv="end" class="nv-end">건너뛰기 ⏭</button>
    </nav>
    <div class="nv-log" hidden><div class="nv-log-list"></div><button data-nv="log">닫기</button></div>`;
  const q = s => root.querySelector(s);
  const box = q('.nv-box'), nameEl = q('.nv-name'), textEl = q('.nv-text'), nextEl = q('.nv-next');
  const layers = [q('.nv-bg-layer.a'), q('.nv-bg-layer.b')];
  const pts = { l: q('.nv-pt.l'), c: q('.nv-pt.c'), r: q('.nv-pt.r') };
  const slots = { l: null, c: null, r: null };
  let idx = -1, typing = false, full = '', shown = 0, typeTimer = 0, waitTimer = 0, mode = null, bgFront = 0, bgName = null;
  const log = [];

  function clearTimers() { clearInterval(typeTimer); clearTimeout(waitTimer); typeTimer = waitTimer = 0; }

  function setBg(name) {
    if (!name || name === bgName) return;
    bgName = name;
    bgFront = 1 - bgFront;
    layers[bgFront].className = `nv-bg-layer ${bgFront ? 'b' : 'a'} bg-${name} on`;
    layers[1 - bgFront].classList.remove('on');
  }

  function drawSlots(speakerKey) {
    for (const k of ['l', 'c', 'r']) {
      const cv = pts[k], v = slots[k];
      cv.classList.toggle('show', !!v);
      if (!v) continue;
      const [key, expr] = v.split(':');
      drawPortrait(cv.getContext('2d'), key, expr || 'normal', cv.width, cv.height);
      cv.classList.toggle('dim', !!speakerKey && key !== speakerKey);
    }
  }

  function fx(kind) {
    if (!kind || reduced()) return;
    const f = q('.nv-fx');
    if (kind === 'shake') { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); }
    else { f.className = `nv-fx ${kind}`; void f.offsetWidth; f.classList.add('go'); }
  }

  function chapterCard(ch) {
    const card = q('.nv-chapter');
    card.querySelector('small').textContent = ch[0];
    card.querySelector('b').textContent = ch[1];
    card.hidden = false; box.classList.add('hide');
    card.classList.remove('go'); void card.offsetWidth; card.classList.add('go');
    waitTimer = setTimeout(() => { card.hidden = true; box.classList.remove('hide'); next(); }, mode === 'skip' ? 300 : 2300);
  }

  function show(i, instant = false) {
    clearTimers();
    idx = i;
    const b = beats[i];
    // 배경·초상화는 지금 박자까지 누적된 값으로 맞춘다(◀ 로 되돌아가도 같은 화면)
    let bg = null;
    for (const k of ['l', 'c', 'r']) slots[k] = null;
    for (let j = 0; j <= i; j++) {
      const bj = beats[j];
      if (bj.bg) bg = bj.bg;
      for (const k of ['l', 'c', 'r']) if (k in bj) slots[k] = bj[k];
    }
    setBg(bg);
    if (b.chapter) { drawSlots(null); return chapterCard(b.chapter); }
    const sp = SPEAKERS[b.s];
    drawSlots(sp ? sp.portrait : null);
    box.className = `nv-box sp-${sp ? 'char' : b.s} who-${b.s}`;
    nameEl.textContent = sp ? sp.name : '';
    nameEl.hidden = !sp;
    if (!instant) fx(b.fx);
    full = b.t; shown = 0;
    if (instant || reduced() || mode === 'skip') return finishLine();
    typing = true; nextEl.classList.remove('on'); textEl.textContent = '';
    typeTimer = setInterval(() => {
      shown += 1;
      textEl.textContent = full.slice(0, shown);
      if (shown >= full.length) finishLine();
    }, TYPE_MS);
  }

  function finishLine() {
    clearInterval(typeTimer); typeTimer = 0;
    typing = false; textEl.textContent = full; nextEl.classList.add('on');
    const b = beats[idx];
    if (!log.length || log[log.length - 1].i !== idx) {
      log.push({ i: idx, who: SPEAKERS[b.s]?.name || '', t: b.t, s: b.s });
      if (log.length > LOG_MAX) log.shift();
    }
    if (mode === 'skip') waitTimer = setTimeout(next, SKIP_MS);
    else if (mode === 'auto') waitTimer = setTimeout(next, autoDelay(full.length));
  }

  function next() {
    if (idx + 1 >= beats.length) return close(true);
    show(idx + 1);
  }

  function tap() {
    if (!q('.nv-log').hidden || !q('.nv-chapter').hidden) return;
    if (typing) finishLine(); else next();
  }

  function setMode(m) {
    mode = mode === m ? null : m;
    q('[data-nv="auto"]').classList.toggle('on', mode === 'auto');
    q('[data-nv="skip"]').classList.toggle('on', mode === 'skip');
    if (mode && !typing && q('.nv-chapter').hidden) { clearTimeout(waitTimer); waitTimer = setTimeout(next, mode === 'skip' ? SKIP_MS : autoDelay(full.length)); }
    if (!mode) clearTimeout(waitTimer);
  }

  function toggleLog() {
    const panel = q('.nv-log');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      if (mode) setMode(mode);
      q('.nv-log-list').innerHTML = log.map(e => `<p class="who-${e.s}">${e.who ? `<b>${esc(e.who)}</b>` : ''}${esc(e.t)}</p>`).join('');
      q('.nv-log-list').scrollTop = 1e6;
    }
  }

  function onClick(e) {
    e.stopPropagation();
    const btn = e.target.closest('[data-nv]');
    if (!btn) return tap();
    const a = btn.dataset.nv;
    if (a === 'auto' || a === 'skip') setMode(a);
    else if (a === 'log') toggleLog();
    else if (a === 'back') { let j = idx - 1; while (j > 0 && beats[j].chapter) j--; if (j >= 0 && !beats[j].chapter) { if (mode) setMode(mode); show(j, true); } }
    else if (a === 'end') close(true);
  }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); }
    else if (e.key === 'Escape' && !q('.nv-log').hidden) toggleLog();
  }

  function close(done) {
    clearTimers();
    root.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey, true);
    root.hidden = true; root.innerHTML = ''; root.classList.remove('shake');
    active = null;
    if (done) onEnd?.();
  }

  root.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey, true);
  active = { close };
  box.focus({ preventScroll: true });
  next();
}
