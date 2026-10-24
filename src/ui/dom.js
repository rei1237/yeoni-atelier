// DOM 도우미. 화면은 HTML 문자열로 만들고 morph 로 바뀐 부분만 고친다.
// (통째로 갈아 끼우면 누르는 도중의 버튼이 사라져 탭이 씹히므로, 같은 자리의 요소는 그대로 둔다.)

export const $ = sel => document.querySelector(sel);

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// data-* 인자를 붙인 버튼. a: {action, label, cls, args:{}, disabled, title}
export function btn({ action, label, cls = '', args = {}, disabled = false, title = '' }) {
  const data = Object.entries(args).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const dis = disabled ? ' aria-disabled="true"' : '';
  const tt = title ? ` title="${esc(title)}" aria-label="${esc(title)}"` : '';
  return `<button type="button" class="${cls}" data-action="${action}"${data}${dis}${tt}>${label}</button>`;
}

const lastHtml = new WeakMap();
export function morph(el, html) {
  if (lastHtml.get(el) === html) return;
  lastHtml.set(el, html);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patchChildren(el, tpl.content);
}

function sameNode(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a.nodeType === 1 && a.getAttribute('data-key') !== b.getAttribute('data-key')) return false;
  return true;
}

function patchChildren(a, b) {
  const an = [...a.childNodes], bn = [...b.childNodes];
  for (let i = 0; i < bn.length; i++) {
    const x = an[i], y = bn[i];
    if (!x) { a.appendChild(y); continue; }
    if (!sameNode(x, y)) { a.replaceChild(y, x); continue; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; continue; }
    patchAttrs(x, y);
    patchChildren(x, y);
  }
  for (let i = an.length - 1; i >= bn.length; i--) a.removeChild(an[i]);
}

function patchAttrs(x, y) {
  for (const { name } of [...x.attributes]) if (!y.hasAttribute(name)) x.removeAttribute(name);
  for (const { name, value } of [...y.attributes]) if (x.getAttribute(name) !== value) x.setAttribute(name, value);
}

// 알림
export function toast(text, kind = '', ms = 2600) {
  const box = $('#toasts');
  if (!box) return;
  while (box.children.length >= 3) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  box.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// 화면 위 떠오르는 숫자(+골드 등)
export function floater(x, y, text, color) {
  const box = $('#floaters');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'floater';
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  if (color) el.style.color = color;
  el.textContent = text;
  box.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}
