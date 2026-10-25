// 외부 의존성 없이 WebP 컨테이너·크기·알파·문서·모바일 전송량을 검사한다.
import { readFile } from 'node:fs/promises';
import { ASSETS, ART } from '../src/render/assets.js';
const root = new URL('../',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets/manifest.json',root),'utf8'));
const document = await readFile(new URL('docs/ASSETS.md',root),'utf8');
const prompts = JSON.parse(await readFile(new URL('docs/art-prompts.json',root),'utf8'));
const errors=[],paths=new Set(); let count=0,totalBytes=0;
if(new Set(manifest.ready).size!==manifest.ready.length)errors.push('manifest 중복 키');
for(const id of manifest.ready) {
 try {
  const [group,key]=id.split('/'),def=ASSETS[group]?.[key];
  if(!def)throw Error('레지스트리 정의 없음');
  const b=await readFile(new URL(def.path,root)); if(!paths.has(def.path)){totalBytes+=b.length;paths.add(def.path);}
  if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'||b.readUInt32LE(4)+8!==b.length)throw Error('WebP 컨테이너 오류');
  let w,h,alpha=false,encoded=false;
  for(let p=12;p+8<=b.length;) {
   const kind=b.toString('ascii',p,p+4),len=b.readUInt32LE(p+4),d=p+8;
   if(d+len>b.length)throw Error('손상된 청크');
   if(kind==='VP8X'){alpha=!!(b[d]&16);w=b.readUIntLE(d+4,3)+1;h=b.readUIntLE(d+7,3)+1;}
   if(kind==='VP8 '){encoded=true;w??=b.readUInt16LE(d+6)&16383;h??=b.readUInt16LE(d+8)&16383;}
   if(kind==='VP8L'){encoded=true;const bits=b.readUInt32LE(d+1);w??=(bits&16383)+1;h??=((bits>>>14)&16383)+1;alpha||=!!((bits>>>28)&1);}
   p=d+len+(len%2);
  }
  if(!encoded)throw Error('이미지 청크 없음');
  const expected=def.dimensions || (def.kind==='portrait'?[4*def.px,def.px*def.expressions.length]:def.kind==='actor'?[def.frame.w*def.columns,def.frame.h*def.directionRows*def.directions.length]:def.kind==='object'?[128*def.size.w,128*def.size.h]:def.kind==='tile'?[ART.TILE,ART.TILE]:[def.px,def.px]);
  if(w!==expected[0]||h!==expected[1])throw Error('크기 '+w+'×'+h+', 필요 '+expected.join('×'));
  if(def.kind!=='tile'&&!def.opaque&&!alpha)throw Error('알파 채널 없음');
  if(!document.split('\n').some(line=>line.startsWith('| '+id+' |')&&line.includes('| '+w+'×'+h+' | 완료 |')))throw Error('ASSETS.md 크기·상태 불일치');
  if(!prompts.some(p=>p.id===id&&(p.prompt||p.aliasOf)))throw Error('생성 기록 없음');
  if(b.length>1_500_000)throw Error('단일 에셋 1.5MB 전송 예산 초과');
  count++;
 }catch(e){errors.push(id+': '+e.message);}
}
if(totalBytes>15_000_000)errors.push('전체 에셋 15MB 전송 예산 초과');
console.log('에셋 '+count+'/'+manifest.ready.length+' 통과 · '+(totalBytes/1e6).toFixed(2)+'MB');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
