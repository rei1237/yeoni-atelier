---
name: "연이의 아틀리에"
description: "버터 크림·꿀빛 목재·딸기 로즈·피스타치오 세이지의 카페와 남색 라이트노벨을 잇는 Code Destiny 모바일 일러스트 게임"
colors:
  accent: "#ad5265"
  accent-hover: "#9a4359"
  selected: "#853d4d"
  accent-ink: "#ffffff"
  bg: "#f6eddf"
  paper: "#fffaf0"
  ink: "#48382e"
  muted: "#776457"
  line: "#e1cdb6"
  card: "#fffdf7"
  card-line: "#ddcdb4"
  button-hover: "#f0e6d7"
  tag: "#efe2d1"
  rose-paper: "#fff1f4"
  gold-line: "#bc9d71"
  ok: "#4b704b"
  warn: "#925b10"
  bad: "#c9443a"
  info: "#657c57"
  fever: "#f2b631"
  nv-navy: "#0B1026"
  nv-gold: "#C9A227"
  nv-gold-soft: "#e9c46a"
  nv-ink: "rgba(232, 228, 217, 0.92)"
  nv-glass: "rgba(6, 8, 22, 0.86)"
typography:
  display:
    fontFamily: '"Noto Sans KR", system-ui, "Malgun Gothic", sans-serif'
    fontSize: "25px"
    fontWeight: 700
    letterSpacing: "-.02em"
  headline:
    fontFamily: '"Noto Sans KR", system-ui, "Malgun Gothic", sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: '"Noto Sans KR", system-ui, "Malgun Gothic", sans-serif'
    fontSize: "16px"
    fontWeight: 700
  body:
    fontFamily: '"Noto Sans KR", system-ui, "Malgun Gothic", sans-serif'
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: '"Noto Sans KR", system-ui, "Malgun Gothic", sans-serif'
    fontSize: "12px"
    lineHeight: 1.35
  dialogue:
    fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif'
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.7
rounded:
  button: "9px"
  item: "10px"
  card: "12px"
  scene: "14px"
  dialog: "18px"
  sheet: "22px 22px 0 0"
  pill: "999px"
  dialogue: "24px 24px 24px 10px"
spacing:
  control-gap: "4px"
  compact-gap: "5px"
  row-gap: "6px"
  grid-gap: "10px"
  card-inset: "14px"
  section-gap: "16px"
  desktop-inset: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.button}"
    padding: "6px 10px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "6px 10px"
  button-default-hover:
    backgroundColor: "{colors.button-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "6px 10px"
  button-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.accent-ink}"
  sheet-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px"
  status-tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "1px 7px"
  navigation:
    typography: "{typography.label}"
  stage-range:
    width: "100%"
  dialogue-box:
    backgroundColor: "{colors.nv-glass}"
    textColor: "{colors.nv-ink}"
    rounded: "{rounded.dialogue}"
    padding: "22px 18px 26px"
    typography: "{typography.dialogue}"
---

# Design System: 연이의 아틀리에

## Overview

**Creative North Star: "Code Destiny 일러스트 호스트 카페"**

버터 크림 표면, 꿀빛 목재 테두리, 딸기 로즈 실행색, 피스타치오 세이지 성공·정보색, 코코아 먹색 본문으로 카페를 만든다. 남색과 금빛은 라이트노벨 대화 장면과 사냥 화면에만 쓴다. 가구와 인물이 주인공인 부드러운 일러스트 세계를 유지하고, 운영 정보는 짧고 선명한 HTML 조작부에 담는다. 소박한 시작과 고급스러운 성장 과정은 같은 세계 안에서 이어진다.

이 문서는 PRODUCT.md와 사용자 확정 방향을 바탕으로 현재 구현을 추출한 기록이다. 기준은 index.html의 styles.css → novel.css → game-ui.css → cafe-brand.css 적용 순서와 src/ui의 실제 요소다. 마지막에 로드되는 cafe-brand.css의 :root 값(로즈 accent)이 정본이다(10-26 인계 브랜드 결정). 브라우저 측정이나 새로운 시각 승인 결과를 주장하지 않는다.

**Key Characteristics:**
- 크림 표면, 로즈 행동 버튼, 세이지 상태색, 꿀빛 목재 선.
- 부드러운 일러스트와 투명 치비, 고정된 대화 초상화.
- 세로 모바일 운영 화면과 손가락으로 누르기 쉬운 조작부.
- 명료한 운영용 산세리프와 감정적인 대화용 명조의 분리.

## Colors

위 frontmatter는 현재 사용값이며, 색 이름은 역할을 설명한다. 실제 CSS 변수가 있는 색은 그 변수를 우선 사용한다.

### Primary
- **딸기 로즈**: 주요 실행 버튼과 선택 상태. hover와 눌림 그림자는 더 짙은 로즈로 구분한다.
- **로즈 종이**: 요청 말풍선과 관계 장면의 부드러운 강조.
- **피스타치오 세이지**: 성공·정보·진행 막대.

### Secondary
- **오래된 금테**: 시트 경계와 일러스트 장면의 작은 테두리.
- **라이트노벨 금빛**: 어두운 대화 장면의 이름표, 구분선, 진행 안내.

### Neutral
- **따뜻한 크림 / 카드 아이보리**: 운영 패널과 내부 카드의 미세한 층 구분.
- **자주빛 먹색 / 차분한 회색**: 본문과 보조 설명. 장식 색으로 본문 대비를 낮추지 않는다.
- **밤 남색 / 밤 유리**: 대화 장면에 국한된 어두운 바탕과 반투명 대화창.
- **상태 색**: 성공·주의·오류·정보·피버는 기존 의미를 보존하고 문구나 기호를 함께 표시한다.

**The Operational Contrast Rule.** 일러스트 위 문장은 크림 보호 면이나 어두운 대화창 위에 놓아 인물과 글을 함께 읽을 수 있게 한다.

## Typography

**Display / Body Font:** Noto Sans KR, system-ui, Malgun Gothic, sans-serif.
**Dialogue Font:** Noto Serif KR, Nanum Myeongjo, serif.

외부 웹폰트 로딩은 index.html에 없다. 지정 글꼴이 없는 환경에서는 명시된 대체 글꼴로 표시된다. 운영 정보는 빠르게 훑고, 대화는 넉넉한 행간으로 읽는다.

- **Display**: 타이틀 대화상자의 제목.
- **Headline**: 시트 제목. 서비스 배너 제목은 화면에 따라 별도의 clamp 크기(19px, 3.6vw, 27px)를 쓴다.
- **Title**: 시트 소제목과 선택 카드 제목.
- **Body**: 기본 운영 문장. 시트 설명은 행간(1.65)을 사용한다.
- **Label**: 메뉴와 짧은 정보. 손님 주문의 작은 글씨는 기존 크기(11px)를 기록한 것으로, 새로운 긴 본문에 확대 적용하지 않는다.
- **Dialogue**: 이야기 본문. 단어 단위 줄바꿈과 사용자가 선택할 수 있는 텍스트를 유지한다.

**The Two Reading Speeds Rule.** 행동을 고르는 UI는 짧게, 감정을 읽는 대화는 명조와 충분한 행간으로 구분한다.

## Layout

전체 앱은 중앙 정렬된 세로 flex이며 높이(100dvh), 최대 폭(1060px)을 사용한다. 위에는 자원 HUD, 가운데에는 남은 높이를 채우는 Canvas, 아래에는 조작 패널이 놓인다. 현재 바텀시트 래퍼와 라이트노벨은 최대 폭(520px)을 유지한다. 시트 자체의 최대 폭(720px)은 래퍼 제한을 자동으로 넓히지 않는다.

360–430px 모바일을 우선한다. 버튼의 최소 조작 크기는 44px이고, 하단 여백에는 safe-area-inset-bottom이 더해진다. 하단 메뉴는 네 칸, 손님 주문은 두 칸, 완성 트레이는 세 칸이다. 비어 있는 주문 상태는 안내로 표현한다. 카드 안 긴 글은 줄바꿈하고 주문 목록은 자체 스크롤한다.

넓은 화면(min-width:700px)에서는 준비 영역이 두 열로 바뀌고 시트 안쪽 여백이 넓어진다. 작은 서비스 배너(max-width:480px)는 이미지 크기와 글 영역을 조정한다. 낮은 화면(max-height:700px)에서는 하단 패널 높이를 43dvh로 제한하고 내부 스크롤을 제공한다. 359px 이하의 기존 축소 대응도 남아 있다.

## Elevation & Depth

크림 표면의 밝기 차이와 얇은 선으로 기본 계층을 만들고, 시트와 대화상자에 확산 그림자를 사용한다. 모든 카드를 떠 있는 타일로 만들지 않는다. 대화창에만 반투명 어두운 유리와 흐림 효과(6px)를 사용한다.

### Shadow Vocabulary
- **앱 외곽**: `0 8px 40px #37263825`.
- **바텀시트**: `0 -10px 38px #30213826`.
- **대화상자**: `0 12px 45px #24192940`.
- **대화 유리**: `0 10px 40px rgba(0, 0, 0, 0.45)`.
- **기본 버튼**: 아래쪽 선과 inset 경계. 주요 로즈 버튼은 짙은 로즈 아래 그림자(3px)로 눌림 깊이를 준다.

## Shapes

작은 버튼에서 카드, 장면, 시트로 갈수록 부드러운 곡률을 넓힌다. 시트는 상단 두 모서리만 둥글고, 대화창은 한쪽 아래 모서리가 짧아 편지 같은 형태다. 상태 태그는 알약 모양이다. 작은 원형 주문 대기 표시와 인물 아바타는 의미가 있는 곳에만 사용한다.

투명 캐릭터는 신체·의상·소품의 실루엣을 보존한다. 대화 초상화와 이동 시트를 혼용하지 않으며, 이동 시트는 네 방향과 고정 셀을 따른다. 실제 셀 규격·크롭 기준은 에셋 정의와 docs/ASSETS.md를 따른다. 이 문서에서 별도 크롭 수치를 만들어 원본과 분리하지 않는다.

## Components

### Buttons
크림 기본형, 로즈 주요형, 투명 보조형을 쓴다. 주요형은 굵은 글씨다. 기본 padding은 frontmatter 값을 따르되 조작 크기는 최소 44px을 확보한다. hover는 배경색, active는 1px 아래 이동과 밝기 감소, aria-disabled는 불투명도(.55)로 구분한다. 버튼의 실제 focus 규칙은 styles.css의 더 높은 specificity 때문에 정보색 외곽선(3px)과 간격(2px)이 적용된다. 일반 요소의 focus 규칙과 혼동하지 않는다.

### Chips
상태 태그는 짧은 정보를 위한 비상호작용 요소다. 작은 태그를 동작 버튼으로 쓰지 않는다. 기존 chip은 흰 표면과 얇은 inset 경계를 사용한다.

### Cards / Containers
시트 내부 카드는 아이보리 표면, 얇은 카드 경계, 충분한 안쪽 여백을 쓴다. 목록 행은 아이콘·제목과 설명·행동 버튼 순서다. 그림이 있는 서비스 배너는 크림 그라데이션으로 글 배경을 확보하고 담당 인물의 실루엣을 읽을 수 있게 한다.

### Inputs / Fields
현재 대표 입력은 사냥 단계 range다. 전체 폭과 최소 높이(44px), 로즈 accent-color를 사용하고 label과 output으로 선택값을 함께 보여 준다. 텍스트 입력 컴포넌트는 현재 UI에 없으므로 새로운 입력 디자인을 이미 구현된 것처럼 기록하지 않는다.

### Navigation
하단 네 칸 메뉴는 크림 버튼과 짧은 이름으로 구성한다. 일러스트 아이콘은 22px이며 단독 기호로 메뉴 의미를 대신하지 않는다. 모바일 조작 높이는 44px을 유지한다. 수평 가이드 탭은 내용 길이에 따라 스크롤한다.

### Dialogue / Illustrated Stage
밤 남색 배경, 금빛 이름표, 고정 초상화, 명조 대화문을 결합한다. 주요 장면에는 부드러운 교차 페이드가 있고, 조리에는 작은 부유·회전 효과가 있다. prefers-reduced-motion에서는 애니메이션과 전환을 제거한다. Canvas는 연속 일러스트를 사용하며 픽셀 확대 규칙을 다시 도입하지 않는다.

### 사냥 · 달밤의 꽃정원
서비스 컨셉 「꽃과 달」을 사냥 화면에 맞춘 밤 테마다. 토큰은 `cafe-brand.css` 끝 `:root`에 있다.
- 바탕: 깊은 남색 밤 `--night1` #1F2547 → `--night0` #141A33, 위쪽에 옅은 달빛 번짐.
- 테두리: 달빛 금 가는 선 `--moon-gold` #D9B26A 1px와 안쪽 은은한 둘째 테.
- 강조: 꽃잎 장미 `--petal-rose` #E7A3B5, 연보라 `--petal-lilac` #B9A6E0(진화 가능 카드 빛). 본문 글자 `--night-ink` #F3EBDD, 제목·값 #F6E3B4.
- 제목: 이모지 대신 초승달·꽃잎·금 선 인라인 SVG 장식 줄(`.night-orn`), 자간 .06em 굵게.
- 대화상자: 레벨업·희귀 상자·단계 클리어·결과에 `.dialog.night`. 주 버튼은 금 그라디언트에 어두운 글자, 보조 버튼은 남색. 결과 표는 금 구분선.
- 대화 창: 초승달 테 원형 초상화, 금 선 이름 리본, 남색 유리판, 모서리 꽃잎. 짧게 페이드(움직임 줄이기면 없음). 사건 알림 아래(top 54px)에 둔다.
- 도크: 남색 판·금 윗선, 기술은 달 모양 원 칸, 목표 배지는 초승달+금 글자, 보스일 때 장미 빨강.
- 캔버스: 보스 체력은 둥근 남색 판·금 테·초승달·장미→진홍 막대·꽃잎 마름모 페이즈 눈금. 사건 알림은 금 테 알약(경고는 붉은 판·장미빛 테, 움직임 줄이기면 깜빡이지 않음). 조이스틱은 금 테 반투명 원.
- 경고는 붉은 계열을 그대로 둔다. 장식은 CSS·인라인 SVG·캔버스만 쓰고 이미지 에셋을 늘리지 않는다(15MB 예산).
- 글자 대비 4.5:1 이상, 누르는 곳 44px 이상.

## Do's and Don'ts

### Do:
- **Do** 크림·꿀빛 목재·로즈·세이지는 카페, 남색·금빛은 대화·사냥이라는 역할을 유지한다.
- **Do** 캐릭터의 원본 모습, 투명 경계와 전체 실루엣을 보존한다.
- **Do** 작은 모바일에서도 손님·가구·주문 상태를 구분하고 44px 조작 영역을 확보한다.
- **Do** UI와 대화의 읽기 속도를 구분하고 감소된 모션 설정을 존중한다.

### Don't:
- **Don't** 일러스트를 도트나 강제 정수 배율 스타일로 되돌린다.
- **Don't** 장식이나 인물 그림이 버튼 이름과 운영 상태를 가리게 한다.
- **Don't** 초기 CSS의 덮어쓴 색을 현재 토큰으로 재도입한다.
- **Don't** 에셋 정렬을 위해 캐릭터 외형이나 실제 게임·결제 정책을 바꾼다.
