# 카페 음악과 효과음 · 2026-10-28

## 2026-10-30 대기 화면·월드맵

- 대기 화면: `destinycafe-02` Gentle Oriental Girl, 일상·코미디 분위기의 연주곡.
- 월드맵: `meditation-01` Crystal Garden, 정원과 섬 탐색에 맞춘 연주곡.
- 두 곡은 Code Destiny의 `scripts/build-novel-runtime.mjs` 연주곡 허용 목록(orientalGirl/crystalGarden)과 `public/codedestiny-novel.html` 실제 파일 매핑으로 확인했다. 보컬곡을 기본 배경음악으로 지정하지 않는다.
- 새 방문은 음악 켜짐이 기본이며 첫 클릭·터치·키 입력 후 시작한다. 저장된 음악 끔·음량은 보존한다. 대기 화면·월드·카페의 수동 선곡은 각각 기억하고 음악실을 열어도 배경 장면을 유지한다.

카페 자동 재생 순서: Moonlight Tea → Moonlit Tea House → Kindness → Gentle Oriental Girl → Moonlit Destiny Room → First Light on Water → Crystal Garden → Moonlit Dawn. 끝나면 첫 곡으로 돌아간다. 카페를 벗어나 사냥하면 기존 전투곡을 사용하고 돌아오면 카페 순번을 유지한다. 수동 선곡과 저장된 음소거 설정은 존중한다. 브라우저 사용자 입력 전에는 재생하지 않는다.

음악은 사용자가 요청한 Code Destiny 공개 스트리밍 곡이다. 외부 사이트의 '무료 음원'으로 재분류하거나 저작권이 없다고 표시하지 않는다. 재사용 근거와 원본 공개 스트리밍 정책 확인 기록은 REUSE.md 참조. 음원 파일 복사·다운로드 제공·판매 권한 변경 없음.

효과음은 src/ui/audio.js의 Web Audio oscillator 및 내부 생성 noise로 실시간 합성한다. 외부 녹음·샘플·기성 멜로디를 사용하지 않는다. 이번 작성분은 나무 버튼, 잔의 짧은 울림, 조리 완료, 인연, 수확과 덜 날카로운 피격음이다. 외부 효과음 라이선스 비용이나 출처 표기가 필요한 샘플 의존성을 추가하지 않았다. 동시 발음 28개 제한과 소리별 재생 간격, 음량·음소거 설정을 유지한다.
