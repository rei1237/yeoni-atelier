// 화면 전용 이동. 저장·행동력·방문 원장을 변경하지 않는다.
export function createTrip(id,points){
 const path=points.map(p=>({x:p.x,y:p.y}));
 if(path.length<2||path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
 return {id,path,lengths,total:lengths.reduce((a,b)=>a+b,0),distance:0,complete:false};
}
export function advanceTrip(trip,ms,instant=false){
 if(!trip||trip.complete)return null;
 // TEMP: 전체 경로를 최대 3.2초, 짧은 길은 약 1초에 걷는다.
 const speed=trip.native?180:Math.max(24,trip.total/3.2);
 trip.distance=Math.min(trip.total,trip.distance+(instant?trip.total:Math.max(0,Math.min(ms,100))*speed/1000));
 let left=trip.distance,index=0;
 while(index<trip.lengths.length-1&&left>=trip.lengths[index])left-=trip.lengths[index++];
 const a=trip.path[index],b=trip.path[index+1],f=trip.lengths[index]?left/trip.lengths[index]:1;
 const dx=b.x-a.x,dy=b.y-a.y;trip.complete=trip.distance>=trip.total;
 return {x:a.x+dx*f,y:a.y+dy*f,facing:trip.complete?'down':Math.abs(dx)*(trip.native?15.36:1)>Math.abs(dy)*(trip.native?10.24:1)?dx>0?'right':'left':dy>0?'down':'up',frame:trip.complete?0:Math.floor(trip.distance/(trip.native?28:2.5))%4,arrived:trip.complete};
}


// 길 길이는 원본 그림의 픽셀 비율을 사용한다.
export function worldRoute(nav,from,to){
 const points=nav.waypoints,dist={[from]:0},prev={},open=new Set(Object.keys(points));
 if(!points[from]||!points[to])return null;
 while(open.size){let u=null;for(const id of open)if(dist[id]!=null&&(u===null||dist[id]<dist[u]))u=id;if(u===null)break;open.delete(u);if(u===to)break;
  for(const [a,b] of nav.edges){const v=a===u?b:b===u?a:null;if(!v||!open.has(v))continue;const d=dist[u]+Math.hypot((points[u][0]-points[v][0])*1536,(points[u][1]-points[v][1])*1024);if(dist[v]==null||d<dist[v]){dist[v]=d;prev[v]=u;}}
 }
 if(dist[to]==null)return null;const ids=[];for(let id=to;id;id=prev[id])ids.unshift(id);return ids.map(id=>({x:points[id][0]*100,y:points[id][1]*100}));
}
export function createWorldTrip(id,path){
 const trip=createTrip(id,path);if(!trip)return null;
 trip.lengths=path.slice(1).map((p,i)=>Math.hypot((p.x-path[i].x)*15.36,(p.y-path[i].y)*10.24));trip.total=trip.lengths.reduce((a,b)=>a+b,0);trip.native=true;return trip;
}
