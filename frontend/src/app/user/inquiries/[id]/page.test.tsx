import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { inquiryService } from '@/services/inquiryService';
import { domainService } from '@/services/domainService';
import InquiryDetailPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    getMyInquiry: jest.fn(),
    addMessage: jest.fn(),
    uploadMessageImage: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('@/services/domainService', () => ({ domainService: { getSlavesByCode: jest.fn() } }));

describe('InquiryDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useParams).mockReturnValue({ id: '31' });
    jest.mocked(domainService.getSlavesByCode).mockResolvedValue({ data: { success: true, data: [
      { id: 1, masterId: 1, name: 'GENERAL_INQUIRY', displayOrder: 1 },
      { id: 2, masterId: 1, name: 'EXAM_INFO', displayOrder: 1 },
    ] } } as never);
  });

  it('보류 중이고 후속 메시지가 없는 최초 문의를 수정하고 최신 상세를 다시 조회한다', async () => {
    jest.mocked(inquiryService.getMyInquiry).mockResolvedValue({
      data: { success: true, data: {
        id: 31, title: '수정 전', content: '수정 전 본문', status: 'PENDING', requestType: 'GENERAL_INQUIRY',
        targetArea: 'EXAM_INFO', detailLocation: '/exam/1', createdAt: '2026-08-28T10:00:00', imageUrls: ['/uploads/existing.png'], messages: [],
      } },
    } as never);
    jest.mocked(inquiryService.update).mockResolvedValue({ data: { success: true, data: null } } as never);
    render(<InquiryDetailPage />);

    expect(await screen.findByText('수정 전')).toBeTruthy();
    expect(screen.queryByPlaceholderText('답변 내용을 입력해 주세요.')).toBeNull();
    expect(screen.queryByRole('heading', { name: '답변 등록' })).toBeNull();

    fireEvent.click(await screen.findByRole('button', { name: '문의 수정' }));
    expect(screen.getByText('기존 첨부 이미지는 유지됩니다.')).toBeTruthy();
    await waitFor(() => expect((screen.getByRole('button', { name: '수정 저장' }) as HTMLButtonElement).disabled).toBe(false));
    expect(screen.queryByRole('option', { name: '신규 기능 요청' })).toBeNull();
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '수정 후 제목' } });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '수정 후 본문' } });
    fireEvent.click(screen.getByRole('button', { name: '수정 저장' }));

    await waitFor(() => expect(inquiryService.update).toHaveBeenCalledWith(31, expect.objectContaining({
      title: '수정 후 제목', content: '수정 후 본문',
    })));
    const [, updatePayload] = jest.mocked(inquiryService.update).mock.calls[0];
    expect(updatePayload).not.toHaveProperty('attachmentIds');
    expect(inquiryService.getMyInquiry).toHaveBeenCalledTimes(2);
  });

  it('도메인에 현재 설정이 없어도 제목과 내용만 수정하면 기존 유형과 발생 영역을 보존한다', async () => {
    jest.mocked(inquiryService.getMyInquiry).mockResolvedValue({
      data: { success: true, data: {
        id: 32, title: '기능 요청', content: '수정 전 본문', status: 'PENDING', requestType: 'FEATURE_REQUEST',
        targetArea: 'DAILY_QUIZ', detailLocation: '/daily-quiz/1', createdAt: '2026-08-28T10:00:00', imageUrls: [], messages: [],
      } },
    } as never);
    jest.mocked(inquiryService.update).mockResolvedValue({ data: { success: true, data: null } } as never);
    render(<InquiryDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: '문의 수정' }));
    expect(await screen.findByRole('option', { name: '신규 기능 요청 (현재 설정)' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '데일리 퀴즈 (현재 설정)' })).toBeTruthy();
    await waitFor(() => expect((screen.getByRole('button', { name: '수정 저장' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '기능 요청 수정' } });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '수정 후 본문' } });
    fireEvent.click(screen.getByRole('button', { name: '수정 저장' }));

    await waitFor(() => expect(inquiryService.update).toHaveBeenCalledWith(32, {
      title: '기능 요청 수정',
      content: '수정 후 본문',
      requestType: 'FEATURE_REQUEST',
      targetArea: 'DAILY_QUIZ',
      detailLocation: '/daily-quiz/1',
    }));
  });

  it('종료 상태 문의에는 추가 메시지 작성기를 표시하지 않는다', async () => {
    jest.mocked(inquiryService.getMyInquiry).mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 31,
          title: '종료된 일반 문의',
          content: '문의 본문',
          status: 'ANSWERED',
          requestType: 'GENERAL_INQUIRY',
          targetArea: 'USER_HOME',
          detailLocation: '/user',
          createdAt: '2026-08-28T10:00:00',
          imageUrls: [],
          messages: [
            {
              id: 41,
              authorId: 1,
              authorRole: 'ADMIN',
              content: '답변을 완료했습니다.',
              createdAt: '2026-08-28T11:00:00',
              imageUrls: [],
            },
          ],
        },
      },
    } as never);

    render(<InquiryDetailPage />);

    expect(await screen.findByText('종료된 일반 문의')).toBeTruthy();
    expect(screen.getByText('처리가 종료되었습니다.')).toBeTruthy();
    expect(screen.queryByPlaceholderText('답변 내용을 입력해 주세요.')).toBeNull();
    expect(screen.queryByRole('heading', { name: '답변 등록' })).toBeNull();
    expect(inquiryService.getMyInquiry).toHaveBeenCalledWith(31);
  });
});
