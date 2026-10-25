// Code Destiny 공개 스트리밍. 음원 다운로드·결제 권한 부여는 하지 않는다.
import {btn,esc} from './dom.js';
const url=p=>'https://music.code-destiny.com/'+p.split('/').map(encodeURIComponent).join('/');
export const TRACKS={
 cafe:{name:'운명의 찻집 · Kindness',url:url('DestinyCafe/Kindness.mp3')},
 dream:{name:'Dream',url:url('DestinyWar/Dream.mp3')},
 strategy:{name:'네오의 밤 · Moonlit Strategy Map',url:url('DestinyWar/Moonlit Strategy Map.mp3')},
 opening:{name:'달빛 운명여행',url:url('DEST1NOVA/달빛 운명여행 main title.mp3')},
};
const KEY='yeoni-atelier.audio.v1';
let settings={music:false,sfx:true,volume:.3,track:'auto'};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
settings.volume=Math.max(0,Math.min(1,Number(settings.volume)||.3));
const player=typeof Audio!=='undefined'?new Audio():{pause(){},addEventListener(){}};player.preload='none';player.loop=true;
let context, unlocked=false, scene='title', current='', error='', lastSound=0;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
function selected(){return settings.track==='auto'?({title:'opening',hunt:'strategy',farm:'dream',story:'dream',outfits:'opening',fever:'opening'}[scene]||'cafe'):settings.track;}
function sync(){
 if(!settings.music||!unlocked||document.hidden){player.pause();return;}
 const id=TRACKS[selected()]?selected():'cafe';
 if(current!==id){player.pause();player.src=TRACKS[id].url;current=id;error='';}
 player.volume=settings.volume;
 if(player.paused)player.play().catch(()=>{error='음악을 재생하지 못했어요. 연결을 확인하고 다시 켜 주세요.';});
}
player.addEventListener('error',()=>{error='음악 연결을 확인해 주세요. 게임은 계속할 수 있어요.';});
globalThis.document?.addEventListener('visibilitychange',sync);
export function unlockAudio(){unlocked=true;try{context ||= new(window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume().catch(()=>{});}catch{} sync();}
export function setAudioScene(next){if(next!==scene){scene=next;sync();}}
export function audioAction(key,value){if(key==='music'||key==='sfx')settings[key]=!settings[key];if(key==='volume')settings.volume=Number(value);if(key==='track'&&(value==='auto'||TRACKS[value]))settings.track=value;error='';persist();sync();}
export function sound(kind='tap'){
 if(!settings.sfx||!context||document.hidden)return;const now=performance.now();if(now-lastSound<(kind==='hit'?140:60))return;lastSound=now;
 const tones={tap:[520,650],good:[660,880,1100],bad:[210,160],hit:[160,90],farm:[440,660,880],bond:[523,659,784],cook:[440,550],moon:[880,1320]};
 const notes=tones[kind]||tones.good, t=context.currentTime;
 notes.forEach((f,i)=>{const o=context.createOscillator(),g=context.createGain();o.type=kind==='hit'?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.055);g.gain.linearRampToValueAtTime(.04*settings.volume,t+i*.055+.008);g.gain.exponentialRampToValueAtTime(.0001,t+i*.055+.11);o.connect(g);g.connect(context.destination);o.start(t+i*.055);o.stop(t+i*.055+.13);});
}
export function audioSheet(){return `<h2>음악과 효과음${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><p>Code Destiny OST가 장면에 맞춰 흘러요. 음악은 직접 켠 뒤 재생됩니다.</p><div class="grid2">${btn({action:'audio.change',args:{key:'music'},cls:settings.music?'on':'',label:settings.music?'배경음악 켜짐':'배경음악 켜기'})}${btn({action:'audio.change',args:{key:'sfx'},cls:settings.sfx?'on':'',label:settings.sfx?'효과음 켜짐':'효과음 꺼짐'})}</div><h3>소리 크기</h3><div class="btns">${[.15,.3,.5,.75].map(v=>btn({action:'audio.change',args:{key:'volume',value:v},cls:settings.volume===v?'on':'',label:`${v*100}%`})).join('')}</div><h3>선곡</h3><div class="stack">${Object.entries({auto:{name:'장면에 맞춰 자동 선곡'},...TRACKS}).map(([id,d])=>btn({action:'audio.change',args:{key:'track',value:id},cls:settings.track===id?'on':'',label:esc(d.name)})).join('')}</div>${error?`<p role="status">${error}</p>`:''}<p class="small muted">온라인 스트리밍 · 음원 연결이 없어도 게임 진행에는 영향이 없어요.</p>`;}
