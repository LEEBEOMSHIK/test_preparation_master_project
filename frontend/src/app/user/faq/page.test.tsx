import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { faqService } from '@/services/faqService';
import type { Faq } from '@/types';
import UserFaqPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/faqService', () => ({ faqService: { getFaqs: jest.fn() } }));

function response<T>(data: T) {
  return { data: { success: true, data } } as never;
}

function faq(id: number): Faq {
  return {
    id,
    question: `질문 ${id}`,
    answer: `답변 ${id}`,
    isActive: true,
    displayOrder: id,
    createdAt: '2026-09-09T00:00:00',
    updatedAt: '2026-09-09T00:00:00',
  };
}

describe('UserFaqPage 페이지네이션', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(faqService.getFaqs).mockResolvedValue(response(Array.from({ length: 11 }, (_, index) => faq(index + 1))));
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
  });

  it('FAQ를 기본 열 개씩 표시하고 열린 항목 상태를 유지하며 다음 페이지로 이동한다', async () => {
    render(<UserFaqPage />);

    const firstQuestion = await screen.findByRole('button', { name: /질문 1$/ });
    expect(screen.getByRole('button', { name: /질문 10$/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /질문 11$/ })).toBeNull();
    fireEvent.click(firstQuestion);
    expect(screen.getByText('답변 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(screen.getByRole('button', { name: /질문 11/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /질문 1$/ })).toBeNull();
    expect(screen.queryByText('답변 1')).toBeNull();
  });

  it('조회 실패를 빈 FAQ로 표시하지 않고 재시도한다', async () => {
    jest.mocked(faqService.getFaqs)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response([faq(1)]));

    render(<UserFaqPage />);

    expect(await screen.findByText('FAQ를 불러오지 못했습니다.')).toBeTruthy();
    expect(screen.queryByText('등록된 FAQ가 없습니다.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: /질문 1$/ })).toBeTruthy();
  });

  it('StrictMode에서 무효화된 이전 응답과 페이지 푸터를 오류 화면에 반영하지 않는다', async () => {
    type FaqResponse = Awaited<ReturnType<typeof faqService.getFaqs>>;
    let resolveOldRequest: ((value: FaqResponse) => void) | undefined;
    const oldRequest = new Promise<FaqResponse>(resolve => {
      resolveOldRequest = resolve;
    });
    jest.mocked(faqService.getFaqs)
      .mockReturnValueOnce(oldRequest)
      .mockRejectedValueOnce(new Error('latest request failed'));

    render(<StrictMode><UserFaqPage /></StrictMode>);

    expect(await screen.findByText('FAQ를 불러오지 못했습니다.')).toBeTruthy();
    resolveOldRequest?.(response(Array.from({ length: 11 }, (_, index) => faq(index + 1))));

    expect(await screen.findByText('FAQ를 불러오지 못했습니다.')).toBeTruthy();
    expect(screen.queryByText('1-10 / 전체 11건')).toBeNull();
  });
});
