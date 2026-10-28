import {imageFor} from '../render/assets.js';
import {sound} from './audio.js';
export function showHelpFeedback({quality='wrong',tableNo,gain=0,hint}){
 document.querySelector('.help-feedback')?.remove();
 const good=quality==='good',okay=quality==='okay',missed=quality==='missed';
 const name=good||okay?'꽃돼지 연이':'영냥이';
 const title=good?'도움 성공!':okay?'차분하게 이어 갔어요':missed?'앗, 조금 늦었네!':'다음엔 더 잘할 수 있어!';
 const text=good?'덕분에 손님이 편안해졌어. 고마워!':okay?'괜찮아. 손님 이야기를 조금 더 들어 보자.':missed?'SOS가 반짝이면 먼저 살펴봐. 다음엔 같이 맞춰 보자.':hint?`흠, 다음엔 “${hint}” 해 보자.`:'손님의 마음부터 살펴보자. 내가 옆에서 도울게.';
 const el=document.createElement('aside');el.className=`help-feedback ${quality}`;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 // 분할 반응 시트의 주변 조각 대신 독립 전신 원본을 contain으로 표시한다.
 const img=missed?imageFor('reactions/missed'):imageFor(`portraits/${good||okay?'yeoni_pig':'neo_cat'}`);
 if(img){const image=new Image();image.src=img.src;image.alt=name;el.append(image);}
 const copy=document.createElement('div'),b=document.createElement('b'),p=document.createElement('p'),small=document.createElement('small');b.textContent=`${tableNo}번 · ${title}`;p.textContent=text;small.textContent=`${name} · 대화 ${gain>0?'+':''}${gain}`;copy.append(b,p,small);el.append(copy);document.body.append(el);sound(good?'bond':okay?'tap':'bad');setTimeout(()=>el.remove(),2600);
}
