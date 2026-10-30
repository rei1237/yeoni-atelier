import {CROPS,FARM,SEASONS,WEATHER,farmLevel,farmNextXp,farmSeason,farmWeather} from '../data/farm.js';
import {INGREDIENTS} from '../data/menus.js';
import {plantCheck,farmCheck,farmForecast} from '../game/farm.js';
import {maxFarmEnergy} from '../data/farm.js';
import {btn,esc} from './dom.js';
import {assetStyle,assetIcon} from './asset-html.js';
import {imageFor} from '../render/assets.js';
import {drawActor} from '../render/sprite-renderer.js';
import {delegateCheck} from '../game/farm-delegate.js';
import {automationStatus} from '../game/auto.js';

// 네오에게 농장 맡기기(네오 ♥3 인연 이야기 뒤). 잠겨 있으면 무엇을 해야 열리는지 보여 준다.
function neoFarmRow(state){
 const st=automationStatus(state,'farm'),d=delegateCheck(state);
 if(st.locked)return `<div class="row automation-row locked"><span class="grow small"><b>농장 맡기기</b> · 🔒 ${esc(st.reason)}</span></div>`;
 return `<div class="row automation-row"><span class="grow small"><b>네오에게 맡기기</b> · 수확·같은 작물 다시 심기·물·돌봄 (걸음마다 농장 행동력 1)${d.ok?'':' · '+esc(d.reason)}</span>${btn({action:'farm.delegate',cls:d.ok?'primary':'',disabled:!d.ok,title:d.ok?'이번 순 농장을 네오에게 맡기기 · 그 순에는 사냥을 못 떠나요':d.reason,label:'맡기기'})}</div>
 <div class="row automation-row"><span class="grow small"><b>영업 전 자동으로 맡기기</b> · ${st.on?'켜짐':'꺼짐'}</span>${btn({action:'automation.toggle',args:{ability:'farm'},cls:st.on?'on':'',label:st.on?'자동 켜짐':'자동 꺼짐'})}</div>`;
}
export function farmSheet(state,ui){
 const f=state.farm,level=farmLevel(f),season=farmSeason(state.day, state.calendar?.turnsPerMonth || 3),weatherId=farmWeather(f,state.day,state.calendar?.turnsPerMonth || 3),weather=WEATHER[weatherId];
 const selected=CROPS[ui.farmCrop]?ui.farmCrop:'wheat',index=Math.max(0,Math.min(f.plots.length-1,ui.farmPlot||0)),p=f.plots[index],c=p?CROPS[p.cropId]:CROPS[selected],check=farmCheck(state),ready=p&&p.growth>=c.turns;
 const wet=p&&(p.wateredDay===state.day||weatherId==='rain'),tended=p?.caredDay===state.day,forecast=p?farmForecast(state,p):null;
 const action=(type,label,disabled=false)=>btn({action:type,args:{index,id:p?.id||selected},cls:type==='farm.harvest'?'primary':'',disabled:!check.ok||disabled,title:f.energy<1?'농장 행동력이 없어요. 영업을 마치면 채워져요':'농장 행동력 1',label});
 const board=f.plots.map((plot,i)=>{
  const crop=plot&&CROPS[plot.cropId],ripe=plot&&plot.growth>=crop.turns,watered=plot&&(plot.wateredDay===state.day||weatherId==='rain'),cared=plot?.caredDay===state.day;
  const bed=!plot?'empty':cared?'tended':watered?'watered':'seeded',stage=ripe?2:plot?.growth>0?1:0;
  const growth=crop?Math.floor(plot.growth/crop.turns*100):0;
  return btn({action:'farm.plot',args:{index:i},cls:`farm-cell${index===i?' selected':''}${ripe?' ripe':''}`,title:`${i+1}번 밭 ${crop?.name||'빈 밭'}${crop?' · '+growth+'%':''}`,label:`<span class="soil-bed">${assetIcon('farm/bed_'+bed)}${crop&&plot.growth>0?`<span class="planted-crops stage-${stage}">${[0,1,2].map(()=>assetIcon('crops/'+plot.cropId+'-'+stage)).join('')}</span>`:''}${ripe?'<span class="harvest-ready">수확</span>':''}</span><span class="plot-sign"><b>${crop?.name||'씨앗 심을 밭'}</b><small>${crop?ripe?'바구니에 담아요':growth+'% · '+farmForecast(state,plot).remaining+'순 예상':(i+1)+'번 텃밭'}</small></span>`});
 }).join('');
 const seeds=Object.entries(CROPS).map(([id,crop])=>{const locked=level<crop.level||(!f.greenhouse&&!crop.seasons.includes(season));return btn({action:'farm.select',args:{id},cls:`crop-card${id===selected?' selected':''}`,disabled:locked,label:`${assetIcon(`crops/${id}-2`)}<b>${crop.name}</b><small>${level<crop.level?`Lv.${crop.level}`:locked?'온실 필요':`${crop.seedCost}G · ${crop.turns}순`}</small><small>${INGREDIENTS[crop.ingredient].name} ${crop.yield}개부터</small>`});}).join('');
 const ripeCount=f.plots.filter(pl=>pl&&pl.growth>=CROPS[pl.cropId].turns).length;
 const plant=plantCheck(state,selected,index),expandLevel=2+(f.plots.length-FARM.startPlots)/FARM.plotStep,expandCost=FARM.expandBase*(1+(f.plots.length-FARM.startPlots)/FARM.plotStep);
 return `<h2>연이의 달빛 농장${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><div class="farm-header"><div><b>농장 Lv.${level} · ${SEASONS[season]}</b><small>경험치 ${f.xp} / ${farmNextXp(f)}</small></div><div><b>농장 행동력 ${f.energy}/${maxFarmEnergy(f)}</b><small>마을 행동력과 별개 · 영업 후 회복</small></div></div>${ripeCount?`<div class="row farm-harvest-all">${btn({action:'farm.harvestAll',cls:'primary',disabled:!check.ok||f.energy<ripeCount,title:f.energy<ripeCount?`다 자란 밭 ${ripeCount}곳을 거두려면 농장 행동력 ${ripeCount}이 필요해요`:'밭마다 농장 행동력 1',label:`다 자란 밭 ${ripeCount}곳 모두 수확 · 농장 행동력 ${ripeCount}`})}</div>`:''}<div class="farm-playfield ${weatherId}" style="${assetStyle('backgrounds/farm_ground')}"><canvas id="farm-yeoni" width="192" height="192" aria-label="꽃돼지 연이"></canvas><span class="farm-weather">${weather.icon} ${weather.name}</span><div class="farm-board" aria-label="작물 밭">${board}</div></div><div class="farm-tools"><h3>${index+1}번 밭 · ${p?c.name:'씨앗 심기'}</h3><p class="small">${!p?'아래에서 씨앗을 고르고, 이 밭에 심어 주세요.':ready?`${INGREDIENTS[c.ingredient].name} ${c.yield+Math.min(3,p.careTurns||0)+Math.floor((level-1)/FARM.levelYieldEvery)}개를 주방에 보낼 수 있어요.`:`지금 돌봄 기준 ${forecast.remaining}순 뒤 수확 · 예상 ${forecast.qty}개. 물과 돌봄을 더하면 빨리 자라고 풍성해져요.`}</p><div class="row">${!p?btn({action:'farm.plant',args:{index,id:selected},cls:'primary',disabled:!plant.ok,title:plant.ok?'농장 행동력 1':plant.reason,label:`${assetIcon('farm/seeds')}${c.name} 심기 · ${c.seedCost}G · 농장 행동력 1`}):ready?action('farm.harvest','수확해서 주방으로 · 농장 행동력 1',(f.energy<1&&!ui.delegate)):action('farm.water',`${assetIcon('farm/water')}${wet?'물 충분':'물 주기 · 농장 행동력 1'}`,wet||(f.energy<1&&!ui.delegate))+action('farm.tend',`${assetIcon('farm/seeds')}${tended?'돌봄 완료':'돌보기 · 농장 행동력 1'}`,tended||(f.energy<1&&!ui.delegate))}</div><p class="farm-feedback" role="status">${esc(ui.farmFeedback||'밭을 눌러 오늘 돌볼 작물을 골라 주세요.')}</p></div>${neoFarmRow(state)}<h3>씨앗 바구니</h3><div class="seed-shelf">${seeds}</div><details class="farm-detail"><summary>농장 관리와 성장 안내</summary><p class="small">물주기: 성장 +0.75순 · 돌보기: 성장 +1순과 수확 +1개(최대 +3). 자연 성장은 0.25순, 건조·서리는 0.1순이에요. 비는 무료로 물을 주고, 온실은 날씨와 계절을 보호해요. 수확 재료는 바로 요리에 쓸 수 있어요.</p>${btn({action:'farm.careAll',disabled:level<3||!check.ok,label:'모든 밭 돌보기 · 작업마다 농장 행동력 1'})}<div class="grid2">${btn({action:'farm.expand',disabled:!check.ok||level<expandLevel||f.plots.length>=FARM.maxPlots||state.gold<expandCost,label:`밭 +2 · ${expandCost}G`})}${btn({action:'farm.greenhouse',disabled:!check.ok||f.greenhouse||level<FARM.greenhouseLevel||state.gold<FARM.greenhouseCost,label:f.greenhouse?'온실 사용 중':`온실 · Lv.${FARM.greenhouseLevel} · ${FARM.greenhouseCost}G`})}</div></details>`;
}
export function drawFarm(state,now,ui={}){
 const cv=document.getElementById('farm-yeoni'),field=cv?.parentElement;if(!cv)return;
 const ctx=cv.getContext('2d');ctx.clearRect(0,0,192,192);
 const motion=ui.farmMotion,age=motion?now-motion.at:1e6,active=age<1800;
 const index=active?motion.index:ui.farmPlot||0;
 const cell=field.querySelector(`[data-action="farm.plot"][data-index="${index}"]`);
 if(!cell)return;
 const rect=cell.getBoundingClientRect(),base=field.getBoundingClientRect(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const target={x:rect.left-base.left-16,y:rect.top-base.top+4};
 ui.farmPosition??={...target};
 if(reduced){ui.farmPosition={...target};}else{ui.farmPosition.x+=(target.x-ui.farmPosition.x)*.16;ui.farmPosition.y+=(target.y-ui.farmPosition.y)*.16;}
 cv.style.left=ui.farmPosition.x+'px';cv.style.top=ui.farmPosition.y+'px';
 const walking=!reduced&&Math.hypot(target.x-ui.farmPosition.x,target.y-ui.farmPosition.y)>3;
 const action=active&&!walking&&age>200;
 drawActor(ctx,action?'yeoni_farm':'yeoni_pig',{x:96,y:188,size:184,state:action?motion.kind:walking?'walk':'idle',animationFrame:action?(reduced?3:Math.min(3,Math.floor(Math.max(0,age-200)/350))):undefined,facing:walking&&target.x<ui.farmPosition.x?'left':'right',idleMotion:!active,reducedMotion:reduced,t:now});
 if(action&&motion.kind==='harvest'&&age>600){const icon=imageFor('crops/'+motion.cropId+'-2');if(icon)ctx.drawImage(icon,65,103,48,48);}
}
