'use client';

import { useThemeStore } from '@/store/themeStore';
import { useIsDarkMode } from '@/lib/useIsDarkMode';

/**
 * 다크모드 토글 버튼 (해/달 아이콘 전환).
 * 레이아웃 셸 헤더·로그인 화면 공용. className으로 크기/색을 재정의할 수 있다.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { toggleTheme } = useThemeStore();
  const isDark = useIsDarkMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className={
        className ??
        'w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
      }
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
