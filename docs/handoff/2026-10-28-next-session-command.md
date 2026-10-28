# 새 세션 명령서 — 모바일 우선 UI/UX 전수 정리 (2026-10-28 작성)

## 새 세션에 붙여 넣을 명령
```
작업 폴더 C:/Users/user/Documents/Codex/2026-10-28/set-location-c-users-user-documents/work/yeoni-counter-cooking 에서
docs/handoff/2026-10-28-next-session-command.md 를 읽고 "작업 순서" 1번부터 진행해.
앞 인계 docs/handoff/2026-10-28-cafe-polish-handoff.md 의 "남은 일"도 함께 처리해.
각 단계마다 테스트·브라우저 QA(모바일 우선)·커밋, 끝나면 release.json 올려 origin/main 배포까지 해.
```

## 현재 상태
- 브랜치 `fix/yeoni-counter-cooking-20261028`. 운영은 release `2026.10.28.9`(08a5d89), Vercel·Pages·GitHub Game checks 성공 확인됨
- **운영에 아직 안 올라간 커밋 1개**: 85531f8 지도에서 지금 머무는 장소를 다시 눌러도 그 장소 창이 열림("다시 들어가기"). 테스트 363/363, 390×844·1280×800 브라우저 확인 완료. 다음 배포에 함께 나간다
- 개발 서버: `PORT=5301 npm start` → `http://127.0.0.1:5301/?dev=1&demo=host`

## 사용자 요구(원문 요지, 최신 우선)
1. "이건 모바일 게임이야. 데스크탑에서도 가능하지만 모바일에 최적화되어 있어야 해." 카페 가구 배치와 각종 UI/UX를 **단순하게, 중독성 있게**. 사냥터는 잘되어 있다(기준으로 삼되 크게 건드리지 말 것). 전반 UI/UX를 깔끔하고 톤앤매너(꽃·달, 장미·세이지·아이보리·금)에 맞게 **에셋을 새로 만들어 서비스에 적용**
2. "빚 상환 UI/UX도 제대로 안 보인다. 이런 창들 하나하나 검수해서 깔끔하게 나오도록 해"
3. "무기 상점이나 다른 상점들 UI/UX도 더 개선하고 톤앤매너에 맞게"
4. "윤달 상점에 장비가 없다. 수정되어야 한다"
5. (완료) 같은 장소를 다시 눌러도 그 장소 창이 나오게 → 85531f8

## 작업 순서
### 1. 윤달 상점 장비가 안 보이는 문제 (먼저 재현)
코드에서 확인한 사실:
- 지도에서 공방(`gear`)에 들어가면 `town` 시트의 `gear` 탭 → `gearStall()`(src/ui/sheets.js:345)이 장비 6종(`GEAR_ORDER`, src/data/gear.js:17) 목록을 그린다
- 그런데 이야기에서 데려갈 때(`goStoryPlace`, src/ui/app.js:244-248)와 영냥이 안내 데스크·사냥 준비에서 여는 `armory` 시트(src/ui/armory.js:8-13)는 **강화 탭이 기본**이고, `장비` 탭은 목록 없이 "장비 진열대" 링크 카드 하나뿐이다 → 사용자가 본 "장비가 없다"의 가장 유력한 원인
- 할 일: 공방 `장비` 탭 안에 장비 목록·구매·장착을 직접 그린다(`gearStall` 재사용, 시트 이동 없이). 장비 아이콘이 없으면 새로 그린다. 장비가 6종뿐이라 무기(사냥꾼별 무기)·방어구·부적 구성이 빈약하면 TEMP 값으로 늘리되 WORLD.md "게임 오리지널"·TUNING에 기록
- 테스트: armory 시트 equipment 탭 HTML에 `gear.buy`/`gear.equip` 버튼이 있고, 구매가 dispatch로 1회만 차감

### 2. 모든 창 전수 검수 (모바일 우선)
- 대상 시트(src/ui/sheets.js switch): branches, manage, table, craft, kitchen, delivery, shop, town(moka·luna·finance·gear·expand·hunt 탭), quests, more, **debt**, companions, rankup, outfits, farm, hunt, armory(5탭), tutorial, foodgift, audio + 꾸미기 화면(decor-screen) + 지도·의뢰 화면 + 결산 + 소설 대화
- **빚 상환**: `debt` 시트와 `financeCenter`(sheets.js:363). 재현 후 금액·상환 버튼·남은 빚·이자 가독성을 정리
- 뷰포트: 360×640, 390×844, 430×932(주력), 844×390(가로), 1280×800·1920×1080(보조). 각 창 스크린샷을 직접 보고 겹침·잘림·가로 스크롤·작은 터치(44px 미만)·대비 부족을 목록으로 만든 뒤 고친다
- QA 스크립트 예시: D:/Development/Temp/claude/C--Users-user/43c92e14-907a-4ff4-bbde-66f79e29935a/scratchpad/qa/reenter-qa.mjs (튜토리얼은 `state.tutorials[id]=true`로 미리 표시해야 시트가 덮이지 않는다)

### 3. 상점 UI/UX 통일 (무기 공방·모카 식재료·루나 쉼터·금융·가구와 꽃 상점)
- 공통 상점 틀: 상단 주인 초상+한 줄 대사(말투 AGENTS.md), 보유 재화 고정 줄, 카드형 상품(아이콘·이름·효과 한 줄·가격 버튼), 잠금은 이유 한 문장
- 한 손 조작: 주요 버튼은 화면 아래쪽, 탭은 가로 스크롤 없이 한 줄

### 4. 카페 가구 배치 단순화 + 중독성
- 현재 꾸미기 화면(src/ui/decor-screen.js, decor-screen.css)을 모바일 기준으로 단계 수를 줄인다: 카드 탭 → 추천 자리 자동 미리보기 → 큰 "놓기" 한 번. 회전·보관은 보조
- 보상감: 배치 완료 시 분위기 수치 상승 연출, 세트 가구 보너스 진행도, 다음 추천 가구 한 장(구매 유도 아님, 진행 안내)

### 5. 에셋 생성·적용
- codex-image(gpt-image-2)로 생성, 원본 PNG는 D: 보존, 결과 WebP. 등록: asset-updates.js·docs/ASSETS.md·docs/art-prompts.json·manifest. 예산 20MB(`node tools/check-assets.mjs`)
- 후보: 상점 공통 프레임·상품 카드 장식, 장비 아이콘, 빚 상환 장부 일러스트, 하단 명령줄 아이콘, 결산 카드
- 캐릭터가 들어가면 공식 프로필 기준, 원본 에셋과 나란히 비교(영냥이 귀 2개 등 메모리 규칙)
- 스프라이트 시트를 새로 만들면 `py tools/check-sprites.py`로 칸 여백·떨어진 조각 검사(CI가 이 검사로 실패한 적 있음)

### 6. 앞 인계의 남은 일
docs/handoff/2026-10-28-cafe-polish-handoff.md "남은 일" 1~9(루나 언니 이름표 겹침, 가로 모바일 무대 협소 등)

## 완료 조건
- `npm test`, `node tools/check-assets.mjs`, `py tools/check-sprites.py`, `git diff --check` 통과
- 위 뷰포트 브라우저 QA에서 창마다 겹침·잘림·가로 스크롤·콘솔 오류 0, 스크린샷을 직접 확인
- release.json 버전 올림 → `git push origin HEAD:main`(fast-forward) → Vercel·Pages release.json과 GitHub Game checks 성공 확인
- 보고는 완료/미완료/검증 범위 구분, 실제 휴대폰 확인은 "미검증"으로

## 지켜야 할 규칙
- AGENTS.md: 상태 변경은 dispatch·엔진 tick만, 600초·60초 고정, 연이는 계산만, 말투(영냥이 해라체·루나 언니 "괜찮아요"·루나 반말), 한 줄 2문장 이하, 보상 원장 1회, 새 설정은 WORLD.md "게임 오리지널", 임시 값 TEMP, 동작 변경마다 테스트
- 사용자 저장 삭제 금지(QA는 저장 키 remap), CodeDestiny 결제·인증·API·DB·가격 변경 금지, code-destiny·killerflowerpig 읽기 전용
- 사용 중 이미지·저장·음원 삭제 금지, 삭제는 경로 확인 후 `Remove-Item -LiteralPath`
- 커밋 꼬리말 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, bare `git stash` 금지
