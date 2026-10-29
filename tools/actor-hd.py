"""출고된 128px 셀 시트를 생성 원본에서 2배(256px 셀) _hd.webp 로 다시 뽑는다. 원본·출고본은 수정하지 않는다.
사용: py tools/actor-hd.py tools/actor-hd-sources.local.json [id ...]
입력: [{id: "actors/luna", sources: [원본 png, ...]}]. 개인 경로는 커밋하지 않는다.
셀마다 원본 실루엣을 찾아 배율·위치를 맞추고, 2배 결과를 1배로 줄였을 때 출고 셀과 같아야만 쓴다.
맞지 않는 셀(합성 소품·수작업 셀)은 출고 셀을 그대로 2배로 늘려 배치를 지킨다.
"""
import importlib.util, json, pathlib, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pack', ROOT/'tools'/'pack-sprites.py'); pack = importlib.util.module_from_spec(spec); spec.loader.exec_module(pack)
K = 2

def figures(paths):
    """원본들의 인물 실루엣. 떨어진 작은 조각(머리핀·김)은 가장 가까운 큰 조각에 붙인다."""
    out = []
    for p in paths:
        im = Image.open(p).convert('RGBA'); a = np.asarray(im.getchannel('A'))
        groups = pack.components(a >= 48); boxes = [pack.box(g) for g in groups]; areas = [sum(b-x for y, x, b in g) for g in groups]
        if not areas: continue
        big = [i for i, s in enumerate(areas) if s >= max(areas)*.12]; rect = {i: list(boxes[i]) for i in big}; gap = .03*max(im.size)
        for i, s in enumerate(areas):
            if i in big or s < 30: continue
            b = boxes[i]; d = lambda j: max(rect[j][0]-b[2], b[0]-rect[j][2], rect[j][1]-b[3], b[1]-rect[j][3], 0)
            j = min(big, key=d)
            if d(j) <= gap: r = rect[j]; rect[j] = [min(r[0], b[0]), min(r[1], b[1]), max(r[2], b[2]), max(r[3], b[3])]
        for r in rect.values():
            crop = im.crop(tuple(r)); out.append(crop); out.append(crop.transpose(Image.Transpose.FLIP_LEFT_RIGHT))
    return out

def premul(im):
    a = np.asarray(im, dtype=np.float32)/255; return np.concatenate([a[..., :3]*a[..., 3:], a[..., 3:]], -1)

def bbox(a, t=.1):
    ys, xs = np.nonzero(a > t); return (xs.min(), ys.min(), xs.max()+1, ys.max()+1) if len(xs) else None

def place(fig, s, ox, oy, w, h):
    """fig 를 배율 s 로 줄여 (ox,oy)에 둔 w×h 캔버스."""
    r = fig.resize((max(1, round(fig.width*s)), max(1, round(fig.height*s))), Image.Resampling.LANCZOS)
    cv = Image.new('RGBA', (w, h)); cv.paste(r, (ox, oy)); return cv

def fit_cell(cell, figs):
    """cell(1배 RGBA)에 가장 잘 맞는 원본 실루엣과 2배 배치를 찾는다. (오차, HD셀) 또는 None."""
    c = premul(cell); b = bbox(c[..., 3])
    if not b: return 0.0, Image.new('RGBA', (cell.width*K, cell.height*K))
    bw, bh = b[2]-b[0], b[3]-b[1]; target = c[b[1]:b[3], b[0]:b[2], 3]
    best = []
    for f in figs:
        if abs(f.width/f.height - bw/bh) > .25*bw/bh: continue
        q = np.asarray(f.getchannel('A').resize((bw, bh), Image.Resampling.BILINEAR), dtype=np.float32)/255
        best.append((np.abs(q-target).mean(), f))
    best.sort(key=lambda x: x[0])
    W, H = cell.width*K, cell.height*K; result = None
    # 비교는 출고 셀의 인물 둘레(±4px)만 본다. 배율 → 위치 → 배율 순으로 좁힌다
    R = (max(0, b[0]-4), max(0, b[1]-4), min(cell.width, b[2]+4), min(cell.height, b[3]+4)); ref = c[R[1]:R[3], R[0]:R[2]]
    def score(f, s, dx, dy):
        r = f.resize((max(1, round(f.width*s)), max(1, round(f.height*s))), Image.Resampling.LANCZOS); rp = premul(r)
        ox = round(b[0]*K + (bw*K - r.width)/2)+dx; oy = round(b[3]*K - r.height)+dy
        cv = np.zeros(((R[3]-R[1])*K, (R[2]-R[0])*K, 4), np.float32); px, py = ox-R[0]*K, oy-R[1]*K
        x0, y0, x1, y1 = max(0, px), max(0, py), min(cv.shape[1], px+r.width), min(cv.shape[0], py+r.height)
        if x1 > x0 and y1 > y0: cv[y0:y1, x0:x1] = rp[y0-py:y1-py, x0-px:x1-px]
        down = cv.reshape(ref.shape[0], K, ref.shape[1], K, 4).mean((1, 3))
        return np.abs(down-ref).sum()*1000/(cell.width*cell.height), f, s, ox, oy
    for _, f in best[:4]:
        s0 = bh*K/f.height
        top = min((score(f, s, 0, 0) for s in s0*np.linspace(.96, 1.04, 9)), key=lambda x: x[0])
        top = min((score(f, top[2], dx, dy) for dy in range(-3, 4) for dx in range(-3, 4)), key=lambda x: x[0])
        dx, dy = top[3]-round(b[0]*K + (bw*K - round(f.width*top[2]))/2), top[4]-round(b[3]*K - round(f.height*top[2]))
        top = min([top]+[score(f, top[2]*m, dx, dy) for m in (.99, .995, 1.005, 1.01)], key=lambda x: x[0])
        if result is None or top[0] < result[0]: result = top
    if not result: return None
    err, f, s, ox, oy = result
    hd = place(f, s, ox, oy, W, H)
    # 출고 셀에 없던 옆 조각은 지운다. 가장자리 안티앨리어싱은 남긴다
    mask = cell.getchannel('A').resize((W, H), Image.Resampling.BILINEAR).filter(ImageFilter.MaxFilter(5))
    hd.putalpha(Image.fromarray(np.minimum(np.asarray(hd.getchannel('A')), np.asarray(mask))))
    return err, hd

def build(item, limit):
    group, key = item['id'].split('/'); path = ROOT/'assets'/'illustrated'/group/(key+'.webp')
    sheet = Image.open(path).convert('RGBA'); fw, fh = item.get('frame', [128, 128])
    figs = figures(item['sources']); out = Image.new('RGBA', (sheet.width*K, sheet.height*K)); report = []
    for y in range(sheet.height//fh):
        for x in range(sheet.width//fw):
            cell = sheet.crop((x*fw, y*fh, (x+1)*fw, (y+1)*fh)); r = fit_cell(cell, figs) if figs else None
            ok = r is not None and r[0] <= limit
            hd = r[1] if ok else cell.resize((fw*K, fh*K), Image.Resampling.LANCZOS)
            out.paste(hd, (x*fw*K, y*fh*K)); report.append(round(r[0], 1) if r else None)
    good = sum(1 for e in report if e is not None and e <= limit)
    # 맞은 셀이 절반도 안 되면 늘린 그림뿐이라 내보내지 않는다. 2배 시트는 원본의 약 4배라 품질 82로 assets/ 20MB 예산을 지킨다
    if good*2 >= len(report): out.save(path.with_name(key+'_hd.webp'), 'WEBP', quality=82, method=6)
    return {'id': item['id'], 'cells': len(report), 'matched': good, 'errors': report}

if __name__ == '__main__':
    items = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')); only = set(sys.argv[2:])
    for item in items:
        if only and item['id'] not in only: continue
        r = build(item, item.get('limit', 75.0))
        print(json.dumps({k: r[k] for k in ['id', 'cells', 'matched']}), 'max', max([e for e in r['errors'] if e is not None] or [0]), flush=True)
    # manifest.hd: _hd.webp 가 있는 출고 경로. 런타임은 이 목록에 있을 때만 2배 시트를 받는다
    m = json.loads((ROOT/'assets'/'manifest.json').read_text(encoding='utf-8'))
    m['hd'] = sorted(p.relative_to(ROOT).as_posix().replace('_hd.webp', '.webp') for p in (ROOT/'assets'/'illustrated').glob('*/*_hd.webp'))
    (ROOT/'assets'/'manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
