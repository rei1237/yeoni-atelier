
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/game/state.js';
import {dispatch,tick,helperAvailable} from '../src/game/engine.js';
import {maxActionPoints} from '../src/game/calendar.js';
import {serialize,deserialize} from '../src/core/save.js';
import {nearbyProps,hitFieldProp,fieldTheme} from '../src/game/hunt-field.js';
import {withinMeleeArc} from '../src/game/melee.js';
import {damageHunter} from '../src/game/enemy-behaviors.js';
import {newCraft,mixCraft,craftHeat} from '../src/ui/crafting.js';
import {wealthWeights} from '../src/game/cafe-growth.js';
import {FURNITURE} from '../src/data/layout.js';
import {reviewVisit,waitingSatisfaction} from '../src/game/reputation.js';
import {bondQuestion} from '../src/data/bond-dialogues.js';
import {hiddenGuestQuest} from '../src/game/hidden-guest.js';
import {recordYunTrade,yunQuestView} from '../src/game/yun-quest.js';
import {TEMP} from '../src/config/balance.temp.js';
import {farmForecast} from '../src/game/farm.js';
const cmd=(s,type,args={})=>dispatch(s,{type,...args});
test('구매는 무료 행동, 농장은 별도 행동력과 순마다 한 번 동료 대행',()=>{
 const s=createGame();s.ledger.story.m1=true; // 테스트 준비: 농장 개방
 assert.equal(maxActionPoints(s),3);assert.equal(s.ap.left,3);assert.equal(s.farm.energy,6);
 assert.ok(cmd(s,'shop.buy',{ingredientId:'bean',qty:1}).ok);assert.equal(s.ap.left,3);assert.equal(s.farm.energy,6);
 assert.ok(cmd(s,'farm.plant',{cropId:'wheat',index:0}).ok);assert.equal(s.farm.energy,5);assert.equal(s.ap.left,3);
 s.affinity.neo=60;s.ap.left=0;s.farm.energy=0;
 assert.ok(helperAvailable(s,'neo','farm.tend'));assert.ok(cmd(s,'farm.tend',{index:0,helperId:'neo'}).ok);
 assert.equal(s.farm.energy,0);assert.equal(s.ap.left,0);assert.equal(cmd(s,'farm.tend',{index:0,helperId:'neo'}).ok,false);
 assert.ok(cmd(s,'shop.buy',{ingredientId:'bean',qty:1}).ok);
 s.stats.served=300;assert.ok(maxActionPoints(s)>3);
});
test('농장 행동력 저장·이전 저장 이전·마감 회복은 마을 행동력과 독립적',()=>{
 let s=createGame();s.ledger.story.m1=true;cmd(s,'farm.plant',{cropId:'wheat',index:0});s=deserialize(serialize(s)).state;
 assert.equal(s.farm.energy,5);assert.equal(s.ap.left,3);
 const legacy=JSON.parse(serialize(s));delete legacy.farm.energy;assert.equal(deserialize(JSON.stringify(legacy)).state.farm.energy,6);
 s.farm.energy=0;const gold=s.gold;assert.equal(cmd(s,'farm.plant',{cropId:'wheat',index:1}).ok,false);assert.equal(s.gold,gold);
 cmd(s,'shift.start');tick(s,600000);cmd(s,'settlement.close');assert.equal(s.farm.energy,6);assert.equal(s.ap.left,3);
});
test('드레스룸은 개업 이벤트 뒤에만 열리고 튜토리얼 기록은 저장된다',()=>{
 let s=createGame();s.moonstone=100000;
 assert.equal(cmd(s,'outfit.unlock',{id:'crescent_tailcoat'}).ok,false);
 assert.equal(cmd(s,'outfit.equip',{who:'neo',slot:'outfit',itemId:null}).ok,false);
 s.day=7;assert.ok(cmd(s,'story.seen',{id:'m2'}).ok);assert.ok(s.hostbar.open);
 assert.ok(cmd(s,'outfit.unlock',{id:'crescent_tailcoat'}).ok);
 cmd(s,'tutorial.seen',{id:'outfits'});s=deserialize(serialize(s)).state;assert.equal(s.tutorials.outfits,true);
});
test('초반 대부호 차단: 레벨과 분위기 두 조건을 모두 만족해야 한다',()=>{
 const s=createGame();assert.equal(wealthWeights(s).tycoon,0);s.stats.served=2000;assert.equal(wealthWeights(s).tycoon,0);
 const rich=Object.values(FURNITURE).find(x=>x.ambience>=5);assert.ok(rich);
 s.interior.furniture.push(...Array.from({length:20},(_,i)=>({uid:'test'+i,defId:rich.id,x:i,y:4})));
 assert.ok(wealthWeights(s).tycoon>0);s.stats.served=0;assert.equal(wealthWeights(s).tycoon,0);
});
test('수동 조리 준비는 재고를 건드리지 않고 담아 젓기·타이밍 두 단계를 따른다',()=>{
 const s=createGame(),stock=structuredClone(s.stock),c=newCraft('fortune_latte');
 assert.equal(c.step,0);assert.ok(mixCraft(c));assert.equal(c.step,1);assert.equal(mixCraft(c),false);
 assert.equal(craftHeat(c,c.heatAt),0);assert.ok(craftHeat(c,c.heatAt+2513)>95);assert.deepEqual(s.stock,stock);
});
test('사망 정산 후 기술 구성·단계는 유지하고 영구 강화와 보급품은 별도 적용',()=>{
 let s=createGame();s.huntUnlocked=true;s.hunter.maxStage=8;cmd(s,'hunt.start',{depth:8});
 Object.assign(s.hunt,{level:9,xp:21,status:'down',weapons:[{id:'bolt',level:4,evo:false},{id:'orbit',level:2,evo:false}],passives:{fish_stock:2}});
 cmd(s,'hunt.finish');s=deserialize(serialize(s)).state;s.paused=false;s.ap.left=3;s.moonstone=100000;
 const before=s.armory.supplies.fish||0;assert.ok(cmd(s,'armory.enhance',{who:'neo',id:'power'}).ok);
 assert.ok(cmd(s,'hunt.start',{depth:s.hunter.lastStage}).ok);assert.equal(s.hunt.depth,8);assert.equal(s.hunt.level,9);
 assert.equal(s.hunt.weapons[0].level,4);assert.equal(s.hunt.passives.fish_stock,2);assert.ok(s.hunt.gear.dmg>0);
 assert.equal(s.hunt.maxHp,TEMP.HUNT.PLAYER_HP+s.hunt.gear.hp+40);assert.equal(s.armory.supplies.fish||0,before);
});
test('무한 필드 오브젝트는 좌표 기반으로 반복 생성되고 파괴 보상은 한 번만 나온다',()=>{
 let h={fieldSeed:91,depth:3,brokenProps:{}};const p={x:-180000,y:230000},props=nearbyProps(h,p);
 assert.ok(props.length>0 && props.length<=25);assert.deepEqual(props,nearbyProps(h,p));
 const prop=props[0];assert.equal(hitFieldProp(h,prop,1),0);assert.equal(hitFieldProp(h,prop,10000),prop.reward);
 h=JSON.parse(JSON.stringify(h));assert.equal(hitFieldProp(h,prop,10000),0);assert.ok(!nearbyProps(h,p).some(x=>x.id===prop.id));
 assert.equal(fieldTheme(100),'hunt_heukwol');assert.equal(fieldTheme(35),'hunt_rabbit');
});
test('근접 검은 전방 원호에만 맞고 달빛 수호부는 피해를 줄일 뿐 막지 않는다',()=>{
 assert.ok(withinMeleeArc(0,0,0,100,.6,{x:85,y:0},10));assert.equal(withinMeleeArc(0,0,0,100,.6,{x:-60,y:0},10),false);
 const s=createGame();s.hunt={hp:100,scale:{dmg:1}};const w={player:{hurtUntil:0},guard:.5};
 assert.ok(damageHunter(s,w,20,1000));assert.equal(s.hunt.hp,90,'수호부 50% → 피해 절반');
 w.guard=0;assert.ok(damageHunter(s,w,20,2000));assert.equal(s.hunt.hp,70);
 s.hunt.shieldUntil=4000;assert.equal(damageHunter(s,w,20,3000),false,'방어막 소모품만 완전히 막는다');assert.equal(s.hunt.hp,70);
});
test('지연 만족도와 방문 평가는 저장 뒤에도 중복 반영되지 않는다',()=>{
 let s=createGame();s.shift={elapsedMs:120000};s.orders={x:{status:'waiting',placedAt:0}};s.visits={v:{orderIds:['x'],foodScores:[95]}};
 const v=s.visits.v;assert.ok(waitingSatisfaction(s,v)<40);reviewVisit(s,v,'식사 완료');const score=s.reputation;
 s=deserialize(serialize(s)).state;reviewVisit(s,s.visits.v,'식사 완료');assert.equal(s.reputation,score);assert.equal(s.reviews.count,1);
});
test('인연 단계에 따라 고민이 바뀌고 숨은 초대장은 다음 단서만 표시할 수 있다',()=>{
 const s=createGame(),first=bondQuestion(s,'neo');s.affinity.neo=180;const later=bondQuestion(s,'neo');
 assert.notEqual(first.question,later.question);assert.notEqual(first.token,later.token);assert.equal(new Set(later.answers.map(a=>a.gain)).size,3);
 assert.equal(hiddenGuestQuest(s).next,0);s.ledger.story['hanbi:30']=true;assert.equal(hiddenGuestQuest(s).next,1);
});
test('윤달의 부탁은 공방 거래 누적 뒤 수락해야 하며 영입 완료와 분리된다',()=>{
 const s=createGame();assert.equal(cmd(s,'yun.quest').ok,false);recordYunTrade(s,10000);
 assert.equal(yunQuestView(s).eligible,true);assert.ok(cmd(s,'yun.quest').ok);assert.equal(yunQuestView(s).ready,false);
 assert.equal(cmd(s,'recruit.complete',{id:'yun'}).ok,false);
});
test('돌봄 예상 수확은 추가량 상한을 넘지 않는다',()=>{
 const s=createGame();const p={cropId:'wheat',growth:0,careTurns:3,caredDay:s.day};assert.equal(farmForecast(s,p).qty,7);
});

