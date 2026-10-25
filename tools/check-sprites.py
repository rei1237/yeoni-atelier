"""정밀 알파 검사: python tools/check-sprites.py (Pillow, NumPy 필요)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import runpy
components=runpy.run_path(str(Path(__file__).with_name('pack-sprites.py')))['components']
root=Path(__file__).resolve().parents[1]
errors=[];frames=0;sheets=0
for group,size,margin in [('actors',128,6),('wardrobe',256,8),('enemies',128,6)]:
 for path in sorted((root/'assets'/'illustrated'/group).glob('*.webp')):
  im=Image.open(path).convert('RGBA');sheets+=1
  if im.width%size or im.height%size:errors.append(f'{path.name}: 셀 크기 불일치');continue
  for row in range(im.height//size):
   for col in range(im.width//size):
    frames+=1;alpha=im.getchannel('A').crop((col*size,row*size,(col+1)*size,(row+1)*size));bbox=alpha.getbbox();key=f'{path.name} [{row},{col}]'
    if not bbox:errors.append(key+': 빈 프레임');continue
    if min(bbox[0],bbox[1],size-bbox[2],size-bbox[3])<margin:errors.append(key+': 투명 여백 부족')
    parts=components(np.asarray(alpha)>=24)
    if not parts:errors.append(key+': 본체 없음');continue
    mask=Image.new('L',(size,size));draw=ImageDraw.Draw(mask)
    for y,a,b in parts[0]:draw.line((a,y,b-1,y),fill=255)
    reach=mask.filter(ImageFilter.MaxFilter(7 if size==128 else 13)).load()
    for part in parts[1:]:
     area=sum(b-a for y,a,b in part)
     if area>=4 and not any(reach[x,y] for y,a,b in part for x in range(a,b)):errors.append(key+': 본체와 떨어진 알파 조각')
print(f'{sheets}시트 / {frames}프레임 / 경계·알파 오류 {len(errors)}')
if errors:print('\n'.join(errors));raise SystemExit(1)
