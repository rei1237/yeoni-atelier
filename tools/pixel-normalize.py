"""사용자 승인한 생성 그림 후처리: 칸 맞춤, nearest, 31색+투명. 그림을 새로 그리지 않는다."""
import json, pathlib, sys
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
sources = json.loads((ROOT / 'tools/portrait-sources.local.json').read_text(encoding='utf-8'))
for item in sources:
    source = Image.open(item['path']).convert('RGBA')
    rows = item['rows']
    sheet = Image.new('RGBA', (384, rows * 96))
    for row in range(rows):
        for col in range(4):
            cell = source.crop((round(col*source.width/4), round(row*source.height/rows), round((col+1)*source.width/4), round((row+1)*source.height/rows)))
            sheet.paste(cell.resize((96,96), Image.Resampling.NEAREST), (col*96,row*96))
    alpha = sheet.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    rgb = sheet.convert('RGB').quantize(colors=31, method=Image.Quantize.MEDIANCUT).convert('RGB')
    sheet = rgb.convert('RGBA'); sheet.putalpha(alpha)
    # 완전 투명 영역 RGB도 통일해 PNG 검사와 압축을 안정화한다.
    sheet.putdata([(27,21,48,0) if a == 0 else (max(r,1),g,b,a) for r,g,b,a in sheet.getdata()])
    dest = ROOT / 'assets/sprites/portraits' / (item['id']+'.png')
    dest.parent.mkdir(parents=True, exist_ok=True); sheet.save(dest)
    print(item['id'], sheet.size, len(set(sheet.getdata())))
