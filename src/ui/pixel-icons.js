import { btn } from './dom.js';
// 12×12 도트 아이콘(메인 화면 버튼). 글자 한 칸이 도트 한 칸이고, 같은 색이 이어지는 칸은 한 사각형으로 합친다.
// c 는 버튼 글자색(currentColor)을 따른다. 꽃·달 팔레트: 자두 윤곽·장미·아이보리·금·세이지.
const INK = Object.freeze({ k: '#4a2638', r: '#b85a6e', p: '#eaa6b4', i: '#fff6e6', g: '#e2bd6c', G: '#a87c3a', m: '#f6e7b8', S: '#5f7a5c', l: '#a9c49a', b: '#8fb3cf', B: '#5e86a8', c: 'currentColor' });

const ICONS = Object.freeze({
  cup: ['....g..g....', '...g..g.....', '....g..g....', '............', '.kkkkkkkk...', '.kiiiiiikkk.', '.kipppiik.k.', '.kiiiiiikkk.', '..kiiiik....', '...kkkk.....', 'GGGGGGGGGG..', '.GGGGGGGG...'],
  book: ['............', '.kkkk..kkkk.', 'kiiiikkiiiik', 'kirrikkiiiik', 'kiiiikkirrik', 'kirrikkiiiik', 'kiiiikkiiiik', 'kiiiikkiiiik', 'kkkkkkkkkkkk', '.GGGGkkGGGG.', '............', '............'],
  spark: ['.....g......', '.....g......', '....ggg.....', '..ggggggg...', '....ggg.....', '.....g....p.', '.....g...ppp', '..........p.', '..p.........', '.ppp........', '..p.........', '............'],
  pad: ['............', '..kkkkkkkk..', '.kiiiiiiiik.', 'kiiSiiiiriik', 'kiSSSiiririk', 'kiiSiiiiriik', 'kiiiikkiiiik', '.kiik..kiik.', '..kk....kk..', '............', '............', '............'],
  home: ['............', '.....kk.....', '....krrk....', '...krrrrk...', '..krrrrrrk..', '.kkkkkkkkkk.', '..kiiiiiik..', '..kiikkiik..', '..kiikgiik..', '..kiikkiik..', '..kkkkkkkk..', '............'],
  moon: ['............', '...kkkk.....', '..kmmk......', '.kmmk....g..', '.kmk....ggg.', 'kmmk.....g..', 'kmmk........', 'kmmk........', '.kmmk.......', '.kmmmkk..kk.', '..kkmmmmmk..', '....kkkkk...'],
  note: ['............', '......kk....', '......kgk...', '......k.gk..', '......k..gk.', '......k..k..', '......k.....', '......k.....', '...kkkk.....', '..kgggk.....', '..kgggk.....', '...kkk......'],
  arrow: ['............', '............', '.......c....', '.......cc...', '.......ccc..', '.cccccccccc.', '.cccccccccc.', '.......ccc..', '.......cc...', '.......c....', '............', '............'],
  out: ['............', '............', '.....ccccc..', '........cc..', '.......c.c..', '......c..c..', '.....c...c..', '....c.......', '...c........', '..c.........', '............', '............'],
  heart: ['............', '..kkk..kkk..', '.krppkkrrrk.', 'krppprrrrrrk', 'krpprrrrrrrk', 'krrrrrrrrrrk', '.krrrrrrrrk.', '..krrrrrrk..', '...krrrrk...', '....krrk....', '.....kk.....', '............'],
  leaf: ['............', '.......kkkk.', '.....kkllllk', '....klllllSk', '...kllllSSk.', '..klllSSllk.', '..kllSllllk.', '.kllSllllk..', '.klSllllk...', '.kSkkkkk....', 'kS..........', 'k...........'],
  flower: ['....kkkk....', '...kppppk...', '.kkkpiipkkk.', 'kppkppppkppk', 'kpikkggkkipk', 'kppkgggGkppk', 'kppkggGGkppk', 'kpikkGGkkipk', 'kppkppppkppk', '.kkkpiipkkk.', '...kppppk...', '....kkkk....'],
  energy: ['......kkkk..', '.....kmgk...', '....kmgk....', '...kmgkkkk..', '..kmggggk...', '...kkgGk....', '....kgGk....', '...kgGk.....', '..kgGk......', '..kGk.......', '..kk........', '............'],
  orders: ['....kkkk....', '.kkkkggkkkk.', '.kiiiiiiiik.', '.kirrriiiik.', '.kiiiiiiiik.', '.kiGGGGGGik.', '.kiiiiiiiik.', '.kiGGGGiiik.', '.kiiiiiiiik.', '.kiGGGGGiik.', '.kiiiiiiiik.', '.kkkkkkkkkk.'],
  kitchen: ['............', '...g..g..g..', '..g..g..g...', '.....kk.....', '..kkkkkkkk..', 'kkkrrrrrrkkk', 'k.krrrrrrk.k', '..krpprrrk..', '..krrrrrrk..', '..krrrrrrk..', '...kkkkkk...', '............'],
  crew: ['............', '..kk....kk..', '.kmmk..kmmk.', '.kmmk..kmmk.', '..kk....kk..', '.kkkk..kkkk.', 'krrrrkkSSSSk', 'krprrkkSlSSk', 'krrrrkkSSSSk', 'krrrrkkSSSSk', 'kkkkkkkkkkkk', '............'],
  island: ['............', '.........gg.', '.....kk...g.', '....kllk....', '...klSSlk...', '..klSSSSlk..', '.kmmmmmmmmk.', 'bkkkkkkkkkkb', 'bbBbbbbbBbbb', '.b..bbb..b..', '............', '............'],
  lock: ['............', '....kkkk....', '...k....k...', '...k....k...', '..kkkkkkkk..', '..kggggggk..', '..kggkkggk..', '..kggkkggk..', '..kgggggGk..', '..kkkkkkkk..', '............', '............'],
});

const cache = new Map();
export function pixelIcon(name, cls = '') {
  const key = name + '|' + cls;
  if (cache.has(key)) return cache.get(key);
  const rows = ICONS[name];
  if (!rows) return '';
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x];
      let n = 1;
      while (row[x + n] === ch) n++;
      if (INK[ch]) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${INK[ch]}"/>`;
      x += n;
    }
  });
  const svg = `<svg class="px-icon ${cls}" viewBox="0 0 12 12" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
  cache.set(key, svg);
  return svg;
}
export const PIXEL_ICON_NAMES = Object.freeze(Object.keys(ICONS));

// 메인 화면 도트 버튼: 왼쪽 아이콘 · 글자 · (선택) 오른쪽 아이콘
export const pxBtn = (action, cls, icon, label, tail = '') => btn({ action, cls: `px-btn ${cls}`, label: `${pixelIcon(icon)}<span class="px-label">${label}</span>${tail ? pixelIcon(tail, 'px-tail') : ''}` });
