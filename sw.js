// 오래된 게임을 캐시하지 않는 설치용 워커. 저장은 기존 브라우저 저장소가 담당한다.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
