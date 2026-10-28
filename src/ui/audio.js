// Code Destiny 공개 스트리밍. 음원 다운로드·결제 권한 부여는 하지 않는다.
import {btn,esc} from './dom.js';
import {MUSIC_CATALOG} from '../data/music-catalog.js';
const aliases={cafe:'DestinyCafe/Kindness.mp3',dream:'DestinyWar/Dream.mp3',strategy:'DestinyWar/Moonlit Strategy Map.mp3',battle:'DestinyWar/The war.mp3',lion:'DestinyWar/White Lion.mp3',boss:'DestinyWar/The Moonlit War Room.mp3',tea:'DestinyCafe/Moonlit Tea House.mp3',opening:'DEST1NOVA/달빛 운명여행 main title.mp3'};
export const TRACKS=Object.fromEntries([...MUSIC_CATALOG.map(t=>[t.id,t]),...Object.entries(aliases).map(([id,key])=>[id,MUSIC_CATALOG.find(t=>t.source===key)])]);
const GROUPS={all:'전체',dest1nova:'DEST1NOVA',yeoni:'연이',lunabloom:'Luna bloom',destinycafe:'운명의 찻집',meditation:'명상'};
export const CAFE_PLAYLIST=Object.freeze(['destinycafe-06','destinycafe-05','destinycafe-03','destinycafe-02','destinycafe-04','meditation-04','meditation-01','meditation-09']);
let cafeIndex=0;
const huntScene=()=>scene.startsWith('hunt');
const activeTrack=()=>scene==='outfits'?'auto':huntScene()?(settings.huntTrack||'auto'):settings.track;
const selectTrack=id=>{if(huntScene())settings.huntTrack=id;else settings.track=id;};
const cafeScene=()=>trackForScene(scene)==='cafe';
let category='all',query='',bag=[],history=[],forward=[],shuffleReady=false,lastFailed='',playGeneration=0;
const KEY='yeoni-atelier.audio.v1';
let settings={music:false,sfx:true,volume:.35,sfxVolume:.75,track:'auto',repeat:'all',shuffle:false,shiftMusic:true};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
settings.volume=Math.max(0,Math.min(1,Number.isFinite(Number(settings.volume))?Number(settings.volume):.35));
const player=typeof Audio!=='undefined'?new Audio():{pause(){},addEventListener(){}};player.preload='none';player.loop=false;
let context, master, verb, noise, unlocked=false, scene='title', current='', error='', pending=false, storyTrack=null;
const lastSounds=new Map(), voices=new Set();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
export function trackForScene(scene){return ({title:'tea',hunt:'battle',huntDeep:'lion',huntBoss:'boss',huntResult:'dream',huntPrep:'strategy',farm:'dream',story:'dream',outfits:'lion',fever:'opening'}[scene]||'cafe');}
function selected(){return activeTrack()==='auto'?(cafeScene()?CAFE_PLAYLIST[cafeIndex]:scene==='story'&&storyTrack?storyTrack:trackForScene(scene)):activeTrack();}
export function setStoryAudio(track){const next=TRACKS[track]?track:null;if(storyTrack!==next){storyTrack=next;sync();}}
function sync(){
 if(!settings.music||!unlocked||document.hidden){player.pause();pending=false;playGeneration++;return;}
 const id=TRACKS[selected()]?selected():'cafe';
 if(current!==id){player.pause();player.src=TRACKS[id].url;current=id;error='';pending=false;lastFailed='';playGeneration++;}
 player.loop=activeTrack()==='auto'?!cafeScene():settings.repeat==='one';
 if(lastFailed===current)return;
 player.volume=settings.volume*(scene==='story'?.6:1);
 if(player.paused&&!pending){pending=true;const request=++playGeneration;player.play().then(()=>{if(request===playGeneration)pending=false;}).catch(e=>{if(request===playGeneration){pending=false;if(e.name!=='AbortError'){error='음악 연결을 확인하고 다시 재생해 주세요.';lastFailed=current;}}});}
}
player.addEventListener('error',()=>{pending=false;lastFailed=current;error='음악 연결을 확인해 주세요. 게임은 계속할 수 있어요.';});
player.addEventListener('ended',()=>{if(activeTrack()==='auto'){if(cafeScene()){cafeIndex=(cafeIndex+1)%CAFE_PLAYLIST.length;sync();}return;}if(settings.repeat==='one')return;if(settings.repeat==='off'&&(settings.shuffle?(shuffleReady&&!bag.length&&!forward.length):MUSIC_CATALOG.at(-1)?.id===TRACKS[current]?.id)){settings.music=false;persist();return;}nextTrack(1);});
globalThis.document?.addEventListener('visibilitychange',sync);
function resetShuffle(){bag=MUSIC_CATALOG.filter(t=>t.id!==TRACKS[current]?.id).map(t=>t.id);shuffleReady=true;}
function nextTrack(direction){
 if(activeTrack()==='auto'&&cafeScene()){cafeIndex=(cafeIndex+direction+CAFE_PLAYLIST.length)%CAFE_PLAYLIST.length;settings.music=true;persist();sync();return;}
 const list=MUSIC_CATALOG,now=TRACKS[current]?.id,at=list.findIndex(t=>t.id===now);let id;
 if(settings.shuffle){
  if(direction<0){id=history.pop()||list[(at-1+list.length)%list.length].id;if(now)forward.push(now);}
  else {if(forward.length)id=forward.pop();else{if(!shuffleReady||!bag.length)resetShuffle();bag=bag.filter(x=>x!==now);const bytes=new Uint32Array(1);globalThis.crypto?.getRandomValues(bytes);id=bag.splice(bytes[0]%bag.length,1)[0];}if(now)history.push(now);}
 }else id=list[(at+direction+list.length)%list.length].id;
 history=history.slice(-300);selectTrack(id);settings.music=true;lastFailed='';persist();sync();
}


export function unlockAudio(){
 unlocked=true;try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=settings.sfxVolume;const limiter=context.createDynamicsCompressor(),soften=context.createBiquadFilter();soften.type='lowpass';soften.frequency.value=9000;master.connect(soften);soften.connect(limiter);limiter.connect(context.destination);
  // 작은 찻집 잔향: 녹음 샘플 없이 감쇠 노이즈로 만든 임펄스라 저작권 걱정이 없다.
  const room=context.createConvolver(),len=Math.floor(context.sampleRate*1.4),ir=context.createBuffer(2,len,context.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}room.buffer=ir;verb=context.createGain();verb.gain.value=.26;verb.connect(room);room.connect(master);noise=context.createBuffer(1,Math.floor(context.sampleRate*.5),context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 if(context.state==='suspended')context.resume().catch(()=>{});}catch{}sync();
}
export function setAudioScene(next){if(next!==scene){scene=next;sync();}}
// 영업 시작 버튼을 누른 순간(사용자 입력 안) 카페 순서 재생을 Moonlight Tea부터 튼다. 🎵 토글로 끄면 다음 영업에도 켜지지 않는다.
export const SHIFT_FIRST_TRACK=CAFE_PLAYLIST[0];
export function startShiftMusic(){
 if(!settings.shiftMusic)return false;
 const fresh=!(settings.music&&current===SHIFT_FIRST_TRACK&&!player.paused);
 if(fresh){settings.track='auto';cafeIndex=0;lastFailed='';}
 settings.music=true;persist();sync();return true;
}
export function audioAction(key,value){
 if(key==='filter'){category=GROUPS[value]?value:'all';return;}if(key==='search'){query=String(value||'').slice(0,80);return;}
 if(key==='next'||key==='previous'){nextTrack(key==='next'?1:-1);return;}
 if(key==='seek'){if(Number.isFinite(player.duration)&&player.duration>0)player.currentTime=Math.max(0,Math.min(player.duration,Number(value)||0));return;}
 if(key==='repeat')settings.repeat=({all:'one',one:'off',off:'all'})[settings.repeat]||'all';
 if(key==='shuffle'){settings.shuffle=!settings.shuffle;history=[];forward=[];resetShuffle();}
 if(key==='music'||key==='sfx')settings[key]=!settings[key];
 if(key==='shiftMusic'){const v=value??(settings.shiftMusic&&settings.music?'off':'play');settings.shiftMusic=v!=='off';if(v!=='on')settings.music=v==='play';} // on: 다음 영업부터, play: 지금도 재생, off: 끔
 if(key==='volume'||key==='sfxVolume')settings[key]=Math.max(0,Math.min(1,Number(value)||0));
 if(master)master.gain.value=settings.sfx?settings.sfxVolume:0;
 if(key==='track'&&(value==='auto'||TRACKS[value])){const now=TRACKS[current]?.id;if(settings.shuffle&&now&&now!==TRACKS[value]?.id)history.push(now);forward=[];selectTrack(value);settings.music=true;shuffleReady=false;}
 if(key==='retry'){lastFailed='';pending=false;player.load?.();settings.music=true;}
 error='';lastFailed='';persist();sync();if(settings.shuffle&&!shuffleReady)resetShuffle();
}
// 소리별 간격을 분리해 공격음이 피격·획득·성장 소리를 막지 않는다.
export const SOUND_GAPS=Object.freeze({tap:65,good:150,bad:150,coin:110,open:1500,close:1500,hit:65,hurt:240,bolt:180,crescent:350,tarot:400,aura:600,gem:100,moon:160,death:180,level:600,boss:1200,cook:120,farm:120,bond:250});
function tone(f0,f1,dur,vol=.14,delay=0,type='sine'){
 if(voices.size>=28)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(o);};o.start(t);o.stop(t+dur+.025);
}
// 오르골·찻잔 같은 맑은 종소리: 사인 배음이 서로 다른 속도로 사라지고, 잔향으로 살짝 번진다.
function bell(f,dur=.5,vol=.05,delay=0,partials=[[1,1],[2.01,.3],[3.02,.1]],wet=true){
 if(voices.size>=24)return;const t=context.currentTime+delay,out=context.createGain();out.connect(master);if(wet)out.connect(verb);let left=partials.length;
 partials.forEach(([m,a],i)=>{const o=context.createOscillator(),g=context.createGain(),d=dur/(1+i*.7);o.type='sine';o.frequency.setValueAtTime(f*m,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*a,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out);voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(o);if(!--left)out.disconnect();};o.start(t);o.stop(t+d+.03);});
}
const CLINK=[[1,1],[1.48,.45],[2.37,.28],[3.6,.12]],COIN=[[1,1],[2.76,.22]];
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
 case 'hurt':tone(170,85,.18,.10,0,'triangle');burst(.12,.065,700);break;
 case 'death':burst(.13,.08,1100);break;
 case 'gem':bell(1760,.16,.035,0,[[1,1],[2,.2]],false);break;
 case 'moon':bell(1318.5,.45,.06);bell(1760,.55,.04,.08);break;
 case 'boss':tone(75,48,.8,.16,0,'triangle');tone(110,72,.6,.09,.18);break;
 case 'bad':tone(392,262,.16,.05);tone(311,208,.2,.035,.05);break;
 case 'tap':tone(1250,720,.04,.032);burst(.025,.01,5200);break;
 case 'cook':bell(2093,.38,.03,0,CLINK);bell(2637,.3,.018,.055,CLINK);burst(.035,.008,6000);break;
 case 'coin':bell(1568,.22,.04,0,COIN);bell(2093,.42,.045,.07,COIN);break;
 case 'bond':[1046.5,1318.5,1568,2093].forEach((f,i)=>bell(f,.7,.04,i*.09));break;
 case 'good':bell(1318.5,.5,.045);bell(1975.5,.65,.032,.07);break;
 case 'farm':burst(.1,.025,1500);bell(880,.4,.035,.05);break;
 case 'open':[2349,1976,1568,1318.5,1174.7].forEach((f,i)=>bell(f,1.1,.028,i*.07));break;
 case 'close':bell(784,.8,.04);bell(523.3,1.1,.04,.18);break;
 default:{const notes=kind==='level'||kind==='chest'?[784,988,1175,1568]:[1318.5,1568,1975.5];notes.forEach((f,i)=>bell(f,.6,.05,i*.07));bell(3136,.5,.015,notes.length*.07);}
 }
}
export function audioStatus(){return {music:settings.music,shiftMusic:settings.shiftMusic,sfx:settings.sfx,unlocked,scene,current,playing:!player.paused,contextState:context?.state||'locked',voices:voices.size,error,volume:settings.volume,track:activeTrack(),cafeTrack:settings.track,repeat:settings.repeat,shuffle:settings.shuffle,time:player.currentTime||0,duration:player.duration||0};}
export function audioQuickButton(){return btn({action:'audio.change',args:{key:'music'},cls:'ghost audio-quick',title:'배경음악 켜기/끄기',label:settings.music?'음악 켜짐':'음악 꺼짐'});}
const stamp=n=>{const t=Math.max(0,Math.floor(n||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
export function audioSheet(){
 const track=TRACKS[current]||TRACKS[selected()]||TRACKS.cafe,duration=Number.isFinite(player.duration)?player.duration:0,time=player.currentTime||0;
 const rows=MUSIC_CATALOG.filter(t=>(category==='all'||t.artist===category)&&(!query||(t.name+' '+t.artistName).toLowerCase().includes(query.toLowerCase())));
 const button=(key,label,value,cls='')=>btn({action:'audio.change',args:{key,...(value==null?{}:{value})},label,cls});
 return `<section class="music-room"><h2>달빛 음악실${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p class="music-tagline">꽃향기와 함께 듣는 Code Destiny · ${MUSIC_CATALOG.length}곡</p>
 <section class="music-now" aria-label="현재 곡"><div class="music-cover">${track.cover?`<img src="${esc(track.cover)}" alt="${esc(track.artistName)} 앨범 표지" loading="lazy" referrerpolicy="no-referrer">`:'<span aria-label="표지 없는 명상 앨범">☾</span>'}</div><div><small>${esc(track.artistName)}</small><h3>${esc(track.name)}</h3><p role="status">${error||(!unlocked?'재생 버튼을 눌러 음악을 시작하세요':pending?'연결 중…':!settings.music?'일시정지':player.paused?'재생 준비 중':'재생 중')}${activeTrack()==='auto'?' · '+(cafeScene()?'카페 순서 재생 '+(cafeIndex+1)+'/'+CAFE_PLAYLIST.length:'장면 자동 선곡'):''}</p></div></section>
 <div class="music-transport">${button('previous','이전 곡')}${button('music',settings.music&&unlocked?'일시정지':'재생',null,'primary')}${button('next','다음 곡')}</div>
 <label class="music-seek">곡 탐색 <input type="range" data-audio-input="seek" min="0" max="${duration||1}" step="1" value="${Math.floor(time)}" ${duration?'':'disabled'} aria-label="현재 곡 재생 위치"><span>${stamp(time)} / ${stamp(duration)}</span></label>
 <div class="music-options">${button('repeat',settings.repeat==='one'?'한 곡 반복':settings.repeat==='off'?'반복 끔':'전체 반복')}${button('shuffle',settings.shuffle?'셔플 켜짐':'셔플 꺼짐')}${button('track',huntScene()?'사냥 장면 자동 선곡':'카페 순서 재생 · 장면 자동','auto',activeTrack()==='auto'?'on':'')}</div>
 <label class="music-volume">음악 음량 <input type="range" data-audio-input="volume" min="0" max="1" step=".05" value="${settings.volume}" aria-label="음악 음량"><span>${Math.round(settings.volume*100)}%</span></label>
 ${error?button('retry','다시 연결'):''}<div class="music-library"><label>곡 찾기 <input type="search" data-audio-input="search" value="${esc(query)}" placeholder="제목 또는 아티스트"></label><nav class="music-filters" aria-label="앨범 분류">${Object.entries(GROUPS).map(([id,name])=>button('filter',name,id,category===id?'on':'')).join('')}</nav><p class="small">${rows.length}곡 · 네오 솔로곡 제외</p><ol class="music-tracks">${rows.map(t=>`<li data-key="${t.id}"><button data-action="audio.change" data-key="track" data-value="${t.id}" aria-pressed="${track.id===t.id}"><span class="music-row-mark" aria-hidden="true">${track.id===t.id&&settings.music?'♫':'♪'}</span><span><b>${esc(t.name)}</b><small>${esc(t.artistName)}</small></span>${track.id===t.id?'<em>선택</em>':''}</button></li>`).join('')}</ol></div>
 <details class="music-sfx"><summary>효과음 설정</summary>${button('sfx',settings.sfx?'효과음 켜짐':'효과음 꺼짐')}<label>효과음 음량<input type="range" data-audio-input="sfxVolume" min="0" max="1" step=".05" value="${settings.sfxVolume}" aria-label="효과음 음량"></label></details><p class="small music-note">공식 공개 스트리밍 · 선택한 음악은 창을 닫아도 한 플레이어에서 이어집니다. 네트워크 오류는 게임 진행에 영향을 주지 않아요.</p></section>`;
}
globalThis.document?.addEventListener('change',e=>{const key=e.target?.dataset?.audioInput;if(key)audioAction(key,e.target.value);});
globalThis.document?.addEventListener('input',e=>{if(e.target?.dataset?.audioInput==='search')audioAction('search',e.target.value);});
globalThis.document?.addEventListener('error',e=>{if(e.target?.matches?.('.music-cover img')){e.target.hidden=true;e.target.parentElement.setAttribute('aria-label','앨범 표지를 불러오지 못했어요');}},true);
