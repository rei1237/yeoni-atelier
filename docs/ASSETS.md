# 도트 에셋 규격과 생성 기록

2026-10-25: 정식 에셋 156개 완료. 개발 전용 dev_temp_01만 의도적으로 도형 대체한다. 실제 PNG 로드 성공을 브라우저에서 확인했다. 실패한 이미지는 기존 도형 렌더러로 복귀한다.

## 공통 규격
- 생성 도구: 내장 image_gen. 한 번에 한 파일을 생성했다. 전체 원문 프롬프트·원본 파일명·별칭은 [art-prompts.json](art-prompts.json)에 기록한다.
- 사용자 승인 후처리: nearest-neighbor 크기 조정, 셀 정렬, RGB/RGBA8, 파일마다 32색 이하, 알파 0/255. 원본 생성 파일은 덮어쓰지 않았다.
- 광원 왼쪽 위, 남보라 외곽선, 크림·로즈·금색. 배경/타일은 불투명, 나머지는 투명 배경이다. 외부 폰트/CDN을 추가하지 않았다.
- 캐릭터 셀 32×32, 발 기준점 (16,30). 열 6프레임, 행 idle/walk/cook/serve/host/react/attack/hurt × 방향 down/left/right/up. 상태별 사용 프레임·fps는 레지스트리를 따른다.
- 생성 원본의 누락 포즈는 같은 방향의 가까운 포즈로 보완했다. 쓰지 않는 상태는 idle을 재사용한다. 8개 상태 모두를 독립 제작한 애니메이션이라고 주장하지 않는다. 작은 셀의 동작과 일부 방향은 후속 아트 검수 대상이다.
- 적: 4열, 8행, idle=0/walk=1/hurt=7. 정예 셀 64, 보스 96.
- 초상화: 셀 96×96, 열 입닫음/눈감음/작게열기/크게열기, 행 표정 순서. 110ms 입 움직임, 2–5초 눈깜빡임, 문장부호 180ms 휴지. reduced-motion이면 정지. legacyPortraits에 등록한 기존 가로형도 호환한다.
- 9-slice 프레임 48×48, 가장자리 12px. 말풍선·메뉴·사냥 아이콘 16px 또는 표의 크기. 변신은 8프레임 가로 시트이다.
- Canvas smoothing=false, 캐릭터는 정수 배율. 가구/타일/배경은 반응형 칸에 맞추므로 비정수 배율이 생길 수 있다.

## 등록과 검사
1. src/render/assets.js에 정의, 아래 표에 크기·상태를 기록한다.
2. PNG를 확인한 뒤 assets/manifest.json ready에 묶음/키를 추가한다.
3. node tools/check-assets.mjs: Node 내장 fs/zlib만 사용해 문서·레지스트리 크기, 색 수, 투명 배경, 알파 단계를 검사한다.
4. npm start에서 실제 화면을 확인한다. ready에 없는 키는 요청하지 않는다.

정규화 보조 도구는 tools/*normalize*.py, actor-detect.py 및 actor-grid-spec.json이다. Pillow가 필요하며 개인 원본 경로는 tools/*.local.json으로 분리한다(커밋하지 않음). art-prompts.json의 sourceFile을 로컬 생성 원본에 연결한 입력 목록을 사용한다.

## actors

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| actors/yun | 윤달 | assets/sprites/actors/yun.png | 192×1024 | 완료 |
| actors/seohanbi | 서한비 | assets/sprites/actors/seohanbi.png | 192×1024 | 완료 |
| actors/museong | 무성 | assets/sprites/actors/museong.png | 192×1024 | 완료 |
| actors/solv | 솔브 | assets/sprites/actors/solv.png | 192×1024 | 완료 |
| actors/bambi | 밤비 | assets/sprites/actors/bambi.png | 192×1024 | 완료 |
| actors/lune | 루네 | assets/sprites/actors/lune.png | 192×1024 | 완료 |
| actors/raven | 레이븐 | assets/sprites/actors/raven.png | 192×1024 | 완료 |
| actors/neo@crescent_tailcoat | 초승달 연미복 | assets/sprites/actors/neo@crescent_tailcoat.png | 192×1024 | 완료 |
| actors/neo@wood_suit | 청목 정장 | assets/sprites/actors/neo@wood_suit.png | 192×1024 | 완료 |
| actors/neo@blossom_haori | 벚꽃 저녁 | assets/sprites/actors/neo@blossom_haori.png | 192×1024 | 완료 |
| actors/neo@rain_coat | 비 갠 새벽 | assets/sprites/actors/neo@rain_coat.png | 192×1024 | 완료 |
| actors/neo@summer_linen | 여름의 여백 | assets/sprites/actors/neo@summer_linen.png | 192×1024 | 완료 |
| actors/neo@moonstone_robe | 월정석 예복 | assets/sprites/actors/neo@moonstone_robe.png | 192×1024 | 완료 |
| actors/neo@winter_coat | 한겨울 별자리 | assets/sprites/actors/neo@winter_coat.png | 192×1024 | 완료 |
| actors/yeoni@garden_apron | 연꽃 정원 앞치마 | assets/sprites/actors/yeoni@garden_apron.png | 192×1024 | 완료 |
| actors/neo@host_first | 달빛 첫인사 | assets/sprites/actors/neo@host_first.png | 192×1024 | 완료 |
| actors/yeoni@apron_spring | 봄빛 앞치마 | assets/sprites/actors/yeoni@apron_spring.png | 192×1024 | 완료 |
| actors/neo@vest_night | 밤하늘 조끼 | assets/sprites/actors/neo@vest_night.png | 192×1024 | 완료 |
| actors/yeoni | 연이 | assets/sprites/actors/yeoni.png | 192×1024 | 완료 |
| actors/yeoni_pig | 연이(꽃돼지) | assets/sprites/actors/yeoni_pig.png | 192×1024 | 완료 |
| actors/neo | 네오 | assets/sprites/actors/neo.png | 192×1024 | 완료 |
| actors/neo_cat | 영냥이 | assets/sprites/actors/neo_cat.png | 192×1024 | 완료 |
| actors/customer | 손님 | assets/sprites/actors/customer.png | 192×1024 | 완료 |
| actors/luna | 루나 | assets/sprites/actors/luna.png | 192×1024 | 완료 |
| actors/luna_sis | 루나 언니 | assets/sprites/actors/luna_sis.png | 192×1024 | 완료 |
| actors/cheongtokki | 청토끼 | assets/sprites/actors/cheongtokki.png | 192×1024 | 완료 |
| actors/moka | 모카 | assets/sprites/actors/moka.png | 192×1024 | 완료 |
| actors/dev_temp_01 | DEV 임시 동료 01 | assets/sprites/actors/dev_temp_01.png | 192×1024 | 초안 · 개발용 도형 유지 |

## enemies

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| enemies/shade_hand | 검은 손 | assets/sprites/enemies/shade_hand.png | 128×256 | 완료 |
| enemies/shade_bat | 그림자 박쥐(임시) | assets/sprites/enemies/shade_bat.png | 128×256 | 완료 |
| enemies/shade_blob | 그림자 덩어리(임시) | assets/sprites/enemies/shade_blob.png | 128×256 | 완료 |
| enemies/shade_wisp | 도깨비불(임시) | assets/sprites/enemies/shade_wisp.png | 128×256 | 완료 |
| enemies/elite_hand | 큰 검은 손(임시 정예) | assets/sprites/enemies/elite_hand.png | 256×512 | 완료 |
| enemies/boss_hand | 거대한 검은 손(임시 보스) | assets/sprites/enemies/boss_hand.png | 384×768 | 완료 |

## objects

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| objects/lotus_pot | 연꽃 수반 | assets/sprites/objects/lotus_pot.png | 32×32 | 완료 |
| objects/bamboo | 작은 대나무 | assets/sprites/objects/bamboo.png | 32×32 | 완료 |
| objects/garden_bench | 꽃길 벤치 | assets/sprites/objects/garden_bench.png | 64×32 | 완료 |
| objects/lotus_rug | 연꽃 원형 카펫 | assets/sprites/objects/lotus_rug.png | 64×64 | 완료 |
| objects/moon_lamp | 초승달 스탠드 | assets/sprites/objects/moon_lamp.png | 32×32 | 완료 |
| objects/velvet_sofa | 남보라 벨벳 소파 | assets/sprites/objects/velvet_sofa.png | 64×32 | 완료 |
| objects/star_carpet | 별자리 카펫 | assets/sprites/objects/star_carpet.png | 64×64 | 완료 |
| objects/record_shelf | 데스티노바 음반장 | assets/sprites/objects/record_shelf.png | 64×32 | 완료 |
| objects/tea_cabinet | 오행 찻잔장 | assets/sprites/objects/tea_cabinet.png | 64×32 | 완료 |
| objects/water_bowl | 푸른 물결 수반 | assets/sprites/objects/water_bowl.png | 32×32 | 완료 |
| objects/fire_lantern | 붉은 등불 | assets/sprites/objects/fire_lantern.png | 32×32 | 완료 |
| objects/earth_vase | 황토빛 항아리 | assets/sprites/objects/earth_vase.png | 32×32 | 완료 |
| objects/silver_bell | 은빛 풍경 | assets/sprites/objects/silver_bell.png | 32×32 | 완료 |
| objects/harvest_basket | 수확 바구니 | assets/sprites/objects/harvest_basket.png | 32×32 | 완료 |
| objects/herb_shelf | 허브 화분 선반 | assets/sprites/objects/herb_shelf.png | 64×32 | 완료 |
| objects/greenhouse_rug | 새싹 발매트 | assets/sprites/objects/greenhouse_rug.png | 64×64 | 완료 |
| objects/table | 테이블 | assets/sprites/objects/table.png | 32×32 | 완료 |
| objects/chair | 의자 | assets/sprites/objects/chair.png | 32×32 | 완료 |
| objects/drink | 음료 머신 | assets/sprites/objects/drink.png | 64×32 | 완료 |
| objects/oven | 오븐 | assets/sprites/objects/oven.png | 64×32 | 완료 |
| objects/pass | 서빙대 | assets/sprites/objects/pass.png | 64×32 | 완료 |
| objects/counter | 카운터 | assets/sprites/objects/counter.png | 32×64 | 완료 |
| objects/plant | 화분 | assets/sprites/objects/plant.png | 32×32 | 완료 |
| objects/bookshelf | 책장 | assets/sprites/objects/bookshelf.png | 64×32 | 완료 |
| objects/lamp | 별 조명 | assets/sprites/objects/lamp.png | 32×32 | 완료 |
| objects/rug | 꽃무늬 러그 | assets/sprites/objects/rug.png | 64×64 | 완료 |
| objects/pot | 조합 냄비 | assets/sprites/objects/pot.png | 32×32 | 완료 |

## icons

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| icons/berry | 딸기 | assets/sprites/icons/berry.png | 16×16 | 완료 |
| icons/rice | 쌀 | assets/sprites/icons/rice.png | 16×16 | 완료 |
| icons/pumpkin | 호박 | assets/sprites/icons/pumpkin.png | 16×16 | 완료 |
| icons/bean | 원두 | assets/sprites/icons/bean.png | 16×16 | 완료 |
| icons/milk | 우유 | assets/sprites/icons/milk.png | 16×16 | 완료 |
| icons/tea | 찻잎 | assets/sprites/icons/tea.png | 16×16 | 완료 |
| icons/flour | 밀가루 | assets/sprites/icons/flour.png | 16×16 | 완료 |
| icons/egg | 달걀 | assets/sprites/icons/egg.png | 16×16 | 완료 |
| icons/sugar | 설탕 | assets/sprites/icons/sugar.png | 16×16 | 완료 |
| icons/night_dew | 밤이슬 | assets/sprites/icons/night_dew.png | 16×16 | 완료 |
| icons/lotus_berry_tart | 연꽃 딸기 타르트 | assets/sprites/icons/lotus_berry_tart.png | 16×16 | 완료 |
| icons/moon_rice_bowl | 초승달 달걀밥 | assets/sprites/icons/moon_rice_bowl.png | 16×16 | 완료 |
| icons/golden_pumpkin_soup | 황금 호박 수프 | assets/sprites/icons/golden_pumpkin_soup.png | 16×16 | 완료 |
| icons/fortune_latte | 운세 라테 | assets/sprites/icons/fortune_latte.png | 16×16 | 완료 |
| icons/starlight_tea | 별빛 차 | assets/sprites/icons/starlight_tea.png | 16×16 | 완료 |
| icons/flower_cookie | 꽃 쿠키 | assets/sprites/icons/flower_cookie.png | 16×16 | 완료 |
| icons/moon_pudding | 달빛 푸딩 | assets/sprites/icons/moon_pudding.png | 16×16 | 완료 |
| icons/lucky_sand | 행운 샌드 | assets/sprites/icons/lucky_sand.png | 16×16 | 완료 |
| icons/moon_milk_tea | 달빛 밀크티 | assets/sprites/icons/moon_milk_tea.png | 16×16 | 완료 |
| icons/stardust_castella | 별가루 카스텔라 | assets/sprites/icons/stardust_castella.png | 16×16 | 완료 |
| icons/oink_cream_latte | 꿀꿀 크림 라테 | assets/sprites/icons/oink_cream_latte.png | 16×16 | 완료 |
| icons/night_dew_latte | 밤이슬 라테 | assets/sprites/icons/night_dew_latte.png | 16×16 | 완료 |
| icons/gem_s | 별조각(소) | assets/sprites/icons/gem_s.png | 16×16 | 완료 |
| icons/gem_m | 별조각(중) | assets/sprites/icons/gem_m.png | 16×16 | 완료 |
| icons/gem_l | 별조각(대) | assets/sprites/icons/gem_l.png | 16×16 | 완료 |
| icons/fish | 구운 생선 | assets/sprites/icons/fish.png | 16×16 | 완료 |
| icons/magnet | 수염 자석 | assets/sprites/icons/magnet.png | 16×16 | 완료 |
| icons/bomb | 달빛 폭탄 | assets/sprites/icons/bomb.png | 16×16 | 완료 |
| icons/chest | 별 상자 | assets/sprites/icons/chest.png | 16×16 | 완료 |
| icons/moonstone | 월정석 | assets/sprites/icons/moonstone.png | 16×16 | 완료 |
| icons/claw_glove | 고양이 발톱 장갑 | assets/sprites/icons/claw_glove.png | 16×16 | 완료 |
| icons/crescent_wand | 초승달 방울 지팡이 | assets/sprites/icons/crescent_wand.png | 16×16 | 완료 |
| icons/scale_vest | 생선 비늘 조끼 | assets/sprites/icons/scale_vest.png | 16×16 | 완료 |
| icons/fluff_cape | 솜뭉치 망토 | assets/sprites/icons/fluff_cape.png | 16×16 | 완료 |
| icons/fishbone_charm | 생선뼈 부적 | assets/sprites/icons/fishbone_charm.png | 16×16 | 완료 |
| icons/churu_magnet | 자석 츄르 | assets/sprites/icons/churu_magnet.png | 16×16 | 완료 |

## portraits

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| portraits/yun | 윤달 | assets/sprites/portraits/yun.png | 384×384 | 완료 |
| portraits/seohanbi | 서한비 | assets/sprites/portraits/seohanbi.png | 384×384 | 완료 |
| portraits/museong | 무성 | assets/sprites/portraits/museong.png | 384×384 | 완료 |
| portraits/solv | 솔브 | assets/sprites/portraits/solv.png | 384×384 | 완료 |
| portraits/bambi | 밤비 | assets/sprites/portraits/bambi.png | 384×384 | 완료 |
| portraits/lune | 루네 | assets/sprites/portraits/lune.png | 384×384 | 완료 |
| portraits/raven | 레이븐 | assets/sprites/portraits/raven.png | 384×384 | 완료 |
| portraits/neo@crescent_tailcoat | 초승달 연미복 | assets/sprites/portraits/neo@crescent_tailcoat.png | 384×384 | 완료 |
| portraits/neo@wood_suit | 청목 정장 | assets/sprites/portraits/neo@wood_suit.png | 384×384 | 완료 |
| portraits/neo@blossom_haori | 벚꽃 저녁 | assets/sprites/portraits/neo@blossom_haori.png | 384×384 | 완료 |
| portraits/neo@rain_coat | 비 갠 새벽 | assets/sprites/portraits/neo@rain_coat.png | 384×384 | 완료 |
| portraits/neo@summer_linen | 여름의 여백 | assets/sprites/portraits/neo@summer_linen.png | 384×384 | 완료 |
| portraits/neo@moonstone_robe | 월정석 예복 | assets/sprites/portraits/neo@moonstone_robe.png | 384×384 | 완료 |
| portraits/neo@winter_coat | 한겨울 별자리 | assets/sprites/portraits/neo@winter_coat.png | 384×384 | 완료 |
| portraits/yeoni@garden_apron | 연꽃 정원 앞치마 | assets/sprites/portraits/yeoni@garden_apron.png | 384×480 | 완료 |
| portraits/neo@host_first | 달빛 첫인사 | assets/sprites/portraits/neo@host_first.png | 384×384 | 완료 |
| portraits/yeoni@apron_spring | 봄빛 앞치마 | assets/sprites/portraits/yeoni@apron_spring.png | 384×480 | 완료 |
| portraits/neo@vest_night | 밤하늘 조끼 | assets/sprites/portraits/neo@vest_night.png | 384×384 | 완료 |
| portraits/yeoni | 연이 | assets/sprites/portraits/yeoni.png | 384×480 | 완료 |
| portraits/yeoni_pig | 연이(꽃돼지) | assets/sprites/portraits/yeoni_pig.png | 384×384 | 완료 |
| portraits/neo | 네오 | assets/sprites/portraits/neo.png | 384×384 | 완료 |
| portraits/neo_cat | 영냥이 | assets/sprites/portraits/neo_cat.png | 384×384 | 완료 |
| portraits/luna | 루나 | assets/sprites/portraits/luna.png | 384×384 | 완료 |
| portraits/luna_sis | 루나 언니 | assets/sprites/portraits/luna_sis.png | 384×384 | 완료 |
| portraits/cheongtokki | 청토끼 | assets/sprites/portraits/cheongtokki.png | 384×288 | 완료 |
| portraits/moka | 모카 | assets/sprites/portraits/moka.png | 384×288 | 완료 |

표정 행 순서:

- yun: normal, smile, serious, surprised
- seohanbi: normal, smile, serious, surprised
- museong: normal, smile, serious, surprised
- solv: normal, smile, serious, surprised
- bambi: normal, smile, serious, surprised
- lune: normal, smile, serious, surprised
- raven: normal, smile, serious, surprised
- neo@crescent_tailcoat: normal, smile, serious, flustered
- neo@wood_suit: normal, smile, serious, flustered
- neo@blossom_haori: normal, smile, serious, flustered
- neo@rain_coat: normal, smile, serious, flustered
- neo@summer_linen: normal, smile, serious, flustered
- neo@moonstone_robe: normal, smile, serious, flustered
- neo@winter_coat: normal, smile, serious, flustered
- yeoni@garden_apron: normal, smile, surprised, sulky, determined
- neo@host_first: normal, smile, serious, flustered
- yeoni@apron_spring: normal, smile, surprised, sulky, determined
- neo@vest_night: normal, smile, serious, flustered
- yeoni: normal, smile, surprised, sulky, determined
- yeoni_pig: normal, smile, surprised, sulky
- neo: normal, smile, serious, flustered
- neo_cat: normal, smug, serious, surprised
- luna: normal, smile, cry, surprised
- luna_sis: normal, smile, tired, serious
- cheongtokki: normal, smile, smug
- moka: normal, smug, angry

## tiles

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| tiles/cafe_floor | 카페 바닥 | assets/tiles/cafe_floor.png | 32×32 | 완료 |
| tiles/cafe_wall | 카페 벽 | assets/tiles/cafe_wall.png | 32×32 | 완료 |
| tiles/town_street | 카페 앞 마을 길(마을 화면 배경) | assets/tiles/town_street.png | 32×32 | 완료 |
| tiles/river_field | 사주의 강 밤 들판 | assets/tiles/river_field.png | 32×32 | 완료 |

## backgrounds

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| backgrounds/atelier_lit | atelier_lit | assets/backgrounds/atelier_lit.png | 720×600 | 완료 |
| backgrounds/atelier_dark | atelier_dark | assets/backgrounds/atelier_dark.png | 720×600 | 완료 |
| backgrounds/river_night | river_night | assets/backgrounds/river_night.png | 720×600 | 완료 |
| backgrounds/dressroom | dressroom | assets/backgrounds/dressroom.png | 720×600 | 완료 |
| backgrounds/farm | farm | assets/backgrounds/farm.png | 720×400 | 완료 |

## ui

| 키 | 이름 | 경로 | PNG 크기 | 상태 |
| --- | --- | --- | --- | --- |
| ui/town-map-spring | spring 마을 | assets/ui/town-map-spring.png | 720×600 | 완료 |
| ui/town-map-summer | summer 마을 | assets/ui/town-map-summer.png | 720×600 | 완료 |
| ui/town-map-autumn | autumn 마을 | assets/ui/town-map-autumn.png | 720×600 | 완료 |
| ui/town-map-winter | winter 마을 | assets/ui/town-map-winter.png | 720×600 | 완료 |
| ui/town-node-atelier | town-node-atelier | assets/ui/town-node-atelier.png | 48×48 | 완료 |
| ui/town-node-expand | town-node-expand | assets/ui/town-node-expand.png | 48×48 | 완료 |
| ui/town-node-moka | town-node-moka | assets/ui/town-node-moka.png | 48×48 | 완료 |
| ui/town-node-luna | town-node-luna | assets/ui/town-node-luna.png | 48×48 | 완료 |
| ui/town-node-gear | town-node-gear | assets/ui/town-node-gear.png | 48×48 | 완료 |
| ui/town-node-hunt | town-node-hunt | assets/ui/town-node-hunt.png | 48×48 | 완료 |
| ui/heart-full | heart-full | assets/ui/heart-full.png | 16×16 | 완료 |
| ui/heart-empty | heart-empty | assets/ui/heart-empty.png | 16×16 | 완료 |
| ui/sos | sos | assets/ui/sos.png | 32×32 | 완료 |
| ui/stress-calm | stress-calm | assets/ui/stress-calm.png | 32×32 | 완료 |
| ui/stress-tired | stress-tired | assets/ui/stress-tired.png | 32×32 | 완료 |
| ui/stress-limit | stress-limit | assets/ui/stress-limit.png | 32×32 | 완료 |
| ui/frame-panel | frame-panel | assets/ui/frame-panel.png | 48×48 | 완료 |
| ui/frame-button | frame-button | assets/ui/frame-button.png | 48×48 | 완료 |
| ui/frame-tab | frame-tab | assets/ui/frame-tab.png | 48×48 | 완료 |
| ui/frame-card | frame-card | assets/ui/frame-card.png | 48×48 | 완료 |
| ui/transform | transform | assets/ui/transform.png | 256×32 | 완료 |
| ui/transform-large | transform-large | assets/ui/transform-large.png | 768×96 | 완료 |
| ui/moon-glint | moon-glint | assets/ui/moon-glint.png | 32×32 | 완료 |
| ui/push-lines | push-lines | assets/ui/push-lines.png | 96×96 | 완료 |
| ui/ledger | ledger | assets/ui/ledger.png | 32×32 | 완료 |

기본 의상 actors/portraits의 neo@vest_night와 yeoni@apron_spring은 해당 기본 인물 시트의 별칭 파일이다. 나머지는 개별 생성 후 정규화했다. 월정석 로브의 누락 행은 확인한 15개 행 중심으로 다시 맞췄다.
