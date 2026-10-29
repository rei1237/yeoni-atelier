// 공통 조작 기호. 도트 아이콘이 있으면 도트(10-29 메인 화면 도트 통일), 없으면 20px 선 아이콘.
import {pixelIcon,PIXEL_ICON_NAMES} from './pixel-icons.js';
const paths={
 music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
 heart:'<path d="M12 21 3.8 13A5.5 5.5 0 0 1 12 5.7 5.5 5.5 0 0 1 20.2 13Z"/>',
 leaf:'<path d="M20 3C7 2 2 8 5 16c7 5 16-1 15-13ZM4 21 16 8M9 16v-5m0 5h5"/>',
 flower:'<path d="M12 8c-6-10-11 0-5 4-10 6 0 11 5 5 6 10 11 0 5-5 10-6 0-11-5-4Z"/><circle cx="12" cy="12" r="2"/>',
 energy:'<path d="m14 2-9 12h6l-1 8 9-12h-6Z"/>',
 cup:'<path d="M4 7h11v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm11 1h2a3 3 0 0 1 0 6h-2M3 21h15M7 3v1m5-1v1"/>',
 orders:'<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/>',
 kitchen:'<path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 9V7M3 21h18"/>',
 crew:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
 island:'<path d="m3 6 6-2 6 2 6-2v15l-6 2-6-2-6 2Zm6-2v15m6-13v15"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 book:'<path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v16"/>',
};
const PIXEL_ALIAS={music:'note'};
export const uiIcon=key=>PIXEL_ICON_NAMES.includes(PIXEL_ALIAS[key]||key)?pixelIcon(PIXEL_ALIAS[key]||key,'ml-icon'):`<svg class="ml-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]||paths.cup}</svg>`;
