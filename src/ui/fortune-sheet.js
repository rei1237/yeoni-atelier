// 10-29 달빛 운세 수첩 화면. 연이가 풀이하고 네오가 계산 근거를 짚는다. 생일은 기기에만 선택 저장한다.
import {btn,esc} from './dom.js';
import {TAROT_NOTES,FORTUNE_GUIDES,RELATION_NOTES} from '../data/fortune-guide.js';
import {readFortune,parseDate} from '../game/fortune.js';

export const FORTUNE_SITE='https://code-destiny.com/';
export const FORTUNE_BIRTH_KEY='yeoni.fortune.birth';
export const todayParts=(now=new Date())=>({y:now.getFullYear(),m:now.getMonth()+1,d:now.getDate()});

const row=(label,value,line,basis='')=>`<div class="fortune-row"><small>${esc(label)}</small><b>${esc(value)}</b><p>${esc(line)}</p>${basis?`<p class="fortune-basis">네오: ${esc(basis)}</p>`:''}</div>`;

export function fortuneSheet(ui,now=new Date()){
 const today=todayParts(now),todayKey=`${today.y}-${String(today.m).padStart(2,'0')}-${String(today.d).padStart(2,'0')}`;
 const parsed=parseDate(ui.fortuneBirth),invalid=!!ui.fortuneBirth&&(!parsed||ui.fortuneBirth>todayKey);
 const birth=invalid?null:parsed,f=readFortune(today,birth),c=f.card,b=f.birth, note=TAROT_NOTES[c.index];
 const card=ui.fortuneFlip
  ?`<div class="fortune-card is-open" aria-live="polite"><img src="assets/illustrated/tarot/${String(c.index).padStart(2,'0')}.webp" alt="${esc(c.name)} 타로 카드" width="120" height="200"><b>${esc(c.name)}</b><small>${esc(c.en)}</small></div><div class="fortune-reading"><p class="fortune-say">연이: ${esc(c.line)}</p><h4>${esc(note[0])}</h4><p>${esc(note[1])}</p><p><b>오늘의 작은 실천</b> · ${esc(note[2])}</p></div>`
  :`${btn({action:'fortune.flip',cls:'fortune-card',label:'<img src="assets/ui/island-card-back.webp" alt="" width="120" height="200"><span>눌러서 뒤집기</span>',title:'오늘의 카드 뒤집기'})}<p class="fortune-say">연이: 마음속으로 오늘 궁금한 걸 하나 떠올려 봐. 준비됐으면 카드를 눌러!</p>`;
 const mine=b?`<section class="fortune-section fortune-step"><h3>나의 오늘</h3>
  ${row('사주 · 내 일간과 오늘',`${b.pillar.hanja}(${b.pillar.hangul})일생 · ${b.elementName} 기운 → ${b.relation.name}`,b.relation.line,`생일 일주의 천간 오행과 오늘 일진 천간의 상생·상극으로 봤어.`)}
  <p class="fortune-reflection">연이: ${esc(RELATION_NOTES[b.relation.id])}</p>
  ${row('띠 · 오늘 일진과의 관계',`${b.zodiac.animal}띠(${b.zodiac.hanja}) · ${b.zodiac.relation.name}`,b.zodiac.relation.line,b.zodiac.edge?'2월 3~5일생은 입춘 시각에 따라 띠가 바뀔 수 있어. 태어난 시간을 확인해 봐.':'입춘(2월 4일 무렵)을 해의 시작으로 셌어.')}
  ${row('서양 별자리',b.sign.name,b.sign.trait,b.sign.edge?'경계일 근처라 태어난 해·시각에 따라 옆 별자리일 수 있어.':'태양이 지나는 황도 12궁 날짜 기준이야.')}
 </section>`:`<p class="fortune-hint">생년월일을 넣으면 사주 일간·띠·별자리 풀이가 더해져요.</p>`;
 return `<h2>달빛 운세 수첩${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2>
 <img class="fortune-cover" src="assets/illustrated/guides/fortune-yeoni-v2.webp" alt="연이와 함께 펼치는 달빛 운세 수첩" width="1000" height="563">
 <p class="fortune-date">${esc(f.dateKey)} · 오늘 일진 ${esc(f.day.hanja)}(${esc(f.day.hangul)})일 · ${esc(f.day.elementName)} 기운 · 오행의 상징색 ${esc(f.day.color)}</p>
 <section class="fortune-section fortune-tarot fortune-step"><h3>오늘의 타로 한 장</h3>${card}<p class="fortune-basis">네오: 같은 날, 같은 생일이면 몇 번을 열어도 같은 카드야. 다시 뽑기는 없어.</p></section>
 <section class="fortune-section fortune-step"><h3>나의 생일</h3><label class="fortune-birth">생년월일(양력, 선택)<input type="date" id="fortune-birth" min="1900-01-01" max="${todayKey}" aria-describedby="fortune-birth-help" aria-invalid="${invalid}" value="${esc(parsed?ui.fortuneBirth:'')}"></label>
 <p id="fortune-birth-help" class="fortune-hint" role="status">${invalid?'1900년 이후부터 오늘까지의 생년월일을 확인해 주세요.':'생일 없이도 오늘의 카드와 일진을 볼 수 있어요.'}</p>
 <label class="fortune-remember"><input type="checkbox" id="fortune-remember" ${ui.fortuneRemember?'checked':''}> 이 기기에 기억하기</label>
 <p class="small muted">생일은 서버나 게임 저장으로 보내지 않아요. 기억하기를 끄면 이 기기에서도 지워요.</p></section>
 ${mine}
 <section class="fortune-section fortune-library"><h3>연이와 살펴보는 운세</h3><p>마음에 닿는 이야기를 열어 보세요. 아래 질문은 나를 돌아보기 위한 안내예요.</p><div class="fortune-guide-list">${FORTUNE_GUIDES.map(g=>`<details class="fortune-guide"><summary>${esc(g.name)}</summary><p>${esc(g.desc)}</p><p class="fortune-question">연이의 질문 · ${esc(g.question)}</p><a href="${FORTUNE_SITE}${esc(g.href)}" target="_blank" rel="noopener noreferrer">${esc(g.name)} 자세히 보기 ↗</a></details>`).join('')}</div></section>
 <section class="fortune-section fortune-more"><h3>이 수첩의 풀이 기준</h3><p>네오: 날짜를 바탕으로 돌아볼 거리를 정리했다. 타로는 오늘의 성찰을 위한 한 장이며, 미래를 확정하는 결과는 아니다.</p><p>일주는 입력한 양력 날짜의 자정을 기준으로 계산한다. 출생 시각·지역·자시 기준은 반영하지 않는다. 띠와 태양 별자리는 경계일에 달라질 수 있다.</p><p>사주 여덟 글자·자미두수·베다 점성의 전체 명반은 이 수첩에서 계산하지 않는다. 각 체계의 자세한 풀이는 꿀꿀 운세에서 확인해라.</p>
 <a class="fortune-cta" href="${FORTUNE_SITE}" target="_blank" rel="noopener noreferrer">꿀꿀 운세에서 자세히 보기 ↗</a></section>`;
}
