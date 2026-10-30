import {workshopQuestView} from '../game/workshop-quests.js';
import {yunQuestView,YUN_COMMISSION} from '../game/yun-quest.js';
import { UPGRADES, SUPPLIES, supplyPrice, upgradeLevel, upgradeCost, armory, SKILL_IDS, skillRank, skillCap, skillCost, capLevels, TECH_LINES, techLevel, techMax, techNext, evoKnown } from '../game/moka-armory.js';
import { WEAPONS, PASSIVES } from '../data/hunt-kit.js';
import { perkTier } from '../data/bonds.js';
import { btn, esc } from './dom.js';
import { assetIcon } from './asset-html.js';
import { GEAR, GEAR_SLOTS, GEAR_ORDER } from '../data/gear.js';
import { won } from './hud.js';
export function armorySheet(state,ui) {
 const who=ui.hunterId==='seohanbi'&&state.roster.seohanbi?'seohanbi':'neo',prep=state.mode==='prep';
 const tabs={upgrade:'강화',skills:'상한 해방',equipment:'장비',supplies:'휴대 도구',quests:'공방 부탁'},tab=tabs[ui.armoryTab]?ui.armoryTab:'upgrade';
 const free=(armory(state).freeEnhance||0)>0;
 const rows=Object.entries(UPGRADES).map(([id,d])=>{const cost=free?0:upgradeCost(state,who,id),lv=upgradeLevel(state,who,id),maxed=id==='stride'&&lv>=40;return `<article class="card upgrade-row">${assetIcon('skills/'+(id==='power'?'paw':id==='vitality'?'fish_stock':'paw'))}<div><h3>${d.name}</h3><p>${maxed?'최대 단계':`현재 +${lv} → 다음 +${lv+1}`}</p><p>${d.detail}</p>${btn({action:'armory.enhance',args:{id,who},disabled:!prep||maxed||state.moonstone<cost,title:state.moonstone<cost?'월정석이 부족해요':'이 사냥꾼에게 영구 적용',label:maxed?'최대 단계':free?'첫 강화 · 윤달의 선물(무료)':`강화 · 월정석 ${cost.toLocaleString()}`,cls:free?'primary':''})}</div></article>`;}).join('');
 const content=tab==='skills'?skillTraining(state,prep):tab==='supplies'?supplyShop(state,'gear'):tab==='quests'?workshopStories(state)+yunCommission(state):tab==='equipment'?gearList(state):`<div class="btns">${['neo',...(state.roster.seohanbi?['seohanbi']:[])].map(id=>btn({action:'hunt.hunter',args:{id},cls:id===who?'on':'',label:id==='neo'?'영냥이':'서한비'})).join('')}</div><p class="small">강화는 선택한 사냥꾼에게 따로 저장돼요. 표시된 효과가 한 번씩 누적됩니다.</p><div class="list">${rows}</div>`;
 return `<section class="workshop-room"><h2>윤달의 무기 공방${btn({action:'sheet.close',cls:'close ghost',label:'✕',title:'닫기'})}</h2><div class="shop-intro"><canvas data-talking-portrait="yun" width="192" height="240" aria-hidden="true"></canvas><div><b>날보다 먼저 손잡이를 살피지.<br>네가 무사해야 하니까.</b><p>보유 월정석 ${state.moonstone.toLocaleString()}개 · 골드 ${state.gold.toLocaleString()}G</p></div></div><nav class="workshop-tabs" aria-label="공방 둘러보기">${Object.entries(tabs).map(([id,label])=>btn({action:'workshop.tab',args:{id},cls:tab===id?'on':'',label})).join('')}</nav><div class="workshop-content">${content}</div></section>`;
}
function workshopStories(state){
 const quests=workshopQuestView(state),done=quests.filter(q=>q.claimed).length;
 return `<section class="workshop-stories"><header class="wq-heading"><p class="wq-kicker">YUN'S WORKSHOP</p><h3>공방의 작은 하루</h3><p>윤달의 부탁을 따라 사냥터의 이야기를 이어 가요.</p><span class="wq-count">완료 ${done} / 4</span></header>${quests.map(q=>{
 const status=q.claimed?'완료':q.claimable?'보고 가능':q.accepted?'진행 중':q.acceptable?'수락 가능':'잠김';
 const hint=!q.accepted&&!q.acceptable?`사냥터 ${q.stage}단계에 먼저 도달해 주세요.`:q.claimable?'윤달에게 돌아가 이야기를 마무리해 주세요.':q.accepted?'부탁을 수락했어요. 목표를 확인하고 사냥에 나서요.':'목표를 확인하고 부탁을 수락해 주세요.';
 return `<article class="card workshop-story wq-card ${q.claimed?'is-complete':q.claimable?'is-ready':''}" data-key="${q.id}"><div class="wq-title"><div><small>윤달의 부탁 · ${q.stage}단계</small><h3>${esc(q.title)}</h3></div><span class="wq-badge">${status}</span></div><div class="workshop-dialogue">${(q.claimed?q.end:q.intro).map(x=>`<p>${esc(x)}</p>`).join('')}</div><div class="wq-objective"><small>목표</small><b>${esc(q.target)}</b><progress max="${q.goal}" value="${q.progress}" aria-label="${esc(q.title)} 진행"></progress><span>${q.progress}/${q.goal} · 보상 ${q.gold.toLocaleString()}G</span></div><p class="wq-hint">${esc(hint)}</p>${q.claimed?'<small>이야기와 보상을 받았어요.</small>':btn({action:'workshop.quest',args:{id:q.id,mode:q.accepted?'claim':'accept'},disabled:q.accepted?!q.claimable:!q.acceptable,cls:q.claimable?'primary':'',label:q.accepted?'마친 이야기 전하기':'부탁 수락'})}</article>`;
 }).join('')}</section>`;
}
// 상한 해방: 공방 연구(armory.tech) 세 갈래. 무기·보조 상한은 배운 기술 모두에 공용, 진화 비전은 무기마다. 기술 배우기는 armory.learn
function techButton(state,prep,line,id,label){
 const n=techNext(state,line,id);if(n.done)return '<p class="ok small">연구 완료</p>';
 return `${n.reason?`<p class="small muted">${esc(n.reason)}</p>`:''}${btn({action:'armory.tech',args:id?{line,id}:{line},disabled:!prep||!!n.reason||state[n.currency]<n.cost,label:n.currency==='gold'?`🔓 ${label} · ${n.cost.toLocaleString()}G`:`🔓 ${label} · 월정석 ${n.cost.toLocaleString()}`})}`;
}
function skillTraining(state,prep){
 const pairOf=id=>Object.values(WEAPONS).find(w=>w.evo.pair===id),now=capLevels(state),lines=Object.keys(TECH_LINES);
 const done=lines.reduce((t,l)=>t+techLevel(state,l),0),all=lines.reduce((t,l)=>t+techMax(l),0);
 const capRow=(line,kind)=>{const d=TECH_LINES[line],lv=techLevel(state,line),max=techMax(line),more=lv<max;
  return `<article class="card upgrade-row skill-cap tech-${line}">${assetIcon('icons/'+d.icon)}<div><b>${d.name} · ${lv}/${max}</b><p>${d.detail}</p><p class="small">지금 ${kind==='weapon'?'무기':'보조'} Lv ${now[kind]}${more?` → 다음 Lv ${now[kind]+1}${kind==='weapon'&&now[kind]+1>=5?' · 진화 비전을 열 수 있어요':''}`:''}</p>${techButton(state,prep,line,null,`${lv+1}단계 연구`)}</div></article>`;};
 const evo=TECH_LINES.evo,evoRows=Object.entries(WEAPONS).map(([id,w])=>{const known=evoKnown(state,id);
  return `<li class="tech-evo-item${known?' known':''}">${assetIcon(`skills/${id==='whisker'?'tarot':id}`)}<div><b>${esc(w.evo.name)}</b><span class="small">${esc(w.name)} Lv 최대 + ${esc(PASSIVES[w.evo.pair].name)}</span>${known?'<p class="ok small">연구 완료</p>':techButton(state,prep,'evo',id,'연구')}</div></li>`;}).join('');
 const evoCard=`<article class="card skill-cap tech-evo"><div class="upgrade-row">${assetIcon('icons/'+evo.icon)}<div><b>${evo.name} · ${techLevel(state,'evo')}/${techMax('evo')}</b><p>${evo.detail}</p><p class="small">하나를 연구할 때마다 다음 비전은 더 비싸고 더 깊은 단계가 필요해요.</p></div></div><ul class="tech-evo-list">${evoRows}</ul></article>`;
 return `<section class="card skill-train"><h3>상한 해방 · 공방 연구 ${done}/${all}</h3><p class="small">기술 레벨은 사냥터의 레벨업으로 올라요. 윤달은 그 레벨이 오를 수 있는 상한과 진화를 연구로 풀어 줘요. 무기·보조 상한 해방과 진화 비전에는 월정석, 기술서에는 골드가 필요해요. 사냥터 도달 단계도 확인해 주세요.</p>${capRow('forge','weapon')}${capRow('charm','passive')}${evoCard}<h3>사냥 기술서</h3><div class="list">${SKILL_IDS.map(id=>{const d=WEAPONS[id]||PASSIVES[id],r=skillRank(state,id),cost=skillCost(id),evo=WEAPONS[id]?` · 진화: ${PASSIVES[d.evo.pair].name}와 함께 ${d.evo.name}${evoKnown(state,id)?'':'(진화 비전 필요)'}`:pairOf(id)?` · ${pairOf(id).name} 진화 짝`:'';
  return `<article class="card upgrade-row${r?'':' unlearned'}">${assetIcon(`skills/${id==='whisker'?'tarot':id}`)}<div><b>${esc(d.name)} · ${r?'배움':'아직 못 배움'}</b><p>${esc(d.desc)}</p><p class="small">${r?`사냥 중 최대 Lv ${skillCap(id,r,now)}`:'배우면 레벨업 카드에 나와요'}${esc(evo)}</p>${r?'':btn({action:'armory.learn',args:{id},disabled:!prep||state.gold<cost,label:`배우기 · ${cost.toLocaleString()}G`})}</div></article>`;}).join('')}</div></section>`;
}
export function supplyShop(state,shop='moka'){const tier=perkTier(state,'moka'),prep=state.mode==='prep';return `<h3>${shop==='gear'?'윤달의 한정 휴대 도구':'모카의 사냥 도시락과 보급품'}</h3><div class="supply-grid">${Object.entries(SUPPLIES).filter(([,d])=>(d.shop||'moka')===shop).map(([id,d])=>{const price=supplyPrice(d);return `<article class="card">${assetIcon(`skills/${d.icon}`)}<b>${d.name}</b><p>${d.detail}</p><small>보유 ${armory(state).supplies[id]||0}${d.limit?`/${d.limit}`:''}개</small>${btn({action:'armory.buy',args:{id},disabled:!prep||tier<d.tier||(state[price.currency]||0)<price.amount||(d.limit&&(armory(state).supplies[id]||0)>=d.limit),label:d.limit&&(armory(state).supplies[id]||0)>=d.limit?'보유 한도 · 사용 후 재구매':tier<d.tier?`모카 인연 ${d.tier}에서 열림`:price.currency==='gold'?`${price.amount.toLocaleString()}G`:`월정석 ${price.amount}`})}</article>`;}).join('')}</div>`;}
function yunCommission(state){
 if(state.roster.yun)return '<section class="card wq-commission is-complete"><span class="wq-badge">합류 완료</span><h3>함께 돌아온 약속</h3><p>윤달이 동료로 함께하고 있어요. 대화와 선물로 인연을 깊게 해 보세요.</p></section>';
 const q=yunQuestView(state),stateLabel=q.ready?'이야기 확인':q.status==='active'?'보스 토벌 중':q.eligible?'부탁 수락 가능':'신뢰 쌓는 중';
 return `<section class="card wq-commission"><div class="wq-title"><div><small>윤달의 합류 이야기</small><h3>손잡이에 남은 약속</h3></div><span class="wq-badge">${stateLabel}</span></div><p>장비를 믿고 돌아오는 사람에게만 내 이야기를 맡기고 싶어.</p><div class="wq-objective"><small>공방 이용 · 둘 중 한 조건</small><b>${Math.min(q.gold,YUN_COMMISSION.gold).toLocaleString()} / ${YUN_COMMISSION.gold.toLocaleString()}G</b><progress max="${YUN_COMMISSION.gold}" value="${Math.min(q.gold,YUN_COMMISSION.gold)}" aria-label="골드 거래 진행"></progress><b>월정석 ${Math.min(q.moonstone,YUN_COMMISSION.moonstone)} / ${YUN_COMMISSION.moonstone}개</b><progress max="${YUN_COMMISSION.moonstone}" value="${Math.min(q.moonstone,YUN_COMMISSION.moonstone)}" aria-label="월정석 거래 진행"></progress></div><p class="wq-hint">${q.ready?'토벌을 마쳤어요. 윤달의 합류 이야기를 확인해 주세요.':q.status==='active'?'영냥이로 단계 보스를 1마리 쓰러뜨리고 귀환해 주세요.':q.eligible?'신뢰를 쌓았어요. 부탁을 수락하고 보스를 만나러 가요.':'공방에서 장비를 사거나 연구·강화를 하며 신뢰를 쌓아 주세요.'}</p>${q.ready?btn({action:'recruit.event',args:{id:'yun'},cls:'primary',label:'윤달의 합류 이야기 보기'}):q.status==='active'?'<span class="wq-badge">부탁 진행 중</span>':btn({action:'yun.quest',disabled:!q.eligible,label:'부탁 수락하기'})}</section>`;
}
// 장비 진열대: 공방 장비 탭과 마을 좌판이 같이 쓴다. 구매·장착은 gear.buy·gear.equip 명령으로만
export function gearList(state){const eq=state.gear.equipped;
 const slots=Object.entries(GEAR_SLOTS).map(([slot,label])=>`<span>${label}</span><b>${eq[slot]?esc(GEAR[eq[slot]].name):'-'}</b>`).join('');
 const rows=GEAR_ORDER.map(id=>{const g=GEAR[id],price=g.cost.gold?won(g.cost.gold):`월정석 ${g.cost.moonstone}`;let right;
  if(!state.gear.owned.includes(id)){const can=g.cost.gold?state.gold>=g.cost.gold:(state.moonstone||0)>=g.cost.moonstone;right=btn({action:'gear.buy',args:{id},disabled:!can,title:can?'사서 보관함에 넣기':'재화가 부족해요',label:`구매 · ${price}`});}
  else if(eq[g.slot]===id)right=btn({action:'gear.equip',args:{slot:g.slot},cls:'on',title:`${g.name} 빼기`,label:'장착 중'});
  else right=btn({action:'gear.equip',args:{slot:g.slot,id},cls:'primary',label:'장착'});
  return `<article class="card upgrade-row gear-row">${assetIcon('icons/'+id)}<div><h3>${esc(g.name)} · ${GEAR_SLOTS[g.slot]}</h3><p>${esc(g.desc)}</p>${right}</div></article>`;}).join('');
 return `<section class="gear-list"><h3>사냥 장비 · ${state.gear.owned.length}/${GEAR_ORDER.length}개 보유</h3><p class="small">장비는 영냥이의 사냥 능력치만 바꿔요. 칸마다 하나씩 장착해요.</p><div class="kv">${slots}</div><div class="list">${rows}</div></section>`;}
