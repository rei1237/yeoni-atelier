// 공통 선 아이콘. 게임 그림과 구별되는 20px 조작 기호다.
const paths={
 cup:'<path d="M4 7h11v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm11 1h2a3 3 0 0 1 0 6h-2M3 21h15M7 3v1m5-1v1"/>',
 orders:'<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/>',
 kitchen:'<path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 9V7M3 21h18"/>',
 crew:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
 island:'<path d="m3 6 6-2 6 2 6-2v15l-6 2-6-2-6 2Zm6-2v15m6-13v15"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 book:'<path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v16"/>',
};
export const uiIcon=key=>`<svg class="ml-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]||paths.cup}</svg>`;
