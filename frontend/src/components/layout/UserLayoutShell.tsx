'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useIsDarkMode } from '@/lib/useIsDarkMode';
import { authService } from '@/services/authService';
import { menuService } from '@/services/menuService';
import { PermissionDeniedModal } from '@/components/ui/PermissionDeniedModal';
import type { MenuConfig } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
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
  practice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 12c0 2.755-1.5 5.16-3.75 6.45L12 21l-5.25-2.55A6.99 6.99 0 013 12c0-.482.06-.952.16-1.422L12 14z" />
    </svg>
  ),
  records: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h6v6m-9 4h12a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L13 3h-2L9.5 5H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const leaf = (
  id: number, name: string, url: string, iconKey: string, order: number,
): MenuConfig => ({
  id, parentId: undefined, name, url, iconKey, displayOrder: order,
  menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '', children: [],
});

const group = (
  id: number, name: string, url: string, iconKey: string, order: number, children: MenuConfig[],
): MenuConfig => ({
  id, parentId: undefined, name, url, iconKey, displayOrder: order,
  menuType: 'USER', isActive: true, allowedRoles: 'USER', createdAt: '', updatedAt: '',
  children: children.map((c) => ({ ...c, parentId: id })),
});

const USER_FALLBACK_NAV: MenuConfig[] = [
  leaf(102, '시험', '/user/exams', 'exam', 1),
  group(110, '학습', '/user/group/learning', 'learn', 2, [
    leaf(104, '데일리 퀴즈', '/user/quiz',     'quiz',     1),
    leaf(107, '연습장',      '/user/practice', 'practice', 2),
    leaf(103, '개념노트',    '/user/concepts', 'concept',  3),
  ]),
  group(111, '내 기록', '/user/group/records', 'records', 3, [
    leaf(100, '통계 대시보드', '/user/dashboard',     'dashboard', 1),
    leaf(109, '시험 이력',     '/user/exam-history',  'history',   2),
    leaf(108, '복습 표시',     '/user/bookmarks',     'bookmark',  3),
  ]),
  group(112, '도움말', '/user/group/help', 'help', 4, [
    leaf(101, '시험 정보', '/user/exam-info',  'examinfo', 1),
    leaf(105, 'FAQ',       '/user/faq',        'faq',      2),
    leaf(106, '1:1 문의',  '/user/inquiries',  'inquiry',  3),
    leaf(113, '설정',      '/user/settings',   'settings', 4),
  ]),
];

/** 그룹 부모(합성 URL)는 실제 페이지가 없으므로 활성/제목 판정에서 제외한다. */
function isGroupUrl(url: string): boolean {
  return url.startsWith('/user/group/');
}

/** children → 자기 자신 순으로 현재 경로에 해당하는 메뉴명을 찾는다. */
function getUserPageTitle(pathname: string, navItems: MenuConfig[]): string {
  for (const item of navItems) {
    for (const child of item.children ?? []) {
      if (pathname.startsWith(child.url)) return child.name;
    }
    if (!isGroupUrl(item.url) && pathname.startsWith(item.url)) return item.name;
  }
  return '';
}

/** 그룹은 자식 중 하나가 현재 경로면 활성, 리프는 자신의 url 기준. */
function isItemActive(item: MenuConfig, pathname: string): boolean {
  if (item.children && item.children.length > 0) {
    return item.children.some((c) => pathname.startsWith(c.url));
  }
  return pathname.startsWith(item.url);
}

function ThemeToggle() {
  const { toggleTheme } = useThemeStore();
  const isDark = useIsDarkMode();

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
  const [mobileGroupId, setMobileGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (pathname === '/user/login') {
      document.title = '로그인 | TPMP';
      return;
    }
    const name = getUserPageTitle(pathname, navItems);
    document.title = name ? `${name} | TPMP` : 'TPMP - 시험 준비 마스터';
  }, [pathname, navItems]);

  // 경로 이동 시 모바일 그룹 패널 닫기
  useEffect(() => { setMobileGroupId(null); }, [pathname]);

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
          // API 결과만 사용 — FALLBACK 보충 없음 (권한 제한이 무력화되지 않도록)
          setNavItems(apiMenus);

          // 현재 페이지가 접근 가능한 메뉴에 포함되지 않으면 권한 없음 팝업 + 문의 페이지로 이동
          const accessibleUrls = apiMenus.flatMap((m) => [
            m.url,
            ...(m.children ?? []).map((c) => c.url),
          ]);
          // 메뉴와 무관하게 모든 로그인 사용자가 접근 가능한 계정/지원 페이지
          const ALWAYS_ALLOWED = ['/user/inquiries', '/user/settings'];
          const isAccessible = accessibleUrls.some((url) => pathname.startsWith(url))
            || ALWAYS_ALLOWED.some((p) => pathname.startsWith(p));
          if (!isAccessible) {
            window.dispatchEvent(new CustomEvent('permission-denied'));
            router.replace('/user/inquiries');
          }
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
      <PermissionDeniedModal />

      {/* ── Top Header ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full h-full flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/user/exams" className="text-lg font-bold text-indigo-600 tracking-tight shrink-0">
            TPMP
          </Link>

          {/* Desktop nav — 그룹화로 항목이 4개라 가로 스크롤 불필요. overflow를 두면 드롭다운이 잘리고
              overflow-y가 auto로 계산되어 아이템이 수직으로 밀리므로 overflow를 주지 않는다. */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = isItemActive(item, pathname);
              const icon = item.iconKey ? (ICON_MAP[item.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
              const hasChildren = (item.children?.length ?? 0) > 0;

              const pill = [
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
              ].join(' ');
              const iconColor = isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500';

              // 리프 메뉴 — 단순 링크
              if (!hasChildren) {
                return (
                  <Link key={item.id} href={item.url} className={pill}>
                    <span className={iconColor}>{icon}</span>
                    {item.name}
                  </Link>
                );
              }

              // 그룹 메뉴 — hover 드롭다운
              return (
                <div key={item.id} className="relative group/nav shrink-0">
                  <button type="button" className={pill} aria-haspopup="true">
                    <span className={iconColor}>{icon}</span>
                    {item.name}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 top-full pt-1.5 min-w-[10rem] z-50 invisible opacity-0 translate-y-1 group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 transition-all duration-150">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
                      {item.children.map((child) => {
                        const childActive = pathname.startsWith(child.url);
                        const childIcon = child.iconKey ? (ICON_MAP[child.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
                        return (
                          <Link
                            key={child.id}
                            href={child.url}
                            className={[
                              'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                              childActive
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                            ].join(' ')}
                          >
                            <span className={childActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}>
                              {childIcon}
                            </span>
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                    <Link
                      href="/user/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-gray-400 dark:text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      설정
                    </Link>
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

      {/* ── Mobile group panel (펼쳐진 그룹의 자식 목록) ── */}
      {mobileGroupId !== null && (() => {
        const openGroup = navItems.find((m) => m.id === mobileGroupId);
        if (!openGroup) return null;
        return (
          <>
            <div className="sm:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileGroupId(null)} />
            <div className="sm:hidden fixed bottom-16 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] py-2">
              <p className="px-4 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">{openGroup.name}</p>
              {openGroup.children.map((child) => {
                const childActive = pathname.startsWith(child.url);
                const childIcon = child.iconKey ? (ICON_MAP[child.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
                return (
                  <Link
                    key={child.id}
                    href={child.url}
                    onClick={() => setMobileGroupId(null)}
                    className={[
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                      childActive
                        ? 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/40'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    <span className={childActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}>
                      {childIcon}
                    </span>
                    {child.name}
                  </Link>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* ── Mobile bottom tab bar ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center">
        {navItems.map((item) => {
          const isActive = isItemActive(item, pathname);
          const icon = item.iconKey ? (ICON_MAP[item.iconKey] ?? DEFAULT_ICON) : DEFAULT_ICON;
          const hasChildren = (item.children?.length ?? 0) > 0;
          const tabClass = [
            'relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
          ].join(' ');

          if (!hasChildren) {
            return (
              <Link key={item.id} href={item.url} className={tabClass} onClick={() => setMobileGroupId(null)}>
                {icon}
                {item.name}
                {isActive && <span className="absolute top-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
              </Link>
            );
          }

          const isOpen = mobileGroupId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileGroupId(isOpen ? null : item.id)}
              className={tabClass}
            >
              {icon}
              {item.name}
              {(isActive || isOpen) && <span className="absolute top-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
