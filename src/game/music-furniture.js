import {validateLayout} from './space.js';
import {cafeLayout} from '../data/layout.js';
// 이전 저장에도 한 번만 추가한다. 기존 배치나 진행 중인 영업은 건드리지 않는다.
export function ensureRecordPlayer(state){
 if(state.mode!=='prep'||!state.interior||state.interior.furniture.some(f=>f.defId==='record_player'))return;
 const f={uid:'cafe-record-player',defId:'record_player',x:null,y:null,rot:0};
 const list=state.interior.furniture;
 for(const [x,y] of [[0,7],[0,3],[7,6],[3,10]]){
  f.x=x;f.y=y;if(validateLayout([...list,f],state.interior.areas||[],cafeLayout(state)).ok)break;
  f.x=null;f.y=null;
 }
 list.push(f);
 // 편집 중인 저장을 불러왔을 때 적용으로 사라지거나 중복되지 않게 한다.
 if(state.interior.draft&&!state.interior.draft.furniture.some(x=>x.defId==='record_player'))state.interior.draft.furniture.push({...f,x:null,y:null});
}
