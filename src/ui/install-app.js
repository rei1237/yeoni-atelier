let promptEvent;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
export async function installApp(){
 if(promptEvent){const e=promptEvent;promptEvent=null;await e.prompt();await e.userChoice;return;}
 const existing=document.querySelector('.install-help');if(existing){existing.showModal();return;}
 const d=document.createElement('dialog');d.className='install-help';
 const installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 d.innerHTML=`<h2>${installed?'홈 화면에서 실행 중이에요':'카페를 홈 화면에 담기'}</h2><p>${installed?'설치된 카페를 계속 이용해 주세요.':'아이폰·아이패드: Safari의 공유 버튼 → 홈 화면에 추가.<br>안드로이드: 브라우저 메뉴 → 앱 설치 또는 홈 화면에 추가.<br>PC: 주소창의 설치 아이콘이나 브라우저 앱 설치 메뉴를 이용해 주세요.'}</p><p>진행은 이 기기의 브라우저에 저장돼요. 음악과 외부 미니게임에는 인터넷 연결이 필요해요.</p><form method="dialog"><button>확인</button></form>`;
 document.body.append(d);d.showModal();
}
