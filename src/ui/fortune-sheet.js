// 10-29 달빛 운세 수첩 화면. 연이가 풀이하고 네오가 계산 근거를 짚는다. 생일은 기기에만 선택 저장한다.
import {btn,esc} from './dom.js';
import {readFortune,parseDate} from '../game/fortune.js';

export const FORTUNE_SITE='https://code-destiny.com/';
export const FORTUNE_BIRTH_KEY='yeoni.fortune.birth';
export const todayParts=(now=new Date())=>({y:now.getFullYear(),m:now.getMonth()+1,d:now.getDate()});

const row=(label,value,line,basis='')=>`<div class="fortune-row"><small>${esc(label)}</small><b>${esc(value)}</b><p>${esc(line)}</p>${basis?`<p class="fortune-basis">네오: ${esc(basis)}</p>`:''}</div>`;

export function fortuneSheet(ui,now=new Date()){
 const birth=parseDate(ui.fortuneBirth),f=readFortune(todayParts(now),birth),c=f.card,b=f.birth;
 const card=ui.fortuneFlip
  ?`<div class="fortune-card is-open" aria-live="polite"><span>${esc(c.num)}</span><b>${esc(c.name)}</b><small>${esc(c.en)}</small></div><p class="fortune-say">연이: ${esc(c.line)}</p>`
  :`${btn({action:'fortune.flip',cls:'fortune-card',label:'<img src="assets/ui/island-card-back.webp" alt="" width="120" height="200"><span>눌러서 뒤집기</span>',title:'오늘의 카드 뒤집기'})}<p class="fortune-say">연이: 마음속으로 오늘 궁금한 걸 하나 떠올려 봐. 준비됐으면 카드를 눌러!</p>`;
 const mine=b?`<section class="fortune-section fortune-step"><h3>나의 오늘</h3>
  ${row('사주 · 내 일간과 오늘',`${b.pillar.hanja}(${b.pillar.hangul})일생 · ${b.elementName} 기운 → ${b.relation.name}`,b.relation.line,`생일 일주의 천간 오행과 오늘 일진 천간의 상생·상극으로 봤어.`)}
  ${row('띠 · 오늘 일진과의 관계',`${b.zodiac.animal}띠(${b.zodiac.hanja}) · ${b.zodiac.relation.name}`,b.zodiac.relation.line,b.zodiac.edge?'2월 3~5일생은 입춘 시각에 따라 띠가 바뀔 수 있어. 태어난 시간을 확인해 봐.':'입춘(2월 4일 무렵)을 해의 시작으로 셌어.')}
  ${row('서양 별자리',b.sign.name,b.sign.trait,b.sign.edge?'경계일 근처라 태어난 해·시각에 따라 옆 별자리일 수 있어.':'태양이 지나는 황도 12궁 날짜 기준이야.')}
 </section>`:`<p class="fortune-hint">생년월일을 넣으면 사주 일간·띠·별자리 풀이가 더해져요.</p>`;
 return `<h2>달빛 운세 수첩${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2>
 <p class="fortune-date">${esc(f.dateKey)} · 오늘 일진 ${esc(f.day.hanja)}(${esc(f.day.hangul)})일 · ${esc(f.day.elementName)} 기운 · 행운 색 ${esc(f.day.color)}</p>
 <section class="fortune-section fortune-tarot fortune-step"><h3>오늘의 타로 한 장</h3>${card}<p class="fortune-basis">네오: 같은 날, 같은 생일이면 몇 번을 열어도 같은 카드야. 다시 뽑기는 없어.</p></section>
 <section class="fortune-section fortune-step"><h3>나의 생일</h3><label class="fortune-birth">생년월일(양력, 선택)<input type="date" id="fortune-birth" min="1900-01-01" max="2100-12-31" value="${esc(birth?ui.fortuneBirth:'')}"></label>
 <label class="fortune-remember"><input type="checkbox" id="fortune-remember" ${ui.fortuneRemember?'checked':''}> 이 기기에 기억하기</label>
 <p class="small muted">생일은 서버나 게임 저장으로 보내지 않아요. 기억하기를 끄면 이 기기에서도 지워요.</p></section>
 ${mine}
 <section class="fortune-section fortune-more"><p>네오: 여기서는 날짜만으로 계산되는 부분만 봤어. 사주 여덟 글자·자미두수·베다 점성은 태어난 시간과 장소가 있어야 제대로 나와.</p>
 <a class="fortune-cta" href="${FORTUNE_SITE}" target="_blank" rel="noopener noreferrer">꿀꿀 운세에서 자세히 보기 ↗</a></section>`;
}
