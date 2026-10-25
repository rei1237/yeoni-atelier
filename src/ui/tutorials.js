import { btn,esc } from './dom.js';
import { assetIcon } from './asset-html.js';
export const GUIDES = Object.freeze({
 cook:{title:'주문을 눌러 만들기',image:'cook',steps:['손님 테이블의 주문을 눌러요. 음료는 머신, 빵은 오븐에서 만들어요.','기계가 이미 바쁘면 다음 한 개까지 예약해요. 부족한 재료는 모카에게 살 수 있어요.']},
 serve:{title:'완성된 음식은 한 번 탭',image:'serve',steps:['아래 서빙대에서 완성된 음식을 눌러요. 기다리는 테이블로 자동 연결돼요.','루나가 음식을 나르고 자리를 정리해요. 직접 걸음을 조종할 필요는 없어요.']},
 host:{title:'호스트 카페의 도움 요청',image:'host',steps:['첫해 5월 이야기를 마치면 지명이 열려요. 손님에 맞는 동료를 골라요.','SOS가 뜨면 상황을 읽고 답을 골라요. 알맞은 도움은 만족도를 높이고 네오의 스트레스를 줄여요.']},
 farm:{title:'꽃돼지 연이의 농장',image:'farm',steps:['씨앗을 고르고 빈 밭을 눌러 심어요. 물 주기와 돌보기로 수확량을 늘려요.','영업을 마치면 작물이 자라요. 익은 작물을 수확하면 주방 재료가 돼요. 비 오는 날은 물 주기를 쉬어요.']},
 hunt:{title:'피하고, 고르고, 살아남기',image:'hunt',steps:['화면을 드래그해 이동해요. 공격은 자동이에요. 별조각을 모으면 멈춘 화면에서 기술을 골라요.','제한 시간은 없어요. 쓰러지거나 돌아갈 때 필드 월정석과 생존 보상을 함께 받아요. 3분 생존 후 정산하면 다음 단계가 열려요.']},
 armory:{title:'모카의 무기 공방',image:'armory',steps:['월정석으로 사냥꾼별 무기·체력·줍기 범위를 강화해요. 강화에는 레벨 상한이 없어요.','회복 수프는 사냥 중 가방에서 써요. 모카와 인연을 쌓으면 수집 향과 방패 등 물품이 늘어나요.']},
 outfits:{title:'갈아입고 카페로',image:'outfits',steps:['함께하는 남성 동료를 고른 뒤 옷을 입어 봐요. 준비 중 입기를 누르면 저장돼요.','카페의 치비 캐릭터도 같은 옷을 입고 이동·접대해요. 의상은 외형 전용이에요.']},
 bonds:{title:'답을 고르며 가까워지기',image:'bonds',steps:['동료의 성격과 고민을 듣고 세 답 중 하나를 골라요. 공감하는 답일수록 호감도가 더 올라요.','한 사람과 매 순 한 번 대화할 수 있어요. 인연 단계가 오르면 이야기와 유용한 능력이 열려요.']},
 interior:{title:'가구를 놓고 길을 남기기',image:'interior',steps:['마을에서 가구와 구역을 구매하고, 인테리어에서 배치해요.','가구를 선택해 옮기고 회전할 수 있어요. 통로가 막히면 표시를 확인한 뒤 배치를 고쳐 저장해요.']},
});
export function tutorialSheet(ui) {
 const id=GUIDES[ui.guideId]?ui.guideId:'cook',g=GUIDES[id];
 return `<h2>아틀리에 안내${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><nav class="guide-tabs">${Object.entries(GUIDES).map(([key,x])=>btn({action:'guide.select',args:{id:key},cls:key===id?'on':'',label:esc(x.title)})).join('')}</nav><div class="guide-picture">${assetIcon(`guides/${g.image}`)}</div><h3>${g.title}</h3><ol class="guide-steps">${g.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="small muted">안내는 메뉴의 사용법에서 언제든 다시 볼 수 있어요.</p>`;
}
