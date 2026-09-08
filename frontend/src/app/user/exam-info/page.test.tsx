import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { examInfoService } from '@/services/examInfoService';
import { examApplicationService } from '@/services/examApplicationService';
import { useAuthStore } from '@/store/authStore';
import type { ExamInfo } from '@/types';
import UserExamInfoPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/examInfoService', () => ({ examInfoService: {
  getMyExamInfo: jest.fn(), getExamTypes: jest.fn(), updateInterests: jest.fn(),
} }));
jest.mock('@/services/examApplicationService', () => ({ examApplicationService: { getMine: jest.fn() } }));

function response<T>(data: T) { return { data: { success: true, data } } as never; }
function exam(id: number, title: string, examType = '리눅스마스터'): ExamInfo {
  return { id, title, examType, isActive: true, displayOrder: id,
    createdAt: '2026-09-09T00:00:00', updatedAt: '2026-09-09T00:00:00' };
}
const exams = [
  exam(1, '회차 A 1차'), exam(2, '회차 A 2차'), exam(3, '회차 B'),
  exam(4, '회차 C'), exam(5, '회차 D'), exam(6, '회차 E'), exam(7, '회차 F'),
  exam(8, 'SQLD 회차', 'SQLD'),
];

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: { id: 1, name: '테스트', email: 'test@example.test', role: 'USER',
    interestedExamTypes: ['리눅스마스터', 'SQLD', '빈 유형'] } });
  jest.mocked(examInfoService.getMyExamInfo).mockResolvedValue(response(exams));
  jest.mocked(examApplicationService.getMine).mockResolvedValue(response([{
    id: 91, examName: '직접 등록 접수', createdAt: '2026-09-09T00:00:00', updatedAt: '2026-09-09T00:00:00',
  }]));
  jest.mocked(examInfoService.getExamTypes).mockResolvedValue(response([]));
  jest.mocked(examInfoService.updateInterests).mockResolvedValue(response(null));
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
});

describe('시험 정보 페이지네이션', () => {
  it('회차 묶음 다섯 개씩 이동하며 묶음과 별도 직접 등록 영역을 보존한다', async () => {
    render(<UserExamInfoPage />);
    await screen.findByRole('heading', { name: '회차 A' });
    expect(screen.getByText('1차')).toBeTruthy();
    expect(screen.getByText('2차')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '회차 E' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '회차 F' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(screen.getByRole('heading', { name: '회차 F' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'SQLD 회차' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '회차 A' })).toBeNull();
    expect(screen.getByText('직접 등록 접수')).toBeTruthy();
    expect((screen.getByRole('button', { name: '다음 페이지' }) as HTMLButtonElement).disabled).toBe(true);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
    expect(screen.getByRole('heading', { name: '회차 A' })).toBeTruthy();
  });

  it('시험 유형 변경 시 첫 페이지로 돌아가고 빈 유형에는 페이지 이동을 숨긴다', async () => {
    render(<UserExamInfoPage />);
    fireEvent.click(await screen.findByRole('button', { name: '다음 페이지' }));
    fireEvent.click(screen.getByRole('button', { name: '리눅스마스터' }));
    expect(screen.getByRole('heading', { name: '회차 A' })).toBeTruthy();
    expect((screen.getByRole('button', { name: '이전 페이지' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '빈 유형' }));
    expect(screen.getByText('표시할 시험 정보가 없습니다.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '다음 페이지' })).toBeNull();
  });

  it('관심 설정 저장 후 목록이 줄어들어도 첫 결과와 직접 등록 접수를 표시한다', async () => {
    render(<UserExamInfoPage />);
    fireEvent.click(await screen.findByRole('button', { name: '다음 페이지' }));
    jest.mocked(examInfoService.getMyExamInfo).mockResolvedValue(response([exam(20, '새 관심 회차', 'SQLD')]));
    fireEvent.click(screen.getByRole('button', { name: '관심 설정' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('heading', { name: '새 관심 회차' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '다음 페이지' })).toBeNull();
    expect(screen.getByText('직접 등록 접수')).toBeTruthy();
  });
});
