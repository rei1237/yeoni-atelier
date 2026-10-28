// 손님 옷색은 기존 hue에서 얻는다. 저장 복원과 표시에서 난수를 소비하지 않는다.
export const CUSTOMER_LOOKS = 8;
export const NOMINATION_LOOKS = Object.freeze([0,4]); // 성인 여성 손님 · 원본/의상 색상 변형
export function customerLook(customer) {
  if(customer.nominationGuest){const value=Number.isInteger(customer.look)?customer.look:Math.floor((Number(customer.hue)||0)/45);return NOMINATION_LOOKS.includes(value)?value:NOMINATION_LOOKS[Math.abs(value)%NOMINATION_LOOKS.length];}
  if (Number.isInteger(customer.look) && customer.look >= 0 && customer.look < CUSTOMER_LOOKS) return customer.look;
  return Math.floor((((Number(customer.hue) || 0) % 360) + 360) % 360 / 45);
}
