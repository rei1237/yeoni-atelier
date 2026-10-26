"""기계적 알파 분리/재배치. Pillow+NumPy, 생성 원본은 수정하지 않는다.
Usage: python tools/pack-sprites.py --sources local-sources.json
sources: [{key, path, group: actors|enemies, rows:4|3}].
균등 사각 크롭 대신 원본 전체의 연결된 인물 실루엣을 찾는다.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
import json, argparse

def components(mask):
    parents=[];runs=[];prev=[]
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    for y,row in enumerate(mask):
        edges=np.flatnonzero(np.diff(np.pad(row.astype(np.int8),(1,1))))
        current=[];j=0
        for x0,x1 in zip(edges[::2],edges[1::2]):
            x0,x1=int(x0),int(x1);idx=len(parents);parents.append(idx);runs.append((y,x0,x1));current.append((x0,x1,idx))
            while j<len(prev) and prev[j][1]<x0:j+=1
            k=j
            while k<len(prev) and prev[k][0]<=x1:
                parents[find(idx)]=find(prev[k][2]);k+=1
        prev=current
    groups={}
    for i,run in enumerate(runs):groups.setdefault(find(i),[]).append(run)
    return sorted(groups.values(),key=lambda g:sum(b-a for y,a,b in g),reverse=True)

def box(group):
    return min(a for y,a,b in group),min(y for y,a,b in group),max(b for y,a,b in group),max(y for y,a,b in group)+1

def separate(im,rows):
    alpha=im.getchannel('A');groups=components(np.asarray(alpha)>=48);major=groups[:rows*4]
    if len(major)!=rows*4:raise ValueError('인물 수 부족')
    areas=[sum(b-a for y,a,b in g) for g in major]
    if min(areas)<max(areas)*.12:raise ValueError('연결된 인물 수가 예상과 다름: 원본 검토 필요')
    # 원본의 실제 인물 중심으로 행/열을 정한다. 그림을 임의의 균등 경계로 자르지 않는다.
    major.sort(key=lambda g:(box(g)[1]+box(g)[3])/2)
    ordered=[]
    for r in range(rows):ordered.extend(sorted(major[r*4:r*4+4],key=lambda g:(box(g)[0]+box(g)[2])/2))
    frames=[];bounds=[]
    for g in ordered:
        bbox=box(g);pad=3
        crop=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(im.width,bbox[2]+pad),min(im.height,bbox[3]+pad))
        mask=Image.new('L',(crop[2]-crop[0],crop[3]-crop[1]));draw=ImageDraw.Draw(mask)
        for y,a,b in g:draw.line((a-crop[0],y-crop[1],b-1-crop[0],y-crop[1]),fill=255)
        # 실루엣 바로 옆 안티앨리어싱만 복원. 다른 인물·배경 조각은 포함하지 않는다.
        mask=mask.filter(ImageFilter.MaxFilter(5));tile=im.crop(crop)
        tile.putalpha(ImageChops.multiply(tile.getchannel('A'),mask).point(lambda v:0 if v<8 else v))
        tile=tile.crop(tile.getchannel('A').getbbox());frames.append(tile);bounds.append(bbox)
    return frames,bounds

def pack(frames,size,cols,rows,pad):
    scale=min(min((size-2*pad)/im.width,(size-2*pad)/im.height) for im in frames)
    atlas=Image.new('RGBA',(size*cols,size*rows))
    for i,im in enumerate(frames):
        im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
        im.putalpha(im.getchannel('A').point(lambda v:0 if v<8 else v))
        atlas.alpha_composite(im,((i%cols)*size+(size-im.width)//2,(i//cols)*size+size-pad-im.height))
    return atlas

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--sources',required=True);args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];report=[]
    for j in json.loads(Path(args.sources).read_text(encoding='utf-8-sig')):
        source=Path(j['path']);im=Image.open(source).convert('RGBA');frames,bounds=separate(im,j['rows'])
        target=root/'assets'/'illustrated'/j['group']/(j['key']+'.webp')
        pack(frames,128,4,j['rows'],6).save(target,'WEBP',quality=90,method=4)
        preview=root/'assets'/'illustrated'/'wardrobe'/(j['key']+'.webp')
        if preview.exists():pack([frames[i*4+1] for i in range(4)],256,4,1,8).save(preview,'WEBP',quality=92,method=4)
        report.append({'id':j['group']+'/'+j['key'],'source':source.name,'sourceSize':list(im.size),'sourceBounds':bounds,'frames':len(frames),'cell':[128,128],'anchor':[64,122],'transparentGutter':6})
        print(j['key'],len(frames),'isolated frames',flush=True)
    (root/'docs'/'sprite-crops.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
