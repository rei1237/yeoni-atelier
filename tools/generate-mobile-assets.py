"""작은 터치 화면용 그림 생성. 원본·스프라이트 좌표는 보존한다."""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from io import BytesIO
import json, subprocess
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
paths = subprocess.check_output(['git', 'ls-files', '-z', '--', 'assets'], cwd=root).decode().split('\0')
paths = [p for p in paths if p.endswith('.webp') and not p.endswith(('_hd.webp', '_ultra.webp')) and '/mobile/' not in p]
asset_script = "import {ASSETS} from './src/render/assets.js';import fs from 'node:fs';let m=JSON.parse(fs.readFileSync('assets/manifest.json'));let out={};for(let id of m.ready){let [g,k]=id.split('/'),d=ASSETS[g][k];if(['actors','enemies','talking'].includes(g)&&d.frame)out[d.path]=d.frame;}console.log(JSON.stringify(out));"
frames = json.loads(subprocess.check_output(['node','--input-type=module','-e',asset_script],cwd=root))

def convert(job):
    path, frame = job
    source = root / path
    im = Image.open(source).convert('RGBA')
    # 시트·가구·마스크는 픽셀 좌표가 계약이므로 크기를 변경하지 않는다.
    standalone = '/backgrounds/' in path or '/guides/' in path or path == 'assets/ui/jaeseong-island.webp'
    if standalone and max(im.size) > 640:
        im.thumbnail((640, 640), Image.Resampling.LANCZOS)
    # 네 방향 의상·네 칸 대화 시트는 각 프레임을 같은 비율로 축소한다.
    elif '/wardrobe/' in path or '/talking/' in path or frame:
        width = frame['w'] if frame else im.width // 4
        height = frame['h'] if frame else im.height
        if im.width % width or im.height % height or width % 4 or height % 4:
            raise ValueError(f'{path}: 프레임을 정확히 축소할 수 없음')
        fw, fh = width * 3 // 4, height * 3 // 4
        columns, rows = im.width // width, im.height // height
        resized = Image.new('RGBA', (fw * columns, fh * rows))
        for y in range(rows):
            for x in range(columns):
                part = im.crop((x*width,y*height,(x+1)*width,(y+1)*height)).resize((fw,fh),Image.Resampling.LANCZOS)
                resized.paste(part,(x*fw,y*fh))
        im = resized
    out = BytesIO()
    try:
        im.save(out, 'WEBP', quality=88, method=5, exact=True)
    except (OSError, ValueError) as exc:
        raise RuntimeError(f'{path}: {exc}') from exc
    data = out.getvalue()
    if len(data) >= source.stat().st_size * .85:
        return None
    decoded = Image.open(BytesIO(data)).convert('RGBA')
    a = np.asarray(im, dtype=np.float32)
    b = np.asarray(decoded, dtype=np.float32)
    if not np.array_equal(a[:,:,3], b[:,:,3]):
        return None
    opaque = a[:,:,3] >= 128
    delta = (a[:,:,:3]-b[:,:,:3])[opaque]
    mse = np.mean(delta*delta) if delta.size else 0
    psnr = float(10*np.log10(65025/mse)) if mse else 99.
    if psnr < 35.5:
        return None
    target = root / 'assets' / 'mobile' / path.removeprefix('assets/')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {'path':path, 'original':source.stat().st_size, 'mobile':len(data), 'size':list(im.size), 'psnr':round(psnr, 2)}

if __name__ == '__main__':
    with ProcessPoolExecutor(max_workers=4) as pool:
        result = sorted((x for x in pool.map(convert, [(p,frames.get(p)) for p in paths]) if x), key=lambda x:x['path'])
    (root/'assets'/'mobile-manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    (root/'src'/'render'/'mobile-paths.js').write_text('// 생성: tools/generate-mobile-assets.py\nexport const MOBILE_PATHS = new Set('+json.dumps([x['path'] for x in result], ensure_ascii=False, separators=(',',':'))+');\n', encoding='utf8')
    print(f'검사 {len(paths)}개 · 경량본 {len(result)}개 · 원본 {sum(x["original"] for x in result)}B → 모바일 {sum(x["mobile"] for x in result)}B')
