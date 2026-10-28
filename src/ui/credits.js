// 결말 뒤 크레딧(전체 화면, 아래→위로 흐른다). 출연은 함께한 동료, 음악은 재생 목록의 곡을 그대로 적는다.
import { btn, esc } from './dom.js';
import { BONDS, BOND_IDS } from '../data/bonds.js';
import { MUSIC_CATALOG } from '../data/music-catalog.js';

const CORE = ['neo', 'luna', 'luna_sis', 'moka'];

function castNames(state) {
  const ids = [...CORE, ...BOND_IDS.filter(id => !CORE.includes(id) && state?.roster?.[id])];
  return ['연이', ...ids.map(id => BONDS[id]?.name).filter(Boolean), '청토끼'];
}

function musicGroups() {
  const by = new Map();
  for (const t of MUSIC_CATALOG) {
    if (!by.has(t.artistName)) by.set(t.artistName, []);
    by.get(t.artistName).push(t.name);
  }
  return [...by];
}

export function creditsScreen(state, endingTitle = '') {
  const groups = musicGroups();
  const lines = castNames(state).length + groups.reduce((n, [, ts]) => n + ts.length + 2, 0) + 16;
  const music = groups.map(([artist, tracks]) => `<h4>${esc(artist)}</h4>${tracks.map(t => `<p>${esc(t)}</p>`).join('')}`).join('');
  return `<div class="credits" role="dialog" aria-modal="true" aria-label="크레딧">
    <div class="credits-view"><div class="credits-roll" style="--roll-s:${Math.max(40, Math.round(lines * 0.9))}s">
      <h2>연이의 아틀리에</h2>${endingTitle ? `<p class="credits-ending">${esc(endingTitle)}</p>` : ''}
      <h3>출연</h3>${castNames(state).map(n => `<p>${esc(n)}</p>`).join('')}
      <h3>음악</h3><p class="small">music.code-destiny.com 스트리밍</p>${music}
      <h3>제작</h3><p>원작 세계관 · 꿀꿀 운세(code-destiny)</p><p>게임 · 연이의 아틀리에(게임 오리지널 외전)</p>
      <h3 class="credits-thanks">함께 계산해 주셔서 고마워요</h3><p>다시 시작하려면 아래 「다시 시작」을 눌러 주세요.</p>
    </div></div>
    <div class="credits-actions">${btn({ action: 'credits.close', label: '건너뛰기' })}${btn({ action: 'game.new', cls: 'primary', label: '🌱 다시 시작' })}</div>
  </div>`;
}
