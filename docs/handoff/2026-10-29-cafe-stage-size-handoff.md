---
status: done
updated: 2026-10-29
next: "완료 — push·배포는 사용자 요청 때 단계 8대로"
---
# 인수인계 — 카페 무대를 크게, 캐릭터가 잘 보이게 (2026-10-29)

앞 인계 [2026-10-29-remaining-work-handoff.md](2026-10-29-remaining-work-handoff.md)는 `status: done`(release 2026.10.29.4, 54ee6ef 배포·Game checks·Vercel·Pages 성공).

## 결과 (2026-10-29, 브랜치 fix/yeoni-counter-cooking-20261028, 미push)
| 단계 | SHA | 내용 |
|---|---|---|
| A | 5d83708 | 상단 바 한 줄·칩 아이콘+값(이름은 title·화면 읽기용, ≥1100에서 이름 표시). 데스크톱 61px, 모바일 94px |
| B | b037359 | 세로 화면 명령줄 두 줄(보조 버튼 아이콘·영업 시작 한 줄 + 48px 탭). 첫날 안내는 무대 위 떠 있는 카드. 모바일 패널 110/106px |
| C | 37aaee6 | ≥900 옆 패널 320px(안내→영업 시작→탭→서랍→보조 줄). 옆 칸 서랍 주문 목록 36dvh 제한 해제 |
| D | dc113ab | `computeView` 여백 cols+1.4·윗벽 2.2칸(높이가 남으면 3칸까지), 배우 ×1.1(`ACTOR_SCALE`) |
| E | 6996a75 | 가로 폰(max-height:500 가로)에도 옆 패널 min(440px,52%), 상단 바 50px 한 줄, 카메라 버튼 세로 |

무대 높이 / 타일(px), before2 → 최종:

| 화면 | 준비 | 영업 |
|---|---|---|
| 1180×860 | 447/23.5 → 799/43.9 (93%) | 608/32 → 799/43.9 |
| 1280×800 | 387/20.4 → 739/40.6 (92%) | 548/28.8 → 739/40.6 |
| 390×844 | 407 → 640 / 29.1 | 586 → 644 / 29.1 |
| 360×640 | 203 → 436 / 24.0 | 366 → 440 / 24.2 |
| 844×390 | 0 → 340 / 18.7 | 286/15.1 → 340 / 18.7 |

- 검증: `npm test` 398/398, check-assets 518/518(런타임 16718528바이트), check-sprites 오류 0, `git diff --check` 통과. 주문 팝오버·서랍(5주문) 390·1280·844 다시 찍음(`D:/yeoni-qa/cafe-ux/orders-20261029/c2-*`·`d2-*`·`e2-*`), 팝오버는 무대 안. 비교 이미지 `D:/yeoni-qa/cafe-ux/stage-size-20261029/compare-*.png`
- 목표 미달·남은 일: 모바일 상단 바 94px(목표 ≤92 — 두 줄 모두 44px 터치 유지), 가로 상단 바 50px(목표 ≤44 — 칩 44px+테두리). 세로 화면 첫날 안내 카드는 접기 없이 무대 아래쪽(360에서 96px)을 가린다. 윗벽 그림은 넓은 화면에서 0.8칸 잘림. 실기기 미검증

## 요청 원문
> 이 게임은 카페가 메인인데 다른 ui가 너무 커서 카페가 너무 작게보인다. 그러니까 훨씬 더 캐릭터들도 잘보이고 카페가 커보이도록 개선해주고 컨텍스트가 길어졌으니 다른 세션에서 진행할 수 있도록해줘 클리어 이후에

(첨부 화면: 1180×860 데스크톱 영업 준비 화면. 카페 방이 가운데 약 330px 폭으로만 보이고 위 상태 카드 줄·아래 첫날 안내·영업 시작·명령줄이 화면 절반을 차지)

## 새 세션에 붙여 넣을 명령
```
C:\Users\user 에서 세션을 열고:
/handoff C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking/docs/handoff/2026-10-29-cafe-stage-size-handoff.md
```

## 첫 행동
1. 작업 폴더 `C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking`(워크트리, 브랜치 `fix/yeoni-counter-cooking-20261028`)에서 `git status`·`git fetch origin`·`git log --oneline -5`. HEAD는 이 문서 커밋(origin/main 54ee6ef·b354784 위)
2. `npm test` 398/398 확인(`npm test > <scratchpad>/t.txt 2>&1; grep -E "^ℹ (tests|pass|fail)" <scratchpad>/t.txt` — 파이프로는 요약이 안 보일 때가 있다)
3. 개발 서버: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5311/` 가 200이 아니면 `PORT=5311 npm start`(백그라운드)
4. 아래 "단계" 1부터. 이미 승인된 범위라 다시 묻지 않는다

## 지금 상태(측정, 2026-10-29)
측정 스크립트 `D:/yeoni-qa/cafe-ux/stage-size-20261029/measure.py <tag>` (Playwright Python, msedge, 준비·영업 × 5뷰포트, `<tag>-<mode>-<W>x<H>.png` 저장 + 무대 사각형 출력). 기준 화면은 같은 폴더 `before-*.png`.

| 화면 | 뷰포트 | 상단 바 | 하단 패널 | 무대(#stage) 높이 | 타일(px) |
|---|---|---|---|---|---|
| 준비 | 1180×860 | 140 | 273 | **447** (52%) | 23.5 |
| 준비 | 1280×800 | 140 | — | 387 | 20.4 |
| 준비 | 390×844 | 140 | 297 | 407 | 21.4 |
| 준비 | 360×640 | 140 | — | **203** | 10.7 |
| 준비 | 844×390 | 52 | — | **0 (버그)** | — |
| 영업 | 1180×860 | 140 | — | 608 | 32 |
| 영업 | 1280×800 | 140 | — | 548 | 28.8 |
| 영업 | 390×844 | 140 | — | 586 | 27.4(폭 제한) |
| 영업 | 360×640 | 140 | — | 366 | 19.3 |
| 영업 | 844×390 | 52 | — | 286 | 15 |

타일 = `computeView`(`src/render/cafe-view.js:26`) `min(w/(cols+2.2), h/(rows+3))`, 방은 12×16 세로형. 그래서 데스크톱은 **높이가 타일을 정하고 좌우는 텅 빈다**(1180 폭에 방 약 330px). 배우 크기는 타일 배수(`cafe-view.js:207` `actorSize` 1.8·착석 2.2)라 타일이 커지면 캐릭터도 같이 커진다.

원인 셋:
1. 상단 바 140px = 시간·골드 줄 + 상태 카드 5칸 줄(`.cafe-status-details`, `yeoni-growth.css:8` 5열 그리드, 67px)
2. 준비 화면 하단 패널 273~297px = 첫날 안내 카드(`.first-day-guide` 89~112px) + 영업 시작 버튼(52px) + 명령줄(60px)이 세로로 쌓임. `#panel`은 `cafe-play.css:7`에서 무대 아래 고정(`cafe-play.css:25` 모바일 `max-height:46dvh`)
3. 넓은 화면인데도 패널이 무대 **아래**에 있다. 예전 옆 패널 규칙(`cafe-brand.css:12` `.panel{border-left…;flex-direction:column}`)은 `cafe-play.css:7`이 덮어썼다. 세로형 방이라 남는 좌우 공간에 패널을 두면 높이를 통째로 무대에 줄 수 있다

## 목표(수치로 검수)
- 1180×860·1280×800: 준비·영업 모두 무대 높이 ≥ 뷰포트의 78%, 타일 ≥ 34px(지금 준비 23.5)
- 390×844: 준비 무대 ≥ 560px(지금 407), 영업 ≥ 640px
- 360×640: 준비 ≥ 360px(지금 203), 영업 ≥ 440px
- 844×390(가로 폰): 준비 무대 0px 버그 해결, ≥ 300px
- 캐릭터 이름표·주문 말풍선·테이블 팝오버(4ef091e 영수증)·대화 말풍선(`#talk`)·튜토리얼 스포트라이트가 겹치거나 화면 밖으로 나가지 않는다
- 터치 영역 44px 유지, 대화창 톤(크림 바탕·로즈 테두리·도트 틀 `main-pixel.css`) 유지

## 설계(이 순서로, 단계마다 측정 → 커밋)
### A. 상단 바 압축 (140 → 데스크톱 ≤ 64, 모바일 ≤ 92)
- 데스크톱(≥900): 상태 5칸을 시간·골드와 **같은 한 줄**의 작은 칩(아이콘+값, 높이 32~36)으로. 라벨("인기도" 등)은 `title`/`aria-label`로
- 모바일: 시간·골드 줄 아래 칩 한 줄(높이 ≤ 30, 가로 스크롤 금지 — 5개가 360px에 들어가게 값만)
- 마크업은 `src/ui/hud.js:133`(`cafe-status-main`·`cafe-status-details`, 칩은 모두 `cafe.drawer`/`yeoni.kitchen` 버튼이라 action은 유지), 스타일은 `yeoni-growth.css:8·31`. CSS 로드 순서상 새 규칙은 `main-pixel.css`(마지막) 또는 `cafe-play.css` 끝에
### B. 준비 화면 하단 패널 압축 (273 → ≤ 130)
- 영업 시작 버튼과 명령줄(영업 준비·주방·직원·모카 배달·재성의 섬)을 **한 줄**로: 데스크톱은 [명령줄 …][영업 시작하기] 가로 배치, 모바일은 명령줄 위 얇은 영업 시작 바(48px)
- 첫날 안내 카드(`.first-day-guide`, 튜토리얼 진행용)는 무대 위 **떠 있는 작은 카드**로(데스크톱: 방 옆 빈 공간, 모바일: 무대 하단 겹침 1~2줄 + 접기). 버튼 action(`아메리카노 만들기 · 행동력 1`)과 튜토리얼 스포트라이트 대상은 그대로
- "수첩·음악·메인" 보조 줄은 명령줄 끝 아이콘 버튼이나 상단 바 메뉴로
### C. 넓은 화면 옆 패널(≥ 900 & 가로)
- 무대 = 왼쪽(또는 가운데) 전체 높이, 패널 = 오른쪽 280~320px 기둥. 영업 중 주문 서랍(`.cafe-drawer`)도 이 기둥을 쓴다(지금 1280 서랍이 무대를 가린다 — `D:/yeoni-qa/cafe-ux/orders-20261029/after2-1280-drawer.png`)
- `cafe-play.css:7` `#panel` 규칙을 미디어쿼리로 나눈다. `src/ui/app.js:115` `computeView(cssW,cssH,…)`는 #stage 실제 크기를 쓰므로 CSS만 바꾸면 따라온다(리사이즈 핸들러 확인)
### D. 무대 여백·배우 크기 (`computeView`)
- 여백 `cols+2.2`·`rows+3`(벽·정원 그림 자리)을 실제 방 그림 테두리에 맞춰 줄인다(예 `cols+1.4`·`rows+2.2`). 방 그림 가장자리 정원이 약간 잘려도 된다. 바닥 12×16과 카운터·입구는 다 보여야 한다
- C 이후에도 캐릭터가 작으면 `actorSize`를 10%까지 키우고 이름표 글자(`drawNameTags` fs 12~14)를 확인
- 확대(`zoomTo` 1~2.4)·카메라 드래그·`focusCell`·`#hits`·배지·`cellToPx`가 모두 같은 view를 쓰므로 공식만 바꾸면 된다. `computeView`를 직접 부르는 테스트(`tests/cafe-ux.test.mjs`·`cafe-play-loop.test.mjs`·`parallel-cooking.test.mjs`·`manual.test.mjs`·`expanded-view.test.mjs`, `computeView(390,500)` 등)가 깨지면 수치 기대만 고친다
### E. 가로 폰(844×390) 준비 무대 0px
- 패널이 높이를 다 가져가 `#stage`가 0이 된다. C의 옆 패널을 `(orientation:landscape) and (max-height:500px)`에도 적용하면 같이 풀린다. 상단 바도 가로에서는 한 줄(≤ 44)

## 단계
1. measure.py 준비 화면 픽스처에 튜토리얼 본 것 넣기(지금 준비 화면은 첫날 튜토리얼 시트가 덮는다 — `s.tutorials=Object.fromEntries(Object.keys(GUIDES).map(x=>[x,true]))`를 준비 모드에도, 단 첫날 안내 카드는 보이게 `s.ledger.story.m0` 상태 확인) → `py measure.py before2` → 위 표 갱신
2. A 상단 바 → measure + 1180·390·360 눈으로 확인 → `npm test` → 커밋
3. B 준비 하단 패널 → 첫날 튜토리얼을 처음부터 한 번 따라 해 스포트라이트·버튼이 맞는지 → 커밋
4. C 넓은 화면 옆 패널 + 주문 서랍 → `D:/yeoni-qa/cafe-ux/orders-20261029/shot.py`·`shot3.py`(주문 팝오버·서랍, 5주문)도 다시 찍기 → 커밋
5. D 무대 여백·배우 크기 → 테스트 수치 조정 → 커밋
6. E 가로 폰 → 커밋
7. 전체: `npm test`·`node tools/check-assets.mjs`·`PYTHONIOENCODING=utf-8 py tools/check-sprites.py`·`git diff --check`, before/after 나란히 비교 이미지(`D:/yeoni-qa/cafe-ux/stage-size-20261029/compare-*.png`) → 이 문서에 SHA·수치 기록·`status: done` → 한국어 보고(실기기 "미검증")
8. push·배포는 사용자가 요청할 때만. 요청 받으면 release.json(version 다음 번호, baseCommit=HEAD, assetBytes=`check-assets` "런타임" 값) → `git push origin HEAD:main` → `gh run list`(Game checks·pages)·`gh api repos/rei1237/yeoni-atelier/commits/<sha>/statuses`(Vercel)·`curl https://rei1237.github.io/yeoni-atelier/release.json`

## 작업 규칙(요약, 원문은 AGENTS.md·CLAUDE.md)
- 이번 일은 UI/CSS·뷰 계산만. 게임 상태·경제·TEMP 수치는 건드리지 않는다. 상태 변경은 `dispatch`·`tick`에서만
- 사용자 저장 삭제 금지(QA 저장은 dev 키 `SAVE_KEYS.dev`, `qa-st.` 접두). bare `git stash` 금지. 커밋 꼬리말 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, 수정 끝나면 단계마다 자동 커밋
- 산출물(스크린샷·비교)은 D 드라이브 `D:/yeoni-qa/cafe-ux/stage-size-20261029/`
- 편집은 py 헤어독 `assert a in s; s=s.replace(a,b)` 방식이 안전(CRLF 경고는 무시). Bash cwd가 `C:\Users\user`로 되돌아가니 매번 워크트리로 `cd`
- 한국어로 보고. 실기기는 "미검증"
