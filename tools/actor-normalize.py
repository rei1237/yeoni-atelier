"""생성된 시트의 격자 오차를 맞추고 발밑 기준점과 팔레트를 통일한다."""
import json, pathlib, statistics
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
STATES=['idle','walk','cook','serve','host','react','attack','hurt']
for item in json.loads((ROOT/'tools/actor-detected.local.json').read_text(encoding='utf-8')):
 if item['id'] not in ['yeoni','yeoni_pig','neo','neo_cat','customer','luna','luna_sis','cheongtokki','moka']: continue
 im=Image.open(item['path']).convert('RGBA'); alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0); im.putalpha(alpha)
 key=item['id']; rows=len(item['boxes']); cols=7 if key=='yeoni' else 6
 # 가장 가까운 투명 여백을 셀 경계로 선택한다. 모델이 누락한 방향별 네 번째 포즈는 같은 방향 포즈로 보완한다.
 median_h=statistics.median(b[3]-b[1] for row in item['boxes'] for b in row)
 median_w=statistics.median(b[2]-b[0] for row in item['boxes'] for b in row)
 centers=[(b[0]+b[2])/2 for b in item['boxes'][0]]
 cells=[]
 for y in range(rows):
  line=[]
  for x in range(cols):
   valid=[b for b in item['boxes'][y] if median_h*.55 < b[3]-b[1] < median_h*1.45 and median_w*.45 < b[2]-b[0] < median_w*1.5]
   box=min(valid or item['boxes'][max(0,y-1)],key=lambda b:abs((b[0]+b[2])/2-centers[x]))
   if abs((box[0]+box[2])/2-centers[x])>im.width/cols*.45: box=item['boxes'][0][x]
   line.append(im.crop(box))
  cells.append(line)
 maxh=max(c.height for line in cells for c in line); maxw=max(c.width for line in cells for c in line); scale=min(28/maxh,30/maxw)
 mapping=list(range(16)) if rows==16 else [0,1,2,3,4,5,6,7,8,9,10,10,11,12,13,14] if rows==15 else [0,1,2,3,4,5,6,6,7,8,9,9,10,11,12,13]
 sheet=Image.new('RGBA',(192,1024))
 for direction in range(4):
  for state in STATES:
   source_state=item['states'].index(state) if state in item['states'] else 0
   row=cells[mapping[direction*4+source_state]]
   for frame in range(6):
    cell=row[round(frame*(cols-1)/5)]; cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.NEAREST)
    sheet.paste(cell,(frame*32+16-cell.width//2,(direction*8+STATES.index(state))*32+30-cell.height))
 a=sheet.getchannel('A'); sheet=sheet.convert('RGB').quantize(colors=31).convert('RGBA');sheet.putalpha(a)
 sheet.putdata([(27,21,48,0) if p[3]==0 else p for p in sheet.getdata()])
 dest=ROOT/'assets/sprites/actors'/f'{key}.png';dest.parent.mkdir(parents=True,exist_ok=True);sheet.save(dest)
 print(key,rows,cols,scale)
