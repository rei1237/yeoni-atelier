import { btn,esc } from './dom.js';
import { ASSETS } from '../render/assets.js';
import {firstDayStep} from '../game/first-day.js';
import {shortIngredients} from '../game/delivery.js';
export const GUIDES = Object.freeze({
 restock:{title:'모카 재료 배달',image:'tutorial_restock',steps:['메뉴에 쓸 재료가 모자라요. 영업 중에도 모카가 재료를 배달해 줘요.','「떨어진 재료 채우기」를 누르면 모자란 재료가 5개까지 담겨요. 커피 바·베이커리·찻집 묶음이나 ＋5로 더 담을 수 있어요.','주문 한 건마다 배달비가 붙으니 한 번에 넉넉히 담아요. 시작하기를 누르면 배달 화면이 열려요.']},
 delivery:{title:'모카 묶음 배달',image:'tutorial_delivery',steps:['여러 재료를 장바구니에 담고 수량을 골라요. 주문 한 건당 기본 배달비 200G가 붙고, 모카 인연 능력이 있으면 할인이 적용돼요.','재료값·배달비·총액을 확인하고 주문해요. 영업 전에 가게에서 직접 구매하면 배달비가 없어요.']},
 batch:{title:'한 테이블 함께 조리',image:'tutorial_batch',steps:['한 번의 재료 준비와 타이밍으로 이 테이블의 미조리 주문들을 함께 시작해요. 이미 만드는 메뉴는 중복하지 않아요.','설비가 비어 있으면 함께 만들고, 꽉 차면 순서대로 만들어요. 전체 주문의 재료나 대기 공간이 부족하면 아무 메뉴도 시작하지 않아요.']},
 firstday:{title:'연이와 보내는 첫날',image:'tutorial_firstday',steps:['첫날에는 행동력 3이 있어요. 연이의 요리와 동료 대화를 따라 해 보세요. 실제 활동에 성공하면 행동력이 자동으로 줄어요.','화면 아래 첫날 안내가 다음 할 일을 알려 줘요. 준비가 끝나면 영업을 열고 주문·조리·서빙·정리를 차례로 배워요.']},
 opening:{title:'첫 영업을 열어요',image:'tutorial_opening',steps:['영업은 10분 동안 진행돼요. 손님이 주문하면 메뉴를 눌러 재료를 준비하고 조리를 시작해요. 주문 조리에는 행동력이 들지 않아요.','완성된 음식은 한 번 눌러 전달해요. 식사를 마친 손님은 입구 연이에게 계산해요. 떠난 자리는 정리해 다음 손님을 맞아요.','아래 안내가 첫 주문부터 자리 정리까지 이어져요. 안내 창을 읽는 동안 영업 시간은 멈춰요. 결산을 마치면 행동력이 다시 채워져요.']},
 personal:{title:'연이의 요리와 성장',image:'tutorial_personal',steps:['연이가 준비 시간에 직접 요리해요. 재료를 담고 초록 구간에서 마무리하면 품질이 올라요. 조리를 시작하면 행동력 1과 재료가 사용되고, 완성하면 경험치 12를 얻어요. 같은 날 취소하면 비용을 돌려받아요.','요리·직접 농장 일·대화·선물로 연이가 성장해요. 레벨이 오르면 음식 매출과 연이 조리 속도에 도움이 돼요. 성장 효과와 칭호에서 조건을 확인해요.']},
 signatures:{title:'연이의 특별 메뉴',image:'tutorial_signatures',steps:['Lv.3 달빛 크림 라테, Lv.6 장미 밀푀유, Lv.10 꽃정원 키슈가 열려요. 해금된 요리를 연이가 한 번 완성해 보세요.','완성한 뒤 카페 메뉴로 등록하면 손님이 주문할 수 있어요. 일반 메뉴보다 높은 기본 판매가와 판매마다 인기도 보너스가 있어요. 보관 음식은 등록으로 사라지지 않아요.']},
 growth:{title:'레벨과 칭호',image:'tutorial_growth',steps:['연이 레벨과 카페 레벨은 따로 성장해요. 연이는 직접 활동으로, 카페는 영업으로 성장해요.','획득한 칭호를 눌러 달 수 있어요. 칭호는 꾸밈용이며 성장 효과를 중복해서 더하지 않아요. 행동력 증가는 다음 순부터 적용돼요.']},
 world:{title:'재성의 섬 산책',image:'world',steps:['장소를 누르면 연이가 걸어가요. 도착한 장소의 버튼으로 가게나 농장에 들어가요.','아직 잠긴 장소에는 열리는 조건이 표시돼요. 카페로 돌아와 영업을 시작할 수 있어요.']},
 branches:{title:'카페 지점 관리',image:'tutorial_branches',steps:['지점마다 개설 조건과 비용을 확인해요. 구매한 지점은 영업 준비 중에 이동할 수 있어요.','진행 중인 요리를 마치고 이동해 주세요. 새 지점을 열어도 기존 지점의 배치는 보존돼요.']},
 staffing:{title:'직원 배치',image:'tutorial_staffing',steps:['함께하는 동료 중 카페에서 일할 직원을 선택해요. 배치 가능한 인원과 공간을 확인해요.','동료의 인연 능력과 휴무 상태를 함께 살펴보세요. 자동 운영은 필요한 인연 단계와 이야기를 마친 뒤 켤 수 있어요.','무성을 영입하고 인연 Rank 3 이야기를 보면 주방 보조를 켤 수 있어요. 영업 준비 중 출근 배치하면 루나 언니를 도와 조리가 10% 빨라지며, 그 영업에는 지명 접대를 쉬어요.']},
 recipe:{title:'레시피 수첩',image:'tutorial_recipe',steps:['메뉴별 재료와 배운 레시피를 확인해요. 손님 주문은 영업 중에 만들어요.','영업 전 여분 음식은 연이의 주방에서 만들어요. 특별 메뉴는 성장과 첫 완성 조건을 채워 등록해요.']},
 exchange:{title:'월정석 환전',image:'tutorial_exchange',steps:['사냥에서 가져온 월정석은 청토끼 금융 센터에서 골드로 바꿔요. 맨 위 환전 칸에 1개당 받을 골드가 적혀 있어요.','10·100·1000·전부 버튼이나 −·+로 개수를 골라요. 받을 골드와 환전 뒤 남는 월정석이 바로 아래에 미리 보여요.','개수 환전하기 버튼을 누르면 골드가 바로 들어와요. 환전·대출·상환에는 행동력이 들지 않아요. 월정석은 나중에 윤달 공방 강화에도 쓰니 조금 남겨 둬도 좋아요.']},
 finance:{title:'장부와 금융',image:'tutorial_finance',steps:['보유 골드와 남은 빚, 상환 조건을 확인해요. 표시된 비용을 확인한 뒤 필요한 거래를 골라요.','금융 거래와 재료 구매에는 행동력이 들지 않아요. 월정석과 골드는 서로 다른 재화예요.']},
 expand:{title:'가구 상점과 증축',image:'tutorial_expand',steps:['구매 가능한 가구와 증축 조건을 확인해요. 잠겨 있으면 개방 시기를 알려 드려요.','카페의 꾸미기에서 보유 가구를 배치해요. 통로를 남기고 적용하면 영업에 반영돼요.']},
 shelter:{title:'루나의 쉼터',image:'tutorial_shelter',steps:['동료의 스트레스와 쉼터 이용 조건을 확인해요. 필요한 동료를 골라 쉬게 해 주세요.','회복 비용과 이용 가능 횟수는 버튼의 안내를 확인해요.']},
 quests:{title:'오늘의 목표와 보상',image:'quests',steps:['퀘스트의 목표와 현재 진행도를 확인해요. 달성한 목표는 보상 받기를 눌러 마무리해요.','보상은 한 번만 받아요. 아직 열리지 않은 목표는 이야기를 진행하며 만나게 돼요.']},
 kfp:{title:'무기 조합과 진화',image:'tutorial_kfp',steps:['현재 무기와 조합 조건을 확인해요. 조건을 채운 조합만 선택할 수 있어요.','선택 창을 읽는 동안 사냥은 멈춰요. 조합을 마치면 전투로 돌아가요.']},
 trail:{title:'사냥 중 만난 갈림길',image:'tutorial_trail',steps:['각 선택의 효과를 읽고 이번 사냥에 맞는 길을 골라요.','선택 화면을 보는 동안 전투는 멈춰요. 선택 후 사냥을 이어 가요.']},
 shop:{title:'모카의 식재료점',image:'tutorial_shop',steps:['식재료와 회복 물품을 골라요. 구매에는 행동력이 들지 않아요.','무기 강화는 윤달의 공방에서 해요. 모카와 친해지면 도움 물품이 늘어나요.']},
 cook:{title:'주문을 눌러 만들기',image:'tutorial_cook',steps:['손님 테이블의 주문을 눌러요. 음료는 머신, 빵은 오븐에서 만들어요.','같은 손님의 두 메뉴도 각각 눌러 함께 만들 수 있어요. 부족한 재료는 모카에게 살 수 있어요.']},
 serve:{title:'완성된 음식은 한 번 탭',image:'tutorial_serve',steps:['카페의 픽업 선반이나 주방 버튼에서 완성된 음식을 눌러요. 기다리는 테이블로 연결돼요.','직원이 음식을 나르면 손님은 식사 후 연이의 계산대로 가요. 빈자리의 정리 버튼을 누르면 다음 손님을 맞을 수 있어요.']},
 catcafe:{title:'영냥이의 카페 근무',image:'tutorial_catcafe',steps:['호스트 개업 후 네오 인연 Rank 8부터 영냥이 모습으로 바꿀 수 있어요. 직원 메뉴에서 영냥이로 돕기를 눌러요.','스트레스가 높아도 카페에서 네발로 이동하며 서빙·정리와 지명을 도와요. 자동 서빙은 네오 홀 자동을 켜 주세요. 능력치와 스트레스는 네오와 공유해요.','네오와 영냥이는 한 명이에요. 접대·운반·사냥 중에는 바꿀 수 없고, 휴무는 그대로 지켜요. 네오로 돌아오면 원래 스트레스에 따른 휴식 조건이 적용돼요.']},
 music:{title:'LP 플레이어와 달빛 음악실',image:'music',steps:['카페의 LP 가구나 하단 음악 버튼을 누르면 음악실이 열려요. 재생·일시정지, 이전 곡·다음 곡으로 음악을 조절해요.','곡 목록에서 원하는 음악을 고를 수 있어요. 카페 순서 재생을 선택하면 Moonlight Tea부터 카페 목록을 이어 들어요. 음량과 효과음은 따로 설정해요.']},
 huntmusic:{title:'사냥터의 달빛 선율',image:'tutorial_huntmusic',steps:['하단 음악 메뉴에서 BGM을 켜거나 끄고 사냥 음악을 고를 수 있어요. 주변 지도에서 가까운 적과 떨어진 아이템, 보물상자를 볼 수 있어요. 지도는 원할 때 닫거나 다시 열 수 있어요.','사냥 음악은 카페 선곡과 따로 기억해요. 장면 자동 선곡은 사냥·깊은 구간·서한비 전투에 맞춰 바뀌고, 귀환하면 카페에서 듣던 곡으로 돌아가요.']},
 worldcast:{title:'데스티노바의 초대장',image:'tutorial_worldcast',steps:['멤버 얼굴 옆에서 만남 시기와 네오 인연 조건을 확인해요. 초대장이 열리면 만남 이야기를 끝까지 읽어 주세요.','함께하는 멤버는 대화·선물로 바로 만나요. 새로 영입한 호스트는 다음 영업부터 직원 배치에서 선택할 수 있어요.']},
 host:{title:'호스트 카페 운영',image:'tutorial_host',steps:['5월 개업 이야기 이후 지명 손님이 찾아와요. 영업 시작 → 하단 지명 알림 → 요청 확인 순서로 진행해요.','손님의 선호와 예상 만족도를 보고 지명을 수락하거나 다른 동료를 추천해요. 수락한 호스트는 60초 동안 한 테이블을 전담해요. 완료하면 표시된 지명료를 음식값·팁과 별도로 받아요. 기본 1,500G부터 손님 등급·카페 레벨에 따라 올라요. 인기도와 분위기도 각각 최대 100%를 더해요. 수락한 금액은 끝날 때까지 고정돼요.','접대 중 SOS가 뜨면 상황에 맞는 답을 골라요. 도움 요청은 제한 시간이 있어요. 안내를 읽는 동안에는 영업 시간이 멈춰요.','지명료는 60초 완료 후 계산대에서 받아요. 만족도가 높은 접대는 추가 팁과 피버로 이어져요. 직원에서 스트레스와 피버를 확인하고, 마감 정산에서 접대 결과를 살펴보세요.']},
 farm:{title:'꽃돼지 연이의 농장',image:'tutorial_farm',steps:['씨앗을 고르고 빈 밭을 눌러 심어요. 심기·물 주기·돌보기·수확에는 각각 별도의 농장 행동력 1을 써요. 마을 행동력은 그대로예요. 돌본 밭은 더 빨리 자라고 수확량도 늘어요.','영업을 마치면 작물이 자라요. 익은 작물을 수확하면 주방 재료가 돼요. 비 오는 날은 물 주기를 쉬어요.']},
 hunt:{title:'피하고, 고르고, 살아남기',image:'tutorial_hunt',steps:['화면을 드래그해 이동해요. 공격은 자동이에요. 별조각을 모으면 멈춘 화면에서 기술을 골라요.','게임 속 하루에 한 번 갈 수 있어요. 준비 시간이 지나 나온 우두머리를 물리치면 단계를 마치고, 지치면 보상을 정산해 돌아와요.']},
 armory:{title:'윤달의 무기 공방',image:'tutorial_armory',steps:['윤달에게 월정석으로 사냥꾼별 무기·체력·이동 속도를 강화해요. 달빛 발걸음의 이동 속도 보너스는 최대 60%예요.','무기·보조 상한 해방과 진화 비전은 월정석으로, 장비·기술서·휴대 도구는 골드로 구매해요. 모카의 회복 물품은 사냥 화면의 간편 슬롯에서 써요.']},
 outfits:{title:'갈아입고 카페로',image:'tutorial_outfits',steps:['함께하는 남성 동료를 고른 뒤 옷을 입어 봐요. 준비 중 입기를 누르면 저장돼요.','카페의 치비 캐릭터도 같은 옷을 입고 이동·접대해요. 의상은 외형 전용이에요.']},
 bonds:{title:'동료에게 마음 전하기',image:'tutorial_bonds',steps:['위쪽 얼굴을 눌러 동료를 바꾸고 보유 음식이나 좋아하는 물건을 골라요. 구매·선물은 마지막 확인에서 실행하며, 음식과 물건을 합쳐 한 순에 한 번이에요.','동료의 성격과 고민을 듣고 세 답 중 하나를 골라요. 공감하는 답일수록 호감도가 더 올라요.','한 사람과 매 순 한 번 대화할 수 있어요. 인연 단계가 오르면 이야기와 유용한 능력이 열려요.']},
 fortune:{title:'달빛 운세 수첩',image:'tutorial_fortune',steps:['오늘의 타로 카드를 눌러 뒤집어요. 같은 날·같은 생일이면 언제 열어도 같은 카드가 나와요.','생년월일을 넣으면 사주 일간과 오늘 일진의 관계, 띠, 서양 별자리 풀이가 더해져요. 생일은 기억하기를 켰을 때만 이 기기에 남아요.','여러 운세의 상징과 연이의 질문을 수첩에서 살펴보고, 출생 정보로 계산하는 자세한 풀이는 각 서비스에서 확인할 수 있어요.']},
 decorate:{title:'내 첫 공간 꾸미기',image:'tutorial_decorate',steps:['카페의 꾸미기 하나로 가구 구매·배치, 정원·외부, 공간 확장을 모두 해요. 아래 보유 가구 카드를 고르면 선택돼요.','바닥을 누르면 놓일 자리가 반투명하게 보여요. 추천 자리는 통로를 막지 않는 가까운 칸을 찾아 줘요. 회전으로 방향을 바꿔요.','여기에 놓기로 확정하고, 마지막에 배치 적용을 눌러야 카페에 반영돼요. 되돌리기는 확정한 배치를 한 단계씩 되돌려요.','산 가구는 바로 보관함에 들어와요. 배치를 취소해도 환불되지 않고 보관함에 남아요. 정원·외부에서는 대문에서 입구까지 길을 남겨 주세요.']},
});
// 새 조작 화면은 반드시 이 표와 GUIDES에 함께 등록한다.
export const FEATURE_GUIDES=Object.freeze({worldcast:'worldcast',audio:'music',delivery:'delivery',kitchen:'recipe',craft:'cook',foodgift:'personal',farm:'farm',hunt:'hunt',armory:'armory',outfits:'outfits',companions:'bonds',table:'serve',shop:'shop',staffing:'staffing',branches:'branches',debt:'finance',quests:'quests',kfp:'kfp',trail:'trail',fortune:'fortune'});
export function guideForContext(s,ui){
 if(!s)return null;
 if(ui.sheet?.kind==='tutorial')return null;
 if(ui.sheet?.kind==='audio'&&s.mode==='hunt')return 'huntmusic';
 if(s.hostbar.open&&s.mode==='shift'&&!s.tutorials?.host&&Object.values(s.customers).some(c=>c.state==='requesting'))return 'host';
 if(ui.sheet?.kind==='foodgift'&&s.tutorials?.personal&&!s.tutorials?.signatures&&(s.yeoniGrowth?.xp||0)>=72)return 'signatures';
 if(ui.sheet?.kind==='craft'&&ui.craft?.tableNo)return 'batch';
 if(ui.sheet?.kind==='craft'&&ui.craft?.purpose==='gift')return 'personal';
 if(ui.sheet?.kind==='town'&&ui.sheet.tab==='finance')return s.tutorials?.exchange?null:s.moonstone>0||s.tutorials?.finance?'exchange':'finance'; // 사냥에서 돌아와 월정석을 들고 오면 환전부터 알려 준다(장부 안내를 먼저 봤어도)
 if(ui.sheet?.kind==='town')return ({moka:'shop',finance:'finance',expand:'expand',luna:'shelter'})[ui.sheet.tab]||null;
 if(ui.sheet?.kind==='delivery'&&s.tutorials?.restock)return null; // 재료 소진 안내에서 이미 배웠다
 if(ui.sheet)return FEATURE_GUIDES[ui.sheet.kind]||null;
 if(s.interior.draft)return null; // 꾸미기 화면은 화면 안 단계 안내(decor-screen.js)를 쓴다
 if(ui.screen==='world')return 'world';
 if(ui.screen==='quests')return 'quests';
 if(['prep','shift'].includes(s.mode)&&!s.tutorials?.restock&&shortIngredients(s).length)return 'restock'; // 10-29 재료가 떨어지면 모카 배달을 알려 준다
 if(ui.cafeDrawer==='crew')return 'growth';
 return s.day===1&&s.mode==='prep'&&!s.tutorials?.firstdayintro?'firstday':null;
}
export function journeyHtml(s){const step=firstDayStep(s);return step?`<section class="first-day-guide" aria-label="첫날 실습 안내"><div><small>연이의 첫날 · ${s.mode==='prep'?'영업 준비':'첫 영업'}</small><b>${esc(step.title)}</b><p>${esc(step.text)}</p></div>${btn({action:step.action,args:step.args||{},cls:'primary',label:step.label})}</section>`:'';}
export function tutorialSheet(ui) {
 const id=GUIDES[ui.guideId]?ui.guideId:'cook',g=GUIDES[id],step=Math.min(ui.guideStep||0,g.steps.length-1);
 return `<h2><span class="guide-title">${ui.guideReturn?'처음 만나는 '+g.title:'튜토리얼'}</span>${btn({action:'guide.close',cls:'close ghost',label:'✕',title:'안내 닫기'})}</h2>${ui.guideReturn?'':`<label class="guide-selector">다시 볼 기능<select id="guide-selector">${Object.entries(GUIDES).map(([key,x])=>`<option value="${key}" ${key===id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`}<div class="guide-picture">${ASSETS.guides?.[g.image]?.path?`<img class="pixel-icon" src="${esc(ASSETS.guides[g.image].path)}" alt="" loading="eager">`: ''}</div><p class="eyebrow">${step+1} / ${g.steps.length}</p><h3>${esc(g.title)}</h3><p class="guide-instruction">${esc(g.steps[step])}</p><div class="row">${step?btn({action:'guide.back',label:'이전'}):''}${btn({action:'guide.next',cls:'primary grow',label:step===g.steps.length-1?'시작하기':'다음'})}</div><p class="small muted">기타 → 튜토리얼에서 언제든 다시 볼 수 있어요.</p>`;
}
