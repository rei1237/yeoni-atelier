// 10-29 달빛 운세 수첩: 날짜로 계산되는 값만 내고, 두 번째 영업 뒤 이야기로 열린다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { pendingStory, markStory } from '../src/game/calendar.js';
import { dayPillar, zodiacYear, sunSign, readFortune } from '../src/game/fortune.js';
import { sheetHtml } from '../src/ui/sheets.js';
import { EVENT_STORIES } from '../src/story/events.js';

test('일진·띠·별자리는 날짜로 계산하고, 같은 날 같은 생일이면 같은 카드다', () => {
  assert.equal(dayPillar(1949, 10, 1).hanja, '甲子');
  assert.equal(dayPillar(2000, 1, 1).hanja, '戊午');
  const early = zodiacYear(2000, 2, 3);
  assert.equal(early.animal, '토끼', '입춘 전 생일은 앞 해 띠');
  assert.ok(early.edge, '입춘 무렵은 확인 안내를 붙인다');
  assert.equal(zodiacYear(2000, 3, 1).animal, '용');
  assert.equal(sunSign(1, 19).name, '염소자리');
  assert.equal(sunSign(1, 20).name, '물병자리');
  const today = { y: 2026, m: 10, d: 29 }, birth = { y: 1996, m: 8, d: 1 };
  assert.deepEqual(readFortune(today, birth).card, readFortune(today, birth).card);
  assert.equal(readFortune(today).birth, undefined, '생일이 없으면 생일 풀이를 지어내지 않는다');
});

test('두 번째 영업을 마치면 운세 이야기가 나오고, 본 뒤에 수첩이 열린다', () => {
  const s = createGame(); s.ledger.story.m0 = true; s.ledger.story['ev:hunt'] = true; s.huntUnlocked = true; // 테스트 준비: 사냥 이야기까지 봤다
  s.stats.shiftsCompleted = 1;
  assert.notEqual(pendingStory(s), 'ev:fortune');
  const ui = { sheet: { kind: 'fortune' } };
  assert.match(sheetHtml(s, ui), /두 번째 영업을 마치면/);
  assert.match(sheetHtml(s, { sheet: { kind: 'manage' } }), /notebook-link locked" data-action="sheet.open" data-sheet="fortune"[^]*?두 번째 영업을 마치면 열려요/, '수첩에서는 잠긴 타일로 열리는 조건을 보여 준다');
  s.stats.shiftsCompleted = 2;
  assert.equal(pendingStory(s), 'ev:fortune');
  assert.ok(EVENT_STORIES['ev:fortune'].length > 5);
  assert.equal(markStory(s, 'ev:fortune').destination, 'fortune');
  assert.doesNotMatch(sheetHtml(s, { sheet: { kind: 'manage' } }), /notebook-link locked" data-action="sheet.open" data-sheet="fortune"/, '이야기를 본 뒤에는 잠금이 풀린다');
  const html = sheetHtml(s, { ...ui, fortuneBirth: '1996-08-01', fortuneFlip: true });
  assert.match(html, /오늘의 타로 한 장/);
  assert.match(html, /쥐띠/);
  assert.match(html, /code-destiny\.com/);
});

test('실제 찻집 카드 22장의 그림과 해설, 다른 운세의 체계별 안내를 보여 준다', async () => {
  const {TAROT_NOTES,FORTUNE_GUIDES} = await import('../src/data/fortune-guide.js');
  const {TAROT} = await import('../src/data/fortune.js');
  const {readFile} = await import('node:fs/promises');
  assert.equal(TAROT_NOTES.length,TAROT.length);
  for(let i=0;i<TAROT.length;i++) assert.ok((await readFile(new URL(`../assets/illustrated/tarot/${String(i).padStart(2,'0')}.webp`,import.meta.url))).length>0);
  for(const name of ['사주','자미두수','베다 점성술','서양 점성술','숙요점','타로','주역','룬','화투점','이파 오라클','케멧 오라클','지오맨시','찻잎 점','해몽'])assert.ok(FORTUNE_GUIDES.some(g=>g.name===name));
  const s=createGame();s.ledger.story['ev:fortune']=true;
  const html=sheetHtml(s,{sheet:{kind:'fortune'},fortuneBirth:'1996-08-01',fortuneFlip:true});
  assert.match(html,/assets\/illustrated\/tarot\/\d\d\.webp/);assert.match(html,/오늘의 작은 실천/);assert.match(html,/개인 명반|전체 명반/);assert.match(html,/fortune-yeoni-v2\.webp/);
});
