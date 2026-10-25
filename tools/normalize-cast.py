"""생성 원본에서 확인한 행 중심을 사용해 의상·추가 동료 시트를 맞춘다."""
import json,pathlib,statistics
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
STATES=['idle','walk','cook','serve','host','react','attack','hurt']
spec=json.loads((ROOT/'tools/actor-grid-spec.json').read_text())
for a in json.loads((ROOT/'tools/actor-detected.local.json').read_text(encoding='utf-8')):
 if a['id'] not in [x['id'] for x in json.loads((ROOT/'tools/actors-extra.local.json').read_text(encoding='utf-8'))]:continue
 im=Image.open(a['path']).convert('RGBA');key=a['id'];cols=7 if key in ['neo@host_first','neo@crescent_tailcoat'] else 6
 ys=spec.get(key,[statistics.median((b[1]+b[3])/2 for b in row) for row in a['boxes']])
 stable=next((row for row in a['boxes'] if len(row)==cols),a['boxes'][0]);xs=[(b[0]+b[2])/2 for b in stable];pitch=statistics.median(xs[i+1]-xs[i] for i in range(len(xs)-1))
 if len(xs)!=cols:xs=[im.width*(i+.5)/cols for i in range(cols)];pitch=im.width/cols
 cells=[]
 for y,cy in enumerate(ys):
  lo=0 if y==0 else (ys[y-1]+cy)/2;hi=im.height if y==len(ys)-1 else (cy+ys[y+1])/2
  line=[]
  for cx in xs:
   cell=im.crop((round(cx-pitch*.47),round(lo),round(cx+pitch*.47),round(hi)));alpha=cell.getchannel('A').point(lambda x:255 if x>=128 else 0);cell.putalpha(alpha);bbox=alpha.getbbox();line.append(cell.crop(bbox) if bbox else cell)
  cells.append(line)
 n=len(ys);mapping=list(range(16)) if n==16 else [0,1,2,3,4,5,6,7,8,9,10,10,11,12,13,14] if n==15 else [0,1,2,3,4,5,6,6,7,8,9,9,10,11,12,13] if n==14 else [0,1,2,2,3,4,5,5,6,7,8,8,9,10,11,12]
 scale=min(28/max(c.height for row in cells for c in row),30/max(c.width for row in cells for c in row));sheet=Image.new('RGBA',(192,1024))
 for d in range(4):
  for si,st in enumerate(STATES):
   sr=a['states'].index(st) if st in a['states'] else 0
   for f in range(6):
    c=cells[mapping[d*4+sr]][round(f*(cols-1)/5)];c=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.NEAREST);sheet.paste(c,(f*32+16-c.width//2,(d*8+si)*32+30-c.height))
 alpha=sheet.getchannel('A');sheet=sheet.convert('RGB').quantize(colors=31).convert('RGBA');sheet.putalpha(alpha);sheet.putdata([(27,21,48,0) if p[3]==0 else p for p in sheet.getdata()]);sheet.save(ROOT/'assets/sprites/actors'/f'{key}.png');print(key,n,cols)
