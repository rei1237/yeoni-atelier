// 손님 옷색은 기존 hue에서 얻는다. 저장 복원과 표시에서 난수를 소비하지 않는다.
// 0~7은 기존 4종×2색(3·7 할아버지), 8 후드티 청년, 9 정장 신사(10-29). 이전 저장의 hue 환산은 0~7만 쓴다.
export const CUSTOMER_LOOKS = 10;
export const NOMINATION_LOOKS = Object.freeze([0,4]); // 성인 여성 손님 · 원본/의상 색상 변형
export const ELDER_LOOKS = Object.freeze([3,7]), MALE_LOOKS = Object.freeze([8,9]), WOMAN_LOOKS = Object.freeze([0,1,2,4,5,6]);
// 새 일반 손님의 외형. 부유도는 먼저 정해지고(분포 그대로) 대부호일수록 할아버지로 보인다. a·b는 state.rng 값
export function pickLook(rule, wealthId, a, b) {
  const elder = rule.elderLook[wealthId] ?? rule.elderLook.ordinary, from = list => list[Math.min(list.length - 1, Math.floor(b * list.length))];
  if (a < elder) return from(ELDER_LOOKS);
  return from((a - elder) / (1 - elder) < rule.maleLook ? MALE_LOOKS : WOMAN_LOOKS);
}
export function customerLook(customer) {
  if(customer.nominationGuest){const value=Number.isInteger(customer.look)?customer.look:Math.floor((Number(customer.hue)||0)/45);return NOMINATION_LOOKS.includes(value)?value:NOMINATION_LOOKS[Math.abs(value)%NOMINATION_LOOKS.length];}
  if (Number.isInteger(customer.look) && customer.look >= 0 && customer.look < CUSTOMER_LOOKS) return customer.look;
  return Math.floor((((Number(customer.hue) || 0) % 360) + 360) % 360 / 45);
}
