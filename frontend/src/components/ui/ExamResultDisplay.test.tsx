import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ExamResultData, QuestionResult } from '@/types';

jest.mock('@/components/ui/CodeBlock', () => ({
  __esModule: true,
  CodeBlock: () => null,
}));

jest.mock('@/components/ui/RichContent', () => ({
  __esModule: true,
  RichContent: () => null,
}));

const { ExamResultDisplay } = require('./ExamResultDisplay') as typeof import('./ExamResultDisplay');

function question({
  seq,
  ...overrides
}: Partial<QuestionResult> & Pick<QuestionResult, 'seq'>): QuestionResult {
  return {
    questionId: seq,
    content: '',
    questionType: 'SHORT_ANSWER',
    userAnswer: '',
    correctAnswer: '',
    correct: false,
    ...overrides,
    seq,
  };
}

describe('ExamResultDisplay 문항 헤더 미리보기', () => {
  it('제목 → 발문 → 본문 → 기본 문구 순으로 선택하고 HTML을 제거한다', () => {
    const result: ExamResultData = {
      total: 4,
      correct: 0,
      score: 0,
      results: [
        question({
          seq: 1,
          title: '  저장된 문항 제목  ',
          instruction: '<p>사용되지 않는 발문</p>',
          content: '<p>사용되지 않는 본문</p>',
        }),
        question({
          seq: 2,
          title: '   ',
          instruction: '<p>HTML <strong>발문</strong></p>',
          content: '<p>사용되지 않는 본문</p>',
        }),
        question({
          seq: 3,
          instruction: '  ',
          content: '<p>HTML <em>본문</em></p>',
        }),
        question({ seq: 4, instruction: '', content: '' }),
      ],
    };

    render(<ExamResultDisplay result={result} onBack={jest.fn()} />);

    expect(screen.getByText('저장된 문항 제목')).not.toBeNull();
    expect(screen.getByText('HTML 발문')).not.toBeNull();
    expect(screen.getByText('HTML 본문')).not.toBeNull();
    expect(screen.getByText('문항 제목 없음')).not.toBeNull();
    expect(screen.queryByText(/<strong>|<em>/)).toBeNull();
  });
});
