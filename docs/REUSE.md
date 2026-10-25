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
