// 10-29 달빛 운세 수첩 계산. 게임 상태를 읽거나 바꾸지 않고, 날짜만으로 결정되는 값만 낸다.
// 무작위 점수를 만들지 않는다. 타로 한 장만 날짜(와 생일)로 고정해 뽑는다.
import {TAROT,SIGNS,STEMS,BRANCHES,ELEMENTS,DAY_RELATIONS,BRANCH_RELATIONS} from '../data/fortune.js';

// 그레고리력 율리우스 적일(정오 기준 정수)
export function julianDay(y,m,d){const a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;}

// 일주: 60갑자 순환. 1949-10-01 = 甲子일을 기준으로 맞춘다
export function dayPillar(y,m,d){const i=(julianDay(y,m,d)+49)%60,s=i%10,b=i%12;return {index:i,stem:s,branch:b,hanja:STEMS[s][0]+BRANCHES[b][0],hangul:STEMS[s][1]+BRANCHES[b][1],element:STEMS[s][2]};}

// 띠: 입춘(대개 2월 4일) 전 생일은 앞 해 띠. 2월 3~5일은 해마다 입춘 시각이 달라 확인이 필요하다
export function zodiacYear(y,m,d){const before=m<2||(m===2&&d<4),yy=before?y-1:y,b=((yy-4)%12+12)%12;return {branch:b,animal:BRANCHES[b][2],hanja:BRANCHES[b][0],edge:m===2&&d>=3&&d<=5};}

// 서양 별자리. 경계일 ±1일은 태어난 해·시각에 따라 바뀔 수 있다
export function sunSign(m,d){let k=0;for(let i=1;i<SIGNS.length;i++){const [fm,fd]=SIGNS[i].from;if(m>fm||(m===fm&&d>=fd))k=i;}if(m===12&&d>=22)k=0;const near=SIGNS.some(x=>x.from[0]===m&&Math.abs(x.from[1]-d)<=1);return {...SIGNS[k],index:k,edge:near};}

// 내 일간 오행(me)에 오늘 일간 오행(today)이 주는 관계. 목→화→토→금→수 상생, 목→토 상극
export function dayRelation(me,today){if(me===today)return 'same';if((today+1)%5===me)return 'support';if((me+1)%5===today)return 'output';if((me+2)%5===today)return 'wealth';return 'pressure';}

const HARMONY=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
export function branchRelation(mine,today){if(mine===today)return 'same';if(HARMONY.some(([a,b])=>(a===mine&&b===today)||(b===mine&&a===today)))return 'harmony';if(Math.abs(mine-today)===6)return 'clash';if(mine%4===today%4)return 'trine';return 'plain';}

// FNV-1a: 같은 날·같은 생일이면 언제 다시 열어도 같은 카드
function hash(text){let h=2166136261;for(const ch of text){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h;}
export function dailyCard(dateKey,birthKey=''){const [num,name,en,line]=TAROT[hash(`${dateKey}|${birthKey}`)%TAROT.length];return {num,name,en,line};}

export function parseDate(text){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text||'');if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3],t=new Date(Date.UTC(y,mo-1,d));return y>=1900&&y<=2100&&t.getUTCMonth()===mo-1&&t.getUTCDate()===d?{y,m:mo,d}:null;}
export const dateKey=({y,m,d})=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

// 오늘 읽기 한 벌. birth 가 없으면 타로와 오늘 일진만 낸다
export function readFortune(today,birth=null){
 const key=dateKey(today),day=dayPillar(today.y,today.m,today.d),card=dailyCard(key,birth?dateKey(birth):'');
 const out={dateKey:key,card,day:{...day,elementName:ELEMENTS[day.element].name,color:ELEMENTS[day.element].color}};
 if(!birth)return out;
 const mine=dayPillar(birth.y,birth.m,birth.d),zodiac=zodiacYear(birth.y,birth.m,birth.d),rel=dayRelation(mine.element,day.element),brel=branchRelation(zodiac.branch,day.branch);
 return {...out,birth:{pillar:mine,elementName:ELEMENTS[mine.element].name,relation:{id:rel,...DAY_RELATIONS[rel]},zodiac:{...zodiac,relation:{id:brel,...BRANCH_RELATIONS[brel]}},sign:sunSign(birth.m,birth.d)}};
}
