'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authService } from '@/services/authService';
import { menuService } from '@/services/menuService';
import type { MenuConfig } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  examinfo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
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
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  faq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  inquiry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const USER_FALLBACK_NAV: MenuConfig[] = [
  { id: 101, parentId: undefined, name: '시험 정보',   url: '/user/exam-info',  iconKey: 'examinfo', displayOrder: 1, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
  { id: 102, parentId: undefined, name: '시험',        url: '/user/exams',      iconKey: 'exam',     displayOrder: 2, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
  { id: 103, parentId: undefined, name: '개념노트',    url: '/user/concepts',   iconKey: 'concept',  displayOrder: 3, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
  { id: 104, parentId: undefined, name: '데일리 퀴즈', url: '/user/quiz',       iconKey: 'quiz',     displayOrder: 4, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
  { id: 105, parentId: undefined, name: 'FAQ',         url: '/user/faq',        iconKey: 'faq',      displayOrder: 5, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
  { id: 106, parentId: undefined, name: '1:1 문의',    url: '/user/inquiries',  iconKey: 'inquiry',  displayOrder: 6, menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [] },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function UserLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState<MenuConfig[]>(USER_FALLBACK_NAV);

  useEffect(() => {
    if (pathname === '/user/login') return;
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      router.replace('/user/login');
      return;
    }
    // 새로고침 후 user 상태 복원 (interestedExamSlaveIds 포함 최신 정보)
    authService.me()
      .then(res => { if (res.data.data) setAuth(res.data.data, token); })
      .catch(() => { clearAuth(); router.replace('/user/login'); });
    menuService.getMyMenus('USER')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const apiMenus = res.data.data;
          const coveredUrls = new Set<string>(apiMenus.map((m) => m.url));
          const missing = USER_FALLBACK_NAV.filter((m) => !coveredUrls.has(m.url));
          setNavItems(missing.length > 0 ? [...apiMenus, ...missing] : apiMenus);
        }
      })
      .catch(() => {});
  }, [router, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pathname === '/user/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/user/login');
  };

  const initials = user?.name ? user.name.slice(0, 1).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* ── Top Header ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/user/exams" className="text-lg font-bold text-indigo-600 tracking-tight shrink-0">
            TPMP
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.url);
              const icon = item.iconKey ? (ICON_MAP[item.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  className={[
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}>
                    {icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side: theme toggle + user dropdown */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name ?? '사용자'}
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 dark:text-gray-500">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 mt-14 mb-16 sm:mb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.url);
          const icon = item.iconKey ? (ICON_MAP[item.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
          return (
            <Link
              key={item.id}
              href={item.url}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {icon}
              {item.name}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
