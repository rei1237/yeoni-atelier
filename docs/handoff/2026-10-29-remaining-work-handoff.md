---
status: done
updated: 2026-10-29
next: "없음 — 10-29 오후 요청(손님 요구 보상·잡담·결산 카드 유지·남은 주문 수입·기술 상한 연구·남자 손님·부호 팁·주문 영수증)은 release 2026.10.29.4로 배포. 실기기 미검증"
---
# 인수인계 — 경제 0.6 이후 남은 일 (2026-10-29)

앞 인계 [2026-10-28-economy-0.6-handoff.md](2026-10-28-economy-0.6-handoff.md)는 `status: done`(release 2026.10.29.2까지 배포).
그 문서와 [2026-10-28-cafe-polish-handoff.md](2026-10-28-cafe-polish-handoff.md)의 "남은 일" 중 아직 코드에 없는 것만 모았다.

## 새 세션에 붙여 넣을 명령
```
C:\Users\user 에서 세션을 열고:
/handoff C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking/docs/handoff/2026-10-29-remaining-work-handoff.md
```

## 첫 행동
1. 작업 폴더 `C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking`(워크트리, 브랜치 `fix/yeoni-counter-cooking-20261028`)에서 `git status`·`git fetch origin`·`git log --oneline -8`
2. HEAD가 origin/main과 같은지 확인(다르면 `git log HEAD..origin/main`으로 남의 커밋을 먼저 본다)
3. `npm test`가 386/386인지 확인(`npm test 2>&1 | grep -E "ℹ (pass|fail)"`)
4. 아래 "단계" 1부터 진행. 사람 결정이 필요한 항목("손대지 말 것")은 묻지 말고 건너뛴다

## 지금 상태
| 항목 | 상태 | 커밋 |
|---|---|---|
| 연이 `yeoniEffects.cookSpeed` 적용(선물 요리 5초 → 레벨마다 −1%, 상한 −20%, 성장 창 표시) | 완료 | 86d87c6 |
| release 2026.10.29.2 · push | 완료 | (이 문서 커밋) |
| 연이 레벨 카페 효과(계산 시간 −2%/Lv·손님 기다림 +1%/Lv·좋은 후기 인기도 +2%/Lv, 상한 있음) | 완료 | d94e7b5 |
| 영업 배속 유지(도움말·요리 창이 1배로 되돌리지 않음, 요리 창 열린 동안만 1배, localStorage `yeoni-atelier.play-speed.v1`) | 완료 | 85c88f2 |
| 메인 화면·창 틀 도트 테마(`main-pixel.css`, 도트 아이콘 9개 추가) | 완료 | 72443b8 |
| 연이 "꿀악" → 운세 대사(22곳) + 운세 잡담 15문장 | 완료 | ed13439 |
| 게임방 그림·카드 2장 도트 그림(원본 `D:/yeoni-qa/art/pixel-v1/`) | 완료 | 269f77d |
| 위 다섯 건 push·release | 완료(단계 6) | ff6ed62 |
| 추가 요청: 사냥터 수염 자석 → 개다래 열매(12초 공격력 +30%·이동 +20% 버프) | 완료 | 95c4a27 |
| 단계 1 이름표 회피(실제 DOM 말풍선·확대 버튼 크기 사용) | 완료 | 93062e0 |
| 단계 2 준비 화면 잡담 리본(원인 기록, 코드 변경 없음) | 완료 | a74db97 |
| 단계 3 농장 일괄 수확(`farm.harvestAll`) | 완료 | d7b11a9 |
| 단계 4 손님 요구 게이지 설계 초안(미구현) | 완료 | e11e98a |
| 단계 5 UI 그림(도트 테마로 대체됨, 비교만) | 완료 | b462976 |
| 단계 6 release 2026.10.29.3 · push(76987c7..ff6ed62) · Vercel·Pages 확인 · 실기기 미검증 | 완료 | ff6ed62 |
| 오후 요청: 공방 연구 세 갈래(무기·보조 상한 해방, 무기별 진화 비전), 상한 초과분은 연구 단계로 | 완료 | 8260020 |
| 오후 요청: 데스크톱 원본 해상도 지도·모바일 경량본, 첫 지점 이야기 전 지점 관리 잠금 | 완료 | 2a0b9bf · 2a50ce8 |
| 오후 요청: 계산대 한마디 손님 요구(보상 골드 팁 + 연이 경험치, 원장 1회)·카페 상태 말풍선 UI·준비 화면 잡담(연이와 동료 주고받기)·결산 카드 현행 유지 | 완료 | 45a5534 |
| 오후 요청: 남자 손님 2종(후드·정장, look 8/9)·할아버지는 대부호 확률↑·통큰/대부호 계산 팁(TEMP.PATRON) | 완료 | 1ae698a |
| 오후 요청: 여러 주문 한눈 보기(테이블 팝오버 영수증·말풍선 아이콘 겹침·주문 서랍 상태 칩) | 완료 | 4ef091e |
| 오후 요청: 기술 상한 아이콘 3종(원본 `D:/yeoni-qa/art/tech-icons-v1/`) | 완료 | 45118d2 |
| release 2026.10.29.4 · push(ee38061..54ee6ef) · 테스트 398/398·에셋 518/518·스프라이트 오류 0 · Game checks·Vercel·Pages 성공 · 실기기 미검증 | 완료 | 54ee6ef |

## 작업 규칙(요약, 원문은 AGENTS.md·CLAUDE.md)
- 상태 변경은 `dispatch`(src/game/engine.js)·`tick`에서만. 보상은 원장 키로 한 번. 난수는 `state.rng`만
- 영업 600초·지명 60초 고정. 연이는 영업 중 계산만(준비 시간에 농사·선물 요리). 한 줄 2문장 이하. 청토끼의 결말은 쓰지 않는다
- 새 설정은 docs/WORLD.md "게임 오리지널", 임시 수치는 `TEMP`(src/config/balance.temp.js)와 docs/TUNING.md
- 행동이 바뀌면 테스트(이웃 테스트 크기만큼). 다른 저장소(code-destiny·killerflowerpig)는 읽기 전용. CodeDestiny 결제·인증·API·DB·가격 변경 금지
- 사용자 저장 삭제 금지(QA는 저장 키를 `qa-st.`로 remap). bare `git stash` 금지. 커밋 꼬리말 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 수정이 끝나면 단계마다 커밋. push는 마지막 단계(6)에서 `git push origin HEAD:main`(fast-forward)
- 그림: 다시 그릴 때 원본 에셋을 첨부하고 나란히 비교. 원본 PNG·프롬프트는 D 드라이브(`D:/yeoni-qa/art/<묶음>/`)에. 네오는 은발 인간 남성(사자 아님), 모카는 암컷 수달, 영냥이 스틸은 귀 2개 검수
- 시스템 이식은 메커니즘만. 원작 이름·그림 복제 금지

## 설계
### 1. 이름표 회피 보완 — `src/render/cafe-view.js` `drawNameTags(ctx,tags,size,avoid)`
- 지금은 주문 말풍선 사각형을 `{x:b.x, y:b.y-44-T*.35, w:44, h:46}`(최소 폭 44px)로 어림한다. 긴 상태 문구("메뉴 고르는 중") 말풍선은 더 넓어 옆 이름표를 가린다
- 말풍선을 그리는 쪽에서 실제 폭(`ctx.measureText` 결과)을 기록해 `avoid`에 넘긴다. 다시 계산하지 말고 그린 값을 쓴다
- 확대 버튼(전체 ±, DOM 오버레이)의 화면 사각형도 캔버스 좌표로 바꿔 `avoid`에 더한다
- 이전 시행착오: 폭을 100px·60px로 넓게 잡으면 루나 이름표가 쓸데없이 뒤집혔다. 실제 폭을 쓰면 해결된다

### 2. 준비 화면 잡담 리본 — `.cafe-chatter`
- 영업 중 숨김은 의도(`cafe-play.css:15` `body[data-mode][data-cafe-focus=true] .cafe-chatter{display:none}`, 영업 중 대화는 말풍선 담당). 이것은 유지
- 준비 화면에서 리본이 안 보이는 경우가 있다. `src/ui/hud.js:307` `chatterRibbon`(`ui.chatter.until` 만료)과 `cafe-brand.css:24~26`·`.bubbles .cafe-chatter`의 위치(`right:150px`)를 확인해 원인을 먼저 찾는다. 원인을 못 찾으면 고치지 말고 문서에 재현 조건만 적는다

### 3. 농장 일괄 수확 — `src/game/farm.js`
- `careAll`(물·돌보기 일괄, 농장 Lv.3부터)은 있고 일괄 수확은 없다
- `farm.harvestAll` 명령을 `careAll`과 같은 꼴로 만든다: `farmCheck` → 다 자란 밭 목록 → 없으면 fail → 밭마다 `harvest` 재사용(보상·원장·`gainYeoni` 중복 금지) → `{ok,count}`
- engine.js에 등록(62줄의 여분 조리 중 금지 목록, 116줄 근처 case), `src/ui/farm.js` 머리에 버튼, `src/ui/app.js:334` 근처에 액션. 행동력 비용은 단건 수확과 같은 규칙을 따른다
- 테스트: 다 자란 밭 2개 → 한 번에 수확, 수확물 합계가 단건 두 번과 같음

### 4. 손님 요구 게이지 — 설계 먼저(구현은 설계가 문서에 확정된 뒤)
- 출처: 앞 인계 3 "물장사 경영의 접객·손님 요구 게이지"(메커니즘만). 지명·피버는 이미 있다
- 이 단계에서는 docs/WORLD.md "게임 오리지널"에 규칙 초안(무엇이 차고, 연이가 계산대에서 무엇을 하면 채워지는지, 보상은 원장 1회)과 TEMP 수치 후보만 쓰고 커밋한다
- 연이는 계산만 한다는 규칙과 600초 영업을 깨지 않는 안만 낸다. 경제 시뮬(`node tools/sim-year.mjs`) 목표(ideal 45~55순 완납, average 65~72, idle 배드 엔딩)를 흔들면 구현하지 않는다

### 5. UI 그림 다시 그리기 — 후보(우선순위 순)
1. 하단 명령줄 아이콘 2. 상점 공통 프레임 3. 결산 카드 4. 준비 화면 패널 프레임 5. 농장 밭 타일
- `/codex-image`(codex exec는 `< /dev/null`을 붙여야 stdin을 기다리지 않는다). 원본은 `D:/yeoni-qa/art/ui-v2/`, 프롬프트는 같은 폴더 `prompts/`
- 등록은 빚 장부(d26db84)를 본뜬다: `assets/illustrated/ui/<id>.webp`(알파 채널 필수, 가장자리 페더는 그림에 굽는다. CSS mask 금지) → `src/render/asset-updates.js` `ASSET_UPDATES.ui.<id>` → docs/ASSETS.md `| ui/<id> | 설명 | WxH | 완료 |` → docs/art-prompts.json → assets/manifest.json `ready`
- 바꾸기 전 화면과 바꾼 뒤 화면을 같은 뷰포트로 찍어 나란히 비교. 하나라도 원본보다 어색하면 넣지 않는다

### 손대지 말 것(사람 결정 대기)
- ~~마감 때 남은 주문 매출~~ → 10-29 오후 사용자 결정: 수입으로 잡는다(현행 유지)
- ~~기술 상한 초과분 환불~~ → 10-29 오후 사용자 결정: 무기 상점 연구 갈래로 바꿈(8260020)
- 이전 인계(`../../outputs/HANDOFF-카페-게임방-운세-비행VS-2026-10-28.txt`) 큰 묶음: 캐릭터별 단계 퀘스트 104개, 정적 달빛상담수첩, 날아라 꽃돼지 VS, 미사용 에셋 정리(삭제는 요청 때만)
- 실기기(아이폰·안드로이드) 확인 — 사용자 몫. 보고에는 "미검증"으로 적는다

## QA
- 개발 서버: `PORT=5301 npm start`(백그라운드), `http://127.0.0.1:5301/`
- Playwright: `file:///D:/Development/code-destiny/node_modules/playwright-core/index.mjs`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`
- 앞 세션 QA 스크립트(복사해 쓴다): `D:/Development/Temp/claude/C--Users-user/a56a8a77-20e1-4456-9c7b-890bf69b6427/scratchpad/` 의 `qa-windows.mjs`(env `VIEWS`·`ONLY`, 창 전부 찍기), `qa-tags.mjs`(env `VP=WxH`, 이름표), `qa-stage.mjs`(무대·저장 만드는 예)
- QA 저장에는 튜토리얼 id 전부를 본 것으로 넣는다(qa-stage.mjs 8줄 목록). 저장 키 `yeoni-atelier.save.v1`을 `qa-st.` 접두로 remap
- 뷰포트: 360×640 · 390×844 · 430×932 · 667×375 · 844×390 · 1280×800
- 함정: `node -e`에 `${}`가 있으면 bash가 깨진다(`<<'EOF'` 헤어독으로 파일에 쓴다). 따옴표 없는 헤어독은 `\\n`을 줄바꿈으로 바꾼다. `python` 대신 `py`. CRLF 파일 경고는 무시

## 단계
1. 이름표 회피 보완(설계 1) → `npm test` + `VP=390x844`·`VP=360x640` qa-tags로 말풍선·확대 버튼 아래 이름표 확인 → 커밋 — 완료(93062e0)
2. 준비 화면 잡담 리본(설계 2) → 원인 확인 후 수정 또는 재현 조건 기록 → 커밋 — 완료(코드 변경 없음, 원인 기록)
   - 원인: 준비 화면에서는 리본이 나올 경로가 없다. ① `src/ui/app.js` render가 `#bubbles`(리본)를 `shift`·`hunt`에서만 그린다 ② `cafe-play.css:15`의 `data-cafe-focus=true`는 `prep`에서도 true라 그려도 숨는다 ③ 준비 중에는 `showCafeLine`을 부르는 사건이 없다(`guestChatter`는 영업 방문에서만, 나머지는 사냥 사건). 영업 중 고객 잡담은 `guestTalk` 말풍선이 맡고, 손님 id 없는 잡담만 리본으로 가지만 CSS로 숨는다. 결국 카페 쪽 리본은 지금 보이지 않고 사냥에서만 쓰인다
   - 고치려면 준비 화면 잡담의 화자·문장·주기(새 내용)를 정해야 한다 → 사람 결정 대기로 남긴다. 정해지면 ①의 조건에 `prep`을 넣고 ②를 `[data-mode=shift]`로 좁히고 준비 화면 잡담 발생원을 더한다
3. 농장 일괄 수확(설계 3) → 테스트 추가 → 농장 창 QA → 커밋 — 완료(d7b11a9, 390×844에서 밭 3곳 한 번에 수확·행동력 6→3 확인)
4. 손님 요구 게이지 설계 초안(설계 4) → WORLD.md·TUNING.md → 커밋(구현 안 함) — 완료(설계 초안만: WORLD.md "손님 요구: 계산대 한마디"·TUNING.md TEMP 후보와 구현 조건. 보상 종류는 사람 결정 대기)
5. UI 그림(설계 5) → 하나씩 만들고 등록·비교 → `node tools/check-assets.mjs`·`PYTHONIOENCODING=utf-8 py tools/check-sprites.py` → 하나씩 커밋 — 완료(새 그림 없음, 비교만)
   - 이 후보 목록은 09:03에 썼고, 09:21에 72443b8이 메인 화면·창 틀을 도트 테마로 바꿨다. ① 하단 명령줄 아이콘(12×12 도트 아이콘) ② 상점 공통 틀 ④ 준비 화면 패널 틀은 그 커밋에서 이미 다시 그려졌다. 여기에 손그림 일러스트를 올리면 도트 방향과 부딪힌다
   - ③ 결산 카드 ⑤ 농장 밭 타일은 390×844에서 찍어 봤다. 어색한 그림이 없어서 "원본보다 어색하면 넣지 않는다"에 따라 넣지 않았다. 찍은 화면은 `D:/yeoni-qa/art/ui-v2/compare/ui-before-{prep,shop,settle,farm}-390.png`
   - 사람 결정 대기: 결산 카드도 도트 테마(`main-pixel.css`)로 맞출지. 지금은 둥근 카드라 메인 화면 도트 틀과 결이 다르다. 이건 그림이 아니라 CSS 일이다
6. `npm test`·`node tools/check-assets.mjs`·`PYTHONIOENCODING=utf-8 py tools/check-sprites.py`·`git diff --check` → release.json 올림(version·baseCommit, 에셋이 바뀌면 assetBytes) → `git push origin HEAD:main` → `gh run list --limit 6 --json name,headSha,status,conclusion`(Game checks), `gh api repos/rei1237/yeoni-atelier/commits/<sha>/statuses`(Vercel), `curl https://rei1237.github.io/yeoni-atelier/release.json`(Pages) → 이 문서에 SHA 기록·`status: done` → 한국어 보고(실기기는 "미검증") — 완료(ff6ed62: 테스트 388/388·에셋 508/508·스프라이트 오류 0·Game checks·Vercel·Pages 모두 성공)
