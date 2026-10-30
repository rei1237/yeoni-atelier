import {ARCANA} from '../data/bonds.js';
import {TAROT} from '../data/fortune.js';
import {esc} from './dom.js';
// 연이와 청토끼의 카드는 아틀리에 외전의 상징이다.
const EXTRA=Object.freeze({yeoni:['0','바보'],cheongtokki:['XI','정의']});
export function arcanaSymbol(id,{masked=false}={}){
 if(masked)return '<span class="character-arcana concealed"><img src="assets/ui/island-card-back.webp" alt="" loading="lazy" width="32" height="48"><span><small>인연의 카드</small><b>아직 비밀이에요</b></span></span>';
 const pair=ARCANA[id]||EXTRA[id];if(!pair)return '';
 const index=TAROT.findIndex(card=>card[0]===pair[0]);if(index<0)return '';
 return `<span class="character-arcana"><img src="assets/illustrated/tarot/${String(index).padStart(2,'0')}.webp" alt="" loading="lazy" width="32" height="48"><span><small>인연의 카드 · ${esc(pair[0])}</small><b>${esc(pair[1])}</b></span></span>`;
}
