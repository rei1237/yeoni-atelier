import { hunterProgress, maxHuntDepth, depthScale } from '../game/hunt-growth.js';
import { huntCheck, monthScale } from '../game/hunt.js';
import { calendarOf } from '../game/calendar.js';
import { btn, esc } from './dom.js';
export function huntPrepSheet(state) {
  const progress = hunterProgress(state.hunter.xp), max = maxHuntDepth(state), chk = huntCheck(state);
  // 높은 레벨에서도 버튼 수가 무한히 늘지 않도록 초입과 최근 깊이를 보여 준다.
  const depths = [...new Set([1, Math.max(1, max - 2), Math.max(1, max - 1), max])];
  return `<h2>달그늘 사냥터${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>
    <div class="card"><b>영냥이 Lv.${progress.level}</b><p>성장 경험치 ${progress.xp} / ${progress.xpNext} · 누적 처치 ${state.hunter.kills}</p><progress value="${progress.xp}" max="${progress.xpNext}" aria-label="영냥이 성장 경험치"></progress><p>처치 경험치는 돌아올 때 남아요. 성장 레벨은 다음 사냥에도 이어지고, 무기와 별조각 레벨은 매 사냥 새로 시작해요.</p></div>
    <p>네오가 영냥이로 변신해 떠나요. 3분 · 행동력 1</p>${!chk.ok ? `<p role="status">${esc(chk.reasons.join(' · '))}</p>` : ''}
    <div class="list">${depths.map(depth => { const scale = depthScale(depth, monthScale(state.day), calendarOf(state.day).monthIdx); return `<div class="card"><h3>${depth === 1 ? '달그늘 초입' : `달그늘 깊이 ${depth}`}</h3><p>적 체력 ×${scale.hp.toFixed(2)} · 공격 ×${scale.dmg.toFixed(2)}<br>월정석 · 성장 경험치 ×${scale.reward.toFixed(2)}</p>${btn({ action: 'hunt.depart', args: { depth }, cls: 'primary', disabled: !chk.ok, label: `${depth}단계로 떠나기` })}</div>`; }).join('')}</div>
    <p class="small muted">영냥이 5레벨마다 더 깊은 곳이 열려요. 익숙한 초입에서도 계속 성장할 수 있어요.</p>`;
}
