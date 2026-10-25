import { CROPS, FARM, SEASONS, WEATHER, farmLevel, farmNextXp, farmSeason, farmWeather } from '../data/farm.js';
import { INGREDIENTS } from '../data/menus.js';
import { plantCheck, farmCheck } from '../game/farm.js';
import { btn, esc } from './dom.js';
import { assetStyle, assetIcon } from './asset-html.js';
import { drawActor } from '../render/sprite-renderer.js';

export function farmSheet(state, ui) {
  const f = state.farm, level = farmLevel(f), season = farmSeason(state.day), weatherId = farmWeather(f, state.day), weather = WEATHER[weatherId];
  const selected = CROPS[ui.farmCrop] ? ui.farmCrop : 'wheat';
  const check = farmCheck(state);
  const cards = Object.entries(CROPS).map(([id, c]) => {
    const locked = level < c.level || (!f.greenhouse && !c.seasons.includes(season));
    const reason = level < c.level ? `레벨 ${c.level}` : !f.greenhouse && !c.seasons.includes(season) ? '다른 계절 · 온실 필요' : `${c.seedCost}G · ${c.turns}순`;
    return btn({ action: 'farm.select', args: { id }, cls: `crop-card${selected === id ? ' selected' : ''}`, disabled: locked, title: `${c.name} · ${reason}`, label: `${assetIcon(`icons/${c.ingredient}`)}<b>${esc(c.name)}</b><span>${reason}</span><small>→ ${INGREDIENTS[c.ingredient].name} ${c.yield}개부터</small>` });
  }).join('');
  const plots = f.plots.map((p, index) => {
    if (!p) {
      const chk = plantCheck(state, selected, index);
      return `<article class="farm-plot empty" data-key="plot-${index}"><span class="plot-label">${index + 1}번 밭</span>${btn({ action: 'farm.plant', args: { id: selected, index }, cls: 'plant-button', disabled: !chk.ok, title: chk.ok ? `${CROPS[selected].name} 심기 · ${CROPS[selected].seedCost}G` : chk.reason, label: `<span aria-hidden="true">＋</span>${CROPS[selected].name} 심기` })}</article>`;
    }
    const c = CROPS[p.cropId], ready = p.growth >= c.turns;
    const wet = p.wateredDay === state.day || weatherId === 'rain', tended = p.caredDay === state.day;
    return `<article class="farm-plot${ready ? ' ripe' : ''}" data-key="plot-${index}"><span class="plot-label">${index + 1}번 밭 · ${ready ? '수확할 때' : `${p.growth}/${c.turns}순`}</span>${assetIcon(`icons/${c.ingredient}`)}<b>${c.name}</b><progress value="${p.growth}" max="${c.turns}" aria-label="${c.name} 성장"></progress>${ready ? btn({ action: 'farm.harvest', args: { index, id: p.id }, cls: 'primary', disabled: !check.ok, label: '수확해서 주방으로' }) : `<div class="plot-care">${btn({ action: 'farm.water', args: { index }, disabled: wet || !check.ok, label: wet ? '물 충분' : '물 주기' })}${btn({ action: 'farm.tend', args: { index }, disabled: tended || !check.ok, label: tended ? '돌봄 완료' : weatherId === 'frost' ? '보온하기' : '돌보기' })}</div>`}</article>`;
  }).join('');
  const expandLevel = 2 + (f.plots.length - FARM.startPlots) / FARM.plotStep;
  const expandCost = FARM.expandBase * (1 + (f.plots.length - FARM.startPlots) / FARM.plotStep);
  return `<h2>연이의 달빛 농장${btn({ action: 'sheet.close', cls: 'close ghost', label: '✕', title: '닫기' })}</h2>
    <div class="farm-scene ${weatherId}" style="${assetStyle('backgrounds/farm')}"><canvas id="farm-yeoni" width="96" height="96" aria-label="농장을 가꾸는 연이"></canvas><span>연이의 오늘 할 일 · 심고, 돌보고, 수확하기</span></div>
    <div class="farm-summary"><div><b>${SEASONS[season]} · ${weather.icon} ${weather.name}</b><p>${weather.hint}</p></div><div><b>농장 Lv.${level}</b><p>경험치 ${f.xp} / ${farmNextXp(f)}</p></div></div>
    <p class="small">연이가 직접 심고 돌봐요. 영업을 마치면 작물이 자라고, 수확물은 요리 재고로 들어갑니다. 밀·벼·설탕무·커피는 수확 때 가공해요.</p>
    ${!check.ok ? `<p role="status">${esc(check.reason)}</p>` : ''}
    <div class="farm-plots">${plots}</div>
    ${btn({ action: 'farm.careAll', disabled: !check.ok || level < 3, title: level < 3 ? '농장 레벨 3에 열려요' : '모든 밭 물 주기와 돌보기', label: level < 3 ? '한 번에 돌보기 · Lv.3' : '모든 밭 돌보기' })}
    <h3>씨앗 고르기</h3><div class="crop-grid">${cards}</div>
    <p class="small muted">매 순 돌보면 수확 +${FARM.careBonus}개 · 농장 ${FARM.levelYieldEvery}레벨마다 수확 +1개 · 비가 오면 물 주기 생략</p>
    <h3>농장 넓히기</h3><div class="grid2">${btn({ action: 'farm.expand', disabled: !check.ok || f.plots.length >= FARM.maxPlots || level < expandLevel || state.gold < expandCost, label: f.plots.length >= FARM.maxPlots ? '밭 확장 완료' : `밭 +2 · Lv.${expandLevel} · ${expandCost}G` })}${btn({ action: 'farm.greenhouse', disabled: !check.ok || f.greenhouse || level < FARM.greenhouseLevel || state.gold < FARM.greenhouseCost, label: f.greenhouse ? '온실 사용 중' : `사계절 온실 · Lv.${FARM.greenhouseLevel} · ${FARM.greenhouseCost}G` })}</div>
    <p class="small muted">온실은 모든 계절의 작물을 심고 서리를 막아 줘요. 물과 돌보기는 연이의 몫이에요. 돌보기를 놓친 작물은 사라지지 않고 기다립니다.</p>`;
}
export function drawFarm(state, now) {
  const cv=document.getElementById('farm-yeoni'); if(!cv)return;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,96,96);
  drawActor(ctx,'yeoni',{x:48,y:94,size:96,outfitId:state.outfits.equipped.yeoni.outfit,state:'idle',facing:'down',t:matchMedia('(prefers-reduced-motion: reduce)').matches?0:now});
}
