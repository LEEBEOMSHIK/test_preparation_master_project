import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import { BugReportModal } from './BugReportModal';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    create: jest.fn(),
  },
}));

describe('BugReportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquiryService.create).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
  });

  it('시험 문항 신고를 EXAM_SOLVING_RESULT 영역의 정확한 payload로 등록한다', async () => {
    render(
      <BugReportModal
        context={{
          source: 'EXAM',
          label: '정보처리기사 실기',
          questionId: 17,
          questionContent: '<p>배열 <strong>정답</strong></p>',
        }}
        onClose={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/어떤 문제가 있었는지/), {
      target: { value: '  정답이 다릅니다.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() => {
      expect(inquiryService.create).toHaveBeenCalledWith({
        title: '[버그신고] 시험 - 정보처리기사 실기',
        content: '[자동 첨부 정보]\n- 화면: 시험 (정보처리기사 실기)\n- 문항 ID: 17\n- 문항 내용: 배열 정답\n\n[문제 설명]\n정답이 다릅니다.',
        requestType: 'BUG_REPORT',
        targetArea: 'EXAM_SOLVING_RESULT',
        detailLocation: '시험 · 정보처리기사 실기 · 문항 17',
        attachmentIds: [],
      });
    });
  });
});
