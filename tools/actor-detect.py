import json, pathlib
from PIL import Image
from collections import deque
ROOT=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'tools/actor-sources.local.json').read_text(encoding='utf-8'))
for a in data:
 im=Image.open(a['path']);mask=im.getchannel('A').resize((im.width//3,im.height//3),Image.Resampling.NEAREST);w,h=mask.size;v=bytearray(1 if x>=128 else 0 for x in mask.getdata());boxes=[]
 for i in range(w*h):
  if not v[i]:continue
  v[i]=0;q=deque([i]);xs=[];ys=[]
  while q:
   n=q.popleft();x=n%w;y=n//w;xs.append(x);ys.append(y)
   for z in ([n-1] if x else [])+([n+1] if x<w-1 else [])+([n-w] if y else [])+([n+w] if y<h-1 else []):
    if v[z]:v[z]=0;q.append(z)
  if len(xs)>100 and max(ys)-min(ys)>16 and max(xs)-min(xs)>8:boxes.append([min(xs)*3,min(ys)*3,(max(xs)+1)*3,(max(ys)+1)*3])
 rows=[]
 for b in sorted(boxes,key=lambda b:(b[1]+b[3])/2):
  cy=(b[1]+b[3])/2
  if not rows or abs(cy-sum((x[1]+x[3])/2 for x in rows[-1])/len(rows[-1]))>im.height/32:rows.append([])
  rows[-1].append(b)
 print(a['id'],[(round(sum((x[1]+x[3])/2 for x in row)/len(row)),len(row)) for row in rows])
 a['boxes']=[sorted(row,key=lambda b:b[0]) for row in rows]
(ROOT/'tools/actor-detected.local.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
