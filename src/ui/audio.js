// Code Destiny 공개 스트리밍. 음원 다운로드·결제 권한 부여는 하지 않는다.
import {btn,esc} from './dom.js';
const url=p=>'https://music.code-destiny.com/'+p.split('/').map(encodeURIComponent).join('/');
export const TRACKS={
 cafe:{name:'운명의 찻집 · Kindness',url:url('DestinyCafe/Kindness.mp3')},
 dream:{name:'Dream',url:url('DestinyWar/Dream.mp3')},
 strategy:{name:'네오의 밤 · Moonlit Strategy Map',url:url('DestinyWar/Moonlit Strategy Map.mp3')},
 battle:{name:'The war',url:url('DestinyWar/The war.mp3')},
 lion:{name:'White Lion',url:url('DestinyWar/White Lion.mp3')},
 boss:{name:'The Moonlit War Room',url:url('DestinyWar/The Moonlit War Room.mp3')},
 tea:{name:'Moonlit Tea House',url:url('DestinyCafe/Moonlit Tea House.mp3')},
 opening:{name:'달빛 운명여행',url:url('DEST1NOVA/달빛 운명여행 main title.mp3')},
};
const KEY='yeoni-atelier.audio.v1';
let settings={music:true,sfx:true,volume:.35,sfxVolume:.75,track:'auto'};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
settings.volume=Math.max(0,Math.min(1,Number.isFinite(Number(settings.volume))?Number(settings.volume):.35));
const player=typeof Audio!=='undefined'?new Audio():{pause(){},addEventListener(){}};player.preload='none';player.loop=true;
let context, master, noise, unlocked=false, scene='title', current='', error='', pending=false, storyTrack=null;
const lastSounds=new Map(), voices=new Set();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
export function trackForScene(scene){return ({title:'tea',hunt:'battle',huntDeep:'lion',huntBoss:'boss',huntResult:'dream',huntPrep:'strategy',farm:'dream',story:'dream',outfits:'opening',fever:'opening'}[scene]||'cafe');}
function selected(){return settings.track==='auto'?(scene==='story'&&storyTrack?storyTrack:trackForScene(scene)):settings.track;}
export function setStoryAudio(track){const next=TRACKS[track]?track:null;if(storyTrack!==next){storyTrack=next;sync();}}
function sync(){
 if(!settings.music||!unlocked||document.hidden){player.pause();return;}
 const id=TRACKS[selected()]?selected():'cafe';
 if(current!==id){player.pause();player.src=TRACKS[id].url;current=id;error='';pending=false;}
 player.volume=settings.volume*(scene==='story'?.6:1);
 if(player.paused&&!pending){pending=true;const wanted=current;player.play().then(()=>{if(current===wanted)pending=false;}).catch(e=>{if(current===wanted){pending=false;if(e.name!=='AbortError')error='음악 연결을 확인하고 다시 재생해 주세요.';}});}
}
player.addEventListener('error',()=>{error='음악 연결을 확인해 주세요. 게임은 계속할 수 있어요.';});
globalThis.document?.addEventListener('visibilitychange',sync);
export function unlockAudio(){
 unlocked=true;try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=settings.sfxVolume;const limiter=context.createDynamicsCompressor();master.connect(limiter);limiter.connect(context.destination);noise=context.createBuffer(1,Math.floor(context.sampleRate*.5),context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 if(context.state==='suspended')context.resume().catch(()=>{});}catch{}sync();
}
export function setAudioScene(next){if(next!==scene){scene=next;sync();}}
export function audioAction(key,value){if(key==='music'||key==='sfx')settings[key]=!settings[key];if(key==='volume'||key==='sfxVolume')settings[key]=Math.max(0,Math.min(1,Number(value)||0));if(master)master.gain.value=settings.sfx?settings.sfxVolume:0;if(key==='track'&&(value==='auto'||TRACKS[value]))settings.track=value;error='';persist();sync();}
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
export function audioStatus(){return {music:settings.music,sfx:settings.sfx,unlocked,scene,current,playing:!player.paused,contextState:context?.state||'locked',voices:voices.size,error};}
export function audioQuickButton(){return btn({action:'audio.change',args:{key:'music'},cls:'ghost audio-quick',title:'배경음악 켜기/끄기',label:settings.music?'음악 켜짐':'음악 꺼짐'});}
export function audioSheet(){return `<h2>달빛 음악실${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p>Code Destiny OST가 장면에 맞춰 흘러요. 첫 조작 후 재생되며 이전에 끈 설정은 유지해요.</p><div class="grid2">${btn({action:'audio.change',args:{key:'music'},cls:settings.music?'on':'',label:settings.music?'배경음악 켜짐':'배경음악 켜기'})}${btn({action:'audio.change',args:{key:'sfx'},cls:settings.sfx?'on':'',label:settings.sfx?'효과음 켜짐':'효과음 꺼짐'})}</div><h3>소리 크기</h3><div class="btns">${[.15,.3,.5,.75].map(v=>btn({action:'audio.change',args:{key:'volume',value:v},cls:settings.volume===v?'on':'',label:`${v*100}%`})).join('')}</div><h3>효과음 크기</h3><div class="btns">${[.25,.5,.75,1].map(v=>btn({action:'audio.change',args:{key:'sfxVolume',value:v},cls:settings.sfxVolume===v?'on':'',label:`${v*100}%`})).join('')}</div><h3>선곡</h3><div class="stack">${Object.entries({auto:{name:'장면에 맞춰 자동 선곡'},...TRACKS}).map(([id,d])=>btn({action:'audio.change',args:{key:'track',value:id},cls:settings.track===id?'on':'',label:esc(d.name)})).join('')}</div>${error?`<p role="status">${error}</p>`:''}<p class="small muted">온라인 스트리밍 · 음원 연결이 없어도 게임 진행에는 영향이 없어요.</p>`;}
