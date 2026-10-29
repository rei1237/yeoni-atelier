---
status: done
updated: 2026-10-29
next: "완료 — push·배포는 사용자 요청 때 단계 4대로"
---
# 인수인계 — 대기 중 연이는 정면, 로딩 화면은 부드러운 대기 동작 (2026-10-29)

앞 인계 [2026-10-29-cafe-stage-size-handoff.md](2026-10-29-cafe-stage-size-handoff.md)는 `status: done`(release 2026.10.29.5, 2024b6e 배포, Game checks·Pages·Vercel 성공).

## 요청 원문
> 인수인계로 대기화면일때 연이가 오른쪽이 아니라 정면 가계쪽으로 바라보고 있도록해주도록해줘 그 외에도 로딩 화면을 좀 더 연이가 걸어가는 모습 이외에 다른 애니메이션으로 부드럽게 표현하는게 좋겠고 일단 인수인계 문서와명령어만 만들어줘봐

해석(이 해석으로 진행, 다시 묻지 않는다):
- "대기화면"은 연이가 할 일 없이 계산대에 서 있는 때다. 영업 준비 화면과, 영업 중 계산할 손님이 없는 때를 둘 다 포함한다.
- "정면 가게 쪽"은 화면을 보는 방향(`facing:'down'`)이다. 홀과 가게를 내려다보는 정면 모습을 쓰고, 오른쪽 옆모습(`yeoni_idle_right`)은 쓰지 않는다.
- 로딩 화면은 걷는 모습을 빼고, 연이가 정면에서 숨 쉬고 눈 깜빡이고 손 흔드는 대기 동작으로 부드럽게 바꾼다.

## 새 세션에 붙여 넣을 명령
```
C:\Users\user 에서 세션을 열고:
/handoff C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking/docs/handoff/2026-10-29-yeoni-front-boot-handoff.md
```

## 첫 행동
1. 작업 폴더 `C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking`(워크트리, 브랜치 `fix/yeoni-counter-cooking-20261028`)에서 `git status`·`git fetch origin`·`git log --oneline -5`를 실행한다. HEAD는 이 문서 커밋이고, origin/main 0d06ffd 바로 위다.
2. `npm test` 398/398을 확인한다(`npm test > <scratchpad>/t.txt 2>&1; grep -E "^ℹ (tests|pass|fail)" <scratchpad>/t.txt`).
3. 개발 서버: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5311/`가 200이 아니면 `PORT=5311 npm start`를 백그라운드로 띄운다.
4. 아래 "단계" 1부터 진행한다. 이미 승인된 범위라 다시 묻지 않는다.

## 지금 상태(코드 확인, 2026-10-29)
### 연이 방향
- 배치별 `yeoniFacing`(src/data/layout.js:97-103)
  - 기본 `legacy`와 `entrance-left`는 `'right'`, `entrance`는 `'down'`이다.
  - 기본 배치에서는 계산대가 연이 오른쪽에 있어서 "계산대 너머 입구를 본다"(src/game/cafe.js:70 주석)는 이유로 오른쪽을 본다.
- 영업 준비 화면: src/render/cafe-view.js:202가 `facing: layout.yeoniFacing`을 그대로 쓴다. 그래서 기본 배치에서는 늘 오른쪽을 본다.
- 영업 중: 상태 `state.staff.yeoni.facing`이 정한다.
  - 시작할 때 `yeoniFacing`으로 정한다(cafe.js:70).
  - 제자리에 돌아올 때(cafe.js:542), 반응할 때(cafe.js:810), 불러올 때(cafe.js:828)도 같은 값으로 정한다.
  - 렌더 경로는 cafe-view.js:197 `facing: s.facing`이다.
- 스프라이트 선택(src/render/sprite-renderer.js:29-35)
  - `'right'`이면 `yeoni_idle_right`, `'left'`이면 `yeoni_idle_left`를 쓴다.
  - `'down'`이면 대기에는 `yeoni_idle`, 몸짓에는 `yeoni_idle`의 몸짓 행(33행)을 쓴다.
- 정면 시트 `actors/yeoni_idle`: 512×512, 128px 셀 4열이고 `stateRows` idle 0·welcome 1·bow 2·cashier 3이다. 계산 몸짓(`cafeGesture.kind='cashier'`, cafe.js:791)도 정면 행이 있다.
- 방향을 확인하는 테스트
  - tests/checkout-preview.test.mjs:50·57: `s.staff.yeoni.facing === 'right'`
  - tests/counter-migration.test.mjs:12
  - tests/fans-stage.test.mjs:123

### 로딩 화면
- 마크업: index.html:31 `#boot-screen`
  - `.boot-walking-yeoni`, h1 "연이가 꽃길을 걷고 있어요", `progress#boot-progress`, `p#boot-copy`
- 스타일
  - cafe-brand.css:4(기본 배치)
  - world-island.css:19: `actors/yeoni.webp` 걷기 행을 `steps(4)` 0.65초로 넘긴다. 뚝뚝 끊겨 보인다.
  - world-island.css:22: 동작 줄이기 설정이면 애니메이션을 끈다.
- 진행: src/ui/app.js:120 `loadAssetImages(...onProgress)`가 progress 값과 `boot-copy` 문구("찻잔과 친구들을 준비하고 있어요. n / total")를 고치고, 끝나면 `#boot-screen`을 지운다.
- 로딩 화면은 JS 모듈보다 먼저 그려진다. 그래서 CSS와 작은 이미지만으로 움직여야 한다(JS 애니메이션 금지).
- `yeoni_idle.webp`는 75KB로, 지금 쓰는 `yeoni.webp`(71KB)와 비슷하다.

## 목표(검수)
1. 기본 배치(`legacy`)와 `entrance-left`에서 연이 대기 모습이 정면이다.
   - 영업 준비 화면에서 정면이다.
   - 영업 중 계산할 손님이 없을 때 정면이다.
   - 손님이 계산 자리(`checkout` 상태, 계산 대기열 첫 칸)에 오면 지금처럼 계산대 쪽(오른쪽)을 보고, 손님이 떠나면 다시 정면으로 돌아온다.
   - 계산 몸짓(cashier)·반응 몸짓이 깨지지 않는다.
2. `entrance` 배치는 지금처럼 정면 그대로다.
3. 로딩 화면에 걷기가 없다.
   - 연이가 정면에서 천천히 숨 쉬듯 떠오르고, 눈 깜빡임과 손 흔들기를 부드럽게 오간다.
   - 끊김 없는 ease 곡선을 쓰고, 프레임 넘김은 느리게 한다.
   - 동작 줄이기 설정에서는 정지 한 장이다.
4. 로딩 화면 첫 그림까지 걸리는 시간이 지금보다 늘지 않는다. 새 이미지 요청은 1개 이하다.
5. `npm test` 전부 통과. 바뀐 동작마다 테스트 한두 개를 추가한다.

## 설계
### A. 대기 중 연이 정면 (렌더만 바꾼다)
- 게임 상태(`staff.yeoni.facing`)와 배치 데이터(`yeoniFacing`)는 그대로 둔다. 동선, 계산 위치, 기존 테스트 기대를 지키기 위해서다.
- 그리는 순간에 "대기 중이면 정면"으로 바꾼다.
  - cafe-view.js 준비 화면(202행): `facing:'down'`. 개인 요리 중(`personalJob`)이면 지금 방향을 유지한다.
  - cafe-view.js 영업 중 staff 렌더(197행) 직전에 판정 함수를 둔다. 예: `yeoniIdleFacing(state,s,layout)`.
  - 정면 조건: `s.id==='yeoni'`이고, 걷지 않고(`!s.path?.length`), 들고 있는 것이 없고(`!s.carry`), 청소하지 않고(`s.action!=='clean'`), 계산 자리에 `checkout` 상태 손님이 없다.
  - 손님이 있으면 `s.facing`(오른쪽)을 그대로 쓴다.
  - 계산 몸짓(`cafeGesture`)이 진행 중이면 그 손님을 보도록 오른쪽을 유지한다. 정면 계산 행으로 바꿔도 되지만 둘 중 하나로 통일한다(추천: 계산 중에는 오른쪽 유지).
- 방향이 바뀔 때 툭 튀지 않는지 본다. 필요하면 손님이 떠난 뒤 400ms쯤 늦게 정면으로 돌린다. 화면 연출 시계(`state.shift.elapsedMs`)만 쓰고 상태는 바꾸지 않는다.
- 판정 함수는 export해 테스트한다.
  - 손님이 없으면 `'down'`, checkout 손님이 있으면 `'right'`, entrance 배치는 늘 `'down'`인지 확인한다.

### B. 로딩 화면 대기 동작 (CSS만)
- `.boot-walking-yeoni` 클래스 이름은 `.boot-yeoni`로 바꿔도 된다. 바꾸면 index.html, world-island.css, 동작 줄이기 규칙을 함께 고친다.
- 배경: `actors/yeoni_idle.webp`. 셀 128, 시트 512×512, 행 0 idle·행 1 welcome.
- 동작 세 겹
  1. 몸 떠오름: `transform: translateY(0 → -4px)`, 2.8초 `ease-in-out` `alternate infinite`. 발밑 그림자 타원(`::after`)은 같은 주기로 `scale(1 → .9)`, 투명도 .35 → .25.
  2. 프레임: 행 0 idle 4프레임을 `steps(4)` 2.4초로 천천히 넘긴다. 이때 걷기 0.65초보다 훨씬 느리게 한다. 5~6초마다 행 1(손 흔들기)을 한 번 섞는다. 두 키프레임 묶음을 쓰거나, `background-position-y`를 키프레임 % 구간으로 바꾸면 된다.
  3. 주변: 찻잔 김이나 꽃잎 2~3개가 천천히 떠오르며 흐려진다. `::before`와 작은 span에 CSS 원형 그라데이션·블러·opacity를 쓴다. 새 이미지는 만들지 않는다.
- progress 막대: 얇게 둔다. 색은 지금 `#b67889`. 채워질 때 `transition: value`가 안 먹으므로 그대로 둔다. 원하면 바깥에 은은한 shimmer(`linear-gradient` 이동)를 단다.
- 문구: h1 "연이가 꽃길을 걷고 있어요"는 걷기가 빠지면 맞지 않는다.
  - 대안: "연이가 손님 맞을 채비를 하고 있어요" 또는 "연이가 카페 문을 열고 있어요".
  - 연이는 일하지 않고 계산만 하므로(AGENTS.md), 요리·청소를 하는 문구는 쓰지 않는다.
  - `aria-label="연이가 걷고 있어요"`도 같이 고친다.
- `@media(prefers-reduced-motion:reduce)`: 모든 애니메이션을 끄고 행 0 첫 프레임 정지.
- 로딩 화면 이미지 요청 확인: DevTools 네트워크 또는 Playwright `page.on('request')`로 boot 시점 이미지 요청 수를 센다. yeoni.webp 대신 yeoni_idle.webp를 쓰면 1개 그대로다. yeoni.webp는 게임에서 다시 받으니 캐시에는 영향이 없다.

## 단계
1. A: cafe-view.js에 판정 함수를 넣고 준비·영업 렌더에 적용한다. 테스트는 판정 함수 2~3개를 tests/에 추가한다(기존 파일이나 `tests/yeoni-facing.test.mjs`).
   - QA: `D:/yeoni-qa/cafe-ux/yeoni-front-20261029/`에 찍는다.
   - 화면: 390×844·1180×860의 준비 화면, 영업 중 손님 없음, 계산 손님 도착, 손님이 떠난 뒤.
   - 픽스처: 앞 인계의 `D:/yeoni-qa/cafe-ux/stage-size-20261029/measure.py` FIX 함수를 복사하고, 저장은 dev 키에 한다.
   - 정면 시트 쪽이 실제 에셋인지 원본 크기로 확인한다.
   - 끝나면 커밋한다.
2. B: index.html과 world-island.css를 고친다(필요하면 cafe-brand.css:4의 img 규칙도 정리한다).
   - QA: 로딩을 늦춰 화면을 잡는다. `page.route('**/*.webp', ...)`로 지연시키고, 0.5초 간격 스크린샷 6장과 동작 줄이기 모드 1장을 찍는다.
   - 프레임 사이 끊김을 눈으로 확인한다. 가능하면 Playwright `video`(record_video_dir)로 3초 영상을 남긴다.
   - 끝나면 커밋한다.
3. 전체 검증: `npm test`, `node tools/check-assets.mjs`, `PYTHONIOENCODING=utf-8 py tools/check-sprites.py`, `git diff --check`를 돌린다. 그다음 이 문서에 SHA와 결과를 적고 `status: done`으로 바꾼 뒤 한국어로 보고한다(실기기는 "미검증").
4. push와 배포는 사용자가 요청할 때만 한다. 요청을 받으면 다음 순서로 한다.
   - release.json을 고친다: version은 2026.10.29.5 다음 번호, baseCommit은 HEAD, assetBytes는 `check-assets`의 "런타임" 값.
   - 커밋한 뒤 `git push origin HEAD:main`.
   - `gh run list`로 Game checks와 pages를 확인한다.
   - `gh api repos/rei1237/yeoni-atelier/commits/<sha>/statuses`로 Vercel을 확인한다.
   - `curl https://rei1237.github.io/yeoni-atelier/release.json`로 배포된 버전을 확인한다.

## 작업 규칙(요약, 원문은 AGENTS.md)
- 이번 일은 렌더와 로딩 화면 CSS만 바꾼다. 게임 상태, 경제, TEMP 수치, 배치 데이터(`yeoniFacing`)는 건드리지 않는다. 상태 변경은 `dispatch`와 `tick`에서만 한다.
- 연이는 일하지 않고 계산만 한다. 로딩 화면에 요리·청소 동작이나 문구를 쓰지 않는다.
- 사용자 저장을 지우지 않는다(QA 저장은 dev 키 `SAVE_KEYS.dev`). bare `git stash`는 쓰지 않는다.
- 커밋 꼬리말은 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`이고, 단계마다 자동으로 커밋한다.
- 산출물은 D 드라이브 `D:/yeoni-qa/cafe-ux/yeoni-front-20261029/`에 둔다.
- 편집은 py 헤어독 `assert a in s; s=s.replace(a,b)` 방식이 안전하다. CRLF 파일은 줄바꿈을 맞춘다. Bash cwd가 `C:\Users\user`로 되돌아가니 매번 워크트리로 `cd`한다.
- 한국어로 보고한다. 실기기 결과는 "미검증"으로 적는다.

## 결과 (2026-10-29)
- 단계 1 `e44ace5` — `yeoniIdleFacing(state,s,layout)`(src/render/cafe-view.js)
  - 걷지 않고, 든 것 없고, 대기·반응 중이면 정면(`'down'`)이다.
  - 계산 손님이 계산 자리(0.6칸 안)에 섰거나 계산(cashier)·인사(bow) 몸짓 중(1040ms)이면 상태 방향(오른쪽)을 쓴다. 손님이 떠나면 인사 몸짓이 끝난 뒤 정면으로 돌아온다(따로 지연을 두지 않았다).
  - 환영(welcome) 몸짓은 정면 행으로 그린다.
  - 준비 화면은 개인 요리 중이 아니면 정면이다. 게임 상태·`yeoniFacing`은 그대로다.
  - 테스트 tests/yeoni-facing.test.mjs 3개.
- 단계 2 `15e46a5` — 로딩 화면 `.boot-yeoni`(index.html, world-island.css)
  - `yeoni_idle.webp` 한 장. 7.2초 주기로 행0 대기(0.2초 눈 깜빡임 2번)와 행1 손 흔들기 4프레임을 `step-end`로 넘긴다.
  - 몸 떠오름 −4px·그림자·후광은 2.8초 `ease-in-out alternate`, 꽃잎 3개는 4.2초 ease로 떠오르며 흐려진다.
  - 제목 "연이가 손님 맞을 채비를 하고 있어요", aria-label "연이가 손을 흔들며 기다리고 있어요".
  - 동작 줄이기면 애니메이션을 끄고 행0 첫 프레임, 꽃잎은 숨긴다.
  - 첫 그림까지 이미지 요청은 `yeoni_idle.webp` 1개(Playwright 측정).
  - 테스트 tests/boot-screen.test.mjs 2개.
- 검증: `npm test` 403/403, `check-assets` 518/518·런타임 16,718,528바이트, `check-sprites` 136시트 오류 0, `git diff --check` 통과.
- QA: `D:/yeoni-qa/cafe-ux/yeoni-front-20261029/`
  - front.py: after-{prep,empty,checkout,after}-{390x844,1180x860}.png, zoom-390.png, zoom-shift-390.png
  - boot.py: boot-no-preference-0~6.png, boot-reduce-0.png, boot-sheet.png, boot-wave-sheet.png
  - ffmpeg가 없어 영상은 남기지 못했다.
- entrance-left 배치는 테스트로만 확인했다(화면 캡처 없음). 실기기는 미검증이다.
- push·배포는 하지 않았다. 브랜치 `fix/yeoni-counter-cooking-20261028`가 origin/main보다 앞선다.
