import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { MenuConfig } from '@/types';

type MenusResponse = {
  data: { success: boolean; data: MenuConfig[]; timestamp: string };
};

type MeResponse = {
  data: {
    success: boolean;
    data: { id: number; email: string; name: string; role: string };
    timestamp: string;
  };
};

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGetMyMenus = jest.fn<() => Promise<MenusResponse>>();
const mockMe = jest.fn<() => Promise<MeResponse>>();
const mockSetAuth = jest.fn();
const mockClearAuth = jest.fn();
let mockCurrentPathname = '/admin/dashboard';

jest.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPathname,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock('@/services/menuService', () => ({
  menuService: { getMyMenus: mockGetMyMenus },
}));

jest.mock('@/services/authService', () => ({
  authService: {
    me: mockMe,
    logout: jest.fn(),
  },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'admin@tpmp.com', name: '관리자', role: 'ADMIN' },
    setAuth: mockSetAuth,
    clearAuth: mockClearAuth,
  }),
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  __esModule: true,
  default: () => <button type="button">테마</button>,
}));

jest.mock('@/components/ui/PermissionDeniedModal', () => ({
  PermissionDeniedModal: () => null,
}));

const AdminLayoutShell = require('./AdminLayoutShell').default as typeof import('./AdminLayoutShell').default;

function mockPathname(pathname: string): void {
  mockCurrentPathname = pathname;
}

function mockMenus(menus: MenuConfig[]): void {
  mockGetMyMenus.mockResolvedValue({
    data: {
      success: true,
      data: menus,
      timestamp: '2026-08-31T09:00:00',
    },
  });
}

describe('AdminLayoutShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem('accessToken', 'access-token');
    mockMe.mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, email: 'admin@tpmp.com', name: '관리자', role: 'ADMIN' },
        timestamp: '2026-08-31T09:00:00',
      },
    });
  });

  it('이메일 템플릿 경로에 글로벌 메뉴와 페이지 제목을 표시한다', async () => {
    mockPathname('/admin/email-templates');
    mockMenus([{
      id: 15,
      name: '이메일 템플릿 관리',
      url: '/admin/email-templates',
      iconKey: 'email',
      displayOrder: 15,
      menuType: 'ADMIN',
      isActive: true,
      allowedRoles: 'ADMIN',
      createdAt: '2026-08-31T09:00:00',
      updatedAt: '2026-08-31T09:00:00',
      children: [],
    }]);

    render(<AdminLayoutShell><div>본문</div></AdminLayoutShell>);

    expect(await screen.findByRole('link', { name: /이메일 템플릿 관리/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이메일 템플릿 관리' })).toBeInTheDocument();
  });

  it('메뉴 API가 비어 있어도 이메일 템플릿 편집 경로의 fallback 메뉴와 제목을 표시한다', async () => {
    mockPathname('/admin/email-templates/42/edit');
    mockMenus([]);

    render(<AdminLayoutShell><div>본문</div></AdminLayoutShell>);

    expect(await screen.findByRole('link', { name: /이메일 템플릿 관리/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이메일 템플릿 관리' })).toBeInTheDocument();
  });
});
