// 외부 의존성 없이 WebP 컨테이너·크기·알파·문서·모바일 전송량을 검사한다.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, stat } from 'node:fs/promises';
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
const font=await readFile(new URL('assets/fonts/YeoniUI-Subset.woff2',root));totalBytes+=font.length;
if(font.length>1_500_000)errors.push('글꼴 1.5MB 초과');
if(totalBytes>=15_000_000)errors.push('런타임 에셋 15MB 전송 예산 초과');
// Git 배포 대상에는 미등록 파일도 포함한다. 추적 제외한 로컬 원본은 별도 합계로 보인다.
// Git 정보가 없으면 배포 디렉터리의 모든 파일을 검사한다.
let shipping=null;
try{shipping=new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--','assets/'],{cwd:fileURLToPath(root),encoding:'utf8'}).split('\0').filter(Boolean));}catch{}
for(const path of paths)if(shipping&&!shipping.has(path))errors.push(path+': 런타임 파일이 배포 대상에서 제외됨');
let localBytes=0,localFiles=0;
let folderBytes=0,folderFiles=0;
async function checkFolder(relative) {
 for(const entry of await readdir(new URL(relative,root),{withFileTypes:true})) {
  const path=relative+entry.name;
  if(entry.isDirectory())await checkFolder(path+'/');
  else if(entry.isFile()) {
   const {size}=await stat(new URL(path,root));localBytes+=size;localFiles++;if(shipping&&!shipping.has(path))continue;folderBytes+=size;folderFiles++;
   if(size>1_500_000)errors.push(path+': 단일 파일 1.5MB 예산 초과');
  } else errors.push(path+': 일반 파일이 아니므로 예산 확인 필요');
 }
}
await checkFolder('assets/');
if(folderBytes>=15_200_000)errors.push('assets/ 전체 15.2MB 예산 초과: '+folderBytes+'바이트');
console.log('등록 에셋 '+count+'/'+manifest.ready.length+' · 런타임 '+totalBytes+'바이트 ('+(totalBytes/1e6).toFixed(2)+'MB)');
console.log('로컬 보존 포함 '+localFiles+'파일 · '+localBytes+'바이트');
console.log('배포 assets/ 전체 '+folderFiles+'파일 · '+folderBytes+'바이트 ('+(folderBytes/1e6).toFixed(2)+'MB)');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
