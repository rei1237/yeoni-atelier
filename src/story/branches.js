import {BRANCHES} from '../game/branches.js';
// 게임 오리지널: 원작 결말이나 실제 금융 상품과 관계없는 카페 확장 제안.
export function branchStory(id){const b=BRANCHES[id-1];if(!b||id===1)return null;return [
 {chapter:['한 잔에서 다음 가게로',`${id}호점 · ${b.name}`],bg:'atelier_lit',l:'yeoni:normal',r:'cheongtokki:normal'},
 {s:'cheongtokki',t:`어머~ 누적 매출이 ${b.revenue.toLocaleString()}골드를 넘었네요. 이번에는 ${b.name} 자리를 살펴보시겠어요?`},
 {s:'yeoni',t:'통장 잔액이 아니라 지금까지 번 돈을 본 거지? 장부 꼼꼼함 별 다섯.'},
 {s:'cheongtokki',t:`물론이죠. 개점 비용은 ${b.cost.toLocaleString()}골드, 최대 홀은 20칸에 ${b.maxRows}칸이랍니다~.`},
 {s:'yeoni',t:'먼저 둘러보고 결정할게. 지금 가게도 소중하니까.'},
 {s:'cheongtokki',t:'서두르지 않으셔도 돼요. 지갑은 함께 쓰지만 가구와 주문은 각 지점에서 관리해 드릴게요.'},
 {s:'sys',t:'[ 카페 수첩 → 지점 관리. 제안만으로 골드가 차감되지 않으며, 개점 확인 뒤 비용을 냅니다. 영업 중에는 지점을 바꿀 수 없습니다. ]'}
];}
