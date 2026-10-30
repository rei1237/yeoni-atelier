// 카페 꾸미기 한 화면: 실내·정원 배치, 가구 구매, 공간 확장을 같은 초안에서 다룬다.
// 구매·증축은 누르는 즉시 확정(골드 차감 · 보관함)되고, 배치는 '배치 적용'을 눌러야 카페에 반영된다.
import {cafeCapacity} from '../game/capacity.js';
import {FURNITURE,AREAS} from '../data/layout.js';
import {TEMP} from '../config/balance.temp.js';
import {furnitureCells} from '../game/space.js';
import {preview} from '../game/interior.js';
import {nextExpansion,areaPrice,decorPrice} from '../game/town.js';
import {areaAvailable} from '../game/branches.js';
import {placeLock} from '../game/unlocks.js';
import {groundsOf,groundSize,groundExpansion,GARDEN_ITEMS,FLOOR_THEMES,gardenItem,gardenPrice,validateGround} from '../game/grounds.js';
import {groundsMap,remodelList} from './grounds.js';
import {assetIcon} from './asset-html.js';
import {btn,esc} from './dom.js';

const gold=n=>`${Math.floor(n).toLocaleString('ko-KR')}G`;
const category=f=>(FURNITURE[f.defId].table||FURNITURE[f.defId].chair)?'seats':FURNITURE[f.defId].cells.every(c=>c.kind==='floor')?'floor':'decor';
const size=cells=>`${Math.max(...cells.map(c=>c.x))-Math.min(...cells.map(c=>c.x))+1}×${Math.max(...cells.map(c=>c.y))-Math.min(...cells.map(c=>c.y))+1}칸`;
const footprint=f=>size(furnitureCells({...f,x:0,y:0}));
const art=f=>`objects/${FURNITURE[f.defId].table?'basic_table':FURNITURE[f.defId].chair?'chair_'+['up','right','down','left'][f.rot&3]:f.defId}`;
const itemName=f=>FURNITURE[f.defId].name+(f.tableNo?` ${f.tableNo}번`:'');

// 배치 문제 코드 → 한 문장. 원래 문구에는 가구 이름과 칸이 들어 있어 목록에서는 그대로 쓴다.
export const PROBLEM_HINT=Object.freeze({bounds:'가게 밖이에요',fixture:'고정 설비와 겹쳐요',reserved:'주방·입구·계산 대기칸은 비워 둬야 해요',locked:'아직 열지 않은 공간이에요 · 공간 확장에서 열어요',overlap:'다른 가구와 겹쳐요',tables:'테이블은 모두 카페에 놓아야 해요',service:'테이블 옆에 서빙 통로 한 칸이 필요해요',seat:'입구에서 의자까지 길이 막혀요',queue:'계산 대기줄 통로를 막아요',aisle:'손님이 지나갈 통로를 막아요'});
// 놓은 뒤 한 줄: 분위기 상승과 보관함의 다음 추천 가구(분위기 큰 것부터, 구매 유도 없이 진행 안내만)
export function placedNote(state,uid){const fs=state.interior.draft?.furniture||[],f=fs.find(x=>x.uid===uid);if(!f)return '';
 const next=fs.filter(x=>x.x==null&&x.uid!==uid).sort((a,b)=>FURNITURE[b.defId].ambience-FURNITURE[a.defId].ambience)[0];
 return `🌸 ${itemName(f)} · 분위기 +${FURNITURE[f.defId].ambience}`+(next?` · 다음 추천: ${itemName(next)}`:' · 보관함을 모두 놓았어요');}
export const problemHint=p=>p?PROBLEM_HINT[p.code]||p.msg:'';

// 적용하지 않은 배치가 있는지(구매는 이미 확정이라 변경으로 치지 않는다)
export function decorDirty(state){
 const d=state.interior.draft;if(!d)return false;const g=state.outdoor?.draft;
 return !!d.itemBefore||JSON.stringify(d.furniture)!==JSON.stringify(state.interior.furniture)||(d.checkoutLayout||'legacy')!==(state.interior.checkoutLayout||'legacy')
  ||!!g&&(JSON.stringify(g.items)!==JSON.stringify(state.outdoor.items)||g.floor!==state.outdoor.floor);
}

// 구매 버튼 연타 방지: 직전 구매에서 400ms 안의 두 번째 누름은 무시한다.
export function purchaseGate(ui,now){if(now<(ui.buyLockUntil||0))return false;ui.buyLockUntil=now+400;return true;}

// 첫 꾸미기 안내: 화면 안 한 줄. 실제 상태로만 다음 단계로 넘어간다.
export function decorCoach(state,ui){
 const d=state.interior.draft;if(state.tutorials?.decorate||!d||d.checkoutPreview)return null;
 if(ui.decorSpace==='outdoor')return {n:0,text:'정원·외부는 가구를 고른 뒤 격자를 누르면 바로 옮겨져요. 대문에서 입구까지 길을 남겨 주세요.'};
 const s=d.itemBefore&&d.furniture.find(f=>f.uid===d.selected);
 if(!d.itemBefore)return d.undo?.length?{n:4,text:'좋아요! 배치 적용을 눌러야 실제 카페에 반영돼요.'}:{n:1,text:'아래 보유 가구 카드를 골라 보세요. 카페 안 가구를 눌러도 골라져요.'};
 return s?.x==null?{n:2,text:'바닥을 누르거나 추천 자리를 눌러 놓을 곳을 정해요.'}:{n:3,text:'반투명 미리보기를 확인하고 여기에 놓기를 눌러요. 회전으로 방향을 바꿔요.'};
}

export function decorTopbar(state,ui){
 const d=state.interior.draft,where=d.checkoutPreview?'계산대 미리보기':ui.decorSpace==='outdoor'?'정원·외부':'실내';
 return `<div class="cafe-clock"><b>카페 꾸미기</b><small>${where} · ${decorDirty(state)?'적용 전 변경 있음':'변경 없음'}</small></div><span class="cafe-gold">${gold(state.gold)}</span>${btn({action:'decor.close',cls:'decor-close',label:'닫기'})}`;
}

// 바깥 공간은 캔버스 대신 무대 위 격자로 보여 준다.
export function decorStageHtml(state,ui){
 return state.interior.draft&&ui.decorSpace==='outdoor'&&!state.interior.draft.checkoutPreview?`<div class="decor-grounds">${groundsMap(state,ui)}</div>`:'';
}

export function decorPanel(state,ui){
 const d=state.interior.draft,check=!!d.checkoutPreview,outdoor=ui.decorSpace==='outdoor'&&!check,tab=check?'owned':ui.decorTab||'owned';
 const g=groundsOf(state),moving=outdoor?!!ui.groundItem:!!d.itemBefore,coach=decorCoach(state,ui);
 const undo=outdoor?btn({action:'decor.undo',cls:'decor-undo',disabled:!g.draft?.undo?.length,title:g.draft?.undo?.length?'':'되돌릴 배치가 없어요',label:'↶ 되돌리기'})
  :btn({action:'decor.undo',cls:'decor-undo',disabled:!!d.itemBefore||!d.undo?.length,title:d.itemBefore?'고른 가구를 놓거나 선택 취소한 뒤 되돌려요':d.undo?.length?'':'되돌릴 배치가 없어요',label:'↶ 되돌리기'});
 const head=`<header class="decor-head">${check?'<h2>계산대 이전 미리보기</h2>':`<nav class="decor-seg" aria-label="꾸밀 공간">${[['indoor','실내'],['outdoor','정원·외부']].map(([id,label])=>btn({action:'decor.space',args:{id},cls:(outdoor?'outdoor':'indoor')===id?'on':'',pressed:(outdoor?'outdoor':'indoor')===id,label})).join('')}</nav>`}${undo}</header>`;
 const coachHtml=coach?`<div class="decor-coach" role="status">${coach.n?`<b>${coach.n}/4</b>`:''}<p>${esc(coach.text)}</p>${btn({action:'decor.skipGuide',cls:'ghost',label:'안내 끄기'})}</div>`:'';
 const tabs=check?'':`<nav class="decor-tabs" aria-label="꾸미기 메뉴">${[['owned','보유 가구'],['shop','가구 구매'],['expand','공간 확장']].map(([id,label])=>btn({action:'decor.tab',args:{id},cls:tab===id?'on':'',pressed:tab===id,label})).join('')}</nav>`;
 const sel=outdoor?outdoorSelection(state,ui):indoorSelection(state,ui);
 const body=outdoor?(tab==='shop'?outdoorShop(state,ui):tab==='expand'?outdoorExpand(state,ui):outdoorOwned(state,ui)):(tab==='shop'?indoorShop(state,ui):tab==='expand'?indoorExpand(state,ui):indoorOwned(state,ui));
 return `<section class="decor-screen" data-space="${outdoor?'outdoor':'indoor'}" data-moving="${moving}" aria-label="카페 꾸미기">${head}${coachHtml}${sel}${moving?'':tabs+`<div class="decor-body">${body}</div>`}${moving?'':footer(state,ui,outdoor)}</section>`;
}

function footer(state,ui,outdoor){
 const d=state.interior.draft,v=preview(state),g=groundsOf(state).draft,gv=g?validateGround(state,g.items):{ok:true};
 const reason=d.itemBefore?'고른 가구부터 놓아 주세요':!v.ok?v.problems[0].msg:!gv.ok?'정원: '+gv.reason:'';
 const seats=cafeCapacity({...state,interior:{...state.interior,furniture:d.furniture}}).seats;
 return `<footer class="decor-footer"><p class="${reason?'bad':'ok'}">${esc(reason||`좌석 ${seats}석 · 통로가 열려 있어요`)}</p>${btn({action:'decor.close',label:'전체 취소'})}${btn({action:'decor.apply',cls:'primary',disabled:!!reason,title:reason,label:'배치 적용'})}</footer>`;
}

// ── 실내
function indoorSelection(state,ui){
 const d=state.interior.draft,s=d.itemBefore&&d.furniture.find(f=>f.uid===d.selected);if(!s)return '';
 const def=FURNITURE[s.defId],mine=preview(state).problems.filter(p=>p.uid===s.uid),blocking=d.checkoutPreview?mine:preview(state).problems;
 const status=s.x==null?{cls:'idle',text:'바닥을 누르거나 추천 자리를 눌러요'}:mine.length?{cls:'bad',text:'✕ '+problemHint(mine[0])}:blocking.length?{cls:'bad',text:'✕ '+blocking[0].msg}:{cls:'ok',text:'✓ 여기에 놓을 수 있어요'};
 const storeWhy=def.storable===false?'테이블은 보관할 수 없어요 · 늘릴 수만 있어요':d.itemBefore.x==null?'이미 보관함에 있어요':'';
 return `<section class="decor-selection" aria-live="polite"><div class="decor-picked">${assetIcon(art(s))}<div><b>${esc(itemName(s))}</b><small>${footprint(s)} · 분위기 +${def.ambience}${s.x==null?'':` · ${s.x+1}열 ${s.y+1}행 · ${s.rot*90}°`}</small></div><span class="decor-status ${status.cls}">${esc(status.text)}</span></div>
 <div class="decor-tools">${btn({action:'decor.suggest',label:'추천 자리'})}${btn({action:'decor.rotate',disabled:s.x==null,title:s.x==null?'먼저 자리를 정해요':'',label:'회전'})}${btn({action:'decor.store',disabled:!!storeWhy,title:storeWhy,label:'보관'})}${btn({action:'decor.deselect',label:'선택 취소'})}${btn({action:'decor.place',cls:'primary',disabled:status.cls!=='ok',title:status.cls==='ok'?'':status.text.replace(/^✕ /,''),label:'✓ 여기에 놓기'})}</div>
 <div class="decor-nudge" aria-label="한 칸씩 옮기기">${[[0,-1,'↑','위로'],[-1,0,'←','왼쪽으로'],[1,0,'→','오른쪽으로'],[0,1,'↓','아래로']].map(([dx,dy,label,title])=>btn({action:'interior.nudge',args:{uid:s.uid,dx,dy},disabled:s.x==null,title,label})).join('')}</div></section>`;
}

function indoorOwned(state,ui){
 const d=state.interior.draft,filter=ui.editTab||'all',cat=ui.editCategory||'all',v=preview(state);
 const count=id=>d.furniture.filter(f=>id==='all'||(id==='stored'?f.x==null:f.x!=null)).length;
 const items=d.furniture.filter(f=>(filter==='all'||(filter==='stored'?f.x==null:f.x!=null))&&(cat==='all'||category(f)===cat)).sort((a,b)=>(a.x==null?0:1)-(b.x==null?0:1));
 const issues=[...new Map(v.problems.map(p=>[p.msg,p])).values()];
 const checkout=d.checkoutPreview?`<details class="decor-note" ${v.ok?'':'open'}><summary>${v.ok?'배치 가능 · 적용 전에는 원래 배치 유지':`충돌 ${issues.length}건 · 직접 조정해 주세요`}</summary><p>연이는 계산대 뒤, 손님은 입구 쪽에서 차례로 기다려요. 취소·닫기·새로고침은 원래 배치를 유지해요.</p>${issues.length?`<ul>${issues.map(p=>`<li>${p.uid?btn({action:'decor.pick',args:{uid:p.uid},label:esc(p.msg)}):esc(p.msg)}</li>`).join('')}</ul>`:''}</details>`
  :state.interior.checkoutLayout!=='entrance'?`<p class="decor-hint">${btn({action:'interior.checkoutPreview',cls:'ghost',disabled:decorDirty(state),title:decorDirty(state)?'지금 배치를 적용하거나 취소한 뒤 미리볼 수 있어요':'',label:'입구 계산대 미리보기'})}</p>`:'';
 const chips=`<nav class="decor-chips" aria-label="보유 상태">${[['all','전체'],['stored','보관함'],['placed','배치됨']].map(([id,label])=>btn({action:'editor.tab',args:{id},cls:filter===id?'on':'',pressed:filter===id,label:`${label} ${count(id)}`})).join('')}<span class="decor-chip-gap"></span>${[['all','모두'],['seats','좌석'],['decor','장식·식물'],['floor','러그']].map(([id,label])=>btn({action:'editor.category',args:{id},cls:'decor-cat '+(cat===id?'on':''),pressed:cat===id,label})).join('')}</nav>`;
 const cards=items.map(f=>`<button type="button" data-action="decor.pick" data-uid="${esc(f.uid)}" data-key="decor-${esc(f.uid)}" aria-pressed="${d.selected===f.uid}" class="decor-card ${d.selected===f.uid?'selected':''} ${f.x==null?'stored':''}">${assetIcon(art(f))}<b>${esc(itemName(f))}</b><small>${f.x==null?'보관함':'배치됨'} · ${footprint(f)}</small></button>`).join('');
 const empty=filter==='stored'?`<div class="decor-empty"><p>보관함이 비었어요. 새 가구는 가구 구매에서 들여요.</p>${btn({action:'decor.tab',args:{id:'shop'},label:'가구 구매 보기'})}</div>`:'<p class="decor-empty">이 분류에 보유한 가구가 없어요.</p>';
 return `${checkout}${chips}<div class="decor-grid">${cards||empty}</div>`;
}

function lockedNotice(lock){return `<div class="decor-empty"><p>${esc(lock)}</p><p>보유 가구는 지금도 배치할 수 있어요.</p>${btn({action:'decor.tab',args:{id:'owned'},label:'보유 가구 보기'})}</div>`;}

function indoorShop(state,ui){
 const lock=placeLock(state,'expand');if(lock)return lockedNotice(lock);
 const themes=[...new Set(Object.keys(TEMP.DECOR_PRICES).map(id=>FURNITURE[id].theme||'기본 가구'))],theme=themes.includes(ui.decorTheme)?ui.decorTheme:themes[0];
 const ex=nextExpansion(state);
 const table=ex?`<div class="decor-buy decor-buy-table">${assetIcon('objects/basic_table')}<div><b>${esc(ex.label)}</b><small>테이블 하나에 손님 1명 · 의자는 보유 의자를 써요</small></div>${btn({action:'decor.buyTable',cls:'primary',disabled:state.gold<ex.cost,title:state.gold<ex.cost?`골드가 부족해요 (${gold(ex.cost)} 필요)`:'',label:gold(ex.cost)})}</div>`:'';
 const list=Object.keys(TEMP.DECOR_PRICES).filter(def=>(FURNITURE[def].theme||'기본 가구')===theme).map(def=>{const f=FURNITURE[def],price=decorPrice(state,def),short=state.gold<price;
  return `<div class="decor-buy">${assetIcon('objects/'+def)}<div><b>${esc(f.name)}</b><small>${size(furnitureCells({defId:def,x:0,y:0,rot:0}))} · ${f.layer==='floor'?'바닥 · 가구 아래':'통로 위 가구'} · 분위기 +${f.ambience}${f.table?' · 의자 별도':''}</small></div><span class="decor-price-actions">${btn({action:'decor.buy',args:{def},disabled:short,title:short?`골드가 부족해요 (${gold(price)} 필요)`:'',label:gold(price)})}${TEMP.DECOR_MOONSTONE[def]?btn({action:'decor.buy',args:{def,currency:'moonstone'},disabled:state.moonstone<TEMP.DECOR_MOONSTONE[def],label:`월정석 ${TEMP.DECOR_MOONSTONE[def]}`}):''}</span></div>`;}).join('');
 return `<p class="decor-hint">산 가구는 선택한 골드 또는 월정석이 바로 빠지고 보관함에 들어와요. 배치를 취소해도 환불되지 않아요.</p>${table}<nav class="decor-chips" aria-label="가구 테마">${themes.map(id=>btn({action:'decor.theme',args:{id},cls:theme===id?'on':'',pressed:theme===id,label:esc(id)})).join('')}</nav><div class="decor-shop">${list}</div>`;
}

function indoorExpand(state,ui){
 const lock=placeLock(state,'expand');if(lock)return lockedNotice(lock);
 const open=state.interior.areas||[],cost=areaPrice(state);
 const cards=AREAS.filter(a=>areaAvailable(state,a)).map(a=>{
  const [x0,y0,x1,y1]=a.rect,cells=(x1-x0+1)*(y1-y0+1),opened=open.includes(a.id),before=a.branchMin&&!open.includes(a.branchMin===2?'garden_wing':'branch_annex_'+(a.branchMin-2)),on=ui.decorArea===a.id;
  const action=opened?'<span class="decor-badge ok">열림</span>':before?'<span class="decor-badge">앞 구역부터</span>':on?btn({action:'decor.buyArea',args:{id:a.id},cls:'primary',disabled:cost==null||state.gold<cost,title:state.gold<cost?`골드가 부족해요 (${gold(cost)} 필요)`:'',label:`증축 · ${gold(cost)}`}):`<span class="decor-badge">${gold(cost)}</span>`;
  return `<div class="decor-area ${on?'on':''} ${opened?'opened':''}">${btn({action:'decor.area',args:{id:a.id},cls:'decor-area-pick',pressed:on,label:`<b>${opened?'🔓':'🔒'} ${esc(a.name)}</b><small>${opened?'가구를 놓을 수 있어요':`바닥 ${cells}칸이 늘어나요${on?(cost!=null&&state.gold<cost?` · ${gold(cost-state.gold)} 더 모으면 열려요`:' · 카페에 점선으로 보여요'):' · 눌러서 위치 보기'}`}</small>`})}${action}</div>`;}).join('');
 return `<p class="decor-hint">구역을 누르면 카페에 새 면적이 표시돼요. 증축은 바로 확정되고, 열린 곳에 보유 가구를 놓아요.</p><div class="decor-areas">${cards||'<p class="decor-empty">이 지점은 모두 열었어요.</p>'}</div>`;
}

// ── 정원·외부
function outdoorSelection(state,ui){
 const g=groundsOf(state),it=g.draft?.items.find(x=>x.id===ui.groundItem);if(!it)return '';
 const d=gardenItem(it.id),v=validateGround(state,g.draft.items),status=it.x==null?{cls:'idle',text:'격자를 누르거나 추천 자리를 눌러요'}:v.ok?{cls:'ok',text:'✓ 대문 길이 열려 있어요'}:{cls:'bad',text:'✕ '+v.reason};
 return `<section class="decor-selection" aria-live="polite"><div class="decor-picked">${assetIcon('objects/'+it.id)}<div><b>${esc(d.name)}</b><small>${d.width||1}×${d.height||1}칸${it.x==null?' · 보관 중':` · ${it.x+1}열 ${it.y+1}행`}</small></div><span class="decor-status ${status.cls}">${esc(status.text)}</span></div>
 <div class="decor-tools">${btn({action:'decor.suggest',label:'추천 자리'})}${btn({action:'grounds.rotate',disabled:it.x==null,label:'방향 뒤집기'})}${btn({action:'grounds.store',disabled:it.x==null,title:it.x==null?'이미 보관함에 있어요':'',label:'보관'})}${btn({action:'decor.deselect',cls:'primary',label:'✓ 선택 끝'})}</div></section>`;
}

function outdoorOwned(state,ui){
 const g=groundsOf(state),items=g.draft?.items||g.items,floor=g.draft?.floor||g.floor;
 const cards=items.map(i=>`<button type="button" data-action="grounds.select" data-id="${esc(i.id)}" aria-pressed="${ui.groundItem===i.id}" class="decor-card ${ui.groundItem===i.id?'selected':''} ${i.x==null?'stored':''}">${assetIcon('objects/'+i.id)}<b>${esc(gardenItem(i.id).name)}</b><small>${i.x==null?'보관함':'배치됨'}</small></button>`).join('');
 return `<div class="decor-grid">${cards||`<div class="decor-empty"><p>정원 가구가 아직 없어요.</p>${btn({action:'decor.tab',args:{id:'shop'},label:'정원 가구 보기'})}</div>`}</div><h3 class="decor-sub">바닥</h3><nav class="decor-chips">${g.floors.map(id=>btn({action:'grounds.floor',args:{id},cls:floor===id?'on':'',pressed:floor===id,label:esc(FLOOR_THEMES[id].name)})).join('')}</nav>`;
}

function outdoorShop(state,ui){
 const g=groundsOf(state),items=GARDEN_ITEMS.filter(id=>!g.items.some(x=>x.id===id)),floors=Object.entries(FLOOR_THEMES).filter(([id])=>!g.floors.includes(id));
 const row=(icon,name,info,action,args,price)=>`<div class="decor-buy">${icon}<div><b>${esc(name)}</b><small>${info}</small></div>${btn({action,args,disabled:state.gold<price,title:state.gold<price?`골드가 부족해요 (${gold(price)} 필요)`:'',label:gold(price)})}</div>`;
 return `<p class="decor-hint">산 정원 가구는 바로 보관함에 들어오고 추천 자리에 미리 놓여요.</p><div class="decor-shop">${items.map(id=>{const d=gardenItem(id);return row(assetIcon('objects/'+id),d.name,`${d.width||1}×${d.height||1}칸 · 정원`,'decor.gardenBuy',{id},gardenPrice(id));}).join('')||'<p class="decor-empty">정원 가구를 모두 갖췄어요.</p>'}${floors.map(([id,d])=>row(assetIcon(d.asset),d.name,'정원 바닥','grounds.floorBuy',{id},d.cost)).join('')}</div><h3 class="decor-sub">외관 리모델링</h3>${remodelList(state,ui)}`;
}

function outdoorExpand(state,ui){
 const ex=groundExpansion(state),{cols,rows}=groundSize(state);
 if(!ex)return `<p class="decor-hint">지금 부지는 ${cols}×${rows}칸이에요. 이 지점의 최대 부지예요.</p>`;
 return `<p class="decor-hint">지금 부지는 ${cols}×${rows}칸이에요. 넓히면 아래로 두 줄이 늘어나요.</p><div class="decor-area ${ui.groundExpand?'on':''}">${btn({action:'grounds.expandPreview',cls:'decor-area-pick',pressed:!!ui.groundExpand,label:`<b>🌿 부지 넓히기</b><small>${cols}×${ex.rows}칸으로 · 한 번만 지불</small>`})}${ui.groundExpand?btn({action:'grounds.expand',args:{level:ex.level},cls:'primary',disabled:state.gold<ex.cost,title:state.gold<ex.cost?`골드가 부족해요 (${gold(ex.cost)} 필요)`:'',label:`확장 · ${gold(ex.cost)}`}):`<span class="decor-badge">${gold(ex.cost)}</span>`}</div>`;
}
