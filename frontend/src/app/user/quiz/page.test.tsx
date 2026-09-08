import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { quizService } from '@/services/quizService';
import { useAuthStore } from '@/store/authStore';
import QuizCategoryPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const push = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/services/quizService', () => ({ quizService: { getCategories: jest.fn() } }));

const categories = [{
  id: 1,
  code: 'QUESTION_TYPE',
  name: '문제 유형',
  slaves: [
    { id: 11, masterId: 1, name: '프로그래밍 언어', hasCodeQuestions: true },
    { id: 12, masterId: 1, name: 'SQL' },
    { id: 13, masterId: 1, name: '운영체제' },
    { id: 14, masterId: 1, name: '네트워크' },
    { id: 15, masterId: 1, name: '정보보안' },
    { id: 16, masterId: 1, name: '자료구조' },
    { id: 17, masterId: 1, name: '소프트웨어공학' },
    { id: 18, masterId: 1, name: '관계형 DB 이론' },
    { id: 19, masterId: 1, name: '웹 기술' },
  ],
}, {
  id: 2,
  code: 'EXAM_TYPE',
  name: '시험 유형',
  slaves: [
    { id: 21, masterId: 2, name: 'SQLD' },
    { id: 22, masterId: 2, name: '정보처리기사 실기' },
    { id: 23, masterId: 2, name: '정보처리기사 필기' },
    { id: 24, masterId: 2, name: '리눅스마스터 1급' },
  ],
}];

describe('QuizCategoryPage 카테고리 아이콘', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
    jest.mocked(quizService.getCategories).mockResolvedValue({
      data: { success: true, data: categories },
    } as never);
  });

  it('순서나 ID가 아닌 마스터 코드와 카테고리 이름으로 서로 다른 아이콘을 표시한다', async () => {
    render(<QuizCategoryPage />);

    expect(await screen.findByRole('img', { name: '프로그래밍 언어 코드 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'SQL 데이터베이스 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '운영체제 프로세서 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '네트워크 네트워크 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '정보보안 보안 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'SQLD 데이터베이스 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '정보처리기사 실기 실기 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '정보처리기사 필기 필기 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '리눅스마스터 1급 리눅스 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '소프트웨어공학 설계 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '관계형 DB 이론 데이터베이스 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '웹 기술 웹 아이콘' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '자료구조 기본 아이콘' })).toBeTruthy();
  });

  it('코드 문항 카테고리를 선택하면 기존 언어 선택 모달을 유지한다', async () => {
    render(<QuizCategoryPage />);

    fireEvent.click(await screen.findByRole('button', { name: /프로그래밍 언어/ }));

    expect(screen.getByRole('heading', { name: '언어 선택' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Java' })).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
