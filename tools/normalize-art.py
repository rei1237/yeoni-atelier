"""생성 PNG를 사용자 지정 픽셀·팔레트 규격으로 정규화한다. 원본은 보존한다."""
import json, pathlib, sys
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
for item in json.loads(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'tools/art-sources.local.json').read_text(encoding='utf-8')):
 im=Image.open(item['path']).convert('RGBA'); w,h=item['w'],item['h']
 if item.get('cols'):
  cols,rows=item['cols'],item['rows']; sheet=Image.new('RGBA',(w,h))
  for y in range(rows):
   sy=item.get('rowOrder',list(range(rows)))[y]
   for x in range(cols):
    cell=im.crop((round(x*im.width/cols),round(sy*im.height/rows),round((x+1)*im.width/cols),round((sy+1)*im.height/rows)))
    sheet.paste(cell.resize((w//cols,h//rows),Image.Resampling.NEAREST),(x*w//cols,y*h//rows))
  im=sheet
 else:
  if item['alpha']:
   bounds=im.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
   if bounds: im=im.crop(bounds)
   ratio=min((w-2)/im.width,(h-2)/im.height); fitted=im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))),Image.Resampling.NEAREST)
   im=Image.new('RGBA',(w,h)); im.paste(fitted,((w-fitted.width)//2,h-fitted.height-1))
  else: im=im.resize((w,h),Image.Resampling.NEAREST)
 alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
 im=im.convert('RGB').quantize(colors=31 if item['alpha'] else 32,method=Image.Quantize.MEDIANCUT).convert('RGBA' if item['alpha'] else 'RGB')
 if item['alpha']:
  im.putalpha(alpha); im.putdata([(27,21,48,0) if p[3]==0 else p for p in im.getdata()])
 group,key=item['id'].split('/'); folder='sprites/'+group if group in ['objects','icons','portraits','actors','enemies'] else group
 dest=ROOT/'assets'/folder/(key+'.png');dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
 print(item['id'],im.size)
