// 상성·접대 만족도·팁 공식. 순수 함수만 둔다(상태 변경 없음).
// 공식 자체는 사용자 확정 규칙이고, 판정 구간만 기획서 제안값(설정 가능)이다.

import { RULES, STAT_KEYS, CORE_CAP } from '../config/rules.js';
import { PDF } from '../config/balance.pdf.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// M = Σ(능력치 × 선호%) / 10   (능력치 0~10, 선호 합 100 → M 0~100)
export function baseAffinity(stats, prefs) {
  let sum = 0;
  for (const k of STAT_KEYS) sum += (stats[k] ?? 0) * (prefs[k] ?? 0);
  return sum / 10;
}

// 핵심 조건 미충족 항목: 선호 ≥ 40% 이면서 능력치 < 3
export function coreFailures(stats, prefs) {
  return STAT_KEYS.filter(k => (prefs[k] ?? 0) >= CORE_CAP.PREF_MIN && (stats[k] ?? 0) < CORE_CAP.STAT_BELOW);
}

// H0 = clamp(M + 대화 보정 - 지명 대기 불만, 0, 100), 상한 규칙 적용 후 H.
// 음식·인테리어·의상·피버는 인자로 받지 않는다 → 상한을 우회할 경로가 없다.
export function hostingScore({ stats, prefs, talkBonus = 0, waitPenalty = 0 }) {
  const M = baseAffinity(stats, prefs);
  const tb = clamp(talkBonus, RULES.TALK_BONUS_MIN, RULES.TALK_BONUS_MAX);
  const wp = clamp(waitPenalty, RULES.WAIT_PENALTY_MIN, RULES.WAIT_PENALTY_MAX);
  const H0 = clamp(M + tb - wp, 0, 100);
  const failures = coreFailures(stats, prefs);
  const capped = failures.length > 0;
  const H = capped ? Math.min(H0, CORE_CAP.H_MAX) : H0;
  return { M, H0, H, capped, failures, talkBonus: tb, waitPenalty: wp };
}

export function gradeOf(H, grade = PDF.GRADE) {
  if (H == null) return { id: 'na', label: '해당 없음' };
  if (H >= grade.great) return { id: 'great', label: '매우 만족' };
  if (H >= grade.good) return { id: 'good', label: '만족' };
  if (H >= grade.meh) return { id: 'meh', label: '아쉬움' };
  return { id: 'bad', label: '불만족' };
}

// 기본 팁 = floor(서빙된 주문 합계 × 0.4 × (H - 50) / 50). 최종 H ≥ 60 이고 300초를 모두 채웠을 때만.
export function tipFor({ servedTotal, H, completedFull, fevered, multiplier = 1 }) {
  if (!completedFull || H < RULES.TIP_MIN_H) return { base: 0, feverExtra: 0, total: 0 };
  const base = Math.floor(servedTotal * multiplier * RULES.TIP_RATE * (H - RULES.TIP_PIVOT) / RULES.TIP_PIVOT);
  const feverExtra = fevered ? base * (RULES.FEVER_TIP_MULTIPLIER - 1) : 0;
  return { base, feverExtra, total: base + feverExtra };
}

export function feverGainFor(H) {
  if (H >= 90) return RULES.FEVER_GAIN_H90;
  if (H >= 80) return RULES.FEVER_GAIN_H80;
  if (H >= 60) return RULES.FEVER_GAIN_H60;
  return 0;
}

// 설정 불변식: 판정 구간을 바꾸더라도 "핵심 조건 미충족 고객은 만족 불가"가 유지되어야 한다.
export function assertGradeInvariant(grade = PDF.GRADE) {
  if (!(CORE_CAP.H_MAX < grade.good)) throw new Error(`판정 구간 오류: 만족 기준(${grade.good})은 핵심 조건 상한(${CORE_CAP.H_MAX})보다 커야 한다`);
  if (!(CORE_CAP.H_MAX < RULES.TIP_MIN_H)) throw new Error('팁 기준은 핵심 조건 상한보다 커야 한다');
  return true;
}
assertGradeInvariant();
