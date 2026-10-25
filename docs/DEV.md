# 개발 문서

## 구조

```
index.html, styles.css        세로형 모바일 화면(320px~), 터치 대상 44px 이상
src/config/
  rules.js                    확정 규칙(바꾸지 않음)
  balance.pdf.js              기획서 v2.0 제안 수치(쪽수 표기)
  balance.temp.js             이번 프로토타입이 정한 임시값
src/core/                     프레임 루프·풀(이식), 조이스틱(변형 이식), 시드 난수, 저장
src/data/                     동료·개발용 임시 동료·배치·대사·메뉴/재료·의상·퀘스트·사냥 무기/적(hunt-kit)·영냥이 장비(gear)·개그 대사(lines)·친밀도 능력(bonds)
src/story/                    프롤로그(prologue.js)·달 이야기와 결말(months.js)·인연 이야기(bonds.js)
src/game/                     게임 규칙(순수 JS, DOM 없음)
  engine.js                   dispatch(명령) / tick(시간 진행)
  state.js                    createGame, 명단·인물 잠금 도우미, 이벤트
  shift.js                    영업 시작·마감·정산
  cafe.js                     손님·주문·조리·서빙·정리·직원 이동
  nomination.js               지명 요청·수락·300초 잠금·도움 요청·피버
  satisfaction.js             M/H/상한/판정/팁/피버 적립 공식(순수 함수)
  auto.js                     자동 운영(플레이어와 같은 명령 사용)
  economy.js                  구매(모카 식재료점/긴급 배달)·상환·퀘스트·영입·의상
  hunt.js                     영냥이 월정석 사냥(뱀서식: 자동 공격·레벨업 카드·진화·사건·보스)
  town.js                     마을: 루나의 저울 환전·무인 장비 좌판·가게 확장(테이블·장식·구역 증축)
  calendar.js                 달력(순·달)·월 이자·행동력·결말·볼 이야기 순서(달 → 인연)
  bonds.js                    친밀도: 대화·선물·함께 일하기, 단계가 열리면 능력
  recipe.js                   조합대(재료 조합 → 레시피 발견 / 영업 중 조리 / 힌트)
  interior.js, space.js       인테리어 편집, 겹침·입구·경로 검사
  offline.js                  오프라인 수익 인터페이스(지급 없음)
src/render/                   에셋 레지스트리, 도형 스프라이트, 카페·사냥 화면
src/ui/                       DOM 패치(morph), HUD, 시트, 앱 연결, 라이트노벨 대화 화면(novel.js, 게임 상태를 바꾸지 않음)
tests/                        node:test
tools/serve.mjs               정적 서버
```

## 핵심 원칙

### 상태와 명령

- 상태는 JSON 하나다. 저장도 이 객체를 그대로 직렬화한다. 클래스나 순환 참조를 쓰지 않는다.
- UI는 상태를 직접 바꾸지 않는다. 모든 변경은 `dispatch(state, cmd)` 를 거친다.
  - 반환값은 `{ ok, reason, reasons, events }` 다.
  - `reason` 은 버튼 아래에 그대로 보여 줄 수 있는 문장이다.
  - 예: `2번 테이블 접대 중 · 02:40 남음`
- 시간은 `tick(state, dtMs)` 만 진행한다.
  - 내부에서 100ms 단위로 쪼갠다.
  - `paused`, 영업 전, 정산 화면에서는 아무것도 진행하지 않는다.
  - 프레임 루프는 숨김·BFCache 상태에서 멈춘다. 복귀하면 시계를 리셋해서 다른 앱에 있던 시간을 시뮬레이션하지 않는다.

### 인물 잠금

- 네오와 영냥이는 같은 인물 id `neo` 를 쓴다.
- `state.people.neo = { activity, form, visitId, tableNo, endAt }`
  - `activity`: `idle` | `hosting` | `hunting`
  - `form`: `human` | `cat`
- 접대 중에는 다른 지명과 사냥을 막는다. 사냥 중에는 영업 시작과 지명을 막는다.

### 1회 지급 장부

- `state.ledger` 의 `sales`, `tips`, `settlements`, `rewards`, `consumes`, `repay` 는 모두 id 를 키로 쓴다.
- 저장 후 다시 불러와도 같은 정산이나 보상이 두 번 들어가지 않는다.

### 무작위

- `state.rng` 에 시드를 저장한다. 저장 후 이어가도 결과가 같다(테스트로 확인).

## 주요 상태 위치

| 상태 | 위치 | 코드 |
| --- | --- | --- |
| 영업 경과 시간 | `state.shift.elapsedMs` | [shift.js](../src/game/shift.js) |
| 지명 300초 | `state.visits[vid].hosting.endAt`, `state.people.neo.endAt` | [nomination.js](../src/game/nomination.js) |
| 만족도 | `hostingScore()` | [satisfaction.js](../src/game/satisfaction.js) |
| 피버 | `state.fever = { gauge, activeUntil }` | [nomination.js](../src/game/nomination.js) |
| 금화·빚 | `state.gold`, `state.debt`, `state.ledger` | [economy.js](../src/game/economy.js) |
| 명단·영입 | `state.roster`, `state.recruitment` | [state.js](../src/game/state.js), [economy.js](../src/game/economy.js) |
| 사냥 | `state.hunt` (레벨·경험치·무기·보조 능력·대기 중인 레벨업 카드 `picks` 포함) | [hunt.js](../src/game/hunt.js) |
| 레시피 | `state.learned` (조합대 발견도 여기에 기록) | [recipe.js](../src/game/recipe.js) |
| 월정석·장비 | `state.moonstone`, `state.gear = { owned, equipped: { weapon, armor, charm } }` | [town.js](../src/game/town.js) |
| 달력·결말 | `state.day`(순 번호), `state.calendar = { ended, endingId, endedDebt }`, `state.ledger.interest`, `state.ledger.story` | [calendar.js](../src/game/calendar.js) |
| 행동력 | `state.ap = { left, talked, gifted, shopped }` (결산을 닫으면 다시 채움) | [calendar.js](../src/game/calendar.js) |
| 친밀도 | `state.affinity` (능력은 저장하지 않고 `bondFx(affinity)` 로 계산) | [bonds.js](../src/game/bonds.js), [data/bonds.js](../src/data/bonds.js) |
| 주방 자동 | `state.autoKitchen` (기본 켬: 조리·서빙·정리) / `state.auto` (전체 자동) | [auto.js](../src/game/auto.js) |

사냥 전장(적·탄 위치)은 WeakMap 에만 두고 저장하지 않는다.

- `hunt.pick {index}`: 레벨업 카드 고르기. 고를 카드가 남아 있는 동안 사냥 시간이 흐르지 않는다.
- `moonstone.exchange {qty}`, `gear.buy {id}`, `expand.table`, `expand.decor {defId}`, `expand.area {id}`: 마을 명령. 영업 준비 중에만.
- `bond.talk {id}`, `bond.gift {id, giftId}`: 친밀도. 영업 준비 중에만, 대화는 행동력 1, 둘 다 순마다 동료 한 명에 한 번.
- `story.seen {id}`: 달 이야기·인연 이야기·결말을 본 기록(`m<달>`, `bond:<동료>:<단계>`, `ending:<id>`). 화면은 `pendingStory()` 가 고른 것만 튼다.
- `gear.equip {slot, id|null}`: 사냥 중에는 못 바꾼다(출발할 때 효과를 고정).
- `kitchen.toggle {on?}`: 주방 자동 켜기/끄기. 일시정지 중에도 쓸 수 있다.
- `shop.buy {ingredientId, qty}`: 영업 준비 중엔 재료값만, 영업 중엔 긴급 배달비가 붙는다.
- `recipe.try {ingredients}`: 영업 전·영업 중에만. 발견은 재료를 쓰지 않고, 영업 중 아는 조합은 `cook` 과 같은 규칙으로 조리한다.
- 조합대에서 고른 재료 목록은 화면 상태(`ui.combo`)일 뿐이고 저장하지 않는다.

## 저장

- 일반 저장 키: `yeoni-atelier.save.v1`
- 개발 저장 키: `yeoni-atelier.dev-save.v1`
- 다른 게임의 키(`kfp.*` 등)는 읽지도 쓰지도 않는다.
- 자동 저장
  - 영업 중 활성 5초마다
  - 주요 명령 뒤
  - 탭을 숨길 때
- 불러오기
  - 영업이나 사냥 중 저장은 **일시정지 상태로** 복원한다.
  - 지원하지 않는 버전이나 손상된 저장은 거절한다.
- 초기화는 `resetSave(storage, key, { confirmed: true })` 일 때만 실행한다.
  - UI에서는 확인 화면을 거친다.

## 개발 모드 (`?dev=1`)

- 별도 저장 키를 쓴다.
- 배속은 저장하지 않는다. 정규 시간 규칙(1,800초·300초)은 그대로이고, 시뮬레이션 진행 속도만 빨라진다.
- `+60초 진행` 버튼이 있다.
- 개발용 임시 동료 `dev_temp_01` 로 영입 흐름을 검증한다.
  - 정식 멤버가 아니다.
  - 일반 게임에는 나타나지 않는다.
- `window.__yeoni` 로 상태를 읽을 수 있다(디버그 전용).

## 영입 흐름

1. 잠금
2. 조건 충족: 임시 조건은 정규 영업 2회 + 첫 상환
3. 만남 이벤트(영업 전에만)
4. 보상 1회 지급
5. 명단 추가(`usableFrom = 다음 영업`)
6. 다음 영업부터 지명 제안 가능
7. 저장 유지

공식 동료 데이터는 [companions.js](../src/data/companions.js) 의 `RECRUITABLE` 에 추가한다. 지금은 비어 있다.

## 테스트

```bash
npm test
```

결과: 39개 통과(rules 7, shift 11, persistence 11, recipe 4, town 6). 2026-10-25 에 `npm test` 로 실행했다.

- `[자동 시계]` 가 붙은 테스트는 엔진 `tick` 으로 30분 영업이나 3분 사냥을 수 초 안에 진행한 것이다.
- **실제 사용자의 30분 플레이테스트가 아니다.** 사람이 30분 동안 직접 플레이하는 테스트는 아직 하지 않았다.
