import type { QuestionSummary } from '@/types';

function compareNumberAsc(a?: number, b?: number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function compareNumberDesc(a?: number, b?: number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

export function compareQuestionSourceOrder(a: QuestionSummary, b: QuestionSummary) {
  const yearDiff = compareNumberDesc(a.examYear, b.examYear);
  if (yearDiff !== 0) return yearDiff;
  const roundDiff = compareNumberAsc(a.examRound, b.examRound);
  if (roundDiff !== 0) return roundDiff;
  const questionNoDiff = compareNumberAsc(a.questionNo, b.questionNo);
  if (questionNoDiff !== 0) return questionNoDiff;
  const aUpdated = new Date(a.updatedAt ?? a.createdAt).getTime();
  const bUpdated = new Date(b.updatedAt ?? b.createdAt).getTime();
  return bUpdated - aUpdated;
}
