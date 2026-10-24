# 도트 에셋 규격과 생성 프롬프트

지금 저장소에는 **이미지 파일이 하나도 없다.** 모든 항목은 도형 대체(fallback)로 그린다.
이 문서는 Codex 등으로 도트 그림을 만들 때 따를 규격과 프롬프트 초안이다. 프롬프트로 실제 이미지를 만들어 확인한 적은 아직 없다.

정의는 [src/render/assets.js](../src/render/assets.js) 에 있고, 그리는 코드는 [src/render/sprite-renderer.js](../src/render/sprite-renderer.js) 다.
게임 로직은 에셋 파일을 읽지 않는다. 그림이 없거나 불러오기에 실패하면 자동으로 도형으로 돌아간다.

## 1. 이미지 넣는 순서

1. 아래 규격대로 PNG 를 만들어 표의 경로에 둔다(투명 배경, 색 수 제한, 안티에일리어싱 없음).
2. [assets/manifest.json](../assets/manifest.json) 의 `ready` 배열에 `"묶음/키"` 를 추가한다.
   ```json
   { "ready": ["actors/yeoni", "portraits/yeoni", "icons/bean"] }
   ```
3. `npm start` 로 열어 확인한다. 매니페스트에 없는 키는 아예 요청하지 않으므로, 파일이 없어서 404 가 쌓이지 않는다.

## 2. 공통 규칙

- 기본 단위 **32px**. 캐릭터 프레임 32×32, 타일 32×32, 아이콘 16×16, 초상화 96×96.
- 화면에는 **정수 배율로만** 키운다(32 → 64 → 96…). 캔버스는 `imageSmoothingEnabled = false`, CSS 는 `image-rendering: pixelated`.
  - 오브젝트·타일은 칸 크기가 화면 폭에 따라 달라서 정수 배율이 아닐 수 있다. 픽셀 폭이 약간 고르지 않을 수 있다.
- 외곽선 1px, 어두운 남보라 계열(#1b1530 근처). 순수 검정 외곽선은 쓰지 않는다.
- 한 시트 안의 색 수는 32색 이하를 권장한다. 반투명 픽셀은 그림자 1단계만 허용한다.
- 광원은 왼쪽 위.
- 배경은 완전 투명(알파 0). 흰 배경이나 체크무늬를 굽지 않는다.

## 3. 캐릭터 시트 (actors)

- 프레임 32×32, 기준점 (16, 30) = 발밑 중앙.
- **열 = 프레임**(최대 6열 → 시트 폭 192px).
- **행 = 상태**. 아래 8행 순서를 방향마다 반복한다. 쓰지 않는 상태도 빈 행으로 자리를 남긴다(행 번호 = 상태 순번 + 방향 순번 × 8).
- **방향 블록 순서**: `down`, `left`, `right`, `up` → 시트 높이 4 × 8 × 32 = 1024px.

| 행 | 상태 | 프레임 | fps | 반복 | 쓰이는 곳 |
| --- | --- | --- | --- | --- | --- |
| 0 | idle | 4 | 4 | 예 | 대기 |
| 1 | walk | 6 | 10 | 예 | 이동 |
| 2 | cook | 4 | 6 | 예 | 연이 조리 |
| 3 | serve | 4 | 8 | 아니오 | 서빙 |
| 4 | host | 4 | 4 | 예 | 네오 접대 |
| 5 | react | 4 | 8 | 아니오 | 판정·피버·조합 발견 반응 |
| 6 | attack | 4 | 12 | 아니오 | 영냥이 공격 |
| 7 | hurt | 2 | 8 | 아니오 | 영냥이 피격 |

정의에서 `null` 인 상태는 idle 로 그린다(`resolveState`). 그 행은 비워 둬도 된다.

| 키 | 경로 | 이름 | 비고 |
| --- | --- | --- | --- |
| `yeoni` | assets/sprites/actors/yeoni.png | 연이 | 카운터·조리·서빙 |
| `yeoni_pig` | assets/sprites/actors/yeoni_pig.png | 연이(꽃돼지) | cook·serve·host·attack 없음. 프롤로그·연출용 |
| `neo` | assets/sprites/actors/neo.png | 네오 | 접대 |
| `neo_cat` | assets/sprites/actors/neo_cat.png | 영냥이 | 네오의 고양이 모습. 같은 인물 id `neo` 를 쓰고 렌더링 키만 다르다. 사냥 주인공 |
| `customer` | assets/sprites/actors/customer.png | 손님 | 몸 색은 코드가 손님마다 바꾸지 않는다(그림이 있으면 그림 색 그대로) |
| `dev_temp_01` | assets/sprites/actors/dev_temp_01.png | DEV 임시 동료 01 | **개발 전용. 정식 에셋을 만들지 않는다** |

## 4. 적 시트 (enemies)

- 방향 블록은 `down` 하나만 쓴다. 행 번호 규칙은 캐릭터와 같아서 **idle = 0행, walk = 1행, hurt = 7행**이고 2–6행은 비운다.
- 프레임: idle 4, walk 4, hurt 2. 열 최대 4 → 폭 128px × size.
- `size` 배수만큼 프레임이 커진다(정예 2 → 64×64, 보스 3 → 96×96). 기준점도 같은 배수(16·30 × size).

| 키 | 크기 | 이름 | 출처 |
| --- | --- | --- | --- |
| `shade_hand` | 1 | 검은 손 | 원작 EP.01 에 나오는 존재 |
| `shade_bat` | 1 | 그림자 박쥐 | 게임 임시 적(정식 설정 아님) |
| `shade_blob` | 1 | 그림자 덩어리 | 게임 임시 적 |
| `shade_wisp` | 1 | 도깨비불 | 게임 임시 적 |
| `elite_hand` | 2 | 큰 검은 손 | 게임 임시 정예 |
| `boss_hand` | 3 | 거대한 검은 손 | 게임 임시 보스 |

## 5. 초상화 (portraits)

- 96×96 한 칸에 표정 하나. 표정을 **가로로** 이어 붙인다(아래 순서). 프롤로그 대화창에 쓴다.
- 가슴 위 반신, 아래쪽이 잘려도 되게 바닥에 붙인다. 정면에서 약간 비스듬히.

| 키 | 표정 순서 | 시트 크기 |
| --- | --- | --- |
| `yeoni` | normal, smile, surprised, sulky, determined | 480×96 |
| `yeoni_pig` | normal, smile, surprised, sulky | 384×96 |
| `neo` | normal, smile, serious, flustered | 384×96 |
| `neo_cat` | normal, smug, serious, surprised | 384×96 |

## 6. 아이콘 (icons, 16×16)

| 키 | 이름 | 키 | 이름 |
| --- | --- | --- | --- |
| `bean` | 원두 | `gem_s` | 별조각(소) — 경험치 |
| `milk` | 우유 | `gem_m` | 별조각(중) |
| `tea` | 찻잎 | `gem_l` | 별조각(대) |
| `flour` | 밀가루 | `fish` | 구운 생선 — 회복 |
| `egg` | 달걀 | `magnet` | 수염 자석 — 전부 끌어오기 |
| `sugar` | 설탕 | `bomb` | 달빛 폭탄 — 화면 적 피해 |
| `night_dew` | 밤이슬 | `chest` | 별 상자 — 무료 강화 |

경로: `assets/sprites/icons/<키>.png`

메뉴(완성 음식) 아이콘은 아직 레지스트리에 없다. 지금은 [menus.js](../src/data/menus.js) 의 `color` 원으로 그린다.
메뉴 아이콘을 추가하려면 먼저 `assets.js` 의 `icons` 에 메뉴 id(예: `moon_milk_tea`)로 항목을 만들고, 주방·트레이·레시피 발견 화면이 그것을 쓰게 코드를 고쳐야 한다.

## 7. 오브젝트·타일

오브젝트 그림은 **가구가 차지하는 칸 상자 전체**에 한 장으로 그린다(타일 1칸 = 32px).
가구를 회전해서 가로세로 비율이 바뀌면 그림 대신 도형으로 그린다(회전 시트는 아직 없다).

| 키 | 칸 | 픽셀 | 이름 |
| --- | --- | --- | --- |
| `drink` | 2×1 | 64×32 | 음료 머신 |
| `oven` | 2×1 | 64×32 | 오븐 |
| `pass` | 2×1 | 64×32 | 서빙대 |
| `counter` | 1×2 | 32×64 | 카운터 |
| `table` | 1×1 | 32×32 | 테이블(상태 표시는 코드가 위에 덧그린다) |
| `chair` | 1×1 | 32×32 | 의자 |
| `plant` | 1×1 | 32×32 | 화분 |
| `bookshelf` | 2×1 | 64×32 | 책장 |
| `lamp` | 1×1 | 32×32 | 별 조명 |
| `rug` | 2×2 | 64×64 | 꽃무늬 러그 |
| `pot` | 1×1 | 32×32 | 조합 냄비(조합대 화면용, 카페 바닥에는 아직 안 그림) |

경로: `assets/sprites/objects/<키>.png`

| 타일 키 | 이름 | 비고 |
| --- | --- | --- |
| `cafe_floor` | 카페 바닥 | 이어 붙여도 이음새가 안 보이게 |
| `cafe_wall` | 카페 벽 | 맨 윗줄 |
| `river_field` | 사주의 강 밤 들판 | 사냥 배경. 이어 붙임 가능하게 |

경로: `assets/tiles/<키>.png`

## 8. 색 기준 (원작 디자인 문서에서 확인한 것)

| 대상 | 기준 |
| --- | --- |
| 연이(사람) | 긴 머리 탁한 분홍, 장미색 눈, 연꽃 장식, 라벤더 리본, 아이보리·더스티 로즈 옷 |
| 연이(꽃돼지) | 파스텔 분홍 돼지, 왼쪽 귀 옆 연꽃, 라벤더 리본 |
| 네오(사람) | 은발, 남색 옷, 은빛 코트 |
| 영냥이 | 흰 2등신 고양이, 금빛 초승달이 달린 남색 마법모자, 보라→금 그라데이션 눈, 파란 보라 보석이 달린 검은 목걸이 |
| 검은 손 | 어둡고 끈적한 손 모양. 네오의 금빛 사주성광에 베인다 |
| 밤 팔레트 | #0b1220 (밤하늘), #665087 (보라), #e5c58e (금빛) |
| 연이 팔레트 | 분홍·장미 + 샴페인 골드 |
| 네오 팔레트 | 한밤 남색·보라 + 금색 #e8d5a3 |

원작에 없는 캐릭터·의상·설정은 만들지 않는다. 다른 데스티노바 멤버의 외형은 공식 자료가 없으므로 그리지 않는다.

## 9. 생성 프롬프트 초안

모든 프롬프트 앞에 아래 공통 문장을 붙인다.

> **STYLE**: `pixel art sprite sheet, 32x32 pixel grid per frame, crisp 1px dark indigo outline (#1b1530), no anti-aliasing, limited palette (max 32 colors), top-left light source, transparent background, cute chibi proportions (2.5 heads tall), cozy fantasy cafe game, consistent across frames, no text, no watermark`

시트 배치를 같이 적는다: `layout: columns = animation frames, rows = states in order idle, walk, cook, serve, host, react, attack, hurt; repeat the 8-row block for facing down, left, right, up (top to bottom); sheet 192x1024`.
이미지 생성 모델은 정확한 격자를 자주 틀린다. 한 상태·한 방향씩 따로 만든 뒤 도구로 시트에 이어 붙이는 쪽이 안전하다.

### 캐릭터

- **yeoni**: `young woman barista, long muted dusty-pink hair, rose-colored eyes, small lotus flower hair ornament, lavender ribbon, ivory and dusty-rose robe-style dress with a small cafe apron, cheerful expressive face`. cook = 거품기를 젓는 동작, serve = 쟁반을 내미는 동작, react = 두 팔을 들고 깡충.
- **yeoni_pig**: `small pastel-pink piglet, lotus flower beside the left ear, lavender ribbon, round body, tiny hooves, big sparkling eyes`. idle·walk·react·hurt 만.
- **neo**: `calm young man host, silver hair, navy outfit with a long silver coat, gentle smile, elegant posture`. host = 한 손을 가슴에 대고 살짝 숙이는 인사.
- **neo_cat**: `small white chibi cat, navy wizard hat with a golden crescent moon, violet-to-gold gradient eyes, black collar with a blue-violet gem, deadpan expression`. attack = 앞발을 휘두르며 금빛 빛줄기, hurt = 움찔하며 모자가 들썩.
- **customer**: `generic cafe customer, simple casual clothes in neutral colors, brown hair, friendly` (특정 원작 인물로 보이지 않게).

### 적 (down 방향만, 행 0·1·7)

- **shade_hand**: `a creeping black hand made of dark ink-like shadow, thin violet glow at the edges, faint pale eye-glint on the palm, menacing but cute enough for a cozy game`.
- **shade_bat**: `small shadow bat, dark purple, pink glowing eyes, flapping`.
- **shade_blob**: `round dark purple shadow slime, single pale eye, wobbling`.
- **shade_wisp**: `blue-violet will-o-the-wisp flame, flickering, white core`.
- **elite_hand** (64×64 프레임): shade_hand 와 같은 디자인, `larger, dark crimson tint, golden eye-glint`.
- **boss_hand** (96×96 프레임): `huge black shadow hand rising from the ground, red glowing eye on the palm, swirling dark aura`.

### 초상화 (96×96, 표정 가로 배열)

STYLE 의 `32x32 pixel grid per frame` 를 `96x96 bust portrait per frame` 으로 바꾼다.
- **yeoni**: 위 연이 외형. normal / smile / surprised(눈 동그랗게) / sulky(볼 부풀림) / determined(주먹 쥠).
- **yeoni_pig**: 위 꽃돼지 외형. normal / smile / surprised / sulky.
- **neo**: 위 네오 외형. normal / smile(부드럽게) / serious / flustered(살짝 붉어짐).
- **neo_cat**: 위 영냥이 외형. normal / smug(한쪽 눈 가늘게) / serious / surprised(모자가 튀어 오름).

### 아이콘 (16×16)

STYLE 의 격자를 `16x16 icon` 으로 바꾸고 키마다 한 장: 원두 한 알, 우유병, 찻잎 두 장, 밀가루 자루, 달걀, 각설탕, 푸른 밤이슬 방울, 하늘색·연두·주황 별조각(소·중·대 순으로 크게), 구운 생선, 고양이 수염 모양 자석, 초승달 무늬 폭탄, 금테 별 상자.

### 오브젝트·타일

STYLE 에 `top-down 3/4 view furniture, fits exactly WxH pixels` 를 붙인다.
- drink: 은색·하늘색 에스프레소 머신 / oven: 둥근 벽돌 오븐 / pass: 나무 서빙대와 벨 / counter: 세로로 긴 나무 카운터와 계산대
- table: 둥근 나무 2인 테이블 / chair: 나무 의자 / plant: 토분 화초 / bookshelf: 낮은 책장 / lamp: 별 모양 스탠드 조명 / rug: 분홍 꽃무늬 러그 / pot: 구리 조합 냄비
- cafe_floor: 따뜻한 베이지 나무 바닥(이음새 없는 반복) / cafe_wall: 크림색 벽과 나무 몰딩 / river_field: 밤의 강가 풀밭, #0b1220·#665087·#e5c58e 팔레트, 반복 가능
