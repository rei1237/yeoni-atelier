import {runningJobs} from '../game/station-slots.js';
import {MENUS} from '../data/menus.js';
// 저장된 실제 진행 시간만 읽는다. 프레임마다 시간을 누적하지 않는다.
export function cookingPose(job,stationId,reducedMotion=false){
 if(!job||!(job.durationMs>0)||job.progressMs>=job.durationMs)return null;
 const elapsed=Math.max(0,job.progressMs||0),progress=elapsed/job.durationMs;
 const phase=progress<.22?'prepare':progress>=.82?'plate':stationId==='oven'?'bake':'extract';
 const start=phase==='prepare'?0:phase==='plate'?.82:.22;
 const frame=reducedMotion?0:Math.floor(Math.max(0,elapsed-start*job.durationMs)%640/160);
 return {jobId:job.id,menuId:job.menuId,ingredientId:Object.keys(MENUS[job.menuId]?.ingredients||{})[0],stationId,phase,frame,progress};
}
export function latestStationJob(st){return runningJobs(st||{}).sort((a,b)=>(b.startedAt||0)-(a.startedAt||0)||String(a.id).localeCompare(String(b.id)))[0]||null;}
export function staffCookingPose(state,staff,reducedMotion=false){
 if(staff.action!=='cook'||staff.path?.length||staff.facing!=='up')return null;
 const sid=staff.job?.sid;if(!sid)return null;
 return cookingPose(latestStationJob(state.stations[sid]),sid,reducedMotion);
}
// 새 그림에서 측정·검증한 소켓만 쓴다. 추정 좌표로 소품을 붙이지 않는다.
export function cookingSockets(def,pose){
 if(!def.cookSockets?.verified||!pose)return [];
 return Object.entries(def.cookSockets[pose.phase]?.[pose.frame]||{}).filter(([,s])=>Number.isFinite(s.x)&&Number.isFinite(s.y)&&s.width>0&&['front','back'].includes(s.layer));
}
