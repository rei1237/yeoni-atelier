"""모바일 경량본의 크기, 프레임, 알파와 화질을 독립적으로 검증한다."""
from pathlib import Path
import json, subprocess
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
items=json.loads((root/'assets/mobile-manifest.json').read_text(encoding='utf8'))
script="import {ASSETS} from './src/render/assets.js';import fs from 'node:fs';let m=JSON.parse(fs.readFileSync('assets/manifest.json'));let out={};for(let id of m.ready){let [g,k]=id.split('/'),d=ASSETS[g][k];if(['actors','enemies','talking'].includes(g)&&d.frame)out[d.path]=d.frame;}console.log(JSON.stringify(out));"
frames=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=root))
expected=set(); errors=[]
for item in items:
    path=item['path']; source=root/path; target=root/'assets/mobile'/path.removeprefix('assets/'); expected.add(target)
    try:
        original=Image.open(source).convert('RGBA'); mobile=Image.open(target).convert('RGBA')
        if list(mobile.size)!=item['size'] or target.stat().st_size!=item['mobile'] or source.stat().st_size!=item['original']: raise ValueError('기록과 크기 불일치')
        if target.stat().st_size>=source.stat().st_size*.85: raise ValueError('용량 절감 부족')
        frame=frames.get(path)
        if frame or '/wardrobe/' in path or '/talking/' in path:
            fw=frame['w'] if frame else original.width//4
            fh=frame['h'] if frame else original.height
            if mobile.width*4!=original.width*3 or mobile.height*4!=original.height*3: raise ValueError('시트 축소 비율 불일치')
            ref=Image.new('RGBA',mobile.size)
            for y in range(original.height//fh):
                for x in range(original.width//fw):
                    cell=original.crop((x*fw,y*fh,(x+1)*fw,(y+1)*fh)).resize((fw*3//4,fh*3//4),Image.Resampling.LANCZOS)
                    ref.paste(cell,(x*fw*3//4,y*fh*3//4))
        else:
            ref=original.resize(mobile.size,Image.Resampling.LANCZOS) if original.size!=mobile.size else original
        a=np.asarray(ref,dtype=np.float32); b=np.asarray(mobile,dtype=np.float32)
        if not np.array_equal(a[:,:,3],b[:,:,3]): raise ValueError('알파 불일치')
        delta=(a[:,:,:3]-b[:,:,:3])[a[:,:,3]>=128]; mse=float(np.mean(delta*delta)) if delta.size else 0
        psnr=10*np.log10(65025/mse) if mse else 99
        if psnr<35.5: raise ValueError(f'화질 기준 미달 {psnr:.2f}')
    except Exception as exc: errors.append(f'{path}: {exc}')
actual=set((root/'assets/mobile').rglob('*.webp'))
if actual!=expected: errors.append('매니페스트와 모바일 파일 목록 불일치')
print(f'모바일 경량본 {len(items)}개 · 화질/알파/프레임 오류 {len(errors)}')
if errors: print('\n'.join(errors)); raise SystemExit(1)
