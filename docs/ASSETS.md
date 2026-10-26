# 일러스트 에셋 규격과 생성 기록

2026-10-25 최신 사용자 요청: 도트 대신 고급스러운 생성 일러스트·스프라이트. 기존 32색·32px·최근접 보간 규칙을 대체한다. 게임 로직과 저장 값은 그림 유무에 의존하지 않는다.

## 공통 규격
- 내장 image_gen으로 파일별 생성. 전체 원문 프롬프트와 원본 파일명은 [art-prompts.json](art-prompts.json)에 기록한다. PNG 원본은 보존한다.
- 부드러운 애니메이션풍 수채·과슈, 크림·로즈골드·남색, 안티앨리어싱과 반투명 가장자리. 캐릭터·가구·아이콘은 투명 배경, 장면·타일은 불투명이다.
- 배포 파일은 WebP 품질 85. tools/illustration-export.py로 셀 정렬, Lanczos 크기 조정, 알파 유지, 압축 후 디코딩 확인. 개인 경로 입력은 *.local.json으로 분리한다.
- 캐릭터: 96×96 셀, 발 기준점 (48,90), 4열 × 12행. 방향 down/left/right/up 각각 idle/walk/대표 행동 3행. 상태별 stateRows를 읽는다. cook/serve/host/react/attack/hurt는 대표 행동 행을 재사용한다. 8가지 독립 동작을 제작했다고 주장하지 않는다.
- 적: 4열 × 3행 idle/walk/hurt. 일반 셀 96, 정예 192, 보스 288.
- 대화 초상화: 192px 셀, 4열 입닫음/눈감음/작게말하기/크게말하기 × 표정 행. 생성 시 열 순서를 런타임 계약에 맞춰 바꾼다. 110ms 말하기·2–5초 깜빡임·문장부호 휴지·reduced-motion 유지.
- 가구는 바닥 1칸당 128px, 아이콘 96px, 타일 128px, 프레임 144px/가장자리 36px. 효과는 8프레임 가로 시트.
- Canvas imageSmoothingEnabled=true/high, CSS image-rendering:auto. 96px 셀을 32px 화면에 그려도 넘치지 않도록 실제 요청 크기로 축소한다.
- 누락된 포즈는 같은 방향의 가까운 포즈를 재사용할 수 있다. 생성된 표정·손·방향 연결은 전문 아티스트의 추가 검수 대상이다. 기본 의상 4개는 기본 캐릭터 그림 별칭이다.

## 등록과 검사
1. src/render/assets.js 정의와 아래 표를 함께 유지한다.
2. 실제 확인한 키만 assets/manifest.json ready에 등록한다. DEV 임시 동료만 의도적으로 도형이다.
3. node tools/check-assets.mjs는 WebP 컨테이너·크기·알파 채널·문서 표·프롬프트 기록을 검사한다. 개별 1.5MB, 전체 15MB 전송 예산을 넘으면 실패한다. 픽셀 내용의 미적 품질은 자동 판정하지 않는다.
   - 2026-10-26 현재 전체 17.77MB로 예산을 넘는다(이전 12.89MB, 인계 대화 16종·의상·초상화 추가분). 한도는 올리지 않았다. 확인한 근거: 바이트가 같은 중복 파일 0개. 부팅 때는 BOOT_ASSETS 95파일 1.53MB만 받고 나머지는 처음 쓸 때 요청한다(지연 로딩 적용됨). 기존 파이프라인 품질(q90)로 전부 다시 인코딩해도 17.05MB(talking 2.11→1.71MB가 대부분). 15MB 아래로 내리려면 시트 품질을 q80 이하로 낮추거나 해상도를 줄여야 하므로, 아트 검수 없이 하지 않고 후속 결정으로 남긴다.
4. 실제 Chromium 화면에서 로드 누락·404·잘림·모바일 축소 결과를 확인한다.

이전 tools/*normalize*.py와 actor-grid-spec.json은 원래 픽셀 아트 기록이며 현재 제작에는 illustration-export.py를 쓴다.

## actors

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## enemies

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## objects

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## icons

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## portraits

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## tiles

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## backgrounds

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

## ui

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |

미완료(의도적 개발 전용): actors/dev_temp_01. 일반 게임에서는 쓰지 않는다.

## 2026-10-26 검증 가능한 실제 출고 규격

새 일러스트는 원본을 보존하고 투명 여백 6px, 동일 배율, 128px 셀 발 위치 122px로 기계적으로 정규화했다. 이동은 아래·왼쪽·오른쪽·위 각 4프레임이며 대화 초상화는 정적인 384×576이다. 네오·루나·루나 언니의 대기와 연이의 대기·인사·결제, 영냥이 공격은 별도 프레임을 사용한다. 그 외 인물의 대기와 서빙·정리는 기존 자세에 몸·팔 움직임 및 주문 소품을 합성한다. 모든 동작이 개별 수작업 프레임인 것은 아니다.

| 키 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- |
| actors/yun | assets/illustrated/actors/yun@yun_formal.webp | 512×512 | 완료 |
| actors/seohanbi | assets/illustrated/actors/seohanbi.webp | 512×512 | 완료 |
| actors/museong | assets/illustrated/actors/museong@museong_formal.webp | 512×512 | 완료 |
| actors/solv | assets/illustrated/actors/solv@solv_formal.webp | 512×512 | 완료 |
| actors/bambi | assets/illustrated/actors/bambi@bambi_formal.webp | 512×512 | 완료 |
| actors/lune | assets/illustrated/actors/lune@lune_formal.webp | 512×512 | 완료 |
| actors/raven | assets/illustrated/actors/raven@raven_formal.webp | 512×512 | 완료 |
| actors/neo@crescent_tailcoat | assets/illustrated/actors/neo@crescent_tailcoat.webp | 512×512 | 완료 |
| actors/neo@wood_suit | assets/illustrated/actors/neo@wood_suit.webp | 512×512 | 완료 |
| actors/neo@blossom_haori | assets/illustrated/actors/neo@blossom_haori.webp | 512×512 | 완료 |
| actors/neo@rain_coat | assets/illustrated/actors/neo@rain_coat.webp | 512×512 | 완료 |
| actors/neo@summer_linen | assets/illustrated/actors/neo@summer_linen.webp | 512×512 | 완료 |
| actors/neo@moonstone_robe | assets/illustrated/actors/neo@moonstone_robe.webp | 512×512 | 완료 |
| actors/neo@winter_coat | assets/illustrated/actors/neo@winter_coat.webp | 512×512 | 완료 |
| actors/yeoni@garden_apron | assets/illustrated/actors/yeoni.webp | 512×512 | 완료 |
| actors/neo@host_first | assets/illustrated/actors/neo@host_first.webp | 512×512 | 완료 |
| actors/yeoni@apron_spring | assets/illustrated/actors/yeoni.webp | 512×512 | 완료 |
| actors/neo@vest_night | assets/illustrated/actors/neo@vest_night.webp | 512×512 | 완료 |
| actors/yeoni | assets/illustrated/actors/yeoni.webp | 512×512 | 완료 |
| actors/yeoni_pig | assets/illustrated/actors/yeoni_pig.webp | 512×512 | 완료 |
| actors/neo | assets/illustrated/actors/neo.webp | 512×512 | 완료 |
| actors/neo_cat | assets/illustrated/actors/neo_cat.webp | 512×512 | 완료 |
| actors/customer | assets/illustrated/actors/customer.webp | 512×512 | 완료 |
| actors/luna | assets/illustrated/actors/luna.webp | 512×512 | 완료 |
| actors/luna_sis | assets/illustrated/actors/luna_sis.webp | 512×512 | 완료 |
| actors/cheongtokki | assets/illustrated/actors/cheongtokki.webp | 512×512 | 완료 |
| actors/moka | assets/illustrated/actors/moka.webp | 512×512 | 완료 |
| enemies/shade_hand | assets/illustrated/enemies/shade_hand.webp | 512×384 | 완료 |
| enemies/shade_bat | assets/illustrated/enemies/shade_bat.webp | 512×384 | 완료 |
| enemies/shade_blob | assets/illustrated/enemies/shade_blob.webp | 512×384 | 완료 |
| enemies/shade_wisp | assets/illustrated/enemies/shade_wisp.webp | 512×384 | 완료 |
| enemies/elite_hand | assets/illustrated/enemies/elite_hand.webp | 512×384 | 완료 |
| enemies/boss_hand | assets/illustrated/enemies/boss_hand.webp | 512×384 | 완료 |
| objects/lotus_pot | assets/illustrated/objects/lotus_pot.webp | 128×128 | 완료 |
| objects/bamboo | assets/illustrated/objects/bamboo.webp | 128×128 | 완료 |
| objects/garden_bench | assets/illustrated/objects/garden_bench.webp | 256×128 | 완료 |
| objects/lotus_rug | assets/illustrated/objects/lotus_rug.webp | 256×256 | 완료 |
| objects/moon_lamp | assets/illustrated/objects/moon_lamp.webp | 128×128 | 완료 |
| objects/velvet_sofa | assets/illustrated/objects/velvet_sofa.webp | 256×128 | 완료 |
| objects/star_carpet | assets/illustrated/objects/star_carpet.webp | 256×256 | 완료 |
| objects/record_shelf | assets/illustrated/objects/record_shelf.webp | 256×128 | 완료 |
| objects/tea_cabinet | assets/illustrated/objects/tea_cabinet.webp | 256×128 | 완료 |
| objects/water_bowl | assets/illustrated/objects/water_bowl.webp | 128×128 | 완료 |
| objects/fire_lantern | assets/illustrated/objects/fire_lantern.webp | 128×128 | 완료 |
| objects/earth_vase | assets/illustrated/objects/earth_vase.webp | 128×128 | 완료 |
| objects/silver_bell | assets/illustrated/objects/silver_bell.webp | 128×128 | 완료 |
| objects/harvest_basket | assets/illustrated/objects/harvest_basket.webp | 128×128 | 완료 |
| objects/herb_shelf | assets/illustrated/objects/herb_shelf.webp | 256×128 | 완료 |
| objects/greenhouse_rug | assets/illustrated/objects/greenhouse_rug.webp | 256×256 | 완료 |
| objects/table | assets/illustrated/objects/table.webp | 128×128 | 완료 |
| objects/chair | assets/illustrated/objects/chair.webp | 128×128 | 완료 |
| objects/drink | assets/illustrated/objects/drink.webp | 256×128 | 완료 |
| objects/oven | assets/illustrated/objects/oven.webp | 256×128 | 완료 |
| objects/pass | assets/illustrated/objects/pass.webp | 256×128 | 완료 |
| objects/counter | assets/illustrated/objects/counter.webp | 128×256 | 완료 |
| objects/plant | assets/illustrated/objects/plant.webp | 128×128 | 완료 |
| objects/bookshelf | assets/illustrated/objects/bookshelf.webp | 256×128 | 완료 |
| objects/lamp | assets/illustrated/objects/lamp.webp | 128×128 | 완료 |
| objects/rug | assets/illustrated/objects/rug.webp | 256×256 | 완료 |
| objects/pot | assets/illustrated/objects/pot.webp | 128×128 | 완료 |
| icons/berry | assets/sprites/icons/berry.webp | 96×96 | 완료 |
| icons/rice | assets/sprites/icons/rice.webp | 96×96 | 완료 |
| icons/pumpkin | assets/sprites/icons/pumpkin.webp | 96×96 | 완료 |
| icons/bean | assets/sprites/icons/bean.webp | 96×96 | 완료 |
| icons/milk | assets/sprites/icons/milk.webp | 96×96 | 완료 |
| icons/tea | assets/sprites/icons/tea.webp | 96×96 | 완료 |
| icons/flour | assets/sprites/icons/flour.webp | 96×96 | 완료 |
| icons/egg | assets/sprites/icons/egg.webp | 96×96 | 완료 |
| icons/sugar | assets/sprites/icons/sugar.webp | 96×96 | 완료 |
| icons/night_dew | assets/sprites/icons/night_dew.webp | 96×96 | 완료 |
| icons/lotus_berry_tart | assets/sprites/icons/lotus_berry_tart.webp | 96×96 | 완료 |
| icons/moon_rice_bowl | assets/sprites/icons/moon_rice_bowl.webp | 96×96 | 완료 |
| icons/golden_pumpkin_soup | assets/sprites/icons/golden_pumpkin_soup.webp | 96×96 | 완료 |
| icons/fortune_latte | assets/sprites/icons/fortune_latte.webp | 96×96 | 완료 |
| icons/starlight_tea | assets/sprites/icons/starlight_tea.webp | 96×96 | 완료 |
| icons/flower_cookie | assets/sprites/icons/flower_cookie.webp | 96×96 | 완료 |
| icons/moon_pudding | assets/sprites/icons/moon_pudding.webp | 96×96 | 완료 |
| icons/lucky_sand | assets/sprites/icons/lucky_sand.webp | 96×96 | 완료 |
| icons/moon_milk_tea | assets/sprites/icons/moon_milk_tea.webp | 96×96 | 완료 |
| icons/stardust_castella | assets/sprites/icons/stardust_castella.webp | 96×96 | 완료 |
| icons/oink_cream_latte | assets/sprites/icons/oink_cream_latte.webp | 96×96 | 완료 |
| icons/night_dew_latte | assets/sprites/icons/night_dew_latte.webp | 96×96 | 완료 |
| icons/gem_s | assets/sprites/icons/gem_s.webp | 96×96 | 완료 |
| icons/gem_m | assets/sprites/icons/gem_m.webp | 96×96 | 완료 |
| icons/gem_l | assets/sprites/icons/gem_l.webp | 96×96 | 완료 |
| icons/fish | assets/sprites/icons/fish.webp | 96×96 | 완료 |
| icons/magnet | assets/sprites/icons/magnet.webp | 96×96 | 완료 |
| icons/bomb | assets/sprites/icons/bomb.webp | 96×96 | 완료 |
| icons/chest | assets/sprites/icons/chest.webp | 96×96 | 완료 |
| icons/moonstone | assets/sprites/icons/moonstone.webp | 96×96 | 완료 |
| icons/claw_glove | assets/sprites/icons/claw_glove.webp | 96×96 | 완료 |
| icons/crescent_wand | assets/sprites/icons/crescent_wand.webp | 96×96 | 완료 |
| icons/scale_vest | assets/sprites/icons/scale_vest.webp | 96×96 | 완료 |
| icons/fluff_cape | assets/sprites/icons/fluff_cape.webp | 96×96 | 완료 |
| icons/fishbone_charm | assets/sprites/icons/fishbone_charm.webp | 96×96 | 완료 |
| icons/churu_magnet | assets/sprites/icons/churu_magnet.webp | 96×96 | 완료 |
| portraits/yun | assets/illustrated/portraits/yun.webp | 384×576 | 완료 |
| portraits/seohanbi | assets/illustrated/portraits/seohanbi.webp | 384×576 | 완료 |
| portraits/museong | assets/illustrated/portraits/museong.webp | 384×576 | 완료 |
| portraits/solv | assets/illustrated/portraits/solv.webp | 384×576 | 완료 |
| portraits/bambi | assets/illustrated/portraits/bambi.webp | 384×576 | 완료 |
| portraits/lune | assets/illustrated/portraits/lune.webp | 384×576 | 완료 |
| portraits/raven | assets/illustrated/portraits/raven.webp | 384×576 | 완료 |
| portraits/neo@crescent_tailcoat | assets/illustrated/portraits/neo@crescent_tailcoat.webp | 384×576 | 완료 |
| portraits/neo@wood_suit | assets/illustrated/portraits/neo@wood_suit.webp | 384×576 | 완료 |
| portraits/neo@blossom_haori | assets/illustrated/portraits/neo@blossom_haori.webp | 384×576 | 완료 |
| portraits/neo@rain_coat | assets/illustrated/portraits/neo@rain_coat.webp | 384×576 | 완료 |
| portraits/neo@summer_linen | assets/illustrated/portraits/neo@summer_linen.webp | 384×576 | 완료 |
| portraits/neo@moonstone_robe | assets/illustrated/portraits/neo@moonstone_robe.webp | 384×576 | 완료 |
| portraits/neo@winter_coat | assets/illustrated/portraits/neo@winter_coat.webp | 384×576 | 완료 |
| portraits/yeoni@garden_apron | assets/illustrated/portraits/yeoni.webp | 384×576 | 완료 |
| portraits/neo@host_first | assets/illustrated/portraits/neo@host_first.webp | 384×576 | 완료 |
| portraits/yeoni@apron_spring | assets/illustrated/portraits/yeoni.webp | 384×576 | 완료 |
| portraits/neo@vest_night | assets/illustrated/portraits/neo@vest_night.webp | 384×576 | 완료 |
| portraits/yeoni | assets/illustrated/portraits/yeoni.webp | 384×576 | 완료 |
| portraits/yeoni_pig | assets/illustrated/portraits/yeoni_pig.webp | 384×576 | 완료 |
| portraits/neo | assets/illustrated/portraits/neo.webp | 384×576 | 완료 |
| portraits/neo_cat | assets/illustrated/portraits/neo_cat.webp | 384×576 | 완료 |
| portraits/luna | assets/illustrated/portraits/luna.webp | 320×384 | 완료 |
| portraits/luna_sis | assets/illustrated/portraits/luna_sis.webp | 320×384 | 완료 |
| portraits/cheongtokki | assets/illustrated/portraits/cheongtokki.webp | 320×384 | 완료 |
| portraits/moka | assets/illustrated/portraits/moka.webp | 384×576 | 완료 |
| tiles/cafe_floor | assets/tiles/cafe_floor.webp | 128×128 | 완료 |
| tiles/cafe_wall | assets/tiles/cafe_wall.webp | 128×128 | 완료 |
| tiles/town_street | assets/tiles/town_street.webp | 128×128 | 완료 |
| tiles/river_field | assets/tiles/river_field.webp | 128×128 | 완료 |
| backgrounds/atelier_lit | assets/illustrated/backgrounds/atelier_lit.webp | 960×640 | 완료 |
| backgrounds/atelier_dark | assets/backgrounds/atelier_dark.webp | 720×600 | 완료 |
| backgrounds/river_night | assets/backgrounds/river_night.webp | 720×600 | 완료 |
| backgrounds/dressroom | assets/illustrated/backgrounds/dressroom.webp | 960×640 | 완료 |
| backgrounds/farm | assets/illustrated/backgrounds/farm.webp | 960×640 | 완료 |
| ui/town-map-spring | assets/ui/town-map-spring.webp | 720×600 | 완료 |
| ui/town-map-summer | assets/ui/town-map-summer.webp | 720×600 | 완료 |
| ui/town-map-autumn | assets/ui/town-map-autumn.webp | 720×600 | 완료 |
| ui/town-map-winter | assets/ui/town-map-winter.webp | 720×600 | 완료 |
| ui/town-node-atelier | assets/ui/town-node-atelier.webp | 128×128 | 완료 |
| ui/town-node-expand | assets/ui/town-node-expand.webp | 128×128 | 완료 |
| ui/town-node-moka | assets/ui/town-node-moka.webp | 128×128 | 완료 |
| ui/town-node-luna | assets/ui/town-node-luna.webp | 128×128 | 완료 |
| ui/town-node-gear | assets/ui/town-node-gear.webp | 128×128 | 완료 |
| ui/town-node-hunt | assets/ui/town-node-hunt.webp | 128×128 | 완료 |
| ui/heart-full | assets/ui/heart-full.webp | 128×128 | 완료 |
| ui/heart-empty | assets/ui/heart-empty.webp | 128×128 | 완료 |
| ui/sos | assets/ui/sos.webp | 128×128 | 완료 |
| ui/stress-calm | assets/ui/stress-calm.webp | 128×128 | 완료 |
| ui/stress-tired | assets/ui/stress-tired.webp | 128×128 | 완료 |
| ui/stress-limit | assets/ui/stress-limit.webp | 128×128 | 완료 |
| ui/frame-panel | assets/ui/frame-panel.webp | 144×144 | 완료 |
| ui/frame-button | assets/ui/frame-button.webp | 144×144 | 완료 |
| ui/frame-tab | assets/ui/frame-tab.webp | 144×144 | 완료 |
| ui/frame-card | assets/ui/frame-card.webp | 144×144 | 완료 |
| ui/transform | assets/ui/transform.webp | 1024×128 | 완료 |
| ui/transform-large | assets/ui/transform-large.webp | 1536×192 | 완료 |
| ui/moon-glint | assets/ui/moon-glint.webp | 128×128 | 완료 |
| ui/push-lines | assets/ui/push-lines.webp | 128×128 | 완료 |
| ui/ledger | assets/ui/ledger.webp | 128×128 | 완료 |
| actors/seohanbi_tiger | assets/illustrated/actors/seohanbi_tiger.webp | 512×512 | 완료 |
| actors/solv@solv_formal | assets/illustrated/actors/solv@solv_formal.webp | 512×512 | 완료 |
| actors/solv@solv_moon | assets/illustrated/actors/solv@solv_moon.webp | 512×512 | 완료 |
| actors/solv@solv_garden | assets/illustrated/actors/solv@solv_garden.webp | 512×512 | 완료 |
| actors/bambi@bambi_formal | assets/illustrated/actors/bambi@bambi_formal.webp | 512×512 | 완료 |
| actors/bambi@bambi_moon | assets/illustrated/actors/bambi@bambi_moon.webp | 512×512 | 완료 |
| actors/bambi@bambi_garden | assets/illustrated/actors/bambi@bambi_garden.webp | 512×512 | 완료 |
| actors/lune@lune_formal | assets/illustrated/actors/lune@lune_formal.webp | 512×512 | 완료 |
| actors/lune@lune_moon | assets/illustrated/actors/lune@lune_moon.webp | 512×512 | 완료 |
| actors/lune@lune_garden | assets/illustrated/actors/lune@lune_garden.webp | 512×512 | 완료 |
| actors/raven@raven_formal | assets/illustrated/actors/raven@raven_formal.webp | 512×512 | 완료 |
| actors/raven@raven_moon | assets/illustrated/actors/raven@raven_moon.webp | 512×512 | 완료 |
| actors/raven@raven_garden | assets/illustrated/actors/raven@raven_garden.webp | 512×512 | 완료 |
| actors/yun@yun_formal | assets/illustrated/actors/yun@yun_formal.webp | 512×512 | 완료 |
| actors/yun@yun_moon | assets/illustrated/actors/yun@yun_moon.webp | 512×512 | 완료 |
| actors/yun@yun_garden | assets/illustrated/actors/yun@yun_garden.webp | 512×512 | 완료 |
| actors/museong@museong_formal | assets/illustrated/actors/museong@museong_formal.webp | 512×512 | 완료 |
| actors/museong@museong_moon | assets/illustrated/actors/museong@museong_moon.webp | 512×512 | 완료 |
| actors/museong@museong_garden | assets/illustrated/actors/museong@museong_garden.webp | 512×512 | 완료 |
| actors/solv@solv_swim | assets/illustrated/actors/solv@solv_swim.webp | 512×512 | 완료 |
| actors/bambi@bambi_swim | assets/illustrated/actors/bambi@bambi_swim.webp | 512×512 | 완료 |
| actors/lune@lune_swim | assets/illustrated/actors/lune@lune_swim.webp | 512×512 | 완료 |
| actors/raven@raven_swim | assets/illustrated/actors/raven@raven_swim.webp | 512×512 | 완료 |
| actors/neo@neo_swim | assets/illustrated/actors/neo@neo_swim.webp | 512×512 | 완료 |
| enemies/thorn | assets/illustrated/enemies/thorn.webp | 512×384 | 완료 |
| enemies/clock | assets/illustrated/enemies/clock.webp | 512×384 | 완료 |
| enemies/blue_rabbit | assets/illustrated/enemies/blue_rabbit.webp | 512×384 | 완료 |
| enemies/heukwol_fragment | assets/illustrated/enemies/heukwol_fragment.webp | 512×384 | 완료 |
| enemies/blue_brute | assets/illustrated/enemies/blue_rabbit.webp | 512×384 | 완료 |
| backgrounds/title | assets/illustrated/backgrounds/title.webp | 768×1152 | 완료 |
| portraits/yun@yun_formal | assets/illustrated/portraits/yun@yun_formal.webp | 384×576 | 완료 |
| portraits/yun@yun_moon | assets/illustrated/portraits/yun@yun_moon.webp | 384×576 | 완료 |
| portraits/yun@yun_garden | assets/illustrated/portraits/yun@yun_garden.webp | 384×576 | 완료 |
| portraits/yun@yun_swim | assets/illustrated/portraits/yun.webp | 384×576 | 완료 |
| portraits/museong@museong_formal | assets/illustrated/portraits/museong@museong_formal.webp | 384×576 | 완료 |
| portraits/museong@museong_moon | assets/illustrated/portraits/museong@museong_moon.webp | 384×576 | 완료 |
| portraits/museong@museong_garden | assets/illustrated/portraits/museong@museong_garden.webp | 384×576 | 완료 |
| portraits/museong@museong_swim | assets/illustrated/portraits/museong.webp | 384×576 | 완료 |
| portraits/solv@solv_formal | assets/illustrated/portraits/solv@solv_formal.webp | 384×576 | 완료 |
| portraits/solv@solv_moon | assets/illustrated/portraits/solv@solv_moon.webp | 384×576 | 완료 |
| portraits/solv@solv_garden | assets/illustrated/portraits/solv@solv_garden.webp | 384×576 | 완료 |
| portraits/solv@solv_swim | assets/illustrated/portraits/solv@solv_swim.webp | 384×576 | 완료 |
| portraits/bambi@bambi_formal | assets/illustrated/portraits/bambi@bambi_formal.webp | 384×576 | 완료 |
| portraits/bambi@bambi_moon | assets/illustrated/portraits/bambi@bambi_moon.webp | 384×576 | 완료 |
| portraits/bambi@bambi_garden | assets/illustrated/portraits/bambi@bambi_garden.webp | 384×576 | 완료 |
| portraits/bambi@bambi_swim | assets/illustrated/portraits/bambi@bambi_swim.webp | 384×576 | 완료 |
| portraits/lune@lune_formal | assets/illustrated/portraits/lune@lune_formal.webp | 384×576 | 완료 |
| portraits/lune@lune_moon | assets/illustrated/portraits/lune@lune_moon.webp | 384×576 | 완료 |
| portraits/lune@lune_garden | assets/illustrated/portraits/lune@lune_garden.webp | 384×576 | 완료 |
| portraits/lune@lune_swim | assets/illustrated/portraits/lune@lune_swim.webp | 384×576 | 완료 |
| portraits/raven@raven_formal | assets/illustrated/portraits/raven@raven_formal.webp | 384×576 | 완료 |
| portraits/raven@raven_moon | assets/illustrated/portraits/raven@raven_moon.webp | 384×576 | 완료 |
| portraits/raven@raven_garden | assets/illustrated/portraits/raven@raven_garden.webp | 384×576 | 완료 |
| portraits/raven@raven_swim | assets/illustrated/portraits/raven@raven_swim.webp | 384×576 | 완료 |
| portraits/neo@neo_swim | assets/illustrated/portraits/neo@neo_swim.webp | 384×576 | 완료 |
| objects/flower_cart | assets/illustrated/objects/flower_cart.webp | 128×128 | 완료 |
| skills/bolt | assets/illustrated/skills/bolt.webp | 160×160 | 완료 |
| skills/orbit | assets/illustrated/skills/orbit.webp | 160×160 | 완료 |
| skills/crescent | assets/illustrated/skills/crescent.webp | 160×160 | 완료 |
| skills/aura | assets/illustrated/skills/aura.webp | 160×160 | 완료 |
| skills/tarot | assets/illustrated/skills/tarot.webp | 160×160 | 완료 |
| skills/paw | assets/illustrated/skills/paw.webp | 160×160 | 완료 |
| skills/hat | assets/illustrated/skills/hat.webp | 160×160 | 완료 |
| skills/bell | assets/illustrated/skills/bell.webp | 160×160 | 완료 |
| skills/fish_stock | assets/illustrated/skills/fish_stock.webp | 160×160 | 완료 |
| skills/whisker | assets/illustrated/skills/whisker.webp | 160×160 | 완료 |
| skills/luck | assets/illustrated/skills/luck.webp | 160×160 | 완료 |
| skills/heal | assets/illustrated/skills/heal.webp | 160×160 | 완료 |
| farm/soil | assets/illustrated/farm/soil.webp | 160×160 | 완료 |
| farm/water | assets/illustrated/farm/water.webp | 160×160 | 완료 |
| farm/tend | assets/illustrated/farm/tend.webp | 160×160 | 완료 |
| farm/harvest | assets/illustrated/farm/harvest.webp | 160×160 | 완료 |
| farm/sun | assets/illustrated/farm/sun.webp | 160×160 | 완료 |
| farm/rain | assets/illustrated/farm/rain.webp | 160×160 | 완료 |
| farm/dry | assets/illustrated/farm/dry.webp | 160×160 | 완료 |
| farm/frost | assets/illustrated/farm/frost.webp | 160×160 | 완료 |
| farm/greenhouse | assets/illustrated/farm/greenhouse.webp | 160×160 | 완료 |
| farm/seeds | assets/illustrated/farm/seeds.webp | 160×160 | 완료 |
| farm/pantry | assets/illustrated/farm/pantry.webp | 160×160 | 완료 |
| farm/arch | assets/illustrated/farm/arch.webp | 160×160 | 완료 |
| crops/wheat-0 | assets/illustrated/crops/wheat-0.webp | 160×160 | 완료 |
| crops/wheat-1 | assets/illustrated/crops/wheat-1.webp | 160×160 | 완료 |
| crops/wheat-2 | assets/illustrated/crops/wheat-2.webp | 160×160 | 완료 |
| crops/tea-0 | assets/illustrated/crops/tea-0.webp | 160×160 | 완료 |
| crops/tea-1 | assets/illustrated/crops/tea-1.webp | 160×160 | 완료 |
| crops/tea-2 | assets/illustrated/crops/tea-2.webp | 160×160 | 완료 |
| crops/beet-0 | assets/illustrated/crops/beet-0.webp | 160×160 | 완료 |
| crops/beet-1 | assets/illustrated/crops/beet-1.webp | 160×160 | 완료 |
| crops/beet-2 | assets/illustrated/crops/beet-2.webp | 160×160 | 완료 |
| crops/berry-0 | assets/illustrated/crops/berry-0.webp | 160×160 | 완료 |
| crops/berry-1 | assets/illustrated/crops/berry-1.webp | 160×160 | 완료 |
| crops/berry-2 | assets/illustrated/crops/berry-2.webp | 160×160 | 완료 |
| crops/rice-0 | assets/illustrated/crops/rice-0.webp | 160×160 | 완료 |
| crops/rice-1 | assets/illustrated/crops/rice-1.webp | 160×160 | 완료 |
| crops/rice-2 | assets/illustrated/crops/rice-2.webp | 160×160 | 완료 |
| crops/coffee-0 | assets/illustrated/crops/coffee-0.webp | 160×160 | 완료 |
| crops/coffee-1 | assets/illustrated/crops/coffee-1.webp | 160×160 | 완료 |
| crops/coffee-2 | assets/illustrated/crops/coffee-2.webp | 160×160 | 완료 |
| crops/pumpkin-0 | assets/illustrated/crops/pumpkin-0.webp | 160×160 | 완료 |
| crops/pumpkin-1 | assets/illustrated/crops/pumpkin-1.webp | 160×160 | 완료 |
| crops/pumpkin-2 | assets/illustrated/crops/pumpkin-2.webp | 160×160 | 완료 |
| crops/dew-0 | assets/illustrated/crops/dew-0.webp | 160×160 | 완료 |
| crops/dew-1 | assets/illustrated/crops/dew-1.webp | 160×160 | 완료 |
| crops/dew-2 | assets/illustrated/crops/dew-2.webp | 160×160 | 완료 |
| guides/cook | assets/illustrated/guides/cook.webp | 498×322 | 완료 |
| guides/serve | assets/illustrated/guides/serve.webp | 498×322 | 완료 |
| guides/host | assets/illustrated/guides/host.webp | 498×322 | 완료 |
| guides/farm | assets/illustrated/guides/farm.webp | 498×318 | 완료 |
| guides/hunt | assets/illustrated/guides/hunt.webp | 498×318 | 완료 |
| guides/armory | assets/illustrated/guides/armory.webp | 1050×591 | 완료 |
| guides/outfits | assets/illustrated/guides/outfits.webp | 498×342 | 완료 |
| guides/bonds | assets/illustrated/guides/bonds.webp | 498×342 | 완료 |
| guides/interior | assets/illustrated/guides/interior.webp | 498×342 | 완료 |
| effects/bolt | assets/illustrated/effects/bolt.webp | 512×128 | 완료 |
| effects/orbit | assets/illustrated/effects/orbit.webp | 512×128 | 완료 |
| effects/crescent | assets/illustrated/effects/crescent.webp | 512×128 | 완료 |
| effects/aura | assets/illustrated/effects/aura.webp | 512×128 | 완료 |
| effects/tarot | assets/illustrated/effects/tarot.webp | 512×128 | 완료 |
| reactions/good | assets/illustrated/reactions/good.webp | 192×192 | 완료 |
| reactions/wrong | assets/illustrated/reactions/wrong.webp | 192×192 | 완료 |
| reactions/okay | assets/illustrated/reactions/okay.webp | 192×192 | 완료 |
| reactions/missed | assets/illustrated/reactions/missed.webp | 192×192 | 완료 |
| services/kitchen | assets/illustrated/services/kitchen.webp | 720×480 | 완료 |
| services/delivery | assets/illustrated/services/delivery.webp | 720×480 | 완료 |
| services/quests | assets/illustrated/services/quests.webp | 720×480 | 완료 |
| services/more | assets/illustrated/services/more.webp | 720×480 | 완료 |
| icons/lotus_moon | assets/illustrated/icons/lotus_moon.webp | 160×160 | 완료 |
| icons/honey_peach | assets/illustrated/icons/honey_peach.webp | 160×160 | 완료 |
| icons/star_black_tea | assets/illustrated/icons/star_black_tea.webp | 160×160 | 완료 |
| icons/gold_cinnamon | assets/illustrated/icons/gold_cinnamon.webp | 160×160 | 완료 |
| icons/white_lotus_healing | assets/illustrated/icons/white_lotus_healing.webp | 160×160 | 완료 |
| icons/black_moon_brown_rice | assets/illustrated/icons/black_moon_brown_rice.webp | 160×160 | 완료 |
| objects/basic_table | assets/illustrated/objects/basic_table.webp | 128×128 | 완료 |
| objects/basic_chair | assets/illustrated/objects/basic_chair.webp | 128×128 | 완료 |
| objects/basic_drink | assets/sprites/objects/drink.webp | 256×128 | 완료 |
| objects/basic_oven | assets/sprites/objects/oven.webp | 256×128 | 완료 |
| objects/basic_pass | assets/sprites/objects/pass.webp | 256×128 | 완료 |
| objects/basic_counter | assets/sprites/objects/counter.webp | 128×256 | 완료 |
| interactions/tray-down | assets/illustrated/interactions/tray-down.webp | 160×160 | 완료 |
| interactions/tray-left | assets/illustrated/interactions/tray-left.webp | 160×160 | 완료 |
| interactions/tray-right | assets/illustrated/interactions/tray-right.webp | 160×160 | 완료 |
| interactions/tray-up | assets/illustrated/interactions/tray-up.webp | 160×160 | 완료 |
| interactions/cloth-down | assets/illustrated/interactions/cloth-down.webp | 160×160 | 완료 |
| interactions/cloth-left | assets/illustrated/interactions/cloth-left.webp | 160×160 | 완료 |
| interactions/cloth-right | assets/illustrated/interactions/cloth-right.webp | 160×160 | 완료 |
| interactions/cloth-up | assets/illustrated/interactions/cloth-up.webp | 160×160 | 완료 |
| interactions/broom-down | assets/illustrated/interactions/broom-down.webp | 160×160 | 완료 |
| interactions/broom-left | assets/illustrated/interactions/broom-left.webp | 160×160 | 완료 |
| interactions/broom-right | assets/illustrated/interactions/broom-right.webp | 160×160 | 완료 |
| interactions/broom-up | assets/illustrated/interactions/broom-up.webp | 160×160 | 완료 |
| ui/town-node-finance | assets/illustrated/portraits/cheongtokki.webp | 320×384 | 완료 |
| wardrobe/solv@solv_formal | assets/illustrated/wardrobe/solv@solv_formal.webp | 1024×256 | 완료 |
| wardrobe/solv@solv_moon | assets/illustrated/wardrobe/solv@solv_moon.webp | 1024×256 | 완료 |
| wardrobe/solv@solv_garden | assets/illustrated/wardrobe/solv@solv_garden.webp | 1024×256 | 완료 |
| wardrobe/bambi@bambi_formal | assets/illustrated/wardrobe/bambi@bambi_formal.webp | 1024×256 | 완료 |
| wardrobe/bambi@bambi_moon | assets/illustrated/wardrobe/bambi@bambi_moon.webp | 1024×256 | 완료 |
| wardrobe/bambi@bambi_garden | assets/illustrated/wardrobe/bambi@bambi_garden.webp | 1024×256 | 완료 |
| wardrobe/lune@lune_formal | assets/illustrated/wardrobe/lune@lune_formal.webp | 1024×256 | 완료 |
| wardrobe/lune@lune_moon | assets/illustrated/wardrobe/lune@lune_moon.webp | 1024×256 | 완료 |
| wardrobe/lune@lune_garden | assets/illustrated/wardrobe/lune@lune_garden.webp | 1024×256 | 완료 |
| wardrobe/raven@raven_formal | assets/illustrated/wardrobe/raven@raven_formal.webp | 1024×256 | 완료 |
| wardrobe/raven@raven_moon | assets/illustrated/wardrobe/raven@raven_moon.webp | 1024×256 | 완료 |
| wardrobe/raven@raven_garden | assets/illustrated/wardrobe/raven@raven_garden.webp | 1024×256 | 완료 |
| wardrobe/yun@yun_formal | assets/illustrated/wardrobe/yun@yun_formal.webp | 1024×256 | 완료 |
| wardrobe/yun@yun_moon | assets/illustrated/wardrobe/yun@yun_moon.webp | 1024×256 | 완료 |
| wardrobe/yun@yun_garden | assets/illustrated/wardrobe/yun@yun_garden.webp | 1024×256 | 완료 |
| wardrobe/museong@museong_formal | assets/illustrated/wardrobe/museong@museong_formal.webp | 1024×256 | 완료 |
| wardrobe/museong@museong_moon | assets/illustrated/wardrobe/museong@museong_moon.webp | 1024×256 | 완료 |
| wardrobe/museong@museong_garden | assets/illustrated/wardrobe/museong@museong_garden.webp | 1024×256 | 완료 |
| wardrobe/neo@vest_night | assets/illustrated/wardrobe/neo@vest_night.webp | 1024×256 | 완료 |
| wardrobe/neo@host_first | assets/illustrated/wardrobe/neo@host_first.webp | 1024×256 | 완료 |
| wardrobe/neo@crescent_tailcoat | assets/illustrated/wardrobe/neo@crescent_tailcoat.webp | 1024×256 | 완료 |
| wardrobe/neo@wood_suit | assets/illustrated/wardrobe/neo@wood_suit.webp | 1024×256 | 완료 |
| wardrobe/neo@blossom_haori | assets/illustrated/wardrobe/neo@blossom_haori.webp | 1024×256 | 완료 |
| wardrobe/neo@rain_coat | assets/illustrated/wardrobe/neo@rain_coat.webp | 1024×256 | 완료 |
| wardrobe/neo@summer_linen | assets/illustrated/wardrobe/neo@summer_linen.webp | 1024×256 | 완료 |
| wardrobe/neo@moonstone_robe | assets/illustrated/wardrobe/neo@moonstone_robe.webp | 1024×256 | 완료 |
| wardrobe/neo@winter_coat | assets/illustrated/wardrobe/neo@winter_coat.webp | 1024×256 | 완료 |
| wardrobe/solv@solv_swim | assets/illustrated/wardrobe/solv@solv_swim.webp | 1024×256 | 완료 |
| wardrobe/bambi@bambi_swim | assets/illustrated/wardrobe/bambi@bambi_swim.webp | 1024×256 | 완료 |
| wardrobe/lune@lune_swim | assets/illustrated/wardrobe/lune@lune_swim.webp | 1024×256 | 완료 |
| wardrobe/raven@raven_swim | assets/illustrated/wardrobe/raven@raven_swim.webp | 1024×256 | 완료 |
| wardrobe/neo@neo_swim | assets/illustrated/wardrobe/neo@neo_swim.webp | 1024×256 | 완료 |
| wardrobe/neo | assets/illustrated/wardrobe/neo.webp | 1024×256 | 완료 |
| actors/neo_cat_attack | assets/illustrated/actors/neo_cat_attack.webp | 512×512 | 완료 |
| backgrounds/cafe_room | assets/illustrated/backgrounds/cafe_room.webp | 720×960 | 완료 |
| ui/loading | assets/illustrated/ui/loading.webp | 280×336 | 완료 |
| actors/neo_idle | assets/illustrated/actors/neo_idle.webp | 512×512 | 완료 |
| actors/luna_idle | assets/illustrated/actors/luna_idle.webp | 512×512 | 완료 |
| actors/luna_sis_idle | assets/illustrated/actors/luna_sis_idle.webp | 512×512 | 완료 |
| actors/yeoni_idle | assets/illustrated/actors/yeoni_idle.webp | 512×512 | 완료 |
| enemies/moon_bomber | assets/illustrated/enemies/moon_bomber.webp | 512×384 | 완료 |
| enemies/rabbit_scout | assets/illustrated/enemies/blue_rabbit.webp | 512×384 | 완료 |
| enemies/rabbit_brute | assets/illustrated/enemies/blue_rabbit.webp | 512×384 | 완료 |
| enemies/shade_thorn | assets/illustrated/enemies/thorn.webp | 512×384 | 완료 |
| enemies/shade_clock | assets/illustrated/enemies/clock.webp | 512×384 | 완료 |
| objects/hunt_crystal | assets/illustrated/objects/hunt_crystal.webp | 176×176 | 완료 |
| objects/hunt_urn | assets/illustrated/objects/hunt_urn.webp | 176×176 | 완료 |
| objects/hunt_coffer | assets/illustrated/objects/hunt_coffer.webp | 176×176 | 완료 |
| objects/hunt_obsidian | assets/illustrated/objects/hunt_obsidian.webp | 176×176 | 완료 |
| tiles/hunt_garden | assets/illustrated/tiles/hunt_garden.webp | 512×512 | 완료 |
| tiles/hunt_rabbit | assets/illustrated/tiles/hunt_rabbit.webp | 512×512 | 완료 |
| tiles/hunt_ruins | assets/illustrated/tiles/hunt_ruins.webp | 512×512 | 완료 |
| tiles/hunt_heukwol | assets/illustrated/tiles/hunt_heukwol.webp | 512×512 | 완료 |
| backgrounds/crafting | assets/illustrated/backgrounds/crafting.webp | 960×640 | 완료 |
| guides/shop | assets/illustrated/guides/shop.webp | 498×318 | 완료 |
| actors/yeoni_farm | assets/illustrated/actors/yeoni_farm.webp | 512×512 | 완료 |
| backgrounds/farm_ground | assets/illustrated/backgrounds/farm_ground.webp | 800×800 | 완료 |
| farm/bed_empty | assets/illustrated/farm/bed_empty.webp | 256×256 | 완료 |
| farm/bed_seeded | assets/illustrated/farm/bed_seeded.webp | 256×256 | 완료 |
| farm/bed_watered | assets/illustrated/farm/bed_watered.webp | 256×256 | 완료 |
| farm/bed_tended | assets/illustrated/farm/bed_tended.webp | 256×256 | 완료 |
| ui/new_game | assets/illustrated/ui/new_game.webp | 720×480 | 완료 |
| talking/yeoni | assets/illustrated/talking/yeoni.webp | 1280×384 | 완료 |
| talking/neo | assets/illustrated/talking/neo.webp | 1280×384 | 완료 |
| talking/neo_cat | assets/illustrated/talking/neo_cat.webp | 1280×384 | 완료 |
| talking/yeoni_pig | assets/illustrated/talking/yeoni_pig.webp | 1280×384 | 완료 |
| talking/luna | assets/illustrated/talking/luna.webp | 1280×384 | 완료 |
| talking/luna_sis | assets/illustrated/talking/luna_sis.webp | 1280×384 | 완료 |
| talking/moka | assets/illustrated/talking/moka.webp | 1280×384 | 완료 |
| talking/solv | assets/illustrated/talking/solv.webp | 1280×384 | 완료 |
| talking/bambi | assets/illustrated/talking/bambi.webp | 1280×384 | 완료 |
| talking/lune | assets/illustrated/talking/lune.webp | 1280×384 | 완료 |
| talking/raven | assets/illustrated/talking/raven.webp | 1280×384 | 완료 |
| talking/yun | assets/illustrated/talking/yun.webp | 1280×384 | 완료 |
| talking/seohanbi | assets/illustrated/talking/seohanbi.webp | 1280×384 | 완료 |
| talking/museong | assets/illustrated/talking/museong.webp | 1280×384 | 완료 |
| talking/neo_stage | assets/illustrated/talking/neo_stage.webp | 1280×384 | 완료 |
| talking/cheongtokki | assets/illustrated/talking/cheongtokki.webp | 1280×384 | 완료 |
| badges/bambi | assets/illustrated/badges/bambi.webp | 192×192 | 완료 |
| badges/cheongtokki | assets/illustrated/badges/cheongtokki.webp | 192×192 | 완료 |
| badges/luna | assets/illustrated/badges/luna.webp | 192×192 | 완료 |
| badges/luna_sis | assets/illustrated/badges/luna_sis.webp | 192×192 | 완료 |
| badges/lune | assets/illustrated/badges/lune.webp | 192×192 | 완료 |
| badges/moka | assets/illustrated/badges/moka.webp | 192×192 | 완료 |
| badges/museong | assets/illustrated/badges/museong.webp | 192×192 | 완료 |
| badges/neo | assets/illustrated/badges/neo.webp | 192×192 | 완료 |
| badges/neo_cat | assets/illustrated/badges/neo_cat.webp | 192×192 | 완료 |
| badges/neo_stage | assets/illustrated/badges/neo_stage.webp | 192×192 | 완료 |
| badges/raven | assets/illustrated/badges/raven.webp | 192×192 | 완료 |
| badges/seohanbi | assets/illustrated/badges/seohanbi.webp | 192×192 | 완료 |
| badges/solv | assets/illustrated/badges/solv.webp | 192×192 | 완료 |
| badges/yeoni | assets/illustrated/badges/yeoni.webp | 192×192 | 완료 |
| badges/yeoni_pig | assets/illustrated/badges/yeoni_pig.webp | 192×192 | 완료 |
| badges/yun | assets/illustrated/badges/yun.webp | 192×192 | 완료 |
| service/cloth-down | assets/illustrated/service/cloth-down.webp | 256×192 | 완료 |
| service/cloth-left | assets/illustrated/service/cloth-left.webp | 256×192 | 완료 |
| service/cloth-right | assets/illustrated/service/cloth-right.webp | 256×192 | 완료 |
| service/cloth-up | assets/illustrated/service/cloth-up.webp | 256×192 | 완료 |
| service/tray-down | assets/illustrated/service/tray-down.webp | 256×192 | 완료 |
| service/tray-left | assets/illustrated/service/tray-left.webp | 256×192 | 완료 |
| service/tray-right | assets/illustrated/service/tray-right.webp | 256×192 | 완료 |
| service/tray-up | assets/illustrated/service/tray-up.webp | 256×192 | 완료 |


## 정밀 스프라이트 재배치 (2026-10-26)
생성 원본의 간격은 완전히 균일하지 않으므로 단순 등분을 사용하지 않는다. tools/pack-sprites.py가 원본 전체의 알파 연결 성분으로 인물/적을 분리하고 실제 중심을 기준으로 행·열을 정한다. 다른 인물이나 떨어진 배경 조각은 마스크에 포함하지 않는다. 본체 가장자리2px의 안티앨리어싱만 복원한다.

43개 배우·4개 적 원본에서 총736프레임을 분리하여 128px 셀, 최소6px 투명 여백, 발(64,122)에 배치한다. 의상 미리보기33장은 같은 분리 결과의256px 셀4방향이다. sourceBounds는 docs/sprite-crops.json에 기록한다. 원본 PNG는 수정하지 않는다. UI에서 미리보기 확대는 원본 해상도에서 만든 별도 시트를 사용한다.

서빙 트레이·청소 천은 별도 interactions 투명 소품이며 실제 주문 메뉴 아이콘을 렌더링 때 합성한다. 배우 시트에 다른 메뉴·UI가 붙지 않도록 역할을 분리한다. 대화 초상화는 정적인 초상화와 아래 발화 시트를 구분한다. 여섯 희귀 재료 아이콘은 아직 색상 대체이며 일부 기존 적·타일·UI는 재사용한다. ready 키는 이미지 로드 대상으로 사용되며 전체 장면의 품질 검수 완료를 뜻하지 않는다.

## 대화 시트 재제작·보정 (2026-10-26)
윤달과 서한비는 독립된2×2 원화부터 다시 그렸다. 윤달은 정면에 가까운 자세, 서한비는 사용자 확정 여성·검은 드레스 모습이다. 나머지14종은 원본의 실제 인물 경계로 다시 잘랐다.16종 모두320×384 셀4열(1280×384)이며 프레임0 중립,1 눈감음,2 작은 입,3 열린 입이다. 기준점160,368과 알파 외곽을 고정하고 눈·입 영역만 바꿔 머리·몸의 흔들림을 줄였다. 기존 talking 경로에 손실 없는 WebP로 교체했다.

개별 프레임·원본PNG·미리보기·해시는 이 채팅의 outputs/claude-handoff에 보존했다. 생성 프롬프트와 원본 경계는 docs/art-prompts.json 및 각 WebP의 JSON에 기록한다. 텍스트 진행 기반 발화이며 음성에 맞춘 음소 립싱크는 아니다. 작은 대사용 얼굴 배지와 새 서빙 소품은 인계 패키지에만 있으며 UI/손 위치 연결은 후속 작업이다. 이동·공격·의상별 배우 시트의 검수 완료를 뜻하지 않는다.
