# 새 재성의 섬 로컬 구현 인수인계 · 2026-10-28

status: in-progress

## 작업 상태
- 작업 트리: C:/Users/user/Documents/Codex/2026-10-25/docs-codex-hostbar-assets-ui-prompt-5/work/yeoni-atelier
- branch: main, HEAD: b1a504beb7d1b48ca69f1f5f5d057b75773eb9e2. 기존 변경을 보존한 미커밋 로컬 작업이다. commit, push, PR, main 통합, 배포는 하지 않았다.
- 사용자 승인 시안: C:/Users/user/.codex/visualizations/2026/10/27/01a17ebb-a550-7cf3-a982-e826bba46890/new-blossom-island.html. 새 원화 생성 시 기존 배경을 참고 이미지로 사용하지 않았다.

## 적용
- 새 섬 원본 1536×1024 PNG: D:/yeoni-qa/art/cafe-ux/new-island-20261028/original-worldmap.png. 기존 런타임 그림과 경로도 같은 폴더에 보존. 실제 런타임은 assets/ui/jaeseong-island.webp(1152×768, 145258바이트).
- 월드맵 상단·하단, 지도 핀, 장소별 장면과 기존 배우 전신이 들어간 카드, 뒤집기와 닫기, 클릭 가능한 잠금 안내를 연결했다. Code Destiny 타로 뒷면 경량 파생본 assets/ui/island-card-back.webp 출처는 docs/REUSE.md에 적었다.
- 새 원화에 맞춘 경로 그래프와 발 도착점을 적용했다. 연이는 기존 사람형 걷기 시트를 사용하며 이동 중 재선택 무시, 취소, 바로 도착, 감소 모션, 도착 재검사, 위치 저장/복원을 따른다. 헤더의 카페로도 기존 위치에서 걸어간다.
- 무성 상점의 첫해 5월(7순) 해금을 장소 선택과 확장/장식 구매 명령에 적용했다. 5월 전에도 이미 보유한 가구의 저장과 배치는 보존한다.
- 실제 부팅이 진행되는 동안 기존 연이 걷기 시트를 애니메이션으로 표시한다. 추가 인위적 로딩 시간은 없다.

## 수정 파일
- 이번 작업: assets/ui/jaeseong-island.webp, assets/ui/island-card-back.webp, index.html, world-island.css, src/ui/world-screen.js, src/ui/world-navigation-data.js, src/ui/app.js, src/game/unlocks.js, src/game/town.js, docs/ASSETS.md, docs/REUSE.md, tests/world-navigation.test.mjs, tests/branches.test.mjs, tests/cafe-ux.test.mjs, tests/capacity.test.mjs, tests/furniture-footprints.test.mjs, tests/independent-seats.test.mjs, tests/town.test.mjs.
- 기존에 미커밋이던 타이틀, 카페, 스타일, 엔진 및 인수인계 파일은 보존했다. 위 파일의 일부도 이전 미커밋 변경을 포함한다.

## 검증 및 증거
- npm test: 271 pass / 0 fail. 기존 구매 테스트는 상점이 열린 시점으로 fixture를 옮겼으며, 5월 전 거절·재화와 가구 보존 및 5월 구매 허용을 별도 추가했다.
- node tools/check-assets.mjs: 등록 484/484, 런타임 14,682,160바이트, 배포 assets 전체 14,952,742바이트. 개별 제한 통과, 전체 상한 잔여 47,258바이트. git diff --check 통과.
- D:/yeoni-qa/cafe-ux/new-island-final-20261028/: 360×700, 390×844, 1280×900의 지도·카드·잠금·걷기·부팅, 5월 카드와 report.json. before/에 같은 작업 전 390/1280 캡처 보존. 해당 범위 페이지 오류·콘솔 오류·HTTP 400 이상 0.
- 개발 저장 격리 브라우저에서 8개 장소까지 실제 걷기를 끝까지 재생해 입장·도착 위치 저장 확인. 재화·보상·퀘스트 상태 유지. 중간 캡처 및 보고 D:/yeoni-qa/cafe-ux/new-island-walks-20261028/. 연타·취소·즉시 도착·저장 복원·감소 모션·5월 잠금/개방 통과.
- 새 원화의 그래프를 그림 위에 표시한 D:/yeoni-qa/cafe-ux/new-island-final-20261028/route-review-final.png를 육안 확인했다. 임의의 기존 35점 좌표는 새 그림에 맞지 않아 재사용하지 않았다.

## 미완료 및 다음 확인
- 원화는 단일 배경이며 건물·나무의 개별 전경 가림 레이어가 없다. 중간 위치 캡처와 경로 오버레이를 확인했지만 모든 프레임의 지형 가림과 발 접점이 완벽하다고 검증하지 못했다. 원화 세부의 수풀·울타리 근처 경로를 확대해 사람 눈으로 다시 점검해야 한다.
- 실제 휴대폰, 장시간 사람 플레이, 카페의 모든 주문·서빙·계산·퇴장 및 동료 화면을 이번 최종 변경에서 전수 검수하지 않았다. 이전 인수인계에 기록된 카페 전면 정돈·부탁 노트·상점 세부 디자인은 이번 월드맵 승인 범위의 완료로 간주하지 않는다.
- UI 검출기는 색상/타이포 토큰 미등록 advisory를 냈다. 테스트 통과를 시각적 완성 보증으로 해석하지 않는다.
- 다음 작업: 실제 단말의 확대/스크롤과 8개 경로의 전경 가림·발 위치를 검수하고 필요한 원화 분리 또는 길 조정을 수행한다. 기존 저장·가구를 자동 이동·삭제하지 말 것. 배포 및 Git 전달은 별도 사용자 지시 없이는 하지 않는다.

## 2026-10-28 배포 전 보완
- 사용자가 이 인계 문서의 후속 검수와 배포를 명시 승인했다.
- 쉼터 경로를 계단 중앙과 연못 앞 산책로로 조정하고 발 기준을 122/128에 맞췄다. 원화/저장/가구 자동 이동 없음.
- npm test 271/271, check-assets 등록 484/484 및 배포 14,952,742바이트, check-sprites 115시트/1396프레임 오류0, git diff --check 통과.
- 새 로컬 서버에서 360/390/430/1280px 가로넘침0·지도핀8개, 잠금 aria-disabled 안내, 모카 이동과 도착 저장, 쉼터 확대 이동을 확인했다.
- ADB 연결 단말 없음. 실제 휴대폰 및 모든 프레임의 전경 가림은 미검증. 단일 배경에 별도 전경 가림 레이어는 없다.
- UI 검출기: 카드 로마 숫자의 Georgia 글꼴 미등록 1건, 색/크기 토큰 advisory 81건. 승인된 시안 유지, 이번 범위에서 전면 스타일 변경하지 않음.
- 릴리스 메타데이터 2026.10.28.1. 기존 카페/타이틀/지도 인계 변경을 함께 반영한다. 결제/인증/API/DB 변경 없음.
