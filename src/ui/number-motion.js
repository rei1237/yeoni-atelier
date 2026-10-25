const values=new WeakMap();
// 표시 숫자만 움직인다. 상태·보상 계산은 읽지도 바꾸지도 않는다.
export function drawNumbers(now) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const node of document.querySelectorAll('[data-count-to]')) {
  const target=Number(node.dataset.countTo); let item=values.get(node);
  if(!item) item={from:target,to:target,start:now,value:target};
  if(item.to!==target) item={from:item.value,to:target,start:now,value:item.value};
  const progress=reduced?1:Math.min(1,(now-item.start)/320);
  item.value=Math.round(item.from+(item.to-item.from)*(1-(1-progress)**3));
  node.textContent=item.value.toLocaleString('ko-KR')+(node.dataset.countSuffix||'');values.set(node,item);
 }
}
