// Code Destiny 공개 스트리밍. 음원 다운로드·결제 권한 부여는 하지 않는다.
import {btn,esc} from './dom.js';
import {MUSIC_CATALOG} from '../data/music-catalog.js';
const aliases={cafe:'DestinyCafe/Kindness.mp3',dream:'DestinyWar/Dream.mp3',strategy:'DestinyWar/Moonlit Strategy Map.mp3',battle:'DestinyWar/The war.mp3',lion:'DestinyWar/White Lion.mp3',boss:'DestinyWar/The Moonlit War Room.mp3',tea:'DestinyCafe/Moonlit Tea House.mp3',opening:'DEST1NOVA/달빛 운명여행 main title.mp3'};
export const TRACKS=Object.fromEntries([...MUSIC_CATALOG.map(t=>[t.id,t]),...Object.entries(aliases).map(([id,key])=>[id,MUSIC_CATALOG.find(t=>t.source===key)])]);
const GROUPS={all:'전체',dest1nova:'DEST1NOVA',yeoni:'연이',lunabloom:'Luna bloom',destinycafe:'운명의 찻집',meditation:'명상'};
let category='all',query='',bag=[],history=[],forward=[],shuffleReady=false,lastFailed='',playGeneration=0;
const KEY='yeoni-atelier.audio.v1';
let settings={music:false,sfx:true,volume:.35,sfxVolume:.75,track:'auto',repeat:'all',shuffle:false};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
settings.volume=Math.max(0,Math.min(1,Number.isFinite(Number(settings.volume))?Number(settings.volume):.35));
const player=typeof Audio!=='undefined'?new Audio():{pause(){},addEventListener(){}};player.preload='none';player.loop=false;
let context, master, noise, unlocked=false, scene='title', current='', error='', pending=false, storyTrack=null;
const lastSounds=new Map(), voices=new Set();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
export function trackForScene(scene){return ({title:'tea',hunt:'battle',huntDeep:'lion',huntBoss:'boss',huntResult:'dream',huntPrep:'strategy',farm:'dream',story:'dream',outfits:'opening',fever:'opening'}[scene]||'cafe');}
function selected(){return settings.track==='auto'?(scene==='story'&&storyTrack?storyTrack:trackForScene(scene)):settings.track;}
export function setStoryAudio(track){const next=TRACKS[track]?track:null;if(storyTrack!==next){storyTrack=next;sync();}}
function sync(){
 if(!settings.music||!unlocked||document.hidden){player.pause();pending=false;playGeneration++;return;}
 const id=TRACKS[selected()]?selected():'cafe';
 if(current!==id){player.pause();player.src=TRACKS[id].url;current=id;error='';pending=false;lastFailed='';playGeneration++;}
 player.loop=settings.track==='auto'||settings.repeat==='one';
 if(lastFailed===current)return;
 player.volume=settings.volume*(scene==='story'?.6:1);
 if(player.paused&&!pending){pending=true;const request=++playGeneration;player.play().then(()=>{if(request===playGeneration)pending=false;}).catch(e=>{if(request===playGeneration){pending=false;if(e.name!=='AbortError'){error='음악 연결을 확인하고 다시 재생해 주세요.';lastFailed=current;}}});}
}
player.addEventListener('error',()=>{pending=false;lastFailed=current;error='음악 연결을 확인해 주세요. 게임은 계속할 수 있어요.';});
player.addEventListener('ended',()=>{if(settings.track==='auto'||settings.repeat==='one')return;if(settings.repeat==='off'&&(settings.shuffle?(shuffleReady&&!bag.length&&!forward.length):MUSIC_CATALOG.at(-1)?.id===TRACKS[current]?.id)){settings.music=false;persist();return;}nextTrack(1);});
globalThis.document?.addEventListener('visibilitychange',sync);
function resetShuffle(){bag=MUSIC_CATALOG.filter(t=>t.id!==TRACKS[current]?.id).map(t=>t.id);shuffleReady=true;}
function nextTrack(direction){
 const list=MUSIC_CATALOG,now=TRACKS[current]?.id,at=list.findIndex(t=>t.id===now);let id;
 if(settings.shuffle){
  if(direction<0){id=history.pop()||list[(at-1+list.length)%list.length].id;if(now)forward.push(now);}
  else {if(forward.length)id=forward.pop();else{if(!shuffleReady||!bag.length)resetShuffle();bag=bag.filter(x=>x!==now);const bytes=new Uint32Array(1);globalThis.crypto?.getRandomValues(bytes);id=bag.splice(bytes[0]%bag.length,1)[0];}if(now)history.push(now);}
 }else id=list[(at+direction+list.length)%list.length].id;
 history=history.slice(-300);settings.track=id;settings.music=true;lastFailed='';persist();sync();
}


export function unlockAudio(){
 unlocked=true;try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=settings.sfxVolume;const limiter=context.createDynamicsCompressor();master.connect(limiter);limiter.connect(context.destination);noise=context.createBuffer(1,Math.floor(context.sampleRate*.5),context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 if(context.state==='suspended')context.resume().catch(()=>{});}catch{}sync();
}
export function setAudioScene(next){if(next!==scene){scene=next;sync();}}
export function audioAction(key,value){
 if(key==='filter'){category=GROUPS[value]?value:'all';return;}if(key==='search'){query=String(value||'').slice(0,80);return;}
 if(key==='next'||key==='previous'){nextTrack(key==='next'?1:-1);return;}
 if(key==='seek'){if(Number.isFinite(player.duration)&&player.duration>0)player.currentTime=Math.max(0,Math.min(player.duration,Number(value)||0));return;}
 if(key==='repeat')settings.repeat=({all:'one',one:'off',off:'all'})[settings.repeat]||'all';
 if(key==='shuffle'){settings.shuffle=!settings.shuffle;history=[];forward=[];resetShuffle();}
 if(key==='music'||key==='sfx')settings[key]=!settings[key];
 if(key==='volume'||key==='sfxVolume')settings[key]=Math.max(0,Math.min(1,Number(value)||0));
 if(master)master.gain.value=settings.sfx?settings.sfxVolume:0;
 if(key==='track'&&(value==='auto'||TRACKS[value])){const now=TRACKS[current]?.id;if(settings.shuffle&&now&&now!==TRACKS[value]?.id)history.push(now);forward=[];settings.track=value;settings.music=true;shuffleReady=false;}
 if(key==='retry'){lastFailed='';pending=false;player.load?.();settings.music=true;}
 error='';lastFailed='';persist();sync();if(settings.shuffle&&!shuffleReady)resetShuffle();
}
// 소리별 간격을 분리해 공격음이 피격·획득·성장 소리를 막지 않는다.
export const SOUND_GAPS=Object.freeze({tap:65,good:150,bad:150,hit:65,hurt:240,bolt:180,crescent:350,tarot:400,aura:600,gem:100,moon:160,death:180,level:600,boss:1200,cook:120,farm:120,bond:250});
function tone(f0,f1,dur,vol=.14,delay=0,type='sine'){
 if(voices.size>=28)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(o);};o.start(t);o.stop(t+dur+.025);
}
function burst(dur=.12,vol=.12,freq=1600){if(voices.size>=28)return;const s=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain(),t=context.currentTime;s.buffer=noise;f.type='lowpass';f.frequency.setValueAtTime(freq,t);f.frequency.exponentialRampToValueAtTime(100,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(master);voices.add(s);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();voices.delete(s);};s.start(t);s.stop(t+dur);}
export function sound(kind='tap'){
 if(!settings.sfx||!context||context.state!=='running'||document.hidden)return;
 const now=performance.now();if(now-(lastSounds.get(kind)??-Infinity)<(SOUND_GAPS[kind]||140))return;lastSounds.set(kind,now);
 switch(kind){
 case 'bolt':tone(950,330,.10,.08,0,'triangle');burst(.05,.04,3000);break;
 case 'crescent':burst(.20,.09,2200);tone(400,900,.15,.07);break;
 case 'tarot':burst(.28,.16,800);tone(90,38,.24,.14,0,'triangle');break;
 case 'aura':tone(190,310,.24,.04);break;
 case 'hit':tone(250,100,.055,.10,0,'triangle');break;
 case 'hurt':tone(170,65,.22,.19,0,'sawtooth');burst(.15,.12,700);break;
 case 'death':burst(.13,.08,1100);break;
 case 'gem':tone(1180,1550,.075,.06);break;
 case 'moon':tone(880,1320,.13,.13);tone(1760,1760,.14,.08,.08);break;
 case 'boss':tone(75,48,.8,.16,0,'triangle');tone(110,72,.6,.09,.18);break;
 case 'bad':tone(240,150,.18,.13);break;
 case 'tap':tone(580,740,.06,.08);break;
 default:{const notes=kind==='level'||kind==='chest'?[523,659,784,1047]:kind==='cook'?[480,610,880]:kind==='farm'?[440,660,880]:[659,784,988];notes.forEach((f,i)=>tone(f,f,.16,.11,i*.07,'triangle'));}
 }
}
export function audioStatus(){return {music:settings.music,sfx:settings.sfx,unlocked,scene,current,playing:!player.paused,contextState:context?.state||'locked',voices:voices.size,error,volume:settings.volume,track:settings.track,repeat:settings.repeat,shuffle:settings.shuffle,time:player.currentTime||0,duration:player.duration||0};}
export function audioQuickButton(){return btn({action:'audio.change',args:{key:'music'},cls:'ghost audio-quick',title:'배경음악 켜기/끄기',label:settings.music?'음악 켜짐':'음악 꺼짐'});}
const stamp=n=>{const t=Math.max(0,Math.floor(n||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
export function audioSheet(){
 const track=TRACKS[current]||TRACKS[selected()]||TRACKS.cafe,duration=Number.isFinite(player.duration)?player.duration:0,time=player.currentTime||0;
 const rows=MUSIC_CATALOG.filter(t=>(category==='all'||t.artist===category)&&(!query||(t.name+' '+t.artistName).toLowerCase().includes(query.toLowerCase())));
 const button=(key,label,value,cls='')=>btn({action:'audio.change',args:{key,...(value==null?{}:{value})},label,cls});
 return `<section class="music-room"><h2>달빛 음악실${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p class="music-tagline">꽃향기와 함께 듣는 Code Destiny · ${MUSIC_CATALOG.length}곡</p>
 <section class="music-now" aria-label="현재 곡"><div class="music-cover">${track.cover?`<img src="${esc(track.cover)}" alt="${esc(track.artistName)} 앨범 표지" loading="lazy" referrerpolicy="no-referrer">`:'<span aria-label="표지 없는 명상 앨범">☾</span>'}</div><div><small>${esc(track.artistName)}</small><h3>${esc(track.name)}</h3><p role="status">${error||(!unlocked?'재생 버튼을 눌러 음악을 시작하세요':pending?'연결 중…':!settings.music?'일시정지':player.paused?'재생 준비 중':'재생 중')}${settings.track==='auto'?' · 장면 자동 선곡':''}</p></div></section>
 <div class="music-transport">${button('previous','이전 곡')}${button('music',settings.music&&unlocked?'일시정지':'재생',null,'primary')}${button('next','다음 곡')}</div>
 <label class="music-seek">곡 탐색 <input type="range" data-audio-input="seek" min="0" max="${duration||1}" step="1" value="${Math.floor(time)}" ${duration?'':'disabled'} aria-label="현재 곡 재생 위치"><span>${stamp(time)} / ${stamp(duration)}</span></label>
 <div class="music-options">${button('repeat',settings.repeat==='one'?'한 곡 반복':settings.repeat==='off'?'반복 끔':'전체 반복')}${button('shuffle',settings.shuffle?'셔플 켜짐':'셔플 꺼짐')}${button('track','장면 자동','auto',settings.track==='auto'?'on':'')}</div>
 <label class="music-volume">음악 음량 <input type="range" data-audio-input="volume" min="0" max="1" step=".05" value="${settings.volume}" aria-label="음악 음량"><span>${Math.round(settings.volume*100)}%</span></label>
 ${error?button('retry','다시 연결'):''}<div class="music-library"><label>곡 찾기 <input type="search" data-audio-input="search" value="${esc(query)}" placeholder="제목 또는 아티스트"></label><nav class="music-filters" aria-label="앨범 분류">${Object.entries(GROUPS).map(([id,name])=>button('filter',name,id,category===id?'on':'')).join('')}</nav><p class="small">${rows.length}곡 · 네오 솔로곡 제외</p><ol class="music-tracks">${rows.map(t=>`<li data-key="${t.id}"><button data-action="audio.change" data-key="track" data-value="${t.id}" aria-pressed="${track.id===t.id}"><span class="music-row-mark" aria-hidden="true">${track.id===t.id&&settings.music?'♫':'♪'}</span><span><b>${esc(t.name)}</b><small>${esc(t.artistName)}</small></span>${track.id===t.id?'<em>선택</em>':''}</button></li>`).join('')}</ol></div>
 <details class="music-sfx"><summary>효과음 설정</summary>${button('sfx',settings.sfx?'효과음 켜짐':'효과음 꺼짐')}<label>효과음 음량<input type="range" data-audio-input="sfxVolume" min="0" max="1" step=".05" value="${settings.sfxVolume}" aria-label="효과음 음량"></label></details><p class="small music-note">공식 공개 스트리밍 · 선택한 음악은 창을 닫아도 한 플레이어에서 이어집니다. 네트워크 오류는 게임 진행에 영향을 주지 않아요.</p></section>`;
}
globalThis.document?.addEventListener('change',e=>{const key=e.target?.dataset?.audioInput;if(key)audioAction(key,e.target.value);});
globalThis.document?.addEventListener('input',e=>{if(e.target?.dataset?.audioInput==='search')audioAction('search',e.target.value);});
globalThis.document?.addEventListener('error',e=>{if(e.target?.matches?.('.music-cover img')){e.target.hidden=true;e.target.parentElement.setAttribute('aria-label','앨범 표지를 불러오지 못했어요');}},true);
