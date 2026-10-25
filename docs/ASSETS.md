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
4. 실제 Chromium 화면에서 로드 누락·404·잘림·모바일 축소 결과를 확인한다.

이전 tools/*normalize*.py와 actor-grid-spec.json은 원래 픽셀 아트 기록이며 현재 제작에는 illustration-export.py를 쓴다.

## actors

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| actors/yun | 윤달 | assets/sprites/actors/yun.webp | 384×1152 | 완료 |
| actors/seohanbi | 서한비 | assets/sprites/actors/seohanbi.webp | 384×1152 | 완료 |
| actors/museong | 무성 | assets/sprites/actors/museong.webp | 384×1152 | 완료 |
| actors/solv | 솔브 | assets/sprites/actors/solv.webp | 384×1152 | 완료 |
| actors/bambi | 밤비 | assets/sprites/actors/bambi.webp | 384×1152 | 완료 |
| actors/lune | 루네 | assets/sprites/actors/lune.webp | 384×1152 | 완료 |
| actors/raven | 레이븐 | assets/sprites/actors/raven.webp | 384×1152 | 완료 |
| actors/neo@crescent_tailcoat | 초승달 연미복 | assets/sprites/actors/neo@crescent_tailcoat.webp | 384×1152 | 완료 |
| actors/neo@wood_suit | 청목 정장 | assets/sprites/actors/neo@wood_suit.webp | 384×1152 | 완료 |
| actors/neo@blossom_haori | 벚꽃 저녁 | assets/sprites/actors/neo@blossom_haori.webp | 384×1152 | 완료 |
| actors/neo@rain_coat | 비 갠 새벽 | assets/sprites/actors/neo@rain_coat.webp | 384×1152 | 완료 |
| actors/neo@summer_linen | 여름의 여백 | assets/sprites/actors/neo@summer_linen.webp | 384×1152 | 완료 |
| actors/neo@moonstone_robe | 월정석 예복 | assets/sprites/actors/neo@moonstone_robe.webp | 384×1152 | 완료 |
| actors/neo@winter_coat | 한겨울 별자리 | assets/sprites/actors/neo@winter_coat.webp | 384×1152 | 완료 |
| actors/yeoni@garden_apron | 연꽃 정원 앞치마 | assets/sprites/actors/yeoni@garden_apron.webp | 384×1152 | 완료 |
| actors/neo@host_first | 달빛 첫인사 | assets/sprites/actors/neo@host_first.webp | 384×1152 | 완료 |
| actors/yeoni@apron_spring | 봄빛 앞치마 | assets/sprites/actors/yeoni.webp | 384×1152 | 완료 |
| actors/neo@vest_night | 밤하늘 조끼 | assets/sprites/actors/neo.webp | 384×1152 | 완료 |
| actors/yeoni | 연이 | assets/sprites/actors/yeoni.webp | 384×1152 | 완료 |
| actors/yeoni_pig | 연이(꽃돼지) | assets/sprites/actors/yeoni_pig.webp | 384×1152 | 완료 |
| actors/neo | 네오 | assets/sprites/actors/neo.webp | 384×1152 | 완료 |
| actors/neo_cat | 영냥이 | assets/sprites/actors/neo_cat.webp | 384×1152 | 완료 |
| actors/customer | 손님 | assets/sprites/actors/customer.webp | 384×1152 | 완료 |
| actors/luna | 루나 | assets/sprites/actors/luna.webp | 384×1152 | 완료 |
| actors/luna_sis | 루나 언니 | assets/sprites/actors/luna_sis.webp | 384×1152 | 완료 |
| actors/cheongtokki | 청토끼 | assets/sprites/actors/cheongtokki.webp | 384×1152 | 완료 |
| actors/moka | 모카 | assets/sprites/actors/moka.webp | 384×1152 | 완료 |

## enemies

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| enemies/shade_hand | 검은 손 | assets/sprites/enemies/shade_hand.webp | 384×288 | 완료 |
| enemies/shade_bat | 그림자 박쥐(임시) | assets/sprites/enemies/shade_bat.webp | 384×288 | 완료 |
| enemies/shade_blob | 그림자 덩어리(임시) | assets/sprites/enemies/shade_blob.webp | 384×288 | 완료 |
| enemies/shade_wisp | 도깨비불(임시) | assets/sprites/enemies/shade_wisp.webp | 384×288 | 완료 |
| enemies/elite_hand | 큰 검은 손(임시 정예) | assets/sprites/enemies/elite_hand.webp | 768×576 | 완료 |
| enemies/boss_hand | 거대한 검은 손(임시 보스) | assets/sprites/enemies/boss_hand.webp | 1152×864 | 완료 |

## objects

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| objects/lotus_pot | 연꽃 수반 | assets/sprites/objects/lotus_pot.webp | 128×128 | 완료 |
| objects/bamboo | 작은 대나무 | assets/sprites/objects/bamboo.webp | 128×128 | 완료 |
| objects/garden_bench | 꽃길 벤치 | assets/sprites/objects/garden_bench.webp | 256×128 | 완료 |
| objects/lotus_rug | 연꽃 원형 카펫 | assets/sprites/objects/lotus_rug.webp | 256×256 | 완료 |
| objects/moon_lamp | 초승달 스탠드 | assets/sprites/objects/moon_lamp.webp | 128×128 | 완료 |
| objects/velvet_sofa | 남보라 벨벳 소파 | assets/sprites/objects/velvet_sofa.webp | 256×128 | 완료 |
| objects/star_carpet | 별자리 카펫 | assets/sprites/objects/star_carpet.webp | 256×256 | 완료 |
| objects/record_shelf | 데스티노바 음반장 | assets/sprites/objects/record_shelf.webp | 256×128 | 완료 |
| objects/tea_cabinet | 오행 찻잔장 | assets/sprites/objects/tea_cabinet.webp | 256×128 | 완료 |
| objects/water_bowl | 푸른 물결 수반 | assets/sprites/objects/water_bowl.webp | 128×128 | 완료 |
| objects/fire_lantern | 붉은 등불 | assets/sprites/objects/fire_lantern.webp | 128×128 | 완료 |
| objects/earth_vase | 황토빛 항아리 | assets/sprites/objects/earth_vase.webp | 128×128 | 완료 |
| objects/silver_bell | 은빛 풍경 | assets/sprites/objects/silver_bell.webp | 128×128 | 완료 |
| objects/harvest_basket | 수확 바구니 | assets/sprites/objects/harvest_basket.webp | 128×128 | 완료 |
| objects/herb_shelf | 허브 화분 선반 | assets/sprites/objects/herb_shelf.webp | 256×128 | 완료 |
| objects/greenhouse_rug | 새싹 발매트 | assets/sprites/objects/greenhouse_rug.webp | 256×256 | 완료 |
| objects/table | 테이블 | assets/sprites/objects/table.webp | 128×128 | 완료 |
| objects/chair | 의자 | assets/sprites/objects/chair.webp | 128×128 | 완료 |
| objects/drink | 음료 머신 | assets/sprites/objects/drink.webp | 256×128 | 완료 |
| objects/oven | 오븐 | assets/sprites/objects/oven.webp | 256×128 | 완료 |
| objects/pass | 서빙대 | assets/sprites/objects/pass.webp | 256×128 | 완료 |
| objects/counter | 카운터 | assets/sprites/objects/counter.webp | 128×256 | 완료 |
| objects/plant | 화분 | assets/sprites/objects/plant.webp | 128×128 | 완료 |
| objects/bookshelf | 책장 | assets/sprites/objects/bookshelf.webp | 256×128 | 완료 |
| objects/lamp | 별 조명 | assets/sprites/objects/lamp.webp | 128×128 | 완료 |
| objects/rug | 꽃무늬 러그 | assets/sprites/objects/rug.webp | 256×256 | 완료 |
| objects/pot | 조합 냄비 | assets/sprites/objects/pot.webp | 128×128 | 완료 |

## icons

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| icons/berry | 딸기 | assets/sprites/icons/berry.webp | 96×96 | 완료 |
| icons/rice | 쌀 | assets/sprites/icons/rice.webp | 96×96 | 완료 |
| icons/pumpkin | 호박 | assets/sprites/icons/pumpkin.webp | 96×96 | 완료 |
| icons/bean | 원두 | assets/sprites/icons/bean.webp | 96×96 | 완료 |
| icons/milk | 우유 | assets/sprites/icons/milk.webp | 96×96 | 완료 |
| icons/tea | 찻잎 | assets/sprites/icons/tea.webp | 96×96 | 완료 |
| icons/flour | 밀가루 | assets/sprites/icons/flour.webp | 96×96 | 완료 |
| icons/egg | 달걀 | assets/sprites/icons/egg.webp | 96×96 | 완료 |
| icons/sugar | 설탕 | assets/sprites/icons/sugar.webp | 96×96 | 완료 |
| icons/night_dew | 밤이슬 | assets/sprites/icons/night_dew.webp | 96×96 | 완료 |
| icons/lotus_berry_tart | 연꽃 딸기 타르트 | assets/sprites/icons/lotus_berry_tart.webp | 96×96 | 완료 |
| icons/moon_rice_bowl | 초승달 달걀밥 | assets/sprites/icons/moon_rice_bowl.webp | 96×96 | 완료 |
| icons/golden_pumpkin_soup | 황금 호박 수프 | assets/sprites/icons/golden_pumpkin_soup.webp | 96×96 | 완료 |
| icons/fortune_latte | 운세 라테 | assets/sprites/icons/fortune_latte.webp | 96×96 | 완료 |
| icons/starlight_tea | 별빛 차 | assets/sprites/icons/starlight_tea.webp | 96×96 | 완료 |
| icons/flower_cookie | 꽃 쿠키 | assets/sprites/icons/flower_cookie.webp | 96×96 | 완료 |
| icons/moon_pudding | 달빛 푸딩 | assets/sprites/icons/moon_pudding.webp | 96×96 | 완료 |
| icons/lucky_sand | 행운 샌드 | assets/sprites/icons/lucky_sand.webp | 96×96 | 완료 |
| icons/moon_milk_tea | 달빛 밀크티 | assets/sprites/icons/moon_milk_tea.webp | 96×96 | 완료 |
| icons/stardust_castella | 별가루 카스텔라 | assets/sprites/icons/stardust_castella.webp | 96×96 | 완료 |
| icons/oink_cream_latte | 꿀꿀 크림 라테 | assets/sprites/icons/oink_cream_latte.webp | 96×96 | 완료 |
| icons/night_dew_latte | 밤이슬 라테 | assets/sprites/icons/night_dew_latte.webp | 96×96 | 완료 |
| icons/gem_s | 별조각(소) | assets/sprites/icons/gem_s.webp | 96×96 | 완료 |
| icons/gem_m | 별조각(중) | assets/sprites/icons/gem_m.webp | 96×96 | 완료 |
| icons/gem_l | 별조각(대) | assets/sprites/icons/gem_l.webp | 96×96 | 완료 |
| icons/fish | 구운 생선 | assets/sprites/icons/fish.webp | 96×96 | 완료 |
| icons/magnet | 수염 자석 | assets/sprites/icons/magnet.webp | 96×96 | 완료 |
| icons/bomb | 달빛 폭탄 | assets/sprites/icons/bomb.webp | 96×96 | 완료 |
| icons/chest | 별 상자 | assets/sprites/icons/chest.webp | 96×96 | 완료 |
| icons/moonstone | 월정석 | assets/sprites/icons/moonstone.webp | 96×96 | 완료 |
| icons/claw_glove | 고양이 발톱 장갑 | assets/sprites/icons/claw_glove.webp | 96×96 | 완료 |
| icons/crescent_wand | 초승달 방울 지팡이 | assets/sprites/icons/crescent_wand.webp | 96×96 | 완료 |
| icons/scale_vest | 생선 비늘 조끼 | assets/sprites/icons/scale_vest.webp | 96×96 | 완료 |
| icons/fluff_cape | 솜뭉치 망토 | assets/sprites/icons/fluff_cape.webp | 96×96 | 완료 |
| icons/fishbone_charm | 생선뼈 부적 | assets/sprites/icons/fishbone_charm.webp | 96×96 | 완료 |
| icons/churu_magnet | 자석 츄르 | assets/sprites/icons/churu_magnet.webp | 96×96 | 완료 |

## portraits

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| portraits/yun | 윤달 | assets/sprites/portraits/yun.webp | 768×768 | 완료 |
| portraits/seohanbi | 서한비 | assets/sprites/portraits/seohanbi.webp | 768×768 | 완료 |
| portraits/museong | 무성 | assets/sprites/portraits/museong.webp | 768×768 | 완료 |
| portraits/solv | 솔브 | assets/sprites/portraits/solv.webp | 768×768 | 완료 |
| portraits/bambi | 밤비 | assets/sprites/portraits/bambi.webp | 768×768 | 완료 |
| portraits/lune | 루네 | assets/sprites/portraits/lune.webp | 768×768 | 완료 |
| portraits/raven | 레이븐 | assets/sprites/portraits/raven.webp | 768×768 | 완료 |
| portraits/neo@crescent_tailcoat | 초승달 연미복 | assets/sprites/portraits/neo@crescent_tailcoat.webp | 768×768 | 완료 |
| portraits/neo@wood_suit | 청목 정장 | assets/sprites/portraits/neo@wood_suit.webp | 768×768 | 완료 |
| portraits/neo@blossom_haori | 벚꽃 저녁 | assets/sprites/portraits/neo@blossom_haori.webp | 768×768 | 완료 |
| portraits/neo@rain_coat | 비 갠 새벽 | assets/sprites/portraits/neo@rain_coat.webp | 768×768 | 완료 |
| portraits/neo@summer_linen | 여름의 여백 | assets/sprites/portraits/neo@summer_linen.webp | 768×768 | 완료 |
| portraits/neo@moonstone_robe | 월정석 예복 | assets/sprites/portraits/neo@moonstone_robe.webp | 768×768 | 완료 |
| portraits/neo@winter_coat | 한겨울 별자리 | assets/sprites/portraits/neo@winter_coat.webp | 768×768 | 완료 |
| portraits/yeoni@garden_apron | 연꽃 정원 앞치마 | assets/sprites/portraits/yeoni@garden_apron.webp | 768×960 | 완료 |
| portraits/neo@host_first | 달빛 첫인사 | assets/sprites/portraits/neo@host_first.webp | 768×768 | 완료 |
| portraits/yeoni@apron_spring | 봄빛 앞치마 | assets/sprites/portraits/yeoni.webp | 768×960 | 완료 |
| portraits/neo@vest_night | 밤하늘 조끼 | assets/sprites/portraits/neo.webp | 768×768 | 완료 |
| portraits/yeoni | 연이 | assets/sprites/portraits/yeoni.webp | 768×960 | 완료 |
| portraits/yeoni_pig | 연이(꽃돼지) | assets/sprites/portraits/yeoni_pig.webp | 768×768 | 완료 |
| portraits/neo | 네오 | assets/sprites/portraits/neo.webp | 768×768 | 완료 |
| portraits/neo_cat | 영냥이 | assets/sprites/portraits/neo_cat.webp | 768×768 | 완료 |
| portraits/luna | 루나 | assets/sprites/portraits/luna.webp | 768×768 | 완료 |
| portraits/luna_sis | 루나 언니 | assets/sprites/portraits/luna_sis.webp | 768×768 | 완료 |
| portraits/cheongtokki | 청토끼 | assets/sprites/portraits/cheongtokki.webp | 768×576 | 완료 |
| portraits/moka | 모카 | assets/sprites/portraits/moka.webp | 768×576 | 완료 |

## tiles

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| tiles/cafe_floor | 카페 바닥 | assets/tiles/cafe_floor.webp | 128×128 | 완료 |
| tiles/cafe_wall | 카페 벽 | assets/tiles/cafe_wall.webp | 128×128 | 완료 |
| tiles/town_street | 카페 앞 마을 길(마을 화면 배경) | assets/tiles/town_street.webp | 128×128 | 완료 |
| tiles/river_field | 사주의 강 밤 들판 | assets/tiles/river_field.webp | 128×128 | 완료 |

## backgrounds

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| backgrounds/atelier_lit | atelier_lit | assets/backgrounds/atelier_lit.webp | 720×600 | 완료 |
| backgrounds/atelier_dark | atelier_dark | assets/backgrounds/atelier_dark.webp | 720×600 | 완료 |
| backgrounds/river_night | river_night | assets/backgrounds/river_night.webp | 720×600 | 완료 |
| backgrounds/dressroom | dressroom | assets/backgrounds/dressroom.webp | 720×600 | 완료 |
| backgrounds/farm | farm | assets/backgrounds/farm.webp | 720×400 | 완료 |

## ui

| 키 | 이름 | 경로 | 크기 | 상태 |
| --- | --- | --- | --- | --- |
| ui/town-map-spring | spring 마을 | assets/ui/town-map-spring.webp | 720×600 | 완료 |
| ui/town-map-summer | summer 마을 | assets/ui/town-map-summer.webp | 720×600 | 완료 |
| ui/town-map-autumn | autumn 마을 | assets/ui/town-map-autumn.webp | 720×600 | 완료 |
| ui/town-map-winter | winter 마을 | assets/ui/town-map-winter.webp | 720×600 | 완료 |
| ui/town-node-atelier | town-node-atelier | assets/ui/town-node-atelier.webp | 128×128 | 완료 |
| ui/town-node-expand | town-node-expand | assets/ui/town-node-expand.webp | 128×128 | 완료 |
| ui/town-node-moka | town-node-moka | assets/ui/town-node-moka.webp | 128×128 | 완료 |
| ui/town-node-luna | town-node-luna | assets/ui/town-node-luna.webp | 128×128 | 완료 |
| ui/town-node-gear | town-node-gear | assets/ui/town-node-gear.webp | 128×128 | 완료 |
| ui/town-node-hunt | town-node-hunt | assets/ui/town-node-hunt.webp | 128×128 | 완료 |
| ui/heart-full | heart-full | assets/ui/heart-full.webp | 128×128 | 완료 |
| ui/heart-empty | heart-empty | assets/ui/heart-empty.webp | 128×128 | 완료 |
| ui/sos | sos | assets/ui/sos.webp | 128×128 | 완료 |
| ui/stress-calm | stress-calm | assets/ui/stress-calm.webp | 128×128 | 완료 |
| ui/stress-tired | stress-tired | assets/ui/stress-tired.webp | 128×128 | 완료 |
| ui/stress-limit | stress-limit | assets/ui/stress-limit.webp | 128×128 | 완료 |
| ui/frame-panel | frame-panel | assets/ui/frame-panel.webp | 144×144 | 완료 |
| ui/frame-button | frame-button | assets/ui/frame-button.webp | 144×144 | 완료 |
| ui/frame-tab | frame-tab | assets/ui/frame-tab.webp | 144×144 | 완료 |
| ui/frame-card | frame-card | assets/ui/frame-card.webp | 144×144 | 완료 |
| ui/transform | transform | assets/ui/transform.webp | 1024×128 | 완료 |
| ui/transform-large | transform-large | assets/ui/transform-large.webp | 1536×192 | 완료 |
| ui/moon-glint | moon-glint | assets/ui/moon-glint.webp | 128×128 | 완료 |
| ui/push-lines | push-lines | assets/ui/push-lines.webp | 128×128 | 완료 |
| ui/ledger | ledger | assets/ui/ledger.webp | 128×128 | 완료 |

미완료(의도적 개발 전용): actors/dev_temp_01. 일반 게임에서는 쓰지 않는다.
