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
