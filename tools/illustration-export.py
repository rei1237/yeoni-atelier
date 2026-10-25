"""내장 image_gen 원본을 셀 정렬·Lanczos 리샘플링·WebP 압축한다. 원본은 보존한다.
사용: python tools/illustration-export.py tools/illustration-sources.local.json
입력: id, path, alpha 및 w/h 또는 cols/rows/cell. 개인 경로는 커밋하지 않는다.
"""
import json
import pathlib
import sys
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[1]
for item in json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')):
    group, key = item['id'].split('/')
    im = Image.open(item['path']).convert('RGBA')
    if item.get('cols'):
        cols, rows, px = item['cols'], item['rows'], item['cell']
        cells = []
        order = [0, 2, 1, 3] if group == 'portraits' else list(range(cols))
        for row in range(rows):
            for col in order:
                cells.append(im.crop((round(col*im.width/cols), round(row*im.height/rows),
                                      round((col+1)*im.width/cols), round((row+1)*im.height/rows))))
        sheet = Image.new('RGBA', (cols*px, rows*px))
        if group in ['actors', 'enemies']:
            bounds = [c.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox() for c in cells]
            if any(b is None for b in bounds): raise ValueError(f"{item['id']}: 빈 셀")
            scale = min(px*.90 / max(b[2]-b[0] for b in bounds), px*.88 / max(b[3]-b[1] for b in bounds))
            for n, (cell, b) in enumerate(zip(cells, bounds)):
                box=(max(0,b[0]-2),max(0,b[1]-2),min(cell.width,b[2]+2),min(cell.height,b[3]+2))
                crop=cell.crop(box)
                crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))), Image.Resampling.LANCZOS)
                sheet.paste(crop, ((n%cols)*px+(px-crop.width)//2, (n//cols)*px+round(px*.9375)-crop.height))
        else:
            for n, cell in enumerate(cells):
                # 비정방형 생성 셀도 얼굴 비율을 늘이지 않고 중앙을 정방형으로 맞춘다.
                sheet.paste(ImageOps.fit(cell,(px,px),Image.Resampling.LANCZOS,centering=(.5,.4)), ((n%cols)*px,(n//cols)*px))
        im=sheet
    elif item['alpha'] and not key.startswith('transform'):
        w,h=item['w'],item['h']
        bbox=im.getchannel('A').getbbox()
        if not bbox: raise ValueError(f"{item['id']}: 빈 이미지")
        crop=im.crop(bbox)
        margin=0 if key.startswith('frame-') else max(3,round(min(w,h)*.04))
        scale=min((w-margin*2)/crop.width,(h-margin*2)/crop.height)
        crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.LANCZOS)
        im=Image.new('RGBA',(w,h));im.paste(crop,((w-crop.width)//2,(h-crop.height)//2))
    else:
        im=im.resize((item['w'],item['h']),Image.Resampling.LANCZOS)
    if not item['alpha']: im=im.convert('RGB')
    elif im.getchannel('A').getextrema()[0] != 0: raise ValueError(f"{item['id']}: 투명 배경 없음")
    folder='sprites/'+group if group in ['actors','enemies','portraits','objects','icons'] else group
    dest=ROOT/'assets'/folder/(key+'.webp')
    dest.parent.mkdir(parents=True,exist_ok=True)
    pending=dest.with_suffix('.webp.tmp')
    im.save(pending,'WEBP',quality=85,method=4)
    with Image.open(pending) as decoded:
        if decoded.size != im.size: raise ValueError(f'{dest}: 압축 후 크기 불일치')
    pending.replace(dest)
    print(item['id'], im.size, dest.stat().st_size)
