import { bondQuestion } from '../data/bond-dialogues.js';
import { BONDS } from '../data/bonds.js';
import { btn,esc } from './dom.js';
export function bondChoiceSheet(state,id) {
 const q=bondQuestion(state,id), b=BONDS[id]; if(!q||!b)return '';
 return `<h2>${esc(b.name)}와의 대화${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><div class="bond-scene"><canvas data-talking-portrait="${id}" width="256" height="384" aria-label="${esc(b.name)}"></canvas><blockquote>${esc(q.question)}</blockquote></div><p class="small">마음을 헤아리는 답은 인연을 더 깊게 해요. 선택하면 행동력 1을 쓰고, 이번 순에는 다시 이야기할 수 없어요.</p><div class="stack">${q.answers.map(a=>btn({action:'bond.answer',args:{id,choice:a.id,token:q.token},disabled:!!state.ap.talked[id]||state.ap.left<1,label:esc(a.text)})).join('')}</div>`;
}
