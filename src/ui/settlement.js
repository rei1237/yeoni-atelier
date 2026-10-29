// 영업 마감 화면: 결산 원장의 실제 숫자만 쓴다. 평가 도장은 서빙률, 최고 기록은 이전 결산과 비교해 정한다.
import { esc, btn } from './dom.js';
import { won } from './hud.js';
import { assetIcon } from './asset-html.js';
import { personName } from '../game/state.js';
import { PEOPLE } from '../data/companions.js';
import { dateLabel, isEnded, totalTurns } from '../game/calendar.js';
import { TEMP } from '../config/balance.temp.js';

// 서빙률(서빙 완료 ÷ (서빙 완료 + 놓친 주문)) 기준 도장
const GRADES = {
  perfect: { label: '완벽한 영업', stars: 3, line: '오늘 점괘가 대길이더니 한 분도 놓치지 않았어! 우리 정말 완벽했지?' },
  great: { label: '훌륭한 영업', stars: 2, line: '오늘도 수고 많았어! 손님들 표정이 다 밝았어.' },
  good: { label: '무난한 영업', stars: 1, line: '조금 바빴지만 잘 버텼어. 다음 순엔 더 잘할 수 있어!' },
  tough: { label: '아쉬운 영업', stars: 0, line: '놓친 주문이 좀 있었어. 운도 준비한 만큼 따라오니까, 다음엔 서빙 순서를 같이 정해 보자.' },
  quiet: { label: '조용한 하루', stars: 0, line: '오늘은 손님이 적었네. 다음 순엔 더 많이 오시도록 준비해 보자!' },
};

export function settlementView(state) {
  const s = state.lastSettlement;
  const orders = s.servedCount + s.lostOrders;
  const rate = orders ? s.servedCount / orders : null;
  const grade = rate == null ? 'quiet' : rate >= .95 ? 'perfect' : rate >= .8 ? 'great' : rate >= .6 ? 'good' : 'tough';
  const past = Object.values(state.ledger.settlements).filter(o => o.shiftId !== s.shiftId);
  const best = past.length > 0 && s.result > 0 && past.every(o => s.result > o.result);
  // 10-29 MVP는 분야별: 홀(서빙·정리)·주방(굽기)·접대에서 가장 많이 한 사람. 같은 건수면 그 분야는 비운다
  const kitchen = s.kitchen || {}, hosted = {};
  for (const h of s.hostings || []) hosted[h.nominee] = (hosted[h.nominee] || 0) + 1;
  const crew = Object.entries(s.crew || {}).map(([id, jobs]) => PEOPLE[id]?.work === 'baker' ? { id, field: 'kitchen', n: kitchen[id] ?? 0 } : { id, field: 'hall', n: jobs });
  const mvps = { hall: topOf(crew.filter(c => c.field === 'hall')), kitchen: topOf(crew.filter(c => c.field === 'kitchen')), host: topOf(Object.entries(hosted).map(([id, n]) => ({ id, n }))) };
  for (const c of crew) { c.hosted = hosted[c.id] || 0; c.mvp = Object.keys(mvps).filter(f => mvps[f] === c.id); }
  crew.sort((a, b) => b.mvp.length - a.mvp.length || (a.field === 'hall' ? 0 : 1) - (b.field === 'hall' ? 0 : 1) || b.n - a.n);
  const tips = s.baseTips + s.feverTips + (s.stageTips || 0), income = s.sales + (s.hostFees || 0) + tips;
  const monthEnd = (s.payroll?.closed ? s.payroll.paid : 0) + (s.loanInterest?.due ? s.loanInterest.paid : 0) + (s.interest?.due ? s.interest.paid : 0);
  const line = best ? '오늘이 우리 카페 최고 기록이야! 별자리가 다 같이 웃어 준 날이네, 다들 고마워.' : past.length === 0 ? '우리 카페 첫 영업 끝! 첫 점괘처럼 좋은 시작이야, 같이 해 줘서 고마워.' : GRADES[grade].line;
  return { rate, grade, ...GRADES[grade], best, first: past.length === 0, crew, mvps, tips, income, monthEnd, line };
}

const topOf = list => { const [a, b] = [...list].sort((x, y) => y.n - x.n); return a && a.n > 0 && (!b || a.n > b.n) ? a.id : null; };
const FIELD = { hall: '홀', kitchen: '주방', host: '접대' };
const mateWork = c => `${c.field === 'kitchen' ? `주방 ${c.n}접시` : `홀 일 ${c.n}건`}${c.hosted ? ` · 접대 ${c.hosted}회` : ''}`;
const signed = n => `${n >= 0 ? '+' : '−'}${won(Math.abs(n))}`;
const pct = (n, of) => of > 0 ? Math.max(0, Math.min(100, n / of * 100)).toFixed(1) : 0;

export function settlementScreen(state) {
  const s = state.lastSettlement, v = settlementView(state), host = state.hostbar.open;
  const last = s.day === totalTurns(state) && !isEnded(state);
  const petals = Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  const parts = [['sales', '판매', s.sales], ...(host ? [['host', '지명료', s.hostFees || 0]] : []), ['tips', '팁', v.tips]].filter(p => p[2] > 0);
  const flow = v.income > 0
    ? `<div class="settle-flow" aria-label="들어온 돈과 재료비">
      <div class="settle-bar in">${parts.map(([k, , n]) => `<span class="${k}" style="width:${pct(n, v.income)}%"></span>`).join('')}</div>
      <div class="settle-legend">${parts.map(([k, l, n]) => `<span><i class="${k}"></i>${l} ${won(n)}</span>`).join('')}</div>
      <div class="settle-bar out"><span style="width:${pct(s.ingredientCost, v.income)}%"></span></div>
      <div class="settle-legend"><span><i class="cost"></i>재료비 −${won(s.ingredientCost)}</span></div></div>`
    : '';
  const tiles = [
    ['☕', '서빙 완료', `${s.servedCount}건`],
    ['🌸', '서빙률', v.rate == null ? '—' : `${Math.round(v.rate * 100)}%`],
    ['🪙', '받은 팁', won(v.tips)],
    ['🍂', '놓친 주문', `${s.lostOrders}건`],
  ].map(([icon, label, value], i) => `<div class="settle-tile" style="--d:${i}"><i aria-hidden="true">${icon}</i><small>${label}</small><b>${value}</b></div>`).join('');
  const crew = v.crew.length
    ? `<section class="settle-crew" aria-label="오늘 함께한 동료"><h3>오늘 함께한 동료</h3><div>${v.crew.map(c => `<div class="settle-mate${c.mvp.length ? ' mvp' : ''}">${assetIcon(`portraits/${c.id}`, `<span class="settle-initial">${esc(personName(state, c.id).slice(0, 1))}</span>`)}<b>${esc(personName(state, c.id))}</b><small>${mateWork(c)}</small>${c.mvp.length ? `<em>${c.mvp.map(f => FIELD[f]).join('·')} MVP</em>` : ''}</div>`).join('')}</div></section>`
    : '';
  const hostings = s.hostings.length
    ? `<div class="list">${s.hostings.map(h => `<div class="item"><div class="meta grow"><b>${h.tableNo}번 · ${esc(personName(state, h.nominee))} · ${h.H.toFixed(1)} ${esc(h.grade)}${h.capped ? ' (상한)' : ''}</b><span>지명료 ${won(h.hostFee || 0)} · 주문 ${won(h.servedTotal)} · 팁 ${won(h.tip)}${h.feverExtra ? ` (피버 +${h.feverExtra})` : ''} · 음식 ${h.food ?? '-'}점</span></div></div>`).join('')}</div>`
    : '<p class="small muted">이번 영업의 지명 접대 없음</p>';
  return `<div class="dialog settle-screen settle-${v.grade}${v.best ? ' settle-best' : ''}" role="dialog" aria-modal="true" aria-labelledby="settle-title">
    <div class="settle-petals" aria-hidden="true">${petals}</div>
    <header class="settle-head"><small>${esc(dateLabel(state, s.day))}</small><h2 id="settle-title">영업 마감</h2></header>
    <section class="settle-hero">
      <small>오늘의 영업 결과</small>
      <b class="settle-amount${s.result < 0 ? ' neg' : ''}" data-countup="${s.result}" data-shift="${esc(s.shiftId)}">${signed(s.result)}</b>
      <div class="settle-stamp" aria-label="${v.label}"><span class="stars" aria-hidden="true">${'★'.repeat(v.stars)}${'☆'.repeat(3 - v.stars)}</span><b>${v.label}</b></div>
      ${v.best ? '<p class="settle-ribbon">최고 기록 달성!</p>' : v.first ? '<p class="settle-ribbon">첫 영업 완료!</p>' : ''}
    </section>
    <div class="settle-talk">${assetIcon('portraits/yeoni', '')}<p><b>연이</b>${esc(v.line)}</p></div>
    <div class="settle-tiles">${tiles}</div>
    ${flow}
    ${crew}
    <div class="settle-wallet"><span>보유 골드 <b>${won(s.gold)}</b></span><span>남은 빚 <b>${won(s.debt)}</b></span>${v.monthEnd ? `<span class="month">월말 정산 <b>−${won(v.monthEnd)}</b></span>` : ''}</div>
    <details class="settle-ledger"><summary>자세한 장부 보기</summary>
      <div class="kv"><span>판매 금액(서빙 완료분)</span><b>${won(s.sales)}</b><span>재료비</span><b>−${won(s.ingredientCost)}</b>
      ${host ? `<span>지명료</span><b>${won(s.hostFees || 0)}</b>` : ''}<span>기본 팁</span><b>${won(s.baseTips)}</b>${host ? `<span>피버 추가 팁</span><b>${won(s.feverTips)}</b>` : ''}${s.stageTips ? `<span>무대 공연 팁 · ${s.stages}회</span><b>${won(s.stageTips)}</b>` : ''}
      <span class="sum">영업 결과</span><b class="sum">${s.result >= 0 ? '' : '−'}${won(Math.abs(s.result))}</b>
      ${s.payroll?.closed ? `<span>월말 동료 급여</span><b>−${won(s.payroll.paid)}</b>${s.payroll.arrears ? `<span>미지급 급여</span><b>${won(s.payroll.arrears)}</b>` : ''}` : ''}${s.loanInterest?.due ? `<span>운영 대출 이자</span><b>−${won(s.loanInterest.paid)}${s.loanInterest.added ? ` · 원금 가산 ${won(s.loanInterest.added)}` : ''}</b>` : ''}${interestRows(s.interest)}
      <span>보유 골드</span><b>${won(s.gold)}</b><span>남은 빚</span><b>${won(s.debt)}</b></div>
      <p class="small muted">서빙 ${s.servedCount}건 · 일반 ${s.regularVisits}${host ? ` · 지명 ${s.nominationVisits}` : ''} · 놓친 주문 ${s.lostOrders} · 폐기 ${s.wasted}</p>
      ${host ? `<p>네오 스트레스 ${s.stressStart ?? 0} → ${s.stressEnd ?? 0} · 결산을 닫으면 ${Math.abs(TEMP.NEO_STRESS.settle)} 회복해요.</p><h3>지명 대화</h3>${hostings}` : ''}
    </details>
    <div class="settle-actions">${btn({ action: 'settlement.close', cls: 'primary', label: last ? '📜 마지막 결산 닫고 결말 보기' : '다음 순 준비로' })}</div></div>`;
}

// 하순 결산의 청토끼 금융 이자 줄(낸 만큼 −, 못 낸 만큼 빚에 +)
function interestRows(it) {
  if (!it || !it.due) return '';
  return `<span>💸 ${it.month}월 이자(청토끼 금융)</span><b>−${won(it.paid)}</b>${it.added ? `<span class="bad">골드 부족 · 빚에 붙은 이자</span><b class="bad">+${won(it.added)}</b>` : ''}`;
}
