import {btn} from './dom.js';
export const MINI_GAMES=Object.freeze([{image:'killer',name:'꽃돼지 청토끼 슬레이어!',url:'https://killerflowerpig.vercel.app/'},{image:'flying',name:'날아라 꽃돼지!',url:'https://flyingflowerpig.vercel.app/'}]);
export const gameRoomLinks=()=>`<div class="game-room-links">${MINI_GAMES.map(g=>`<a href="${g.url}" target="_blank" rel="noopener noreferrer"><img src="assets/ui/game-${g.image}.webp" alt="" width="480" height="270">${g.name}<span>새 창에서 시작 ↗</span></a>`).join('')}</div>`;
export const gameRoomArt=()=>'<img class="game-room-art" src="assets/ui/game-room.webp" alt="달빛 카페에서 함께 컨트롤러를 들고 게임하는 연이와 네오" width="640" height="360">';
export const titleGameRoom=()=>btn({action:'game.room',cls:'title-room-button',label:'연이와 네오의 게임방 <span>↗</span>'});
export const gameRoomSheet=(closeAction='sheet.close')=>`<h2>연이와 네오의 게임방${btn({action:closeAction,cls:'close ghost',label:'✕',title:'닫기'})}</h2>${gameRoomArt()}<p>연이: 오늘은 내가 먼저 골라도 돼?<br>네오: 좋아. 이번 판은 끝까지 같이하자.</p>${gameRoomLinks()}<p class="small">게임은 새 창에서 열려요. 카페로 돌아오려면 이 창을 선택해 주세요.</p>`;
