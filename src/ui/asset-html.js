import { imageFor } from '../render/assets.js';
import { esc } from './dom.js';
// 로드가 확인된 그림만 HTML에서도 사용한다. 빠진 그림을 네트워크로 추측 요청하지 않는다.
export const assetStyle = id => { const img=imageFor(id); return img ? `background-image:url('${esc(img.src)}')` : ''; };
export const assetIcon = (id, fallback='') => { const img=imageFor(id); return img ? `<img class="pixel-icon" src="${esc(img.src)}" alt="" aria-hidden="true">` : fallback; };
export function applyAssetTheme() {
  for (const key of ['panel','button','tab','card']) {
    const img=imageFor(`ui/frame-${key}`);
    if(img)document.documentElement.style.setProperty(`--frame-${key}`,`url("${img.src}")`);
  }
}
