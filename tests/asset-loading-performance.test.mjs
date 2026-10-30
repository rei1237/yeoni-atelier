import test from 'node:test';import assert from 'node:assert/strict';
import {BOOT_ASSETS,ASSETS} from '../src/render/assets.js';import {huntAssets} from '../src/render/hunt-assets.js';import {readFileSync} from 'node:fs';
test('시작에 카페 필수 그림을 유지하고 사용하지 않는 동료와 대화 시트는 지연한다',()=>{
 for(const key of ['actors/yeoni','actors/luna','actors/luna_sis','actors/customer_original','icons/americano','objects/chair'])assert.ok(BOOT_ASSETS.includes(key),key);
 for(const key of ['actors/lune@lune_formal','talking/lune','portraits/lune'])assert.ok(!BOOT_ASSETS.includes(key),key);
});
test('사냥 출발과 이어하기에는 선택한 사냥꾼 시트 및 적이 포함된다',()=>{
 const ready=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url),'utf8')).ready;
 for(const [hunter,keys] of [['neo',['actors/neo_cat','actors/neo_cat_attack','actors/neo_cat_cast']],['seohanbi',['actors/seohanbi_tiger']],['yeoni_pig',['ui/kfp_player']]]){
  const actual=huntAssets(hunter,ASSETS.enemies);for(const id of [...keys,'enemies/boss_hand']){assert.ok(actual.includes(id),id);assert.ok(ready.includes(id),id);}
 }
});
