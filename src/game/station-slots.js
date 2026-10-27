// 옛 current/parallel/next 저장을 보존하며 확장 슬롯도 같은 목록으로 읽는다.
export const activeSlotNames=st=>['current','parallel',...Object.keys(st).filter(k=>/^slot[0-9]+$/.test(k)).sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)))];
export const heldKey=slot=>slot==='current'?'held':slot==='parallel'?'parallelHeld':slot+'Held';
export const runningJobs=st=>activeSlotNames(st).map(k=>st[k]).filter(Boolean);
export const queuedJobs=st=>[st.next,...(st.queue||[])].filter(Boolean);
export const stationJobs=st=>[...runningJobs(st),...queuedJobs(st)];
export const stationItems=st=>activeSlotNames(st).map(k=>st[heldKey(k)]).filter(Boolean);
