import fs from 'node:fs';
import {ASSETS,ART} from '../src/render/assets.js';
import {ASSET_UPDATES} from '../src/render/asset-updates.js';
const m=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
const records=JSON.parse(fs.readFileSync('docs/art-prompts.json','utf8'));
m.ready=[...new Set([...m.ready,...Object.entries(ASSET_UPDATES).flatMap(([g,d])=>Object.keys(d).map(k=>`${g}/${k}`))])];
fs.writeFileSync('assets/manifest.json',JSON.stringify(m,null,2)+'\n');
const old=JSON.parse(fs.readFileSync('docs/art-prompts.json','utf8'));
fs.writeFileSync('docs/art-prompts.json',JSON.stringify([...old.filter(p=>!records.some(r=>r.id===p.id)),...records],null,2)+'\n');
let doc=fs.readFileSync('docs/ASSETS.md','utf8');
const cropMarker='## 정밀 스프라이트 재배치 (2026-10-26)';
const cropNotes=doc.includes(cropMarker)?'\n\n'+doc.slice(doc.indexOf(cropMarker)):'';
doc=doc.split('## 2026-10-26 검증 가능한 실제 출고 규격')[0].trimEnd();
const ids=new Set(m.ready);doc=doc.split('\n').filter(l=>!ids.has(l.split(' | ')[0]?.replace(/^\| /,''))).join('\n');
doc+='\n\n## 2026-10-26 검증 가능한 실제 출고 규격\n\n새 일러스트는 원본을 보존하고 투명 여백 6px, 동일 배율, 128px 셀 발 위치 122px로 기계적으로 정규화했다. 이동은 아래·왼쪽·오른쪽·위 각 4프레임이며 대화 초상화는 정적인 384×576이다. 네오·루나·루나 언니의 대기와 연이의 대기·인사·결제, 영냥이 공격은 별도 프레임을 사용한다. 그 외 인물의 대기와 서빙·정리는 기존 자세에 몸·팔 움직임 및 주문 소품을 합성한다. 모든 동작이 개별 수작업 프레임인 것은 아니다.\n\n| 키 | 경로 | 크기 | 상태 |\n| --- | --- | --- | --- |\n';
for(const id of m.ready){const[g,k]=id.split('/'),d=ASSETS[g]?.[k];if(!d)continue;const z=d.dimensions||(d.kind==='actor'?[d.frame.w*d.columns,d.frame.h*d.directionRows*d.directions.length]:d.kind==='portrait'?[4*d.px,d.px*d.expressions.length]:d.kind==='object'?[128*d.size.w,128*d.size.h]:d.kind==='tile'?[ART.TILE,ART.TILE]:[d.px,d.px]);doc+=`| ${id} | ${d.path} | ${z.join('×')} | 완료 |\n`;}
fs.writeFileSync('docs/ASSETS.md',doc+cropNotes);
console.log(`Registered ${m.ready.length} asset keys`);
