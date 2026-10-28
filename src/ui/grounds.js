import {remodelArt} from '../render/remodel-art.js';
import {groundsOf,exteriorOf,groundSize,REMODELS,gardenItem,FLOOR_THEMES} from '../game/grounds.js';
import {assetIcon,assetStyle} from './asset-html.js';
import {btn} from './dom.js';
// 정원·외부 격자와 외관 리모델링. 카페 꾸미기 화면(decor-screen.js)이 쓴다.
export function groundsMap(state,ui){
 const g=groundsOf(state),draft=g.draft,items=draft?.items||g.items,{cols,rows}=groundSize(state),selected=ui.groundItem,floor=FLOOR_THEMES[draft?.floor||g.floor];
 const building=remodelArt(REMODELS[exteriorOf(state).theme]||REMODELS.original);
 return `<div class="grounds-viewport" tabindex="0" role="region" aria-label="정원 배치 지도 · 스크롤 가능"><div class="grounds-grid" role="group" aria-label="카페 주변 배치" style="--cols:${cols};--rows:${rows};${assetStyle(floor.asset)}">${Array.from({length:cols*rows},(_,i)=>btn({action:'grounds.cell',args:{x:i%cols,y:Math.floor(i/cols)},cls:'ground-cell',label:'',title:`${i%cols+1}열 ${Math.floor(i/cols)+1}행`,disabled:!draft})).join('')}<div class="ground-building" style="height:${3/rows*100}%;left:${2.5/cols*100}%;width:${6/cols*100}%">${assetIcon(building.key)}<span>카페 입구</span>${building.decor?`<i>${assetIcon(building.decor)}</i>`:''}</div>${items.filter(i=>i.x!=null).map(i=>{const d=gardenItem(i.id);return `<div class="ground-piece ${selected===i.id?'selected':''}" style="left:${i.x/cols*100}%;top:${i.y/rows*100}%;width:${(d.width||1)/cols*100}%;height:${(d.height||1)/rows*100}%;--flip:${i.rot===2?-1:1}">${assetIcon('objects/'+i.id)}</div>`;}).join('')}<span class="ground-gate" style="left:${5/cols*100}%;width:${100/cols}%">대문</span></div></div>`;
}
export function remodelList(state,ui){
 const ext=exteriorOf(state),theme=REMODELS[ui.remodelPreview||ext.theme]||REMODELS.original,building=remodelArt(theme);
 return `<div class="remodel-preview" style="${assetStyle(theme.interior)}"><div>${assetIcon(building.key)}${building.decor?assetIcon(building.decor):''}</div></div><p>${ui.remodelPreview?'구매 전 미리보기':'현재 적용'} · ${theme.name}</p><p class="small">${building.ready?'테마에 맞는 외벽과 지붕이 적용돼요.':'외관은 기존 카페 건물에 입구 장식을 더해요.'} 연꽃 살롱은 실내 배경도 함께 바뀝니다.</p><div class="list">${Object.entries(REMODELS).map(([id,d])=>`<div class="item"><div class="meta grow"><b>${d.name}</b><small>${ext.owned.includes(id)?(ext.theme===id?'적용 중':'보유'):d.cost.toLocaleString()+'G'}</small></div>${btn({action:'remodel.preview',args:{id},label:'미리보기'})}${ext.owned.includes(id)?btn({action:'remodel.apply',args:{id},disabled:ext.theme===id||state.mode!=='prep',label:'적용'}):btn({action:'remodel.buy',args:{id},disabled:state.gold<d.cost||state.mode!=='prep'||ui.remodelPreview!==id,title:ui.remodelPreview!==id?'먼저 미리보기를 눌러 확인해요':'',label:'구매'})}</div>`).join('')}</div>`;
}
// 이전 시트 진입(외관 미리보기)도 같은 조각을 쓴다.
export function groundsSheet(state,ui){
 return `<h2>우리 가게 꾸미기${btn({action:'sheet.close',cls:'close ghost',label:'닫기'})}</h2>`+(ui.groundTab===1?remodelList(state,ui):groundsMap(state,ui));
}
