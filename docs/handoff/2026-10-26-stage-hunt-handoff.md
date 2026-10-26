# 인계 — 2026-10-26 단계 사냥·인연 자동화 이어받기

- 브랜치 `feat/hostbar-mobile-monthly-cast`, PR https://github.com/rei1237/yeoni-atelier/pull/2 — 사용자 승인으로 main 머지(e961b1d). 이후 작업은 새 브랜치·새 PR로
- 정본 요구: 인계 묶음 `outputs/claude-handoff/03-REQUIREMENTS.md`, 수락 목록 `05-ACCEPTANCE.md`
- 이 문서는 "출시 완성" 선언이 아니다. 실기기·사람 플레이테스트는 하지 않았다.

## 이번에 한 일(커밋 순)
1. 인계 로컬 v3/v4 코드·일러스트 보존, 신규 빚 1억 테스트 정정(기존 저장 빚 보존)
2. 렌더: 손 위치 기반 쟁반·천 소품, 대화 배지, 이름표 겹침 회피
3. 카페: 수동 주방 2탭, 재료 부족 시 모카 긴급 배달, 정리는 플레이어 탭
4. 인연 권한(`src/game/permissions.js`): 루나 ♥2 홀, 루나 언니 ♥2 주방, 네오 ♥3 농장 맡기기. 해금 뒤에도 기본 꺼짐. 전 직원 스트레스(`state.stress`), 인연 선택은 소설 화면
5. 마을: 윤달 무기 공방, 무성 가구·꽃 상점(증축 게시판 대체), 루나 쉼터, 첫 방문 이야기 ledger 1회
6. 사냥: 100단계 준비시간 → 보스 보장 → 처치 = 클리어(`stage:<사냥꾼>:<n>` 1회). 공통 생성기, 보스 9종, 희귀 상자는 주운 순간 결과 저장(룰렛은 연출)
7. 서한비: 네오 30·40·50·70단계 사건 → 100단계 검은 호랑이 → 초대장(옛 5조건 폐지)
8. 경제 재조정(TEMP): 보스 월정석 75→20, 정예 14→6, 단계 보상 배율 0.5→0.1, 환율 1,200→500G, 공방 가격 두 배
9. 문서: AGENTS(10-26 결정 블록), README, DEV, DESIGN(cafe-brand.css 기준 색), WORLD, TUNING, REUSE, QA

## 검증(재현 방법)
- `npm test` → 125/125
- `node tools/check-assets.mjs` → 409/409(금융 아이콘 별칭 크기 정정). 전체 17.77MB로 15MB 예산 초과가 남아 CI "game"이 실패한다. 한도는 올리지 않았다. q90 재인코딩으로는 17.05MB까지만 줄어든다(ASSETS.md "등록과 검사")
- `py tools/check-sprites.py` → 93시트/1048프레임 오류 0
- 시뮬(자동 봇, 사람 플레이테스트 아님): `node tools/sim-year.mjs [--with-hunt] [--loan]`, `node tools/sim-hunt.mjs`. 시드 7/42/20261025. 결과는 docs/QA.md·docs/TUNING.md·docs/qa/*.json
- 화면: 개발 서버 `PORT=5291 npm start` 후 `/?dev=1`. 360/390/430/1280 캡처는 `D:/yeoni-qa/phase6/shots`(흐름·수동 주방·마을·인연·사냥, reduced-motion 사냥 1회). 콘솔 오류·HTTP 400 이상 0, 가로 스크롤 없음

## 남은 일·확인 필요
- 실기기(iOS Safari·Android WebView) 터치·성능. 검은 그림자 연출이 `ctx.filter`를 쓰므로 구형 Safari에서 실루엣이 안 보일 수 있다
- 사람 플레이테스트로 단계 사냥 난이도와 경제 재확인(봇은 클리어 뒤 계속 내려가므로 사람과 다르다)
- 대출로 24테이블까지 증축하면 180순 매출이 5테이블의 약 4.2배다(TUNING 대출 증축 행). 5테이블 고정 봇보다 실제 상한이 높으니 증축 가격·대출 한도를 사람 플레이로 다시 볼 것
- 생존 보너스(floor(초/30)×(4+단계))와 사냥 결과의 옛 생존 행은 "재검토 대상"으로 남겨 두었다
- 무성 영입 조건 문구가 아직 "사냥에서 90초 생존"이다(단계제 이후에도 경과 시간으로 동작)
- 보스곡(The Moonlit War Room)은 서한비 에피소드 전용: 서한비 이야기 5편과 사냥 중 검은 호랑이(boss_hanbi)만. 일반 단계 보스는 깊이별 사냥곡
- 하단 탭 이름은 바꾸지 않았다. 인연 소설 선택은 친밀도 차이 외 분기 없음
- `cafe-brand.css`가 쓰는 `--rose`·`--sage`·`--cream`·`--rose-dark` 변수가 정의되어 있지 않다(이전부터)
- `src/game/hunt.js`의 `totalMonths` import는 쓰이지 않는다
- 15MB 전송 예산: talking·wardrobe·actors 시트의 품질 하향(q80 이하) 또는 해상도 축소 중 무엇을 할지 아트 검수와 함께 결정할 것
