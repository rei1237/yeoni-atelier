// 10-29 메인 화면 「등장인물 · 재성의 섬」: 타이틀에서 열고, 두 탭에 프로필과 이야기를 보여 준다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { overlayHtml } from '../src/ui/sheets.js';
import { LORE_CAST } from '../src/ui/lore.js';

test('타이틀에 등장인물 버튼이 있고, 열면 프로필·이야기 탭을 보여 준다', () => {
  assert.match(overlayHtml(null, { storageOk: true }), /data-action="lore\.open"/);
  const cast = overlayHtml(null, { loreBook: 'cast' });
  for (const c of LORE_CAST) assert.match(cast, new RegExp(`<h3>${c.name} `));
  assert.match(cast, /aria-label="닫기"/);
  const story = overlayHtml(null, { loreBook: 'story' });
  assert.match(story, /시간을 파는 섬/);
  assert.match(story, /지름길 대신/);
  assert.match(story, /code-destiny\.com\/world/);
});

test('세계관 문구는 원작 스포일러를 적지 않는다', () => {
  const all = overlayHtml(null, { loreBook: 'cast' }) + overlayHtml(null, { loreBook: 'story' });
  assert.doesNotMatch(all, /박지은|무성|흑월|검은 호랑이/);
});
