// 외부 의존성 없이 PNG RGBA8 및 RGB8을 검사한다. 생성 후 정규화 파일의 크기·색·알파 검증.
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { ASSETS } from '../src/render/assets.js';
const manifest = JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url),'utf8'));
const document = await readFile(new URL('../docs/ASSETS.md',import.meta.url),'utf8');
let count=0; const errors=[];
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
for(const id of manifest.ready) {
 try {
  const [group,key]=id.split('/'), def=ASSETS[group]?.[key]; if(!def)throw Error('레지스트리 정의 없음');
  const b=await readFile(new URL('../'+def.path,import.meta.url)); if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG 아님');
  let w,h,channels,parts=[];
  for(let p=8;p<b.length;) {const len=b.readUInt32BE(p),type=b.toString('ascii',p+4,p+8),data=b.subarray(p+8,p+8+len);p+=len+12;
   if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);channels=data[9]===6?4:data[9]===2?3:0;if(data[8]!==8||!channels||data[12])throw Error('검사는 비인터레이스 RGB/RGBA8 필요');}
   if(type==='IDAT')parts.push(data);
  }
  const expected=def.dimensions || (def.kind==='portrait'?[384,96*def.expressions.length]:def.kind==='actor'?[def.frame.w*(group==='enemies'?4:6),def.frame.h*8*def.directions.length]:def.kind==='object'?[32*def.size.w,32*def.size.h]:def.kind==='tile'?[32,32]:[def.px,def.px]);
  if(w!==expected[0]||h!==expected[1])throw Error(`크기 ${w}×${h}, 필요 ${expected.join('×')}`);
  const row=document.split('\n').find(line=>line.startsWith(`| ${id} |`));
  if(!row || !row.includes(`| ${w}×${h} | 완료 |`))throw Error('ASSETS.md 크기·완료 상태 불일치');
  const raw=inflateSync(Buffer.concat(parts)), stride=w*channels, pixels=Buffer.alloc(w*h*channels); let n=0;
  for(let y=0;y<h;y++){const f=raw[n++];if(f>4)throw Error('PNG 필터 오류');for(let x=0;x<stride;x++){const pos=y*stride+x,a=x>=channels?pixels[pos-channels]:0,up=y?pixels[pos-stride]:0,c=y&&x>=channels?pixels[pos-stride-channels]:0; pixels[pos]=(raw[n++]+[0,a,up,Math.floor((a+up)/2),paeth(a,up,c)][f])&255;}}
  const colors=new Set(),alpha=new Set();for(let p=0;p<pixels.length;p+=channels){const a=channels===4?pixels[p+3]:255;alpha.add(a);colors.add(`${pixels[p]},${pixels[p+1]},${pixels[p+2]},${a}`);}
  if(colors.size>32)throw Error(`색 ${colors.size}개 >32`);
  if(def.kind!=='tile'&&!def.opaque&&!alpha.has(0))throw Error('투명 배경 없음');
  if([...alpha].filter(a=>a>0&&a<255).length>1)throw Error('반투명 그림자 1단계 초과');
  count++;
 }catch(e){errors.push(`${id}: ${e.message}`);}
}
console.log(`에셋 ${count}/${manifest.ready.length} 통과`); if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
