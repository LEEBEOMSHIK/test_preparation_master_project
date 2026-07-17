import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ExamResultData, QuestionResult } from '@/types';

jest.mock('@/components/ui/CodeBlock', () => ({
  __esModule: true,
  CodeBlock: ({ code }: { code: string }) => <div data-testid="problem-code">{code}</div>,
}));

jest.mock('@/components/ui/RichContent', () => ({
  __esModule: true,
  RichContent: () => null,
}));

jest.mock('@/services/bookmarkService', () => ({
  __esModule: true,
  bookmarkService: {
    getBookmarkedIds: jest.fn(),
    toggle: jest.fn(),
  },
}));

const { ExamResultDisplay } = require('./ExamResultDisplay') as typeof import('./ExamResultDisplay');
const { bookmarkService } = require('@/services/bookmarkService') as typeof import('@/services/bookmarkService');
const mockedBookmarkService = jest.mocked(bookmarkService);

type BookmarkIdsResponse = Awaited<ReturnType<typeof bookmarkService.getBookmarkedIds>>;
type BookmarkToggleResponse = Awaited<ReturnType<typeof bookmarkService.toggle>>;

function bookmarkIdsResponse(ids: number[], success = true): BookmarkIdsResponse {
  return { data: { success, data: ids } } as BookmarkIdsResponse;
}

function bookmarkToggleResponse(bookmarked: boolean, success = true): BookmarkToggleResponse {
  return { data: { success, data: { bookmarked } } } as BookmarkToggleResponse;
}

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

function result(...results: QuestionResult[]): ExamResultData {
  const correct = results.filter(item => item.correct).length;
  return {
    total: results.length,
    correct,
    score: results.length > 0 ? Math.round(correct * 100 / results.length) : 0,
    results,
  };
}

describe('ExamResultDisplay', () => {
  beforeEach(() => {
    mockedBookmarkService.getBookmarkedIds.mockReset();
    mockedBookmarkService.toggle.mockReset();
    mockedBookmarkService.getBookmarkedIds.mockResolvedValue(bookmarkIdsResponse([]));
  });

  it('제목 → 발문 → 본문 → 기본 문구 순으로 선택하고 HTML을 제거한다', () => {
    render(
      <ExamResultDisplay
        result={result(
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
          question({ seq: 3, instruction: '  ', content: '<p>HTML <em>본문</em></p>' }),
          question({ seq: 4, instruction: '', content: '' }),
        )}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText('저장된 문항 제목')).not.toBeNull();
    expect(screen.getByText('HTML 발문')).not.toBeNull();
    expect(screen.getByText('HTML 본문')).not.toBeNull();
    expect(screen.getByText('문항 제목 없음')).not.toBeNull();
    expect(screen.queryByText(/<strong>|<em>/)).toBeNull();
  });

  it('초기 북마크 목록을 한 번 조회해 활성 상태를 표시한다', async () => {
    mockedBookmarkService.getBookmarkedIds.mockResolvedValue(bookmarkIdsResponse([101]));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    const button = await screen.findByRole('button', { name: '복습 표시됨' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(mockedBookmarkService.getBookmarkedIds).toHaveBeenCalledTimes(1);
  });

  it('초기 목록을 불러오는 동안 상태를 표시하고 복습 토글을 차단한다', async () => {
    let resolveLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.getBookmarkedIds.mockReturnValue(new Promise(resolve => {
      resolveLoad = resolve;
    }));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    const loadingButton = screen.getByRole('button', { name: '복습 표시 상태 불러오는 중' });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);
    expect(loadingButton.getAttribute('aria-busy')).toBe('true');
    expect(loadingButton.getAttribute('title')).toBe('복습 표시 상태를 불러오는 중입니다');
    expect(screen.getByRole('status').textContent).toContain('불러오는 중');
    fireEvent.click(loadingButton);
    expect(mockedBookmarkService.toggle).not.toHaveBeenCalled();

    await act(async () => {
      resolveLoad(bookmarkIdsResponse([]));
    });
    const readyButton = await screen.findByRole('button', { name: '복습 표시' });
    expect((readyButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('언마운트 후 늦게 완료된 목록 조회의 resolve와 reject를 DOM에 반영하지 않는다', async () => {
    let resolveLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise(resolve => {
      resolveLoad = resolve;
    }));

    const resolvedView = render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '복습 표시 상태 불러오는 중' })).not.toBeNull();
    resolvedView.unmount();
    await act(async () => {
      resolveLoad(bookmarkIdsResponse([101]));
    });
    expect(resolvedView.container.childElementCount).toBe(0);

    let rejectLoad!: (reason: Error) => void;
    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise((_, reject) => {
      rejectLoad = reject;
    }));
    const rejectedView = render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 202, content: '다른 문항' }))}
        onBack={jest.fn()}
      />,
    );
    rejectedView.unmount();
    await act(async () => {
      rejectLoad(new Error('late load failed'));
    });
    expect(rejectedView.container.childElementCount).toBe(0);
    expect(mockedBookmarkService.getBookmarkedIds).toHaveBeenCalledTimes(2);
  });

  it('언마운트 후 늦게 완료된 토글의 resolve와 reject를 무시하고 cleanup 경로를 마친다', async () => {
    let resolveToggle!: (response: BookmarkToggleResponse) => void;
    mockedBookmarkService.toggle.mockReturnValueOnce(new Promise(resolve => {
      resolveToggle = resolve;
    }));

    const resolvedView = render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));
    resolvedView.unmount();
    await act(async () => {
      resolveToggle(bookmarkToggleResponse(true));
    });
    expect(resolvedView.container.childElementCount).toBe(0);

    let rejectToggle!: (reason: Error) => void;
    mockedBookmarkService.toggle.mockReturnValueOnce(new Promise((_, reject) => {
      rejectToggle = reject;
    }));
    const rejectedView = render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 202, content: '다른 문항' }))}
        onBack={jest.fn()}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));
    rejectedView.unmount();
    await act(async () => {
      rejectToggle(new Error('late toggle failed'));
    });
    expect(rejectedView.container.childElementCount).toBe(0);
    expect(mockedBookmarkService.toggle).toHaveBeenCalledTimes(2);
  });

  it('서버 토글 응답에 따라 복습 표시를 추가하고 해제한다', async () => {
    mockedBookmarkService.toggle
      .mockResolvedValueOnce(bookmarkToggleResponse(true))
      .mockResolvedValueOnce(bookmarkToggleResponse(false));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '복습 표시됨' }));
    expect(await screen.findByRole('button', { name: '복습 표시' })).not.toBeNull();
    expect(mockedBookmarkService.toggle).toHaveBeenNthCalledWith(1, 101);
    expect(mockedBookmarkService.toggle).toHaveBeenNthCalledWith(2, 101);
  });

  it('토글 진행 중 같은 문항의 중복 요청을 막고 아코디언을 펼치지 않는다', async () => {
    let resolveToggle!: (response: BookmarkToggleResponse) => void;
    mockedBookmarkService.toggle.mockReturnValue(new Promise(resolve => {
      resolveToggle = resolve;
    }));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    const bookmarkButton = await screen.findByRole('button', { name: '복습 표시' });
    const accordionButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(bookmarkButton);
    fireEvent.click(bookmarkButton);

    expect(mockedBookmarkService.toggle).toHaveBeenCalledTimes(1);
    expect(accordionButton.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      resolveToggle(bookmarkToggleResponse(true));
    });
  });

  it('초기 조회 실패를 알리고 사용자가 다시 조회할 수 있다', async () => {
    mockedBookmarkService.getBookmarkedIds
      .mockRejectedValueOnce(new Error('load failed'))
      .mockResolvedValueOnce(bookmarkIdsResponse([101]));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByRole('alert')).not.toBeNull();
    const unknownButton = screen.getByRole('button', { name: '복습 표시 상태 확인 필요' });
    expect((unknownButton as HTMLButtonElement).disabled).toBe(true);
    expect(unknownButton.getAttribute('aria-pressed')).toBeNull();
    expect(unknownButton.getAttribute('title')).toContain('상단에서 다시 시도');
    fireEvent.click(unknownButton);
    expect(mockedBookmarkService.toggle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();
    expect(mockedBookmarkService.getBookmarkedIds).toHaveBeenCalledTimes(2);
  });

  it('결과 변경 중에도 동일 questionBankId의 pending을 유지하고 완료 후 서버 상태를 반영한다', async () => {
    let resolveToggle!: (response: BookmarkToggleResponse) => void;
    let resolveNextLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.toggle.mockReturnValue(new Promise(resolve => {
      resolveToggle = resolve;
    }));

    const firstResult = result(question({ seq: 1, questionBankId: 101, content: '첫 결과' }));
    const { rerender } = render(<ExamResultDisplay result={firstResult} onBack={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));

    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise(resolve => {
      resolveNextLoad = resolve;
    }));
    const nextResult = result(question({ seq: 1, questionBankId: 101, content: '다음 결과' }));
    rerender(<ExamResultDisplay result={nextResult} onBack={jest.fn()} />);

    const loadingButton = screen.getByRole('button', { name: '복습 표시 상태 불러오는 중' });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(loadingButton);
    expect(mockedBookmarkService.toggle).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveNextLoad(bookmarkIdsResponse([]));
    });
    const pendingButton = await screen.findByRole('button', { name: '복습 표시 변경 중' });
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(pendingButton);
    expect(mockedBookmarkService.toggle).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveToggle(bookmarkToggleResponse(true));
    });
    const completedButton = await screen.findByRole('button', { name: '복습 표시됨' });
    expect((completedButton as HTMLButtonElement).disabled).toBe(false);
  });

  it('같은 questionBankId의 토글 성공 뒤 도착한 stale 목록이 활성 상태를 덮어쓰지 않는다', async () => {
    let resolveToggle!: (response: BookmarkToggleResponse) => void;
    let resolveStaleLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.toggle.mockReturnValue(new Promise(resolve => {
      resolveToggle = resolve;
    }));

    const firstResult = result(question({ seq: 1, questionBankId: 101, content: '첫 결과' }));
    const { rerender } = render(<ExamResultDisplay result={firstResult} onBack={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));

    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise(resolve => {
      resolveStaleLoad = resolve;
    }));
    const nextResult = result(question({ seq: 1, questionBankId: 101, content: '다음 결과' }));
    rerender(<ExamResultDisplay result={nextResult} onBack={jest.fn()} />);

    await act(async () => {
      resolveToggle(bookmarkToggleResponse(true));
    });
    expect(screen.getByRole('button', { name: '복습 표시 상태 불러오는 중' })).not.toBeNull();

    await act(async () => {
      resolveStaleLoad(bookmarkIdsResponse([]));
    });
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();
  });

  it('이전 결과의 늦은 목록 응답이 새 결과 상태를 오염시키지 않는다', async () => {
    let resolvePreviousLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise(resolve => {
      resolvePreviousLoad = resolve;
    }));

    const previousResult = result(question({ seq: 1, questionBankId: 101, content: '이전 결과' }));
    const { rerender } = render(<ExamResultDisplay result={previousResult} onBack={jest.fn()} />);

    mockedBookmarkService.getBookmarkedIds.mockResolvedValueOnce(bookmarkIdsResponse([202]));
    const nextResult = result(question({ seq: 1, questionBankId: 202, content: '새 결과' }));
    rerender(<ExamResultDisplay result={nextResult} onBack={jest.fn()} />);
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();

    await act(async () => {
      resolvePreviousLoad(bookmarkIdsResponse([101]));
    });
    expect(screen.getByRole('button', { name: '복습 표시됨' })).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockedBookmarkService.getBookmarkedIds).toHaveBeenCalledTimes(2);
  });

  it('목록 응답의 현재 결과 밖 ID를 저장하지 않고 다음 결과에 누출하지 않는다', async () => {
    mockedBookmarkService.getBookmarkedIds.mockResolvedValueOnce(bookmarkIdsResponse([101, 202]));
    const firstResult = result(question({ seq: 1, questionBankId: 101, content: '첫 결과' }));
    const { rerender } = render(<ExamResultDisplay result={firstResult} onBack={jest.fn()} />);
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();

    let resolveNextLoad!: (response: BookmarkIdsResponse) => void;
    mockedBookmarkService.getBookmarkedIds.mockReturnValueOnce(new Promise(resolve => {
      resolveNextLoad = resolve;
    }));
    const nextResult = result(question({ seq: 1, questionBankId: 202, content: '다음 결과' }));
    rerender(<ExamResultDisplay result={nextResult} onBack={jest.fn()} />);

    const loadingButton = screen.getByRole('button', { name: '복습 표시 상태 불러오는 중' });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);
    expect(loadingButton.getAttribute('aria-pressed')).toBeNull();
    expect(loadingButton.className.split(' ')).toContain('border-amber-200');
    expect(loadingButton.className.split(' ')).not.toContain('bg-amber-50');
    expect(loadingButton.querySelector('svg[fill="currentColor"]')).toBeNull();

    await act(async () => {
      resolveNextLoad(bookmarkIdsResponse([]));
    });
    const nextButton = await screen.findByRole('button', { name: '복습 표시' });
    expect(nextButton.getAttribute('aria-pressed')).toBe('false');
    expect(mockedBookmarkService.getBookmarkedIds).toHaveBeenCalledTimes(2);
  });

  it('이전 결과의 늦은 토글 실패를 새 결과 오류로 표시하지 않는다', async () => {
    let rejectPreviousToggle!: (reason: Error) => void;
    mockedBookmarkService.toggle.mockReturnValue(new Promise((_, reject) => {
      rejectPreviousToggle = reject;
    }));

    const previousResult = result(question({ seq: 1, questionBankId: 101, content: '이전 결과' }));
    const { rerender } = render(<ExamResultDisplay result={previousResult} onBack={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));

    mockedBookmarkService.getBookmarkedIds.mockResolvedValueOnce(bookmarkIdsResponse([202]));
    const nextResult = result(question({ seq: 1, questionBankId: 202, content: '새 결과' }));
    rerender(<ExamResultDisplay result={nextResult} onBack={jest.fn()} />);
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();

    await act(async () => {
      rejectPreviousToggle(new Error('previous toggle failed'));
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: '복습 표시됨' })).not.toBeNull();
  });

  it('토글 실패 시 기존 상태를 유지하고 버튼으로 재시도할 수 있다', async () => {
    mockedBookmarkService.toggle
      .mockRejectedValueOnce(new Error('toggle failed'))
      .mockResolvedValueOnce(bookmarkToggleResponse(true));

    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: 101, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: '복습 표시' }));
    expect(await screen.findByRole('alert')).not.toBeNull();
    const retryButton = screen.getByRole('button', { name: '복습 표시' });
    expect(retryButton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(retryButton);
    expect(await screen.findByRole('button', { name: '복습 표시됨' })).not.toBeNull();
    expect(mockedBookmarkService.toggle).toHaveBeenCalledTimes(2);
  });

  it('questionBankId가 없으면 questionId로 추정하지 않고 조회와 버튼을 생략한다', async () => {
    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionId: 101, questionBankId: null, content: '문항' }))}
        onBack={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockedBookmarkService.getBookmarkedIds).not.toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: /복습 표시/ })).toBeNull();
  });

  it('CODE 유형 문항의 문제 코드를 펼침 내용에 표시한다', async () => {
    render(
      <ExamResultDisplay
        result={result(
          question({
            seq: 1,
            questionBankId: null,
            content: '다음 Java 코드의 실행 결과를 쓰시오.',
            code: 'System.out.println("hi");',
            language: 'java',
          }),
        )}
        onBack={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('problem-code')).toBeNull();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect((await screen.findByTestId('problem-code')).textContent).toBe('System.out.println("hi");');
  });

  it('문제 코드가 없으면 코드 블록을 렌더링하지 않는다', async () => {
    render(
      <ExamResultDisplay
        result={result(question({ seq: 1, questionBankId: null, content: '일반 문항' }))}
        onBack={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.queryByTestId('problem-code')).toBeNull();
  });

  it('같은 questionBankId를 가진 문항은 상태를 공유하고 오답 필터에서도 버튼을 유지한다', async () => {
    mockedBookmarkService.toggle.mockResolvedValue(bookmarkToggleResponse(true));

    render(
      <ExamResultDisplay
        result={result(
          question({ seq: 1, questionBankId: 101, content: '첫 문항', correct: false }),
          question({ seq: 2, questionBankId: 101, content: '둘째 문항', correct: true }),
        )}
        onBack={jest.fn()}
      />,
    );

    const buttons = await screen.findAllByRole('button', { name: '복습 표시' });
    fireEvent.click(buttons[0]);
    expect(await screen.findAllByRole('button', { name: '복습 표시됨' })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '오답만 (1)' }));
    expect(screen.getAllByRole('button', { name: '복습 표시됨' })).toHaveLength(1);
  });
});
