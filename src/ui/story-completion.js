// 스토리 UI의 상태 변경은 전달된 엔진 명령으로만 수행한다.
export function completeStory(id,send,{skip=false}={}){
 const result=send({type:'story.seen',id});
 if(result.ok&&!result.duplicate&&result.destination==='hunt'&&!skip){const entry=send({type:'hunt.start',depth:1,hunterId:'neo'});return {...result,entry};}
 return result;
}
