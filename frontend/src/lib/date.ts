// "YYYY-MM-DD"를 로컬 자정 기준으로 파싱한다.
// new Date("YYYY-MM-DD")는 UTC 자정으로 해석되어 KST(UTC+9)에서는
// 오늘 날짜가 미래(예정)로 잘못 판정되므로 로컬 기준으로 직접 파싱한다.
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function diffDaysFromToday(dateStr: string): number | null {
  const date = parseLocalDate(dateStr);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((date.getTime() - today.getTime()) / msPerDay);
}

// 사용자 개인 접수 정보(UserExamApplication)의 D-day 라벨을 계산한다.
// - examDate가 있으면 시험일 기준 D-day를 우선 표시
// - examDate가 없고 applicationDate만 있으면 접수 예정/완료 여부만 표시
// - 둘 다 없으면 빈 문자열(호출부는 배지를 렌더하지 않아야 함)
export function getExamDDayLabel(applicationDate?: string, examDate?: string): string {
  if (examDate) {
    const diff = diffDaysFromToday(examDate);
    if (diff === null) return '';
    if (diff > 0) return `시험까지 D-${diff}`;
    if (diff === 0) return '오늘 시험일';
    return '시험 종료';
  }

  if (applicationDate) {
    const diff = diffDaysFromToday(applicationDate);
    if (diff === null) return '';
    if (diff > 0) return `접수 예정 D-${diff}`;
    return '접수 완료';
  }

  return '';
}

// D-day가 임박(7일 이내, 오늘 포함)했는지 여부만 판정한다.
// getExamDDayLabel과 동일한 우선순위(examDate 우선, 없으면 applicationDate)로 대상 날짜를 고른다.
export function isExamDDayUrgent(applicationDate?: string, examDate?: string): boolean {
  const target = examDate ?? applicationDate;
  if (!target) return false;
  const diff = diffDaysFromToday(target);
  if (diff === null) return false;
  return diff >= 0 && diff <= 7;
}

// getExamDDayLabel 배지에 공통으로 사용하는 Tailwind 클래스.
// exam-info/settings 두 화면이 동일한 색상 팔레트를 쓰도록 여기서 한 번만 정의한다.
export const EXAM_DDAY_BADGE_URGENT =
  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400';
export const EXAM_DDAY_BADGE_NEUTRAL =
  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

export function getExamDDayBadgeClass(applicationDate?: string, examDate?: string): string {
  return isExamDDayUrgent(applicationDate, examDate) ? EXAM_DDAY_BADGE_URGENT : EXAM_DDAY_BADGE_NEUTRAL;
}
