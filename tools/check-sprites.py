"""정밀 알파 검사: python tools/check-sprites.py (Pillow, NumPy 필요)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import runpy
components=runpy.run_path(str(Path(__file__).with_name('pack-sprites.py')))['components']
root=Path(__file__).resolve().parents[1]
errors=[];frames=0;sheets=0
# 패킹 보고에 칸 크기가 따로 적힌 시트(넓은 공격·시전 칸)는 그 칸으로 검사한다
import json
cells={r['id']:r.get('cell') for r in json.loads((root/'docs'/'sprite-crops.json').read_text(encoding='utf-8'))}
for group,size,margin in [('actors',128,6),('wardrobe',256,8),('enemies',128,6)]:
 for path in sorted((root/'assets'/'illustrated'/group).glob('*.webp')):
  im=Image.open(path).convert('RGBA');sheets+=1
  cw,ch=cells.get(f'{group}/{path.stem}') or (size,size)
  if im.width%cw or im.height%ch:errors.append(f'{path.name}: 셀 크기 불일치');continue
  for row in range(im.height//ch):
   for col in range(im.width//cw):
    frames+=1;alpha=im.getchannel('A').crop((col*cw,row*ch,(col+1)*cw,(row+1)*ch));bbox=alpha.getbbox();key=f'{path.name} [{row},{col}]'
    if not bbox:errors.append(key+': 빈 프레임');continue
    if min(bbox[0],bbox[1],cw-bbox[2],ch-bbox[3])<margin:errors.append(key+': 투명 여백 부족')
    parts=components(np.asarray(alpha)>=24)
    if not parts:errors.append(key+': 본체 없음');continue
    mask=Image.new('L',(cw,ch));draw=ImageDraw.Draw(mask)
    for y,a,b in parts[0]:draw.line((a,y,b-1,y),fill=255)
    reach=mask.filter(ImageFilter.MaxFilter(7 if size==128 else 13)).load()
    for part in parts[1:]:
     area=sum(b-a for y,a,b in part)
     if area>=4 and not any(reach[x,y] for y,a,b in part for x in range(a,b)):errors.append(key+': 본체와 떨어진 알파 조각')
print(f'{sheets}시트 / {frames}프레임 / 경계·알파 오류 {len(errors)}')
if errors:print('\n'.join(errors));raise SystemExit(1)
