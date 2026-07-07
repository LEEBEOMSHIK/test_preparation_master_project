import type { QuestionSummary } from '@/types';
import { compareQuestionSourceOrder } from './questionSort';

const question = ({ id, ...overrides }: Partial<QuestionSummary> & Pick<QuestionSummary, 'id'>): QuestionSummary => ({
  id,
  content: '',
  questionType: 'SHORT_ANSWER',
  createdAt: '2026-01-01T00:00:00',
  ...overrides,
});

describe('compareQuestionSourceOrder', () => {
  it('sorts by year desc, round asc, question number asc', () => {
    const questions = [
      question({ id: 1, examYear: 2024, examRound: 2, questionNo: 1 }),
      question({ id: 2, examYear: 2025, examRound: 2, questionNo: 1 }),
      question({ id: 3, examYear: 2025, examRound: 1, questionNo: 2 }),
      question({ id: 4, examYear: 2025, examRound: 1, questionNo: 1 }),
    ];

    const sorted = [...questions].sort(compareQuestionSourceOrder);

    expect(sorted.map((q) => q.id)).toEqual([4, 3, 2, 1]);
  });

  it('places incomplete source fields last and uses updatedAt desc fallback', () => {
    const questions = [
      question({ id: 1, examYear: 2024, examRound: 1, questionNo: 1, updatedAt: '2026-01-01T00:00:00' }),
      question({ id: 2, examYear: 2024, examRound: 1, questionNo: 1, updatedAt: '2026-01-03T00:00:00' }),
      question({ id: 3, examYear: undefined, examRound: 1, questionNo: 1, updatedAt: '2026-01-04T00:00:00' }),
    ];

    const sorted = [...questions].sort(compareQuestionSourceOrder);

    expect(sorted.map((q) => q.id)).toEqual([2, 1, 3]);
  });
});
