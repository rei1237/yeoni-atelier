# 개발 안내

## 실행·구조
Node 20+, `npm start`, http://127.0.0.1:5280. 빌드 없는 ES module 게임. `npm test`, `node tools/check-assets.mjs`로 검사한다.

| 경로 | 책임 |
| --- | --- |
| src/config/rules.js, balance.pdf.js, balance.temp.js | 원래 규칙·PDF 제안·최신 결정 및 조정 수치 |
| src/core/ | 시계·입력·풀·시드 난수·저장 |
| src/data/ | 캐릭터·복장·가구·메뉴·농장·적·무기·인연 |
| src/game/engine.js | dispatch 명령과 tick 라우팅 |
| cafe.js, nomination.js | 주문·조리·서빙·포장·계산·접대·도움·피버 |
| cafe-growth.js, reputation.js | 레벨·분위기·인기·손님 구성·가격 |
| finance.js, payroll.js | 대출·환전·상환·이자·급여 원장 |
| hunt.js, hunt-growth.js, hunt-rewards.js, moka-armory.js | 전투·영구 성장·생존 보상·개별 강화 |
| hidden-guest.js, bonds.js | 서한비 히든 조건·선택지 인연 |
| src/story/ | 프롤로그·월별 합류·5년 진행·인연 이야기 |
| src/render/ | 에셋 등록·방향별 배우·카페·사냥 캔버스 |
| src/ui/ | HUD·시트·조리 단계·음악·튜토리얼 |
| styles.css, game-ui.css, novel.css | 기본 레이아웃·현재 모바일 UI·대화창 |

## 상태·명령
게임 상태는 JSON 객체다. 제품 UI는 dispatch(state, command)로만 게임 상태를 바꾼다. 조리 단계·시트·카메라·배속은 UI 상태다. tick은 100ms 이하로 나누고 숨김·일시정지에서는 진행하지 않는다. 1/2/3배속은 영업에만 적용하며 SOS·직접 조리에 진입하면 1배로 돌아간다.

hostbar.open은 5월 개장 이야기 완료 후 열린다. neoStress는 도움·접대·정산으로 변하며 기존 네오 능력치를 바꾸지 않는다. outfits는 캐릭터별 소유·장착 상태다. outfit.unlock/outfit.equip는 캐릭터·영입·가격을 검증한다.

state.people는 접대와 사냥 잠금을 공유한다. 영냥이는 네오의 사냥 모습이다. 서한비는 영입 후 선택 가능하다. 탐사 중 빌드·지속 성장·사냥꾼별 영구 강화는 별개다.

visit.bill은 계산대에서 650ms 후 한 번만 지급한다. 포장도 결제 경로는 같지만 서버 작업·테이블을 점유하지 않는다. 프리미엄 주문 자격은 생산 자격과 분리한다. 서빙 소품은 실제 task/order/menuId로 선택하고 방향별 트레이에 해당 메뉴 아이콘을 합성한다.

급여는 payroll.months의 shift ID로 중복을 막고 하순 한 번 정산한다. 대출은 request ID, 이자는 월, 사냥은 탐사 ID로 중복 지급을 막는다. 난수는 state.rng를 사용하며 Math.random()은 표현에만 허용한다.

## 저장·호환
저장 버전 3. 키는 yeoni-atelier.save.v1 / yeoni-atelier.dev-save.v1로 분리한다. 이전 저장에 없는 농장·금융·급여·강화 데이터를 보충하고 기존 잔액·빚은 유지한다. 이어하기는 일시정지로 시작한다. 인테리어 초안은 저장하지 않고 사냥 전장은 복귀 시 새로 구성한다. 오프라인 보상과 사용자 확인 없는 초기화는 없다.

## 이미지·오디오
manifest.ready만 로드한다. asset-updates.js가 새 그림 경로·규격을 등록하며 누락 시 표시 대체만 쓴다. tools/register-illustrated.mjs는 저장소의 docs/art-prompts.json에서 manifest·ASSETS 표를 재생성한다.

런타임 배우는 4×4, 셀128px, 방향 앞/왼쪽/오른쪽/뒤, 고정 발 기준. 의상 미리보기는 4×1 셀256px다. 대화 초상화는 정적이다. drawWorkProps는 운반·정리 소품과 메뉴를 합성한다. 세부 규격은 ASSETS 표가 우선한다.

오디오는 사용자 입력 후 재생하고 숨김 시 멈춘다. 기본 음악 꺼짐/효과음 켜짐. 공개 OST만 스트리밍하며 다운로드·결제 권한을 처리하지 않는다. 연결 오류가 게임 진행을 막지 않는다.

## 검증
84개 자동 테스트: 5월 개장·접대·중복 정산·세이브·농장·인연·숨은 영입·100단계·강화·수동/자동·포장 결제·프리미엄 판매·대출·급여·주문 카드 포함. 화면은 DEV fixture로 360/375/390/430/1280px에서 확인했다. tools/sim-year.mjs와 sim-hunt.mjs는 자동 시계 도구이며 실제 사람 플레이로 표현하지 않는다. 실제 모바일 기기 성능과 사람의 5년 운영은 추가 검증 대상이다.

카페 대기 인물은 발 위치를 고정한 호흡·기울임을 인물별 위상으로 재생한다. 보행·대화 초상화에는 추가하지 않고 prefers-reduced-motion/일시정지/배치 편집에서는 끈다. tools/check-sprites.py는 개발 검증용 Pillow12.3.0·NumPy2.3.5로 80시트868프레임의 경계·알파를 검사하며 게임 실행 의존성은 아니다.
