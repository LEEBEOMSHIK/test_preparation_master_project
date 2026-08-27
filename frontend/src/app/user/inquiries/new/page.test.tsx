import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { domainService } from '@/services/domainService';
import { inquiryService } from '@/services/inquiryService';
import type { InquiryRequest } from '@/services/inquiryService';
import type { InquiryRequestType } from '@/types';
import NewInquiryPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/domainService', () => ({
  domainService: {
    getSlavesByCode: jest.fn(),
  },
}));

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    create: jest.fn(),
    uploadImage: jest.fn(),
  },
}));

const push = jest.fn();

describe('NewInquiryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({ push } as never);
    jest.mocked(domainService.getSlavesByCode).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 11, masterId: 1, name: 'EXAM_INFO', displayOrder: 1 },
          { id: 12, masterId: 1, name: 'EXAM_SOLVING_RESULT', displayOrder: 2 },
        ],
      },
    } as never);
    jest.mocked(inquiryService.create).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
  });

  it.each<{
    requestType: Exclude<InquiryRequestType, 'EXAM_OPENING_REQUEST'>;
    expected: InquiryRequest;
  }>([
    {
      requestType: 'GENERAL_INQUIRY',
      expected: {
        title: '일반 문의 제목',
        content: '일반 문의 내용',
        requestType: 'GENERAL_INQUIRY',
        targetArea: 'EXAM_INFO',
        detailLocation: '/exam/17',
        attachmentIds: [],
      },
    },
    {
      requestType: 'BUG_REPORT',
      expected: {
        title: '버그 신고 제목',
        content: '버그 신고 내용',
        requestType: 'BUG_REPORT',
        targetArea: 'EXAM_INFO',
        detailLocation: '/exam/17',
        attachmentIds: [],
      },
    },
    {
      requestType: 'FEATURE_REQUEST',
      expected: {
        title: '기능 요청 제목',
        content: '기능 요청 내용',
        requestType: 'FEATURE_REQUEST',
        targetArea: 'EXAM_INFO',
        detailLocation: '/exam/17',
        attachmentIds: [],
      },
    },
    {
      requestType: 'OTHER',
      expected: {
        title: '기타 요청 제목',
        content: '기타 요청 내용',
        requestType: 'OTHER',
        targetArea: 'EXAM_INFO',
        detailLocation: '/exam/17',
        attachmentIds: [],
      },
    },
  ])('$requestType 입력값으로 정확한 등록 payload를 전송한다', async ({ requestType, expected }) => {
    render(<NewInquiryPage />);

    fireEvent.change(await screen.findByLabelText('접수 유형'), {
      target: { value: requestType },
    });
    fireEvent.change(screen.getByLabelText(/발생 영역/), {
      target: { value: 'EXAM_INFO' },
    });
    fireEvent.change(screen.getByLabelText(/상세 위치\/URL/), {
      target: { value: '  /exam/17  ' },
    });
    fireEvent.change(screen.getByLabelText('제목'), {
      target: { value: `  ${expected.title}  ` },
    });
    fireEvent.change(screen.getByLabelText('내용'), {
      target: { value: `  ${expected.content}  ` },
    });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await waitFor(() => {
      expect(inquiryService.create).toHaveBeenCalledWith(expected);
    });
  });

  it('시험 개설 요청에서는 targetArea와 detailLocation을 payload에서 제외한다', async () => {
    render(<NewInquiryPage />);

    const requestType = await screen.findByLabelText('접수 유형');
    fireEvent.change(screen.getByLabelText(/발생 영역/), {
      target: { value: 'EXAM_INFO' },
    });
    fireEvent.change(screen.getByLabelText(/상세 위치\/URL/), {
      target: { value: '/exam/should-not-be-sent' },
    });
    fireEvent.change(requestType, {
      target: { value: 'EXAM_OPENING_REQUEST' },
    });
    fireEvent.change(screen.getByLabelText('제목'), {
      target: { value: '  시험 개설 제목  ' },
    });
    fireEvent.change(screen.getByLabelText('내용'), {
      target: { value: '  시험 개설 내용  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await waitFor(() => {
      expect(inquiryService.create).toHaveBeenCalledWith({
        title: '시험 개설 제목',
        content: '시험 개설 내용',
        requestType: 'EXAM_OPENING_REQUEST',
        attachmentIds: [],
      });
    });
  });
});
