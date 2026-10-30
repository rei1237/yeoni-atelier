// 시트·이야기가 열리면 키보드 초점을 안에 두고, 닫히면 열었던 버튼으로 돌린다.
export function installDialogFocus() {
  let current=null, opener=null, queued=false;
  const visible = node => node && !node.closest('[hidden]');
  const focusables = node => [...node.querySelectorAll('button, a[href], input, select, [tabindex="0"]')].filter(el=>visible(el)&&el.getClientRects().length&&!el.disabled);
  function sync() {
    queued=false;
    const novel=document.getElementById('novel'), overlay=document.getElementById('overlay'), wrap=document.getElementById('sheet-wrap');
    const next=visible(novel)?novel:visible(overlay)?overlay:visible(wrap)?document.getElementById('sheet'):null;
    document.getElementById('app').inert=!!next;
    document.getElementById('world-screen').inert=!!next;
    wrap.inert=!!next && next!==document.getElementById('sheet');
    overlay.inert=!!next && next!==overlay;
    if(next===current)return;
    if(next) {
      if(!current)opener=document.activeElement;
      next.setAttribute('role','dialog');next.setAttribute('aria-modal','true');next.tabIndex=-1;
      next.setAttribute('aria-label',next.id==='novel'?'이야기':next.querySelector('h1,h2,h3')?.textContent.replace('✕','').trim()||'안내');
      (focusables(next)[0]||next).focus({preventScroll:true});
    } else if(opener?.isConnected && !opener.closest('[hidden]')) opener.focus({preventScroll:true});
    current=next;
  }
  new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(sync);}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    if(!current)return;
    if(e.key==='Tab') {
      const items=focusables(current), first=items[0]||current,last=items.at(-1)||current;
      if(e.shiftKey && (document.activeElement===first||!current.contains(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey && (document.activeElement===last||!current.contains(document.activeElement))){e.preventDefault();first.focus();}
    }
    if(e.key==='Escape') {
      const close=current.querySelector('[data-action="confirm.no"], [data-action="lore.close"], [data-action="sheet.close"], [data-action="craft.cancel"]');
      if(close){e.preventDefault();close.click();}
    }
  },true);
  sync();
}
