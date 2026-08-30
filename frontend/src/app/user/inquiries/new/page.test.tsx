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
    jest.mocked(domainService.getSlavesByCode).mockImplementation(async (code) => ({
      data: {
        success: true,
        data: code === 'INQUIRY_CATEGORY'
          ? [
              { id: 1, masterId: 1, name: 'GENERAL_INQUIRY', displayOrder: 1 },
              { id: 2, masterId: 1, name: 'BUG_REPORT', displayOrder: 2 },
              { id: 3, masterId: 1, name: 'EXAM_OPENING_REQUEST', displayOrder: 3 },
              { id: 4, masterId: 1, name: 'FEATURE_REQUEST', displayOrder: 4 },
              { id: 5, masterId: 1, name: 'OTHER', displayOrder: 5 },
              { id: 99, masterId: 1, name: 'UNSUPPORTED_TYPE', displayOrder: 99 },
            ]
          : [
              { id: 11, masterId: 2, name: 'EXAM_INFO', displayOrder: 1 },
              { id: 12, masterId: 2, name: 'EXAM_SOLVING_RESULT', displayOrder: 2 },
              { id: 98, masterId: 2, name: 'UNSUPPORTED_AREA', displayOrder: 99 },
            ],
      },
    } as never));
    jest.mocked(inquiryService.create).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
  });

  it('문의 유형과 발생 영역을 각각 동적으로 조회하고 허용 enum으로 좁힌다', async () => {
    render(<NewInquiryPage />);

    const typeSelect = await screen.findByLabelText('접수 유형') as HTMLSelectElement;
    const areaSelect = screen.getByLabelText(/발생 영역/) as HTMLSelectElement;

    expect(domainService.getSlavesByCode).toHaveBeenCalledWith('INQUIRY_CATEGORY');
    expect(domainService.getSlavesByCode).toHaveBeenCalledWith('INQUIRY_BUG_AREA');
    expect(Array.from(typeSelect.options).map((option) => option.value)).toEqual([
      'GENERAL_INQUIRY',
      'BUG_REPORT',
      'EXAM_OPENING_REQUEST',
      'FEATURE_REQUEST',
      'OTHER',
    ]);
    expect(Array.from(areaSelect.options).map((option) => option.value)).toEqual([
      '',
      'EXAM_INFO',
      'EXAM_SOLVING_RESULT',
    ]);
    expect(screen.getByRole('option', { name: '시험정보' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'UNSUPPORTED_AREA' })).toBeNull();
  });

  it('도메인 조회 실패 시 고정된 전체 enum 목록으로 정확히 폴백한다', async () => {
    jest.mocked(domainService.getSlavesByCode).mockRejectedValue(new Error('domain unavailable'));

    render(<NewInquiryPage />);

    const typeSelect = await screen.findByLabelText('접수 유형') as HTMLSelectElement;
    const areaSelect = screen.getByLabelText(/발생 영역/) as HTMLSelectElement;

    expect(Array.from(typeSelect.options).map((option) => option.value)).toEqual([
      'GENERAL_INQUIRY',
      'BUG_REPORT',
      'EXAM_OPENING_REQUEST',
      'FEATURE_REQUEST',
      'OTHER',
    ]);
    expect(Array.from(areaSelect.options).map((option) => option.value)).toEqual([
      '',
      'LOGIN_ACCOUNT',
      'USER_HOME',
      'EXAM_INFO',
      'EXAM_SOLVING_RESULT',
      'DAILY_QUIZ',
      'CONCEPT_NOTE',
      'PRACTICE_SCRATCHPAD',
      'INQUIRY_REQUEST',
      'OTHER',
    ]);
  });

  it('도메인 조회 성공 시 허용 값이 없어도 고정 목록으로 폴백하지 않는다', async () => {
    jest.mocked(domainService.getSlavesByCode).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 99, masterId: 1, name: 'UNSUPPORTED_VALUE', displayOrder: 1 },
        ],
      },
    } as never);

    render(<NewInquiryPage />);

    const typeSelect = await screen.findByLabelText('접수 유형') as HTMLSelectElement;
    const areaSelect = screen.getByLabelText(/발생 영역/) as HTMLSelectElement;

    expect(Array.from(typeSelect.options)).toHaveLength(0);
    expect(Array.from(areaSelect.options).map((option) => option.value)).toEqual(['']);
    expect((screen.getByRole('button', { name: '등록하기' }) as HTMLButtonElement).disabled)
      .toBe(true);
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

  it('공통 드롭존으로 여러 이미지를 첨부하고 업로드 완료 ID를 등록 payload에 포함한다', async () => {
    jest.mocked(inquiryService.uploadImage)
      .mockResolvedValueOnce({ data: { success: true, data: { id: 31, url: '/uploads/first.png' } } } as never)
      .mockResolvedValueOnce({ data: { success: true, data: { id: 32, url: '/uploads/second.png' } } } as never);
    const { container } = render(<NewInquiryPage />);
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    fireEvent.change(await screen.findByLabelText('이미지 파일 선택'), {
      target: { files: [first, second] },
    });
    expect(await screen.findByRole('button', { name: /이미지 파일 선택 또는 드래그 앤 드롭/ })).toBeTruthy();
    expect(screen.getByText('최대 3장, 파일당 10MB 이하, JPG/JPEG/PNG/GIF/WebP')).toBeTruthy();
    expect((await screen.findAllByText('업로드 완료'))).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '이미지 등록' } });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '첨부 두 장' } });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await waitFor(() => expect(inquiryService.create).toHaveBeenCalledWith(expect.objectContaining({
      attachmentIds: [31, 32],
    })));
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('서버가 전달한 등록 오류 메시지를 우선 표시한다', async () => {
    jest.mocked(inquiryService.create).mockRejectedValue({
      response: { data: { success: false, error: { code: 'CONFLICT', message: '현재 문의 유형을 확인해 주세요.' } } },
    });
    render(<NewInquiryPage />);

    await screen.findByLabelText('접수 유형');
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '오류 제목' } });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '오류 내용' } });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert.textContent).toContain('현재 문의 유형을 확인해 주세요.');
  });

  it('이미지 업로드 중에는 등록 버튼을 비활성화하고 등록 API를 호출하지 않는다', async () => {
    let resolveUpload: ((value: { data: { success: boolean; data: { id: number; url: string } } }) => void) | undefined;
    jest.mocked(inquiryService.uploadImage).mockImplementation(() => new Promise((resolve) => {
      resolveUpload = resolve;
    }) as never);
    render(<NewInquiryPage />);

    fireEvent.change(await screen.findByLabelText('이미지 파일 선택'), {
      target: { files: [new File(['image'], 'pending.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '업로드 대기' } });
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '등록 차단 확인' } });
    const submitButton = screen.getByRole('button', { name: '등록하기' }) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    fireEvent.click(submitButton);
    expect(inquiryService.create).not.toHaveBeenCalled();
    resolveUpload?.({ data: { success: true, data: { id: 91, url: '/uploads/pending.png' } } });
    expect(await screen.findByText('업로드 완료')).toBeTruthy();
  });
});
