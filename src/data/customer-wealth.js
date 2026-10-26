// 카페 게임 전용 경제. Code Destiny 서비스 결제와 무관하다.
export const CUSTOMER_WEALTH = Object.freeze({
 frugal:{name:'검소한 손님',weight:35,tip:.6,color:'#9aa8ac'},
 ordinary:{name:'평범한 손님',weight:43,tip:1,color:'#c7b08b'},
 generous:{name:'통큰 손님',weight:18,tip:2.5,color:'#c48fa5'},
 tycoon:{name:'대부호 손님',weight:4,tip:6,color:'#e0bd60'},
});
export const CHEONG_WEALTH_REQUIRED=1000000;
export function wealthAt(roll){let n=Math.max(0,Math.min(.999999,roll))*100;for(const [id,d]of Object.entries(CUSTOMER_WEALTH)){n-=d.weight;if(n<0)return id;}return 'ordinary';}
export function patronTipMultiplier(id){return CUSTOMER_WEALTH[id]?.tip??1;}
export function hostRevenueMultiplier(id){return id==='cheongtokki'?1.35:1;}
