import {WEAPONS,PASSIVES,MAX_WEAPONS,WEAPON_MAX_LEVEL,PASSIVE_MAX_LEVEL} from '../data/kfp-weapons.js';
import {FUSION_RECIPES} from '../data/kfp-fusions.js';
export {WEAPONS as KFP_WEAPONS,PASSIVES as KFP_PASSIVES,FUSION_RECIPES};
export function normalizeKfp(h){
 if(h.hunterId!=='yeoni_pig')return null;
 // 초기 이식판에서 이미 얻은 기술과 남은 선택지는 그대로 작동한다. 새 선택지는 KFP만 제공한다.
 const legacy=!h.kfp&&((h.level||1)>1||Object.keys(h.passives||{}).length>0||(h.weapons||[]).some(w=>w.level>1||w.id!=='bolt')||(h.picks||[]).some(p=>p.some(o=>o.kind==='weapon'||o.kind==='passive')));
 const k=h.kfp??={weapons:[{id:'shotgun',level:1,evolved:false}],passives:{},consumed:[],revision:0,legacy};
 k.passives??={};k.consumed??=[];k.revision??=0;
 k.weapons??=[{id:'shotgun',level:1,evolved:false}];return k;
}
export function kfpOptions(h,ownedOnly=false){
 const k=normalizeKfp(h);if(!k)return [];
 const out=[];
 for(const w of k.weapons)if(w.level<WEAPON_MAX_LEVEL)out.push({kind:'kfpWeapon',id:w.id});
 if(!ownedOnly&&k.weapons.length<MAX_WEAPONS)for(const [id,d] of Object.entries(WEAPONS))if(!d.fusionOnly&&!k.consumed.includes(id)&&!k.weapons.some(w=>w.id===id))out.push({kind:'kfpWeapon',id});
 for(const id of Object.keys(PASSIVES))if((k.passives[id]||0)<PASSIVE_MAX_LEVEL&&(!ownedOnly||k.passives[id]))out.push({kind:'kfpPassive',id});
 return out;
}
// 원작처럼 Lv8 + 대응 패시브 보유 후 희귀 상자에서 진화한다.
export function kfpEvolutions(h){const k=normalizeKfp(h);return k?k.weapons.filter(w=>!w.evolved&&w.level>=8&&WEAPONS[w.id].evolve&&k.passives[WEAPONS[w.id].evolve.with]).map(w=>({kind:'kfpEvolve',id:w.id})):[];}
export function kfpDescribe(h,o){const k=normalizeKfp(h),d=o.kind==='kfpPassive'?PASSIVES[o.id]:WEAPONS[o.id],w=k.weapons.find(w=>w.id===o.id),lv=o.kind==='kfpPassive'?k.passives[o.id]||0:w?.level||0;
 if(o.kind==='kfpEvolve')return {name:d.evolve.name,icon:d.evolve.icon,text:d.evolve.desc,tag:'진화',evo:true};
 const condition=d.evolve?` · Lv8 + ${PASSIVES[d.evolve.with].name} → 희귀 상자에서 ${d.evolve.name}`:'';
 return {name:w?.evolved?d.evolve.name:d.name,icon:d.icon,text:(lv&&d.levels?d.levels[lv-1]?.t||d.desc:d.desc)+condition,tag:lv?`Lv ${lv} → ${lv+1}`:'새로 획득',cap:o.kind==='kfpPassive'?5:8};
}
export function applyKfpOption(h,o){const k=normalizeKfp(h);if(!k)return false;
 const legal=(o.kind==='kfpEvolve'?kfpEvolutions(h):kfpOptions(h)).some(x=>x.kind===o.kind&&x.id===o.id);if(!legal)return false;
 if(o.kind==='kfpPassive'){k.passives[o.id]=(k.passives[o.id]||0)+1;if(o.id==='heart'){h.maxHp+=20;h.hp+=20;}}
 else {let w=k.weapons.find(w=>w.id===o.id);if(o.kind==='kfpEvolve')w.evolved=true;else if(w)w.level++;else k.weapons.push({id:o.id,level:1,evolved:false});}
 k.revision++;return true;
}
export function kfpFusionPreview(h,id){const k=normalizeKfp(h),r=FUSION_RECIPES.find(r=>r.id===id);if(!k||!r)return {ok:false,reason:'조합을 찾을 수 없어요'};
 const inputs=r.inputs.map(i=>({...i,owned:k.weapons.find(w=>w.id===i.id)}));
 const missing=inputs.find(i=>!i.owned||i.owned.level<i.level||!i.owned.evolved);
 const reason=k.weapons.some(w=>w.id===r.output)?'이미 조합한 무기예요':missing?`${WEAPONS[missing.id].evolve.name} Lv8 필요`:new Set(k.weapons.map(w=>w.id)).size!==k.weapons.length?'무기 목록을 확인해 주세요':'';
 return {ok:!reason,reason,revision:k.revision,inputs,output:r.output,slotsFreed:r.inputs.length-1};
}
export function fuseKfp(state,id,revision){const h=state.hunt;if(state.mode!=='hunt'||h?.status!=='running'||h.hunterId!=='yeoni_pig')return {ok:false,reason:'꽃돼지 연이의 사냥 중에 조합해요'};
 const p=kfpFusionPreview(h,id);if(!p.ok)return p;if(p.revision!==revision)return {ok:false,reason:'무기가 바뀌었어요. 조합을 다시 확인해 주세요'};
 const k=h.kfp,ids=new Set(p.inputs.map(i=>i.id)),first=k.weapons.findIndex(w=>ids.has(w.id)),next=k.weapons.filter(w=>!ids.has(w.id));
 next.splice(first,0,{id:p.output,level:1,evolved:false});k.weapons=next;k.consumed=[...new Set([...k.consumed,...ids])];k.revision++;
 return {ok:true,output:p.output,consumed:[...ids]};
}
export function activeKfpCores(h){const k=normalizeKfp(h);if(!k)return [];
 return k.weapons.flatMap(w=>[w,...(FUSION_RECIPES.find(r=>r.output===w.id)?.inputs||[]).map((i,n)=>({id:i.id,level:8,evolved:true,sourceId:w.id,coreIndex:n+1,fusionLevel:w.level}))]);
}
export function kfpPlayerStats(h){const p=normalizeKfp(h)?.passives||{},g=h.gear;
 return {might:g.dmg*(1+.1*(p.whet||0)),cooldown:Math.max(.35,1-.06*(p.nose||0)),area:1+.13*(p.spread||0),duration:1,projSpeed:1+.05*(p.scope||0),amount:0,amountMul:.1*(p.magazine||0),pierce:Math.ceil((p.scope||0)/2),crit:.045*(p.focus||0),speed:g.speed*(1+.07*(p.madness||0)),magnet:g.magnet,xp:1+.08*(p.sap||0),regen:.3*(p.regen||0),armor:1.2*(p.hide||0),guard:.04*(p.hide||0),pollen:p.pollen||0};
}
