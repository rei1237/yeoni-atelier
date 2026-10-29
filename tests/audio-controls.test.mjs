import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC_CATALOG} from '../src/data/music-catalog.js';
let serial=0;
async function fixture(saved={}) {
 const events=new Map(),store=new Map([['yeoni-atelier.audio.v1',JSON.stringify(saved)]]),players=[];
 globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 globalThis.document={hidden:false,addEventListener:(k,fn)=>events.set(k,fn)};
 globalThis.Audio=class {
  constructor(){this.paused=true;this.duration=100;this.currentTime=0;this.handlers={};players.push(this);}
  addEventListener(k,fn){this.handlers[k]=fn;}
  pause(){this.paused=true;}
  play(){this.paused=false;return this.defer?new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;}):Promise.resolve();}
  load(){}
  ended(){this.paused=true;this.currentTime=this.duration;this.handlers.ended();}
 };
 const audio=await import('../src/ui/audio.js?controls='+serial++);
 return {audio,player:players[0],players,store,events};
}
test('셔플 이전·다음은 재생 이력을 따라가고 같은 순회에서 중복 곡을 고르지 않는다',async()=>{
 const {audio:a,players}=await fixture();a.unlockAudio();a.audioAction('track',MUSIC_CATALOG[0].id);a.audioAction('shuffle');const visited=[a.audioStatus().current];
 for(let i=0;i<8;i++){a.audioAction('next');visited.push(a.audioStatus().current);}
 assert.equal(new Set(visited).size,visited.length);a.audioAction('previous');assert.equal(a.audioStatus().current,visited.at(-2));a.audioAction('next');assert.equal(a.audioStatus().current,visited.at(-1));assert.equal(players.length,1);
});
test('셔플 반복 끔은 마지막 카탈로그 ID가 아니라 한 순회 103곡이 끝나면 정지한다',async()=>{
 const {audio:a,player:p}=await fixture();a.unlockAudio();a.audioAction('track',MUSIC_CATALOG.at(-1).id);a.audioAction('shuffle');a.audioAction('repeat');a.audioAction('repeat');const visited=[a.audioStatus().current];
 for(let i=1;i<MUSIC_CATALOG.length;i++){p.ended();assert.equal(a.audioStatus().music,true);visited.push(a.audioStatus().current);}
 assert.equal(new Set(visited).size,MUSIC_CATALOG.length);p.ended();assert.equal(a.audioStatus().music,false);assert.equal(p.paused,true);
});
test('취소된 재생의 늦은 실패가 새 재생이나 일시정지 상태를 오염시키지 않는다',async()=>{
 const {audio:a,player:p}=await fixture();p.defer=true;a.unlockAudio();a.audioAction('track',MUSIC_CATALOG[0].id);const reject=p.reject;a.audioAction('music');reject(new Error('old request failed'));await new Promise(setImmediate);assert.equal(a.audioStatus().error,'');assert.equal(p.paused,true);p.defer=false;a.audioAction('music');await new Promise(setImmediate);assert.equal(a.audioStatus().playing,true);assert.equal(a.audioStatus().error,'');
});
test('저장된 음악 켜짐도 사용자 입력 전에는 재생하지 않고 숨김 중에는 멈춘다',async()=>{
 const {audio:a,player:p,events}=await fixture({music:true,track:MUSIC_CATALOG[3].id,volume:.5});a.setAudioScene('cafe');assert.equal(p.paused,true);assert.equal(a.audioStatus().unlocked,false);a.unlockAudio();await new Promise(setImmediate);assert.equal(p.paused,false);assert.equal(p.volume,.5);document.hidden=true;events.get('visibilitychange')();assert.equal(p.paused,true);document.hidden=false;events.get('visibilitychange')();await new Promise(setImmediate);assert.equal(p.paused,false);
});

test('카페 자동 재생은 잔잔한 8곡을 순서대로 순환하고 수동 선곡은 유지한다',async()=>{
 const {audio:a,player:p}=await fixture({music:true});a.setAudioScene('cafe');a.unlockAudio();await new Promise(setImmediate);
 const order=[];for(let i=0;i<a.CAFE_PLAYLIST.length;i++){order.push(a.audioStatus().current);assert.equal(p.loop,false);p.ended();await new Promise(setImmediate);}
 assert.deepEqual(order,a.CAFE_PLAYLIST);assert.equal(a.audioStatus().current,a.CAFE_PLAYLIST[0]);a.audioAction('next');assert.equal(a.audioStatus().current,a.CAFE_PLAYLIST[1]);assert.equal(a.audioStatus().track,'auto');a.setAudioScene('hunt');assert.equal(a.audioStatus().current,'battle');assert.equal(p.loop,true);a.setAudioScene('companions');assert.equal(a.audioStatus().current,a.CAFE_PLAYLIST[1]);a.audioAction('track',MUSIC_CATALOG[2].id);a.setAudioScene('cafe');assert.equal(a.audioStatus().current,MUSIC_CATALOG[2].id);
});

test('사냥 자동 선곡은 카페 수동 선택과 분리되고 귀환 시 카페 곡을 복원한다',async()=>{
 const {audio:a,player:p}=await fixture({music:true,track:'destinycafe-06'});a.unlockAudio();a.setAudioScene('cafe');assert.equal(a.audioStatus().current,'destinycafe-06');
 a.setAudioScene('hunt');assert.equal(a.audioStatus().current,'battle');assert.equal(p.loop,true);a.setAudioScene('huntBoss');assert.equal(a.audioStatus().current,'boss');
 a.audioAction('track','dest1nova-39');assert.equal(a.audioStatus().current,'dest1nova-39');a.setAudioScene('cafe');assert.equal(a.audioStatus().current,'destinycafe-06');a.setAudioScene('hunt');assert.equal(a.audioStatus().current,'dest1nova-39');
 a.audioAction('music');a.setAudioScene('huntDeep');assert.equal(a.audioStatus().music,false);assert.equal(p.paused,true);
});
test('드레스룸은 카페 수동 선곡과 무관하게 White Lion을 재생하고 음소거를 지킨다',async()=>{const {audio:a,player:p}=await fixture({music:true,track:'destinycafe-06'});a.unlockAudio();a.setAudioScene('outfits');assert.equal(a.audioStatus().current,'lion');a.setAudioScene('cafe');assert.equal(a.audioStatus().current,'destinycafe-06');a.audioAction('music');a.setAudioScene('outfits');assert.equal(p.paused,true);});
test('영업을 시작하면 음악이 꺼져 있어도 Moonlight Tea부터 카페 순서로 재생하고, 🎵를 끄면 다음 영업에도 켜지 않는다',async()=>{
 const {audio:a,player:p,store}=await fixture({music:false,track:MUSIC_CATALOG[2].id});a.unlockAudio();a.setAudioScene('cafe');assert.equal(p.paused,true);
 assert.equal(a.SHIFT_FIRST_TRACK,'destinycafe-06');assert.equal(MUSIC_CATALOG.find(t=>t.id==='destinycafe-06').name,'Moonlight Tea');
 assert.equal(a.startShiftMusic(),true);await new Promise(setImmediate);
 assert.equal(a.audioStatus().current,'destinycafe-06');assert.equal(a.audioStatus().track,'auto');assert.equal(p.paused,false);
 p.ended();await new Promise(setImmediate);assert.equal(a.audioStatus().current,a.CAFE_PLAYLIST[1]);
 a.audioAction('shiftMusic');assert.equal(p.paused,true);assert.equal(JSON.parse(store.get('yeoni-atelier.audio.v1')).shiftMusic,false);
 assert.equal(a.startShiftMusic(),false);assert.equal(p.paused,true,'꺼 둔 영업 음악은 다시 켜지 않는다');
 a.audioAction('shiftMusic');await new Promise(setImmediate);assert.equal(p.paused,false);assert.equal(a.audioStatus().shiftMusic,true);
 a.startShiftMusic();await new Promise(setImmediate);assert.equal(a.audioStatus().current,'destinycafe-06','다음 영업도 Moonlight Tea부터');
});
test('영업 전 🎵 켜기는 지금 재생하지 않고 다음 영업 예약만 한다',async()=>{
 const {audio:a,player:p}=await fixture({music:false,shiftMusic:false});a.unlockAudio();a.setAudioScene('cafe');
 a.audioAction('shiftMusic','on');await new Promise(setImmediate);assert.equal(p.paused,true);assert.equal(a.audioStatus().shiftMusic,true);
 a.startShiftMusic();await new Promise(setImmediate);assert.equal(p.paused,false);assert.equal(a.audioStatus().current,'destinycafe-06');
});
test('음악실은 또렷한 닫기와 이름 붙은 재생 버튼을 달밤 카드 안에 둔다',async()=>{
 const {audio:a}=await fixture();const html=a.audioSheet();
 assert.match(html,/class="close ghost" data-action="sheet.close" title="닫기" aria-label="닫기"/);
 const now=html.slice(html.indexOf('class="music-now"'),html.indexOf('</section>',html.indexOf('class="music-now"')));
 for(const name of ['이전 곡','재생','다음 곡'])assert.match(now,new RegExp(`aria-label="${name}"`));
 assert.match(now,/data-audio-input="seek"/,'탐색 막대도 재생 카드 안에 있다');
});
