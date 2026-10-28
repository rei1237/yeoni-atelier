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
2026-10-26 최신 로컬 검사: 419/419 등록 에셋, 런타임+글꼴 14,356,576바이트. Git 추적 파일과 무시되지 않은 신규 파일을 합친 배포 대상 assets/는 397파일 14,970,657바이트로 15MB 및 파일당 1.5MB를 통과한다. 미등록 파일·생성 기록·라이선스도 배포 대상이면 계산한다. Git 없는 환경은 실제 전체 폴더를 검사한다.

물리 폴더는 원본을 보존하여 774파일 27,437,775바이트다. 정확한 archive-assets.json 목록 377파일(미사용 WebP 81·생성 기록 296)은 D:/yeoni-qa/cafe-ux/archived-unused-assets-20261026에 복사하고 SHA256 일치를 확인한 뒤 Git 추적만 제외했다. 저장소 로컬 원본도 남아 있다. 이 변경은 아직 로컬이며 새 배포를 하지 않았다.

지도·대화 초상 등 9파일은 해상도를 유지한 q76/q82 파생 WebP로 222,974바이트를 줄였다. PSNR 33dB 이상과 원본/결과 픽셀 비교를 함께 확인했다. 정확한 SHA256·파일별 품질은 D:/yeoni-qa/cafe-ux/budget-final/applied.json, 이전 파일은 같은 폴더 originals/에 보존한다. 남은 예산은 약 29KB이므로 새 아트 추가 전 교체·추가 최적화가 필요하다. 아래 과거 초과 수치는 당시 기록이다.

1. src/render/assets.js 정의와 아래 표를 함께 유지한다.
2. 실제 확인한 키만 assets/manifest.json ready에 등록한다. DEV 임시 동료만 의도적으로 도형이다.
3. node tools/check-assets.mjs는 WebP 컨테이너·크기·알파 채널·문서 표·프롬프트 기록을 검사한다. 개별 1.5MB, 전체 15MB 전송 예산을 넘으면 실패한다. 픽셀 내용의 미적 품질은 자동 판정하지 않는다.
   - 2026-10-26 현재 전체 17.77MB로 예산을 넘는다(이전 12.89MB, 인계 대화 16종·의상·초상화 추가분). 한도는 올리지 않았다. 확인한 근거: 바이트가 같은 중복 파일 0개. 부팅 때는 BOOT_ASSETS 95파일 1.53MB만 받고 나머지는 처음 쓸 때 요청한다(지연 로딩 적용됨). 기존 파이프라인 품질(q90)로 전부 다시 인코딩해도 17.05MB(talking 2.11→1.71MB가 대부분). 15MB 아래로 내리려면 시트 품질을 q80 이하로 낮추거나 해상도를 줄여야 하므로, 아트 검수 없이 하지 않고 후속 결정으로 남긴다.
   - 영냥이 걷기·참격·시전 시트(neo_cat, neo_cat_attack, neo_cat_cast)는 pack-sprites.py의 `"scaleBy":"height"`로 몸 높이(약 113px)와 발 기준선을 맞춘다. 참격·시전은 앞발이 뻗어 나가므로 192×160 셀을 쓰고, 사냥 화면에서는 크기 85로 그려 걷기(128 셀, 크기 68)와 몸 크기가 같다.
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
| actors/customer | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
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
| objects/table | 256×256 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/chair | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/drink | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/oven | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/pass | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/counter | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/plant | 128×160 | 완료 | 새 식물 원본 · botanical_pot 공유 |
| objects/bookshelf | assets/illustrated/objects/bookshelf.webp | 256×128 | 완료 |
| objects/lamp | assets/illustrated/objects/lamp.webp | 128×128 | 완료 |
| objects/rug | 256×160 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
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
| ui/town-map-spring | assets/ui/town-map-spring.webp | 1152×768 | 완료 |
| ui/town-map-summer | assets/ui/town-map-summer.webp | 1152×768 | 완료 |
| ui/town-map-autumn | assets/ui/town-map-autumn.webp | 1152×768 | 완료 |
| ui/town-map-winter | assets/ui/town-map-winter.webp | 1152×768 | 완료 |
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
| objects/basic_table | 256×256 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/basic_chair | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/basic_drink | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/basic_oven | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/basic_pass | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/basic_counter | 256×192 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
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
| actors/neo_cat_attack | assets/illustrated/actors/neo_cat_attack.webp | 768×640 | 완료 |
| actors/neo_cat_cast | assets/illustrated/actors/neo_cat_cast.webp | 768×640 | 완료 |
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

루나·루나 언니 talking 2·3프레임(입 벌림)은 입 주변에 덧댄 자국이 있어 쓰지 않는다(`"mouth": false`, 기본 칸으로 말함). 다시 그리기 전까지 유지.
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

## 카페 손님 옷색 (2026-10-26)

| 키 | 경로 | 크기 | 상태 |
|---|---|---|---|
| service/customer-clothes-mask | assets/illustrated/service/customer-clothes-mask.webp | 512×512 | 완료 |
| actors/customer@look0 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look1 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look2 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look3 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look4 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look5 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look6 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer@look7 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |

8색은 같은 원본과 치마 마스크를 재사용한다. 후드티·정장·노신사 신규 시트 및 앉기·먹기·마시기 전용 자세는 미완료다.


## 2026-10-26 카페 개선 용량 검증 (현재)
이 절은 위 이전 용량·무손실 메모보다 최신이다. 235개 WebP를 원래 가로·세로와 알파를 유지해 재인코딩했다. 대화 시트도 일부 손실 인코딩으로 바뀌었다. 변경 부분 합계는 14,261,046 → 10,828,316바이트이며 원본은 D:/yeoni-qa/cafe-ux/asset-review/originals에 보존했다.

등록 419개 키의 중복 경로를 한 번만 합산하고 로컬 글꼴을 더한 전송 대상은 394개 파일, **14,937,208바이트(14.94MB)**다. 최대 파일은 글꼴 432,504바이트로 1.5MB 미만이다. 15,000,000바이트 예산을 올리지 않았으며 여유는 62,792바이트다. 신규 아트 추가 시 다른 그림을 다시 검토해야 한다.

comparison-00~19.jpg를 직접 열어 변경 전후를 비교했다. 마을 4계절 지도·타이틀·농장·대화 시트·대표 얼굴에서 비교 이미지 크기상 뚜렷한 추가 압축 손상은 찾지 못했다. 원래 시트의 잘못된 크롭이나 자세까지 해결했다는 뜻은 아니다. 의뢰의 루나는 대화 시트의 올바른 320×384 프레임을 써서 다른 프레임의 귀 조각을 제외한다.

글꼴: assets/fonts/YeoniUI-Subset.woff2, 이름 Yeoni UI, OFL은 assets/fonts/OFL.txt. 출처와 수정 기록은 REUSE.md 참조.

### 재성의 섬 지도 정본 교체
`ui/town-map-*` 네 표시 키는 원작의 동일한 `assets/ui/jaeseong-island.webp`(1536×1024, 240,258바이트)를 공유한다. 원작 CDN 파일을 재인코딩·확대하지 않고 복사했다. 기존 720×600 계절 지도 파일은 현재 로컬·Git에 남아 있으며, 아직 배포 제외한 것으로 계산하지 않는다.

### 기존 화분·조명의 표시 범위 보정
원본 WebP와 생성 기록은 보존했다. src/render/assets.js에서 objects/plant의 [34,0,94,120], objects/lamp의 [14,0,70,128] source rect를 로드 시 한 번 적용하여 옆 물체 조각을 제외한다. 같은 결과를 상점·편집 썸네일과 카페 Canvas에서 쓴다. 새로 그린 에셋이 아니며 러그의 원본 잘림은 해결한 것으로 보고하지 않는다.
신규 개별 가구9종·4종 걷기/방향별 착석·연이 오른쪽·아메리카노·지친 영냥이는 원본 로컬 미도착으로 아직 미등록이다. 기존 전체 ZIP은 사용자 첨부 실패했고 최신 전달 정본은 cafe-furniture-individual.zip, cafe-customers-walking.zip, cafe-customers-seated.zip, cafe-character-menu-extras.zip 네 묶음이다.

### 추가 외관·조리 아트 연결 준비 (원본 미도착)
아래는 레지스트리와 연결 코드만 있다. manifest.ready·생성완료 기록에 추가하지 않았고, 새 파일을 다운로드하거나 생성하지 않았다.

| 키 | 런타임 규격 | 상태 | 연결 |
|---|---|---|---|
| buildings/cafe_original | 256×256 | 완료 | 첫 카페 외벽·지붕 |
| buildings/cafe_blossom | 256×256 | 완료 | 꽃 입구 외벽·지붕 |
| buildings/cafe_salon | 256×256 | 완료 | 연꽃 살롱 외벽·지붕 |
| actors/luna_sis_cook | 512×384 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/cook_bowl | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/cook_pitcher | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |

외관은 `assets/illustrated/buildings/cafe_<theme>.webp`, 배우는 `assets/illustrated/actors/luna_sis_cook.webp`, 소품은 `assets/illustrated/service/cook_<name>.webp`를 예정 경로로 쓴다. 실제 크롭·배율 검수 후 규격은 통합 시 조정 가능하다. 현재는 기존 건물 아이콘과 입구 장식이 그대로 표시된다. 신형 건물이 실제 로드됐을 때만 기존 입구 장식을 중복 합성하지 않는다.
조리 진행0~22%는 prepare(0행),22~82% 음료는 extract(1행)/오븐은 bake(2행),82~100%는 plate(2행)다. 4프레임은 해당 단계의 job.progressMs에서160ms 단위로 결정한다. UI 시간 누적 없이 저장 복원·일시정지에 같은 프레임을 유지하고 reduced motion은0프레임이다. 완료·취소·이동 중에는 전용 시트를 쓰지 않는다.
소켓은 추정하지 않는다. 원본 수신 후 `ASSET_UPDATES.actors.luna_sis_cook.cookSockets`에 `verified:true`와 phase별4개 프레임 배열을 작성한다. 각 프레임의 bowl/pitcher/ingredient/dish는 `{x,y,width,layer:'front'|'back'}`로, x/y는128셀 내 소품 바닥중앙, width도셀단위다. 그 전에는 소품을 그리지 않는다. 재료는 해당 메뉴의 실제 재료 첫 키, 접시는 실제 menuId를 사용한다. 연이·다른 직원 역할은 바꾸지 않았다.

### 외관 원본 도착 및 로컬 적용
외관 ZIP 5,394,584B의 CRC·경로를 검사하고 D:/yeoni-qa/art/cafe-ux/generated-source-v1에 원본 ZIP/PNG 및 패키지별 INTEGRATION을 보존했다. SHA256 c3ae3e7e363c6d30dac1b03f33770d2c99f54596f54c7ad2690d6de870bd3050. 위 외관 3개만 ready 등록했다. 앞 절의 외관 미도착 상태는 이 기록으로 갱신하며 조리 아트는 여전히 대기다.
미리보기는 최대200 CSS px, 게임용 외관은256px다. 고DPR용 고해상도 완성은 아니며 원본1254px는 보존한다. 세 문턱은 같은 정규화 앵커128/240.64로 배치했다. 외관 합계42,860B를 추가하며 농장 바닥을 같은800×800 WebP q60으로 최적화(158,618→137,732B, 기존대비 PSNR33.51dB)했다. 전후 픽셀 직접 비교, 원본해시 검증 백업은 generated-source-v1/preserved-runtime/farm_ground.webp.

| actors/customer_original | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/original_walk_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_original_seated | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/original_seated_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_student | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/student_walk_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_student_seated | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/student_seated_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_office | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/office_walk_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_office_seated | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/office_seated_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_elder | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/elder_walk_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_elder_seated | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| service/elder_seated_clothes_mask | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/chair_down | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/chair_up | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/chair_left | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| objects/chair_right | 128×128 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| ui/botanical_left | 192×224 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| ui/botanical_right | 192×224 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| ui/botanical_divider | 256×68 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| ui/botanical_pot | 128×160 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/yeoni_idle_right | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| icons/americano | 96×96 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| ui/neo_cat_tired | 256×256 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look0 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look1 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look2 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look3 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look4 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look5 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look6 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated@look7 | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |
| actors/customer_seated | 512×512 | 완료 | 사용자 전달 원본 · 비율 유지/프레임 정규화 |

신규 원본 25개는 D:/yeoni-qa/art/cafe-ux/generated-source-v1에 보존한다. normalized-runtime/normalization.json에 셀별 visible bounds를 기록했다. 이전 계절 지도 사본은 현재 재성의 섬 정본 경로로 대체되어 128px 보관용으로 축소했고 이전 원본은 preserved-runtime-new-art에 해시와 함께 보존했다. 신규 손님은 4종×걷기/방향별 착석이며 추가 4종은 옷 마스크만 변색한다.

| objects/grand_table | 256×256 | 완료 | 기존 테이블 아트 비율 유지 재사용 |
| objects/grand_planter | 128×160 | 완료 | 식물 아트 재사용 |
| objects/long_cabinet | 256×192 | 완료 | 픽업 선반 그림을 장식 수납용으로 재사용 |


최종 알파 검수: 신규 런타임의 떨어진 조각 제거·안전 여백 보정 후103시트/1,204프레임오류0. 원본은 수정하지 않았으며 cleaned-runtime/alpha-cleanup.json 및 seated-margin-cleanup.json, runtime-before-alpha-clean에 가공 기록과 이전 결과를 보존한다. 현재 배포assets 전체14,875,442B,단일1.5MB이하.

### 2026-10-27 사냥 보상 동료 원본 재사용
|키|파일|규격|출처|
|---|---|---|---|
|ui/kfp_player|assets/illustrated/actors/kfp_player.webp|644×112, 가변폭8프레임|사용자 Killer Flower Pig 원본, REUSE 참조|
새 타이틀 가로·세로 원본은 아직 소비 PC에 도착하지 않아 교체하지 않았다.

| ui/kfp_player | 644×112 | 완료 | 사용자 승인 원본 8프레임 · REUSE 참조 |

### 조리 소켓 실측 완료
루나 언니128px 정규화 시트의 준비0/1 재료 소켓(88,58)/(102,56), 폭11. 볼·피처는 원본에 그려져 있어 별도 중복 부착하지 않는다. 완성 단계는 빈손2/3프레임을 번갈아 사용하고 실제 메뉴 아이콘을(89,78)/(85,77),폭19로 붙인다. 음료에 원본 케이크가 보이는 문제를 피했다. 12프레임 실제 렌더 비교는 kfp-full/cooking-sockets.png. 신규 PNG는 필요하지 않다.

### 프리뷰 원본 가변 프레임 검사
KFP player 원본은128px격자로 자르지 않는다. check-sprites.py가 실제 KFP_PLAYER의8개 프레임 경계·중첩·발앵커·빈프레임·전체폭과 검수 원본SHA256을 검사한다. 기존 일반시트의 투명여백/알파조각 검사는 그대로 유지한다.

## 2026-10-27 모션 v2 로컬 통합

공식 연분홍 머리 루나 언니 조리 4×3, 루나·네오 쟁반걷기/내려놓기/닦기 각4×4, 연이 왼쪽계산4×2. 셀128, 발64,122. 등분하지 않고 제공 rect를 사용했다. 연이 왼쪽 시트는 준비됐지만 기존 계산대 재배치는 승인 보류라 현재 방향을 유지한다.

| actors/luna_place_plate | 39216 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/luna_sis_cook | 35952 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/luna_tray_walk | 38812 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/luna_wipe | 41302 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/neo_place_plate | 29140 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/neo_tray_walk | 33446 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/neo_wipe | 38470 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |
| actors/yeoni_idle_left | 24286 bytes | 원본 D:/yeoni-qa/art/cafe-ux/motion-v2 |

기존20시트는 해상도 유지·q84·알파17단계로 최적화. 원본 백업/hash는 motion-v2/before-runtime-integration, 비교자료는 budget-trial. PSNR 및 실제 배경 합성 비교 후 채택했으며 걷기 반대발 교대와 뒤쪽 닦기 자세에는 원화 한계가 남는다. 고객 전환4종도 별도 행 등록 후 게임에 연결했다.

| actors/luna_place_plate | 512×512 | 완료 | 모션 v2 정규화 |

| actors/luna_tray_walk | 512×512 | 완료 | 모션 v2 정규화 |

| actors/luna_wipe | 512×512 | 완료 | 모션 v2 정규화 |

| actors/neo_place_plate | 512×512 | 완료 | 모션 v2 정규화 |

| actors/neo_tray_walk | 512×512 | 완료 | 모션 v2 정규화 |

| actors/neo_wipe | 512×512 | 완료 | 모션 v2 정규화 |

| actors/yeoni_idle_left | 512×256 | 완료 | 모션 v2 정규화 |

## 고객 전환 모션 v2

| service/original_transition_clothes_mask | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look0 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look4 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| service/student_transition_clothes_mask | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look1 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look5 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| service/office_transition_clothes_mask | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look2 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look6 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| service/elder_transition_clothes_mask | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look3 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |
| actors/customer_transition@look7 | 512×640 | 완료 | 정확 rect·공통 스케일·발64,122 |

앉기 4방향×4프레임, 일어서기는 역순, 오른쪽 결제4프레임(현재 왼쪽 결제는 좌우 반전). 옷 마스크는 기존4유형의 색 기준을 재사용한다. 기존 정지 착석과 연결되는 몸 크기/골반 접점은 실제 화면에서 별도로 검수한다. 전환 시트 끝자세의 골반은 셀 y105 부근이므로 기존 정지 시트의 y93과 같은 좌석에 맞추도록 렌더 발 위치를 보간한다.

## 모션 v2 게시 전 여백 보정
원본 크롭에서 12시트를 다시 정규화했다. 인물별 공통 스케일/발64,122를 유지하고 실제 알파 끝은121로 두어6px 이상 여백을 확보했다. 루나 홀3시트는 모두0.282051배, 네오는0.36배이며 프레임마다 몸을 확대하지 않는다. 조리 마지막 프레임의 몸에서 분리된12px 원본 잔점만 제거했다. 기존 런타임 및 정본 PNG는 D:/yeoni-qa/art/cafe-ux/motion-v2/margin-refinement에 보존한다. 손·쟁반·조리 음식 소켓도 같은 변환을 적용했다. 배포 assets 전체14,865,494B, 등록484개. 원화의 약한 뒤쪽 닦기 숙임/일부 반대발 교대는 그림을 왜곡해 만들지 않고 한계로 남긴다.


2026-10-28: 타이틀 세로·가로 및 재성 지도는 D:/yeoni-qa/art/cafe-ux/ui-handoff/yeoni-ui-codex-handoff/references 의 제공 원화에서 비율을 유지해 WebP로 변환했다. 가로 타이틀은 CSS 전용이며 지도 좌표는 원본의 정규화 좌표를 쓴다.


### 2026-10-28 새 재성의 섬 원화
사용자 승인한 신규 원화는 외부 참조 이미지 없이 생성했으며 원본은 D:/yeoni-qa/art/cafe-ux/new-island-20261028/original-worldmap.png에 보존한다. assets/ui/jaeseong-island.webp는 1152×768 경량 파생본이다. 새 원화의 위치·길은 src/ui/world-navigation-data.js를 따른다.

카드 뒤집기 뒷면 assets/ui/island-card-back.webp는 Code Destiny의 달빛 타로 뒷면을 480×720 WebP로 축소한 CSS 전용 파생본이다. 출처는 docs/REUSE.md를 따른다.
