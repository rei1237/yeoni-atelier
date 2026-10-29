---
status: done
next: 없음(2026.10.29.11 배포 완료)
branch: fix/yeoni-counter-cooking-20261028
---
# 10-29 후속: 직원 스프라이트 마무리와 2026.10.29.11 배포

## 지금까지 (이 브랜치, origin/main 미반영)
| 커밋 | 내용 |
| --- | --- |
| e3e6803 | 달빛 음악실 단순화, 닫기 버튼 또렷하게 |
| c7328ae | 모카 배달 묶음·＋5 담기, 재료가 떨어지면 배달 안내 |
| f366ff9 | 데스크톱 넓은 사냥터, 전체화면 단추 |
| 77db4ac | 보스 순간 도약(멀리서 1.5초 → 1초 예고 뒤 플레이어 자리로), 깊은 단계 월정석 상향(depthReward 0.2) |
| 9f0da1e | 메인 화면 「등장인물 · 재성의 섬 이야기」(src/ui/lore.js) |

origin/main 은 b8e7506(release 2026.10.29.10, 배포 성공)까지다. 전체 테스트 427개 통과.

## 남은 사용자 요청(원문)
- "루나 언니가 요리 만드는 스프라이트 시트가 데스크탑에서 저해상도이니 개선"
- "사냥터에서 영냥이가 걷는 다리 모션을 실제로 걷듯이 개선해주고 카페에서 네오가 걷는것도 이상하니까 자연스럽게 다시 스프라이트 시트를 만들어서 구현해줘 그 외에도 다른 직원들도 이상한게 없는지 검수 후 자연스럽게 만들어줘"

## 단계
1. **스프라이트 브랜치 검수·병합**
   - 브랜치 `worktree-agent-a8803bd9704ef165c`(작업 트리: 메인 체크아웃의 `.claude/worktrees/agent-a8803bd9704ef165c`, locked).
   - 커밋 dcf54b2: 네오·영냥이·루나 언니·모카 걷기 프레임 재작화(1배·_hd, docs/art-prompts.json). e3e6803 위에 있어 이 브랜치로 `git cherry-pick dcf54b2` 하면 된다.
   - 미커밋: `assets/illustrated/actors/luna_sis_cook_hd.webp`(요리 시트 고해상도 작업 중이던 파일). 열어 보고 품질이 맞으면 같이 가져오고, 아니면 다시 만든다.
   - 검수: 프레임을 원본 크기로 나란히 놓고 본다. 영냥이 귀 2개, 다리가 번갈아 앞뒤로 나가는지, 네오는 은발 인간 남성. `node tools/check-assets.mjs`, `PYTHONIOENCODING=utf-8 py tools/check-sprites.py`.
   - 다른 직원(루나 등) 걷기도 같은 기준으로 확인한다.
2. **테스트·커밋**: `node --test --test-concurrency=4 "tests/*.test.mjs"`.
3. **배포**: `git fetch` → `git rev-list --left-right --count origin/main...HEAD` 확인 → release.json 2026.10.29.11(baseCommit 갱신) "release: ..." 커밋 → `git push origin HEAD:main` → `gh run list` 로 Game checks·pages build 성공 확인 → https://rei1237.github.io/yeoni-atelier/
4. **보고**(한국어): 위 커밋들 요약 + 스프라이트 결과 + 배포 결과. 후속 메모: 사냥터를 나가도 전체화면이 유지된다.
5. 끝나면 이 문서 `status: done`, 에이전트 작업 트리 정리(`git worktree remove --force` 전 미커밋 파일 확인).

## 지킬 것
AGENTS.md(dispatch·state.rng·짧은 한국어 주석·`npm test`), 공개 저장소라 개인 경로 커밋 금지, 다른 저장소는 읽기 전용(재사용은 docs/REUSE.md), bare `git stash` 금지.

## 결과 (2026-10-30)
| 커밋 | 내용 |
| --- | --- |
| 8e911f2 | dcf54b2 cherry-pick: 네오·영냥이·루나 언니·모카 걷기 프레임 재작화(영냥이 전 프레임 귀 2개 확인) |
| 7c8bb12 | 네오 의상 10벌 옆모습 걷기 재작화(옛 네 칸이 모두 보폭 자세 → 접지-통과 교차, 머리 분홍기는 기존 행 채도에 맞춤) |
| 874a5f0 | 모바일 2배 시트: 캔버스 배율 상한 2→3, 2배 시트 전환 기준 1.1→1, 요리 장면 인물 2배 시트를 모든 화면에, 루나 언니 요리도 2배 시트 |
| d69a307 | release: 2026.10.29.11 (assetBytes 17844086, baseCommit 874a5f0) |

- 미커밋 `luna_sis_cook_hd.webp` 작업본은 칸마다 머리색(금발/분홍)이 달라 깜박여 버리고, 기존 2배 요리 시트를 그대로 쓴다. 에이전트 작업 트리는 정리했다.
- 걷기 지표(다리 영역 프레임 간 1−IoU): 의상 옆모습 0.16–0.29 → 0.37–0.51, 발 폭이 넓음·좁음으로 번갈아 나온다.
- 측정(390×844@3): 직원 1배 시트 1.35배 확대 → 2배 시트 0.68배. 360×640@2·데스크톱 1배는 1배 시트 축소라 그대로.
- 전체 테스트 428개 통과, Game checks·pages build 성공, 사이트 release.json 2026.10.29.11 확인.

## 후속
- 사냥터를 나가도 전체화면이 유지된다.
- 손님 시트(customer_*)는 2배 시트가 없어 3배 화면 휴대폰에서 1.35배로 늘어난다.
- 캔버스 배율 3은 저사양 휴대폰 프레임 영향을 실기기로 보지 못했다(미검증).
