import {audioStatus} from './audio.js';
// 영업 음악 🎵: 켜 두면 영업 시작과 함께 Moonlight Tea부터 흐르고, 끄면 다음 영업에도 조용하다(브라우저에만 저장).
const musicToggle=shift=>{const a=audioStatus(),on=a.shiftMusic&&(a.music||!shift);return btn({action:'audio.change',args:{key:'shiftMusic',value:on?'off':shift?'play':'on'},cls:'cafe-utility music-toggle'+(on?' on':''),pressed:on,title:on?'영업 음악 끄기':'영업 음악 켜기 · Moonlight Tea부터',label:`<span aria-hidden="true">${on?'🎵':'🔇'}</span><span class="sr-only">영업 음악 ${on?'켜짐':'꺼짐'}</span>`});};
import {hostDeskHtml,catCafeControl} from './host-desk.js';
import {furnitureCells} from '../game/space.js';
import {yeoniProgress} from '../game/yeoni-growth.js';
import {yeoniGrowthHtml} from './yeoni-growth.js';
import {journeyHtml} from './tutorials.js';
import {uiIcon} from './moonlight-ui.js';
import {trailButton} from './trail-ui.js';
import {kfpKit} from './kfp-ui.js';
import {hunterName,hunterPortrait} from '../game/hunt-cast.js';
import {huntSuppliesHtml} from './hunt-supplies.js';
import {decorPanel,decorTopbar,decorStageHtml} from './decor-screen.js';
import {runningJobs,queuedJobs,stationJobs,stationItems,activeSlotNames,heldKey} from '../game/station-slots.js';
import {activeBranch} from '../game/branches.js';
import {cafeCapacity,assignedHosts} from '../game/capacity.js';
import {qualityOf} from '../data/cooking-quality.js';
import { automationStatus } from '../game/auto.js';
import {maxActionPoints} from '../game/calendar.js';
import {interestDue,interestRate,creditorView} from '../game/creditor.js';
import {CUSTOMER_WEALTH} from '../data/customer-wealth.js';
import {waitingSatisfaction} from '../game/reputation.js';
import {popularity} from '../game/reputation.js';
import {cafeProgress,cafeStyle,atmosphere,scoreStage} from '../game/cafe-growth.js';
import { SUPPLIES } from '../game/moka-armory.js';
import { stressLabel, stressStage, stressOf } from '../game/stress.js';
import { automationOn, abilityCheck } from '../game/permissions.js';
import { placeLock } from '../game/unlocks.js';
import { assetIcon } from './asset-html.js';
// 상단 바·하단 패널·테이블 말풍선·테이블 터치 영역의 HTML. 상태를 읽기만 한다.
// 모든 표시는 글자 + 아이콘 + 시간으로 쓴다(색만으로 구분하지 않는다).

import { RULES } from '../config/rules.js';
import { TEMP } from '../config/balance.temp.js';
import { MENUS, INGREDIENTS } from '../data/menus.js';
import { GEAR } from '../data/gear.js';
import { FURNITURE, AREAS, SPOTS, FIXTURES, cafeLayout } from '../data/layout.js';
import { HELP_KINDS } from '../data/lines.js';
import { fmtTime, personName, remainingShift, usableHosts, shiftDuration, lastAcceptAt } from '../game/state.js';
import { STATION_NAMES, findServeTarget, openOrdersOfVisit, staffStatusText, foodPatienceMs } from '../game/cafe.js';
import { feverCheck, personBusyReason } from '../game/nomination.js';
import { stageCheck, stageActive, concertCheck, concertQuote, DEST1NOVA_IDS, fansOf, fanTierName, nextTierAt } from '../game/fans.js';
import { startCheck } from '../game/shift.js';
import { huntCheck, findBoss, getHuntWorld } from '../game/hunt.js';
import { stageDef } from '../data/hunt-stages.js';
import { calendarOf, dateLabel, turnsLeft, isEnded, PARTS } from '../game/calendar.js';
import { WEAPONS, PASSIVES } from '../data/hunt-kit.js';
import { debtStage, recruitView } from '../game/economy.js';
import { preview as interiorPreview } from '../game/interior.js';
import { cellToPx } from '../render/cafe-view.js';
import { btn, esc } from './dom.js';
import { guestMotion, orderChipsHtml, cafeTasks } from './table-ui.js';

const won = n => n === 100_000_000 ? '1억 골드' : `${Math.floor(n).toLocaleString('ko-KR')}G`;

function scoreChip(kind,value){
 const d=scoreStage(kind,value),label=kind==='reputation'?'평판':'분위기';
 const detail=`${label} 점수 ${d.value}${kind==='reputation'?'/100':''} · ${d.next==null?'최고 단계':`${d.nextName}까지 ${Math.ceil(d.remaining)}점`}`;
 return `<span class="score-stage ${kind}-score" tabindex="0" title="${esc(detail)}" aria-label="${esc(label+' '+d.level+'단계 · '+d.name+' · '+detail)}"><small>${label} ${d.level}단계</small><b>${esc(d.name)}</b><progress value="${d.progress}" max="1" aria-label="${esc(detail)}"></progress></span>`;
}

// ── 상단 바
export function topbarHtml(state, ui) {
  const dev = ui.dev ? '<span class="tag dev">DEV</span>' : '';
  if (!state) return `<div class="tb-col"><span class="clock">연이의 아틀리에</span></div>${dev}`;
  if(state.interior.draft)return decorTopbar(state,ui);
  if(['prep','shift'].includes(state.mode)&&!state.interior.draft)return cafeTopbar(state,ui);
  const stress = state.hostbar.open ? `<span class="stress-chip ${stressStage(state)}" aria-label="네오 스트레스 ${Math.round(stressOf(state))}/100">${assetIcon(`ui/stress-${stressStage(state)}`)}네오 · ${stressLabel(state)}<meter min="0" max="100" value="${stressOf(state)}">${Math.round(stressOf(state))}</meter></span>` : '';
  const cp=cafeProgress(state);
  const gold = `<div class="cafe-scores"><span class="level-badge" aria-label="카페 레벨 ${cp.level}"><b>Lv.${cp.level}</b><progress max="${cp.next}" value="${cp.xp}" aria-label="다음 카페 레벨 경험치">${cp.xp}/${cp.next}</progress></span>${scoreChip('reputation',popularity(state))}${scoreChip('atmosphere',atmosphere(state))}</div><span class="gold" aria-label="골드">🪙 <span data-count-to="${Math.floor(state.gold)}" data-count-suffix="G">${won(state.gold)}</span></span>`;
  if (state.mode === 'shift') {
    const sh = state.shift;
    const st = [];
    if (state.paused) st.push('⏸ 일시정지');
    if (state.fever.activeUntil != null) st.push(`🔥 피버 ${fmtTime(state.fever.activeUntil - sh.elapsedMs)}`);
    if (state.auto) st.push('🤖 자동 운영');
    else { if (automationOn(state, 'hall')) st.push('루나 홀 자동'); if(automationOn(state,'hall_neo')) st.push('네오 홀 자동'); if (automationOn(state, 'kitchen')) st.push('🍳 주방 자동'); }
    if (state.hostbar.open && sh.elapsedMs > lastAcceptAt(state)) st.push('지명 수락 마감');
    if (!st.length) st.push('영업 중');
    if (ui.dev && ui.speed !== 1) st.push(`×${ui.speed}`);
    return `<div class="tb-col"><span class="clock" aria-label="남은 영업 시간">⏱ ${fmtTime(remainingShift(state))}</span><span class="small muted">경과 ${fmtTime(sh.elapsedMs)} / ${fmtTime(shiftDuration(state))}</span></div>
      ${gold}${stress}<span class="speed-controls" role="group" aria-label="영업 속도">${btn({action:'play.cycle',label:`${ui.playSpeed||1}배`,title:'영업 속도 바꾸기: 1배, 2배, 3배'})}</span><span class="status">${esc(st.join(' · '))}</span>${dev}
      ${btn({ action: 'pause', label: state.paused ? '▶' : '⏸', title: state.paused ? '계속하기' : '일시정지', cls: 'ghost' })}`;
  }
  if (state.mode === 'hunt') return huntTopbar(state,ui);
  const label = state.mode === 'settlement' ? '결산' : state.interior.draft ? '인테리어 편집' : '영업 준비';
  return `<div class="tb-col"><span class="clock">${esc(shortDate(state))}</span><span class="small muted">${activeBranch(state)}호점 · ${label}</span></div>
    ${gold}${stress}<span class="speed-controls" role="group" aria-label="영업 속도">${btn({action:'play.cycle',label:`${ui.playSpeed||1}배`,title:'영업 속도 바꾸기: 1배, 2배, 3배'})}</span><span class="status cafe-wallet">${assetIcon('icons/moonstone')}${state.moonstone||0}</span>${dev}
    ${btn({action:state.interior.draft?'decor.close':'decor.open',label:state.interior.draft?'닫기':'꾸미기',title:state.mode==='prep'?'카페 꾸미기 · 가구 구매와 배치':'영업 준비 중에 꾸밀 수 있어요',disabled:state.mode!=='prep',cls:'ghost cafe-decor-entry'})}`;
}

// 사냥 정보는 초상·진행 상황·생존 수치를 분리하고 실제 전투 값만 표시한다.
function huntTopbar(state,ui){
 const h=state.hunt,hp=Math.max(0,Math.ceil(h.hp)),max=Math.max(1,Math.ceil(h.maxHp));
 const low=hp/max<=.25,xp=Math.max(0,h.xp||0),next=Math.max(1,h.xpNext||1),portrait=h.hunterId==='seohanbi'?'seohanbi':hunterPortrait(h.hunterId);
 return `<div class="hunt-identity"><span class="hunt-face">${assetIcon('badges/'+portrait)}</span><div><b>${esc(hunterName(h.hunterId))}의 사냥터</b><span>${h.depth} / 100단계${state.paused?' · 일시정지':''}${ui.dev&&ui.speed!==1?' · 개발 '+ui.speed+'배':''}</span></div></div><div class="hunt-clock"><small>생존 시간</small><b>${fmtTime(h.elapsedMs)}</b></div>${btn({action:'pause',cls:'hunt-pause',title:state.paused?'사냥 계속하기':'사냥 일시정지',label:state.paused?'계속':'멈춤'})}<div class="hunt-vitals"><div class="hunt-health${low?' is-low':''}"><div><span>${low?'체력 낮음':'체력'}</span><b>${hp.toLocaleString('ko-KR')} <small>/ ${max.toLocaleString('ko-KR')}</small></b></div><meter min="0" max="${max}" value="${Math.min(hp,max)}" low="${max*.25}" optimum="${max}" aria-label="체력 ${hp} / ${max}"></meter></div><div class="hunt-experience"><div><span>원정 Lv.${h.level||1}</span><small>${xp.toLocaleString('ko-KR')} / ${next.toLocaleString('ko-KR')}</small></div><progress max="${next}" value="${Math.min(xp,next)}" aria-label="원정 경험치 ${xp} / ${next}"></progress></div></div><div class="hunt-wallet">${assetIcon('icons/moonstone')}<span>이번 원정 월정석</span><b>${(h.bag.moonstone||0).toLocaleString('ko-KR')}</b></div>`;
}

// 상단 바용 짧은 날짜: '3월 상순' / '후일담 2일째'
function shortDate(state) {
  if (isEnded(state)) return dateLabel(state);
  const c = calendarOf(state.day);
  return `${c.month}월 ${PARTS[c.part]}`;
}

// 달력 띠: 연차·남은 순·이번 달 이자 예고·행동력(글자와 점으로 함께 보인다)
function calendarStrip(state) {
  const apMax = maxActionPoints(state);
  const left = state.ap?.left ?? 0;
  const pips = `<span class="pips" role="img" aria-label="행동력 ${left}/${apMax}">${'●'.repeat(left)}${'○'.repeat(Math.max(0, apMax - left))}</span>`;
  if (isEnded(state)) return `<div class="calstrip"><span>📅 ${esc(dateLabel(state))}${state.calendar.endingId === 'bad' ? '' : ' · 자유 영업'}</span><span>행동력 ${pips}</span></div>`;
  const c = calendarOf(state.day);
  const due = interestDue(state, c.monthIdx);
  const when = c.part === 2 ? '이번 영업 뒤' : `${PARTS[2]} 영업 뒤`;
  return `<div class="calstrip"><span>📅 ${esc(dateLabel(state))} · 남은 ${turnsLeft(state)}순</span><span title="하순 영업을 마치면 이자가 나갑니다">💸 ${when} 이자(월 ${Math.round(interestRate(state, c.monthIdx)*100)}%) 약 ${won(due)}</span><span>행동력 ${pips}</span></div>`;
}

// ── 하단 패널
export function panelHtml(state, ui) {
  if (!state) return '';
  if (state.mode === 'shift'||state.mode==='prep'&&!state.interior.draft) return cafePanel(state, ui);
  if (state.mode === 'hunt') return huntPanel(state);
  if (state.mode === 'settlement') return `<div class="prep">${btn({ action: 'overlay.settlement', label: '📒 결산 보기', cls: 'primary big' })}</div>`;
  if (state.interior.draft) return decorPanel(state,ui);
  return prepPanel(state);
}

// 영업 정보는 요청할 때만 펼친다. 카페 크기는 주문 수와 무관하다.
function cafeTopbar(state,ui){
 const shift=state.mode==='shift',cp=cafeProgress(state),yp=yeoniProgress(state);
 return `<div class="cafe-status-main"><span class="cafe-seal" aria-hidden="true">${uiIcon('cup')}</span><div class="cafe-clock"><b>${shift?fmtTime(remainingShift(state)):esc(shortDate(state))}</b><small>${activeBranch(state)}호점 · ${shift?(state.paused?'잠시 쉬는 중':'카페 영업 중'):'영업 준비'}</small></div><span class="cafe-gold">${won(state.gold)}</span>${btn({action:'play.cycle',label:(ui.playSpeed||1)+'배',title:'영업 속도'})}${shift?btn({action:'pause',label:state.paused?'계속':'멈춤'}):btn({action:'decor.open',label:'꾸미기'})}</div><nav class="cafe-status-details" aria-label="카페 주요 정보">${btn({action:'cafe.drawer',args:{tab:'crew'},title:'인기도',label:`<small><span class="status-symbol status-popularity">${uiIcon('heart')}</span><span class="status-label">인기도</span></small><b>${popularity(state).toFixed(1)}</b>`})}${btn({action:'cafe.drawer',args:{tab:'crew'},title:'분위기',label:`<small><span class="status-symbol status-atmosphere">${uiIcon('leaf')}</span><span class="status-label">분위기</span></small><b>${atmosphere(state)}</b>`})}${btn({action:'cafe.drawer',args:{tab:'crew'},title:state.hostbar.open?'카페 성장 · 네오 스트레스 '+Math.round(stressOf(state))+'/100':'카페 성장',label:`<small><span class="status-symbol status-cafe">${uiIcon('cup')}</span><span class="status-label">카페</span></small><b>Lv.${cp.level}</b>`})}${btn({action:shift?'cafe.drawer':'yeoni.kitchen',args:{tab:'crew'},title:'연이 성장',label:`<small><span class="status-symbol status-yeoni">${uiIcon('flower')}</span><span class="status-label">연이</span></small><b>Lv.${yp.level}</b>`})}${btn({action:shift?'cafe.drawer':'yeoni.kitchen',args:{tab:'crew'},title:'행동력',label:`<small><span class="status-symbol status-energy">${uiIcon('energy')}</span><span class="status-label">행동력</span></small><b>${state.ap.left}/${maxActionPoints(state)}</b>`})}</nav>`;
}
function hostServiceControls(state){
 const chk=feverCheck(state),active=state.fever.activeUntil!=null;
 return `${catCafeControl(state)}<p>${esc(personName(state,"neo"))} · ${esc(stressLabel(state))} · 스트레스 ${Math.round(stressOf(state))}/100</p>${btn({action:'fever.activate',disabled:!chk.ok,title:chk.reason||'20초 동안 대상 팁 2배',label:active?'피버 진행 중':`피버 ${state.fever.gauge}/100`})}${stageButton(state)}${fanRows(state)}`;
}
// 무대 공연: 피버 게이지를 다 채우면 피버 대신 고른다(멤버 합류 뒤에만 보인다)
function stageButton(state){
 if(!DEST1NOVA_IDS.some(id=>id!=='neo'&&state.roster[id]))return '';
 const chk=stageCheck(state),on=stageActive(state);
 return btn({action:'stage.perform',cls:'stagebtn'+(on?' active':chk.ok?' ready':''),disabled:!chk.ok,title:chk.ok?'30초 무대 · 손님이 꽃잎 지폐와 금화를 던지고 손님이 몰려와요':chk.reason,label:on?`무대 공연 ${fmtTime(state.stage.activeUntil-state.shift.elapsedMs)} · ×${state.stage.power}`:'🎤 무대 공연'});
}
// 멤버 인기: 합류한 DEST1NOVA 멤버마다 팬 수와 인기 단계
function fanRows(state){
 const ids=DEST1NOVA_IDS.filter(id=>state.roster[id]);
 return ids.length?`<ul class="fan-rows" aria-label="멤버 인기">${ids.map(id=>{const n=fansOf(state,id),next=nextTierAt(state,id);return `<li><b>${esc(personName(state,id))}</b><span>${esc(fanTierName(state,id))}</span><small>팬 ${n.toLocaleString('ko-KR')}${next?` / ${next.toLocaleString('ko-KR')}`:''}</small></li>`;}).join('')}</ul>`:'';
}
function concertButton(state){
 if(!state.hostbar.open)return '';
 const chk=concertCheck(state),q=concertQuote(state);
 return btn({action:'concert.hold',cls:'concertbtn',disabled:!chk.ok,title:chk.ok?`행동력 ${TEMP.CONCERT.AP} · ${q.seats}석 × ${q.ticket}G · 멤버 전원 팬 +${q.fans}`:chk.reason,label:`🎶 이달의 정기 콘서트 <small>${chk.ok?`예상 ${won(q.gold)}`:esc(chk.reason)}</small>`});
}
// 청토끼 통첩 중이면 영업 화면 위에 남은 금액·순을 띄운다(누르면 상환 창)
function creditorAlert(state){const u=creditorView(state)?.ultimatum;return u?btn({action:'sheet.open',args:{sheet:'debt'},cls:'creditor-alert',label:`청토끼 통첩 · ${won(u.need)} 더 갚기 · ${u.turnsLeft}순 남음`}):'';}
function cafePanel(state,ui){
 const shift=state.mode==='shift', selected=ui.cafeDrawer||'', ready=state.tray.filter(it=>it&&!it.reservedFor).length;
 const pending=Object.values(state.orders).filter(o=>['waiting','assigned'].includes(o.status)).length;
 const count=Object.keys(state.customers).length,capacity=cafeCapacity(state),sc=startCheck(state);
 const tabs=shift?[['orders',`주문 ${pending}`],['kitchen',`픽업 ${ready}`],['crew','직원']]:[['prepare','영업 준비'],['kitchen','주방'],['crew','직원']];
 const slots=state.tray.map((it,i)=>it?btn({action:'tray.tap',args:{i},cls:'cafe-ready-dish',disabled:!!it.reservedFor,label:assetIcon('icons/'+it.menuId)+esc(MENUS[it.menuId].short)+' · '+qualityOf(it.quality).label+' · '+(it.reservedFor?'운반 중':'전달하기')}):'').join('');
 const queue=Object.values(state.customers).filter(c=>c.state==='checkout');
 const panels={
  orders:customerOrders(state),
  kitchen:shift?`${stationDock(state)}<h3>픽업 선반</h3>${slots||'<p>루나 언니가 완성한 메뉴가 여기에 놓여요.</p>'}${btn({action:'sheet.open',args:{sheet:'kitchen'},label:'레시피 · 재료 보기'})}`:btn({action:'yeoni.kitchen',cls:'primary',label:'연이의 요리 · 특별 메뉴'})+btn({action:'sheet.open',args:{sheet:'kitchen'},label:'레시피 · 재료 보기'}),
  crew:`${yeoniGrowthHtml(state)}${state.hostbar.open?hostServiceControls(state):''}<div class="cafe-scores">${scoreChip('reputation',popularity(state))}${scoreChip('atmosphere',atmosphere(state))}</div>${automationChips(state)}${btn({action:'sheet.open',args:{sheet:'companions'},label:'동료와 이야기'})}${btn({action:'sheet.open',args:{sheet:'staffing'},label:'직원 배치'})}${btn({action:'sheet.open',args:{sheet:'manage'},label:uiIcon('book')+'카페 수첩'})}`,
  counter:`<p>연이가 한 분씩 계산해 드려요.</p>${queue.length?queue.map((c,i)=>`<p>${i+1}번째 · ${esc(c.label)} · ${won(state.visits[c.visitId]?.bill||0)}${c.payAt?' · 계산 중':' · 기다리는 중'}</p>`).join(''):'<p>아직 계산을 기다리는 손님은 없어요.</p>'}`,
  prepare:`<p>의자 ${capacity.seats}석 · 루나는 홀, 루나 언니는 주방을 맡아요.</p>${concertButton(state)}${btn({action:'decor.open',label:'카페 꾸미기'})}${state.interior.checkoutLayout!=='entrance-left'?btn({action:'interior.checkoutPreview',label:'입구 계산대 미리보기'}):''}${btn({action:'sheet.open',args:{sheet:'shop'},label:'모카에게 재료 사기'})}${btn({action:'sheet.open',args:{sheet:'branches'},label:'지점 관리'})}`,
  menu:navRow([['town','재성의 섬'],['shop','재료'],['companions','동료'],['manage','수첩']]),
 };
 return `<div class="cafe-commandbar">${creditorAlert(state)}${journeyHtml(state)}${hostDeskHtml(state)}${shift?cafeTodoHtml(state):''}<div class="cafe-utility-line"><p class="cafe-live-line" role="status">${shift?(ready?`완성 ${ready}개 · 전달하기를 눌러요`:`손님 ${count}명 · 테이블을 눌러 주문을 받아요`):'오늘은 어떤 손님이 찾아올까요?'}</p>${btn({action:'sheet.open',args:{sheet:'manage'},cls:'cafe-utility',label:uiIcon('book')+'<span>수첩</span>'})}${musicToggle(shift)}${btn({action:'sheet.open',args:{sheet:'audio'},cls:'cafe-utility',label:uiIcon('music')+'<span>음악</span>'})}${btn({action:'game.title',cls:'cafe-utility',label:uiIcon('home')+'<span>메인</span>',title:'저장하고 메인 화면으로'})}</div>${!shift?`<div class="cafe-opening"><span><b>오늘의 영업</b><small>${capacity.seats}석 · 10분</small></span>${btn({action:'shift.start',cls:'primary cafe-open',disabled:!sc.ok,title:sc.ok?'영업 시작하기':sc.reasons.join(' · '),label:uiIcon('cup')+'<span>영업 시작하기</span>'})}</div>${!sc.ok?`<p class="cafe-start-reason">${esc(sc.reasons.join(' · '))}</p>`:''}`:''}<nav class="cafe-actions" aria-label="카페 조작">${tabs.map(([tab,label])=>btn({action:'cafe.drawer',args:{tab},cls:'cafe-nav-item '+(selected===tab?'selected':''),pressed:selected===tab,label:uiIcon(({orders:'orders',kitchen:'kitchen',crew:'crew',prepare:'cup'})[tab])+`<span>${label}</span>`})).join('')}${btn({action:'delivery.open',cls:'cafe-nav-item',label:uiIcon('cup')+'<span>모카 배달</span>'})}${btn({action:'sheet.open',args:{sheet:'town'},cls:'cafe-nav-item',label:uiIcon('island')+'<span>재성의 섬</span>'})}</nav></div><section class="cafe-drawer" ${selected?'':'hidden'} aria-label="카페 상세 조작"><header><b>${({orders:'손님 주문',kitchen:'주방 · 픽업',crew:'카페와 동료',counter:'연이의 계산대',prepare:'영업 준비',menu:'수첩'})[selected]||''}</b>${btn({action:'cafe.drawer.close',label:'닫기'})}</header><div class="cafe-drawer-body">${Object.entries(panels).map(([id,content])=>`<div data-cafe-tab="${id}" ${selected===id?'':'hidden'}>${content}</div>`).join('')}</div></section>`;
}

function navRow(items) {
  return `<div class="nav">${items.map(([sheet, label]) => btn({ action: 'sheet.open', args: { sheet }, label: `${assetIcon(({kitchen:'icons/fortune_latte',shop:'icons/bean',quests:'farm/seeds',more:'skills/hat',companions:'skills/bell',debt:'icons/moonstone',farm:'farm/seeds',town:'ui/town-node-atelier',manage:'ui/ledger'})[sheet])}${esc(label.replace(/^[^가-힣A-Za-z]+/,''))}` })).join('')}</div>`;
}

function shiftPanel(state, ui) {
  const slots = state.tray.map((it, i) => {
    if (!it) return '';
    const m = MENUS[it.menuId];
    const target = it.reservedFor ? null : findServeTarget(state, it);
    const to = it.reservedFor ? '🚶 운반 중' : target != null ? `→ ${target}번` : '주문 없음';
    const sel = ui.selectedSlot === i ? ' sel' : '';
    return `<button type="button" class="slot${sel}" data-action="tray.tap" data-i="${i}" data-key="slot${i}" aria-pressed="${!!sel}" aria-label="트레이 ${i + 1}번 ${esc(m.name)} ${esc(to)}">
      <span>${assetIcon(`icons/${m.id}`,`<i class="dot" style="background:${m.color}"></i>`)} ${esc(m.short)} · ${qualityOf(it.quality).label}</span><span class="to">${esc(to)}</span></button>`;
  }).join('');
  const held = Object.entries(state.stations).filter(([, s]) => s.held)
    .map(([sid, s]) => `⚠ 트레이가 가득 차 ${STATION_NAMES[sid]} 위에 ${MENUS[s.held.menuId].short} 보관 중`);
  const hint = ui.selectedSlot != null && state.tray[ui.selectedSlot]
    ? `<div class="small" style="color:var(--info)">🍽 ${esc(MENUS[state.tray[ui.selectedSlot].menuId].name)} 선택됨 — 테이블을 누르면 서빙, 같은 칸을 다시 누르면 주문한 테이블로</div>` : '';

  const hosts = usableHosts(state).filter(id => state.staff[id]);
  const hostCards = hosts.map(id => {
    const busy = personBusyReason(state, id);
    const txt = busy ? busy.replace(`${personName(state, id)}: `, '') : staffStatusText(state, id) || '대기';
    const color = id === 'neo' ? '#5b6fb0' : '#9a9a9a';
    return btn({ action: 'sheet.open', args: { sheet: 'companions' }, cls: 'hostcard', title: `${personName(state, id)} 상태: ${txt}`,
      label: `<span class="av" style="background:${color}">${esc(personName(state, id).slice(0, 1))}</span><span class="txt"><b>${esc(personName(state, id))}</b><span class="small">${esc(txt)}</span></span>` });
  });
  const hostCell = hostCards.length > 1 ? `<div class="row" style="min-width:0;overflow-x:auto">${hostCards.join('')}</div>` : hostCards[0] || '<span></span>';

  const fv = state.fever;
  const active = fv.activeUntil != null;
  const chk = feverCheck(state);
  const fcls = active ? 'feverbtn active' : fv.gauge >= RULES.FEVER_GAUGE_MAX ? 'feverbtn ready' : 'feverbtn';
  const flabel = active ? `🔥 피버 ${fmtTime(fv.activeUntil - state.shift.elapsedMs)}` : fv.gauge >= RULES.FEVER_GAUGE_MAX ? '🔥 피버!' : `피버 ${fv.gauge}/100`;
  const fever = btn({ action: 'fever.activate', cls: fcls, disabled: !chk.ok, title: chk.ok ? '피버 발동 (20초, 대상 팁 2배)' : chk.reason,
    label: `<span>${flabel}</span><span class="gauge" aria-hidden="true"><i style="width:${active ? 100 : fv.gauge}%"></i></span>` });

  return `<h2 class="service-heading">손님 주문</h2>${customerOrders(state)}<h2 class="service-heading">주방 · 픽업</h2>${stationDock(state)}${automationChips(state)}<div class="tray" role="group" aria-label="완성 트레이 ${state.tray.length}칸" data-label="픽업 선반">${slots || '<p class="tray-guide">완성 서빙대 · 주문 메뉴를 눌러 조리해 주세요.</p>'}</div>
    ${held.length ? `<div class="small warn">${esc(held.join(' / '))}</div>` : ''}${hint}
    <div class="hostrow${state.hostbar.open ? '' : ' cafe-only'}">${state.hostbar.open ? hostCell + fever : ''}</div>
    ${navRow([['kitchen','주방'],['shop','배달'],['companions','동료'],['manage','수첩']])}`;
}

function prepPanel(state) {
 const capacity=cafeCapacity(state),sc=startCheck(state), available=recruitView(state).filter(c=>c.status==='available');
 const readyMenus=Object.values(MENUS).filter(m=>state.learned[m.id]&&Object.entries(m.ingredients).every(([id,n])=>(state.stock[id]||0)>=n)).length;
 const summary=`<section class="prep-summary"><h2>오늘의 영업 준비</h2><dl><dt>준비된 메뉴</dt><dd>${readyMenus}종</dd><dt>테이블</dt><dd>${state.interior.furniture.filter(f=>FURNITURE[f.defId]?.table).length}개</dd><dt>직원 배치</dt><dd>${assignedHosts(state).length+3}/${capacity.staffSlots}명</dd><dt>수용 좌석</dt><dd>${capacity.seats} / 최대 ${capacity.tableLimit}</dd><dt>홀 담당</dt><dd>루나</dd><dt>주방 담당</dt><dd>루나 언니</dd></dl><p>${sc.ok?'문을 열 준비가 됐어요. 재료와 자리를 한 번 살펴볼까요?':esc(sc.reasons.join(' · '))}</p><div>${btn({action:'decor.open',label:'카페 꾸미기'})}${btn({action:'sheet.open',args:{sheet:'staffing'},label:'직원 배치'})}${btn({action:'decor.open',args:{space:'outdoor'},label:'정원·외부 꾸미기'})}${btn({action:'sheet.open',args:{sheet:'branches'},label:'지점 관리'})}</div></section>`;
 return `<div class="cafe-dock">${summary}<div class="day-plan"><span>${esc(dateLabel(state))}</span><span>행동력 ${state.ap?.left??0}/${maxActionPoints(state)}</span></div>${available.length?btn({action:'recruit.event',args:{id:available[0].id},cls:'new-friend',label:available[0].id==='seohanbi'?'봉인된 초대장이 도착했어요':`${esc(available[0].name)}의 초대장` }):''}${btn({action:'shift.start',cls:'primary open-cafe',disabled:!sc.ok,title:sc.ok?'10분 영업을 시작해요':sc.reasons.join(' / '),label:`${assetIcon('icons/fortune_latte')} 카페 문 열기 <small>10:00</small>`})}${navRow([['kitchen','주방'],['farm',placeLock(state,'farm')?'농장 🔒':'농장'],['town','마을'],['manage','수첩']])}</div>`;
}

// 이번 단계 목표: 준비 시간 → 보스 등장 → 보스 처치 = 클리어
function huntGoal(h,state){const w=getHuntWorld(state),boss=w&&findBoss(w)>=0;if(boss||h.bossSpawned)return '<b class="hunt-goal boss">보스 처치 = 클리어</b>';const left=Math.max(0,stageDef(h.depth).prepMs-(h.stageMs||0));return `<span class="hunt-goal">보스까지 ${fmtTime(left)}</span>`;}
function huntPanel(state){const h=state.hunt;return `<div class="hunt-dock"><div class="row"><b class="grow">${hunterName(h.hunterId)} · 성장 Lv.${h.careerLevel} · ${h.depth}/100단계</b>${huntGoal(h,state)}<span>처치 ${h.kills}</span>${btn({action:h.status==='running'?'hunt.retreat':'overlay.hunt',label:h.status==='running'?'귀환':'결과'})}</div><div class="hunt-audio-controls">${btn({action:'audio.change',args:{key:'music'},label:audioStatus().music?'BGM 끄기':'BGM 켜기'})}${btn({action:'sheet.open',args:{sheet:'audio'},label:'사냥 음악 선택'})}</div><details class="hunt-kit-details"><summary>성장 · 기술 보기</summary><div class="hunt-kit">${h.hunterId==='yeoni_pig'?kfpKit(h)+(h.kfp?.legacy?h.weapons.map(w=>`<span class="hunt-skill" title="이전 저장에서 이어받은 기술"><small>${esc(WEAPONS[w.id].name)} Lv.${w.level}</small></span>`).join(''):''):h.weapons.map(w=>`<span class="hunt-skill" title="${esc(WEAPONS[w.id].name)}">${assetIcon(`skills/${w.id}`)}<small>${esc(WEAPONS[w.id].name)} ${w.evo?'★':'Lv.'+w.level}</small></span>`).join('')}${Object.entries(h.passives).map(([id,lv])=>`<span class="hunt-skill" title="${esc(PASSIVES[id].name)}">${assetIcon(`skills/${id}`)}<small>${esc(PASSIVES[id].name)} Lv.${lv}</small></span>`).join('')}</div></details>${h.hunterId==='yeoni_pig'?btn({action:'hunt.petal',cls:'hunt-petal',disabled:(h.petal?.charge||0)<100,label:`꽃잎포 ${h.petal?.charge||0}/100`,title:'적 처치로 충전 · 꽃잎포 자체 처치는 충전하지 않아요'}):''}${huntSuppliesHtml(state)}<small>${trailButton(h)}${h.hunterId==='yeoni_pig'?btn({action:'sheet.open',args:{sheet:'kfp'},label:'무기 조합 · 진화 조건',cls:'kfp-open'}):''}드래그로 이동 · 가까운 적 자동 공격</small></div>`;}

// ── 무대 위 DOM 층. 동료 수다는 하단 패널 높이를 먹지 않도록 무대 왼쪽 아래에 띄운다(주문 카드가 밀려 잘리지 않게).
// 10-29 지금 할 일: 한 번 누르면 처리되는 일을 급한 순서로 4개까지. 좁은 화면은 첫 일 하나와 남은 수만
function cafeTodoHtml(state){
 const tasks=cafeTasks(state);if(!tasks.length)return '';
 const rows=tasks.slice(0,4).map((k,i)=>btn({action:k.action,args:k.args,cls:`todo-${k.kind}${i?' todo-rest':''}`,title:`${k.text} ${k.verb}`,label:`${k.menuId?assetIcon('icons/'+k.menuId):'<i class="todo-mark" aria-hidden="true"></i>'}<span>${esc(k.text)}</span><em>${k.verb}</em>`})).join('');
 const more=tasks.length>1?btn({action:'cafe.drawer',args:{tab:'orders'},cls:`todo-more${tasks.length>4?'':' narrow-only'}`,title:'주문 현황 전체 보기',label:`<span class="m-narrow">+${tasks.length-1}</span><span class="m-wide">+${tasks.length-4} 더 보기</span>`}):'';
 return `<section class="cafe-todo" aria-label="지금 할 일"><h3>지금 할 일 <small>${tasks.length}</small></h3>${rows}${more}</section>`;
}

export function bubblesHtml(ui){return chatterRibbon(ui);}

function bubbleOf(state, t, now) {
  const c = t.customerId ? state.customers[t.customerId] : null;
  if (!c) {
    if (t.state === 'dirty') return { cls: 'dirty', text: t.cleanQueued ? '🧽 정리 대기' : '🧽 정리 필요' };
    if (t.state === 'cleaning') return { cls: 'dirty', text: `🧽 정리 중 ${fmtTime((t.cleanEndAt ?? now) - now)}` };
    return null;
  }
  const visit = state.visits[c.visitId];
  if (!visit) return null;
  const orders = openOrdersOfVisit(state, visit);
  const orderText = orders.map(o => MENUS[o.menuId].short + (o.status === 'assigned' ? '🚶' : '')).join('·');
  switch (c.state) {
    case 'requesting': {
      const left = TEMP.NOMINATION_PATIENCE_MS - (now - visit.requestAt);
      return { cls: 'req', text: `💌 ${personName(state, visit.nominee)} 지명 · ${fmtTime(left)}` };
    }
    case 'hosted': {
      const open = visit.help.find(h => h.status === 'open');
      if (open) return { cls: 'help', text: `SOS · ${HELP_KINDS[open.kind].label} ${fmtTime(open.until - now)}` };
      return { cls: 'host', text: `🫖 접대 ${fmtTime(visit.endAt - now)}${orderText ? ` · 🍽${orderText}` : ''}` };
    }
    case 'thinking': return { cls: '', text: '💭 고민 중' };
    case 'waiting_food': {
      if (!orders.length) return { cls: '', text: '🍽 대기' };
      const left = foodPatienceMs(state) - (now - orders[0].placedAt);
      const waiting = orders.find(o => o.status === 'waiting');
      const ready = waiting && state.tray.some(it => it && !it.reservedFor && it.menuId === waiting.menuId);
      return { cls: ready ? 'ready' : '', orderId: waiting?.id, text: `🍽 ${orderText} · ${ready ? '서빙' : waiting ? '만들기' : '운반 중'} ${fmtTime(left)}` };
    }
    case 'eating': return { cls: '', text: '😋 식사 중' };
    default: return null;
  }
}

// ── 테이블 터치 영역(최소 44px)
export function hitsHtml(state, v, ui) {
  if (state?.interior.draft) return decorStageHtml(state, ui);
  if (!state || !['shift','prep'].includes(state.mode) || !v || state.interior.draft) return '';
  const musicHits=state.interior.furniture.filter(f=>f.defId==='record_player'&&f.x!=null).map(f=>{const cells=furnitureCells(f),x=cells.reduce((n,c)=>n+c.x,0)/cells.length+.5,y=Math.max(...cells.map(c=>c.y))+1,p=cellToPx(v,x,y);return `<button class="hit record-player-hit" data-action="sheet.open" data-sheet="audio" aria-label="LP 플레이어 · 음악 켜기와 곡 선택" style="left:${p.x-v.tile*1.25}px;top:${p.y-v.tile*2.7}px;width:${Math.max(44,v.tile*2.5)}px;height:${Math.max(44,v.tile*2.7)}px"></button>`;}).join('');
  if(state.mode==='prep')return musicHits;
  const size = Math.max(44, Math.round(v.tile * 1.3));
  const sel = ui.selectedSlot != null ? state.tray[ui.selectedSlot] : null;
  const target = sel && !sel.reservedFor ? findServeTarget(state, sel) : null;
  const fixtures=cafeLayout(state).fixtures.filter(f=>!f.wall).map(f=>{const x=f.cells.reduce((n,c)=>n+c[0],0)/f.cells.length+.5,y=f.cells.reduce((n,c)=>n+c[1],0)/f.cells.length+1,p=cellToPx(v,x,y);return `<button class="hit fixture-hit" data-key="fixture-${f.id}" data-action="cafe.drawer" data-tab="${f.id==='counter'?'counter':'kitchen'}" aria-label="${f.name} 누르기" style="left:${p.x-30}px;top:${p.y-36}px;width:60px;height:44px"></button>`;}).join('');
  return musicHits+fixtures+state.tables.map(t => {
    const p = cellToPx(v, t.table.x + 0.5, t.table.y + 0.5);
    const cls = target === t.no ? 'hit target' : 'hit';
    return `<button type="button" class="${cls}" data-key="h${t.no}" data-action="table.tap" data-no="${t.no}" aria-label="${t.no}번 테이블" style="left:${Math.round(p.x - size / 2)}px;top:${Math.round(p.y - size / 2)}px;width:${size}px;height:${size}px"></button>`;
  }).join('');
}

export { won };

function customerOrders(state){
 // 정리 수를 누르면 첫 테이블 팝오버를 연다.
 const count=state.tables.filter(t=>t.state==='dirty').length;
 const tidy=count?`<div class="tidy-count">${btn({action:'table.firstDirty',label:`정리 ${count}`})}</div>`:'';
 const rows=tidy+Object.values(state.customers).map(c=>{
  const v=state.visits[c.visitId];if(!v||c.state==='leaving')return '';
  const pending=v.orderIds.map(id=>state.orders[id]).filter(o=>o&&['waiting','assigned'].includes(o.status));
  const order=pending.find(o=>o.status==='waiting')||pending[0];
  // 10-29 주문 영수증: 메뉴 이름을 한 줄로 이어 붙이면 잘리므로 메뉴마다 상태 칩으로 다 보여 준다
  const chips=orderChipsHtml(state,v),items=v.orderIds.map(id=>state.orders[id]).filter(o=>o&&o.status!=='cancelled').map(o=>MENUS[o.menuId].short).join(' · ');
  const job=order&&Object.values(state.stations).flatMap(s=>stationJobs(s)).find(j=>j&&j.orderId===order.id);
  const tray=order&&state.tray.some(it=>it?.menuId===order.menuId&&!it.reservedFor&&(!it.orderId||it.orderId===order.id)), help=v.help?.some(h=>h.status==='open');
  const score=waitingSatisfaction(state,v),mood=score>=80?'여유':score>=55?'기다림':'서둘러요';
  const status=help?'도움 요청':c.state==='checkout'?guestMotion(c):job?'조리 중':tray?'완성 · 전달하기':order?.status==='assigned'?'가져가는 중':order?'주문 · 만들기':c.state==='eating'?'맛있게 먹는 중':c.state==='requesting'?'지명 요청':c.state==='entering'?'자리로 안내 중':'메뉴 고르는 중';
  return btn({action:help?'table.tap':order?.status==='waiting'&&!job?'order.quick':'table.tap',args:{id:order?.id||'',no:c.tableNo,key:'order-'+c.id},disabled:c.tableNo===0&&(!order||!!job),cls:'customer-order',title:`${c.tableNo?c.tableNo+'번':'포장'} · ${items||status} · ${status}`,label:`<span class="order-no" aria-hidden="true">${v.kind==='takeaway'?'포장':c.tableNo}</span><span class="order-content"><b>${v.kind==='takeaway'?'포장':`${c.tableNo}번`} · ${esc(CUSTOMER_WEALTH[v.wealthId]?.name||'손님')}</b>${chips?`<span class="order-chips">${chips}</span>`:''}<small>${status}</small>${pending.length?`<span class="patience ${score<55?'urgent':''}"><meter min="0" max="100" value="${score}" aria-label="손님 만족도 ${score}점"></meter><small>${mood}</small></span>`:''}</span>`});
 }).join('');
 return `<div class="customer-orders" aria-label="손님 주문 현황">${rows||'<p class="tray-guide">곧 첫 손님이 찾아와요. 재료와 주방을 준비해 주세요.</p>'}</div>`;
}
function stationDock(state){return `<div class="station-dock" aria-label="주방 설비">${[['drink','음료 머신'],['oven','오븐']].map(([id,name])=>{
 const st=state.stations[id],jobs=runningJobs(st),held=stationItems(st);
 const rows=jobs.slice(0,2).map(job=>{const m=MENUS[job.menuId],pct=Math.min(100,job.progressMs/job.durationMs*100);return `<span class="station-job" data-job="${job.id}"><i class="station-ring" style="--progress:${pct}%">${assetIcon('icons/'+m.id)}</i><span><small>${esc(m.short)} · ${Math.max(0,Math.ceil((job.durationMs-(job.progressMs||0))/1000))}초</small><progress max="100" value="${pct}" aria-label="${esc(m.name)} 조리 진행"></progress></span></span>`;}).join('');
 return btn({action:'sheet.open',args:{sheet:'kitchen'},label:`<span class="station-summary"><b>${name}${jobs.length>1?' · 동시 조리':''}</b>${rows||'<small>준비됨</small>'}${jobs.length>2?`<small>외 ${jobs.length-2}건 · 주방에서 전체 보기</small>`:''}${held.map(it=>`<small>완성 · ${esc(MENUS[it.menuId].short)} · ${qualityOf(it.quality).label} 보관</small>`).join('')}${st.next?`<small>다음 · ${esc(MENUS[st.next.menuId].short)}</small>`:''}</span>`});
}).join('')}</div>`;}
function chatterRibbon(ui){const c=ui.chatter;if(!c||performance.now()>c.until)return '';return `<aside class="cafe-chatter${c.hunting?' hunt-chatter':''}" aria-label="${c.hunting?'영냥이의 이야기':'카페에서 들리는 이야기'}">${assetIcon('badges/'+c.portrait)}<div><b>${esc(c.speaker)}</b><p>${esc(c.line)}</p></div>${c.hunting?'<button class="chatter-close" data-action="chatter.close" aria-label="짧은 대화 닫기">×</button>':''}</aside>`;}

export function automationChips(state) {
 return `<div class="automation-chips">${['kitchen','hall','hall_neo'].map(ability=>{
  const st=automationStatus(state,ability),a=abilityCheck(state,ability),label=ability==='kitchen'?'자동 조리':'홀 자동',detail=`${a.name} · 지금 Rank ${a.current} / 필요 Rank ${a.need} · ${st.reason}`;
  const next=st.locked?(a.current<a.need?'동료와 대화하고 좋아하는 선물을 전해 주세요.':'동료 수첩에서 이 단계의 인연 이야기를 만나세요.'):(st.on?'누르면 자동 업무를 쉬어요.':'누르면 이 동료의 자동 업무를 켜요.');
  return `<span class="automation-tip"><button data-action="automation.toggle" data-ability="${ability}" data-locked="${st.locked}" title="${esc(detail)}" aria-label="${esc(a.name+' '+label+' · '+detail)}" aria-describedby="auto-tip-${ability}" aria-pressed="${st.on}"><span class="auto-portrait">${assetIcon('badges/'+a.who)}</span><span class="auto-copy"><b>${esc(a.name)} <span class="auto-state">${st.locked?uiIcon('lock')+'인연으로 열기':st.on?'사용 중':'쉬는 중'}</span></b><span>${label} · 현재 Rank ${a.current} / 필요 Rank ${a.need}</span><small>${esc(next)}</small></span><progress max="${a.need}" value="${Math.min(a.current,a.need)}" aria-label="${esc(a.name)} 인연 ${a.current} / ${a.need}"></progress></button><span id="auto-tip-${ability}" role="tooltip">${esc(detail)}</span></span>`;
 }).join('')}</div>`;
}
