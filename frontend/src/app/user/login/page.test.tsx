import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from '@jest/globals';
import UserLoginPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const mockSearchParams = new URLSearchParams();
const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ setAuth: jest.fn(), clearAuth: jest.fn() }),
}));
jest.mock('@/services/authService', () => ({ authService: { login: jest.fn() } }));
jest.mock('@/components/ui/ThemeToggle', () => ({ __esModule: true, default: () => null }));

describe('사용자 로그인 개인정보 안내', () => {
  beforeEach(() => {
    mockSearchParams.delete('error');
  });

  it('로그인 전에 수집 항목과 공개 안내를 확인할 수 있다', () => {
    render(<UserLoginPage />);

    expect(screen.getByText(/이메일·이름·Google 계정 식별자/)).toBeTruthy();
    expect(screen.getByText(/Gmail 메일함을 읽거나 관리할 권한을 요청하지 않습니다/)).toBeTruthy();
    expect(screen.getByText('TPMP는 만 14세 이상만 이용할 수 있으며, 만 14세 미만은 이용할 수 없습니다.')).toBeTruthy();
    const destinations = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(destinations).toEqual(expect.arrayContaining(['/privacy', '/terms', '/privacy/requests']));
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('개인정보 안내가 추가되어도 OAuth 실패 안내를 유지한다', () => {
    mockSearchParams.set('error', 'oauth_failed');
    render(<UserLoginPage />);

    expect(screen.getByText('Google 로그인에 실패했습니다. 다시 시도해 주세요.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Google로 로그인' })).toBeTruthy();
  });
});
