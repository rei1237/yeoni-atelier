# killerflowerpig 확인·재사용 기록

## 확인한 원본

- GitHub `rei1237/killerflowerpig` 커밋 `1e33016bfae8f31d89161066d993229fe933b777` (HEAD, 확인일 2026-10-24)
  - 원본 저장소는 **읽기만 했다.** 원본에는 쓰기, 커밋, 배포를 하지 않았다.
- 로컬 `Downloads/killerflowerpig-main` 은 `src/` 가 없는 예전 단일 파일 구조였다. 그래서 GitHub 의 모듈 구조를 기준으로 삼았다.
- 읽은 파일
  - `src/core/`: `input.js`, `frame-loop.js`, `pool.js`, `grid.js`, `save.js`, `progression-store.js`
  - `src/game/`: `pickups.js`, `spawner.js`, `weapons.js`, `pets.js`, `enemies.js`

## 재사용한 것

| 원본 | 이 프로젝트 | 방식 |
| --- | --- | --- |
| `src/core/frame-loop.js` | [src/core/frame-loop.js](../src/core/frame-loop.js) | 그대로 이식(동작 변경 없음). 숨김·BFCache 정지, 복귀 시 시계 리셋 |
| `src/core/pool.js` | [src/core/pool.js](../src/core/pool.js) | 그대로 이식. 사냥의 적·탄·드롭에 사용 |
| `src/core/input.js` | [src/core/joystick.js](../src/core/joystick.js) | 변형 이식(아래 참고) |

`joystick.js` 의 변형 내용:

- 가져온 것: 탭 판정, 벡터 계산, 플로팅 조이스틱, WASD, 포인터 캡처, blur 해제
- 바꾼 것: 전역 싱글턴 대신 생성 함수로 만들어, 사냥 화면에서만 켜고 끈다.

## 개념만 참고하고 새로 쓴 것(이식 아님)

이 절은 초기 영냥이 사냥 구현 당시 기록이다. 이후 꽃돼지용 원본 무기·융합 데이터와 능력치 계산·조준 모듈을 추가했다. 현재 재사용 범위는 아래 「동일 원본의 전체 무기 어댑터 추가」를 따른다.

[src/game/hunt.js](../src/game/hunt.js) 와 [src/data/hunt-kit.js](../src/data/hunt-kit.js) 의 다음 부분은 원본의 개념만 참고해 새로 작성했다. **원본 전투 로직을 이식하지 않았다.** 무기·적 이름과 수치는 모두 이 게임의 임시(TEMP) 값이다.

| 새로 쓴 것 | 참고한 원본 개념 |
| --- | --- |
| 가까운 적 자동 조준 | `weapons.js` 의 `nearestEnemy` |
| 생성 누적기 | `spawner.js` 의 `spawnAcc` |
| 자석 흡수 | `pickups.js` 의 magnet |
| 시간에 따라 밀도가 오르는 생성(밀도 목표 + 누적기) | `spawner.js` |
| 무기 레벨 누적, 짝 보조 능력이 있으면 최대 레벨에서 진화(×1.35) | `weapons.js` 의 무기 성장 방식 |
| 별조각(경험치) 등급과 개수 상한 넘으면 합치기 | `pickups.js` 의 젬 등급·병합 |

- 원본의 무기 목록·적 종류·보스·펫 데이터와 진행 저장소(`progression-store.js`)는 가져오지 않았다. 레벨업 카드 3장, 사건(무리·포위·박쥐 떼·엘리트·보스)은 뱀파이어 서바이버류의 일반적인 구조를 이 게임에 맞게 새로 쓴 것이다.
- 원본 저장 모듈(`save.js`)도 쓰지 않았다.
  - 저장 키가 섞이지 않도록 [src/core/save.js](../src/core/save.js) 를 따로 만들었다.
  - `kfp.*` 키는 읽지도 쓰지도 않는다.

## 검증 범위

- 이식한 `frame-loop`, `pool` 은 이 프로젝트의 테스트와 브라우저 확인에서 동작했다.
- 원본 게임의 테스트는 실행하지 않았다.

## 추가 참조 (2026-10-25)
- https://github.com/rei1237/killerflowerpig/blob/main/src/core/character-progression.js (파일 blob ad26294fc5c259b60a2a165a55a4ca1783e0c720): 영구 캐릭터 성장과 일회성 사냥 빌드를 분리하고 보상을 원장으로 보호하는 구조만 참고. 원본 파일 복사 없음. 이 게임은 사용자 요청대로 50레벨 상한 없이 성장하며 자체 깊이/보상/능력 수치를 사용한다.
- 같은 저장소 src/core/progression-store.js: 저장 버전 이전과 별도 characterXP 저장 구조를 읽기 전용 참고. 원본 저장 키·진행 데이터에 접근하거나 수정하지 않는다.

## 2026-10-26 서비스 자료·음악
Code Destiny 로컬 원본의 공개 프로필·라이트노벨 이미지·운명의 찻집 컵 이미지를 읽어 캐릭터 정체성을 대조했다. 재사용 초상화는 윤달·무성·모카·꽃돼지·영냥이·청토끼, 메뉴 컵 6종이다. 신규 캐릭터·의상·타이틀·농장·UI·공격·튜토리얼 등은 imagegen으로 만들고 docs/art-prompts.json에 실제 프롬프트/원본 파일명을 기록했다. 투명 원본 분리·리사이즈는 사용자 요청에 따른 기계적 처리다. docs/sprite-crops.json은 프레임별 원본 경계를 기록한다.

음원은 공식 공개 스트리밍 도메인 music.code-destiny.com을 사용한다. Code Destiny의 lib/r2-public-url.ts와 lib/music-access-policy.js에서 공개 전체 스트리밍 정책을 확인했다. 파일 다운로드·구매·권한 부여는 하지 않는다. 아래는 실제 브라우저 Audio 메타데이터 로드가 성공한 경로와 길이(초)다.

| 경로 | 길이 | 사용 장면 |
| --- | --- | --- |
| DestinyCafe/Kindness.mp3 | 479.40 | 카페 |
| DestinyWar/Dream.mp3 | 101.40 | 농장·대화 |
| DestinyWar/Moonlit Strategy Map.mp3 | 132.48 | 사냥 |
| DEST1NOVA/달빛 운명여행 main title.mp3 | 246.52 | 타이틀·의상·피버 |

효과음은 Web Audio로 합성했다. 외부 음원 샘플을 가져오지 않았다. 기본 음악 꺼짐, 사용자 입력 후 재생, 숨김 시 정지. 음원의 저작권·서비스 다운로드 정책은 그대로 유지한다.

쿠키샵·아이러브 커피의 제조/서빙, 페르소나의 선택지 인연, 용과 같이0 물장사 아일랜드의 고객 취향·팁·피버, 스타듀 밸리·천수의 사쿠나히메의 농사 흐름을 디자인 참고로 삼았다. 해당 상용 게임의 코드·이미지·음악은 복사하지 않았다.

## 2026-10-26 인계 이어받기(단계 사냥·보스)
- 단계 정의(src/data/hunt-stages.js), 보스 예고→행동→회복 패턴(src/game/hunt-boss.js), 희귀 상자 저장 결과·룰렛 표시, 클리어 선택 화면은 원본 코드 없이 새로 썼다. killerflowerpig의 밀도 목표+누적기 개념(위 표)만 이어 쓴다.
- 인계에 첨부된 상용 게임 스크린샷·ISO는 보스 체력바·예고 장판·클리어 선택 같은 정보 구조만 참고했다. 실행 파일·이미지·음악·데이터를 복사하지 않았다.
- 보스 곡: code-destiny 음악 목록(app/music/_data/musicManifest.ts)을 읽기 전용으로 확인했다. 네오 곡은 앨범 수록곡뿐이고 전투곡·서한비 곡은 없어 새로 연결하지 않았다. 보스 장면은 기존 DestinyWar/The Moonlit War Room.mp3를 그대로 쓴다.


## 2026-10-26 카페 UI 글꼴·무료 아트 검토
- 글꼴 원본: [Pretendard](https://github.com/orioncactus/pretendard), SIL Open Font License 1.1. 원본 가변 글꼴을 KS X 1001 완성형 한글·ASCII 중심으로 서브셋한 기존 작업물을 이어받았다. 실제 cmap은 2,487개(한글 2,351개), 파일은 432,504바이트다.
- 수정 글꼴의 내부 family/full/PostScript 이름은 `Yeoni UI` / `YeoniUI-Subset`으로 바꿨다. 예약 이름을 수정본 이름으로 사용하지 않는다. 원본 저작권·OFL 전문은 `assets/fonts/OFL.txt`에 함께 배포한다. CSS는 로컬 WOFF2와 font-display:swap을 쓴다.
- [Kenney Roguelike Indoors](https://kenney.nl/assets/roguelike-indoors)는 CC0이나 픽셀 스타일이므로 현재 부드러운 일러스트에 도입하지 않았다.
- [sierrassets 가구 팩](https://sierrassets.itch.io/pixel-art-furniture-pack)은 픽셀 스타일 후보로 검토하고 가져오지 않았다. 사용 권한을 확보한 신규 에셋으로 기재하지 않는다.
- [Restaurant Game Canvas JS](https://github.com/enesbabekoglu/Restaurant-Game-Canvas-JS)는 공개 게임 참고 후보로 확인했으며 코드·그림을 복사하지 않았다.
- 고객 8색은 기존 고객 시트와 Python HSV 옷 영역 마스크를 공유하고 런타임 Canvas에서 치마 색만 회전한다. 머리·피부를 통째로 회전하지 않는다. 신규 3인물이나 앉은 자세를 생성한 결과는 아니다.

### 재성의 섬 지도
사용자의 원작 라이트 노벨 이미지 재사용 요청에 따라 `public/codedestiny-novel.html`의 `jae` 매핑이 가리키는 https://assets.code-destiny.com/CodeDestinyNovel/background/재성의%20섬.webp 정본을 사용한다. 원본 1536×1024·240,258바이트를 그대로 보존한다. 공개 무료 라이선스 에셋으로 주장하지 않는다. 원작 저장소는 읽기만 했다.

재성의 섬 런타임 파생 파일은 동일1536×1024 q76 WebP(199,442바이트)이다. 원본 정본은 D:/yeoni-qa/art/world-reference/재성의 섬.webp에 보존했다. PSNR36.80dB 및 나란히 픽셀 비교를 확인했다. cafe-engine/cafe는 부모가 공식 README의 Rust/SDL2 범용 프레임워크 구조를 확인한 참고이며 코드·아트를 가져오거나 엔진을 전환하지 않았다.

### 가구 편집 상호작용 참고
부모가 공식 자료를 조사해 전달한 선택→회전→확정, 보유 목록 검색·분류 흐름을 참고했다. 제3자 코드·그림·브랜드는 복사하지 않았다.
- EA Sims4 회전: https://help.ea.com/en/articles/the-sims/the-sims-4/how-to-rotate-sims-4/
- Disney Dreamlight Valley 검색/정렬: https://disneydreamlightvalley.com/news/update-aug-21-2024
- Nintendo Happy Home Designer 설명서21–25쪽: https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_3ds_2/animal_crossing__happy_home_designer/ElectronicManual_Nintendo3DS_AnimalCrossingHappyHomeDesigner_EN.pdf

### 음악실 확장 (로컬)
원작 `app/music/_data/musicManifest.ts`의 곡·아티스트·공개 URL·표지 메타데이터를 읽어 103곡을 수록하고 artistKey=neo인20곡을 제외했다. `music-lounge.module.css`의 현재곡/앨범/분류/목록/재생바 정보 구조와 달빛 팔레트를 참고했으며 게임용 컨트롤은 새로 작성했다. 원작 정책 파일은 읽기만 했고 인증·결제·API·DB를 변경하지 않았다. 음원과 표지를 로컬 assets로 복사하지 않고 사용자 재생 시 공개 스트리밍하며 오프라인 사전 캐시/다운로드를 제공하지 않는다. 정확한 목록은 MUSIC-CATALOG.md.

## 2026-10-27 사용자 승인 Killer Flower Pig 재사용
- 소스: rei1237/killerflowerpig, `1e33016bfae8f31d89161066d993229fe933b777` (읽기 전용). 별도 공개 LICENSE는 루트에 없으며 소유 사용자의 명시 재사용 지시에 근거한다. 타 프로젝트 일반 재배포 허가를 뜻하지 않는다.
- `src/game/petal-charge.js` → `src/game/kfp-petal-charge.js`: 코드 그대로. 단조 증가 처치 카운터·포격 자체 충전 금지·선차감 보존.
- `asset/sprites/player.webp` 38,550B, SHA256 `3d5c24cafbe32191876671fdb2f26b7f24982e48add724d138ff0ab566d8369b`: 원본 그대로. player 프레임 메타데이터를 `src/data/kfp-player.js`에 옮김. 원본 D:/yeoni-qa/art/kfp-reference-20261027/player.webp 보존.
- `src/data/weapons.js` shotgun 기본값 damage11/cd1s/count5/speed560/life.55s/pierce2/spread.6을 현재 Pool과 ms 시계에 맞춰 연결. source의 모든 무기·진화·융합 시스템 이식 완료를 뜻하지 않는다.
- 원본 docs/survival-art.md는 소유자 제공 캐릭터 참조와 생성 그림을 명시. 음악/제3자 자산은 복사하지 않았다. Vampire Survivors 바이너리·그림·음원 추출 없음.

### 동일 원본의 전체 무기 어댑터 추가
`src/data/weapons.js`, `src/data/fusions.js`를 kfp 접두 데이터로, `src/game/cannon-targeting.js`를 순수 조준 모듈로 옮겼다. `src/game/weapons.js`의 능력치 계산을 `kfp-stats.js`로 분리하고 공격·충돌은 현재 엔진용 `kfp-combat.js`로 작성했다. 정확한 9기본/9진화/12패시브/14조합 대조와 미이식 직업 테크·전설 장비 범위는 KFP-PORT.md. 기존 첫 산탄만 이식했다는 기록은 초기 단계 기록이다.
