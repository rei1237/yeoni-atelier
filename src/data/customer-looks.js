// 손님 옷색은 기존 hue에서 얻는다. 저장 복원과 표시에서 난수를 소비하지 않는다.
export const CUSTOMER_LOOKS = 8;
export function customerLook(customer) {
  if (Number.isInteger(customer.look) && customer.look >= 0 && customer.look < CUSTOMER_LOOKS) return customer.look;
  return Math.floor((((Number(customer.hue) || 0) % 360) + 360) % 360 / 45);
}
