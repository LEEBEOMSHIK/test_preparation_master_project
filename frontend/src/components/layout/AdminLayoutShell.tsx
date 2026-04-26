'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { menuService } from '@/services/menuService';
import type { MenuConfig } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  exam: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  concept: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  inquiry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  faq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
    </svg>
  ),
  permission: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  examinfo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const FALLBACK_NAV: MenuConfig[] = [
  { id: 1,  parentId: undefined, name: '시험 관리',     url: '/admin/exams',        iconKey: 'exam',       displayOrder: 1,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [
    { id: 11, parentId: 1, name: '문항 관리',   url: '/admin/exams/questions', iconKey: undefined, displayOrder: 1, menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
    { id: 12, parentId: 1, name: '시험지 관리', url: '/admin/exams/papers',    iconKey: undefined, displayOrder: 2, menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  ]},
  { id: 2,  parentId: undefined, name: '개념노트 관리', url: '/admin/concepts',    iconKey: 'concept',    displayOrder: 2,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 3,  parentId: undefined, name: '1:1 문의 관리', url: '/admin/inquiries',   iconKey: 'inquiry',    displayOrder: 3,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 4,  parentId: undefined, name: 'FAQ 관리',      url: '/admin/faq',         iconKey: 'faq',        displayOrder: 4,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 5,  parentId: undefined, name: '명언 관리',     url: '/admin/quotes',      iconKey: 'quote',      displayOrder: 5,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 6,  parentId: undefined, name: '테이블 관리',   url: '/admin/tables',      iconKey: 'table',      displayOrder: 6,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [
    { id: 61, parentId: 6, name: 'DB 조회',     url: '/admin/tables/data',    iconKey: undefined, displayOrder: 1, menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
    { id: 62, parentId: 6, name: '도메인 관리', url: '/admin/tables/domains', iconKey: undefined, displayOrder: 2, menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  ]},
  { id: 7,  parentId: undefined, name: '권한 관리',     url: '/admin/permissions', iconKey: 'permission', displayOrder: 7,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 8,  parentId: undefined, name: '메뉴 관리',     url: '/admin/menus',       iconKey: 'menu',       displayOrder: 8,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 9,  parentId: undefined, name: '계정 관리',       url: '/admin/users',      iconKey: 'users',      displayOrder: 9,  menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
  { id: 10, parentId: undefined, name: '시험 정보 관리', url: '/admin/exam-info',  iconKey: 'examinfo',   displayOrder: 10, menuType: 'ADMIN', isActive: true, allowedRoles: 'ADMIN', createdAt: '', updatedAt: '', children: [] },
];

function getPageTitle(pathname: string, navItems: MenuConfig[]): string {
  for (const item of navItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.url)) return child.name;
      }
    }
    if (pathname.startsWith(item.url)) return item.name;
  }
  return '대시보드';
}

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [navItems, setNavItems] = useState<MenuConfig[]>(FALLBACK_NAV);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    menuService.adminGetAll('ADMIN')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setNavItems(res.data.data);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const initials = user?.name ? user.name.slice(0, 1).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">TPMP</span>
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-medium">관리자</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            메뉴
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isParentActive = pathname.startsWith(item.url);
              const hasChildren = item.children && item.children.length > 0;
              const icon = item.iconKey ? (ICON_MAP[item.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;

              return (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isParentActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                    ].join(' ')}
                  >
                    <span className={isParentActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}>
                      {icon}
                    </span>
                    {item.name}
                    {isParentActive && !hasChildren && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                    {hasChildren && (
                      <svg
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        className={['ml-auto w-3.5 h-3.5 transition-transform', isParentActive ? 'rotate-90 text-indigo-500 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'].join(' ')}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>

                  {hasChildren && isParentActive && (
                    <ul className="mt-0.5 ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
                      {item.children!.map((child) => {
                        const isChildActive = pathname.startsWith(child.url);
                        return (
                          <li key={child.id}>
                            <Link
                              href={child.url}
                              className={[
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                isChildActive
                                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200',
                              ].join(' ')}
                            >
                              <span className={['w-1.5 h-1.5 rounded-full shrink-0', isChildActive ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'].join(' ')} />
                              {child.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info + Logout */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name ?? '관리자'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 ml-56">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {getPageTitle(pathname, navItems)}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">TPMP 관리자 콘솔</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {user?.name ?? '관리자'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
