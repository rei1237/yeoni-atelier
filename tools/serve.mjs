// 로컬 확인용 정적 서버(빌드 없음). node tools/serve.mjs → http://127.0.0.1:5280
// 5173 은 Vite 기본 포트라 다른 개발 서버와 겹치기 쉬워서 쓰지 않는다
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 5280;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8', '.webp': 'image/webp', '.gif': 'image/gif',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') path = '/index.html';
    const file = normalize(join(ROOT, path));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end('forbidden'); return; }
    const st = await stat(file).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(400).end('bad request');
  }
}).on('error', (err) => {
  // 다른 프로그램이 같은 포트를 쓰면 그 프로그램 화면이 열리므로, 조용히 넘어가지 않고 멈춘다
  if (err.code === 'EADDRINUSE') console.error(`포트 ${PORT} 를 다른 프로그램이 쓰고 있습니다. 그 프로그램을 끄거나 PORT=다른번호 로 실행하세요.`);
  else console.error(err);
  process.exit(1);
  // localhost 는 IPv6(::1) 로 먼저 풀려 같은 포트의 다른 서버로 갈 수 있어서 127.0.0.1 에 고정한다
}).listen(PORT, '127.0.0.1', () => console.log(`연이의 아틀리에: http://127.0.0.1:${PORT}  (개발 모드: /?dev=1)`));
