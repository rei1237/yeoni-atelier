// 달그늘 사냥터 업적(게임 오리지널, docs/WORLD.md). 판정은 사냥 귀환 정산 때 엔진(hunt-codex.js)이 한다
import { TEMP } from '../config/balance.temp.js';

const cleared = (s, n) => (s.hunter?.maxStage || 1) > n || Object.keys(s.ledger?.rewards || {}).some(k => k.startsWith('stage:') && k.endsWith(':' + n));
const codex = s => s.huntCodex || {};
const count = o => Object.keys(o || {}).length;

// goal: 아직 못 이룬 업적의 진행도 [현재, 목표]
export const HUNT_ACHIEVEMENTS = Object.freeze([
  { id: 'first_boss', icon: '☾', name: '첫 보스 토벌', desc: '단계 보스를 처음 쓰러뜨린다', test: s => (s.stats?.huntBosses || 0) >= 1 },
  { id: 'triple', icon: '✿', name: '오늘은 여기까지', desc: '한 번 출발에 3단계를 클리어한다', test: s => !!codex(s).feats?.triple },
  { id: 'no_tonic', icon: '❀', name: '맨몸의 달밤', desc: '회복 수프 없이 단계를 클리어한다', test: s => !!codex(s).feats?.no_tonic },
  { id: 'stage10', icon: '✦', name: '달그늘 10단계', desc: '10단계를 클리어한다', test: s => cleared(s, 10) },
  { id: 'stage30', icon: '✦', name: '달그늘 30단계', desc: '30단계를 클리어한다', test: s => cleared(s, 30) },
  { id: 'stage50', icon: '✦', name: '달그늘 50단계', desc: '50단계를 클리어한다', test: s => cleared(s, 50) },
  { id: 'stage100', icon: '◐', name: '흑월의 끝', desc: '100단계를 클리어한다', test: s => cleared(s, 100) },
  { id: 'kills1000', icon: '✧', name: '천 개의 그림자', desc: '누적 1,000마리를 처치한다', test: s => (s.hunter?.kills || 0) >= 1000, goal: s => [s.hunter?.kills || 0, 1000] },
  { id: 'kills10000', icon: '✧', name: '만 개의 그림자', desc: '누적 10,000마리를 처치한다', test: s => (s.hunter?.kills || 0) >= 10000, goal: s => [s.hunter?.kills || 0, 10000] },
  { id: 'evolve', icon: '✺', name: '첫 진화', desc: '무기를 진화시켜 돌아온다', test: s => count(codex(s).evolved) >= 1 },
  { id: 'evolve_all', icon: '✺', name: '다섯 개의 달', desc: '무기 5종을 모두 진화시킨다', test: s => count(codex(s).evolved) >= 5, goal: s => [count(codex(s).evolved), 5] },
  { id: 'bestiary10', icon: '◈', name: '그림자 관찰자', desc: '적 10종을 만난다', test: s => count(codex(s).enemies) >= 10, goal: s => [count(codex(s).enemies), 10] },
  { id: 'hanbi', icon: '❖', name: '검은 호랑이와 함께', desc: '서한비가 사냥꾼으로 합류한다', test: s => !!s.roster?.seohanbi },
]);
export const achievementMoon = id => TEMP.HUNT_ACHIEVE_MOON[id] || 0;
