// 10-29 메인 화면 「등장인물 · 재성의 섬」. 꿀꿀 운세 세계관 페이지를 줄여 옮기고, 외전 설정은 따로 표시한다.
// 스포일러 금지: 네오·검은 호랑이·흑월의 정체와 원작 결말은 적지 않는다.
import {btn,esc} from './dom.js';
import {assetIcon} from './asset-html.js';
import {pixelIcon} from './pixel-icons.js';
import {FORTUNE_SITE} from './fortune-sheet.js';
import {arcanaSymbol} from './arcana.js';
import {DEST1NOVA_MEMBERS} from '../data/dest1nova-profiles.js';

export const LORE_CAST=Object.freeze([
 {id:'yeoni',name:'연이',tag:'주인공 · 乙木',line:'타로 문을 지나 운명의 세계에 온 대학생. 붙잡을 곳만 있으면 벽도 타고 오르는 덩굴 같은 아이예요.',here:'계산대를 맡고, 준비 시간엔 꽃돼지 모습으로 농장을 가꿔요.'},
 {id:'neo',name:'네오',tag:'동행 · 金',line:'은발의 사람. 운명의 세계에서는 모자를 쓴 흰 고양이 영냥이로 곁을 지켜요.',here:'칼은 연이를 위협하는 것에만 들어요. 카페에선 사냥터와 접객을 맡아요.'},
 {id:'luna_sis',name:'루나 언니',tag:'재성의 섬 빵집',line:'빵집을 지키려고 자기 시간을 조금씩 팔아 온 언니. 갓 구운 빵은 그냥 내어 줘요.',here:'카페 주방을 맡아 요리를 만들어요.'},
 {id:'luna',name:'루나',tag:'빵집 자매의 동생',line:'빵 바구니를 든 흰 아기 토끼. 언니 곁을 떠나지 않아요.',here:'홀 서빙과 정리를 맡아요.'},
 {id:'moka',name:'모카',tag:'식상의 섬 동료 · 丙火',line:'독설과 별점 테러가 특기인 수달 요리사. 한번 편이 되면 끝까지 의리, 몰래 랩도 해요.',here:'식재료와 긴급 배달을 맡아요.'},
 {id:'yun',name:'윤달',tag:'재성의 섬 · 점술가',line:'낯선 자리에서도 먼저 말을 건네는 점술가. 가벼운 농담 뒤에도 상대의 이야기를 오래 기억해요.',here:'사냥을 돕는 무기 공방을 맡아요.'},
 {id:'museong',name:'무성',tag:'가구와 꽃 상점',line:'원칙과 약속을 또렷하게 말하는 사람. 엄격한 첫인상과 달리 노래가 시작되면 공간의 분위기를 바꿔요.',here:'가구와 꽃, 카페 공간을 꾸밀 물건을 소개해요.'},
 {id:'seohanbi',name:'???',tag:'비밀스러운 인연',line:'달그늘의 이야기를 따라가면 언젠가 만날 수 있는 인연이에요.',here:'아직 밝혀지지 않은 이야기예요.'},
 {id:'cheongtokki',name:'청토끼',tag:'청토끼 금융 주인',line:'"최약체랍니다~" 하고 웃지만 계산에는 빈틈이 없어요.',here:'카페 인수 빚과 운영 대출을 내주는 채권자예요.'},
]);

export const LORE_STORY=Object.freeze([
 ['시간을 파는 섬','이 섬에서는 시간이 곧 돈이에요. 빵 한 개가 3분인 시간 시장에 연이와 영냥이가 닿아요.'],
 ['궁합 부스의 점술가','점술가 윤달이 연이의 태어난 시부터 묻고, 영냥이는 괜히 심통이 나요. 그런데 사람들은 자꾸 윤달의 얼굴을 잊어요.'],
 ['청토끼 금융과 빵집','시간을 빌려주는 청토끼 금융. 그 곁에는 빵집을 지키려고 자기 시간을 팔아 온 루나 언니가 있어요.'],
 ['지름길 대신','시간 금고 소동 끝에 연이는 운 대출이라는 지름길을 거절해요. 자기 힘으로 값을 치르고, 윤달이 동료가 돼요.'],
]);

const face=c=>c.id==='seohanbi'?`<span class="lore-face lore-mono" aria-hidden="true">${pixelIcon('moon')}</span>`:`<span class="lore-face">${assetIcon('portraits/'+c.id)}</span>`;
const card=c=>`<article class="lore-card">${face(c)}<div><h3>${esc(c.name)} <small>${esc(c.tag)}</small></h3><p>${esc(c.line)}</p>${c.here?`<p class="lore-here"><b>아틀리에에서</b> ${esc(c.here)}</p>`:''}${arcanaSymbol(c.id,{masked:c.id==='seohanbi'})}</div></article>`;

export function loreSheet(tab='cast'){
 const story=tab==='story',tabBtn=(id,label)=>btn({action:'lore.tab',args:{tab:id},cls:'lore-tab',pressed:tab===id,label});
 const body=story
  ?`<ol class="lore-story">${LORE_STORY.map(([h,p],i)=>`<li><span class="lore-step">${i+1}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`).join('')}</ol><section class="lore-gaiden"><h3>그리고, 연이의 아틀리에</h3><p>그 섬에서 연이는 빚이 걸린 작은 카페를 맡게 돼요. 네오·루나 자매와 함께 2년 안에 갚아 내는 이야기는 이 게임만의 외전이에요.</p></section>`
  :`<p class="lore-intro">카페와 섬에서 만날 소중한 인연을 소개해요. 인연의 카드는 이 게임의 외전에서 정한 상징이에요.</p><h3 class="lore-section">카페와 재성의 섬</h3><div class="lore-cast">${LORE_CAST.map(card).join('')}</div><h3 class="lore-section">데스티노바</h3><p class="lore-intro">네오와 함께 무대를 만드는 멤버들이에요. 인물별 소개는 게임의 외전 설정을 담고 있어요.</p><div class="lore-cast">${DEST1NOVA_MEMBERS.filter(p=>p.id!=='neo').map(p=>card({id:p.id,name:p.name,tag:p.position,line:p.personality,here:p.tagline})).join('')}</div><p class="small lore-note">원작 소개는 꿀꿀 운세 라이트 노벨 세계관을 따르고, 「아틀리에에서」와 데스티노바의 인물별 소개는 이 게임만의 외전 설정이에요.</p>`;
 return `<h2 id="lore-title">등장인물 · 재성의 섬${btn({action:'lore.close',cls:'close lore-close',label:'✕',title:'닫기'})}</h2>
 <div class="lore-tabs" role="group" aria-label="보기 선택">${tabBtn('cast','등장인물')}${tabBtn('story','재성의 섬 이야기')}</div>${body}
 <a class="lore-cta" href="${FORTUNE_SITE}world" target="_blank" rel="noopener noreferrer">꿀꿀 운세 라이트 노벨 세계관 보기 ↗</a>`;
}
